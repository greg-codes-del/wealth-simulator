import { useState } from 'react';
import { ACHIEVEMENTS, GOODS, SERVICES, type DreamDef } from '../engine/data';
import * as E from '../engine/engine';
import { Check, YearChart, fmt, pts, type Act } from './common';

function MultTag({ base, like }: { base: number; like: number }) {
  const m = base * like;
  return (
    <span className="row small" style={{ gap: 6 }}>
      <span className={`pill ${m > 1 ? 'vgood' : 'neutral'} plain`}>{m.toFixed(m % 1 ? 2 : 1).replace(/0$/, '')}x points</span>
      {like > 1 && <span className="pill good plain">Favourite</span>}
    </span>
  );
}

export function Shop({ s, act }: { s: E.GameState; act: Act }) {
  const [tab, setTab] = useState<'education' | 'experience' | 'goods'>('education');
  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Year {s.turn} · prices rise 3% a year</span>
          <h2>Shop</h2>
          <p className="muted">Education raises your salary for good, so it pays most when bought early. Experiences lift your life conditions. Goods stay on your balance sheet but lose value each year.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['education', 'Education'],
            ['experience', 'Experiences'],
            ['goods', 'Goods'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="items">
        {tab !== 'goods' &&
          SERVICES.filter((x) => x.group === tab).map((sv) => {
            const lock = E.serviceLocked(s, sv.id);
            const cost = E.itemPrice(s, sv.price);
            const times = s.bought[sv.id] ?? 0;
            return (
              <div key={sv.id} className={`item ${lock === 'Already completed' ? 'done' : ''}`}>
                <div className="name">{sv.name}</div>
                <div className="desc">{sv.desc}</div>
                {sv.salaryBoost && (
                  <span className="small">
                    Adds about <span className="num gain">{fmt(s.salary * sv.salaryBoost)}</span> a year, every year
                  </span>
                )}
                <MultTag base={sv.mult} like={E.likeMult(s, sv.tags)} />
                <div className="spread">
                  <span className="num" style={{ fontSize: '1.05rem' }}>{fmt(cost)}</span>
                  {lock ? (
                    <span className="small muted">{lock}</span>
                  ) : (
                    <button className="btn primary" disabled={s.cash < cost} onClick={() => act((x) => E.buyService(x, sv.id), `Bought ${sv.name}`)}>Buy</button>
                  )}
                </div>
                {!sv.once && times > 0 && <span className="small muted">Bought {times}×</span>}
              </div>
            );
          })}
        {tab === 'goods' &&
          GOODS.map((g) => {
            const cost = E.itemPrice(s, g.price);
            const times = s.bought[g.id] ?? 0;
            return (
              <div key={g.id} className="item">
                <div className="name">{g.name}</div>
                <div className="desc">
                  {g.desc} Loses {Math.round(g.dep * 100)}% of its value a year.
                  {g.endBonus ? ` First one adds End +${g.endBonus}.` : ''}
                </div>
                <MultTag base={g.mult} like={E.likeMult(s, g.tags)} />
                <div className="spread">
                  <span className="num" style={{ fontSize: '1.05rem' }}>{fmt(cost)}</span>
                  <button className="btn primary" disabled={s.cash < cost} onClick={() => act((x) => E.buyGood(x, g.id), `Bought ${g.name}`)}>Buy</button>
                </div>
                {times > 0 && <span className="small muted">Bought {times}×</span>}
              </div>
            );
          })}
      </div>
    </>
  );
}

