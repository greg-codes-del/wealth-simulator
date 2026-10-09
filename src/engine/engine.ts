// Game rules. Every function is pure: it takes a state and returns a new one,
// or throws an Error whose message is shown to the player.
import {
  ACHIEVEMENTS, CATS, CAT_LABEL, CHARACTERS, GENERAL_DREAMS, GOODS, INSTRUMENTS, INSURANCE,
  PROPERTIES, SERVICES, type Cat, type Character, type DreamDef, type Risk,
} from './data';
import { getScenario, mulberry32 } from './scenario';

export const TURNS = 30;
export const START_AGE = 22;
export const INFLATION = 0.03;
export const SALARY_GROWTH = 0.03;
export const CONDITION_DECAY = 20; // points lost each year
export const CONDITION_PER_PCT = 4; // points gained per 1% of salary spent
export const BONUS_BASE = 900; // yearly payout for a very good condition, in year-1 dollars
export const MIN_DOWN = 0.1;
export const MORTGAGE_SPREAD = 0.035;
export const CREDIT_SPREAD = 0.12;
export const SELL_COST = 0.03;
export const UPKEEP = 0.015; // yearly property tax and maintenance, share of price
export const MAX_DEBT_SERVICE = 0.4; // loan payments may not exceed this share of qualifying income

export interface Holding { qty: number; cost: number }
export interface OwnedProperty { uid: string; propId: string; boughtTurn: number; paid: number; residence: boolean }
export interface Loan { uid: string; kind: 'mortgage' | 'credit'; label: string; principal: number; rate: number; turnsLeft: number; propUid?: string }
export interface OwnedGood { uid: string; itemId: string; name: string; value: number; dep: number; dream: boolean }
export interface Spend { label: string; amount: number; mult: number }
export interface Line { label: string; amount: number; scoring?: boolean; note?: string }
export interface Temp { label: string; amount: number; turnsLeft: number }

export interface YearReport {
  turn: number;
  income: Line[];
  expenses: Line[];
  events: string[];
  purchases: Spend[];
  scoringSpend: number;
  flowUsed: number;
  pointsEarned: number;
  netWorth: number;
  cash: number;
  notes: string[];
}

export interface HistoryPoint { turn: number; netWorth: number; cash: number; points: number; salary: number }

export interface FinalScore { flowPoints: number; netWorth: number; endCoef: number; capitalPoints: number; total: number }

export interface GameState {
  v: 1;
  seed: number;
  charId: string;
  turn: number; // 1..30, 31 once finished
  finished: boolean;
  cash: number;
  salary: number;
  rentCost: number;
  sliders: Record<Cat, number>; // % of salary
  savingsPct: number;
  conditions: Record<Cat, number>;
  holdings: Record<string, Holding>;
  properties: OwnedProperty[];
  loans: Loan[];
  goods: OwnedGood[];
  bought: Record<string, number>;
  insurance: boolean;
  dreams: string[];
  achievements: string[];
  flowBase: number;
  endCoef: number;
  temps: Temp[];
  points: number;
  pending: Spend[];
  history: HistoryPoint[];
  reports: YearReport[];
  disciplineYears: number;
  uid: number;
  final?: FinalScore;
}

// ---------- helpers ----------
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const r2 = (x: number) => Math.round(x * 100) / 100;

