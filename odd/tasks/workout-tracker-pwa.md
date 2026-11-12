Objective: local-first, single-user iOS-installable PWA to create workout routines and track sessions over time.
Branch: feat/workout-tracker-pwa · Delivery: ask-on-risk · Test runner: Vitest (`npm test`)

## Specs

- S1 Routines: the user "pueda agregar mas rutinas y hacerle seguimiento" — create, edit, archive/delete routines, each with an ordered list of exercises (name, target sets, target reps, optional notes).
- S2 Sessions: start a workout from a routine, log sets (reps, weight), see the previous session's values for reference, finish and save it.
- S3 History: list past sessions newest first, view details, delete a session.
- S4 Progress: per exercise, show the evolution over time (best weight and volume per session) as a chart.
- S5 Backup: "Exportar datos" produces a versioned `.json` with all data, shared via the iOS share sheet (download fallback). "Importar datos" opens the file picker, validates before loading, and lets the user choose "reemplazar" or "combinar ... sin duplicar". Old backup versions must remain importable.
- S6 PWA: installable from Safari ("Agregar a inicio"), works offline, data stored on device in IndexedDB, requests persistent storage (`navigator.storage.persist()`).
- S7 Backup reminder: show a reminder like "hace 2 semanas que no hacés backup" when the last export is older than 14 days.
- Assumption: UI copy in English by default (artifact language rule); strings kept simple to translate later.

## Tasks

- [x] T1 S1-S7 scaffold + domain (types, backup validation/merge, progress) with tests — inline — 199fb00
- [x] T2 S1-S3 persistence (Dexie) + routines, session logging, history UI — inline — UI commit
- [x] T3 S4 progress chart UI — inline — UI commit
- [x] T4 S5 S7 backup screen + reminder — inline — UI commit
- [x] T5 S6 PWA manifest, service worker, icons, persistence request, README — inline — UI commit

## Log

- L1 (2026-11-12) User request: "quiero crear una app para ios que sirva para hacer seguimiento de rutinas de ejercicio a lo largo del tiempo y que sirva para ios, no se que tan dificil sea hacerla, pero si una de las funcionalidades debe ser que el usuario que va a ser una sola persona de manera local pueda agregar mas rutinas y hacerle seguimiento"
- L2 Decisions: user develops on Linux without a Mac and wants the app "instalada de forma permanente" without paying → PWA. User asked: "se podria hacer pwa para poder cargar despues los datos guardados ?" → export/import backup. Then: "si, arranca con el proyecto".
- L3 Evidence (2026-11-12): 37 Vitest tests pass; `npm run build` and `npm run lint` clean; headless Chromium smoke test (iPhone viewport) 13/13: create routine, log workout, draft survives reload, history, progress, export file, invalid import rejected, merge import without duplicates, reminder clears after export. Not verified on a real iPhone/Safari (share sheet, Add to Home Screen, storage persistence).
- L4 Next: deploy to an HTTPS static host and install from Safari on the iPhone.
