import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTERS, RISK_LABEL } from './engine/data';
import * as E from './engine/engine';
import { Budget, Wallet } from './ui/budget';
import { Markets, Property } from './ui/markets';
import { Achievements, Dreams, Journal, ReportBody, Shop } from './ui/shop';
import { Modal, YearChart, fmt, pct, pts, safeGet, safeSet, type Act } from './ui/common';

const SAVE_KEY = 'thirty-save-v1';

type Tab = 'budget' | 'wallet' | 'markets' | 'property' | 'shop' | 'dreams' | 'achievements' | 'journal';
const TABS: { id: Tab; label: string }[] = [
  { id: 'budget', label: 'Budget' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'markets', label: 'Markets' },
  { id: 'property', label: 'Property' },
  { id: 'shop', label: 'Shop' },
  { id: 'dreams', label: 'Dreams' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'journal', label: 'Journal' },
];

interface Toast { id: number; text: string; err?: boolean }

export function loadSaved(): E.GameState | null {
  const raw = safeGet(SAVE_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as E.GameState;
    return s && s.v === 1 ? s : null;
  } catch {
    return null;
  }
}

export default function App({ initial }: { initial: E.GameState | null }) {
  const [game, setGame] = useState<E.GameState | null>(initial);
  const [tab, setTab] = useState<Tab>('budget');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [report, setReport] = useState<E.YearReport | null>(null);
  const [help, setHelp] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    (window as unknown as { __thirtyState?: () => unknown }).__thirtyState = () => gameRef.current;
    safeSet(SAVE_KEY, game ? JSON.stringify(game) : null);
  }, [game]);

  const toast = useCallback((text: string, err = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, err }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), err ? 5000 : 3200);
  }, []);

  const act: Act = useCallback(
    (fn, ok) => {
      const cur = gameRef.current;
      if (!cur) return false;
      try {
        const res = fn(cur);
        const next = 'state' in res ? res.state : res;
        setGame(next);
        if (ok) toast(ok);
        if ('notes' in res) res.notes.forEach((n) => toast(n));
        return true;
      } catch (e) {
        toast((e as Error).message, true);
        return false;
      }
    },
    [toast],
  );

  const endYear = () => {
    if (!game) return;
    const next = E.endYear(game);
    setGame(next);
    setConfirmEnd(false);
    if (!next.finished) setReport(next.reports[next.reports.length - 1]);
    window.scrollTo({ top: 0 });
  };

  if (!game) {
    return <Start onStart={(c, seed) => { setGame(E.newGame(c, seed)); setTab('budget'); setHelp(true); }} />;
  }

  if (game.finished) {
    return <Final s={game} onNew={() => setGame(null)} />;
  }

  const bs = E.balanceSheet(game);
  const c = E.character(game);
  const proj = E.projection(game);
  const headlines = E.news(game);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Wealth Simulator</span>
          <div className="yearbox">
            <span className="big num" aria-label={`Year ${game.turn} of 30`}>{String(game.turn).padStart(2, '0')}</span>
            <span className="of">/ 30</span>
            <span className="agetag hide-sm">{c.name.split(' ')[0]}, age {E.age(game)}</span>
          </div>
          <div className="stats">
            <div className="stat"><span className="k">Cash</span><span className={`v ${game.cash < 0 ? 'loss' : ''}`}>{fmt(game.cash)}</span></div>
            <div className="stat"><span className="k">Net worth</span><span className="v">{fmt(bs.netWorth)}</span></div>
            <div className="stat"><span className="k">Salary</span><span className="v">{fmt(game.salary)}</span></div>
            <div className="stat"><span className="k">Flow</span><span className="v">×{E.flowCoef(game).toFixed(2)}</span></div>
            <div className="stat"><span className="k">End</span><span className="v">×{game.endCoef.toFixed(2)}</span></div>
            <div className="stat"><span className="k">Score now</span><span className="v">{pts(E.scoreIfEndedNow(game))}</span></div>
          </div>
          <button className="btn primary big" onClick={() => (game.turn === 30 ? setConfirmEnd(true) : endYear())}>
            {game.turn === 30 ? 'Finish the game' : `End year ${game.turn}`}
          </button>
        </div>
        <div className="timeline" aria-hidden="true">
          {Array.from({ length: 30 }, (_, i) => {
            const t = i + 1;
            const h = game.history.find((x) => x.turn === t);
            const prev = game.history.find((x) => x.turn === t - 1);
            const cls = t === game.turn ? 'now' : h && prev ? (h.netWorth >= prev.netWorth ? 'up' : 'down') : '';
            return <span key={t} className={cls} title={`Year ${t}`} />;
          })}
        </div>
      </header>

      <div className="shell">
        <nav className="rail" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'dreams' && game.dreams.length > 0 && <span className="badge">{game.dreams.length}</span>}
              {t.id === 'achievements' && game.achievements.length > 0 && <span className="badge">{game.achievements.length}</span>}
            </button>
          ))}
          <hr />
          <button onClick={() => setHelp(true)}>How to play</button>
          <button onClick={() => setConfirmNew(true)}>New game</button>
        </nav>
        <main className="main">
          {proj.net < 0 && tab !== 'budget' && (
            <div className="card small" style={{ borderColor: 'var(--warn)' }}>
              This year's projected cash flow is <span className="num loss">{fmt(proj.net)}</span>. Check your Budget before ending the year.
            </div>
          )}
          {tab === 'budget' && <Budget s={game} act={act} />}
          {tab === 'wallet' && <Wallet s={game} act={act} />}
          {tab === 'markets' && <Markets s={game} act={act} />}
          {tab === 'property' && <Property s={game} act={act} />}
          {tab === 'shop' && <Shop s={game} act={act} />}
          {tab === 'dreams' && <Dreams s={game} act={act} />}
          {tab === 'achievements' && <Achievements s={game} />}
          {tab === 'journal' && <Journal s={game} />}
        </main>
      </div>

      <div className="ticker" aria-label="News">
        <span className="lbl">News · Y{game.turn}</span>
        <div className="viewport">
        <div className="track">
          {[...headlines, `Policy rate ${pct(E.policyRate(game), 2)}`, ...headlines, `Policy rate ${pct(E.policyRate(game), 2)}`].map((h, i) => <span key={i}>{h}</span>)}
        </div>
        </div>
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.err ? 'err' : ''}`}>{t.text}</div>)}
      </div>

      {report && (
        <Modal label={`Year ${report.turn} report`} onClose={() => setReport(null)}>
          <div className="spread">
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Year {report.turn} is done · age {E.START_AGE + report.turn}</span>
              <h2>{report.events.length ? 'A year with surprises' : 'A quiet year'}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontSize: '1.4rem' }}>+{pts(report.pointsEarned)}</div>
              <div className="small muted">points earned</div>
            </div>
          </div>
          <ReportBody r={report} />
          <div className="card flat stack" style={{ background: 'var(--sunk)', border: 0 }}>
            <span className="eyebrow">Headlines for year {game.turn}</span>
            {headlines.map((h, i) => <span key={i} className="small">{h}</span>)}
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary big" onClick={() => setReport(null)} autoFocus>Start year {game.turn}</button>
          </div>
        </Modal>
      )}

      {help && <Help onClose={() => setHelp(false)} />}

      {confirmNew && (
        <Modal narrow label="Start a new game" onClose={() => setConfirmNew(false)}>
          <h3>Start a new game?</h3>
          <p className="muted">This life ends here and your progress is deleted.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setConfirmNew(false)}>Keep playing</button>
            <button className="btn primary" onClick={() => { setConfirmNew(false); setGame(null); }}>Start over</button>
          </div>
        </Modal>
      )}

      {confirmEnd && (
        <Modal narrow label="Finish the game" onClose={() => setConfirmEnd(false)}>
          <h3>Finish year 30?</h3>
          <p className="muted">
            Your final score is your banked points plus net worth × End coefficient (×{game.endCoef.toFixed(2)}). Have you fulfilled the dreams you want? Goods dreams add to both.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setConfirmEnd(false)}>Not yet</button>
            <button className="btn primary" onClick={endYear}>Finish</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Start({ onStart }: { onStart: (charId: string, seed: number) => void }) {
  const [sel, setSel] = useState('mara');
  const [seed, setSeed] = useState(() => String(1000 + Math.floor(Math.random() * 89000)));
  return (
    <div className="start">
      <div className="hero">
        <div className="word">
          Wealth
          <br />
          Simulator
          <small>Thirty years of earning, spending and investing</small>
        </div>
        <div className="pitch">
          <p>You have just graduated. Live thirty years, one year per turn: earn, spend, invest, borrow and chase your dreams.</p>
          <p className="muted">Every dollar you spend becomes points at your Flow rate. At the end, your net worth is multiplied by your End rate. Balance the two and plan for crashes you cannot see coming.</p>
        </div>
      </div>

      <section className="stack" aria-labelledby="pick">
        <h2 id="pick">Choose who you will be</h2>
        <div className="chars">
          {CHARACTERS.map((c) => (
            <button key={c.id} className="char" aria-pressed={sel === c.id} onClick={() => setSel(c.id)}>
              <span className="role">{c.title}</span>
              <span className="who">{c.name}</span>
              <span className="small muted">{c.bio}</span>
              <dl>
                <dt>Salary</dt><dd>{fmt(c.salary)}/yr</dd>
                <dt>Rent</dt><dd>{fmt(c.rent)}/yr</dd>
                <dt>Cash</dt><dd>{fmt(c.cash)}</dd>
              </dl>
              <span className="small">{c.likesLabel}</span>
              <div className="stack" style={{ gap: 4 }}>
                <span className="eyebrow">Target portfolio</span>
                <div className="mixbar" aria-label={`Target ${pct(c.target.low, 0)} low, ${pct(c.target.mid, 0)} mid, ${pct(c.target.high, 0)} high risk`}>
                  <span className="low" style={{ width: `${c.target.low * 100}%` }} />
                  <span className="mid" style={{ width: `${c.target.mid * 100}%` }} />
                  <span className="high" style={{ width: `${c.target.high * 100}%` }} />
                </div>
                <span className="small muted">
                  {(['low', 'mid', 'high'] as const).map((k) => `${pct(c.target[k], 0)} ${RISK_LABEL[k].split(' ')[0].toLowerCase()}`).join(' · ')}, cushion {pct(c.cushion, 0)} of salary
                </span>
              </div>
              <div className="stack" style={{ gap: 4 }}>
                <span className="eyebrow">Dreams</span>
                <ul>
                  {c.dreams.map((d) => (
                    <li key={d.id}>
                      <span>{d.main ? '★ ' : ''}{d.name}</span>
                      <span className="num muted">{fmt(d.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="startbar">
        <button className="btn primary big" onClick={() => onStart(sel, Math.max(1, Math.floor(Number(seed)) || 1))}>
          Begin as {CHARACTERS.find((c) => c.id === sel)!.name.split(' ')[0]}
        </button>
        <label htmlFor="seed">
          Scenario number (same number, same economy)
          <div className="row">
            <input id="seed" type="number" min={1} value={seed} onChange={(e) => setSeed(e.target.value)} style={{ width: 130 }} />
            <button className="btn ghost" onClick={() => setSeed(String(1000 + Math.floor(Math.random() * 89000)))}>Shuffle</button>
          </div>
        </label>
      </div>
    </div>
  );
}

function Help({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="How to play" onClose={onClose}>
      <span className="eyebrow">How to play</span>
      <h2>Thirty years, one turn each</h2>
      <div className="stack small">
        <p><strong>Each year</strong> you can buy, sell and adjust your budget as much as you like. When you press <em>End year</em>, you are paid, your bills are taken, life events happen, and markets move to next year's prices.</p>
        <p><strong>Scoring.</strong> Everything you spend (rent, life expenses, purchases, dreams) earns points equal to the amount × any item multiplier × your <strong>Flow</strong> coefficient. Loan interest, loan repayments and penalties earn nothing. After year 30, your net worth × your <strong>End</strong> coefficient is added.</p>
        <p><strong>Raising Flow:</strong> trips around the world (temporary), the mindfulness retreat, achievements, and every year in which all four life conditions are very good.</p>
        <p><strong>Raising End:</strong> dreams (your life dream gives +1.0), a few lasting goods, and every year you invest with discipline: on your target risk mix with a full cash cushion.</p>
        <p><strong>Life conditions</strong> pay a bonus when good, and cause illness or burnout when bad. The bonus does not grow with your salary, so the cost of keeping them high eventually overtakes it.</p>
        <p><strong>Money tips:</strong> education raises your salary for the rest of the game. Mortgages let you buy property with 10% down. If your cash goes negative at year end, the bank gives you expensive emergency credit.</p>
        <p className="muted">The economy, prices and news come from your scenario number. News hints at what is coming but is wrong about a third of the time.</p>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={onClose} autoFocus>Got it</button>
      </div>
    </Modal>
  );
}

function Final({ s, onNew }: { s: E.GameState; onNew: () => void }) {
  const f = s.final ?? E.finalScore(s);
  const c = E.character(s);
  const main = c.dreams.find((d) => d.main)!;
  return (
    <div className="start">
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">{c.name} · age {E.START_AGE + 30} · scenario {s.seed}</span>
        <div className="score-hero num">{pts(f.total)}</div>
        <p className="muted">final points</p>
      </div>
      <div className="grid3">
        <div className="card stack" style={{ gap: 4 }}>
          <span className="eyebrow">Points from spending</span>
          <span className="num" style={{ fontSize: '1.4rem' }}>{pts(f.flowPoints)}</span>
          <span className="small muted">Earned year by year at your Flow rate, ending at ×{E.flowCoef(s).toFixed(2)}</span>
        </div>
        <div className="card stack" style={{ gap: 4 }}>
          <span className="eyebrow">Points from capital</span>
          <span className="num" style={{ fontSize: '1.4rem' }}>{pts(f.capitalPoints)}</span>
          <span className="small muted">Net worth {fmt(f.netWorth)} × End {f.endCoef.toFixed(2)}</span>
        </div>
        <div className="card stack" style={{ gap: 4 }}>
          <span className="eyebrow">Life dream</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 650 }}>{main.name}</span>
          <span className={`small ${s.dreams.includes(main.id) ? 'gain' : 'loss'}`}>{s.dreams.includes(main.id) ? 'Fulfilled' : 'Not fulfilled'} · {s.dreams.length} dream{s.dreams.length === 1 ? '' : 's'} in total</span>
        </div>
      </div>
      <section className="card stack">
        <h3>Net worth over thirty years</h3>
        <YearChart label="Net worth by year" points={s.history.map((h) => ({ turn: h.turn, value: h.netWorth }))} />
      </section>
      <div className="row">
        <button className="btn primary big" onClick={onNew}>Play again</button>
        <span className="small muted">Try the same scenario number with a different strategy to compare.</span>
      </div>
    </div>
  );
}
