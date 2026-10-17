// Draws the starfield and every sky object onto a 2D canvas.

const TAU = Math.PI * 2;

export function createSky(canvas, objects) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, unit = 0;
  let stars = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    unit = Math.min(w, h);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((w * h) / 2500) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      phase: Math.random() * TAU,
      speed: 0.5 + Math.random() * 1.5,
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  // Screen-space position and radius of an object.
  function place(o) {
    return { x: o.x * w, y: o.y * h, r: o.size * unit };
  }

  function glow(x, y, r, color, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function disc(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  const painters = {
    sun(x, y, r, t) {
      glow(x, y, r * 2.2, 'rgba(255,170,40,0.55)', 0.8 + 0.2 * Math.sin(t * 1.5));
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, '#fff6c2');
      g.addColorStop(0.6, '#ffc23d');
      g.addColorStop(1, '#ff8a1f');
      disc(x, y, r, g);
    },
    moon(x, y, r) {
      glow(x, y, r * 1.6, 'rgba(200,210,230,0.25)');
      disc(x, y, r, '#c9ccd4');
      for (const [dx, dy, s] of [[-0.3, -0.2, 0.22], [0.35, 0.1, 0.16], [-0.05, 0.4, 0.12], [0.1, -0.45, 0.1]]) {
        disc(x + dx * r, y + dy * r, s * r, '#a6aab4');
      }
    },
    earth(x, y, r) {
      glow(x, y, r * 1.5, 'rgba(90,160,255,0.4)');
      disc(x, y, r, '#2e6fd8');
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.clip();
      for (const [dx, dy, s] of [[-0.35, -0.25, 0.4], [0.3, 0.3, 0.35], [0.45, -0.4, 0.2]]) {
        disc(x + dx * r, y + dy * r, s * r, '#3fa35a');
      }
      disc(x - r * 0.1, y - r * 0.95, r * 0.35, '#eef4ff');
      ctx.restore();
    },
    pluto(x, y, r) {
      glow(x, y, r * 1.6, 'rgba(230,200,170,0.25)');
      disc(x, y, r, '#c79a74');
      disc(x + r * 0.2, y + r * 0.15, r * 0.38, '#f0dcc4'); // the "heart"
    },
    comet(x, y, r, t) {
      const angle = -0.5;
      const tail = r * 5;
      const tx = x - Math.cos(angle) * tail;
      const ty = y - Math.sin(angle) * tail;
      const g = ctx.createLinearGradient(x, y, tx, ty);
      g.addColorStop(0, 'rgba(180,230,255,0.8)');
      g.addColorStop(1, 'rgba(180,230,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      const nx = Math.sin(angle) * r * 0.7, ny = -Math.cos(angle) * r * 0.7;
      ctx.moveTo(x + nx, y + ny);
      ctx.lineTo(tx, ty);
      ctx.lineTo(x - nx, y - ny);
      ctx.fill();
      glow(x, y, r * 1.4, 'rgba(200,240,255,0.9)', 0.85 + 0.15 * Math.sin(t * 3));
      disc(x, y, r * 0.35, '#ffffff');
    },
    nebula(x, y, r, t) {
      glow(x - r * 0.3, y, r * 1.6, 'rgba(220,60,90,0.55)');
      glow(x + r * 0.5, y - r * 0.3, r * 1.2, 'rgba(255,120,80,0.4)', 0.8 + 0.2 * Math.sin(t * 0.7));
      // a dark, horse-head-ish silhouette
      ctx.fillStyle = '#08040c';
      ctx.beginPath();
      ctx.moveTo(x - r * 0.2, y + r * 1.0);
      ctx.quadraticCurveTo(x - r * 0.35, y + r * 0.1, x - r * 0.05, y - r * 0.35);
      ctx.quadraticCurveTo(x + r * 0.1, y - r * 0.7, x + r * 0.3, y - r * 0.5);
      ctx.quadraticCurveTo(x + r * 0.55, y - r * 0.2, x + r * 0.45, y + r * 0.05);
      ctx.quadraticCurveTo(x + r * 0.2, y + r * 0.0, x + r * 0.2, y + r * 0.35);
      ctx.quadraticCurveTo(x + r * 0.25, y + r * 0.7, x + r * 0.4, y + r * 1.0);
      ctx.fill();
    },
    andromeda(x, y, r) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.6);
      ctx.scale(1, 0.4);
      glow(0, 0, r * 1.7, 'rgba(170,160,255,0.7)');
      glow(0, 0, r * 1.1, 'rgba(230,220,255,0.85)');
      glow(0, 0, r * 0.45, 'rgba(255,250,230,1)');
      ctx.restore();
    },
    pulsar(x, y, r, t) {
      const a = t * 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      for (const dir of [1, -1]) {
        const g = ctx.createLinearGradient(0, 0, 0, dir * r * 2.5);
        g.addColorStop(0, 'rgba(140,200,255,0.9)');
        g.addColorStop(1, 'rgba(140,200,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-r * 0.35, dir * r * 2.5);
        ctx.lineTo(r * 0.35, dir * r * 2.5);
        ctx.fill();
      }
      ctx.restore();
      glow(x, y, r * 0.9, 'rgba(200,230,255,0.9)', 0.6 + 0.4 * Math.abs(Math.sin(a)));
      disc(x, y, r * 0.22, '#ffffff');
    },
    spiral(x, y, r, t) {
      glow(x, y, r * 1.3, 'rgba(120,150,255,0.25)');
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.6);
      ctx.rotate(t * 0.1);
      ctx.fillStyle = 'rgba(220,230,255,0.85)';
      for (let arm = 0; arm < 2; arm++) {
        for (let i = 0; i < 60; i++) {
          const k = i / 60;
          const ang = arm * Math.PI + k * 3 * Math.PI;
          const d = k * r;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * d, Math.sin(ang) * d, (1 - k) * r * 0.05 + 0.8, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
      glow(x, y, r * 0.35, 'rgba(255,245,220,1)');
    },
    stars(x, y, r, t) {
      // O B A F G K M: hottest (blue) to coolest (red)
      const colors = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffd2a1', '#ffcc6f'];
      colors.forEach((c, i) => {
        const ang = (i / colors.length) * TAU + 0.3;
        const d = i === 3 ? 0 : r * 0.65;
        const sx = x + Math.cos(ang) * d, sy = y + Math.sin(ang) * d;
        const tw = 0.75 + 0.25 * Math.sin(t * 2 + i);
        glow(sx, sy, r * 0.35, c, tw);
        disc(sx, sy, r * 0.08, c);
      });
    },
  };

  function drawStarfield(t) {
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawLabel(o, p, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#dfe6ff';
    ctx.font = `${Math.round(unit * 0.022)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(o.name, p.x, p.y + p.r + unit * 0.04);
    ctx.globalAlpha = 1;
  }

  // state: { hoveredId, selectedId, progress (0..1), cursor: {x, y, visible}, idle }
  function draw(t, state) {
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, w, h);
    drawStarfield(t);

    for (const o of objects) {
      const p = place(o);
      const active = o.id === state.hoveredId || o.id === state.selectedId;
      // gentle "breathing" when nobody is pointing, to invite people in
      const pulse = state.idle ? 1 + 0.06 * Math.sin(t * 1.2 + o.x * 10) : 1;
      painters[o.type](p.x, p.y, p.r * pulse * (active ? 1.12 : 1), t);
      drawLabel(o, p, active ? 1 : 0.55);

      if (o.id === state.selectedId) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 1.45, 0, TAU);
        ctx.stroke();
      }
    }

    const c = state.cursor;
    if (c.visible) {
      // dwell ring
      if (state.progress > 0) {
        ctx.strokeStyle = '#ffd36b';
        ctx.lineWidth = unit * 0.008;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(c.x, c.y, unit * 0.035, -Math.PI / 2, -Math.PI / 2 + state.progress * TAU);
        ctx.stroke();
      }
      glow(c.x, c.y, unit * 0.03, 'rgba(255,220,140,0.9)');
      disc(c.x, c.y, unit * 0.007, '#ffffff');
    }
  }

  // Which object (if any) is at screen point (x, y). Hit areas are generous on purpose.
  function hitTest(x, y) {
    let best = null, bestD = Infinity;
    for (const o of objects) {
      const p = place(o);
      const d = Math.hypot(x - p.x, y - p.y);
      const reach = Math.max(p.r * 1.4, unit * 0.07);
      if (d < reach && d < bestD) { best = o; bestD = d; }
    }
    return best;
  }

  return { draw, hitTest, place, size: () => ({ w, h }) };
}
