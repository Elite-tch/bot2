const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    static async create(name, location) {
        const id = uuidv4();
        const query = `
            INSERT INTO users (id, name, location)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [id, name, location]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async update(id, updates) {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        
        const query = `
            UPDATE users 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await db.query(query, [id, ...values]);
        return result.rows[0];
    }

    static async getAllSessions(userId) {
        const query = `
            SELECT s.*, 
                   COUNT(ur.id) as response_count,
                   MAX(ur.created_at) as last_response_at
            FROM sessions s
            LEFT JOIN user_responses ur ON s.id = ur.session_id
            WHERE s.user_id = $1
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }
}

module.exports = User;