import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { loadSaved } from './App';
import type { GameState } from './engine/engine';
import './styles.css';

type Hot = {
  ready?: (start: (data: unknown) => void) => void;
  data?: unknown;
  snapshot?: (fn: () => unknown) => void;
};
const hot = (window as unknown as { claude?: { hot?: Hot } }).claude?.hot;

function start(data: unknown) {
  const fromHot = (data as { game?: GameState } | undefined)?.game ?? null;
  hot?.snapshot?.(() => ({ game: (window as unknown as { __thirtyState?: () => unknown }).__thirtyState?.() }));
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App initial={fromHot ?? loadSaved()} />
    </StrictMode>,
  );
}

if (hot?.ready) hot.ready(start);
else start(hot?.data ?? {});
