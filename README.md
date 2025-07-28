# Synergy AI - Career Consultation Chatbot

A GPT-powered self-consultation chatbot that helps individuals align their personal aspirations, strengths, and existing skills with national and international opportunities using the VALUE framework.

## Features

- **5-Stage VALUE Framework Consultation**
  - **V**ision Mapping: Identify life direction and aspirations
  - **A**uditing: Assess current skills and knowledge
  - **L**everage: Discover natural edges and advantages
  - **U**pskill Strategically: Get high-ROI skill recommendations
  - **E**xecute: Receive personalized 30-60-90 day roadmap

- **GPT-4 Integration**: Personalized responses based on user inputs
- **Session Management**: Progress tracking through consultation stages
- **Admin Panel**: Manage prompts and view usage analytics
- **Data Export**: Download user data in JSON/CSV formats
- **Mobile-Responsive**: Works on all devices

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- OpenAI API Key

## Setup Instructions

### 1. Database Setup

First, set up PostgreSQL and create the database:

```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Create database
createdb synergy_ai

# Run the schema
psql synergy_ai < database/schema.sql
```

### 2. Environment Configuration

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/synergy_ai
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create Admin User

Start the server and create the first admin user:

```bash
npm run dev
```

Visit `http://localhost:3000/admin.html` and use the setup endpoint to create your admin account.

### 5. Usage

- **Main Chatbot**: Visit `http://localhost:3000`
- **Admin Panel**: Visit `http://localhost:3000/admin.html`

## Project Structure

```
├── config/
│   └── database.js          # Database configuration
├── database/
│   └── schema.sql           # Database schema
├── models/
│   ├── User.js              # User data model
│   └── Session.js           # Session data model
├── routes/
│   ├── chatbot.js           # Chatbot API routes
│   └── admin.js             # Admin API routes
├── services/
│   └── openaiService.js     # OpenAI integration
├── public/
│   ├── index.html           # Main chatbot interface
│   ├── admin.html           # Admin panel
│   ├── style.css            # Styles
│   └── script.js            # Frontend logic
├── server.js                # Main server file
├── package.json
└── README.md
```

## API Endpoints

### Chatbot API (`/api/chat`)

- `POST /start` - Start conversation with name/location
- `POST /message` - Send general message
- `POST /start-value` - Begin VALUE framework
- `POST /session/start` - Start specific session
- `POST /session/answer` - Submit answer to question
- `GET /user/:userId/summary` - Get user session summary

### Admin API (`/api/admin`)

- `POST /login` - Admin login
- `POST /setup` - Create first admin user
- `GET /prompts` - Get all GPT prompts
- `PUT /prompts/:id` - Update GPT prompt
- `GET /stats` - Get usage statistics
- `GET /export/users` - Export user data
- `GET /users/:userId/sessions` - Get user session details

## VALUE Framework Sessions

### Session 1: Vision Mapping (V)
- Lifestyle aspirations
- Work fulfillment desires
- Service intentions
- Inspirational moments
- Additional reflections

### Session 2: Auditing (A)
- Educational background
- Technical skills
- Natural abilities
- Impact stories

### Session 3: Leverage (L)
- Optimal environment
- Personality traits
- Inspirational figures

### Session 4: Upskill Strategically (U)
- Growth areas
- Resource availability
- Time commitment

### Session 5: Execute (E)
- Current barriers
- Bold action ideas
- Implementation roadmap

## Admin Features

- **Prompt Management**: Edit GPT prompts for each session
- **Usage Analytics**: View user engagement statistics
- **Data Export**: Download user data for analysis
- **User Management**: View detailed user session data

## Deployment

### Production Environment

1. Set `NODE_ENV=production` in your environment
2. Use a production PostgreSQL database
3. Configure proper CORS origins
4. Use HTTPS in production
5. Set up proper logging and monitoring

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- JWT-based admin authentication
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Password hashing with bcrypt

## Customization

### Adding New Questions

1. Update `SESSION_QUESTIONS` object in `/routes/chatbot.js`
2. Add corresponding GPT prompts in the database
3. Update frontend question handling if needed

### Modifying GPT Prompts

Use the admin panel at `/admin.html` to edit prompts without code changes.

### Styling

Edit `/public/style.css` to customize the appearance.

## Troubleshooting

### Common Issues

1. **Database Connection Error**: Check DATABASE_URL in `.env`
2. **OpenAI API Error**: Verify OPENAI_API_KEY is valid
3. **Admin Login Failed**: Ensure admin user was created via setup
4. **Sessions Not Saving**: Check database permissions

### Logs

Check server logs for detailed error information:

```bash
npm run dev
```

## Support

For technical support or feature requests, contact the development team.

## License

MIT License - see LICENSE file for details.