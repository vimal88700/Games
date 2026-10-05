const express = require('express'), http = require('http'), path = require('path');
const { Server } = require('socket.io');
const { Bot, InlineKeyboard, webhookCallback } = require('grammy');
const { LOGIC, botMove, adjudicate, META } = require('./public/games.js');

const app = express(), srv = http.createServer(app), io = new Server(srv);
const TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const BOT_USER = process.env.BOT_USERNAME, APP = process.env.APP_NAME;
const BASE = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || '';
// To add a game: add it here, then add its UI/plug-in (turn games: games.js + index.html, score games: arcade*.js)
const GAMES = { tictactoe: 'Tic-Tac-Toe', connect4: 'Connect 4', chess: 'Chess', ludo: 'Ludo', carrom: 'Carrom',
  snake: 'Snake', jet: 'Fighter Jet', tetris: 'Tetris', g2048: '2048', flappy: 'Flappy', breakout: 'Breakout', dodge: 'Dodge',
  whack: 'Whack-a-Mole', stack: 'Stack', catch: 'Fruit Catch', runner: 'Runner', bubble: 'Bubble Pop', pong: 'Pong Rally',
  taprush: 'Number Rush', simon: 'Simon', memory: 'Memory',
  spaceinvaders: 'Space Invaders', traffic: 'Traffic', hopper: 'Hopper', slicer: 'Slicer', orbit: 'Orbit', laner: 'Laner', reflex: 'Reflex', minefield: 'Minefield' };
const SCORE_GAMES = new Set(['snake', 'jet', 'tetris', 'g2048', 'flappy', 'breakout', 'dodge', 'whack', 'stack', 'catch', 'runner', 'bubble', 'pong', 'taprush', 'simon', 'memory',
  'spaceinvaders', 'traffic', 'hopper', 'slicer', 'orbit', 'laner', 'reflex', 'minefield']);
const ROUND_MS = 180000, LOBBY_AUTO_MS = 30000, MAX_PLAYERS = 60;
const rid = () => Math.random().toString(36).slice(2, 8);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rooms = new Map(), waiting = {};   // everything lives in memory, nothing is stored

