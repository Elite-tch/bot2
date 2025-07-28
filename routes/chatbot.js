const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const openaiService = require('../services/openaiService');
const db = require('../config/database');

// Session questions configuration
const SESSION_QUESTIONS = {
    vision: [
        "What kind of lifestyle do you dream of in 5–10 years? (Describe the lifestyle you see yourself living)",
        "What kind of work would make you feel deeply fulfilled?",
        "Who do you want to help or serve with your life?",
        "Share a moment you felt most alive, inspired...or maybe you just felt like your true self.",
        "Is there something that probably came to your mind as we progressed through this session that you would love to share?"
    ],
    auditing: [
        "What are you currently studying or have studied in school?",
        "What technical (hard) skills have you gained?",
        "What things do you naturally do well?",
        "Share a story or moment where you felt useful or impactful."
    ],
    leverage: [
        "What kind of environment do you thrive in? (e.g., quiet, fast-paced)\nWhat personality traits describe you best?\nWho inspires you and why?"
    ],
    upskill: [
        "What areas would you love to grow in?\nDo you have access to a laptop or smartphone with the internet?\nHow many hours a week can you invest in learning something new?"
    ],
    execute: [
        "What's stopping you right now from acting on your goals?\nWhat's one thing you'd do if fear didn't exist?"
    ]
};

// Start conversation - collect user info
router.post('/start', async (req, res) => {
    try {
        const { name, location } = req.body;
        
        if (!name || !location) {
            return res.status(400).json({ error: 'Name and location are required' });
        }

        const user = await User.create(name.trim(), location.trim());
        
        // Generate welcoming response
        const welcomeMessage = await openaiService.generateGeneralResponse(
            `My name is ${name} and I am chatting from ${location}. How are you?`,
            { userName: name, userLocation: location }
        );

        res.json({
            userId: user.id,
            message: welcomeMessage,
            nextStep: 'introduction'
        });
    } catch (error) {
        console.error('Start conversation error:', error);
        res.status(500).json({ error: 'Failed to start conversation' });
    }
});

