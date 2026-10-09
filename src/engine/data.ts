// All game content: characters, catalogues, instruments, properties.
// Prices are in turn-1 dollars; most catalogue prices rise 3% a year with inflation.

export type Cat = 'vacation' | 'medicine' | 'entertainment' | 'fitness';
export const CATS: Cat[] = ['vacation', 'medicine', 'entertainment', 'fitness'];
export const CAT_LABEL: Record<Cat, string> = {
  vacation: 'Vacation',
  medicine: 'Healthcare',
  entertainment: 'Entertainment',
  fitness: 'Fitness',
};

export type Tag = 'fashion' | 'luxury' | 'tech' | 'education' | 'travel' | 'home' | 'family' | 'car' | 'fitness' | 'art';
export type Risk = 'low' | 'mid' | 'high';

export interface DreamDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  kind: 'goods' | 'service';
  endBonus: number;
  main?: boolean;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  bio: string;
  salary: number;
  rent: number;
  cash: number;
  likes: Tag[];
  likesLabel: string;
  target: Record<Risk, number>;
  cushion: number; // share of annual salary to keep in cash + savings
  dreams: DreamDef[];
}

export const CHARACTERS: Character[] = [
  {
    id: 'mara',
    name: 'Mara Quist',
    title: 'The Collector',
    bio: 'Fresh out of a fashion-business degree. Shopping is how Mara unwinds, and she knows every boutique in town by name. She wants beautiful things that last.',
    salary: 16000,
    rent: 5400,
    cash: 2000,
    likes: ['fashion', 'luxury'],
    likesLabel: 'Fashion and luxury goods earn 1.5x points',
    target: { low: 0.7, mid: 0.25, high: 0.05 },
    cushion: 0.5,
    dreams: [
      { id: 'mara_bag', name: 'Hand-stitched leather handbag', desc: 'A one-of-a-kind piece from a master leatherworker.', price: 42000, kind: 'goods', endBonus: 1.0, main: true },
      { id: 'mara_gown', name: 'Atelier evening gown', desc: 'Made to measure over six fittings.', price: 28000, kind: 'goods', endBonus: 0.25 },
      { id: 'mara_polo', name: 'Lifetime polo club membership', desc: 'Weekends on the lawn, forever.', price: 380000, kind: 'service', endBonus: 0.25 },
    ],
  },
  {
    id: 'theo',
    name: 'Theo Banks',
    title: 'The Builder',
    bio: 'Engineering graduate who tinkers with everything. Theo believes skills compound faster than money and wants a workshop of his own one day.',
    salary: 20000,
    rent: 6000,
    cash: 3500,
    likes: ['tech', 'education'],
    likesLabel: 'Tech goods and education earn 1.5x points',
    target: { low: 0.5, mid: 0.35, high: 0.15 },
    cushion: 0.75,
    dreams: [
      { id: 'theo_loft', name: 'Fully equipped workshop loft', desc: 'CNC mill, laser cutter and a wall of tools.', price: 150000, kind: 'goods', endBonus: 1.0, main: true },
      { id: 'theo_roadster', name: 'Restored electric roadster', desc: 'A classic body with a modern drivetrain.', price: 85000, kind: 'goods', endBonus: 0.25 },
      { id: 'theo_flying', name: 'Private pilot licence', desc: 'Lessons, exams and 60 flight hours.', price: 60000, kind: 'service', endBonus: 0.25 },
    ],
  },
  {
    id: 'ines',
    name: 'Ines Calder',
    title: 'The Globetrotter',
    bio: 'Speaks four languages and has a passport full of stamps. Ines would trade any object for a story, and dreams of sailing around the world.',
    salary: 17000,
    rent: 4800,
    cash: 4000,
    likes: ['travel'],
    likesLabel: 'Travel experiences earn 1.5x points',
    target: { low: 0.6, mid: 0.3, high: 0.1 },
    cushion: 1.0,
    dreams: [
      { id: 'ines_voyage', name: 'Round-the-world sailing voyage', desc: 'Eleven months, thirty ports, one small crew.', price: 120000, kind: 'service', endBonus: 1.0, main: true },
      { id: 'ines_camera', name: 'Expedition camera kit', desc: 'Weather-sealed bodies and three prime lenses.', price: 18000, kind: 'goods', endBonus: 0.25 },
      { id: 'ines_cabin', name: 'Cliffside writing cabin', desc: 'A small timber cabin above the sea.', price: 210000, kind: 'goods', endBonus: 0.25 },
    ],
  },
  {
    id: 'ravi',
    name: 'Ravi Okafor',
    title: 'The Planner',
    bio: 'Accountant by training, careful by nature. Ravi plans a big family and wants a home full of music, so his first rule is never to be caught short.',
    salary: 19000,
    rent: 7200,
    cash: 3000,
    likes: ['home', 'family'],
    likesLabel: 'Home and family purchases earn 1.5x points',
    target: { low: 0.8, mid: 0.15, high: 0.05 },
    cushion: 1.0,
    dreams: [
      { id: 'ravi_piano', name: 'Concert grand piano', desc: 'An heirloom for the whole family.', price: 65000, kind: 'goods', endBonus: 1.0, main: true },
      { id: 'ravi_lake', name: 'Lake house furnishings and boat', desc: 'Everything for long summers by the water.', price: 90000, kind: 'goods', endBonus: 0.25 },
      { id: 'ravi_uni', name: "Children's university fund", desc: 'Tuition paid in full, no loans.', price: 140000, kind: 'service', endBonus: 0.25 },
    ],
  },
];

