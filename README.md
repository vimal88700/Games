# Game Room

Multiplayer mini games for Telegram (groups, DMs, invite links). No database: rooms live in memory.
Games: Tic-Tac-Toe, Connect 4 (vs bot or people) and score-attack games Snake, Fighter Jet, Tetris, 2048, Flappy (solo best score, or a score battle where the higher score wins). Each has solo mode vs bot (Easy / Medium / Hard), Quick match, and Invite a friend.

## Deploy (free)
1. Upload these files to your GitHub repo.
2. Render: point your service at that repo. Build command `npm install`, start command `npm start`.
3. Environment variables: `BOT_TOKEN` (or your existing `TELEGRAM_BOT_TOKEN`), `BOT_USERNAME` (without @), `APP_NAME` (the mini app short name from step 4).
4. In @BotFather: `/newapp`, choose your bot, set the URL to your Render URL, and pick a short name. This is the link group members open.
5. Add a free UptimeRobot monitor on `https://YOUR-SERVICE.onrender.com/health` every 5 minutes so it never sleeps.

Commands: `/play` (random game), `/play chess`-style with a game id, `/games`, `/invite`.

## Add a game
Add its id to `GAMES` in `server.js`, and a plug-in object (init, moves, move, result, tap, cell) in `public/index.html`.

Score-attack games live in public/arcade.js (one small plug-in each); add the id to GAMES in server.js too.