export const character = (s: GameState): Character => CHARACTERS.find((c) => c.id === s.charId)!;
export const scen = (s: GameState) => getScenario(s.seed);
export const idx = (s: GameState) => Math.min(s.turn - 1, TURNS);
export const infl = (s: GameState) => Math.pow(1 + INFLATION, idx(s));
export const age = (s: GameState) => START_AGE + idx(s);
export const policyRate = (s: GameState) => scen(s).rates[idx(s)];
export const savingsRate = (s: GameState) => Math.max(0, policyRate(s) - 0.0075);
export const price = (s: GameState, id: string) => scen(s).prices[id][idx(s)];
export const priceHistory = (s: GameState, id: string) => scen(s).prices[id].slice(0, idx(s) + 1);
export const propPrice = (s: GameState, id: string) => scen(s).props[id].price[idx(s)];
export const propRent = (s: GameState, id: string) => scen(s).props[id].rent[idx(s)];
export const propHistory = (s: GameState, id: string) => scen(s).props[id].price.slice(0, idx(s) + 1);
export const news = (s: GameState) => scen(s).news[Math.min(idx(s), TURNS - 1)];
export const itemPrice = (s: GameState, base: number) => Math.round(base * infl(s));
export const flowCoef = (s: GameState) => r2(s.flowBase + s.temps.reduce((a, t) => a + t.amount, 0));
export const allDreams = (s: GameState): DreamDef[] => [...character(s).dreams, ...GENERAL_DREAMS];

export function likeMult(s: GameState, tags: string[]) {
  return tags.some((t) => character(s).likes.includes(t as never)) ? 1.5 : 1;
}

export function insuranceCost(s: GameState) {
  return itemPrice(s, INSURANCE.price);
}

export function loanPayment(l: Loan) {
  if (l.principal <= 0) return 0;
  const n = Math.max(1, l.turnsLeft);
  if (l.rate <= 0) return l.principal / n;
  return (l.principal * l.rate) / (1 - Math.pow(1 + l.rate, -n));
}

export function holdingsValue(s: GameState) {
  return Object.entries(s.holdings).reduce((a, [id, h]) => a + h.qty * price(s, id), 0);
}

export function balanceSheet(s: GameState) {
  const markets = holdingsValue(s);
  const property = s.properties.reduce((a, p) => a + propPrice(s, p.propId), 0);
  const goods = s.goods.reduce((a, g) => a + g.value, 0);
  const debt = s.loans.reduce((a, l) => a + l.principal, 0);
  const assets = s.cash + markets + property + goods;
  return { cash: s.cash, markets, property, goods, assets, debt, netWorth: assets - debt };
}

export const netWorth = (s: GameState) => balanceSheet(s).netWorth;

export function riskMix(s: GameState) {
  const by: Record<Risk, number> = { low: 0, mid: 0, high: 0 };
  for (const [id, h] of Object.entries(s.holdings)) {
    const ins = INSTRUMENTS.find((i) => i.id === id)!;
    by[ins.risk] += h.qty * price(s, id);
  }
  const total = by.low + by.mid + by.high;
  return { by, total, share: { low: total ? by.low / total : 0, mid: total ? by.mid / total : 0, high: total ? by.high / total : 0 } };
}

export function disciplineCheck(s: GameState) {
  const c = character(s);
  const mix = riskMix(s);
  const minInvested = 5000 * infl(s);
  const cushionNeed = c.cushion * s.salary;
  const liquid = s.cash + (s.holdings.savings?.qty ?? 0);
  const close = (['low', 'mid', 'high'] as Risk[]).every((k) => Math.abs(mix.share[k] - c.target[k]) <= 0.15);
  return {
    ok: mix.total >= minInvested && close && liquid >= cushionNeed,
    invested: mix.total >= minInvested,
    close,
    cushion: liquid >= cushionNeed,
    minInvested,
    cushionNeed,
    liquid,
    mix,
  };
}

export function conditionStatus(v: number): { label: string; tone: 'vgood' | 'good' | 'ok' | 'bad' } {
  if (v >= 80) return { label: 'Very good', tone: 'vgood' };
  if (v >= 60) return { label: 'Good', tone: 'good' };
  if (v >= 25) return { label: 'OK', tone: 'ok' };
  return { label: 'Bad', tone: 'bad' };
}

export function conditionBonus(s: GameState, v: number) {
  const full = BONUS_BASE * infl(s);
  if (v >= 80) return Math.round(full);
  if (v >= 60) return Math.round(full / 2);
  return 0;
}