export const GENERAL_DREAMS: DreamDef[] = [
  { id: 'd_cinema', name: 'Home cinema room', desc: 'Projector, acoustic panels, eight recliners.', price: 31000, kind: 'goods', endBonus: 0.05 },
  { id: 'd_workshop', name: 'Small craft studio', desc: 'Kiln, wheel and a bench for weekend making.', price: 30000, kind: 'goods', endBonus: 0.05 },
  { id: 'd_reno', name: 'Full house renovation', desc: 'New kitchen, floors and windows.', price: 47500, kind: 'goods', endBonus: 0.05 },
  { id: 'd_watches', name: 'Rare watch collection', desc: 'Five references, all with papers.', price: 120000, kind: 'goods', endBonus: 0.05 },
  { id: 'd_bath', name: 'Carved stone bathtub', desc: 'Cut from a single block of rose quartz.', price: 297000, kind: 'goods', endBonus: 0.1 },
  { id: 'd_yacht', name: 'Charter a yacht for a weekend', desc: 'Crew, chef and calm water.', price: 35700, kind: 'service', endBonus: 0.05 },
  { id: 'd_charity', name: 'Fund malaria nets for a village', desc: 'Protects around 2,000 people for three years.', price: 54700, kind: 'service', endBonus: 0.1 },
  { id: 'd_concert', name: 'Book a famous band for a party', desc: 'One night, one setlist, your guests.', price: 59000, kind: 'service', endBonus: 0.05 },
  { id: 'd_school', name: 'Summer school abroad for your child', desc: 'Eight weeks at an old university.', price: 114000, kind: 'service', endBonus: 0.1 },
  { id: 'd_pilot', name: 'A private pilot on call for a year', desc: 'Fly anywhere, any day.', price: 160000, kind: 'service', endBonus: 0.1 },
];

export interface GoodDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  mult: number;
  dep: number; // yearly loss of value
  tags: Tag[];
  cond?: Partial<Record<Cat, number>>;
  endBonus?: number;
}

