# Wealth Simulator

A single-player web game inspired by the International Economics Olympiad's Financial Literacy Game. You live thirty years after graduation, one year per turn: earn a salary, set a budget, keep your life in balance, invest in markets and property, borrow, and chase your dreams. Your score rewards both spending (at your Flow coefficient) and the wealth you end with (at your End coefficient).

The full rules and every number in the game are in [GAME_RULES.md](GAME_RULES.md).

## Put it online with Vercel (no installs needed)

1. **GitHub:** create a new repository (for example `wealth-simulator`), then on its empty page click **uploading an existing file** and drag in *everything inside this folder* (not the folder itself). Click **Commit changes**.
2. **Vercel:** on vercel.com click **Add New… → Project**, pick the repository, click **Import**, leave all settings as they are, and click **Deploy**.
3. After a minute or two you get a public link like `wealth-simulator.vercel.app`.

Vercel detects this as a Vite project automatically (build command `npm run build`, output folder `dist`). Every change you commit to GitHub is republished automatically.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/engine/data.ts` | Characters, dreams, shop items, achievements, instruments, properties. Edit prices and bonuses here. |
| `src/engine/scenario.ts` | Builds the 30-year economy from the scenario number: business cycle, interest rates, prices, news. |
| `src/engine/engine.ts` | Game rules: budget, life conditions, events, loans, scoring. Tuning constants are at the top. |
| `src/ui/*.tsx`, `src/App.tsx` | Screens. |
| `src/styles.css` | Look and feel, with light and dark themes. |

Progress is saved in the player's browser, so a refresh resumes the game. There is no server or database.

## Running it on a computer (optional)

If you ever want to run it locally: install Node.js 18+, then `npm install` and `npm run dev`.