export function nextCondition(cur: number, pct: number) {
  return Math.max(0, Math.min(100, cur + pct * CONDITION_PER_PCT - CONDITION_DECAY));
}

function nextUid(s: GameState, prefix: string) {
  s.uid += 1;
  return `${prefix}${s.uid}`;
}

// ---------- new game ----------
export function newGame(charId: string, seed: number): GameState {
  const c = CHARACTERS.find((x) => x.id === charId)!;
  const s: GameState = {
    v: 1,
    seed,
    charId,
    turn: 1,
    finished: false,
    cash: c.cash,
    salary: c.salary,
    rentCost: c.rent,
    sliders: { vacation: 10, medicine: 10, entertainment: 10, fitness: 10 },
    savingsPct: 0,
    conditions: { vacation: 50, medicine: 50, entertainment: 50, fitness: 50 },
    holdings: {},
    properties: [],
    loans: [],
    goods: [],
    bought: {},
    insurance: false,
    dreams: [],
    achievements: [],
    flowBase: 1,
    endCoef: 1,
    temps: [],
    points: 0,
    pending: [],
    history: [],
    reports: [],
    disciplineYears: 0,
    uid: 0,
  };
  s.history.push({ turn: 0, netWorth: netWorth(s), cash: s.cash, points: 0, salary: s.salary });
  return s;
}

function assertPlaying(s: GameState) {
  if (s.finished) throw new Error('The game is over. Start a new game to play again.');
}

function spendCash(s: GameState, amount: number) {
  if (amount > s.cash + 0.005) throw new Error(`Not enough cash. You need ${money(amount)} and have ${money(s.cash)}.`);
  s.cash = r2(s.cash - amount);
}

export function money(n: number) {
  const sign = n < 0 ? '−' : '';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
}

// ---------- budget ----------
export function setSlider(s0: GameState, cat: Cat, pct: number): GameState {
  const s = clone(s0);
  s.sliders[cat] = Math.max(0, Math.min(25, Math.round(pct)));
  return s;
}

export function setSavings(s0: GameState, pct: number): GameState {
  const s = clone(s0);
  s.savingsPct = Math.max(0, Math.min(100, Math.round(pct)));
  return s;
}

export function setInsurance(s0: GameState, on: boolean): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  s.insurance = on;
  return s;
}

// ---------- markets ----------
export function buyInstrument(s0: GameState, id: string, qty: number): GameState {
  assertPlaying(s0);
  if (!(qty > 0)) throw new Error('Enter an amount above zero.');
  const s = clone(s0);
  const cost = r2(qty * price(s, id));
  spendCash(s, cost);
  const h = s.holdings[id] ?? { qty: 0, cost: 0 };
  h.qty = r2(h.qty + qty);
  h.cost = r2(h.cost + cost);
  s.holdings[id] = h;
  return s;
}

export function sellInstrument(s0: GameState, id: string, qty: number): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  const h = s.holdings[id];
  if (!h || h.qty <= 0) throw new Error('You do not own any.');
  if (!(qty > 0)) throw new Error('Enter an amount above zero.');
  const q = Math.min(qty, h.qty);
  const share = q / h.qty;
  s.cash = r2(s.cash + q * price(s, id));
  h.cost = r2(h.cost * (1 - share));
  h.qty = r2(h.qty - q);
  if (h.qty <= 0.0001) delete s.holdings[id];
  return s;
}

