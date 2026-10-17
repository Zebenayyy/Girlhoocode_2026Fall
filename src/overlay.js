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
    ctx.fillText(b.label, b.x, b.y + b.r * 1.25 + unit * 0.03);
  }

  // state: { t, targets, hoveredId, progress (0..1), cursor: { x, y, visible } }
  function draw({ t, targets, hoveredId, progress, cursor }) {
    ctx.clearRect(0, 0, w, h);

    for (const tg of targets) {
      const hovered = tg.id === hoveredId;
      if (tg.kind === 'beacon') {
        drawBeacon(tg, t, hovered);
      } else {
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

    if (cursor.visible) {
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

  // The target under a screen point, if any. Beacons get priority.
  function hitTest(targets, x, y) {
    let best = null, bestD = Infinity;
    for (const tg of targets) {
      const d = Math.hypot(x - tg.x, y - tg.y);
      const reach = tg.r * (tg.kind === 'beacon' ? 1.4 : 1.2);
      if (d < reach && (tg.kind === 'beacon' || d < bestD)) {
        if (tg.kind === 'beacon') return tg;
        best = tg;
        bestD = d;
      }
    }
    return best;
  }

  return { draw, hitTest };
}
