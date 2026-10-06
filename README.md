# PrepTrack

PrepTrack is a full-stack placement and competitive-programming preparation tracker with a React frontend, Firebase-backed user data, and an Express backend for integrations, reminders, and AI-powered insights.

## Features

- User authentication and Firebase-backed persistence
- Preparation dashboard and activity tracking
- Competitive-programming / study progress workflows
- Codeforces contest and user-data integration
- AI-generated progress summaries
- Email notification preferences and welcome messages
- Daily streak-reminder cron job
- Responsive desktop and mobile interface

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Firebase Web SDK

### Backend

- Node.js + Express
- Firebase Admin / Firestore
- Groq API for AI summaries
- Nodemailer for email notifications
- node-cron for scheduled streak checks
- Codeforces public API integration

## Repository Structure

```text
react-frontend/   React + Vite client
backend/          Express API, Firebase Admin integration, email and scheduled jobs
```

## Local Setup

### 1. Frontend

```bash
cd react-frontend
npm install
npm run dev
```

### 2. Backend

```bash
cd backend
npm install
npm start
```

The backend uses port `5000` by default unless `PORT` is set.

## Configuration

Create the required environment configuration for the backend services used in your deployment. The server references credentials/settings for Firebase Admin, Groq, and email delivery. Keep API keys, service-account credentials, and email passwords out of source control.

The frontend also needs the Firebase client configuration expected by the app.

## Backend Endpoints

Current backend functionality includes:

- Health check
- Protected notification preference/email endpoints
- Codeforces contest proxy
- Codeforces user lookup
- Protected AI progress-summary generation

## Notes

PrepTrack is designed as a personal preparation dashboard. External integrations such as Codeforces, email delivery, Firebase, and AI summaries require valid network access and credentials.