// ---------- property ----------
export function buyProperty(s0: GameState, propId: string, down: number, years: number): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  const p = propPrice(s, propId);
  const minDown = Math.ceil(p * MIN_DOWN);
  if (down < minDown) throw new Error(`The down payment must be at least ${money(minDown)}.`);
  const d = Math.min(down, p);
  spendCash(s, d);
  const uid = nextUid(s, 'p');
  s.properties.push({ uid, propId, boughtTurn: s.turn, paid: p, residence: false });
  const principal = r2(p - d);
  const yrs = Math.max(1, Math.min(30, Math.round(years)));
  const rate = Math.round((policyRate(s) + MORTGAGE_SPREAD) * 10000) / 10000;
  if (principal > 0) {
    const newPay = loanPayment({ uid: '', kind: 'mortgage', label: '', principal, rate, turnsLeft: yrs });
    const lim = lendingLimit(s);
    if (lim.payments + newPay > lim.max) throw new Error(`The bank declined: loan payments would be ${money(lim.payments + newPay)} a year, above your limit of ${money(lim.max)}. Put more down or choose a longer term.`);
  }
  if (principal > 0) {
    const def = PROPERTIES.find((x) => x.id === propId)!;
    s.loans.push({
      uid: nextUid(s, 'l'),
      kind: 'mortgage',
      label: `Mortgage: ${def.name}`,
      principal,
      rate,
      turnsLeft: yrs,
      propUid: uid,
    });
  }
  return s;
}

/** Banks lend while total loan payments stay under 40% of salary plus 70% of rent income. */
export function lendingLimit(s: GameState) {
  const rents = s.properties.filter((p) => !p.residence).reduce((a, p) => a + propRent(s, p.propId), 0);
  const max = MAX_DEBT_SERVICE * (s.salary + 0.7 * rents);
  const payments = s.loans.reduce((a, l) => a + loanPayment(l), 0);
  return { max, payments, room: Math.max(0, max - payments) };
}

export function sellProperty(s0: GameState, uid: string): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  const op = s.properties.find((p) => p.uid === uid);
  if (!op) throw new Error('Property not found.');
  const gross = propPrice(s, op.propId);
  const loan = s.loans.find((l) => l.propUid === uid);
  const proceeds = gross * (1 - SELL_COST) - (loan?.principal ?? 0);
  if (proceeds < 0 && -proceeds > s.cash) throw new Error(`Selling would leave ${money(-proceeds)} of mortgage unpaid. Add cash first.`);
  s.cash = r2(s.cash + proceeds);
  s.properties = s.properties.filter((p) => p.uid !== uid);
  s.loans = s.loans.filter((l) => l.propUid !== uid);
  return s;
}

export function setResidence(s0: GameState, uid: string | null): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  s.properties.forEach((p) => (p.residence = p.uid === uid));
  return s;
}

export function prepayLoan(s0: GameState, loanUid: string, amount: number): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  const l = s.loans.find((x) => x.uid === loanUid);
  if (!l) throw new Error('Loan not found.');
  if (!(amount > 0)) throw new Error('Enter an amount above zero.');
  const a = Math.min(amount, l.principal);
  spendCash(s, a);
  l.principal = r2(l.principal - a);
  if (l.principal <= 0.5) s.loans = s.loans.filter((x) => x.uid !== loanUid);
  return s;
}

// ---------- shop ----------
function applyCond(s: GameState, cond?: Partial<Record<Cat, number>>) {
  if (!cond) return;
  for (const k of Object.keys(cond) as Cat[]) s.conditions[k] = Math.min(100, s.conditions[k] + (cond[k] ?? 0));
}

function markBought(s: GameState, id: string, notes: string[]) {
  s.bought[id] = (s.bought[id] ?? 0) + 1;
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    if (a.items.every((i) => (s.bought[i] ?? 0) > 0)) {
      s.achievements.push(a.id);
      s.points += a.points;
      s.flowBase = r2(s.flowBase + a.flowBonus);
      notes.push(`Achievement unlocked: ${a.name}. +${a.points.toLocaleString('en-US')} points, Flow +${a.flowBonus}.`);
    }
  }
}

export interface ActionResult { state: GameState; notes: string[] }

