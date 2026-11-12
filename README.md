# Workout Tracker

A local-first Progressive Web App (PWA) with a Spanish user interface to create workout routines and track them over time. It is designed for a single person on an iPhone: install it from Safari, use it offline, and keep all data on the device.

## Features

- **Routines**: create, edit, reorder, archive, and delete routines with exercises (target sets and reps, optional notes).
- **Workouts**: start a routine, log reps and weight per set, and see what you did last time. Progress is saved on every change, so closing the app mid-workout loses nothing.
- **History**: every finished workout, with duration, completed sets, and volume.
- **Progress**: chart per exercise of best weight, best reps (for bodyweight exercises), or volume.
- **Backup**: export everything to a `.json` file (share sheet → *Save to Files* / iCloud Drive) and import it later in **Merge** (no duplicates) or **Replace** mode. A reminder appears when the last backup is older than 7 days.

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 19 + TypeScript, built with Vite |
| Storage | IndexedDB through [Dexie](https://dexie.org) |
| Offline / install | `vite-plugin-pwa` (service worker + web manifest) |
| Tests | Vitest + `fake-indexeddb` |

## Project structure

```
src/
  domain/      Pure business rules: model, backup format + validation + merge, progress, session drafts
  data/        IndexedDB access (Dexie) and the backup import service
  features/    One folder per screen: routines, workout, history, progress, backup
  shared/      Router, formatting helpers, and small UI components
```

The domain layer has no React or browser dependencies, so it is fully covered by fast unit tests.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run lint
npm run build      # production build in dist/
npm run preview    # serve the production build
```

### Try it on your iPhone during development

```bash
npm run dev -- --host
```

Open the printed `Network` URL (for example `http://192.168.1.20:5173`) in Safari on an iPhone connected to the same Wi-Fi network. Offline mode and installation need HTTPS, so use a deployed copy for daily use.

## Install on iPhone (permanent)

1. Deploy `dist/` to any static HTTPS host (see below).
2. Open the URL in **Safari**.
3. Tap **Share → Add to Home Screen**.

The installed app works offline and keeps its own storage, separate from Safari tabs.

### Deploy to GitHub Pages (free)

The repository includes `.github/workflows/deploy.yml`, which lints, tests, builds, and publishes the app on every push to `main`.

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
4. Open `https://<user>.github.io/<repository-name>/` in Safari on your iPhone and add it to the home screen.

The workflow sets the base path from the repository name automatically (`/` for a `<user>.github.io` repository). To build the same thing locally:

```bash
BASE_PATH=/<repository-name>/ npm run build
```

### Updates

When a new version is deployed, the installed app shows a **"Nueva versión disponible"** prompt instead of reloading on its own. An in-progress workout is saved on every change, so updating never loses it. The current version is shown at the bottom of the Backup screen.

Netlify, Vercel, or Cloudflare Pages also work with the default build (`npm run build`, output folder `dist`).

## Keeping your data safe

- Data lives in the browser storage of the installed app on your device. **Deleting the home screen icon deletes its data.**
- Data belongs to the URL the app was installed from. If you move the app to a new URL or a new iPhone, export a backup first and import it in the new installation.
- Export a backup regularly (the app reminds you every 7 days) and keep it in iCloud Drive.

## Backup format

Backups are JSON files with a `format` and `version` field:

```json
{ "format": "workout-tracker-backup", "version": 1, "exportedAt": "…", "routines": [], "sessions": [] }
```

Imports are validated before anything is written. When the data shape changes in the future, bump `BACKUP_VERSION` in `src/domain/backup.ts` and add a migration so older backups stay importable.
