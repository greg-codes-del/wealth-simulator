// Generates the 30-year economic scenario from a seed: business-cycle regimes,
// the policy rate, every instrument's price path, property prices and rents, and news.
import { INSTRUMENTS, PROPERTIES } from './data';

export type Regime = 'expansion' | 'overheat' | 'slowdown' | 'recession' | 'recovery';

export interface Scenario {
  seed: number;
  regimes: Regime[]; // regimes[t] drives the move from index t to t+1 (30 entries)
  rates: number[]; // policy rate at index 0..30
  market: number[]; // broad market return per year (30)
  prices: Record<string, number[]>; // 31 points
  props: Record<string, { price: number[]; rent: number[] }>; // 31 points; rent is annual dollars
  news: string[][]; // headlines shown during year t+1 (30 entries)
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(r: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const N = 30;

const NEWS: Record<Regime, string[]> = {
  expansion: [
    'Factory orders rise for a third straight month',
    'Unemployment falls to a multi-year low',
    'Consumer confidence edges higher',
    'Retail sales beat forecasts',
    'Exporters report full order books',
  ],
  overheat: [
    'Inflation runs hotter than expected',
    'Central bank signals more rate hikes ahead',
    'Analysts warn share prices look stretched',
    'House prices hit another record',
    'Borrowing to buy stocks reaches an all-time high',
  ],
  slowdown: [
    'Growth forecasts trimmed for next year',
    'Manufacturing survey slips into contraction',
    'Companies turn cautious on hiring',
    'Freight volumes fall for the second quarter',
  ],
  recession: [
    'Layoffs spread from tech to manufacturing',
    'Credit markets seize up as lenders pull back',
    'A major lender halts new loans',
    'Economy shrinks, statistics office confirms',
    'Central bank calls an emergency meeting',
  ],
  recovery: [
    'Central bank cuts rates to support growth',
    'Early signs of a hiring rebound',
    'Stimulus package passes parliament',
    'Bargain hunters return to the stock market',
  ],
};

const MARKET_RET: Record<Regime, [number, number]> = {
  expansion: [0.09, 0.09],
  overheat: [0.14, 0.1],
  slowdown: [0.0, 0.07],
  recession: [-0.24, 0.08],
  recovery: [0.2, 0.09],
};

const RATE_STEP: Record<Regime, number> = {
  expansion: 0.0025,
  overheat: 0.0075,
  slowdown: -0.005,
  recession: -0.015,
  recovery: 0,
};

const cache = new Map<number, Scenario>();

export function getScenario(seed: number): Scenario {
  const hit = cache.get(seed);
  if (hit) return hit;
  const s = build(seed);
  cache.set(seed, s);
  return s;
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

function build(seed: number): Scenario {
  const r = mulberry32(seed * 7919 + 17);
  const c1 = 6 + Math.floor(r() * 4); // first crash in year index 6..9
  const c2 = 17 + Math.floor(r() * 5); // second crash 17..21
  const regimes: Regime[] = Array(N).fill('expansion');
  for (const c of [c1, c2]) {
    regimes[c - 1] = 'overheat';
    if (c - 2 >= 0 && r() < 0.5) regimes[c - 2] = 'overheat';
    regimes[c] = 'recession';
    if (r() < 0.35) {
      regimes[c + 1] = 'recession';
      regimes[c + 2] = 'recovery';
    } else {
      regimes[c + 1] = 'recovery';
    }
  }
  // one mild slowdown somewhere in the quiet stretches
  const quiet = regimes.map((g, i) => (g === 'expansion' && i > 2 ? i : -1)).filter((i) => i >= 0);
  if (quiet.length) regimes[pick(r, quiet)] = 'slowdown';
  if (quiet.length > 4) regimes[pick(r, quiet)] = 'slowdown';

  const rates = [0.03];
  for (let t = 0; t < N; t++) {
    const next = Math.min(0.07, Math.max(0.0025, rates[t] + RATE_STEP[regimes[t]]));
    rates.push(Math.round(next * 10000) / 10000);
  }

  const market = regimes.map((g) => {
    const [m, sd] = MARKET_RET[g];
    return m + sd * gauss(r);
  });

  const oilRet = market.map((m) => 0.7 * m + 0.26 * gauss(r));

  // crypto: mania before the first crash, choppy middle, second bubble and bust
  const cryptoRet: number[] = [];
  for (let t = 0; t < N; t++) {
    let x: number;
    if (t < c1 - 1) x = 0.55 + 0.45 * gauss(r);
    else if (t === c1 - 1) x = 0.9 + 0.3 * gauss(r);
    else if (t === c1) x = -0.82;
    else if (t === c1 + 1) x = -0.35 + 0.2 * gauss(r);
    else if (t === c2 - 2 || t === c2 - 1) x = 0.7 + 0.4 * gauss(r);
    else if (t === c2) x = -0.72;
    else x = 0.12 + 0.55 * gauss(r);
    cryptoRet.push(Math.max(-0.9, x));
  }

  const prices: Record<string, number[]> = {};
  for (const ins of INSTRUMENTS) {
    const p = [ins.price];
    const m = ins.model;
    for (let t = 0; t < N; t++) {
      let ret = 0;
      if (m.type === 'cash') ret = 0;
      else if (m.type === 'bond') {
        const dRate = rates[t + 1] - rates[t];
        ret = -m.duration * dRate + m.beta * Math.min(0, market[t]) * 0.6 + 0.01 * gauss(r);
      } else if (m.type === 'equity') {
        ret = m.drift + m.beta * market[t] + m.vol * gauss(r);
        if (m.special === 'oil') ret += 0.6 * oilRet[t];
        if (m.special === 'nimbus') {
          if (t === c2) ret = -0.93;
          else if (t > c2) ret = 0.02 + 0.3 * gauss(r);
          else if (t === c2 - 1) ret = 0.5 + 0.2 * gauss(r);
        }
      } else if (m.type === 'gold') ret = 0.035 - 0.4 * market[t] + 0.11 * gauss(r);
      else if (m.type === 'oil') ret = oilRet[t];
      else if (m.type === 'wheat') ret = 0.02 + 0.22 * gauss(r);
      else if (m.type === 'crypto') ret = m.follow ? Math.max(-0.92, m.follow * cryptoRet[t] + 0.25 * gauss(r)) : cryptoRet[t];
      ret = Math.max(-0.95, ret);
      const next = p[t] * (1 + ret);
      p.push(round2(next));
    }
    prices[ins.id] = p;
  }

  const props: Scenario['props'] = {};
  for (const pd of PROPERTIES) {
    const price = [pd.price];
    let y = pd.yield;
    const rent = [pd.price * y];
    for (let t = 0; t < N; t++) {
      const g = regimes[t];
      let ret = 0.015 + 0.2 * market[t] + pd.vol * gauss(r);
      if (g === 'recession') ret -= 0.06;
      if (g === 'overheat') ret += 0.03;
      price.push(Math.round(price[t] * (1 + ret)));
      y = Math.min(0.085, Math.max(0.025, y + 0.003 * gauss(r)));
      let rr = price[t + 1] * y;
      if (g === 'recession') rr *= 0.92;
      rent.push(Math.round(rr));
    }
    props[pd.id] = { price, rent };
  }

  const news: string[][] = [];
  const all: Regime[] = ['expansion', 'overheat', 'slowdown', 'recession', 'recovery'];
  for (let t = 0; t < N; t++) {
    const actual = regimes[t];
    const h: string[] = [];
    for (let k = 0; k < 2; k++) {
      const g = r() < 0.65 ? actual : pick(r, all.filter((x) => x !== actual));
      let line = pick(r, NEWS[g]);
      if (h.includes(line)) line = pick(r, NEWS[g]);
      if (!h.includes(line)) h.push(line);
    }
    if (t < c1 - 1 && r() < 0.6) h.push(pick(r, ['Bitcore hits a new high as first-time buyers pile in', 'Celebrities launch their own crypto coins', 'Taxi drivers trade crypto tips']));
    if (t === c2 - 1 || t === c2 - 2) h.push(pick(r, ['Crypto funds report record inflows', 'Nimbus Aerial shares soar on a big pilot contract', 'Investors line up for a hot drone IPO']));
    if (t === c2 - 1) h.push('Nimbus Aerial delays first deliveries again, auditors ask questions');
    if (t > c1 && t < c1 + 3 && r() < 0.5) h.push('Regulators open an inquiry into crypto exchanges');
    if (r() < 0.25) h.push(pick(r, ['Drought fears lift grain prices', 'Record harvest expected across the plains', 'Oil producers agree to cut output', 'New oil field comes online offshore', 'Gold buying by central banks picks up']));
    news.push(h);
  }

  return { seed, regimes, rates, market, prices, props, news };
}

function round2(x: number) {
  return x >= 100 ? Math.round(x * 100) / 100 : Math.round(x * 10000) / 10000;
}