export function buyGood(s0: GameState, id: string): ActionResult {
  assertPlaying(s0);
  const s = clone(s0);
  const g = GOODS.find((x) => x.id === id)!;
  const cost = itemPrice(s, g.price);
  spendCash(s, cost);
  const mult = g.mult * likeMult(s, g.tags);
  s.pending.push({ label: g.name, amount: cost, mult });
  s.goods.push({ uid: nextUid(s, 'g'), itemId: id, name: g.name, value: cost, dep: g.dep, dream: false });
  applyCond(s, g.cond);
  if (g.endBonus && !(s0.bought[id] > 0)) s.endCoef = r2(s.endCoef + g.endBonus);
  const notes: string[] = [];
  markBought(s, id, notes);
  return { state: s, notes };
}

export function sellGood(s0: GameState, uid: string): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  const g = s.goods.find((x) => x.uid === uid);
  if (!g) throw new Error('Item not found.');
  if (g.dream) throw new Error('Dreams cannot be sold.');
  s.cash = r2(s.cash + g.value);
  s.goods = s.goods.filter((x) => x.uid !== uid);
  return s;
}

export function serviceLocked(s: GameState, id: string): string | null {
  const sv = SERVICES.find((x) => x.id === id)!;
  if (sv.once && (s.bought[id] ?? 0) > 0) return 'Already completed';
  if (sv.requires && !((s.bought[sv.requires] ?? 0) > 0)) {
    const req = SERVICES.find((x) => x.id === sv.requires)!;
    return `Needs ${req.name}`;
  }
  return null;
}

export function buyService(s0: GameState, id: string): ActionResult {
  assertPlaying(s0);
  const lock = serviceLocked(s0, id);
  if (lock) throw new Error(lock + '.');
  const s = clone(s0);
  const sv = SERVICES.find((x) => x.id === id)!;
  const cost = itemPrice(s, sv.price);
  spendCash(s, cost);
  s.pending.push({ label: sv.name, amount: cost, mult: sv.mult * likeMult(s, sv.tags) });
  if (sv.salaryBoost) s.salary = Math.round(s.salary * (1 + sv.salaryBoost));
  applyCond(s, sv.cond);
  if (sv.tempFlow) s.temps.push({ label: sv.name, amount: sv.tempFlow.amount, turnsLeft: sv.tempFlow.turns });
  if (sv.flowBonus) s.flowBase = r2(s.flowBase + sv.flowBonus);
  const notes: string[] = [];
  markBought(s, id, notes);
  return { state: s, notes };
}

export function buyDream(s0: GameState, id: string): ActionResult {
  assertPlaying(s0);
  if (s0.dreams.includes(id)) throw new Error('You already fulfilled this dream.');
  const s = clone(s0);
  const d = allDreams(s).find((x) => x.id === id)!;
  const cost = itemPrice(s, d.price);
  spendCash(s, cost);
  s.pending.push({ label: `Dream: ${d.name}`, amount: cost, mult: 1 });
  s.dreams.push(id);
  s.endCoef = r2(s.endCoef + d.endBonus);
  if (d.kind === 'goods') s.goods.push({ uid: nextUid(s, 'g'), itemId: id, name: d.name, value: cost, dep: 0, dream: true });
  return { state: s, notes: [`Dream fulfilled: ${d.name}. End coefficient +${d.endBonus}.`] };
}

// ---------- the year ----------
export interface YearCalc {
  income: Line[];
  expenses: Line[];
  newConditions: Record<Cat, number>;
  events: string[];
  salaryMultNext: number;
  rentLost: number;
}