export const GOODS: GoodDef[] = [
  { id: 'phone', name: 'Flagship phone', desc: 'Loses value fast.', price: 1200, mult: 1.0, dep: 0.3, tags: ['tech'] },
  { id: 'laptop', name: 'Pro laptop', desc: 'Built for heavy work.', price: 2400, mult: 1.0, dep: 0.25, tags: ['tech'] },
  { id: 'suit', name: 'Tailored suit', desc: 'For interviews and weddings.', price: 1800, mult: 1.1, dep: 0.15, tags: ['fashion'] },
  { id: 'designer', name: 'Designer wardrobe', desc: 'A full season from three houses.', price: 9500, mult: 1.3, dep: 0.1, tags: ['fashion', 'luxury'] },
  { id: 'watch', name: 'Swiss mechanical watch', desc: 'Holds its value well.', price: 24000, mult: 1.3, dep: 0.02, tags: ['luxury'], endBonus: 0.02 },
  { id: 'art', name: 'Original oil painting', desc: 'By a rising artist. Keeps its value.', price: 40000, mult: 1.0, dep: 0, tags: ['art', 'luxury'], endBonus: 0.05 },
  { id: 'furniture', name: 'Designer furniture set', desc: 'Sofa, table and shelving.', price: 12000, mult: 1.1, dep: 0.08, tags: ['home', 'family'] },
  { id: 'homegym', name: 'Home gym', desc: 'Rack, weights and a rower. Fitness +20.', price: 6000, mult: 1.0, dep: 0.15, tags: ['fitness', 'home'], cond: { fitness: 20 } },
  { id: 'bike', name: 'Carbon road bike', desc: 'Fitness +15.', price: 3500, mult: 1.0, dep: 0.15, tags: ['fitness'], cond: { fitness: 15 } },
  { id: 'citycar', name: 'Compact city car', desc: 'Cheap to run. 1.2x points.', price: 14000, mult: 1.2, dep: 0.12, tags: ['car'] },
  { id: 'sedan', name: 'Family sedan', desc: 'Room for five. 1.2x points.', price: 32000, mult: 1.2, dep: 0.12, tags: ['car', 'family'] },
  { id: 'suv', name: 'Electric SUV', desc: 'Quiet and quick. 1.2x points.', price: 58000, mult: 1.2, dep: 0.1, tags: ['car', 'tech'] },
];

export interface ServiceDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  mult: number;
  tags: Tag[];
  group: 'education' | 'experience';
  once: boolean;
  salaryBoost?: number;
  requires?: string;
  cond?: Partial<Record<Cat, number>>;
  tempFlow?: { amount: number; turns: number };
  flowBonus?: number;
}

