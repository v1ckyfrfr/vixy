# Vixy AI Assistant

**Vixy AI** is a modern, full-stack web application featuring a ChatGPT-inspired AI assistant interface coupled with secure Firebase Authentication and Google Gemini AI integration. Built with high performance, sleek aesthetics, and cross-platform compatibility in mind.

---

## Preview

<img src="screenshot/vixyAI.png" width="900">

---

## Key Features

- **Firebase Authentication**:
  - Secure Email & Password sign-up/login.
  - Seamless **Google OAuth Sign-In** using `signInWithRedirect` (fully compatible across Linux, Windows, and macOS).
  - Backend ID token verification using **Firebase Admin SDK v14**.
- **Advanced AI Chatbot**:
  - Powered by **Google Gemini AI** (`@google/genai` SDK) for fast, intelligent, and context-aware responses.
  - Multi-turn conversation history and system instructions.
- **AI Image Generation**:
  - Integrated with **Google Imagen 3** (`imagen-3.0-generate-002`) for high-quality, photorealistic AI image generation.
  - Custom aspect ratio selection (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`).
- **Premium Responsive UI**:
  - Modern ChatGPT-style interface built with Vanilla HTML5, CSS3, and JavaScript (ES Modules).
  - Password visibility toggle (Show/Hide) with interactive UI design.
  - Persistent Dark & Light mode theme switching via `localStorage`.
- **Security & Protection**:
  - HTTP security headers powered by **Helmet**.
  - Rate limiting via **express-rate-limit** to prevent brute-force and DDoS attacks.
  - Strict payload size limits and CORS policy enforcement.

---

## Technology Stack

| Category                  | Technology                                                                      |
| :------------------------ | :------------------------------------------------------------------------------ |
| **Backend Architecture**  | Node.js, Express 5                                                              |
| **Authentication**        | Firebase Auth Client SDK v11 & Firebase Admin SDK v14                           |
| **AI Models**             | Google Gemini (`gemini-3.6-flash`), Google Imagen 3 (`imagen-3.0-generate-002`) |
| **AI Library**            | `@google/genai`                                                                 |
| **Security & Middleware** | Helmet, Express Rate Limit, CORS, Dotenv                                        |
| **Frontend Stack**        | HTML5, Vanilla CSS3 (Custom Design System), ES Modules JS                       |

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/v1ckyfrfr/vixy.git
cd auth-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Firebase Service Account

Download your Firebase Service Account Key from:

> **Firebase Console** → **Project Settings** → **Service Accounts** → **Generate New Private Key**

Save the JSON file as `serviceAccountKey.json` in the project root directory, or set the `FIREBASE_SERVICE_ACCOUNT` environment variable with the JSON string.

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit your `.env` file:

```env
PORT=3000
ALLOWED_ORIGIN=http://localhost:3000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 5. Launch the Application

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

Open your browser and navigate to `http://localhost:3000`.

---

## Project Structure

```text
auth-app/
├── config/
│   └── firebase.js           # Firebase Admin SDK initialization
├── controllers/
│   ├── aiController.js       # Gemini Chat & Imagen 3 Image Generation endpoints
│   └── authController.js     # User authentication profile handler
├── middleware/
│   └── authMiddleware.js     # Firebase ID token validation middleware
├── public/
│   ├── js/
│   │   ├── auth.js           # Frontend Firebase auth logic (Email & Google Sign-In)
│   │   ├── chat.js           # AI Chat interface controller
│   │   ├── dashboard.js      # User dashboard controller
│   │   ├── settings.js       # User settings controller
│   │   └── theme.js          # Theme toggle handler
│   ├── styles/               # App CSS design system
│   ├── index.html            # Sign-In / Register page
│   ├── dashboard.html        # Main dashboard
│   ├── chat.html             # AI Chat room
│   └── settings.html         # User settings page
├── routes/
│   ├── aiRoutes.js           # AI endpoint routes (/api/ai/*)
│   └── authRoutes.js         # Auth endpoint routes (/api/auth/*)
├── serviceAccountKey.json    # Firebase Admin key (DO NOT COMMIT)
├── server.js                 # Express application entry point
├── .env                      # Environment variables (DO NOT COMMIT)
└── package.json              # Project dependencies & scripts
```

---

## Security Best Practices

- **Secrets Isolation**: Never commit `.env` or `serviceAccountKey.json` to version control. Both are protected in `.gitignore`.
- **Token Handling**: Firebase ID Tokens are checked server-side using Firebase Admin SDK to ensure authorized API access.

---

## Author

**(v1ckyfrfr)**