app.use(express.json());
app.use(express.static('public'));
app.get(['/app', '/app/*'], (_, r) => r.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/health', (_, r) => r.send('ok'));
app.get('/config', (_, r) => r.json({ bot: BOT_USER, app: APP }));

const to = (p, ev, d) => p && p.sid && io.to(p.sid).emit(ev, d);
const conn = r => r.players.filter(p => p.sid);
const hostOf = r => conn(r)[0];
const mkRoom = (id, game) => {
  const group = id[0] === 'G';   // rooms made by the bot inside a group get timers and rounds
  return SCORE_GAMES.has(game) ? { id, game, kind: 'score', group, players: [], round: 0, endsAt: 0, ended: false }
    : { id, game, kind: 'turn', group, players: [], phase: 'lobby', round: 0, matches: [], champion: null, final: false };
};
function destroy(r) { clearTimeout(r.tm); clearTimeout(r.auto); clearTimeout(r.bt); (r.matches || []).forEach(m => { clearTimeout(m.tt); clearTimeout(m.mt); }); rooms.delete(r.id); }
function gcCheck(r) { clearTimeout(r.gc); if (!conn(r).length) r.gc = setTimeout(() => destroy(r), r.group ? 120000 : 30000); }

/* ---------- score-attack rooms ---------- */
const board = r => ({ players: r.players.map(p => ({ id: p.uid, name: p.name, score: p.score, done: p.done })), round: r.round, group: r.group, left: r.endsAt ? Math.max(0, r.endsAt - Date.now()) : 0, ended: r.ended });
const emitBoard = r => io.to(r.id).emit('board', board(r));
function startRound(r) { r.ended = false; r.endsAt = Date.now() + ROUND_MS; clearTimeout(r.tm); r.tm = setTimeout(() => endRound(r), ROUND_MS); }
function endRound(r) { if (r.ended) return; r.ended = true; clearTimeout(r.tm); emitBoard(r); }

/* ---------- turn-based rooms: lobby, knockout rounds, bots, clocks ---------- */
function lobbyUpdate(r) {
  const S = META[r.game].seats, h = hostOf(r), n = conn(r).length;
  if (r.group && n >= 2 && !r.auto) { r.autoAt = Date.now() + LOBBY_AUTO_MS; r.auto = setTimeout(() => { r.auto = null; if (r.phase === 'lobby') startTournament(r); }, LOBBY_AUTO_MS); }
  if (n < 2 && r.auto) { clearTimeout(r.auto); r.auto = null; r.autoAt = 0; }
  conn(r).forEach(p => to(p, 'lobby', { game: r.game, group: r.group, S, names: conn(r).map(x => x.name), host: p === h,
    canStart: p === h && (r.group || S > 2), startIn: r.auto ? Math.max(0, r.autoAt - Date.now()) : null }));
}
function startTournament(r) {
  clearTimeout(r.auto); r.auto = null;
  r.players = r.players.filter(p => p.sid); r.players.forEach(p => { p.alive = true; p.late = false; p.auto = 0; p.ready = false; });
  if (!r.players.length) return;
  r.round = 0; r.champion = null; nextRound(r);
}
function nextRound(r) {
  const S = META[r.game].seats, alive = shuffle(r.players.filter(p => p.alive));
  if (!alive.length) { r.phase = 'done'; return io.to(r.id).emit('champion', { name: null, bot: true }); }
  if (alive.length === 1 && r.round >= 1) return crown(r, alive[0]);
  r.round++; r.phase = 'play'; r.final = alive.length <= S;
  const groups = []; for (let i = 0; i < alive.length; i += S) groups.push(alive.slice(i, i + S));
  r.matches = groups.map((g, i) => ({ id: `${r.id}:${r.round}:${i}`, r,
    seats: shuffle([...g, ...Array.from({ length: S - g.length }, () => ({ bot: true, name: 'Bot 🤖', lvl: 1 }))]), over: false, draws: 0, w: null }));
  sendBracket(r); r.matches.forEach(m => startMatch(r, m));
}
function crown(r, p) { r.phase = 'done'; r.champion = p.name; io.to(r.id).emit('champion', { name: p.name }); sendBracket(r); }
function bracket(r) { return { round: r.round, final: r.final, phase: r.phase, alive: r.players.filter(p => p.alive).map(p => p.name),
  matches: r.matches.map(m => ({ names: m.seats.map(x => x.name), over: m.over, win: m.over && m.w >= 0 ? m.seats[m.w].name : null })) }; }
const sendBracket = (r, p) => p ? to(p, 'bracket', bracket(r)) : io.to(r.id).emit('bracket', bracket(r));
const view = m => ({ mid: m.id, s: m.s, turnLeft: m.turnEnds ? Math.max(0, m.turnEnds - Date.now()) : 0, matchLeft: m.matchEnds ? Math.max(0, m.matchEnds - Date.now()) : 0,
  who: m.seats.map(x => x.bot ? 'bot' : (!x.sid || x.auto >= 2) ? 'away' : '') });
const sendMatch = (m, p) => to(p, 'match', { ...view(m), game: m.r.game, seat: m.seats.indexOf(p), names: m.seats.map(x => x.name), group: m.r.group, round: m.r.round, final: m.r.final });
const emitState = m => m.seats.forEach(p => !p.bot && to(p, 'state', view(m)));
function startMatch(r, m) {
  const g = LOGIC[r.game]; clearTimeout(m.tt); clearTimeout(m.mt); m.s = g.init(m.seats.length); m.over = false; m.w = null;
  m.matchEnds = r.group ? Date.now() + META[r.game].match : 0;
  if (r.group) m.mt = setTimeout(() => timeUp(r, m), META[r.game].match);
  scheduleTurn(r, m); m.seats.forEach(p => !p.bot && sendMatch(m, p));
}
function scheduleTurn(r, m) {
  clearTimeout(m.tt); if (m.over) return;
  const seat = m.s.t, pl = m.seats[seat], extra = m.s.anim ? m.s.anim.f.length * 17 + 600 : 0, away = pl.bot || !pl.sid || pl.auto >= 2;
  m.turnEnds = r.group && !pl.bot ? Date.now() + META[r.game].turn + extra : 0;
  if (away) m.tt = setTimeout(() => botAct(r, m, seat), (pl.bot ? 1000 : 1600) + extra);
  else if (r.group) m.tt = setTimeout(() => { pl.auto++; botAct(r, m, seat); }, META[r.game].turn + extra);
}
function botAct(r, m, seat) {
  if (m.over || m.s.t !== seat) return; const pl = m.seats[seat], g = LOGIC[r.game]; let mv = null;
  try { mv = botMove(r.game, m.s, seat, pl.bot ? pl.lvl : 1, { ms: 350 }); } catch (e) { console.error('bot error', e.message); }
  if (!applyMove(r, m, seat, mv) && g.moves) for (const x of g.moves(m.s)) if (applyMove(r, m, seat, x)) return;
}
function applyMove(r, m, seat, mv) {
  const g = LOGIC[r.game]; if (m.over || m.s.t !== seat || mv == null) return false;
  const ns = g.move(m.s, seat, mv); if (!ns) return false;
  m.s = ns; const res = g.result(ns);
  if (!res) scheduleTurn(r, m);
  emitState(m); delete m.s.anim;
  if (res) endMatch(r, m, res, '');
  return true;
}
function timeUp(r, m) { if (m.over) return; const w = adjudicate(r.game, m.s); endMatch(r, m, w < 0 ? { draw: 1 } : { w }, 'time'); }
function endMatch(r, m, res, reason) {
  clearTimeout(m.tt); clearTimeout(m.mt); m.over = true; let w = res.draw ? -1 : res.w;
  if (w < 0 && r.group && m.draws < 2) {   // draw in a knockout: replay with seats swapped, at most twice
    m.draws++; m.over = false; m.seats.reverse();
    m.seats.forEach(p => !p.bot && to(p, 'matchOver', { mid: m.id, w: -1, reason: 'draw', replay: true }));
    return void setTimeout(() => { if (!m.over && rooms.get(r.id) === r) startMatch(r, m); }, 3000);
  }
  if (w < 0 && r.group) { w = Math.random() * m.seats.length | 0; reason = 'coin'; }
  m.w = w; const win = w >= 0 ? m.seats[w] : null;
  m.seats.forEach((p, i) => !p.bot && to(p, 'matchOver', { mid: m.id, w, reason, winner: win ? win.name : null, advance: r.group && i === w && !r.final }));
  if (r.group) m.seats.forEach((p, i) => { if (!p.bot && i !== w) p.alive = false; });
  sendBracket(r);
  if (r.matches.some(x => !x.over)) return;
  if (!r.group) { r.phase = 'done'; r.players.forEach(p => { p.ready = false; }); return; }
  if (r.final) { r.phase = 'done'; const fw = m.w >= 0 ? m.seats[m.w] : null; r.champion = fw && !fw.bot ? fw.name : null; io.to(r.id).emit('champion', { name: r.champion, bot: !r.champion }); return; }
  io.to(r.id).emit('bracket', { ...bracket(r), next: 6000 });
  setTimeout(() => { if (rooms.get(r.id) === r && r.phase === 'play') nextRound(r); }, 6000);
}

/* ---------- sockets ---------- */
function leave(s) {
  if (s.data.q && waiting[s.data.q] === s) delete waiting[s.data.q];
  const id = s.data.room; if (!id) return; s.leave(id); s.data.room = null;
  const r = rooms.get(id); if (!r) return; const p = r.players.find(x => x.sid === s.id); if (!p) return;
  if (r.kind === 'score') {
    if (r.group) { p.sid = null; p.done = true; if (r.players.every(x => x.done || !x.sid)) endRound(r); else emitBoard(r); }
    else { r.players = r.players.filter(x => x !== p); emitBoard(r); }
  } else if (r.phase === 'lobby') { r.players = r.players.filter(x => x !== p); lobbyUpdate(r); }
  else {
    p.sid = null;   // a bot plays on for anyone who leaves mid-tournament
    const m = r.matches.find(x => !x.over && x.seats.includes(p));
    if (m && !r.group && META[r.game].seats === 2) endMatch(r, m, { w: 1 - m.seats.indexOf(p) }, 'left');
    else if (m && m.s.t === m.seats.indexOf(p)) scheduleTurn(r, m);
  }
  if (!r.players.length && r.kind === 'score') return destroy(r);
  gcCheck(r);
}

io.on('connection', s => {
  s.on('join', ({ room, game, name, uid }, ack) => {
    leave(s); room = String(room || '').slice(0, 20);
    let r = rooms.get(room);
    if (!r) { if (!GAMES[game]) return ack({ error: 'Unknown game' }); r = mkRoom(room, game); rooms.set(room, r); }
    uid = String(uid || s.id).slice(0, 40); name = String(name || 'Player').slice(0, 20);
    let p = r.players.find(x => x.uid === uid);   // same person opening the link again = same player, not a new one
    if (p) { const old = p.sid && p.sid !== s.id && io.sockets.sockets.get(p.sid); if (old) { old.data.room = null; old.leave(room); old.emit('kicked'); } p.sid = s.id; p.name = name; p.auto = 0; }
    else {
      if (r.players.length >= MAX_PLAYERS) return ack({ error: 'This room is full' });
      p = { uid, name, sid: s.id, alive: true, auto: 0, score: 0, done: false };
      if (r.kind === 'turn' && r.phase !== 'lobby') { p.alive = false; p.late = true; }
      r.players.push(p);
    }
    s.data.room = room; s.join(room); clearTimeout(r.gc);
    ack({ kind: r.kind, game: r.game, group: r.group });
    if (r.kind === 'score') { if (r.group && !r.endsAt) startRound(r); return emitBoard(r); }
    if (r.phase === 'lobby') {
      if (!r.group && META[r.game].seats === 2 && conn(r).length === 2) return startTournament(r);
      return lobbyUpdate(r);
    }
    const m = r.matches.find(x => !x.over && x.seats.includes(p));
    if (m) sendMatch(m, p); else sendBracket(r, p);
    if (r.phase === 'done' && r.champion) to(p, 'champion', { name: r.champion });
  });
  s.on('start', () => { const r = rooms.get(s.data.room); if (r && r.kind === 'turn' && r.phase === 'lobby' && hostOf(r) && hostOf(r).sid === s.id && (r.group || META[r.game].seats > 2)) startTournament(r); });
  s.on('act', ({ mid, m: mv }) => {
    const r = rooms.get(s.data.room); if (!r || r.kind !== 'turn') return;
    const m = r.matches.find(x => x.id === mid && !x.over); if (!m) return;
    const p = r.players.find(x => x.sid === s.id), seat = m.seats.indexOf(p); if (seat < 0) return;
    p.auto = 0;
    if (r.game === 'ludo' && mv && mv.roll !== undefined) mv = { roll: 1 + (Math.random() * 6 | 0) };   // dice are rolled by the server, never trusted from the client
    applyMove(r, m, seat, mv);
  });
  s.on('again', () => {
    const r = rooms.get(s.data.room); if (!r || r.kind !== 'turn' || r.phase !== 'done') return;
    const p = r.players.find(x => x.sid === s.id); if (!p) return;
    if (r.group) { r.phase = 'lobby'; r.players = r.players.filter(x => x.sid); r.players.forEach(x => { x.alive = true; }); return lobbyUpdate(r); }
    p.ready = true; const c = conn(r);
    if (c.length >= 2 && c.every(x => x.ready)) startTournament(r); else c.forEach(x => to(x, 'waitAgain', {}));
  });
  s.on('score', ({ score, done }) => {
    const r = rooms.get(s.data.room), p = r && r.kind === 'score' && r.players.find(x => x.sid === s.id);
    if (!p || !Number.isFinite(score) || (r.group && r.ended)) return;
    if (score > p.score) p.score = Math.floor(score);
    if (done) { p.done = true; if (r.group && r.players.every(x => x.done || !x.sid)) return endRound(r); emitBoard(r); }
    else if (!r.bt) r.bt = setTimeout(() => { r.bt = null; emitBoard(r); }, 700);
  });
  s.on('next', () => {
    const r = rooms.get(s.data.room); if (!r || r.kind !== 'score' || !r.group || !r.ended) return;
    r.round++; r.players.forEach(p => { p.score = 0; p.done = !p.sid; }); startRound(r); emitBoard(r);
  });
  s.on('quick', ({ game }, ack) => {
    const w = waiting[game];
    if (w && w.connected && w !== s) { delete waiting[game]; const room = rid(); w.emit('matched', { room, game }); return ack({ room }); }
    waiting[game] = s; s.data.q = game; ack({ wait: true });
  });
  s.on('leave', () => leave(s));
  s.on('disconnect', () => leave(s));
});

/* ---------- Telegram bot ---------- */
const bot = TOKEN ? new Bot(TOKEN) : null;
if (bot) {
  const tme = APP ? `https://t.me/${BOT_USER}/${APP}` : `https://t.me/${BOT_USER}`;
  const kb = (ctx, game) => ctx.chat.type === 'private'
    ? new InlineKeyboard().webApp('▶ Play', `${BASE}/?g=${game}&r=${rid()}`)
    : new InlineKeyboard().url('▶ Join game', `${tme}?startapp=${game}-G${rid()}`);
  const challenge = (ctx, game) => ctx.reply(
    ctx.chat.type === 'private' ? `${GAMES[game]}: tap Play` :
    SCORE_GAMES.has(game) ? `🏁 ${GAMES[game]}: tap Join. Everyone plays one run (about 3 minutes) and the highest score wins!`
      : `🏆 ${GAMES[game]} knockout: tap Join. Winners advance round by round, and a bot plays for anyone who leaves.`,
    { reply_markup: kb(ctx, game) });
  bot.command('start', ctx => ctx.reply('Pick a game with /games, or send /play for a random one.',
    { reply_markup: ctx.chat.type === 'private' ? new InlineKeyboard().webApp('🎮 Open Game Room', BASE) : undefined }));
  bot.command(['play', 'invite'], ctx => {
    const ids = Object.keys(GAMES), arg = (ctx.match || '').trim();
    return challenge(ctx, GAMES[arg] ? arg : ids[Math.floor(Math.random() * ids.length)]);
  });
  bot.command('games', ctx => {
    const k = new InlineKeyboard();
    Object.entries(GAMES).forEach(([id, n], i) => { k.text(n, 'g:' + id); if (i % 2) k.row(); });
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
