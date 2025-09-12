# Recipe Revamp

**A secure, AI-powered recipe converter with enterprise-grade security**

Recipe Revamp transforms your favorite recipes to match dietary preferences using OpenAI's GPT-4o-mini API through secure Firebase Cloud Functions. Your API key is never exposed to clients.

## Features

- 🔒 **Security-First**: AI calls made through secure Firebase Functions
- 🍽️ **Smart Recipe Conversion**: Adapts recipes to dietary needs (Vegan, Gluten-Free, Keto, etc.)
- 🔐 **Secure Authentication**: Firebase Auth with Google sign-in and email/password
- 💾 **Cloud Storage**: Save favorite recipes to Firestore with proper security rules
- ⚡ **Fast & Responsive**: Built with React 19, TypeScript, and Tailwind CSS
- 🛡️ **Enterprise Security**: CSP headers, input validation, Firebase App Check, secure AI calls

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Firebase Cloud Functions (Node.js 18)
- **AI**: OpenAI GPT-4o-mini via secure Firebase Functions
- **Auth & Storage**: Firebase (Authentication, Firestore, Cloud Functions)
- **Validation**: Zod (both client and server-side)
- **Deployment**: Netlify (frontend) + Firebase (backend functions)

## Setup

### Prerequisites

- Node.js 18+
- Firebase project with Authentication and Firestore enabled
- Netlify account for deployment

### Installation

1. Clone the repository
2. Install main app dependencies:
   ```bash
   npm install
   ```

3. Install Firebase Functions dependencies:
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. Configure Firebase:
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration values
   - Enable Google and Email/Password authentication in Firebase Console
   - Set up Firestore security rules (see below)
   - Configure OpenAI API key for Firebase Functions:
     ```bash
     firebase functions:config:set openai.api_key="your-openai-api-key"
     ```

5. Run development with Firebase emulators:
   ```bash
   # Terminal 1: Start Firebase emulators
   firebase emulators:start
   
   # Terminal 2: Start frontend dev server
   npm run dev
   ```

## Deployment

### Firebase Functions Deployment

1. Deploy Firebase Functions first:
   ```bash
   # Make sure OpenAI API key is configured
   firebase functions:config:set openai.api_key="your-openai-api-key"
   
   # Deploy functions
   firebase deploy --only functions
   ```

### Frontend Deployment to Netlify

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy via Netlify CLI:
   ```bash
   netlify deploy --prod --dir=dist
   ```

**OR** via GitHub Integration:
1. Push code to GitHub
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard
6. Deploy!

### Complete Deployment Checklist

- ✅ Firebase Functions deployed with OpenAI API key configured
- ✅ Firestore security rules deployed
- ✅ Firebase Authentication configured
- ✅ Frontend deployed to Netlify with correct environment variables
- ✅ CSP headers configured in netlify.toml

## Security Features

- **Content Security Policy (CSP)**: Strict CSP headers prevent XSS attacks
- **Firebase App Check**: Protects backend resources from abuse
- **Input Validation**: All user inputs validated with Zod schemas
- **Password Policy**: Strong password requirements (8+ chars, uppercase, lowercase, number, special)
- **Email Verification**: Required for email/password sign-ups
- **Secure Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **HTTPS Only**: Enforced via Netlify configuration

## Firebase Security Rules

Ensure your Firestore has these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /recipes/{recipeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Environment Variables

### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_ALLOWED_FILTERS=Vegan,Gluten-Free,Low-Carb,Keto,Paleo,Dairy-Free,Nut-Free,Sugar-Free
```

### Backend (Firebase Functions)
```bash
# Set via Firebase CLI (secure, not in code)
firebase functions:config:set openai.api_key="your-openai-api-key"

# For local development only (functions/.env)
OPENAI_API_KEY=your-openai-api-key
```

**🔒 Security Note**: The OpenAI API key is now stored securely in Firebase Functions configuration and never exposed to client-side code.

## License

MIT
