import { useEffect, useId, type ReactNode } from 'react';
import type { Risk } from '../engine/data';
import { RISK_LABEL } from '../engine/data';
import type { GameState, ActionResult } from '../engine/engine';

export type Act = (fn: (s: GameState) => GameState | ActionResult, ok?: string) => boolean;

export const fmt = (n: number, dp = 0) => {
  const sign = n < 0 ? '−' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
};
export const fmtPrice = (n: number) => fmt(n, n < 10 ? 2 : n < 1000 ? 2 : 0);
export const pts = (n: number) => Math.round(n).toLocaleString('en-US');
export const pct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;
export const signed = (n: number, dp = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n * 100).toFixed(dp)}%`;

export function Money({ v, dp = 0, color = false }: { v: number; dp?: number; color?: boolean }) {
  return <span className={`num ${color ? (v > 0 ? 'gain' : v < 0 ? 'loss' : '') : ''}`}>{fmt(v, dp)}</span>;
}

export function RiskPill({ risk }: { risk: Risk }) {
  return <span className={`pill ${risk}`}>{RISK_LABEL[risk]}</span>;
}

export function Modal({ children, onClose, narrow, label }: { children: ReactNode; onClose?: () => void; narrow?: boolean; label: string }) {
  useEffect(() => {
    if (!onClose) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${narrow ? 'narrow' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

/** Area sparkline with a highlighted last point. */
export function Spark({ values, height = 120, showRange = true }: { values: number[]; height?: number; showRange?: boolean }) {
  const id = useId().replace(/:/g, '');
  const w = 600;
  const h = height;
  const padT = 10;
  const padB = showRange ? 18 : 6;
  if (values.length < 2) {
    return (
      <div className="muted small" style={{ height, display: 'grid', placeItems: 'center' }}>
        History starts after your first year.
      </div>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;
  const x = (i: number) => (i / (values.length - 1)) * (w - 8) + 4;
  const y = (v: number) => padT + (1 - (v - min) / span) * (h - padT - padB);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values[values.length - 1];
  const up = last >= values[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label="Price history">
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={up ? 'var(--gain)' : 'var(--loss)'} stopOpacity="0.22" />
          <stop offset="1" stopColor={up ? 'var(--gain)' : 'var(--loss)'} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={padT + f * (h - padT - padB)} y2={padT + f * (h - padT - padB)} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${d} L${x(values.length - 1)},${h - padB} L${x(0)},${h - padB} Z`} fill={`url(#g${id})`} />
      <path d={d} fill="none" stroke={up ? 'var(--gain)' : 'var(--loss)'} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r="4" fill={up ? 'var(--gain)' : 'var(--loss)'} />
    </svg>
  );
}

/** Line chart with year axis and value labels, used for net worth. */
export function YearChart({ points, label }: { points: { turn: number; value: number }[]; label: string }) {
  const w = 640;
  const h = 220;
  const L = 64;
  const R = 12;
  const T = 12;
  const B = 26;
  if (points.length < 2) return <div className="muted small">The chart fills in as the years pass.</div>;
  const vals = points.map((p) => p.value);
  const min = Math.min(0, ...vals);
  const max = Math.max(...vals, 1);
  const x = (t: number) => L + (t / 30) * (w - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (h - T - B);
  const ticks = [min, min + (max - min) / 2, max];
  const short = (v: number) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `$${Math.round(v / 1e3)}k` : `$${Math.round(v)}`);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.turn).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} style={{ display: 'block' }}>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={L} x2={w - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="var(--font-num)">{short(v)}</text>
        </g>
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map((t) => (
        <text key={t} x={x(t)} y={h - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="var(--font-num)">{t === 0 ? 'Start' : `Y${t}`}</text>
      ))}
      <path d={`${d} L${x(last.turn)},${y(min)} L${x(points[0].turn)},${y(min)} Z`} fill="var(--accent)" opacity="0.1" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={x(last.turn)} cy={y(last.value)} r="4.5" fill="var(--accent)" />
    </svg>
  );
}

export function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div className={`check ${ok ? 'yes' : ''}`}>
      <span className="dot" aria-hidden="true">{ok ? '✓' : ''}</span>
      <span>{children}</span>
    </div>
  );
}

export function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function safeSet(key: string, v: string | null) {
  try {
    if (v === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, v);
  } catch {
    /* storage unavailable: the game still works, it just won't resume */
  }
}
