# 🚀 Connect Your Google Account - Super Simple Guide

Think of this like connecting your toy to your phone - we need to tell Google it's okay for your app to talk to Google Sheets!

## Step 1: Go to Google's Special Place 🏠
1. Open your web browser (like Chrome or Safari)
2. Go to this website: https://console.cloud.google.com/
3. Sign in with your Google account (the same one you use for Gmail)

## Step 2: Make a New Project 📁
Think of a project like a folder where you keep all your toys organized!

1. Look for a button that says "Select a project" at the top
2. Click "NEW PROJECT" 
3. Give it a name like "My Recruitify App"
4. Click "CREATE"
5. Wait a few seconds for Google to make your folder

## Step 3: Turn On the Google Sheets Power 🔌
Just like plugging in a toy to make it work!

1. On the left side, click "APIs & Services" 
2. Then click "Library" (it's like a toy store!)
3. In the search box, type "Google Sheets API"
4. Click on it when you see it
5. Click the big blue "ENABLE" button
6. Wait for it to turn on (like waiting for your toy to boot up!)

## Step 4: Get Your Special Keys 🗝️
These are like secret passwords that let your app talk to Google!

### First, Set Up the Permission Screen:
1. Click "APIs & Services" → "OAuth consent screen"
2. Choose "External" (like letting friends play with your toy)
3. Fill in these boxes:
   - **App name**: Type "Recruitify" 
   - **User support email**: Your email address
   - **Developer contact**: Your email address again
4. Click "SAVE AND CONTINUE"
5. Click "ADD OR REMOVE SCOPES"
6. Find and check the box for "Google Sheets API"
7. Click "UPDATE" then "SAVE AND CONTINUE"
8. Add your email as a test user
9. Click "SAVE AND CONTINUE"

### Now Get Your Keys:
1. Click "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Choose "Web application"
4. Name it "Recruitify Web"
5. Under "Authorized redirect URIs", click "ADD URI" and type:
   - `http://localhost:3000/api/auth/google/callback`
6. Click "CREATE"
7. A popup will show your Client ID and Client Secret - these are your special keys!

## Step 5: Put Your Keys in Your App 🔐
Like putting batteries in your toy!

1. Open your project folder on your computer
2. Find the file called `.env` (it might be hidden!)
3. Add these lines (replace the "your_..." parts with your real keys):

```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Step 6: Test It! 🎮
1. Start your app: `npm run dev`
2. Go to any form's analytics page
3. Click the "Google Sheets" tab
4. Click "Connect Google Account"
5. If it works, you'll see Google asking for permission - say yes!

## 🎉 You Did It!
Now your app can create Google Sheets and save form responses automatically!

## If Something Goes Wrong 😅
- **"redirect_uri_mismatch"**: Make sure you typed the redirect URI exactly right
- **Can't find the buttons**: Google sometimes moves things around - look for similar words
- **Still stuck**: The detailed guide in `GOOGLE_SHEETS_SETUP.md` has more help!

---

**Remember**: This is like teaching your app and Google to be friends. Once they're friends, they can share information safely! 🤝