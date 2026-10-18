// 2D layer on top of the 3D scene: the hand cursor, the hold-to-select ring,
// a pulsing ring around whatever you can point at, and the "next" beacon.

const TAU = Math.PI * 2;

export function createOverlay(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, unit = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    unit = Math.min(w, h);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function drawBeacon(b, t, hovered) {
    const pulse = 1 + 0.08 * Math.sin(t * 3);
    glow(b.x, b.y, b.r * 1.6 * pulse, 'rgba(255,200,90,0.45)');
    glow(b.x, b.y, b.r * 0.6, 'rgba(255,240,200,0.95)');
    ctx.strokeStyle = hovered ? 'rgba(255,230,160,1)' : 'rgba(255,220,140,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * pulse, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#fff3d6';
    ctx.font = `600 ${Math.round(unit * 0.03)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(b.label, b.x, b.y + b.r * 1.15 + unit * 0.024);
  }

  // tractor beam from the ship's nose (bottom center) to a piece of junk being pulled in
  function drawBeam(p, t) {
    const x0 = w * 0.5, y0 = h * 0.86;
    const g = ctx.createLinearGradient(x0, y0, p.x, p.y);
    g.addColorStop(0, 'rgba(120,255,200,0.7)');
    g.addColorStop(1, 'rgba(120,255,200,0.15)');
    ctx.strokeStyle = g;
    ctx.lineCap = 'round';
    for (const [width, alpha] of [[unit * 0.03, 0.25], [unit * 0.008, 0.9]]) {
      ctx.globalAlpha = alpha * (0.8 + 0.2 * Math.sin(t * 30));
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // tutorial arrow: a gently curved, animated dashed line with an arrowhead at `to`
  function drawArrow({ from, to, alpha }, t) {
    if (alpha <= 0) return;
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 10) return;
    // bend the curve sideways a little
    const cx = (from.x + to.x) / 2 - dy * 0.18;
    const cy = (from.y + to.y) / 2 + dx * 0.18;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = Math.max(2, unit * 0.004);
    ctx.setLineDash([unit * 0.014, unit * 0.01]);
    ctx.lineDashOffset = -t * unit * 0.05;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(cx, cy, to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead along the curve's final direction
    const a = Math.atan2(to.y - cy, to.x - cx);
    const s = unit * 0.022;
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - Math.cos(a - 0.45) * s, to.y - Math.sin(a - 0.45) * s);
    ctx.lineTo(to.x - Math.cos(a + 0.45) * s, to.y - Math.sin(a + 0.45) * s);
    ctx.closePath();
    ctx.fill();
    // a small pulsing dot where the arrow points
    ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(t * 4));
    ctx.beginPath();
    ctx.arc(to.x, to.y, unit * 0.008, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // state: { t, targets, hoveredId, progress (0..1), cursor: { x, y, visible }, beams: [{ x, y }], arrows }
  function draw({ t, targets, hoveredId, progress, cursor, beams = [], arrows = [] }) {
    ctx.clearRect(0, 0, w, h);

    arrows.forEach((a) => drawArrow(a, t));
    beams.forEach((b) => drawBeam(b, t));

    for (const tg of targets) {
      const hovered = tg.id === hoveredId;
      if (tg.kind === 'beacon') {
        drawBeacon(tg, t, hovered);
      } else if (tg.kind === 'junk') {
        // collectible: a green targeting bracket
        const r = tg.r * (1.05 + 0.05 * Math.sin(t * 4));
        ctx.strokeStyle = hovered ? 'rgba(140,255,200,1)' : 'rgba(140,255,200,0.6)';
        ctx.lineWidth = hovered ? 3 : 2;
        for (let k = 0; k < 4; k++) {
          const a = k * (Math.PI / 2) + Math.PI / 4 + t * 0.6;
          ctx.beginPath();
          ctx.arc(tg.x, tg.y, r, a - 0.35, a + 0.35);
          ctx.stroke();
        }
      } else {
        if (tg.quiet && !hovered) continue; // e.g. the solar system: rings only on the one you point at
        if (hovered && tg.label) {
          ctx.fillStyle = '#fff2d0';
          ctx.font = `600 ${Math.round(unit * 0.026)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 8;
          ctx.fillText(tg.label, tg.x, tg.y + tg.r * 1.3 + unit * 0.035);
          ctx.shadowBlur = 0;
        }
        // invite: a soft pulsing ring around the object you can point at
        const pulse = 1.15 + 0.06 * Math.sin(t * 2.5);
        ctx.strokeStyle = hovered ? 'rgba(255,220,140,0.95)' : 'rgba(255,255,255,0.35)';
        ctx.lineWidth = hovered ? 3 : 1.5;
        ctx.setLineDash(hovered ? [] : [6, 8]);
        ctx.beginPath();
        ctx.arc(tg.x, tg.y, tg.r * pulse, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (cursor.visible && cursor.grab) {
      // pinching: a blue "grab" ring instead of the pointer
      glow(cursor.x, cursor.y, unit * 0.04, 'rgba(120,210,255,0.8)');
      ctx.strokeStyle = '#8ce8ff';
      ctx.lineWidth = unit * 0.005;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, unit * 0.025, 0, TAU);
      ctx.stroke();
    } else if (cursor.visible) {
      if (progress > 0) {
        ctx.strokeStyle = '#ffd36b';
        ctx.lineWidth = unit * 0.008;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, unit * 0.035, -Math.PI / 2, -Math.PI / 2 + progress * TAU);
        ctx.stroke();
      }
      glow(cursor.x, cursor.y, unit * 0.03, 'rgba(255,220,140,0.9)');
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, unit * 0.007, 0, TAU);
      ctx.fill();
    }
  }

  // The target under a screen point, if any. Beacons win, then junk, then objects (closest first).
  const PRIORITY = { beacon: 0, junk: 1, object: 2 };
  function hitTest(targets, x, y) {
    let best = null, bestKey = Infinity;
    for (const tg of targets) {
      const d = Math.hypot(x - tg.x, y - tg.y);
      const reach = tg.r * (tg.kind === 'object' ? 1.2 : 1.4);
      if (d >= reach) continue;
      const key = PRIORITY[tg.kind] * 1e6 + d;
      if (key < bestKey) { best = tg; bestKey = key; }
    }
    return best;
  }

  return { draw, hitTest };
}