/** Works out a year's cash flow. With an rng it also rolls life events. */
export function computeYear(s: GameState, rng?: () => number): YearCalc {
  const sc = scen(s);
  const i = idx(s);
  const regime = sc.regimes[i];
  const income: Line[] = [];
  const expenses: Line[] = [];
  const events: string[] = [];
  let salaryMult = 1;
  let salaryMultNext = 1;
  let rentLost = 0;
  const f = infl(s);

  const newConditions = { ...s.conditions };
  for (const c of CATS) newConditions[c] = nextCondition(s.conditions[c], s.sliders[c]);

  if (rng) {
    const ownsCar = s.goods.some((g) => ['citycar', 'sedan', 'suv'].includes(g.itemId));
    const rentals = s.properties.filter((p) => !p.residence);
    const edu = Object.keys(s.bought).filter((k) => SERVICES.find((x) => x.id === k)?.group === 'education').length;
    type Ev = { w: number; run: () => void };
    const pool: Ev[] = [
      { w: regime === 'recession' ? 0.3 : regime === 'slowdown' ? 0.1 : 0.04, run: () => { salaryMult = 0.5; events.push('You were laid off and spent six months finding a new job. Half a year of salary lost.'); } },
      { w: 0.06 + 0.025 * edu, run: () => { salaryMultNext *= 1.08; events.push('Promotion! Your salary rises 8% from next year.'); } },
      { w: regime === 'expansion' || regime === 'overheat' ? 0.1 : 0.02, run: () => { income.push({ label: 'Performance bonus', amount: Math.round(s.salary * 0.15) }); events.push('A strong year at work earned you a bonus of 15% of salary.'); } },
      { w: 0.03, run: () => { income.push({ label: 'Inheritance', amount: Math.round(20000 * f) }); events.push('A great-aunt left you an inheritance.'); } },
      { w: 0.05, run: () => { income.push({ label: 'Tax refund', amount: Math.round(1200 * f) }); events.push('You received a tax refund.'); } },
      { w: 0.015, run: () => { income.push({ label: 'Lottery win', amount: Math.round(5000 * f) }); events.push('A scratch card paid out.'); } },
      { w: ownsCar ? 0.15 : 0, run: () => { expenses.push({ label: 'Car repair', amount: Math.round(2000 * f), scoring: false }); events.push('Your car broke down and needed an expensive repair.'); } },
      { w: 0.05, run: () => { expenses.push({ label: 'Stolen phone', amount: Math.round(800 * f), scoring: false }); events.push('Your phone was stolen on the train.'); } },
      { w: 0.08, run: () => { expenses.push({ label: "Friend's wedding", amount: Math.round(1500 * f), scoring: true }); events.push("A close friend's destination wedding: flights, hotel and a gift."); } },
      { w: s.properties.length ? 0.08 : 0, run: () => { expenses.push({ label: 'Property repair', amount: Math.round(3000 * f), scoring: false }); events.push('A burst pipe flooded one of your properties.'); } },
      { w: rentals.length ? 0.1 : 0, run: () => { const p = rentals[Math.floor(rng() * rentals.length)]; rentLost = Math.round(propRent(s, p.propId) / 2); events.push(`A tenant left without notice. Half a year of rent lost on ${PROPERTIES.find((x) => x.id === p.propId)!.name}.`); } },
    ];
    const total = pool.reduce((a, e) => a + e.w, 0);
    if (rng() < Math.min(0.75, total)) {
      let u = rng() * total;
      for (const e of pool) {
        if ((u -= e.w) <= 0) { e.run(); break; }
      }
    }
    // consequences of neglected life conditions
    const nc = newConditions;
    const sickChance = 0.05 + (nc.medicine < 25 ? 0.35 : 0) + (nc.fitness < 25 ? 0.2 : 0);
    if (rng() < sickChance) {
      const cost = Math.round(2500 * f * (s.insurance ? 0.5 : 1));
      expenses.push({ label: 'Illness', amount: cost, scoring: false, note: s.insurance ? 'Insurance paid half' : undefined });
      events.push(s.insurance ? 'You fell ill. Insurance covered half the bill.' : 'You fell ill and paid the treatment yourself.');
    }
    if (nc.entertainment < 25 && nc.vacation < 25 && rng() < 0.3) {
      salaryMult *= 0.94;
      events.push('Burnout: with no rest or fun, you took unpaid leave. 6% of salary lost.');
    } else if (nc.vacation < 25 && rng() < 0.15) {
      salaryMult *= 0.97;
      events.push('Exhaustion: you needed two unpaid weeks off. 3% of salary lost.');
    }
  }

  // income
  income.unshift({ label: 'Salary', amount: Math.round(s.salary * salaryMult) });
  for (const p of s.properties) {
    if (p.residence) continue;
    const def = PROPERTIES.find((x) => x.id === p.propId)!;
    income.push({ label: `Rent: ${def.name}`, amount: propRent(s, p.propId) });
  }
  if (rentLost) income.push({ label: 'Rent lost (tenant left)', amount: -rentLost });
  for (const [id, h] of Object.entries(s.holdings)) {
    const ins = INSTRUMENTS.find((x) => x.id === id)!;
    const amt = id === 'savings' ? h.qty * savingsRate(s) : h.qty * price(s, id) * ins.yield;
    if (amt >= 1) income.push({ label: id === 'savings' ? 'Savings interest' : `${ins.yield && ins.kind === 'bonds' ? 'Coupon' : 'Dividend'}: ${ins.name}`, amount: Math.round(amt) });
  }
  for (const c of CATS) {
    const b = conditionBonus(s, newConditions[c]);
    if (b) income.push({ label: `${conditionStatus(newConditions[c]).label} ${CAT_LABEL[c].toLowerCase()} bonus`, amount: b });
  }

  // expenses
  if (!s.properties.some((p) => p.residence)) expenses.unshift({ label: 'Rent for your home', amount: Math.round(s.rentCost), scoring: true });
  for (const c of CATS) {
    const amt = Math.round((s.sliders[c] / 100) * s.salary);
    if (amt) expenses.push({ label: CAT_LABEL[c], amount: amt, scoring: true });
  }
  const upkeep = s.properties.reduce((a, p) => a + propPrice(s, p.propId) * UPKEEP, 0);
  if (upkeep) expenses.push({ label: 'Property tax and upkeep', amount: Math.round(upkeep), scoring: false });
  if (s.insurance) expenses.push({ label: INSURANCE.name, amount: insuranceCost(s), scoring: true });
  for (const l of s.loans) {
    const pay = loanPayment(l);
    const interest = l.principal * l.rate;
    expenses.push({ label: `${l.label} (interest)`, amount: Math.round(interest), scoring: false });
    expenses.push({ label: `${l.label} (principal)`, amount: Math.round(pay - interest), scoring: false });
  }

  return { income, expenses, newConditions, events, salaryMultNext, rentLost };
}

