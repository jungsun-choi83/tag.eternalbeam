"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const CORNER_OUTER = 24;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function hash21(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function noise2(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash21(ix, iy);
  const b = hash21(ix + 1, iy);
  const c = hash21(ix, iy + 1);
  const d = hash21(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (d - c) * u * v;
}

function fbm(px: number, py: number, t: number) {
  let v = 0;
  let a = 0.55;
  let f = 1;
  for (let i = 0; i < 5; i++) {
    v += a * noise2(px * f + t * 0.18 * (i + 1), py * f - t * 0.14 * (i + 0.5));
    f *= 2.05;
    a *= 0.52;
  }
  return v;
}

/** Inigo Quilez rounded-box SDF (negative inside) */
function sdRoundedRect(px: number, py: number, bx: number, by: number, r: number) {
  const ax = Math.abs(px) - bx;
  const ay = Math.abs(py) - by;
  const qx = Math.max(ax, 0);
  const qy = Math.max(ay, 0);
  return Math.min(Math.max(ax, ay), 0) + Math.hypot(qx, qy) - r;
}

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function LiquidGoldCardFrame({ children, className = "", style }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const rafRef = useRef<number>(0);
  const dimsRef = useRef({ w: 400, h: 200 });
  const bufDimsRef = useRef({ w: 80, h: 80 });

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || reduce) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d", { alpha: true });
    if (!bctx) return;

    const resize = () => {
      const rct = host.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rct.width));
      const cssH = Math.max(1, Math.round(rct.height));
      dimsRef.current = { w: cssW, h: cssH };
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bw = Math.max(40, Math.round(cssW / 2.35));
      const bh = Math.max(40, Math.round(cssH / 2.35));
      bufDimsRef.current = { w: bw, h: bh };
      buf.width = bw;
      buf.height = bh;
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    resize();

    const gold = { r: 215, g: 172, b: 88 };
    const cyan = { r: 92, g: 208, b: 255 };
    const purple = { r: 180, g: 118, b: 245 };
    const magenta = { r: 255, g: 120, b: 195 };
    const emerald = { r: 72, g: 210, b: 160 };

    const draw = (tSec: number) => {
      const { w: W, h: H } = dimsRef.current;
      const { w: bufW, h: bufH } = bufDimsRef.current;
      const hx = W * 0.5 - CORNER_OUTER;
      const hy = H * 0.5 - CORNER_OUTER;
      const imageData = bctx.createImageData(bufW, bufH);
      const data = imageData.data;
      let p = 0;

      const slow = tSec * 0.48;
      const ripple = tSec * 0.65;

      for (let iy = 0; iy < bufH; iy++) {
        for (let ix = 0; ix < bufW; ix++) {
          const px = ((ix + 0.5) / bufW) * W - W * 0.5;
          const py = ((iy + 0.5) / bufH) * H - H * 0.5;
          const ang = Math.atan2(py, px);
          const sd = sdRoundedRect(px, py, hx, hy, CORNER_OUTER);

          const nx = px * 0.018 + ang * 0.35;
          const ny = py * 0.018 + slow * 0.12;
          const turb =
            fbm(nx, ny, slow) * 0.72 +
            fbm(nx * 1.7 + 2.1, ny * 1.7 - 1.3, slow * 1.1) * 0.35;

          const wave =
            Math.sin(ang * 6 + ripple + turb * 6.2) * 0.42 +
            Math.cos(ang * 11 - ripple * 0.85 + turb * 4.5) * 0.28 +
            Math.sin(sd * 0.35 + ripple * 1.4 + turb * 3) * 0.22;

          const flow = turb + wave;
          const innerDist = -sd;

          const bandDiffuse = smoothstep(0.15, 2.8, innerDist) * (1 - smoothstep(5.2, 7.8, innerDist));
          const bandCore =
            smoothstep(1.2, 2.4, innerDist) *
            (1 - smoothstep(3.5, 5.5, innerDist)) *
            (0.55 + 0.45 * Math.sin(flow * Math.PI * 2));

          const holoMix = smoothstep(0.22, 0.82, flow * 0.5 + turb * 0.45 + wave * 0.25);
          const ca = Math.sin(ang * 3 + tSec * 1.1);

          const irid =
            holoMix *
            holoMix *
            (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tSec * 0.7 + turb * 8)));

          let r = gold.r + (cyan.r - gold.r) * irid * 0.45 + (purple.r - gold.r) * irid * 0.22;
          let gCol = gold.g + (emerald.g - gold.g) * irid * 0.28 + (cyan.g - gold.g) * irid * 0.42;
          let b = gold.b + (magenta.b - gold.b) * irid * 0.2 + (cyan.b - gold.b) * irid * 0.58;

          const chrom = holoMix * 14;
          r += chrom * ca * 0.02;
          b -= chrom * ca * 0.02;
          gCol += holoMix * (purple.g - gCol) * 0.08;

          const intensity = Math.min(1.45, bandDiffuse * (0.65 + 0.85 * (0.5 + 0.5 * flow)) + bandCore * 1.35);

          const edgeFade = smoothstep(5, 0, Math.max(0, -sd));
          const a = intensity * (0.35 + 0.55 * smoothstep(0, 1.5, innerDist)) * 255 * (0.5 + 0.5 * edgeFade);

          data[p] = Math.max(0, Math.min(255, r));
          data[p + 1] = Math.max(0, Math.min(255, gCol));
          data[p + 2] = Math.max(0, Math.min(255, b));
          data[p + 3] = a;
          p += 4;
        }
      }

      bctx.putImageData(imageData, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.globalCompositeOperation = "lighter";
      ctx.filter = "blur(1.15px)";
      ctx.drawImage(buf, 0, 0, bufW, bufH, 0, 0, W, H);
      ctx.filter = "none";
      ctx.globalAlpha = 0.45;
      ctx.drawImage(buf, 0, 0, bufW, bufH, 1.1, 0, W, H);
      ctx.globalAlpha = 0.42;
      ctx.drawImage(buf, 0, 0, bufW, bufH, -1.1, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    };

    const start = performance.now();
    const loop = (now: number) => {
      draw((now - start) / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [reduce]);

  useEffect(() => {
    if (!reduce || !canvasRef.current || !hostRef.current) return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = host.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(r.width));
    const cssH = Math.max(1, Math.round(r.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grd = ctx.createLinearGradient(0, 0, cssW, cssH);
    grd.addColorStop(0, "rgba(212,175,88,0.38)");
    grd.addColorStop(0.45, "rgba(140,100,230,0.12)");
    grd.addColorStop(1, "rgba(92,208,255,0.18)");
    ctx.fillStyle = grd;
    ctx.save();
    ctx.filter = "blur(14px)";
    ctx.fillRect(-8, -8, cssW + 16, cssH + 16);
    ctx.restore();
  }, [reduce]);

  return (
    <motion.div
      ref={hostRef}
      className={`eb-home-liquid-frame relative w-full max-w-[400px] rounded-[24px] ${className}`}
      style={style}
      animate={
        reduce
          ? {}
          : {
              boxShadow: [
                "0 22px 56px rgba(0,0,0,0.64), 0 0 0 1px rgba(212,175,88,0.09) inset, 0 0 72px rgba(212,175,88,0.08), 0 0 96px rgba(100,65,200,0.06)",
                "0 26px 68px rgba(0,0,0,0.56), 0 0 0 1px rgba(140,100,230,0.1) inset, 0 0 96px rgba(92,208,255,0.1), 0 0 120px rgba(212,175,88,0.11)",
                "0 22px 56px rgba(0,0,0,0.64), 0 0 0 1px rgba(212,175,88,0.09) inset, 0 0 72px rgba(212,175,88,0.08), 0 0 96px rgba(100,65,200,0.06)",
              ],
            }
      }
      transition={reduce ? { duration: 0 } : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-5 z-0 rounded-[26px]"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 42%, rgba(212,175,88,0.22) 0%, rgba(120,80,200,0.14) 42%, rgba(64,180,235,0.1) 62%, transparent 72%)",
          filter: "blur(20px)",
        }}
        animate={
          reduce
            ? {}
            : {
                opacity: [0.42, 0.62, 0.48],
                scale: [1, 1.04, 1.01],
              }
        }
        transition={reduce ? {} : { duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <div className="eb-home-liquid-canvas-wrap pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full rounded-[inherit]"
          aria-hidden
        />
      </div>

      <div className="eb-home-card pointer-events-auto absolute inset-[3px] z-[2] isolate rounded-[21px] px-6 py-8 sm:px-8 sm:py-9">
        {children}
      </div>
    </motion.div>
  );
}
