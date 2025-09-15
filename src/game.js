(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false; // crisp pixel art, avoids 1px seams
  HUD.init(canvas, ctx);

  // ---------------------------------
  // Constants
  // ---------------------------------
  const W = canvas.width;
  const H = canvas.height;
  const FLOOR_Y = H - 30; // HUD floor line (visual only)
  const CEIL_Y = 30;
  const PLAYER_X = 80;

  // --- Ghost animation ---
  const PLAYER_SIZE = 48;
  const ANIM_DELAY = 100;

  // ---------------------------------
  // Assets: Ghost
  // ---------------------------------
  const ghostFrames = [];
  let loadedCount = 0;
  const TOTAL_FRAMES = 6;
  let ghostReady = false;

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = `assets/LittleGhost/frame_${i}.png`;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) ghostReady = true;
    };
    img.onerror = () => {
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) ghostReady = true;
    };
    ghostFrames.push(img);
  }

  let animFrame = 0;
  let animAccMs = 0;

  // ---------------------------------
  // Assets: Pillars
  // ---------------------------------
  const pillarBodies = [];
  const pillarCap = new Image();
  let pillarsReady = false;

  (function preloadPillars() {
    const body1 = new Image();
    const body2 = new Image();
    body1.src = "assets/Pillars/Bot_01.png";
    body2.src = "assets/Pillars/Bot_02.png";
    pillarCap.src = "assets/Pillars/Top.png";

    let count = 0;
    const need = 3;
    const done = () => { if (++count === need) pillarsReady = true; };

    body1.onload = done; body1.onerror = done;
    body2.onload = done; body2.onerror = done;
    pillarCap.onload = done; pillarCap.onerror = done;

    pillarBodies.push(body1, body2);
  })();

  // ---------------------------------
  // Physics & tuning
  // ---------------------------------
  const GRAVITY = 1800;
  const FLIP_BOUNCE = -180;
  const SPEED_START = 220;
  const SPEED_RAMP = 22;
  const SPAWN_MIN = 1.0;
  const SPAWN_MAX = 1.4;

  // Visual pillar width (art will be scaled to this)
  const PILLAR_W = 26;

  // Gap & lips
  const GAP_MIN = 120;
  const GAP_MAX = 150;
  const LIP = 12;

  // ---------------------------------
  // Game state
  // ---------------------------------
  let running = false;
  let paused = false;
  let over = false;
  let score = 0;
  let high = Number(localStorage.getItem("flip_high") || "0");

  const state = {
    speed: SPEED_START,
    spawnIn: Utils.rand(SPAWN_MIN, SPAWN_MAX),
    gravitySign: 1,
    player: { x: PLAYER_X, y: FLOOR_Y - PLAYER_SIZE, vy: 0 },
    pillars: [] // each: { x,y,w,h,isTop }
  };

  // ---------------------------------
  // Spawning (snap to integers; bottom goes to true canvas bottom H)
  // ---------------------------------
  function spawnPillars() {
    const gap = Utils.rand(GAP_MIN, GAP_MAX);
    const gapTop = Utils.rand(CEIL_Y + LIP, FLOOR_Y - LIP - gap);
    const x = W + 40;

    const xI = Math.round(x);
    const wI = Math.round(PILLAR_W);

    const gapTopI = Math.round(gapTop);
    const bottomYI = Math.round(gapTop + gap);

    // Top pillar: canvas top -> gap
    const topH = Math.max(0, gapTopI);
    if (topH > 0) {
      state.pillars.push({ x: xI, y: 0, w: wI, h: topH, isTop: true });
    }

    // Bottom pillar: gap -> canvas true bottom (H), not FLOOR_Y
    const bottomH = Math.max(0, Math.round(H - bottomYI));
    if (bottomH > 0) {
      state.pillars.push({ x: xI, y: bottomYI, w: wI, h: bottomH, isTop: false });
    }
  }

  // ---------------------------------
  // Lifecycle / control
  // ---------------------------------
  function reset() {
    running = true;
    paused = false;
    over = false;
    score = 0;
    state.speed = SPEED_START;
    state.spawnIn = Utils.rand(SPAWN_MIN, SPAWN_MAX);
    state.gravitySign = 1;
    state.player.x = PLAYER_X;
    state.player.y = FLOOR_Y - PLAYER_SIZE;
    state.player.vy = 0;
    state.pillars.length = 0;

    animFrame = 0;
    animAccMs = 0;
  }

  function flipGravity() {
    if (!running || paused || over) return;
    state.gravitySign *= -1;
    state.player.vy = FLIP_BOUNCE * state.gravitySign;
  }

  function gameOver() {
    over = true;
    running = false;
    high = Math.max(high, Math.floor(score));
    localStorage.setItem("flip_high", String(high));
  }

  // ---------------------------------
  // Update
  // ---------------------------------
  function update(dt) {
    // Speed and score
    state.speed += SPEED_RAMP * dt;
    score += (state.speed / 160) * dt;

    // Player physics
    state.player.vy += GRAVITY * state.gravitySign * dt;
    state.player.y += state.player.vy * dt;

    const floorY = FLOOR_Y - PLAYER_SIZE;
    if (state.gravitySign > 0 && state.player.y > floorY) {
      state.player.y = floorY;
      state.player.vy = 0;
    } else if (state.gravitySign < 0 && state.player.y < CEIL_Y) {
      state.player.y = CEIL_Y;
      state.player.vy = 0;
    }

    // Pillars
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnPillars();
      state.spawnIn = Utils.rand(SPAWN_MIN, SPAWN_MAX);
    }
    for (const p of state.pillars) {
      p.x -= state.speed * dt;
    }

    const before = state.pillars.length;
    state.pillars = state.pillars.filter(p => p.x + p.w > -5);
    if (state.pillars.length < before) score += 0.5;

    // Collision detection
    for (const p of state.pillars) {
      if (Utils.collide(state.player.x, state.player.y, PLAYER_SIZE, PLAYER_SIZE, p.x, p.y, p.w, p.h)) {
        gameOver();
        break;
      }
    }

    if (state.player.y < 0 || state.player.y > H - PLAYER_SIZE) {
      gameOver();
    }

    // Animation update
    if (running && !paused && !over && ghostReady) {
      animAccMs += dt * 1000;
      while (animAccMs >= ANIM_DELAY) {
        animAccMs -= ANIM_DELAY;
        animFrame = (animFrame + 1) % TOTAL_FRAMES;
      }
    }
  }

  // ---------------------------------
  // Drawing helpers
  // ---------------------------------
  function drawPlayer() {
    const x = state.player.x;
    const y = state.player.y;

    if (ghostReady) {
      const img = ghostFrames[animFrame];

      if (state.gravitySign < 0) {
        ctx.save();
        ctx.translate(x + PLAYER_SIZE / 2, y + PLAYER_SIZE / 2);
        ctx.scale(1, -1);
        ctx.drawImage(
          img,
          -PLAYER_SIZE / 2, -PLAYER_SIZE / 2,
          PLAYER_SIZE, PLAYER_SIZE
        );
        ctx.restore();
      } else {
        ctx.drawImage(img, x, y, PLAYER_SIZE, PLAYER_SIZE);
      }
    } else {
      ctx.fillStyle = "#eee";
      Utils.roundRect(ctx, x, y, PLAYER_SIZE, PLAYER_SIZE, 6);
      ctx.fill();
    }
  }

  // Draw pillar body + cap (local y=0 is the gap edge for both pillars)
  function drawPillarBodyAndCap(ctx, bodyA, bodyB, cap, p, segHf, capHf) {
    const capH = Math.max(1, Math.round(capHf));
    const segH = Math.max(1, Math.round(segHf));
    const W    = Math.round(p.w);
    const bodyH = Math.max(0, Math.round(p.h) - capH);

    // Cap sits at the top in local coords (toward the gap)
    ctx.drawImage(cap, 0, 0, W, capH);

    // Tile the body to fill EXACTLY down to p.h
    let yOff = capH;
    const endY = capH + bodyH;
    let i = 0;

    while (yOff + segH <= endY) {
      ctx.drawImage((i % 2 ? bodyB : bodyA), 0, yOff, W, segH);
      yOff += segH; i++;
    }

    const remain = endY - yOff;
    if (remain > 0) {
      const lastH = Math.ceil(remain);
      ctx.drawImage((i % 2 ? bodyB : bodyA), 0, yOff, W, lastH);
      yOff += lastH;
    }
  }

  function drawPillar(p) {
    if (!pillarsReady) {
      ctx.fillStyle = "#49d";
      Utils.roundRect(ctx, p.x, p.y, p.w, p.h, 6);
      ctx.fill();
      return;
    }

    const bodyA = pillarBodies[0];
    const bodyB = pillarBodies[1];
    const cap   = pillarCap;

    const srcBodyW = bodyA.width || p.w;
    const srcBodyH = bodyA.height || p.h;
    const srcCapH  = cap.height  || p.h;

    const scale = p.w / srcBodyW;
    const segH  = srcBodyH * scale;
    const capH  = srcCapH  * scale;

    ctx.save();
    if (p.isTop) {
      // Flip so local y=0 aligns to the gap; translate snapped to ints
      ctx.translate(Math.round(p.x), Math.round(p.y + p.h));
      ctx.scale(1, -1);
      drawPillarBodyAndCap(ctx, bodyA, bodyB, cap, p, segH, capH);
    } else {
      // Bottom pillar: translate first; local y=0 is the gap edge
      ctx.translate(Math.round(p.x), Math.round(p.y));
      drawPillarBodyAndCap(ctx, bodyA, bodyB, cap, p, segH, capH);
    }
    ctx.restore();
  }

  // ---------------------------------
  // Draw
  // ---------------------------------
  function draw() {
    HUD.drawBackground();
    HUD.drawBounds(CEIL_Y, FLOOR_Y);

    for (const p of state.pillars) drawPillar(p);

    drawPlayer();
    HUD.drawScore(score, high);

    if (!running && !over) HUD.drawCenterText("Press Space or Start to Play");
    if (paused) HUD.drawCenterText("Paused");
    if (over) HUD.drawCenterText("Crashed — Press Space or R to Restart");
  }

  // ---------------------------------
  // Game loop
  // ---------------------------------
  let last = performance.now();
  function loop(now = performance.now()) {
    if (running && !paused) {
      const dt = Math.min((now - last) / 1000, 0.033);
      update(dt);
    }
    last = now;
    draw();
    requestAnimationFrame(loop);
  }

  // ---------------------------------
  // Input
  // ---------------------------------
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === " ") {
      e.preventDefault();
      if (!running || over) reset();
      else flipGravity();
    } else if (k === "p" && running && !over) {
      paused = !paused;
    } else if (k === "r") {
      reset();
    }
  });

  canvas.addEventListener("pointerdown", () => {
    if (!running || over) reset();
    else flipGravity();
  });

  document.getElementById("start").onclick = () => { if (!running || over) reset(); };
  document.getElementById("pause").onclick = () => { if (running && !over) paused = !paused; };
  document.getElementById("restart").onclick = () => reset();

  requestAnimationFrame(loop);
})();