export function projection(s: GameState) {
  const y = computeYear(s);
  const inc = y.income.reduce((a, l) => a + l.amount, 0);
  const exp = y.expenses.reduce((a, l) => a + l.amount, 0);
  return { ...y, totalIncome: inc, totalExpenses: exp, net: inc - exp };
}

export function endYear(s0: GameState): GameState {
  assertPlaying(s0);
  const s = clone(s0);
  const t = s.turn;
  const rng = mulberry32((s.seed * 2654435761 + t * 97) >>> 0);
  const y = computeYear(s, rng);
  const notes: string[] = [];
  const totalIncome = y.income.reduce((a, l) => a + l.amount, 0);
  const totalExpenses = y.expenses.reduce((a, l) => a + l.amount, 0);
  const net = totalIncome - totalExpenses;
  s.cash = r2(s.cash + net);
  s.conditions = y.newConditions;

  if (net > 0 && s.savingsPct > 0) {
    const dep = Math.round(net * (s.savingsPct / 100));
    if (dep > 0 && dep <= s.cash) {
      const h = s.holdings.savings ?? { qty: 0, cost: 0 };
      h.qty += dep;
      h.cost += dep;
      s.holdings.savings = h;
      s.cash = r2(s.cash - dep);
      notes.push(`${money(dep)} moved to savings automatically.`);
    }
  }

  if (s.cash < 0 && s.holdings.savings) {
    const take = Math.min(s.holdings.savings.qty, -s.cash);
    s.holdings.savings.qty -= take;
    s.holdings.savings.cost -= take;
    if (s.holdings.savings.qty <= 0.5) delete s.holdings.savings;
    s.cash = r2(s.cash + take);
    notes.push(`${money(take)} withdrawn from savings to cover a shortfall.`);
  }
  if (s.cash < 0) {
    const need = -s.cash;
    s.loans.push({ uid: nextUid(s, 'l'), kind: 'credit', label: 'Emergency credit', principal: r2(need), rate: Math.round((policyRate(s) + CREDIT_SPREAD) * 10000) / 10000, turnsLeft: 5 });
    s.cash = 0;
    notes.push(`You ran out of cash. The bank lent you ${money(need)} at ${((policyRate(s) + CREDIT_SPREAD) * 100).toFixed(1)}% over 5 years.`);
  }

  // points for this year's spending
  const purchases = s.pending;
  const purchasePts = purchases.reduce((a, p) => a + p.amount * p.mult, 0);
  const expensePts = y.expenses.filter((e) => e.scoring).reduce((a, e) => a + e.amount, 0);
  const scoringSpend = purchasePts + expensePts;
  const flow = flowCoef(s);
  const earned = Math.round(scoringSpend * flow);
  s.points += earned;

  // coefficient changes earned this year
  if (CATS.every((c) => s.conditions[c] >= 80)) {
    s.flowBase = r2(s.flowBase + 0.03);
    notes.push('Balanced life: all four life conditions very good. Flow +0.03.');
  }
  const disc = disciplineCheck(s);
  if (disc.ok) {
    s.endCoef = r2(s.endCoef + 0.02);
    s.disciplineYears += 1;
    notes.push('Disciplined investor: portfolio on target with a full cushion. End +0.02.');
  }

  // loans amortise
  for (const l of s.loans) {
    const pay = loanPayment(l);
    const interest = l.principal * l.rate;
    l.principal = r2(Math.max(0, l.principal - (pay - interest)));
    l.turnsLeft -= 1;
  }
  s.loans = s.loans.filter((l) => l.principal > 0.5 && l.turnsLeft > 0);

  s.temps = s.temps.map((x) => ({ ...x, turnsLeft: x.turnsLeft - 1 })).filter((x) => x.turnsLeft > 0);
  s.salary = Math.round(s.salary * (1 + SALARY_GROWTH) * y.salaryMultNext);
  s.rentCost = Math.round(s.rentCost * (1 + INFLATION));
  s.goods = s.goods.map((g) => ({ ...g, value: r2(g.value * (1 - g.dep)) }));
  s.pending = [];

  s.turn = t + 1;
  const nw = netWorth(s);
  s.history.push({ turn: t, netWorth: nw, cash: s.cash, points: s.points, salary: s.salary });
  s.reports.push({
    turn: t,
    income: y.income,
    expenses: y.expenses,
    events: y.events,
    purchases,
    scoringSpend: Math.round(scoringSpend),
    flowUsed: flow,
    pointsEarned: earned,
    netWorth: nw,
    cash: s.cash,
    notes,
  });
  if (s.reports.length > 30) s.reports = s.reports.slice(-30);

  if (t >= TURNS) {
    s.finished = true;
    s.final = finalScore(s);
  }
  return s;
}

export function finalScore(s: GameState): FinalScore {
  const nw = netWorth(s);
  const capitalPoints = Math.round(Math.max(0, nw) * s.endCoef);
  return { flowPoints: s.points, netWorth: nw, endCoef: s.endCoef, capitalPoints, total: s.points + capitalPoints };
}

/** Score if the game ended right now, for the header. */
export function scoreIfEndedNow(s: GameState) {
  const pend = s.pending.reduce((a, p) => a + p.amount * p.mult, 0) * flowCoef(s);
  return Math.round(s.points + pend + Math.max(0, netWorth(s)) * s.endCoef);
}
