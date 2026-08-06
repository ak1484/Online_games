# Deployment Guide

This project has a static HTML/CSS/JavaScript game in `dev/coin-collector`.

## Option 1: GitHub Pages (free)
1. Visit your repository on GitHub: `https://github.com/ak1484/Online_games`
2. Open `Settings` → `Pages`.
3. Set the source to `main` branch and choose `/ (root)`.
4. Save the changes.
5. Open the live URL: `https://ak1484.github.io/Online_games/dev/coin-collector/index.html`

If you prefer a cleaner URL, move or copy `dev/coin-collector` into a `docs/` folder and enable Pages from `main` branch `/docs`.

## Option 2: Vercel (free tier)
1. Sign in at https://vercel.com with your GitHub account.
2. Import the `ak1484/Online_games` repository.
3. Set the root directory to `dev/coin-collector` if needed.
4. Deploy the project.
5. Vercel will provide a preview URL, and you can configure a custom domain later.

## Option 3: Netlify (free tier)
1. Sign in at https://app.netlify.com with GitHub.
2. Create a new site from Git.
3. Select the `ak1484/Online_games` repository.
4. Set the publish directory to `dev/coin-collector`.
5. Deploy and use the provided Netlify URL.

## Notes
- GitHub Pages is the most direct free option for a static HTML game.
- If your game is in a nested folder, the URL will include that path.
- For a cleaner deployment, you can add a top-level `index.html` or use `docs/`.
- Netlify and Vercel also provide preview URLs and automatic deploys on push.

## Multiplayer deployment guidance

For future multiplayer or team-of-two games, a static deploy is not enough.
Use a backend or realtime service for room creation, state sync, and session lifecycle.

- Use Supabase Realtime or Firebase Realtime Database / Firestore for synchronized session state and auth.
- Use Vercel or Netlify serverless functions to create/join rooms, validate users, and delete sessions when rooms are empty.
- Store room metadata in a lightweight database collection/table with timestamps and a `players` list.
- Implement TTL cleanup for sessions that expire after all players leave or after a timeout.
- Keep the front-end static if possible, with realtime updates coming from the backend.
