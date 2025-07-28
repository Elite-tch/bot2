const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await db.query('SELECT * FROM admin_users WHERE id = $1', [decoded.id]);
        
        if (admin.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.admin = admin.rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const admin = await db.query('SELECT * FROM admin_users WHERE email = $1', [email]);
        
        if (admin.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.rows[0].password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            token,
            admin: {
                id: admin.rows[0].id,
                email: admin.rows[0].email
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Create admin user (for initial setup)
router.post('/setup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if any admin exists
        const existingAdmins = await db.query('SELECT COUNT(*) FROM admin_users');
        if (parseInt(existingAdmins.rows[0].count) > 0) {
            return res.status(403).json({ error: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await db.query(
            'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );

        res.json({ message: 'Admin created successfully', admin: admin.rows[0] });
    } catch (error) {
        console.error('Admin setup error:', error);
        res.status(500).json({ error: 'Setup failed' });
    }
});

// Get all GPT prompts
router.get('/prompts', verifyAdmin, async (req, res) => {
    try {
        const prompts = await db.query(`
            SELECT * FROM gpt_prompts 
            ORDER BY session_type, question_number
        `);
        
        res.json(prompts.rows);
    } catch (error) {
        console.error('Get prompts error:', error);
        res.status(500).json({ error: 'Failed to fetch prompts' });
    }
});

// Update GPT prompt
router.put('/prompts/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { prompt_template, is_active } = req.body;
        
        const updatedPrompt = await db.query(
            `UPDATE gpt_prompts 
             SET prompt_template = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 
             RETURNING *`,
            [prompt_template, is_active, id]
        );

        if (updatedPrompt.rows.length === 0) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        res.json(updatedPrompt.rows[0]);
    } catch (error) {
        console.error('Update prompt error:', error);
        res.status(500).json({ error: 'Failed to update prompt' });
    }
});

// Get usage statistics
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT s.id) as total_sessions,
                COUNT(ur.id) as total_responses,
                COUNT(DISTINCT CASE WHEN s.is_completed THEN s.id END) as completed_sessions
            FROM users u
            LEFT JOIN sessions s ON u.id = s.user_id
            LEFT JOIN user_responses ur ON s.id = ur.session_id
        `);

        const sessionStats = await db.query(`
            SELECT 
                session_type,
                COUNT(*) as count,
                COUNT(CASE WHEN is_completed THEN 1 END) as completed
            FROM sessions
            GROUP BY session_type
        `);

        const recentUsers = await db.query(`
            SELECT name, location, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        `);

        res.json({
            overview: stats.rows[0],
            sessionBreakdown: sessionStats.rows,
            recentUsers: recentUsers.rows
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Export user data
router.get('/export/users', verifyAdmin, async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        
        const users = await db.query(`
            SELECT 
                u.id,
                u.name,
                u.location,
                u.created_at,
                COUNT(DISTINCT s.id) as session_count,
                COUNT(DISTINCT CASE WHEN s.is_completed THEN s.id END) as completed_sessions,
                COUNT(ur.id) as total_responses
            FROM users u
            LEFT JOIN sessions s ON u.id = s.user_id
            LEFT JOIN user_responses ur ON s.id = ur.session_id
            GROUP BY u.id, u.name, u.location, u.created_at
            ORDER BY u.created_at DESC
        `);

        if (format === 'csv') {
            const csv = [
                'ID,Name,Location,Created At,Session Count,Completed Sessions,Total Responses',
                ...users.rows.map(user => 
                    `${user.id},${user.name},${user.location},${user.created_at},${user.session_count},${user.completed_sessions},${user.total_responses}`
                )
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
            return res.send(csv);
        }

        res.json(users.rows);
    } catch (error) {
        console.error('Export users error:', error);
        res.status(500).json({ error: 'Failed to export user data' });
    }
});

// Get detailed user session data
router.get('/users/:userId/sessions', verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sessions = await db.query(`
            SELECT s.*, 
                   json_agg(
                       json_build_object(
                           'question_number', ur.question_number,
                           'question_text', ur.question_text,
                           'user_answer', ur.user_answer,
                           'gpt_response', ur.gpt_response,
                           'created_at', ur.created_at
                       ) ORDER BY ur.question_number
                   ) as responses
            FROM sessions s
            LEFT JOIN user_responses ur ON s.id = ur.session_id
            WHERE s.user_id = $1
            GROUP BY s.id
            ORDER BY s.created_at
        `, [userId]);

        res.json({
            user: user.rows[0],
            sessions: sessions.rows
        });
    } catch (error) {
        console.error('Get user sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch user sessions' });
    }
});

module.exports = router;