export const SERVICES: ServiceDef[] = [
  { id: 'language', name: 'Foreign language course', desc: 'Raises your salary by 6% for good.', price: 3000, mult: 1, tags: ['education'], group: 'education', once: true, salaryBoost: 0.06 },
  { id: 'adv_language', name: 'Advanced language course', desc: 'Raises your salary by 6%. Needs the language course.', price: 4000, mult: 1, tags: ['education'], group: 'education', once: true, salaryBoost: 0.06, requires: 'language' },
  { id: 'prof_dev', name: 'Professional development program', desc: 'Raises your salary by 8%.', price: 4000, mult: 1, tags: ['education'], group: 'education', once: true, salaryBoost: 0.08 },
  { id: 'project_mgmt', name: 'Project management certificate', desc: 'Raises your salary by 12%.', price: 8000, mult: 1, tags: ['education'], group: 'education', once: true, salaryBoost: 0.12 },
  { id: 'adv_mgmt', name: 'Advanced management program', desc: 'Raises your salary by 15%. Needs professional development.', price: 10000, mult: 1, tags: ['education'], group: 'education', once: true, salaryBoost: 0.15, requires: 'prof_dev' },
  { id: 'bootcamp', name: 'Data skills bootcamp', desc: 'Raises your salary by 14%.', price: 12000, mult: 1, tags: ['education', 'tech'], group: 'education', once: true, salaryBoost: 0.14 },
  { id: 'mba', name: 'MBA', desc: 'Raises your salary by 25%. Needs the project management certificate.', price: 25000, mult: 1, tags: ['education'], group: 'education', once: true, salaryBoost: 0.25, requires: 'project_mgmt' },
  { id: 'weekend', name: 'Weekend city break', desc: 'Vacation +10. 1.2x points.', price: 1500, mult: 1.2, tags: ['travel'], group: 'experience', once: false, cond: { vacation: 10 } },
  { id: 'trip_world', name: 'Trip around the world', desc: '2x points. Flow +0.1 for 3 years. Vacation +30.', price: 18000, mult: 2, tags: ['travel'], group: 'experience', once: false, cond: { vacation: 30 }, tempFlow: { amount: 0.1, turns: 3 } },
  { id: 'concerts', name: 'Season concert pass', desc: 'Entertainment +15.', price: 1200, mult: 1.1, tags: [], group: 'experience', once: false, cond: { entertainment: 15 } },
  { id: 'spa', name: 'Spa retreat', desc: 'Fitness +10, Healthcare +10. 1.2x points.', price: 2500, mult: 1.2, tags: ['travel'], group: 'experience', once: false, cond: { fitness: 10, medicine: 10 } },
  { id: 'trainer', name: 'Personal trainer for a year', desc: 'Fitness +25.', price: 3000, mult: 1, tags: ['fitness'], group: 'experience', once: false, cond: { fitness: 25 } },
  { id: 'checkup', name: 'Premium health check', desc: 'Healthcare +20.', price: 1500, mult: 1, tags: [], group: 'experience', once: false, cond: { medicine: 20 } },
  { id: 'retreat', name: 'Mindfulness retreat', desc: 'Flow +0.05 for the rest of the game.', price: 6000, mult: 1, tags: ['travel'], group: 'experience', once: true, flowBonus: 0.05 },
];

export const INSURANCE = { name: 'Health insurance', price: 900, desc: 'Yearly premium. Halves the cost of illness.' };

export interface AchievementDef {
  id: string;
  name: string;
  items: string[];
  points: number;
  flowBonus: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'a_body', name: 'Body and mind', items: ['trainer', 'spa', 'bike', 'checkup'], points: 15000, flowBonus: 0.05 },
  { id: 'a_sharp', name: 'Dressed to impress', items: ['suit', 'designer', 'watch', 'phone'], points: 30000, flowBonus: 0.05 },
  { id: 'a_learner', name: 'Lifelong learner', items: ['language', 'prof_dev', 'project_mgmt', 'mba'], points: 45000, flowBonus: 0.05 },
  { id: 'a_home', name: 'Nest builder', items: ['furniture', 'homegym', 'art', 'sedan'], points: 30000, flowBonus: 0.05 },
  { id: 'a_world', name: 'Seen the world', items: ['weekend', 'trip_world', 'concerts', 'spa'], points: 18000, flowBonus: 0.05 },
];

export type MarketKind = 'banking' | 'bonds' | 'stocks' | 'indices' | 'etf' | 'commodities' | 'crypto';
export const MARKET_KINDS: { id: MarketKind; label: string }[] = [
  { id: 'banking', label: 'Banking' },
  { id: 'bonds', label: 'Bonds' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'indices', label: 'Indices' },
  { id: 'etf', label: 'ETFs' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'crypto', label: 'Crypto' },
];

export type Model =
  | { type: 'cash' }
  | { type: 'bond'; duration: number; beta: number }
  | { type: 'equity'; beta: number; vol: number; drift: number; special?: 'nimbus' | 'oil' }
  | { type: 'gold' }
  | { type: 'oil' }
  | { type: 'wheat' }
  | { type: 'crypto'; follow?: number };

export interface InstrumentDef {
  id: string;
  name: string;
  kind: MarketKind;
  risk: Risk;
  desc: string;
  price: number;
  yield: number; // dividend or coupon as share of price; savings uses the policy rate
  model: Model;
}

