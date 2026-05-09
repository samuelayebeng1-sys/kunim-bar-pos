# Kunim Guest House Bar — ChalePay POS

A full-featured point-of-sale system for Kunim Guest House Bar, powered by ChalePay. Cashiers can log in with a PIN, take orders from the menu, process payments (Cash, MoMo, Card), and print receipts. Admins can manage the menu, stock, categories, cashiers, and view sales reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/kunim-pos run dev` — run the POS frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Firebase Firestore (real-time DB)
- API: Express 5 (health check only, POS data is in Firebase)
- Charts: Recharts
- Fonts: Syne + Nunito (Google Fonts)

## Where things live

- `artifacts/kunim-pos/src/` — POS React frontend
  - `contexts/AppContext.tsx` — global state + Firebase queries
  - `lib/firebase.ts` — Firebase initialization
  - `lib/types.ts` — TypeScript types
  - `screens/` — Login, POS, Orders, Reports, Admin
  - `components/` — TopNav, modals (Item, Cashier, Category, Restock, Receipt)
- Firebase project: `kunim-bar-pos` — stores orders, menu, cashiers, categories

## Architecture decisions

- Firebase Firestore is used for all POS data (not the local Postgres DB) — the original design was Firebase-first.
- Default seed data is seeded on first load if Firestore collections are empty.
- Admin credentials are stored in React context (session only) — not persisted.
- Recharts replaces Chart.js for consistent React integration.
- No backend routes needed for core POS — all reads/writes go directly to Firestore from the frontend.

## Product

- **Login**: Cashier selects their name and enters a PIN. Admin access via separate modal.
- **POS**: Menu grid with category filters and search. Cart with quantity controls. Cash/MoMo/Card payment. Charge button shows total. Receipt modal with print support.
- **Today**: Today's orders with revenue/count stats by payment method.
- **Reports**: Date-range revenue bar chart, payment breakdown pie chart, top-selling items.
- **Admin Panel**: Dashboard (today stats + week chart), menu item CRUD, stock management with restock, category management, cashier management, account settings.

## User preferences

- Ghana Cedis (GH₵) as currency
- Dark theme with gold (#f0c040) and red (#E01010) accents
- Syne font for headings, Nunito for body

## Gotchas

- Firebase credentials are client-side (intentional — Firestore security rules control access)
- Bluetooth printer connection requires Chrome on Android
- Admin credentials reset on page refresh (stored in React state only)
