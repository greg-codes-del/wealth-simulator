import { useState } from 'react';
import { CATS, CAT_LABEL, INSTRUMENTS, INSURANCE } from '../engine/data';
import * as E from '../engine/engine';
import { Check, Money, fmt, pct, pts, type Act } from './common';

export function Budget({ s, act }: { s: E.GameState; act: Act }) {
  const proj = E.projection(s);
  const c = E.character(s);
  const flow = E.flowCoef(s);
  const pendingPts = s.pending.reduce((a, p) => a + p.amount * p.mult, 0);
  const disc = E.disciplineCheck(s);
  const residence = s.properties.find((p) => p.residence);

  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Year {s.turn} · age {E.age(s)}</span>
          <h2>Budget and life</h2>
          <p className="muted">Set how much of your salary goes to each part of life. Good conditions pay a yearly bonus; neglected ones lead to illness and burnout. Everything you spend earns points at the Flow rate.</p>
        </div>
      </div>

      <section className="card stack" aria-labelledby="lc">
        <div className="spread">
          <h3 id="lc">Life condition</h3>
          <span className="muted small">Dashed line: where it will be at year end</span>
        </div>
        <div className="conds">
          {CATS.map((cat) => {
            const cur = s.conditions[cat];
            const next = proj.newConditions[cat];
            const st = E.conditionStatus(cur);
            const nst = E.conditionStatus(next);
            const bonus = E.conditionBonus(s, next);
            const cost = Math.round((s.sliders[cat] / 100) * s.salary);
            return (
              <div className="cond" key={cat}>
                <div className="spread">
                  <strong>{CAT_LABEL[cat]}</strong>
                  <span className={`pill ${st.tone}`}>{st.label}</span>
                </div>
                <div className="meter" aria-label={`${CAT_LABEL[cat]} ${Math.round(cur)} of 100`}>
                  <div className={`fill ${st.tone}`} style={{ height: `${cur}%` }} />
                  <div className="mark" style={{ bottom: '80%' }} />
                  <div className="mark" style={{ bottom: '60%' }} />
                  <div className="mark" style={{ bottom: '25%' }} />
                  <div className="ghost" style={{ bottom: `${next}%` }} />
                  <span className="val">{Math.round(cur)} → {Math.round(next)}</span>
                </div>
                <label className="stack" style={{ gap: 2 }} htmlFor={`sl-${cat}`}>
                  <span className="spread small">
                    <span>{s.sliders[cat]}% of salary</span>
                    <span className="num">{fmt(cost)}</span>
                  </span>
                  <input id={`sl-${cat}`} type="range" min={0} max={25} step={1} value={s.sliders[cat]} onChange={(e) => act((x) => E.setSlider(x, cat, +e.target.value))} />
                </label>
                <span className="small muted">
                  {bonus ? <>Bonus at year end: <span className="num gain">{fmt(bonus)}</span> ({nst.label.toLowerCase()})</> : next < 25 ? <span className="loss">Risk of illness or burnout</span> : 'No bonus below 60'}
                </span>
              </div>
            );
          })}
        </div>
        <p className="small muted">
          Each year a condition loses {E.CONDITION_DECAY} points and gains {E.CONDITION_PER_PCT} for every 1% of salary you spend on it. 80+ is very good ({fmt(E.conditionBonus(s, 100))} a year), 60+ is good (half that). The bonus stays flat while your salary grows, so check every few years whether it still covers the cost.
        </p>
      </section>

      <div className="grid2">
        <section className="card stack" aria-labelledby="cf">
          <div className="spread">
            <h3 id="cf">This year's cash flow</h3>
            <span className="eyebrow">Projected</span>
          </div>
          <table className="ledger">
            <tbody>
              {proj.income.map((l, i) => (
                <tr key={'i' + i}>
                  <td>{l.label}</td>
                  <td className="r num gain">{fmt(l.amount)}</td>
                </tr>
              ))}
              {proj.expenses.map((l, i) => (
                <tr key={'e' + i}>
                  <td>
                    {l.label} {l.scoring === false && <span className="tag">· no points</span>}
                  </td>
                  <td className="r num loss">{fmt(-l.amount)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>Net cash flow</td>
                <td className={`r num ${proj.net >= 0 ? 'gain' : 'loss'}`}>{fmt(proj.net)}</td>
              </tr>
            </tbody>
          </table>
          <p className="small muted">Life events can change this. {residence ? 'You live in your own property, so you pay no rent.' : 'Buy a property and move in to stop paying rent.'}</p>
          <label className="stack" style={{ gap: 2 }} htmlFor="savings">
            <span className="spread small">
              <span>Auto-save {s.savingsPct}% of a positive net into the savings account</span>
              <span className="num">{fmt(Math.max(0, proj.net) * (s.savingsPct / 100))}</span>
            </span>
            <input id="savings" type="range" min={0} max={100} step={5} value={s.savingsPct} onChange={(e) => act((x) => E.setSavings(x, +e.target.value))} />
          </label>
          <label className="row small" htmlFor="ins">
            <input id="ins" type="checkbox" checked={s.insurance} onChange={(e) => act((x) => E.setInsurance(x, e.target.checked))} />
            <span>
              {INSURANCE.name}, <span className="num">{fmt(E.insuranceCost(s))}</span> a year. {INSURANCE.desc}
            </span>
          </label>
        </section>

        <section className="card stack" aria-labelledby="sc">
          <h3 id="sc">How you score</h3>
          <table className="ledger">
            <tbody>
              <tr>
                <td>Flow coefficient<div className="tag">Multiplies everything you spend, except loan payments and penalties</div></td>
                <td className="r num">×{flow.toFixed(2)}</td>
              </tr>
              {s.temps.map((t, i) => (
                <tr key={i}>
                  <td className="tag">incl. {t.label}, {t.turnsLeft} yr left</td>
                  <td className="r num tag">+{t.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td>End coefficient<div className="tag">Multiplies your net worth when year 30 ends</div></td>
                <td className="r num">×{s.endCoef.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Points banked</td>
                <td className="r num">{pts(s.points)}</td>
              </tr>
              <tr>
                <td>Purchases this year<div className="tag">{s.pending.length} item{s.pending.length === 1 ? '' : 's'}, scored when the year ends</div></td>
                <td className="r num">≈ {pts(pendingPts * flow)}</td>
              </tr>
            </tbody>
          </table>
          <div className="stack" style={{ gap: 6 }}>
            <strong className="small">Disciplined investor bonus: End +0.02 for each year you meet all three</strong>
            <Check ok={disc.invested}>At least <span className="num">{fmt(disc.minInvested)}</span> invested in markets (now <span className="num">{fmt(disc.mix.total)}</span>)</Check>
            <Check ok={disc.close}>
              Portfolio within 15 points of your target {pct(c.target.low, 0)} low / {pct(c.target.mid, 0)} mid / {pct(c.target.high, 0)} high risk
              {disc.mix.total > 0 && <> (now {pct(disc.mix.share.low, 0)} / {pct(disc.mix.share.mid, 0)} / {pct(disc.mix.share.high, 0)})</>}
            </Check>
            <Check ok={disc.cushion}>Cash plus savings of at least <span className="num">{fmt(disc.cushionNeed)}</span> ({pct(c.cushion, 0)} of salary)</Check>
            <span className="small muted">Earned {s.disciplineYears} time{s.disciplineYears === 1 ? '' : 's'} so far.</span>
          </div>
        </section>
      </div>
    </>
  );
}

export function Wallet({ s, act }: { s: E.GameState; act: Act }) {
  const bs = E.balanceSheet(s);
  const holdings = Object.entries(s.holdings);
  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Year {s.turn}</span>
          <h2>Assets and liabilities</h2>
          <p className="muted">Your net worth at the end of year 30 is multiplied by the End coefficient. Goods count at their current resale value; dream goods keep their full price.</p>
        </div>
      </div>
      <section className="card">
        <div className="grid3" style={{ gap: 12 }}>
          {[
            ['Cash', bs.cash],
            ['Markets', bs.markets],
            ['Property', bs.property],
            ['Goods and dreams', bs.goods],
            ['Debt', -bs.debt],
            ['Net worth', bs.netWorth],
          ].map(([k, v]) => (
            <div key={k as string} className="stat">
              <span className="k">{k}</span>
              <span className="v" style={{ fontSize: k === 'Net worth' ? '1.35rem' : undefined }}>
                <Money v={v as number} color={k === 'Debt' || k === 'Net worth'} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Investments</h3>
        {holdings.length === 0 ? (
          <p className="muted small">Nothing invested yet. Open Markets to buy bonds, stocks, funds, commodities or crypto.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Instrument</th><th className="r">Units</th><th className="r">Value</th><th className="r">Gain</th><th></th></tr>
              </thead>
              <tbody>
                {holdings.map(([id, h]) => {
                  const v = h.qty * E.price(s, id);
                  const g = v - h.cost;
                  return (
                    <tr key={id} style={{ cursor: 'default' }}>
                      <td>{insName(id)}</td>
                      <td className="r num">{h.qty.toLocaleString('en-US', { maximumFractionDigits: 3 })}</td>
                      <td className="r"><Money v={v} /></td>
                      <td className="r"><Money v={g} color /></td>
                      <td className="r"><button className="btn" onClick={() => act((x) => E.sellInstrument(x, id, h.qty), `Sold all ${insName(id)}`)}>Sell all</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid2">
        <section className="card stack">
          <h3>Loans</h3>
          {s.loans.length === 0 && <p className="muted small">No debt.</p>}
          {s.loans.map((l) => (
            <LoanRow key={l.uid} s={s} l={l} act={act} />
          ))}
          {s.loans.length > 0 && (
            <p className="small muted">Interest earns no points. Paying a loan down early cuts every future interest bill.</p>
          )}
        </section>
        <section className="card stack">
          <h3>Goods and dreams</h3>
          {s.goods.length === 0 && <p className="muted small">Nothing yet.</p>}
          {s.goods.map((g) => (
            <div key={g.uid} className="spread small">
              <span>{g.name} {g.dream && <span className="pill vgood plain">Dream</span>}</span>
              <span className="row">
                <Money v={g.value} />
                {!g.dream && <button className="btn" onClick={() => act((x) => E.sellGood(x, g.uid), `Sold ${g.name}`)}>Sell</button>}
              </span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

const insName = (id: string) => INSTRUMENTS.find((i) => i.id === id)?.name ?? id;

function LoanRow({ s, l, act }: { s: E.GameState; l: E.Loan; act: Act }) {
  const [amt, setAmt] = useState('');
  const pay = E.loanPayment(l);
  return (
    <div className="stack" style={{ gap: 6, paddingBottom: 10, borderBottom: '1px dashed var(--line)' }}>
      <div className="spread">
        <strong className="small">{l.label}</strong>
        <Money v={-l.principal} color />
      </div>
      <span className="small muted">
        {(l.rate * 100).toFixed(2)}% · {l.turnsLeft} yr left · <span className="num">{fmt(pay)}</span> a year
      </span>
      <div className="row">
        <input type="number" id={`pp-${l.uid}`} aria-label="Amount to pay off" placeholder="Amount" min={0} value={amt} onChange={(e) => setAmt(e.target.value)} style={{ flex: 1 }} />
        <button className="btn" onClick={() => setAmt(String(Math.floor(Math.min(s.cash, l.principal))))}>Max</button>
        <button className="btn primary" onClick={() => act((x) => E.prepayLoan(x, l.uid, +amt), 'Loan paid down') && setAmt('')}>Pay off</button>
      </div>
    </div>
  );
}
