class SynergyAI {
    constructor() {
        this.userId = null;
        this.currentSessionId = null;
        this.currentSessionType = null;
        this.apiBase = '/api/chat';
        this.init();
    }

    init() {
        // Add enter key listeners
        document.getElementById('nameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startConversation();
        });
        
        document.getElementById('locationInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startConversation();
        });
        
        document.getElementById('messageField').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        document.getElementById('answerField').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitAnswer();
            }
        });
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    addMessage(content, isUser = false, isTitle = false) {
        const messagesContainer = document.getElementById('chatMessages');
        
        if (isTitle) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'session-title';
            titleDiv.textContent = content;
            messagesContainer.appendChild(titleDiv);
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.innerHTML = this.formatMessage(content);
            
            contentDiv.appendChild(textDiv);
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
        }
        
        this.scrollToBottom();
    }

    addQuestion(questionText, questionNumber, totalQuestions) {
        const messagesContainer = document.getElementById('chatMessages');
        
        // Add progress indicator
        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress-indicator';
        progressDiv.textContent = `Question ${questionNumber} of ${totalQuestions}`;
        messagesContainer.appendChild(progressDiv);
        
        // Add question
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-header';
        questionDiv.textContent = questionText;
        messagesContainer.appendChild(questionDiv);
        
        this.scrollToBottom();
    }

    formatMessage(text) {
        return text.replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    switchInputMode(mode) {
        const inputs = ['nameLocationInput', 'messageInput', 'answerInput'];
        inputs.forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        
        if (mode && inputs.includes(mode)) {
            document.getElementById(mode).style.display = 'flex';
        }
        
        document.getElementById('actionButtons').style.display = 'none';
    }

    showActionButtons(buttons) {
        const container = document.getElementById('actionButtons');
        container.innerHTML = '';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = button.class || 'primary-btn';
            btn.textContent = button.text;
            btn.onclick = button.action;
            container.appendChild(btn);
        });
        
        container.style.display = 'block';
    }

    async makeRequest(endpoint, data) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    async startConversation() {
        const name = document.getElementById('nameInput').value.trim();
        const location = document.getElementById('locationInput').value.trim();
        
        if (!name || !location) {
            alert('Please enter both your name and location');
            return;
        }

        this.showLoading();
        
        try {
            const response = await this.makeRequest('/start', { name, location });
            
            this.userId = response.userId;
            this.addMessage(`My name is ${name} and I am chatting from ${location}. How are you?`, true);
            this.addMessage(response.message);
            
            this.switchInputMode('messageInput');
        } catch (error) {
            alert('Failed to start conversation. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async sendMessage() {
        const messageField = document.getElementById('messageField');
        const message = messageField.value.trim();
        
        if (!message) return;

        this.addMessage(message, true);
        messageField.value = '';
        this.showLoading();
        
        try {
            const response = await this.makeRequest('/message', {
                userId: this.userId,
                message: message
            });
            
            this.addMessage(response.message);
            
            if (response.showValueIntroduction) {
                this.switchInputMode();
                setTimeout(() => this.showVALUEIntroduction(), 1000);
            }
        } catch (error) {
            alert('Failed to send message. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async showVALUEIntroduction() {
        this.showLoading();
        
        try {
            const response = await this.makeRequest('/start-value', {
                userId: this.userId
            });
            
            this.addMessage(response.message);
            
            if (response.showStartButton) {
                this.showActionButtons([
                    {
                        text: 'Yes, let\'s begin',
                        action: () => this.startSession('vision')
                    }
                ]);
            }
        } catch (error) {
            alert('Failed to show VALUE introduction. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async startSession(sessionType) {
        this.currentSessionType = sessionType;
        this.showLoading();
        
        try {
            const response = await this.makeRequest('/session/start', {
                userId: this.userId,
                sessionType: sessionType
            });
            
            this.currentSessionId = response.sessionId;
            
            if (response.sessionTitle) {
                this.addMessage(response.sessionTitle, false, true);
            }
            
            if (response.message) {
                this.addMessage(response.message);
            }
            
            if (response.question) {
                this.addQuestion(
                    response.question,
                    response.questionNumber,
                    response.totalQuestions
                );
                this.switchInputMode('answerInput');
            }
        } catch (error) {
            alert('Failed to start session. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async submitAnswer() {
        const answerField = document.getElementById('answerField');
        const answer = answerField.value.trim();
        
        if (!answer) {
            alert('Please provide an answer');
            return;
        }

        this.addMessage(answer, true);
        answerField.value = '';
        this.showLoading();
        
        try {
            const response = await this.makeRequest('/session/answer', {
                sessionId: this.currentSessionId,
                answer: answer
            });
            
            if (response.gptResponse) {
                this.addMessage(response.gptResponse);
            }
            
            if (response.nextQuestion) {
                this.addQuestion(
                    response.nextQuestion,
                    response.questionNumber,
                    response.totalQuestions
                );
            } else if (response.sessionCompleted && response.nextSessionType) {
                this.switchInputMode();
                if (response.message) {
                    this.addMessage(response.message);
                }
                
                setTimeout(() => {
                    this.startSession(response.nextSessionType);
                }, 2000);
            } else if (response.isCompleted) {
                this.switchInputMode();
                
                if (response.finalMessage) {
                    const completionDiv = document.createElement('div');
                    completionDiv.className = 'completion-message';
                    completionDiv.textContent = response.finalMessage;
                    document.getElementById('chatMessages').appendChild(completionDiv);
                }
                
                if (response.showRestartButton) {
                    this.showActionButtons([
                        {
                            text: 'Restart',
                            class: 'secondary-btn',
                            action: () => location.reload()
                        }
                    ]);
                }
                
                this.scrollToBottom();
            }
        } catch (error) {
            alert('Failed to submit answer. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize the application
const synergyAI = new SynergyAI();

// Global functions for HTML onclick handlers
function startConversation() {
    synergyAI.startConversation();
}

function sendMessage() {
    synergyAI.sendMessage();
}

function submitAnswer() {
    synergyAI.submitAnswer();
}

function startVALUE() {
    synergyAI.startSession('vision');
}