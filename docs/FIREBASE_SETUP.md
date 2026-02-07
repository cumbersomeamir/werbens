# Firebase Phone OTP — 3 Steps

## Step 1: Create Firebase project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Add project** → name it `Werbens` → continue
3. (Optional) Disable Google Analytics → Create project

## Step 2: Enable Phone Auth
1. In the project: **Authentication** → **Get started**
2. **Sign-in method** tab → **Phone** → Enable → Save

## Step 3: Add Web App + Get Config
1. Project Overview (gear icon) → **Project settings**
2. Under **Your apps** → **Add app** → choose **Web** (</>)
3. App nickname: `Werbens Web` → Register
4. Copy the `firebaseConfig` object values

## Add to `.env.local`

In `frontend/.env.local`, add (replace with your values):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Note:** Phone numbers must include country code (e.g. `+1 2345678900`). On web, Firebase uses reCAPTCHA—no real SMS in dev; use your real number to receive OTP.
