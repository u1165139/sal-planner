# Salary vs Dividends Optimisation Calculator

Australian small business owner tax optimisation tool for the 2025-26 financial year.

## Features

- Calculates the mathematically optimal owner salary to minimise combined company + personal tax
- Scenario A: Tax-optimised salary (where personal marginal rate crosses company rate)
- Scenario B: Living expense-driven salary (minimum gross to cover after-tax cash needs)
- Optional super maximisation (SGC 11.5%, capped at $30,000 concessional cap)
- Full tax breakdown: company tax, personal income tax + Medicare levy
- Cash flow proof showing after-tax salary covers living expenses

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v3
- 100% client-side, no backend required

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
```

Output is in the `dist/` folder.

## Deploy to Netlify

### Option 1: Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Option 2: Netlify UI (Drag & Drop)
1. Run `npm run build`
2. Go to [app.netlify.com](https://app.netlify.com)
3. Drag the `dist/` folder onto the deploy zone

### Option 3: Git Integration (Recommended)
1. Push this project to a GitHub/GitLab repo
2. In Netlify: New site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Netlify will auto-deploy on every push

The `netlify.toml` file is already configured for all of the above.

## Project Structure

```
src/
├── tax.ts                    # All tax logic, types, optimisation engine
├── App.tsx                   # Main app component
├── main.tsx                  # React entry point
├── index.css                 # Global styles + CSS variables
└── components/
    ├── InputField.tsx        # Reusable number input
    └── MetricCard.tsx        # Summary metric display card
```

## Tax Constants (2025-26)

| Item | Value |
|------|-------|
| Company Tax Rate (SBBRE) | 25% |
| Medicare Levy | 2% (on income > $18,200) |
| Super SGC Rate | 11.5% |
| Concessional Cap | $30,000 |

### Personal Income Tax Brackets
| Range | Rate |
|-------|------|
| $0 – $18,200 | 0% |
| $18,201 – $45,000 | 16% |
| $45,001 – $135,000 | 30% |
| $135,001 – $190,000 | 37% |
| $190,001+ | 45% |

## Disclaimer

This tool is for informational purposes only and does not constitute financial or tax advice.
Always consult a registered tax agent or accountant for advice specific to your circumstances.
