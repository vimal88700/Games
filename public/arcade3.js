/* 8 more score games, written by Replit Agent in the same plug-in format (see arcade.js). */
var ARC3 = (function () {
  "use strict";
  var W = 320, H = 480, TAU = Math.PI * 2;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function held(i, k) { return !!(i && i.h && i.h[k]); }
  function tapped(i, k) { return !!(i && i.p && i.p[k]); }
  function rng(s) {
    var n = Number(s.rand());
    return Number.isFinite(n) ? clamp(n, 0, 0.999999999) : 0.5;
  }
  function base(rand, lives) {
    var s = { sc: 0, dead: false, t: 0, rand: typeof rand === "function" ? rand : function () { return 0.5; } };
    if (lives !== undefined) s.hp = lives;
    return s;
  }
  function advance(s, input, dt, tick) {
    if (!s || s.dead || !Number.isFinite(dt) || dt <= 0) return;
    var left = dt / 1000, first = true;
    while (left > 0.0000001 && !s.dead) {
      var d = Math.min(left, 1 / 120);
      s.t += d;
      tick(s, first ? input || {} : { h: (input && input.h) || {}, p: {} }, d);
      first = false;
      left -= d;
    }
  }
  function hit(s, inv) {
    if (s.dead || s.inv > 0) return false;
    s.hp = Math.max(0, s.hp - 1);
    s.inv = inv || 0;
    if (!s.hp) s.dead = true;
    return true;
  }
  function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function circle(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fill();
  }
  function text(c, str, x, y, size, col, align) {
    c.fillStyle = col; c.font = "bold " + size + "px sans-serif";
    c.textAlign = align || "left"; c.textBaseline = "middle";
    c.fillText(String(str), x, y);
  }
  function line(c, x, y, xx, yy, col, width) {
    c.strokeStyle = col; c.lineWidth = width || 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.stroke();
  }
  function start(c, top, bottom) {
    c.save();
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    c.shadowBlur = 0;
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function hud(c, s, label, col) {
    rect(c, 0, 0, W, 48, "rgba(0,0,0,0.28)");
    text(c, label, 12, 15, 10, col);
    text(c, s.sc, 12, 34, 22, "#ffffff");
    if (s.hp !== undefined) text(c, "❤️".repeat(s.hp), 308, 26, 19, "#ffffff", "right");
  }
  function finish(c, s, hint) {
    if (s.dead) {
      rect(c, 0, 0, W, H, "rgba(3,8,18,0.72)");
      text(c, s.won ? "FIELD CLEARED" : "RUN COMPLETE", 160, 208, 24, "#ffffff", "center");
      text(c, "SCORE  " + s.sc, 160, 247, 20, "#ffffff", "center");
    } else if (hint) {
      text(c, hint, 160, 466, 11, "rgba(255,255,255,0.8)", "center");
    }
    c.restore();
  }
  function distanceSegment(x, y, ax, ay, bx, by) {
    var vx = bx - ax, vy = by - ay, den = vx * vx + vy * vy;
    var t = den ? clamp(((x - ax) * vx + (y - ay) * vy) / den, 0, 1) : 0;
    var dx = x - ax - vx * t, dy = y - ay - vy * t;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function swipe(s, dx, dy, jump) {
    if (s.dead) return;
    if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy)) {
      s.lane = clamp(s.lane + (dx > 0 ? 1 : -1), 0, 2);
    } else if (jump && dy < -24 && Math.abs(dy) > Math.abs(dx)) jump(s);
  }

  function invaderWave(s) {
    s.aliens = [];
    for (var r = 0; r < 4; r++) for (var k = 0; k < 7; k++) {
      s.aliens.push({ x: 43 + k * 34, y: 82 + r * 27, type: r });
    }
    s.wave += 1; s.dir = 1; s.enemyClock = 1.1; s.enemy = [];
    s.inv = Math.max(s.inv, 1);
  }
  var spaceinvaders = {
    name: "Space Invaders", icon: "👾", col: "#5ef5dc",
    init: function (rand) {
      var s = base(rand, 3);
      s.x = 160; s.shots = []; s.enemy = []; s.aliens = [];
      s.fire = 0; s.wave = 0; s.inv = 0; s.stars = [];
      for (var n = 0; n < 55; n++) s.stars.push({ x: rng(s) * W, y: rng(s) * H, r: 0.5 + rng(s) });
      invaderWave(s); return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        s.inv = Math.max(0, s.inv - d);
        s.x = clamp(s.x + (Number(held(i, "r")) - Number(held(i, "l"))) * 230 * d, 18, 302);
        s.fire -= d;
        if (s.fire <= 0) { s.shots.push({ x: s.x, y: 421 }); s.fire += 0.24; }
        var speed = Math.min(82, 19 + s.wave * 5 + (28 - s.aliens.length) * 1.3);
        var turn = false;
        s.aliens.forEach(function (a) {
          a.x += s.dir * speed * d;
          if (a.x > 301 || a.x < 19) turn = true;
        });
        if (turn) {
          s.dir *= -1;
          s.aliens.forEach(function (a) { a.x = clamp(a.x, 19, 301); a.y += 13; });
        }
        s.shots.forEach(function (b) { b.y -= 410 * d; });
        for (var b = s.shots.length - 1; b >= 0; b--) {
          var bullet = s.shots[b], found = false;
          for (var a = s.aliens.length - 1; a >= 0; a--) {
            if (Math.abs(bullet.x - s.aliens[a].x) < 14 && Math.abs(bullet.y - s.aliens[a].y) < 12) {
              s.aliens.splice(a, 1); s.sc += 10; found = true; break;
            }
          }
          if (found || bullet.y < 45) s.shots.splice(b, 1);
        }
        if (!s.aliens.length) { s.sc += 100; invaderWave(s); }
        s.enemyClock -= d;
        if (s.enemyClock <= 0 && s.aliens.length) {
          var shooter = s.aliens[Math.floor(rng(s) * s.aliens.length)];
          s.aliens.forEach(function (a) { if (Math.abs(a.x - shooter.x) < 5 && a.y > shooter.y) shooter = a; });
          s.enemy.push({ x: shooter.x, y: shooter.y + 12 });
          s.enemyClock = Math.max(0.38, 1.15 - s.wave * 0.065) + rng(s) * 0.35;
        }
        for (var e = s.enemy.length - 1; e >= 0; e--) {
          var eb = s.enemy[e]; eb.y += Math.min(250, 135 + s.wave * 10) * d;
          if (Math.abs(eb.x - s.x) < 14 && Math.abs(eb.y - 431) < 13) {
            hit(s, 1.5); s.enemy.splice(e, 1);
          } else if (eb.y > 490) s.enemy.splice(e, 1);
        }
        if (s.aliens.some(function (a) { return a.y > 405; })) { s.hp = 0; s.dead = true; }
      });
    },
    down: function (s, x) { if (!s.dead) s.x = clamp(x, 18, 302); },
    move: function (s, x) { if (!s.dead) s.x = clamp(x, 18, 302); },
    draw: function (c, s) {
      start(c, "#050b26", "#192346");
      s.stars.forEach(function (v) { circle(c, v.x, (v.y + s.t * 8) % H, v.r, "#829bcc"); });
      circle(c, 270, 140, 53, "rgba(88,75,171,0.18)");
      circle(c, 283, 131, 48, "#0c1735");
      s.aliens.forEach(function (a) {
        var col = ["#ff81d0", "#b38cff", "#6dbfff", "#5ef5dc"][a.type];
        rect(c, a.x - 10, a.y - 7, 20, 13, col);
        rect(c, a.x - 15, a.y - 2, 30, 7, col);
        rect(c, a.x - 8, a.y - 12, 3, 5, col); rect(c, a.x + 5, a.y - 12, 3, 5, col);
        rect(c, a.x - 6, a.y - 3, 3, 4, "#101b35"); rect(c, a.x + 3, a.y - 3, 3, 4, "#101b35");
        rect(c, a.x - 10, a.y + 7, 4, 4, col); rect(c, a.x + 6, a.y + 7, 4, 4, col);
      });
      s.shots.forEach(function (b) { rect(c, b.x - 2, b.y - 8, 4, 14, "#afffea"); });
      s.enemy.forEach(function (b) { line(c, b.x - 3, b.y - 5, b.x + 3, b.y + 5, "#ff7094", 3); });
      if (!s.inv || Math.floor(s.t * 12) % 2) {
        c.fillStyle = "#5ef5dc"; c.beginPath(); c.moveTo(s.x, 413); c.lineTo(s.x + 16, 443);
        c.lineTo(s.x, 437); c.lineTo(s.x - 16, 443); c.closePath(); c.fill();
        line(c, s.x, 440, s.x, 451 + Math.sin(s.t * 40) * 3, "#ffb769", 4);
      }
      hud(c, s, "STAR PATROL  /  WAVE " + s.wave, "#5ef5dc");
      finish(c, s, "Drag to steer · automatic fire");
    }
  };

  function car(c, x, y, col, player) {
    rect(c, x - 19, y - 30, 38, 61, col);
    rect(c, x - 14, y - 17, 28, 15, "#172537");
    rect(c, x - 13, y + 14, 26, 9, "#20314a");
    rect(c, x - 23, y - 20, 5, 14, "#111827"); rect(c, x + 18, y - 20, 5, 14, "#111827");
    rect(c, x - 23, y + 13, 5, 14, "#111827"); rect(c, x + 18, y + 13, 5, 14, "#111827");
    rect(c, x - 15, y - 29, 8, 4, player ? "#fff6be" : "#ff8c8c");
    rect(c, x + 7, y - 29, 8, 4, player ? "#fff6be" : "#ff8c8c");
  }
  var traffic = {
    name: "Traffic", icon: "🚗", col: "#ffc857",
    init: function (rand) {
      var s = base(rand, 3); s.lane = 1; s.x = 160; s.cars = [];
      s.distance = 0; s.spawn = 1.1; s.inv = 0; return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        if (tapped(i, "l")) s.lane = Math.max(0, s.lane - 1);
        if (tapped(i, "r")) s.lane = Math.min(2, s.lane + 1);
        s.x += (80 + s.lane * 80 - s.x) * Math.min(1, d * 17);
        s.inv = Math.max(0, s.inv - d);
        var speed = Math.min(390, 170 + s.t * 2.8);
        s.distance += speed * d / 12; s.sc = Math.floor(s.distance);
        s.spawn -= d;
        if (s.spawn <= 0) {
          s.cars.push({ lane: Math.floor(rng(s) * 3), y: -42, col: ["#ea6673", "#b294ff", "#67ccde", "#f3a66d"][Math.floor(rng(s) * 4)] });
          s.spawn += Math.max(0.68, 1.18 - s.t * 0.004) + rng(s) * 0.25;
        }
        for (var n = s.cars.length - 1; n >= 0; n--) {
          var a = s.cars[n]; a.y += speed * d;
          if (Math.abs(80 + a.lane * 80 - s.x) < 36 && Math.abs(a.y - 398) < 54) {
            if (hit(s, 1.6)) s.cars.splice(n, 1);
          } else if (a.y > 530) s.cars.splice(n, 1);
        }
      });
    },
    up: function (s, x, y, dx, dy) { swipe(s, dx, dy); },
    draw: function (c, s) {
      start(c, "#263d36", "#627851");
      var offset = (s.distance * 12) % 100;
      for (var n = -1; n < 6; n++) {
        circle(c, 14, n * 100 + offset, 22, "#3c5d45");
        circle(c, 306, n * 100 + offset + 40, 20, "#91a065");
      }
      rect(c, 37, 0, 246, H, "#303541");
      rect(c, 38, 0, 3, H, "#ffd16a"); rect(c, 279, 0, 3, H, "#ffd16a");
      for (var y = -100; y < H; y += 100) {
        rect(c, 119, y + offset, 2, 45, "#e1dccc"); rect(c, 199, y + offset, 2, 45, "#e1dccc");
      }
      s.cars.forEach(function (a) { car(c, 80 + a.lane * 80, a.y, a.col, false); });
      if (!s.inv || Math.floor(s.t * 10) % 2) car(c, s.x, 398, "#ffc857", true);
      hud(c, s, "GOLDEN HOUR  /  DISTANCE", "#ffc857");
      finish(c, s, "Swipe left or right to change lanes");
    }
  };

  function addPlatform(s, y) {
    var last = s.platforms[s.platforms.length - 1];
    var x = clamp(last.x + (rng(s) - 0.5) * 155, 12, 242);
    s.platforms.push({ x: x, y: y, w: 66 });
  }
  var hopper = {
    name: "Hopper", icon: "🐸", col: "#78e0af",
    init: function (rand) {
      var s = base(rand); s.x = 160; s.y = 390; s.vy = -360;
      s.height = 0; s.platforms = [{ x: 120, y: 420, w: 80 }];
      for (var y = 362; y > -80; y -= 50 + rng(s) * 12) addPlatform(s, y);
      return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        s.x = clamp(s.x + (Number(held(i, "r")) - Number(held(i, "l"))) * 250 * d, 12, 308);
        var old = s.y; s.vy += 720 * d; s.y += s.vy * d;
        if (s.vy > 0) {
          for (var n = 0; n < s.platforms.length; n++) {
            var p = s.platforms[n];
            if (old + 14 <= p.y && s.y + 14 >= p.y && s.x + 11 >= p.x && s.x - 11 <= p.x + p.w) {
              s.y = p.y - 14; s.vy = -360; break;
            }
          }
        }
        if (s.y < 190) {
          var shift = 190 - s.y; s.y = 190; s.height += shift;
          s.platforms.forEach(function (p) { p.y += shift; });
        }
        s.sc = Math.floor(s.height);
        s.platforms = s.platforms.filter(function (p) { return p.y < 500; });
        while (s.platforms[s.platforms.length - 1].y > -70) {
          addPlatform(s, s.platforms[s.platforms.length - 1].y - 50 - rng(s) * 12);
        }
        if (s.y > 500) s.dead = true;
      });
    },
    down: function (s, x) { if (!s.dead) s.x = clamp(x, 12, 308); },
    move: function (s, x) { if (!s.dead) s.x = clamp(x, 12, 308); },
    draw: function (c, s) {
      start(c, "#274b56", "#92c4ac");
      for (var n = 0; n < 7; n++) {
        var cy = ((n * 91 + s.height * 0.22) % 610) - 60, cx = (n * 97) % 320;
        circle(c, cx, cy, 28, "rgba(222,247,223,0.13)");
        circle(c, cx + 24, cy + 4, 20, "rgba(222,247,223,0.13)");
      }
      for (var k = 0; k < 5; k++) line(c, k * 77, 55, k * 77 - 25, H, "rgba(25,73,73,0.17)", 18);
      s.platforms.forEach(function (p) {
        rect(c, p.x, p.y, p.w, 10, "#405c45"); rect(c, p.x, p.y, p.w, 4, "#b8f1a5");
        line(c, p.x + 8, p.y + 12, p.x + 14, p.y + 16, "#6a9670", 2);
      });
      circle(c, s.x, s.y, 14, "#78e0af");
      circle(c, s.x - 8, s.y - 9, 7, "#a4f5bf"); circle(c, s.x + 8, s.y - 9, 7, "#a4f5bf");
      circle(c, s.x - 8, s.y - 10, 2.5, "#173f45"); circle(c, s.x + 8, s.y - 10, 2.5, "#173f45");
      line(c, s.x - 4, s.y + 5, s.x + 4, s.y + 5, "#26595a", 2);
      hud(c, s, "CANOPY HOP  /  HEIGHT", "#a4f5bf");
      finish(c, s, "Drag to steer · keep bouncing");
    }
  };

  function slice(s, ax, ay, bx, by) {
    if (s.dead) return;
    s.trail.push({ ax: ax, ay: ay, bx: bx, by: by, life: 0.2 });
    for (var n = s.fruits.length - 1; n >= 0; n--) {
      var f = s.fruits[n];
      if (distanceSegment(f.x, f.y, ax, ay, bx, by) <= f.r + 3) {
        s.fruits.splice(n, 1);
        if (f.bomb) hit(s, 0.85);
        else {
          s.sc += 10;
          for (var k = 0; k < 6; k++) s.bits.push({ x: f.x, y: f.y, vx: (rng(s) - 0.5) * 180, vy: -rng(s) * 180, life: 0.6, col: f.col });
        }
      }
    }
  }
  var slicer = {
    name: "Slicer", icon: "🍉", col: "#ff6d91",
    init: function (rand) {
      var s = base(rand, 3); s.fruits = []; s.bits = []; s.trail = [];
      s.spawn = 0.5; s.inv = 0; s.finger = null; s.cursor = { x: 160, y: 260 }; return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        s.inv = Math.max(0, s.inv - d);
        var ox = s.cursor.x, oy = s.cursor.y;
        s.cursor.x = clamp(ox + (Number(held(i, "r")) - Number(held(i, "l"))) * 450 * d, 0, W);
        s.cursor.y = clamp(oy + (Number(held(i, "d")) - Number(held(i, "u"))) * 450 * d, 48, H);
        if (held(i, "a") || tapped(i, "a")) slice(s, ox, oy, s.cursor.x, s.cursor.y);
        s.spawn -= d;
        if (s.spawn <= 0) {
          var count = 2 + Math.floor(rng(s) * 2);
          for (var k = 0; k < count; k++) {
            var x = 45 + rng(s) * 230;
            s.fruits.push({
              x: x, y: 510 + k * 12, vx: (160 - x) * 0.36 + (rng(s) - 0.5) * 65,
              vy: -490 - rng(s) * 90, r: 19 + rng(s) * 5, bomb: rng(s) < 0.14,
              col: ["#ff6d91", "#ffb64f", "#8ce17a", "#ba8afa"][Math.floor(rng(s) * 4)],
              spin: rng(s) * TAU
            });
          }
          s.spawn = Math.max(0.75, 1.4 - s.t * 0.006) + rng(s) * 0.3;
        }
        s.fruits.forEach(function (f) { f.vy += 700 * d; f.x += f.vx * d; f.y += f.vy * d; f.spin += d; });
        s.fruits = s.fruits.filter(function (f) { return f.y < 560; });
        s.bits.forEach(function (b) { b.x += b.vx * d; b.y += b.vy * d; b.vy += 500 * d; b.life -= d; });
        s.bits = s.bits.filter(function (b) { return b.life > 0; });
        s.trail.forEach(function (b) { b.life -= d; });
        s.trail = s.trail.filter(function (b) { return b.life > 0; });
      });
    },
    down: function (s, x, y) { if (!s.dead) s.finger = { x: x, y: y }; },
    move: function (s, x, y) {
      if (!s.dead && s.finger) {
        slice(s, s.finger.x, s.finger.y, x, y); s.finger = { x: x, y: y };
      }
    },
    up: function (s, x, y) {
      if (s.finger) slice(s, s.finger.x, s.finger.y, x, y);
      s.finger = null;
    },
    draw: function (c, s) {
      start(c, "#341f36", "#6b3b44");
      for (var n = 0; n < 9; n++) {
        rect(c, n * 40, 48, 2, 432, "rgba(255,184,149,0.09)");
        line(c, n * 40 + 5, 90 + n * 37, n * 40 + 28, 280 + n * 15, "rgba(0,0,0,0.08)", 2);
      }
      circle(c, 160, 276, 130, "rgba(255,154,166,0.05)");
      s.fruits.forEach(function (f) {
        c.save(); c.translate(f.x, f.y); c.rotate(f.spin);
        circle(c, 2, 5, f.r, "rgba(0,0,0,0.2)");
        circle(c, 0, 0, f.r, f.bomb ? "#20202c" : f.col);
        circle(c, -6, -7, 5, f.bomb ? "#666579" : "rgba(255,255,255,0.35)");
        if (f.bomb) {
          line(c, 0, -f.r, 8, -f.r - 10, "#dbbc8a", 3);
          circle(c, 9, -f.r - 11, 4, "#ffb74f");
          text(c, "×", 1, 3, 22, "#ff857e", "center");
        } else {
          line(c, 0, -f.r + 2, 4, -f.r - 5, "#a4d676", 4);
          for (var k = 0; k < 3; k++) circle(c, -6 + k * 6, 6, 1.5, "#6f3944");
        }
        c.restore();
      });
      s.bits.forEach(function (b) { c.globalAlpha = b.life / 0.6; circle(c, b.x, b.y, 3, b.col); });
      s.trail.forEach(function (b) { c.globalAlpha = b.life / 0.2; line(c, b.ax, b.ay, b.bx, b.by, "#ffe6ef", 4); });
      c.globalAlpha = 1;
      if (s.inv > 0) rect(c, 0, 48, W, H - 48, "rgba(255,83,100,0.13)");
      hud(c, s, "FRUIT STUDIO  /  SLICES", "#ffb1c5");
      finish(c, s, "Swipe through fruit · avoid bombs");
    }
  };

  function orbitTap(s) {
    if (!s.dead && s.cool <= 0) { s.ring = 1 - s.ring; s.dir *= -1; s.cool = 0.18; }
  }
  var orbit = {
    name: "Orbit", icon: "🪐", col: "#bc9cff",
    init: function (rand) {
      var s = base(rand); s.angle = -Math.PI / 2; s.dir = 1; s.ring = 0;
      s.radius = 72; s.obstacles = []; s.spawn = 1.5; s.cool = 0; s.stars = [];
      for (var n = 0; n < 60; n++) s.stars.push({ x: rng(s) * W, y: rng(s) * H, r: 0.5 + rng(s) });
      return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        s.cool = Math.max(0, s.cool - d);
        if (tapped(i, "a") || tapped(i, "u") || tapped(i, "d")) orbitTap(s);
        s.angle = (s.angle + s.dir * (1.35 + Math.min(0.5, s.t * 0.005)) * d) % TAU;
        s.radius += ((s.ring ? 110 : 72) - s.radius) * Math.min(1, d * 15);
        s.sc = Math.floor(s.t * 10);
        s.spawn -= d;
        if (s.spawn <= 0) {
          s.obstacles.push({ a: rng(s) * TAU, r: 204, size: 9 + rng(s) * 3 });
          s.spawn += Math.max(0.65, 1.5 - s.t * 0.009) + rng(s) * 0.25;
        }
        var px = Math.cos(s.angle) * s.radius, py = Math.sin(s.angle) * s.radius;
        for (var n = s.obstacles.length - 1; n >= 0; n--) {
          var o = s.obstacles[n]; o.r -= Math.min(94, 47 + s.t * 0.4) * d;
          var dx = Math.cos(o.a) * o.r - px, dy = Math.sin(o.a) * o.r - py;
          if (dx * dx + dy * dy < Math.pow(o.size + 6, 2)) s.dead = true;
          if (o.r < 39) s.obstacles.splice(n, 1);
        }
      });
    },
    down: function (s) { orbitTap(s); },
    draw: function (c, s) {
      start(c, "#160d32", "#331857");
      s.stars.forEach(function (v) { circle(c, v.x, v.y, v.r, "#a58fc9"); });
      var cx = 160, cy = 263;
      [72, 110].forEach(function (r, n) {
        c.strokeStyle = n === s.ring ? "#9574cc" : "#594272"; c.lineWidth = 1.5;
        c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
      });
      circle(c, cx, cy, 45, "#674b9a"); circle(c, cx - 10, cy - 11, 35, "#906dc2");
      circle(c, cx - 15, cy - 12, 9, "#7655a6"); circle(c, cx + 12, cy + 7, 7, "#7655a6");
      c.save(); c.translate(cx, cy); c.rotate(-0.35);
      c.strokeStyle = "#c99bea"; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 0, 57, 14, 0, 0, TAU); c.stroke(); c.restore();
      s.obstacles.forEach(function (o) {
        var x = cx + Math.cos(o.a) * o.r, y = cy + Math.sin(o.a) * o.r;
        line(c, x, y, x + Math.cos(o.a) * 20, y + Math.sin(o.a) * 20, "#ad557f", 3);
        circle(c, x, y, o.size, "#ff8fa5"); circle(c, x - 3, y - 3, 3, "#ffe0d5");
      });
      var x = cx + Math.cos(s.angle) * s.radius, y = cy + Math.sin(s.angle) * s.radius;
      circle(c, x, y, 12, "rgba(203,181,255,0.16)"); circle(c, x, y, 6, "#f4eaff");
      hud(c, s, "ORBITAL  /  SURVIVAL", "#d5bcff");
      finish(c, s, "Tap to switch rings and reverse direction");
    }
  };

  function runnerJump(s) { if (!s.dead && s.jump <= 0) s.jump = 0.72; }
  var laner = {
    name: "Laner", icon: "🏃", col: "#24e6ee",
    init: function (rand) {
      var s = base(rand); s.lane = 1; s.x = 160; s.jump = 0;
      s.items = []; s.spawn = 0.5; s.travel = 0; return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        if (tapped(i, "l")) s.lane = Math.max(0, s.lane - 1);
        if (tapped(i, "r")) s.lane = Math.min(2, s.lane + 1);
        if (tapped(i, "u") || tapped(i, "a")) runnerJump(s);
        s.x += (75 + 85 * s.lane - s.x) * Math.min(1, d * 20);
        s.jump = Math.max(0, s.jump - d);
        var speed = Math.min(380, 180 + s.t * 2.5); s.travel += speed * d;
        s.spawn -= d;
        if (s.spawn <= 0) {
          var blocked = Math.floor(rng(s) * 3);
          s.items.push({ lane: blocked, y: 54, kind: "barrier" });
          var coinLane = (blocked + 1 + Math.floor(rng(s) * 2)) % 3;
          for (var k = 0; k < 3; k++) s.items.push({ lane: coinLane, y: 54 - k * 40, kind: "coin" });
          s.spawn += Math.max(0.8, 1.4 - s.t * 0.005) + rng(s) * 0.2;
        }
        var elevation = s.jump > 0 ? Math.sin((0.72 - s.jump) / 0.72 * Math.PI) * 55 : 0;
        for (var n = s.items.length - 1; n >= 0; n--) {
          var a = s.items[n]; a.y += speed * d;
          if (Math.abs(75 + a.lane * 85 - s.x) < 30 && Math.abs(a.y - 391) < (a.kind === "coin" ? 20 : 25)) {
            if (a.kind === "coin") { s.sc += 10; s.items.splice(n, 1); }
            else if (elevation < 27) s.dead = true;
          } else if (a.y > 510) s.items.splice(n, 1);
        }
      });
    },
    up: function (s, x, y, dx, dy) { swipe(s, dx, dy, runnerJump); },
    draw: function (c, s) {
      start(c, "#06222d", "#0a454b");
      for (var n = 0; n < 8; n++) {
        var bh = 55 + (n * 29) % 100;
        rect(c, n * 44, 175 - bh, 35, bh, "#0c3442");
        for (var v = 0; v < 3; v++) rect(c, n * 44 + 8, 165 - bh + v * 19, 4, 7, "#26707c");
      }
      rect(c, 28, 184, 264, 296, "#102e3e");
      line(c, 32, 184, 32, H, "#24e6ee", 3); line(c, 288, 184, 288, H, "#24e6ee", 3);
      line(c, 117, 184, 117, H, "#267383", 1); line(c, 202, 184, 202, H, "#267383", 1);
      for (var y = 184; y < 550; y += 48) line(c, 33, y + s.travel % 48, 287, y + s.travel % 48, "#194c5d", 1);
      s.items.forEach(function (a) {
        var x = 75 + a.lane * 85;
        if (a.kind === "coin") {
          circle(c, x, a.y, 10, "#ffd861"); circle(c, x, a.y, 6, "#b77b25");
          line(c, x, a.y - 4, x, a.y + 4, "#fff0a7", 2);
        } else {
          rect(c, x - 25, a.y - 15, 50, 29, "#e06475");
          for (var k = 0; k < 3; k++) line(c, x - 20 + k * 16, a.y + 11, x - 8 + k * 16, a.y - 11, "#ffccd0", 5);
          rect(c, x - 23, a.y + 14, 5, 7, "#713f5b"); rect(c, x + 18, a.y + 14, 5, 7, "#713f5b");
        }
      });
      var z = s.jump > 0 ? Math.sin((0.72 - s.jump) / 0.72 * Math.PI) * 55 : 0;
      c.fillStyle = "rgba(0,0,0,0.35)"; c.beginPath(); c.ellipse(s.x, 410, 15, 5, 0, 0, TAU); c.fill();
      var yy = 391 - z;
      circle(c, s.x, yy - 20, 9, "#e4faf7"); rect(c, s.x - 9, yy - 10, 18, 24, "#24e6ee");
      line(c, s.x - 5, yy + 12, s.x - 8 - Math.sin(s.t * 18) * 4, yy + 23, "#dcfafa", 4);
      line(c, s.x + 5, yy + 12, s.x + 8 + Math.sin(s.t * 18) * 4, yy + 23, "#dcfafa", 4);
      hud(c, s, "NEON DASH  /  COINS", "#24e6ee");
      finish(c, s, "Swipe sideways to steer · swipe up to jump");
    }
  };

  function targetSpawn(s) {
    s.targets.push({ x: 38 + rng(s) * 244, y: 100 + rng(s) * 310, life: 0, duration: Math.max(0.64, 1.85 - s.sc * 0.006), r: 31 });
  }
  function targetTap(s, x, y) {
    if (s.dead) return;
    for (var n = s.targets.length - 1; n >= 0; n--) {
      var a = s.targets[n], r = a.r * (1 - a.life / a.duration);
      if (Math.hypot(x - a.x, y - a.y) <= Math.max(11, r)) {
        s.sc += 10; s.pop = { x: a.x, y: a.y, life: 0.3 }; s.targets.splice(n, 1);
        s.next = 0.18; return;
      }
    }
    hit(s, 0);
  }
  var reflex = {
    name: "Reflex", icon: "🎯", col: "#ffbc76",
    init: function (rand) {
      var s = base(rand, 3); s.targets = []; s.next = 0; s.pop = null;
      s.cursor = { x: 160, y: 260 }; targetSpawn(s); return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        s.cursor.x = clamp(s.cursor.x + (Number(held(i, "r")) - Number(held(i, "l"))) * 360 * d, 0, W);
        s.cursor.y = clamp(s.cursor.y + (Number(held(i, "d")) - Number(held(i, "u"))) * 360 * d, 50, 450);
        if (tapped(i, "a")) targetTap(s, s.cursor.x, s.cursor.y);
        if (s.pop) { s.pop.life -= d; if (s.pop.life <= 0) s.pop = null; }
        for (var n = s.targets.length - 1; n >= 0; n--) {
          s.targets[n].life += d;
          if (s.targets[n].life >= s.targets[n].duration) { s.targets.splice(n, 1); hit(s, 0); s.next = 0.24; }
        }
        if (!s.targets.length) { s.next -= d; if (s.next <= 0 && !s.dead) targetSpawn(s); }
      });
    },
    down: function (s, x, y) { targetTap(s, x, y); },
    draw: function (c, s) {
      start(c, "#682e42", "#aa5b55");
      for (var x = 16; x < W; x += 24) for (var y = 66; y < H; y += 24) circle(c, x, y, 1, "rgba(255,216,174,0.16)");
      circle(c, 270, 400, 130, "rgba(255,184,108,0.06)");
      s.targets.forEach(function (a) {
        var r = Math.max(0, a.r * (1 - a.life / a.duration));
        c.strokeStyle = "rgba(255,224,183,0.24)"; c.lineWidth = 1;
        c.beginPath(); c.arc(a.x, a.y, 34, 0, TAU); c.stroke();
        circle(c, a.x, a.y, r, "#ffbc76"); circle(c, a.x, a.y, r * 0.62, "#f58c6c");
        circle(c, a.x, a.y, Math.max(3, r * 0.26), "#fff2d0");
        c.strokeStyle = "#fff2d0"; c.lineWidth = 3; c.beginPath();
        c.arc(a.x, a.y, 37, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - a.life / a.duration)); c.stroke();
      });
      if (s.pop) {
        var r = 35 + (0.3 - s.pop.life) * 85;
        c.globalAlpha = s.pop.life / 0.3; c.strokeStyle = "#ffe1b0"; c.lineWidth = 3;
        c.beginPath(); c.arc(s.pop.x, s.pop.y, r, 0, TAU); c.stroke();
        text(c, "+10", s.pop.x, s.pop.y, 18, "#fff2d0", "center"); c.globalAlpha = 1;
      }
      hud(c, s, "QUICK GLOW  /  TARGETS", "#ffdbac");
      finish(c, s, "Tap the glow before it fades");
    }
  };

  function neighbors(index, fn) {
    var x = index % 8, y = Math.floor(index / 8);
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var xx = x + dx, yy = y + dy;
      if ((dx || dy) && xx >= 0 && xx < 8 && yy >= 0 && yy < 8) fn(yy * 8 + xx);
    }
  }
  function layMines(s, first) {
    var excluded = {}; excluded[first] = true;
    neighbors(first, function (n) { excluded[n] = true; });
    var choices = [];
    for (var n = 0; n < 64; n++) if (!excluded[n]) choices.push(n);
    for (var k = choices.length - 1; k > 0; k--) {
      var j = Math.floor(rng(s) * (k + 1)), tmp = choices[k]; choices[k] = choices[j]; choices[j] = tmp;
    }
    for (var m = 0; m < 10; m++) s.cells[choices[m]].mine = true;
    s.cells.forEach(function (cell, index) {
      neighbors(index, function (n) { if (s.cells[n].mine) cell.n++; });
    });
    s.started = true;
  }
  function reveal(s, index) {
    if (s.dead || index < 0 || index >= 64 || s.cells[index].open) return;
    if (!s.started) layMines(s, index);
    if (s.cells[index].mine) { s.cells[index].open = true; s.exploded = index; s.dead = true; return; }
    var queue = [index];
    while (queue.length) {
      var n = queue.pop(), cell = s.cells[n];
      if (cell.open || cell.mine) continue;
      cell.open = true; s.revealed++; s.sc = s.revealed * 10;
      if (!cell.n) neighbors(n, function (nn) { if (!s.cells[nn].open && !s.cells[nn].mine) queue.push(nn); });
    }
    if (s.revealed === 54) { s.won = true; s.dead = true; }
  }
  var minefield = {
    name: "Minefield", icon: "💣", col: "#8ecbff",
    init: function (rand) {
      var s = base(rand); s.cells = []; s.started = false; s.revealed = 0; s.cursor = 27; s.exploded = -1;
      for (var n = 0; n < 64; n++) s.cells.push({ mine: false, open: false, n: 0 });
      return s;
    },
    step: function (s, input, dt) {
      advance(s, input, dt, function (s, i, d) {
        var x = s.cursor % 8, y = Math.floor(s.cursor / 8);
        if (tapped(i, "l")) x = Math.max(0, x - 1);
        if (tapped(i, "r")) x = Math.min(7, x + 1);
        if (tapped(i, "u")) y = Math.max(0, y - 1);
        if (tapped(i, "d")) y = Math.min(7, y + 1);
        s.cursor = y * 8 + x;
        if (tapped(i, "a")) reveal(s, s.cursor);
      });
    },
    down: function (s, x, y) {
      if (x >= 16 && x < 304 && y >= 104 && y < 392) {
        var index = Math.floor((y - 104) / 36) * 8 + Math.floor((x - 16) / 36);
        s.cursor = index; reveal(s, index);
      }
    },
    draw: function (c, s) {
      start(c, "#122d45", "#245673");
      for (var y = 56; y < H; y += 16) line(c, 0, y, W, y, "rgba(142,203,255,0.045)", 1);
      for (var x = 0; x < W; x += 16) line(c, x, 48, x, H, "rgba(142,203,255,0.045)", 1);
      text(c, "10 MINES  ·  " + s.revealed + "/54 SAFE", 160, 77, 12, "#b6dbef", "center");
      rect(c, 12, 100, 296, 296, "#0d263c");
      var colors = ["", "#4293bd", "#318876", "#c7745e", "#8e67ad", "#b08735", "#348e9c", "#485978", "#596e76"];
      s.cells.forEach(function (cell, n) {
        var x = 16 + (n % 8) * 36, y = 104 + Math.floor(n / 8) * 36;
        rect(c, x + 1, y + 1, 34, 34, cell.open ? "#d5e7e8" : "#386780");
        if (!cell.open) {
          rect(c, x + 2, y + 2, 32, 3, "#6091a8"); rect(c, x + 2, y + 31, 32, 3, "#244d67");
        }
        if (cell.mine && (cell.open || s.dead)) {
          if (n === s.exploded) rect(c, x + 1, y + 1, 34, 34, "#e2837c");
          circle(c, x + 18, y + 18, 8, "#253d51");
          line(c, x + 6, y + 18, x + 30, y + 18, "#253d51", 2);
          line(c, x + 18, y + 6, x + 18, y + 30, "#253d51", 2);
          circle(c, x + 15, y + 15, 2, "#d4e6e9");
        } else if (cell.open && cell.n) text(c, cell.n, x + 18, y + 19, 20, colors[cell.n], "center");
        if (n === s.cursor && !s.dead) {
          c.strokeStyle = "#c1e6fc"; c.lineWidth = 2; c.strokeRect(x + 3, y + 3, 30, 30);
        }
      });
      text(c, s.started ? "Read the numbers. Choose your next cell." : "Your first tap opens a safe area.", 160, 420, 11, "#b6dbef", "center");
      hud(c, s, "BLUEPRINT  /  SAFE CELLS", "#8ecbff");
      if (s.dead) {
        rect(c, 0, 438, W, 42, "rgba(4,18,33,0.85)");
        text(c, (s.won ? "FIELD CLEARED" : "MINE HIT") + "  ·  " + s.sc, 160, 459, 16, "#ffffff", "center");
        c.restore();
      } else finish(c, s, "Tap a cell to reveal it");
    }
  };
  return {
    spaceinvaders: spaceinvaders, traffic: traffic, hopper: hopper, slicer: slicer,
    orbit: orbit, laner: laner, reflex: reflex, minefield: minefield
  };
})();
Object.assign(ARC, ARC3);