export function Dreams({ s, act }: { s: E.GameState; act: Act }) {
  const c = E.character(s);
  const card = (d: DreamDef) => {
    const done = s.dreams.includes(d.id);
    const cost = E.itemPrice(s, d.price);
    return (
      <div key={d.id} className={`item ${d.main ? 'mainDream' : ''} ${done ? 'done' : ''}`}>
        <div className="spread" style={{ alignItems: 'flex-start' }}>
          <div className="name">{d.name}</div>
          {d.main && <span className="pill vgood plain">Life dream</span>}
        </div>
        <div className="desc">{d.desc}</div>
        <div className="row small">
          <span className={`pill ${d.kind === 'goods' ? 'good' : 'ok'} plain`}>{d.kind === 'goods' ? 'Goods: stays in your net worth' : 'Service: money is spent'}</span>
          <span className="pill vgood plain">End +{d.endBonus}</span>
        </div>
        <div className="spread">
          <span className="num" style={{ fontSize: '1.05rem' }}>{fmt(cost)}</span>
          {done ? <span className="small gain">Fulfilled</span> : <button className="btn primary" disabled={s.cash < cost} onClick={() => act((x) => E.buyDream(x, d.id))}>Fulfil</button>}
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">End coefficient now ×{s.endCoef.toFixed(2)}</span>
          <h2>Dreams</h2>
          <p className="muted">Each dream raises your End coefficient, which multiplies your final net worth. Goods dreams keep their full price on your balance sheet; service dreams are spent. Many players save their dreams for the last year.</p>
        </div>
      </div>
      <h3>{c.name}'s dreams</h3>
      <div className="items">{c.dreams.map(card)}</div>
      <h3>Other dreams</h3>
      <div className="items">{E.allDreams(s).filter((d) => !c.dreams.includes(d)).map(card)}</div>
    </>
  );
}

const itemName = (id: string) => GOODS.find((g) => g.id === id)?.name ?? SERVICES.find((x) => x.id === id)?.name ?? id;

export function Achievements({ s }: { s: E.GameState }) {
  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">{s.achievements.length} of {ACHIEVEMENTS.length} unlocked</span>
          <h2>Achievements</h2>
          <p className="muted">Buy all four items in a set to unlock a flat points reward and Flow +0.05. Add up the cost first: buying things only for the badge rarely pays.</p>
        </div>
      </div>
      <div className="items">
        {ACHIEVEMENTS.map((a) => {
          const done = s.achievements.includes(a.id);
          const cost = a.items.filter((i) => !(s.bought[i] > 0)).reduce((acc, i) => acc + E.itemPrice(s, (GOODS.find((g) => g.id === i) ?? SERVICES.find((x) => x.id === i))!.price), 0);
          return (
            <div key={a.id} className={`item ${done ? 'mainDream' : ''}`}>
              <div className="spread">
                <div className="name">{a.name}</div>
                {done && <span className="pill good plain">Unlocked</span>}
              </div>
              <div className="stack" style={{ gap: 4 }}>
                {a.items.map((i) => <Check key={i} ok={(s.bought[i] ?? 0) > 0}>{itemName(i)}</Check>)}
              </div>
              <div className="spread small">
                <span>Reward <span className="num">{pts(a.points)}</span> pts, Flow +{a.flowBonus}</span>
                {!done && <span className="muted">Still to buy <span className="num">{fmt(cost)}</span></span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function Journal({ s }: { s: E.GameState }) {
  const [open, setOpen] = useState<number | null>(s.reports.length ? s.reports[s.reports.length - 1].turn : null);
  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">{s.reports.length} years recorded</span>
          <h2>Journal</h2>
          <p className="muted">Your net worth over time and a record of every year.</p>
        </div>
      </div>
      <section className="card stack">
        <h3>Net worth</h3>
        <YearChart label="Net worth by year" points={s.history.map((h) => ({ turn: h.turn, value: h.netWorth }))} />
      </section>
      <section className="stack">
        {s.reports.length === 0 && <p className="muted">Nothing yet. End your first year to start the journal.</p>}
        {[...s.reports].reverse().map((r) => (
          <div key={r.turn} className="card stack" style={{ gap: 8 }}>
            <button className="btn ghost" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => setOpen(open === r.turn ? null : r.turn)} aria-expanded={open === r.turn}>
              <strong>Year {r.turn}</strong>
              <span className="small muted">Net worth <span className="num">{fmt(r.netWorth)}</span> · +{pts(r.pointsEarned)} pts</span>
            </button>
            {open === r.turn && <ReportBody r={r} />}
          </div>
        ))}
      </section>
    </>
  );
}

export function ReportBody({ r }: { r: E.YearReport }) {
  const inc = r.income.reduce((a, l) => a + l.amount, 0);
  const exp = r.expenses.reduce((a, l) => a + l.amount, 0);
  return (
    <div className="stack">
      {r.events.length > 0 && (
        <div className="stack" style={{ gap: 4 }}>
          {r.events.map((e, i) => <div key={i} className="small" style={{ borderLeft: '3px solid var(--warn)', paddingLeft: 10 }}>{e}</div>)}
        </div>
      )}
      <div className="grid2">
        <table className="ledger">
          <tbody>
            {r.income.map((l, i) => <tr key={i}><td>{l.label}</td><td className="r num gain">{fmt(l.amount)}</td></tr>)}
            <tr className="total"><td>Income</td><td className="r num">{fmt(inc)}</td></tr>
          </tbody>
        </table>
        <table className="ledger">
          <tbody>
            {r.expenses.map((l, i) => <tr key={i}><td>{l.label}{l.scoring === false && <span className="tag"> · no points</span>}</td><td className="r num loss">{fmt(-l.amount)}</td></tr>)}
            <tr className="total"><td>Expenses</td><td className="r num">{fmt(-exp)}</td></tr>
          </tbody>
        </table>
      </div>
      {r.purchases.length > 0 && (
        <p className="small muted">Purchases: {r.purchases.map((p) => `${p.label} (${fmt(p.amount)})`).join(', ')}</p>
      )}
      <p className="small">
        Scored spending <span className="num">{fmt(r.scoringSpend)}</span> × Flow {r.flowUsed.toFixed(2)} = <strong className="num">{pts(r.pointsEarned)}</strong> points.
      </p>
      {r.notes.map((n, i) => <p key={i} className="small muted">{n}</p>)}
    </div>
  );
}
