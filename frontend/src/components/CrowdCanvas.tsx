import { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material';

/**
 * A crowd of simple line-drawn people in side view (head in profile, shoulders, swinging arm), seen from the
 * belly up and walking along the bottom of the canvas. Outlines only: no colour fills, the page shows through.
 * A few of them (`greenShare`) are drawn with a green line: the residents who already use Buildy.
 * Everything is drawn in code, facing right; people walking left are mirrored.
 */

interface CrowdCanvasProps {
  count?: number;
  /** Share of the crowd (0..1) drawn with a green line. */
  greenShare?: number;
  height?: number | string;
}

const MEN_HAIR = ['short', 'short', 'quiff', 'bald', 'short'] as const;
const WOMEN_HAIR = ['ponytail', 'long', 'bun', 'bob', 'ponytail', 'long'] as const;
const SHIRTS = ['white', 'white', 'black', 'dots', 'stripes', 'black'] as const;
const HATS = ['none', 'none', 'none', 'none', 'none', 'cap', 'beanie'] as const;

export interface Person {
  x: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  size: number; // visible height from belly to top of head, px
  drop: number; // how far the belly line sits below the bottom edge (shorter people sit lower)
  female: boolean;
  hair: (typeof MEN_HAIR)[number] | (typeof WOMEN_HAIR)[number];
  shirt: (typeof SHIRTS)[number];
  hat: (typeof HATS)[number];
  glasses: boolean;
  build: number; // body width factor
  mouth: 'smile' | 'neutral';
  happyEyes: boolean;
  green: boolean;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: readonly T[]) => list[(Math.random() * list.length) | 0];

export function makePerson(x: number, greenShare = 0.2): Person {
  const female = Math.random() < 0.5;
  const hat = pick(HATS);
  return {
    x,
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: rand(60, 115),
    phase: rand(0, Math.PI * 2),
    size: rand(150, 215),
    drop: rand(0, 26),
    female,
    hair: female ? pick(WOMEN_HAIR) : pick(MEN_HAIR),
    shirt: pick(SHIRTS),
    hat,
    glasses: Math.random() < 0.22,
    build: female ? rand(0.86, 1.0) : rand(1.0, 1.18),
    mouth: Math.random() < 0.7 ? 'smile' : 'neutral',
    happyEyes: Math.random() < 0.15,
    green: Math.random() < greenShare,
  };
}

export interface Colors {
  ink: string;
  bg: string;
  green: string;
}

/**
 * Draws one person with the belly line at (p.x, baseY), facing right (or left when p.dir is -1).
 * Style: clean black line, white or solid black clothes, solid black hair, tiny dot eyes.
 */
export function drawPerson(ctx: CanvasRenderingContext2D, p: Person, t: number, baseY: number, c: Colors) {
  const u = p.size / 7.4;
  const line = p.green ? c.green : c.ink; // "black" parts of a green person are green
  const white = c.bg;
  const omega = 4.5 + p.speed / 22;
  const beat = t * omega + p.phase;
  const swing = Math.sin(beat);
  const bob = Math.abs(Math.cos(beat)) * u * 0.18;
  const W = p.build;
  const solidShirt = p.shirt === 'black';
  const shirtFill = solidShirt ? line : white;

  ctx.save();
  ctx.translate(p.x, baseY - bob);
  ctx.scale(p.dir, 1); // everything below faces right
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.8, u * 0.1);
  ctx.strokeStyle = line;
  ctx.fillStyle = white;

  /** Closed shape: filled (white hides what is behind, or solid) and outlined. */
  const shape = (build: () => void, fill = white) => {
    ctx.beginPath();
    build();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };
  const stroke = (build: () => void) => {
    ctx.beginPath();
    build();
    ctx.stroke();
  };

  /** An arm hanging from a shoulder, swinging along the walking direction, with a bent elbow and a small hand. */
  const arm = (side: -1 | 1, s: number) => {
    const sx = side * u * 1.28 * W;
    const sy = -u * 3.55;
    const a1 = s * 0.4;
    const a2 = a1 + 0.12 + Math.max(0, s) * 0.5;
    const ex = sx + Math.sin(a1) * u * 1.9;
    const ey = sy + Math.cos(a1) * u * 1.9;
    const hx = ex + Math.sin(a2) * u * 1.8;
    const hy = ey + Math.cos(a2) * u * 1.8;
    const w = u * 0.9 * Math.min(W, 1.1);
    const segs = [
      [sx, sy, ex, ey],
      [ex, ey, hx, hy],
    ];
    const base = Math.max(1.8, u * 0.1);
    ctx.lineCap = 'round';
    ctx.strokeStyle = line;
    ctx.lineWidth = w + base;
    for (const [x0, y0, x1, y1] of segs) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.strokeStyle = shirtFill;
    ctx.lineWidth = w;
    for (const [x0, y0, x1, y1] of segs) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.lineWidth = base;
    ctx.strokeStyle = line;
    shape(() => ctx.arc(hx + Math.sin(a2) * u * 0.3, hy + Math.cos(a2) * u * 0.3, u * 0.3, 0, Math.PI * 2));
  };

  ctx.save();
  arm(-1, -swing); // the arm on the far side, behind the body

  // torso, three-quarter view: wide sloping shoulders, loose shirt, running well below the cut
  shape(() => {
    ctx.moveTo(-u * 1.4 * W, u * 4);
    ctx.lineTo(-u * 1.5 * W, -u * 2.8);
    ctx.bezierCurveTo(-u * 1.5 * W, -u * 3.6, -u * 1.0 * W, -u * 3.95, -u * 0.5, -u * 4.35);
    ctx.lineTo(u * 0.5, -u * 4.35);
    ctx.bezierCurveTo(u * 1.0 * W, -u * 3.95, u * 1.5 * W, -u * 3.6, u * 1.5 * W, -u * 2.8);
    ctx.lineTo(u * 1.4 * W, u * 4);
    ctx.closePath();
  }, shirtFill);

  if (p.shirt === 'stripes') {
    for (let y = -u * 2.7; y < u * 3; y += u * 0.85)
      stroke(() => {
        ctx.moveTo(-u * 1.47 * W, y);
        ctx.lineTo(u * 1.47 * W, y + u * 0.05);
      });
  } else if (p.shirt === 'dots') {
    ctx.fillStyle = line;
    let row = 0;
    for (let y = -u * 3.0; y < u * 3; y += u * 0.8, row++)
      for (let x = -u * 1.2 * W + (row % 2 ? u * 0.4 : 0); x < u * 1.3 * W; x += u * 0.8) {
        ctx.beginPath();
        ctx.arc(x, y, u * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (p.shirt === 'white') {
    // a relaxed fold or two, like the drawings this is modelled on
    stroke(() => {
      ctx.moveTo(-u * 0.7 * W, -u * 1.4);
      ctx.quadraticCurveTo(-u * 0.3, -u * 0.9, -u * 0.5, -u * 0.1);
      ctx.moveTo(u * 0.6 * W, -u * 2.2);
      ctx.quadraticCurveTo(u * 0.9 * W, -u * 1.5, u * 0.7 * W, -u * 0.8);
    });
  }

  // neck
  stroke(() => {
    ctx.moveTo(-u * 0.45, -u * 4.35);
    ctx.lineTo(-u * 0.45, -u * 4.95);
    ctx.moveTo(u * 0.45, -u * 4.35);
    ctx.lineTo(u * 0.45, -u * 4.95);
  });

  // head, turned a little toward the way they walk
  ctx.save();
  ctx.translate(u * 0.1, -u * 6.0);
  ctx.scale(0.8, 0.8); // small heads, like the drawings this is modelled on
  ctx.rotate(swing * 0.02 + 0.02);

  const hr = 1.15; // half width of the head
  const ht = 1.5; // half height
  const top = (k: number) => {
    ctx.moveTo(-u * hr * k, u * 0.0);
    ctx.bezierCurveTo(-u * hr * k, -u * ht * 1.35 * k, u * hr * k, -u * ht * 1.35 * k, u * hr * k, u * 0.0);
  };

  // hair behind the head (solid)
  if (p.hair === 'long') {
    shape(() => {
      ctx.moveTo(-u * 1.3, -u * 0.8);
      ctx.bezierCurveTo(-u * 1.5, -u * 2.1, u * 1.5, -u * 2.1, u * 1.3, -u * 0.8);
      ctx.lineTo(u * 1.5, u * 2.6);
      ctx.lineTo(-u * 1.5, u * 2.6);
      ctx.closePath();
    }, line);
  } else if (p.hair === 'bob') {
    shape(() => {
      ctx.moveTo(-u * 1.3, -u * 0.8);
      ctx.bezierCurveTo(-u * 1.5, -u * 2.1, u * 1.5, -u * 2.1, u * 1.3, -u * 0.8);
      ctx.lineTo(u * 1.45, u * 1.3);
      ctx.lineTo(-u * 1.45, u * 1.3);
      ctx.closePath();
    }, line);
  } else if (p.hair === 'bun') {
    shape(() => ctx.arc(-u * 0.1, -u * 2.25, u * 0.6, 0, Math.PI * 2), line);
  } else if (p.hair === 'ponytail') {
    shape(() => {
      ctx.moveTo(-u * 0.9, -u * 1.1);
      ctx.bezierCurveTo(-u * 2.8, -u * 1.3, -u * 2.7, u * 1.8, -u * 1.7, u * 2.1);
      ctx.bezierCurveTo(-u * 1.9, u * 0.6, -u * 1.6, u * 0.0, -u * 1.0, u * 0.1);
      ctx.closePath();
    }, line);
  }

  // the face: a simple rounded oval with a soft chin
  shape(() => {
    ctx.moveTo(-u * hr, -u * 0.1);
    ctx.bezierCurveTo(-u * hr, -u * ht * 1.3, u * hr, -u * ht * 1.3, u * hr, -u * 0.1);
    ctx.bezierCurveTo(u * hr, u * 1.0, u * 0.65, u * 1.65, u * 0.05, u * 1.65);
    ctx.bezierCurveTo(-u * 0.7, u * 1.65, -u * hr, u * 1.0, -u * hr, -u * 0.1);
    ctx.closePath();
  });

  // hair on top (solid), unless a hat covers it
  if (p.hat === 'none' && p.hair !== 'bald') {
    shape(() => {
      top(1.08);
      // hairline: from the front side to the back, with a fringe swept toward the walking direction
      ctx.quadraticCurveTo(u * 1.0, -u * 0.5, u * 0.35, -u * 0.55);
      ctx.quadraticCurveTo(-u * 0.3, -u * 0.5, -u * 0.8, -u * 0.8);
      ctx.quadraticCurveTo(-u * 1.0, -u * 0.4, -u * hr * 1.08, u * 0.0);
      if (p.hair === 'quiff') {
        ctx.moveTo(u * 0.1, -u * 1.9);
        ctx.quadraticCurveTo(u * 1.3, -u * 2.7, u * 1.4, -u * 1.5);
        ctx.quadraticCurveTo(u * 0.9, -u * 1.9, u * 0.1, -u * 1.9);
      }
      ctx.closePath();
    }, line);
  }

  // hats: a white cap with a brim toward the walking direction, or a beanie
  if (p.hat === 'cap') {
    shape(() => {
      top(1.12);
      ctx.lineTo(-u * hr * 1.12, -u * 0.35);
      ctx.quadraticCurveTo(u * 0.1, -u * 0.55, u * hr * 1.12, -u * 0.4);
      ctx.closePath();
    });
    shape(() => {
      ctx.moveTo(u * 0.2, -u * 0.5);
      ctx.quadraticCurveTo(u * 1.6, -u * 0.7, u * 2.2, -u * 0.15);
      ctx.quadraticCurveTo(u * 1.2, -u * 0.35, u * 0.2, -u * 0.2);
      ctx.closePath();
    }, line);
  } else if (p.hat === 'beanie') {
    shape(() => {
      top(1.15);
      ctx.lineTo(-u * hr * 1.15, -u * 0.5);
      ctx.lineTo(u * hr * 1.15, -u * 0.5);
      ctx.closePath();
    });
    shape(() => ctx.roundRect(-u * hr * 1.17, -u * 0.8, u * hr * 2.34, u * 0.5, u * 0.22));
    shape(() => ctx.arc(0, -u * 2.2, u * 0.25, 0, Math.PI * 2));
  }

  // face: two dot eyes, a short nose, a tiny mouth, an ear on the far side. No eyebrows: they only made people look angry.
  const fx = u * 0.3; // the features sit a little toward the walking direction
  if (p.happyEyes) {
    stroke(() => {
      ctx.arc(fx - u * 0.38, u * 0.05, u * 0.14, Math.PI * 1.05, Math.PI * 1.95);
      ctx.moveTo(fx + u * 0.62, u * 0.05);
      ctx.arc(fx + u * 0.48, u * 0.05, u * 0.14, Math.PI * 1.05, Math.PI * 1.95);
    });
  } else {
    ctx.fillStyle = line;
    for (const dx of [-0.38, 0.48]) {
      ctx.beginPath();
      ctx.arc(fx + u * dx, u * 0.0, u * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  stroke(() => {
    ctx.moveTo(fx + u * 0.12, u * 0.2);
    ctx.quadraticCurveTo(fx + u * 0.0, u * 0.65, fx + u * 0.3, u * 0.7);
  });
  stroke(() => {
    if (p.mouth === 'smile') {
      ctx.moveTo(fx - u * 0.3, u * 1.05);
      ctx.quadraticCurveTo(fx + u * 0.1, u * 1.3, fx + u * 0.5, u * 1.05);
    } else {
      ctx.moveTo(fx - u * 0.25, u * 1.15);
      ctx.lineTo(fx + u * 0.45, u * 1.12);
    }
  });
  if (p.hat !== 'none' || p.hair === 'bald' || p.hair === 'bob' || p.hair === 'long') {
    // ears show on bald or hatted heads; long hair covers them
    if (p.hair !== 'long' && p.hair !== 'bob') stroke(() => ctx.arc(-u * hr, u * 0.35, u * 0.25, Math.PI * 1.5, Math.PI * 0.5, true));
  }
  if (p.glasses) {
    stroke(() => {
      ctx.arc(fx - u * 0.38, u * 0.0, u * 0.36, 0, Math.PI * 2);
      ctx.moveTo(fx + u * 0.48 + u * 0.36, u * 0.0);
      ctx.arc(fx + u * 0.48, u * 0.0, u * 0.36, 0, Math.PI * 2);
      ctx.moveTo(fx - u * 0.02, u * 0.0);
      ctx.lineTo(fx + u * 0.12, u * 0.0);
    });
  }
  ctx.restore();

  arm(1, swing); // the arm on the near side, in front of the body
  ctx.restore();
  ctx.restore();
}

export default function CrowdCanvas({ count = 16, greenShare = 0.2, height = 250 }: CrowdCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const ink = theme.palette.text.primary;
  const bg = theme.palette.background.default; // "fill" only hides what is behind, so it never shows as a colour
  const green = dark ? '#7FB685' : '#3A5A40';

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let people: Person[] = [];
    const colors: Colors = { ink, bg, green };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const n = Math.max(4, Math.round((count * w) / 1400));
      people = Array.from({ length: n }, (_, i) => makePerson(((i + Math.random() * 0.8) / n) * (w + 200) - 100, greenShare));
      people.sort((a, b) => a.size - b.size); // small ones behind, big ones in front
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      people.forEach((p, i) => {
        p.x += p.dir * p.speed * dt;
        if ((p.dir === 1 && p.x > w + 120) || (p.dir === -1 && p.x < -120)) {
          const n = makePerson(p.dir === 1 ? -120 : w + 120, greenShare);
          n.dir = p.dir;
          n.size = p.size;
          people[i] = n;
        }
        drawPerson(ctx, p, now / 1000, h + p.drop, colors);
      });
      raf = requestAnimationFrame(frame);
    };

    const still = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      people.forEach((p) => drawPerson(ctx, p, 0, h + p.drop, colors));
    };

    resize();
    if (reduced) still();
    else raf = requestAnimationFrame(frame);
    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) still();
    });
    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [count, greenShare, ink, bg, green]);

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', insetInline: 0, bottom: 0, width: '100%', height, display: 'block' }} />;
}