// Handle general conversation (non-session specific)
router.post('/message', async (req, res) => {
    try {
        const { userId, message } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({ error: 'User ID and message are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const response = await openaiService.generateGeneralResponse(message, {
            userName: user.name,
            userLocation: user.location
        });

        res.json({
            message: response,
            showValueIntroduction: message.toLowerCase().includes('okay') || 
                                   message.toLowerCase().includes('yes') ||
                                   message.toLowerCase().includes('ready')
        });
    } catch (error) {
        console.error('Message handling error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Start VALUE framework
router.post('/start-value', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const introduction = `Now, I'll go through five deep, coaching-style sessions using the VALUE framework:

V – Vision Mapping
A – Auditing (your skills and knowledge)
L – Leverage (your natural edge)
U – Upskill strategically
E – Execute (your personalized roadmap)

By the end, you'll receive career direction suggestions, upskilling ideas, and execution tips designed specifically for you. Let's begin with Session 1: Vision Mapping. Are you ready?`;

        res.json({
            message: introduction,
            showStartButton: true
        });
    } catch (error) {
        console.error('Start VALUE error:', error);
        res.status(500).json({ error: 'Failed to start VALUE framework' });
    }
});

// Start a specific session
router.post('/session/start', async (req, res) => {
    try {
        const { userId, sessionType } = req.body;
        
        if (!['vision', 'auditing', 'leverage', 'upskill', 'execute'].includes(sessionType)) {
            return res.status(400).json({ error: 'Invalid session type' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create or get existing session
        let session = await Session.findByUserAndType(userId, sessionType);
        if (!session || session.is_completed) {
            session = await Session.create(userId, sessionType);
        }

        const sessionTitles = {
            vision: 'SESSION 1: VISION MAPPING',
            auditing: 'SESSION 2: AUDITING (Skills)',
            leverage: 'SESSION 3: LEVERAGE',
            upskill: 'SESSION 4: UPSKILL STRATEGICALLY',
            execute: 'SESSION 5: EXECUTE'
        };

        const intro = sessionType === 'vision' ? 
            "Let's start with your vision. Answer the subsequent questions I'm going to ask you. Do not bother about giving the perfect response. Just be as honest as you can possibly be." :
            sessionType === 'auditing' ? 
            "Now let's audit your current knowledge and skills. Are you ready?" :
            sessionType === 'leverage' ?
            "Now, we've moved to the third session. This is to identify what gives you a natural edge. Please answer the 3 questions below at once:" :
            sessionType === 'upskill' ?
            "Let's help you upskill smartly, with high ROI. Answer:" :
            "Finally, let's build your roadmap. Answer:";

        const currentQuestion = SESSION_QUESTIONS[sessionType][session.current_question - 1];

        res.json({
            sessionId: session.id,
            sessionTitle: sessionTitles[sessionType],
            message: intro,
            question: currentQuestion,
            questionNumber: session.current_question,
            totalQuestions: SESSION_QUESTIONS[sessionType].length
        });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// Submit answer to session question
router.post('/session/answer', async (req, res) => {
    try {
        const { sessionId, answer } = req.body;
        
        if (!sessionId || !answer) {
            return res.status(400).json({ error: 'Session ID and answer are required' });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const user = await User.findById(session.user_id);
        const currentQuestion = SESSION_QUESTIONS[session.session_type][session.current_question - 1];
        
        // Get previous responses for context
        const previousResponses = await Session.getResponses(sessionId);
        const allUserResponses = await Session.getUserAllResponses(session.user_id);
        
        // Get GPT prompt for this question
        const promptQuery = `
            SELECT prompt_template FROM gpt_prompts 
            WHERE session_type = $1 AND question_number = $2 AND is_active = true
        `;
        const promptResult = await db.query(promptQuery, [session.session_type, session.current_question]);
        
        if (promptResult.rows.length === 0) {
            return res.status(500).json({ error: 'GPT prompt not found' });
        }

        const prompt = promptResult.rows[0].prompt_template;
        
        // Generate GPT response
        const gptResponse = await openaiService.generateResponse(prompt, answer, {
            userName: user.name,
            userLocation: user.location,
            previousResponses: allUserResponses
        });

        // Save response
        await Session.addResponse(sessionId, session.current_question, currentQuestion, answer, gptResponse);

        // Check if this is the last question
        const isLastQuestion = session.current_question >= SESSION_QUESTIONS[session.session_type].length;
        
        if (isLastQuestion) {
            await Session.markCompleted(sessionId);
            
            // Determine next session
            const sessionOrder = ['vision', 'auditing', 'leverage', 'upskill', 'execute'];
            const currentIndex = sessionOrder.indexOf(session.session_type);
            const nextSessionType = currentIndex < sessionOrder.length - 1 ? sessionOrder[currentIndex + 1] : null;
            
            if (session.session_type === 'execute') {
                // Final completion message
                res.json({
                    gptResponse,
                    isCompleted: true,
                    finalMessage: "You've completed the full Synergy AI self-consultation process. Take action on what you've learned. If you'd like a human mentor or career accountability, contact ACTIVATIONS for personalized support through Activationsthinktank@gmail.com. You are gifted. You are needed. The world is waiting.",
                    showRestartButton: true
                });
            } else {
                res.json({
                    gptResponse,
                    sessionCompleted: true,
                    nextSessionType,
                    message: nextSessionType ? `Great! Now let's move to the next session.` : null
                });
            }
        } else {
            // Move to next question
            await Session.updateProgress(sessionId, session.current_question + 1);
            const nextQuestion = SESSION_QUESTIONS[session.session_type][session.current_question];
            
            res.json({
                gptResponse,
                nextQuestion,
                questionNumber: session.current_question + 1,
                totalQuestions: SESSION_QUESTIONS[session.session_type].length
            });
        }
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Failed to process answer' });
    }
});

// Get user session summary
router.get('/user/:userId/summary', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sessions = await User.getAllSessions(userId);
        const allResponses = await Session.getUserAllResponses(userId);
        
        res.json({
            user,
            sessions,
            responses: allResponses
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ error: 'Failed to get user summary' });
    }
});

module.exports = router;