export const INSTRUMENTS: InstrumentDef[] = [
  { id: 'savings', name: 'Savings account', kind: 'banking', risk: 'low', desc: 'Pays the policy rate minus 0.75%. Never loses value. One unit is one dollar.', price: 1, yield: 0, model: { type: 'cash' } },
  { id: 't2', name: 'Treasury 2-year notes', kind: 'bonds', risk: 'low', desc: 'Short government debt. Small price moves when rates change.', price: 100, yield: 0.03, model: { type: 'bond', duration: 2, beta: 0 } },
  { id: 't10', name: 'Treasury 10-year bond fund', kind: 'bonds', risk: 'low', desc: 'Long government debt. Rises when rates fall, falls when rates rise.', price: 100, yield: 0.035, model: { type: 'bond', duration: 7, beta: 0 } },
  { id: 'corp', name: 'Investment-grade corporate bonds', kind: 'bonds', risk: 'low', desc: 'Debt of large, stable companies.', price: 100, yield: 0.048, model: { type: 'bond', duration: 5, beta: 0.12 } },
  { id: 'junk', name: 'High-yield bond fund', kind: 'bonds', risk: 'mid', desc: 'Higher coupons from weaker borrowers. Hit hard in recessions.', price: 100, yield: 0.075, model: { type: 'bond', duration: 4, beta: 0.45 } },
  { id: 'hallmark', name: 'Hallmark Foods', kind: 'stocks', risk: 'mid', desc: 'Packaged food maker. People buy groceries in every economy.', price: 48, yield: 0.035, model: { type: 'equity', beta: 0.6, vol: 0.1, drift: 0.01 } },
  { id: 'northgate', name: 'Northgate Utilities', kind: 'stocks', risk: 'mid', desc: 'Regulated power and water. Steady dividends.', price: 30, yield: 0.045, model: { type: 'equity', beta: 0.4, vol: 0.08, drift: 0 } },
  { id: 'meridian', name: 'Meridian Bank', kind: 'stocks', risk: 'mid', desc: 'Large retail bank. Profits track the economy.', price: 62, yield: 0.04, model: { type: 'equity', beta: 1.2, vol: 0.14, drift: 0 } },
  { id: 'quanta', name: 'Quanta Systems', kind: 'stocks', risk: 'high', desc: 'Fast-growing software company. No dividend.', price: 85, yield: 0, model: { type: 'equity', beta: 1.4, vol: 0.3, drift: 0.05 } },
  { id: 'petrova', name: 'Petrova Energy', kind: 'stocks', risk: 'high', desc: 'Oil producer. Moves with the oil price.', price: 40, yield: 0.03, model: { type: 'equity', beta: 0.5, vol: 0.15, drift: 0, special: 'oil' } },
  { id: 'nimbus', name: 'Nimbus Aerial', kind: 'stocks', risk: 'high', desc: 'Delivery-drone startup with big promises and no profits yet.', price: 12, yield: 0, model: { type: 'equity', beta: 1.6, vol: 0.45, drift: 0.12, special: 'nimbus' } },
  { id: 'world', name: 'World Equity Index Fund', kind: 'indices', risk: 'mid', desc: 'Thousands of companies across developed markets.', price: 100, yield: 0.02, model: { type: 'equity', beta: 1.0, vol: 0.02, drift: 0 } },
  { id: 'tech100', name: 'Tech 100 Index Fund', kind: 'indices', risk: 'mid', desc: 'The hundred largest technology companies.', price: 100, yield: 0.008, model: { type: 'equity', beta: 1.3, vol: 0.06, drift: 0.02 } },
  { id: 'emerging', name: 'Emerging Markets Index', kind: 'indices', risk: 'high', desc: 'Faster-growing, more volatile economies.', price: 50, yield: 0.025, model: { type: 'equity', beta: 1.3, vol: 0.12, drift: 0 } },
  { id: 'aggbond', name: 'Aggregate Bond ETF', kind: 'etf', risk: 'low', desc: 'A mix of government and corporate bonds.', price: 50, yield: 0.04, model: { type: 'bond', duration: 5, beta: 0.05 } },
  { id: 'dividend', name: 'Dividend Leaders ETF', kind: 'etf', risk: 'mid', desc: 'Companies with long records of rising dividends.', price: 60, yield: 0.035, model: { type: 'equity', beta: 0.8, vol: 0.04, drift: 0 } },
  { id: 'reit', name: 'Property REIT ETF', kind: 'etf', risk: 'mid', desc: 'Listed landlords. High payouts, sensitive to rates.', price: 35, yield: 0.05, model: { type: 'equity', beta: 0.9, vol: 0.06, drift: -0.01 } },
  { id: 'clean', name: 'Clean Energy ETF', kind: 'etf', risk: 'high', desc: 'Solar, wind and battery makers. Big swings.', price: 40, yield: 0.01, model: { type: 'equity', beta: 1.3, vol: 0.25, drift: 0.02 } },
  { id: 'gold', name: 'Gold', kind: 'commodities', risk: 'mid', desc: 'Price per ounce. Often rises when stocks fall.', price: 1800, yield: 0, model: { type: 'gold' } },
  { id: 'oil', name: 'Crude oil', kind: 'commodities', risk: 'high', desc: 'Price per barrel. Swings with the business cycle.', price: 75, yield: 0, model: { type: 'oil' } },
  { id: 'wheat', name: 'Wheat', kind: 'commodities', risk: 'high', desc: 'Price per bushel. Driven by weather more than the economy.', price: 6, yield: 0, model: { type: 'wheat' } },
  { id: 'bitcore', name: 'Bitcore', kind: 'crypto', risk: 'high', desc: 'The largest cryptocurrency. Spectacular rallies and crashes.', price: 900, yield: 0, model: { type: 'crypto' } },
  { id: 'lumen', name: 'Lumen Token', kind: 'crypto', risk: 'high', desc: 'A smaller coin that follows Bitcore with extra swing.', price: 40, yield: 0, model: { type: 'crypto', follow: 1.3 } },
];

