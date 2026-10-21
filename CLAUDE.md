# SimSim admin / agent panel

Angular 21 (standalone components, signals) + Tailwind 4. Served at admin.simsim.fit; the build
output folder is `dist/sim-sim-admin`. Backend: `new-backend` repo; public site: `sim-sim-client`.

## Workflow — read first
- Work on a personal branch (e.g. `batyr/dev`) and open a PR into `main`.
- CI on PR/`main` runs `npm ci` + `npm run build -- --configuration=production`.
- **Deploy happens only on a `v*` tag** (`.github/workflows/main.yml`); pushes to `main` only build.
- The production build warns that the initial bundle exceeds the 500 kB budget; this predates the
  cars work and is a warning, not an error.

## Run
```bash
npm ci
npm start                                   # http://localhost:4200
npx ng build --configuration development    # quick compile check
```
`src/app/environments/environment.ts` points to the backend at `http://localhost:8080` and media at
`http://localhost:9000`. If you change it for local testing, revert it before committing.

## Structure
- `pages/` — routed screens (`properties`, `cars`, `dashboard`, `agents`, `products`, …), lazy
  loaded in `app.routes.ts`.
- `components/` — modals and pieces; real-estate forms in `add-edit-property-models/`, cars in
  `car-models/`.
- `shared/services/` — HTTP services (`product/state/product-api.service.ts`,
  `car/car-api.service.ts`, `media.service.ts`, `location.service.ts`).
- `shared/constants/categories.ts` — marketplace categories; `SECTION_ROUTES` maps a category to
  its admin page.

## Shared photo upload
Upload from computer, upload from phone via QR (`/mobile/camera`), the uploaded-files strip and
SSE "Media updated" refreshes are shared by all listing kinds. `ListingKindService` says which
kind is being edited and supplies its backend routes; each section page sets it in `ngOnInit`
(`property` / `car`), and the QR link carries `kind=`. A new listing kind adds an entry to
`LISTING_ROUTES` instead of copying these components.

## Conventions
- i18n: every user-visible string goes through the `t` pipe; add the key to **all three** objects
  (`en`, `uz`, `ru`) in `shared/i18n/translations.ts` — `en` defines the key type, so a missing
  key in `uz`/`ru` is a compile error. Enum labels use `enum.<VALUE>` via `Common.formatEnum`.
- Prettier: 100 columns, single quotes (config in `package.json`).
- Prefer signals and `inject()`; keep components standalone.
