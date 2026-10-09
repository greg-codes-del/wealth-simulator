import { useState } from 'react';
import { INSTRUMENTS, MARKET_KINDS, PROPERTIES, type MarketKind } from '../engine/data';
import * as E from '../engine/engine';
import { Money, RiskPill, Spark, fmt, fmtPrice, pct, signed, type Act } from './common';

function change(hist: number[]) {
  if (hist.length < 2) return null;
  const a = hist[hist.length - 2];
  const b = hist[hist.length - 1];
  return a ? b / a - 1 : null;
}

export function Markets({ s, act }: { s: E.GameState; act: Act }) {
  const [kind, setKind] = useState<MarketKind>('banking');
  const list = INSTRUMENTS.filter((i) => i.kind === kind);
  const [selId, setSel] = useState<string>('savings');
  const sel = list.find((i) => i.id === selId) ?? list[0];

  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Year {s.turn} · policy rate {pct(E.policyRate(s), 2)}</span>
          <h2>Financial markets</h2>
          <p className="muted">Prices move once a year when you end the year. The more risk, the bigger the possible gain or loss. Read the news, but remember it is often wrong.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {MARKET_KINDS.map((k) => (
          <button key={k.id} role="tab" aria-selected={k.id === kind} onClick={() => { setKind(k.id); setSel(INSTRUMENTS.find((i) => i.kind === k.id)!.id); }}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th className="r">Price</th><th className="r">1y</th><th className="r hide-sm">Yield</th><th className="r">Owned</th></tr>
              </thead>
              <tbody>
                {list.map((i) => {
                  const hist = E.priceHistory(s, i.id);
                  const ch = change(hist);
                  const own = s.holdings[i.id];
                  const y = i.id === 'savings' ? E.savingsRate(s) : i.yield;
                  return (
                    <tr key={i.id} className={i.id === sel.id ? 'sel' : ''} onClick={() => setSel(i.id)}>
                      <td style={{ whiteSpace: 'normal', minWidth: 140 }}>
                        <div style={{ fontWeight: 600 }}>{i.name}</div>
                        <RiskPill risk={i.risk} />
                      </td>
                      <td className="r num">{fmtPrice(E.price(s, i.id))}</td>
                      <td className={`r num ${ch == null ? 'muted' : ch >= 0 ? 'gain' : 'loss'}`}>{ch == null ? '—' : signed(ch)}</td>
                      <td className="r num hide-sm">{y ? pct(y) : '—'}</td>
                      <td className="r num">{own ? fmt(own.qty * E.price(s, i.id)) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <Trade key={sel.id} s={s} id={sel.id} act={act} />
      </div>
    </>
  );
}

function Trade({ s, id, act }: { s: E.GameState; id: string; act: Act }) {
  const ins = INSTRUMENTS.find((i) => i.id === id)!;
  const [amt, setAmt] = useState('');
  const p = E.price(s, id);
  const hist = E.priceHistory(s, id);
  const own = s.holdings[id];
  const ownVal = own ? own.qty * p : 0;
  const isCash = id === 'savings';
  const dollars = Number(amt) || 0;
  const y = isCash ? E.savingsRate(s) : ins.yield;
  return (
    <section className="card stack" aria-label={`Trade ${ins.name}`}>
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: 4 }}>
          <h3>{ins.name}</h3>
          <RiskPill risk={ins.risk} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="num" style={{ fontSize: '1.4rem' }}>{fmtPrice(p)}</div>
          <div className="small muted">{isCash ? 'per unit' : `start ${fmtPrice(hist[0])}`}</div>
        </div>
      </div>
      {!isCash && <Spark values={hist} />}
      <p className="small muted">{ins.desc}</p>
      <div className="row small">
        <span>{isCash ? 'Interest' : ins.kind === 'bonds' || (ins.kind === 'etf' && ins.risk === 'low') ? 'Coupon' : 'Dividend'}: <strong className="num">{y ? pct(y) : 'none'}</strong> a year</span>
        {own && (
          <span>
            · You hold <strong className="num">{fmt(ownVal)}</strong> (<Money v={ownVal - own.cost} color /> vs cost)
          </span>
        )}
      </div>
      <label className="stack" style={{ gap: 4 }} htmlFor={`amt-${id}`}>
        <span className="small muted">Amount in dollars</span>
        <div className="row">
          <input id={`amt-${id}`} type="number" min={0} step="any" placeholder="0" value={amt} onChange={(e) => setAmt(e.target.value)} style={{ flex: 1 }} />
          <button className="btn" onClick={() => setAmt(String(Math.floor(s.cash)))}>All cash</button>
          {own && <button className="btn" onClick={() => setAmt(String(Math.floor(ownVal)))}>All held</button>}
        </div>
      </label>
      {dollars > 0 && !isCash && <span className="small muted">≈ {(dollars / p).toLocaleString('en-US', { maximumFractionDigits: 4 })} units</span>}
      <div className="row">
        <button className="btn primary" disabled={!dollars} onClick={() => act((x) => E.buyInstrument(x, id, dollars / p), `${isCash ? 'Deposited' : 'Bought'} ${fmt(dollars)} of ${ins.name}`) && setAmt('')}>
          {isCash ? 'Deposit' : 'Buy'}
        </button>
        <button className="btn" disabled={!dollars || !own} onClick={() => act((x) => E.sellInstrument(x, id, Math.min(own!.qty, dollars / p)), `${isCash ? 'Withdrew' : 'Sold'} ${fmt(Math.min(dollars, ownVal))} of ${ins.name}`) && setAmt('')}>
          {isCash ? 'Withdraw' : 'Sell'}
        </button>
        <span className="small muted">Cash available: <span className="num">{fmt(s.cash)}</span></span>
      </div>
    </section>
  );
}

export function Property({ s, act }: { s: E.GameState; act: Act }) {
  const [selId, setSel] = useState(PROPERTIES[0].id);
  const lim = E.lendingLimit(s);
  return (
    <>
      <div className="panel-head">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Year {s.turn} · mortgage rate today {pct(E.policyRate(s) + E.MORTGAGE_SPREAD, 2)}</span>
          <h2>Real estate</h2>
          <p className="muted">Rent divided by price is your yield. Upkeep and property tax cost {pct(E.UPKEEP)} of the price each year. Banks lend while your loan payments stay under 40% of salary plus 70% of rent income.</p>
        </div>
      </div>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Property</th><th className="r">Price</th><th className="r">Rent / yr</th><th className="r">Yield</th></tr>
              </thead>
              <tbody>
                {PROPERTIES.map((pd) => {
                  const p = E.propPrice(s, pd.id);
                  const r = E.propRent(s, pd.id);
                  const owned = s.properties.filter((x) => x.propId === pd.id).length;
                  return (
                    <tr key={pd.id} className={pd.id === selId ? 'sel' : ''} onClick={() => setSel(pd.id)}>
                      <td style={{ whiteSpace: 'normal', minWidth: 150 }}>
                        <div style={{ fontWeight: 600 }}>{pd.name}</div>
                        {owned > 0 && <span className="pill good plain">Own {owned}</span>}
                      </td>
                      <td className="r num">{fmt(p)}</td>
                      <td className="r num">{fmt(r)}</td>
                      <td className="r num">{pct(r / p)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <BuyProperty key={selId} s={s} propId={selId} act={act} />
      </div>
      <section className="card stack">
        <div className="spread">
          <h3>Your properties</h3>
          <span className="small muted">Loan payments <span className="num">{fmt(lim.payments)}</span> of <span className="num">{fmt(lim.max)}</span> allowed</span>
        </div>
        {s.properties.length === 0 && <p className="muted small">You rent your home and own no property yet.</p>}
        {s.properties.map((op) => {
          const pd = PROPERTIES.find((x) => x.id === op.propId)!;
          const p = E.propPrice(s, op.propId);
          const loan = s.loans.find((l) => l.propUid === op.uid);
          return (
            <div key={op.uid} className="spread" style={{ flexWrap: 'wrap', borderBottom: '1px dashed var(--line)', paddingBottom: 10 }}>
              <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                <strong>{pd.name} {op.residence && <span className="pill vgood plain">Your home</span>}</strong>
                <span className="small muted">
                  Worth <span className="num">{fmt(p)}</span> (paid {fmt(op.paid)}) · {op.residence ? 'no rent while you live here' : <>rent <span className="num">{fmt(E.propRent(s, op.propId))}</span>/yr</>}
                  {loan && <> · mortgage <span className="num">{fmt(loan.principal)}</span></>}
                </span>
              </div>
              <div className="row">
                <button className="btn" onClick={() => act((x) => E.setResidence(x, op.residence ? null : op.uid), op.residence ? 'Moved out. You rent again and this property earns rent.' : `Moved into ${pd.name}. No more rent to pay.`)}>
                  {op.residence ? 'Move out' : 'Move in'}
                </button>
                <button className="btn danger" onClick={() => act((x) => E.sellProperty(x, op.uid), `Sold ${pd.name}`)}>Sell</button>
              </div>
            </div>
          );
        })}
        {s.properties.length > 0 && <p className="small muted">Selling costs {pct(E.SELL_COST, 0)} in fees; any mortgage is repaid from the proceeds. Pay mortgages down early under Wallet.</p>}
      </section>
    </>
  );
}

function BuyProperty({ s, propId, act }: { s: E.GameState; propId: string; act: Act }) {
  const pd = PROPERTIES.find((x) => x.id === propId)!;
  const p = E.propPrice(s, propId);
  const minDown = Math.ceil(p * E.MIN_DOWN);
  const [down, setDown] = useState(String(minDown));
  const [years, setYears] = useState(30);
  const d = Math.min(Number(down) || 0, p);
  const principal = Math.max(0, p - d);
  const rate = E.policyRate(s) + E.MORTGAGE_SPREAD;
  const pay = principal > 0 ? E.loanPayment({ uid: '', kind: 'mortgage', label: '', principal, rate, turnsLeft: years }) : 0;
  const rent = E.propRent(s, propId);
  const upkeep = p * E.UPKEEP;
  const firstYear = rent - upkeep - principal * rate;
  const lim = E.lendingLimit(s);
  const hist = E.propHistory(s, propId);
  return (
    <section className="card stack" aria-label={`Buy ${pd.name}`}>
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: 2 }}>
          <h3>{pd.name}</h3>
          <span className="small muted">{pd.desc}</span>
        </div>
        <div className="num" style={{ fontSize: '1.3rem' }}>{fmt(p)}</div>
      </div>
      <Spark values={hist} height={90} />
      <table className="ledger">
        <tbody>
          <tr><td>Rent income</td><td className="r num gain">{fmt(rent)}</td></tr>
          <tr><td>Upkeep and tax</td><td className="r num loss">{fmt(-upkeep)}</td></tr>
          <tr><td>Mortgage interest, year 1</td><td className="r num loss">{fmt(-principal * rate)}</td></tr>
          <tr className="total"><td>Net from renting it out, year 1</td><td className={`r num ${firstYear >= 0 ? 'gain' : 'loss'}`}>{fmt(firstYear)}</td></tr>
        </tbody>
      </table>
      <div className="grid2" style={{ gap: 10 }}>
        <label className="stack" style={{ gap: 4 }} htmlFor={`down-${propId}`}>
          <span className="small muted">Down payment (min {fmt(minDown)})</span>
          <input id={`down-${propId}`} type="number" min={minDown} value={down} onChange={(e) => setDown(e.target.value)} />
        </label>
        <label className="stack" style={{ gap: 4 }} htmlFor={`yrs-${propId}`}>
          <span className="small muted">Mortgage term</span>
          <select id={`yrs-${propId}`} value={years} onChange={(e) => setYears(+e.target.value)}>
            {[5, 10, 15, 20, 25, 30].map((y) => <option key={y} value={y}>{y} years</option>)}
          </select>
        </label>
      </div>
      <span className="small muted">
        {principal > 0 ? (
          <>Borrow <span className="num">{fmt(principal)}</span> at {pct(rate, 2)}: <span className="num">{fmt(pay)}</span> a year. Room left under your limit: <span className={`num ${pay > lim.room ? 'loss' : ''}`}>{fmt(lim.room)}</span>.</>
        ) : (
          'Paid in full, no mortgage.'
        )}
      </span>
      <div className="row">
        <button className="btn primary" onClick={() => act((x) => E.buyProperty(x, propId, d, years), `Bought ${pd.name}`)}>Buy for {fmt(d)} down</button>
        <button className="btn" onClick={() => setDown(String(Math.min(Math.floor(s.cash), p)))}>Use all cash</button>
      </div>
    </section>
  );
}
