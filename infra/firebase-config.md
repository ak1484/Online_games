# Firebase Configuration

Use Firebase for free backend services, including realtime database, Firestore, and authentication.

## Steps

1. Open https://console.firebase.google.com and sign in with your Google account.
2. Create a new Firebase project.
3. Add a Web app to the project.
4. Copy the Firebase config and place it in `dev/multiplayer-room/firebase-config.js`.
5. Enable Authentication if you want player login using Email, Google, or anonymous sign-in.
7. Enable Realtime Database for the current multiplayer prototype.

## Realtime Database rules example

Use this rule file for development if you want anonymous users to read/write rooms:

```json
{
  "rules": {
    "rooms": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

Save it as `infra/firebase-rtdb-rules.json` and apply it in the Firebase Console.

## Suggested services

- Firebase Authentication (Email, Google, or Anonymous)
- Firebase Realtime Database or Firestore for room state
- Firebase Hosting if you want a single deployment option for all front-end files

## Local file example

```js
// dev/multiplayer-room/firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

This file should be added to `.gitignore` and not committed.
