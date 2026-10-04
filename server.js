const express = require('express'), http = require('http');
const { Server } = require('socket.io');
const { Bot, InlineKeyboard, webhookCallback } = require('grammy');

const app = express(), srv = http.createServer(app), io = new Server(srv);
const TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const BOT_USER = process.env.BOT_USERNAME, APP = process.env.APP_NAME;
const BASE = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || '';
// To add a game: add its id here AND a plug-in in public/index.html
const GAMES = { tictactoe: 'Tic-Tac-Toe', connect4: 'Connect 4', snake: 'Snake', jet: 'Fighter Jet', tetris: 'Tetris', g2048: '2048', flappy: 'Flappy' };
const rid = () => Math.random().toString(36).slice(2, 8);
const rooms = new Map(), waiting = {};   // everything lives in memory, nothing is stored

app.use(express.json());
app.use(express.static('public'));
// The mini app URL in BotFather may end in /app (older setup), so serve the game there too
app.get(['/app', '/app/*'], (_, r) => r.sendFile(require('path').join(__dirname, 'public', 'index.html')));
app.get('/health', (_, r) => r.send('ok'));
app.get('/config', (_, r) => r.json({ bot: BOT_USER, app: APP }));

function leave(s) {
  if (s.data.q && waiting[s.data.q] === s) delete waiting[s.data.q];
  const id = s.data.room; if (!id) return;
  s.leave(id); s.data.room = null;
  const r = rooms.get(id); if (!r) return;
  r.seats = r.seats.map(x => (x === s.id ? null : x));
  const n = r.seats.filter(Boolean).length;
  if (!n) rooms.delete(id); else io.to(id).emit('players', n);
}

io.on('connection', s => {
  s.on('join', ({ room, game }, ack) => {
    leave(s);
    if (!rooms.has(room) && !GAMES[game]) return ack({ error: 'Unknown game' });
    let r = rooms.get(room);
    if (!r) { r = { game, seats: [null, null] }; rooms.set(room, r); }
    const seat = r.seats.indexOf(null);
    if (seat < 0) return ack({ error: 'This room is full' });
    r.seats[seat] = s.id; s.join(room); s.data.room = room;
    const count = r.seats.filter(Boolean).length;
    ack({ seat, game: r.game, count });
    io.to(room).emit('players', count);
  });
  s.on('move', m => s.data.room && s.to(s.data.room).emit('move', m));
  s.on('quick', ({ game }, ack) => {
    const w = waiting[game];
    if (w && w.connected && w !== s) { delete waiting[game]; const room = rid(); w.emit('matched', { room, game }); return ack({ room }); }
    waiting[game] = s; s.data.q = game; ack({ wait: true });
  });
  s.on('leave', () => leave(s));
  s.on('disconnect', () => leave(s));
});

const bot = TOKEN ? new Bot(TOKEN) : null;
if (bot) {
  const tme = APP ? `https://t.me/${BOT_USER}/${APP}` : `https://t.me/${BOT_USER}`;
  const kb = (ctx, game) => {
    const room = rid();
    return ctx.chat.type === 'private'
      ? new InlineKeyboard().webApp('▶ Play', `${BASE}/?g=${game}&r=${room}`)
      : new InlineKeyboard().url('▶ Join game', `${tme}?startapp=${game}-${room}`);
  };
  const challenge = (ctx, game) => ctx.reply(`${GAMES[game]}: who's in?`, { reply_markup: kb(ctx, game) });
  bot.command('start', ctx => ctx.reply('Pick a game with /games, or send /play for a random one.',
    { reply_markup: ctx.chat.type === 'private' ? new InlineKeyboard().webApp('🎮 Open Game Room', BASE) : undefined }));
  bot.command(['play', 'invite'], ctx => {
    const ids = Object.keys(GAMES), arg = (ctx.match || '').trim();
    return challenge(ctx, GAMES[arg] ? arg : ids[Math.floor(Math.random() * ids.length)]);
  });
  bot.command('games', ctx => {
    const k = new InlineKeyboard();
    Object.entries(GAMES).forEach(([id, n]) => k.text(n, 'g:' + id).row());
    return ctx.reply('Choose a game:', { reply_markup: k });
  });
  bot.callbackQuery(/^g:(\w+)/, async ctx => { await ctx.answerCallbackQuery(); if (GAMES[ctx.match[1]]) return challenge(ctx, ctx.match[1]); });
  bot.catch(e => console.error('bot error:', e.message));
  app.post('/tg/' + TOKEN, webhookCallback(bot, 'express'));
}

srv.listen(process.env.PORT || 3000, async () => {
  console.log('Game Room is up');
  if (bot && BASE) {
    try {
      await bot.api.setWebhook(`${BASE}/tg/${TOKEN}`);
      await bot.api.setMyCommands([
        { command: 'play', description: 'Start a random game' },
        { command: 'games', description: 'Pick a game' },
        { command: 'invite', description: 'Make a game room' }]);
    } catch (e) { console.error('webhook setup failed:', e.message); }
  }
});
