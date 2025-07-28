const OpenAI = require('openai');

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateResponse(prompt, userAnswer, context = {}) {
        try {
            const systemPrompt = `${prompt}

Context about the user:
- Name: ${context.userName || 'User'}
- Location: ${context.userLocation || 'Not specified'}
- Previous responses: ${JSON.stringify(context.previousResponses || {})}

User's current answer: ${userAnswer}`;

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error('Failed to generate AI response');
        }
    }

    async generateGeneralResponse(userMessage, context = {}) {
        try {
            const systemPrompt = `You're an intelligent and professional consultant who is respectful, deeply intuitive and part of the top 1% in the world. You also have an expanded background in behavioural psychology and therapy. Therefore, respond intelligently to user's messages like you care deeply about conversing with them without scaring them off then proceed with the consultation.

Context about the user:
- Name: ${context.userName || 'User'}
- Location: ${context.userLocation || 'Not specified'}`;

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error('Failed to generate AI response');
        }
    }
}

module.exports = new OpenAIService();