# Canteen menu

Counter, kitchen, and admin screens for a Hillsong São Paulo canteen or event. On screen the product word stays cantina.

## Run locally

Node.js and npm are required.

```sh
npm install
npm run dev
```

Open the URL Vite prints. The dev server listens on `http://127.0.0.1:8080`.

To use the hosted canteen, copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Those values are public. Do not put a service role key in the frontend.

With Supabase configured, each store has its own links:

- `/s/store-slug` menu and counter
- `/s/store-slug/kitchen` kitchen
- `/s/store-slug/orders` public order screen
- `/auth` admin login, limited to that admin's campus

Leave the Supabase values empty to use the local demo database. The terminal prints the admin login for that demo.

## Stack

- Vite
- TypeScript
- React
- shadcn/ui
- Tailwind CSS