export interface PropertyDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  yield: number; // starting rent as share of price
  vol: number;
}

export const PROPERTIES: PropertyDef[] = [
  { id: 'studio', name: 'Studio near the university', desc: 'Always rented to students.', price: 95000, yield: 0.068, vol: 0.04 },
  { id: 'flat2', name: 'Two-bedroom city flat', desc: 'Close to the metro.', price: 140000, yield: 0.065, vol: 0.04 },
  { id: 'duplex', name: 'Duplex on a quiet street', desc: 'Two units, two tenants.', price: 120000, yield: 0.07, vol: 0.05 },
  { id: 'bungalow', name: 'Seaside bungalow', desc: 'Holiday lets. Rent swings with tourism.', price: 85000, yield: 0.074, vol: 0.08 },
  { id: 'loft', name: 'Loft in the arts district', desc: 'Neighbourhood is gentrifying.', price: 175000, yield: 0.045, vol: 0.06 },
  { id: 'townhouse', name: 'Suburban townhouse', desc: 'Popular with young families.', price: 210000, yield: 0.05, vol: 0.04 },
  { id: 'chalet', name: 'Mountain chalet', desc: 'Lovely view, short rental season.', price: 260000, yield: 0.032, vol: 0.07 },
  { id: 'family', name: 'Family house with garden', desc: 'Four bedrooms and a big yard.', price: 320000, yield: 0.038, vol: 0.04 },
  { id: 'penthouse', name: 'Downtown penthouse', desc: 'Prestige address, thin rental yield.', price: 540000, yield: 0.03, vol: 0.06 },
];

export const RISK_LABEL: Record<Risk, string> = { low: 'Low risk', mid: 'Mid risk', high: 'High risk' };
