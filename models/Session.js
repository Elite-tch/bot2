const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Session {
    static async create(userId, sessionType) {
        const id = uuidv4();
        const query = `
            INSERT INTO sessions (id, user_id, session_type)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [id, userId, sessionType]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM sessions WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByUserAndType(userId, sessionType) {
        const query = `
            SELECT * FROM sessions 
            WHERE user_id = $1 AND session_type = $2 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const result = await db.query(query, [userId, sessionType]);
        return result.rows[0];
    }

    static async updateProgress(id, currentQuestion) {
        const query = `
            UPDATE sessions 
            SET current_question = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [id, currentQuestion]);
        return result.rows[0];
    }

    static async markCompleted(id) {
        const query = `
            UPDATE sessions 
            SET is_completed = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async getResponses(sessionId) {
        const query = `
            SELECT * FROM user_responses 
            WHERE session_id = $1 
            ORDER BY question_number ASC
        `;
        const result = await db.query(query, [sessionId]);
        return result.rows;
    }

    static async addResponse(sessionId, questionNumber, questionText, userAnswer, gptResponse) {
        const id = uuidv4();
        const query = `
            INSERT INTO user_responses (id, session_id, question_number, question_text, user_answer, gpt_response)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await db.query(query, [id, sessionId, questionNumber, questionText, userAnswer, gptResponse]);
        return result.rows[0];
    }

    static async getUserAllResponses(userId) {
        const query = `
            SELECT ur.*, s.session_type 
            FROM user_responses ur
            JOIN sessions s ON ur.session_id = s.id
            WHERE s.user_id = $1
            ORDER BY s.created_at ASC, ur.question_number ASC
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }
}

module.exports = Session;