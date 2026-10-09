# Wealth Simulator: game rules

## The basics

- 30 turns, one per year, from age 22 to 52. Within a year you can act as often as you like; **End year** pays income, takes expenses, rolls life events and moves every price to next year.
- Four characters with different salaries, rent, starting cash, favourite purchase types (1.5x points), target portfolio and dreams.
- The scenario number fixes the economy: same number, same business cycle, prices, news and random events.
- Salary grows 3% a year. Rent and all shop and dream prices rise 3% a year.

## Scoring

**Final score = points from spending + max(0, net worth after year 30) × End coefficient.**

- Spending points each year = (rent + life expenses + insurance + purchases × their multiplier) × the Flow coefficient at year end.
- No points for loan interest or repayments, property upkeep, illness, repairs or market losses.
- Flow starts at 1.00. It rises with: trip around the world (+0.10 for 3 years), mindfulness retreat (+0.05), each achievement (+0.05), and each year all four life conditions end very good (+0.03).
- End starts at 1.00. It rises with: dreams (life dream +1.0, other personal dreams +0.25, general dreams +0.05 to +0.10), the first watch (+0.02) and painting (+0.05), and each "disciplined investor" year (+0.02).
- Disciplined investor year: at least $5,000 (inflated) in markets, each risk bucket within 15 points of your character's target, and cash plus savings at least your cushion share of salary.

## Life conditions

Vacation, healthcare, entertainment and fitness each run from 0 to 100, starting at 50.

- Each year: condition − 20 + 4 × (percent of salary spent on it), capped 0 to 100. Sliders go from 0% to 25%.
- 80+ very good pays $900 a year (inflated); 60+ good pays half.
- Below 25 is bad: illness chance rises (healthcare bad +35%, fitness bad +20%, base 5%), costing $2,500 inflated (half with insurance). Vacation and entertainment both bad: 30% chance of burnout (−6% of that year's salary). Vacation bad alone: 15% chance of exhaustion (−3%).
- Because the bonus grows only with inflation while the cost grows with your salary, keeping conditions high eventually stops paying.

## Life events

At most one random event a year (about 60 to 75% chance), weighted by the economy and your situation: layoff (half a year's salary, much likelier in a recession), promotion (+8% salary, likelier with more education), performance bonus, inheritance, tax refund, lottery, car repair (if you own a car), stolen phone, a friend's wedding, property repair (if you own property), tenant leaving (half a year's rent).

## Shop

- **Education** (one-time): language +6%, advanced language +6% (needs language), professional development +8%, project management +12%, advanced management +15% (needs professional development), data bootcamp +14%, MBA +25% (needs project management). Boosts multiply your salary.
- **Experiences**: weekend break, trip around the world, concert pass, spa, personal trainer, health check, mindfulness retreat. Most lift a life condition.
- **Goods** stay on your balance sheet and lose a set share of value each year. Cars earn 1.2x points.
- **Health insurance** is a yearly subscription.

## Achievements

Five sets of four items. Completing a set gives flat points (15,000 to 45,000) and Flow +0.05.

## Markets

Banking (savings account at the policy rate − 0.75%), bonds, stocks, index funds, ETFs, commodities and crypto, each tagged low, mid or high risk. Prices are generated from the scenario: two recessions (one in years 7 to 10, one in years 18 to 22) with an overheating phase before each, a recovery after, and one or two slowdowns. Bonds rise when rates fall. Gold tends to rise when stocks fall. Crypto has a mania before each crash. One high-risk stock collapses in the second crash. News hints at the coming year but is right only about two thirds of the time.

## Property

- Nine properties with their own price and rent paths. Upkeep and property tax cost 1.5% of the price a year.
- Mortgage: at least 10% down, 5 to 30 years, rate fixed at the policy rate + 3.5%. Banks lend only while total loan payments stay under 40% of salary plus 70% of rent income.
- You can pay any loan down early. Selling costs 3% and repays the mortgage.
- Move into a property you own to stop paying rent (it then earns no rent).

## Running out of money

If cash is negative at year end, savings are used first, then the bank gives emergency credit at the policy rate + 12% over 5 years.

## Dreams

Personal dreams (one life dream at End +1.0) and ten general dreams. Goods dreams keep their full price in your net worth; service dreams are spent.
