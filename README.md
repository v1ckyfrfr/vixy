# Vixy AI Assistant

Vixy is an intelligent web-based AI Assistant featuring a modern, ChatGPT-inspired user interface, coupled with a robust and secure User Authentication system. This application is built on a solid technology stack utilizing Node.js, Express, SQLite, and Google Gemini AI.

## Key Features

- **Modern Authentication System**: Highly secure user registration and login utilizing JSON Web Tokens (JWT) and robust bcrypt password hashing.
- **Integrated AI Chatbot**: Powered by the Google Gemini API to deliver intelligent, fast, and context-aware responses.
- **Premium User Interface**: A clean, responsive design tailored to mimic the ChatGPT experience, built entirely with Vanilla HTML, CSS, and JavaScript.
- **Theme Preferences**: Built-in support for Dark and Light modes, persistently saved in the user's browser via localStorage.
- **Robust Security Measures**: 
  - Brute-force attack mitigation using express-rate-limit.
  - Comprehensive HTTP header security enforced by Helmet.
  - Protection against payload exploitation via strict input size limits (16kb).

## Technology Stack

- **Backend Architecture**: Node.js, Express.js
- **Database Engine**: SQLite3 (Local file-based)
- **Artificial Intelligence**: Google Gemini 2.5 Flash (@google/genai)
- **Security Protocols**: Helmet, bcrypt, jsonwebtoken, express-rate-limit
- **Frontend Technologies**: HTML5, Vanilla CSS, JavaScript, Lucide Icons

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd auth-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy or rename the `.env.example` file to `.env`.
   - Open the `.env` file and populate the required credentials, specifically your `GEMINI_API_KEY` from Google AI Studio and a strong `JWT_SECRET`.
   ```env
   PORT=3000
   ALLOWED_ORIGIN=http://localhost:3000
   JWT_SECRET=your_highly_secure_jwt_secret_here
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Launch the Application**
   ```bash
   node server.js
   ```
   > The application will automatically initialize and run on `http://localhost:3000`

## Project Structure

```text
auth-app/
 |-- controllers/     # Route logic (Authentication and AI handling)
 |-- middleware/      # API security layers (Rate Limiting and JWT Verification)
 |-- models/          # Database configuration and schema (SQLite)
 |-- public/          # Static frontend assets (HTML, CSS, JS)
 |-- routes/          # API endpoint definitions
 |-- utils/           # Helper functions (Input validation, Hashing)
 |-- server.js        # Node.js backend entry point
 |-- users.db         # Auto-generated SQLite Database
 |-- .env.example     # Environment variables template
 |-- package.json     # Project metadata and dependencies
```

## Security Notice
To maintain the highest security standards, the `.env` file (containing API keys and secrets) and the `users.db` file (containing local user data) are excluded from version control via `.gitignore`. Never commit these files to a public repository.

---
*Engineered to provide a seamless AI chat experience with uncompromised data security.*
