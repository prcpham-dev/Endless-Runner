const rand = (a, b) => Math.random() * (b - a) + a;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const collide = (
  ax, ay, aw, ah, bx, by, bw, bh,
  offsetL = 4, offsetR = 0, offsetT = 0, offsetB = 4) =>
  (ax + offsetL) < (bx + bw) &&        // left side
  (ax + aw - offsetR) > bx &&          // right side
  (ay + offsetT) < (by + bh) &&        // top side
  (ay + ah - offsetB) > by;            // bottom side

const roundRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
}

const Utils = { rand, clamp, collide, roundRect };
