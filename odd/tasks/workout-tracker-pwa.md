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
- S8 Visual redesign: "que sea mas llamativa y bonita que tenga personalidad y algunas animaciones", style chosen: "la deportiva / energética". Dark theme, lime/orange, Barlow Condensed, SVG icons, entrance/stagger/pop animations, progress ring, animated chart, personal-record detection with celebration, weekly streak. Respect reduced motion.
- S9 Calendar: "un calendario para que se vea mas visual lo de las fechas" — month view in Historial, trained days highlighted, record dot, tap a day to filter.
- S10 Storage warning: "que en algun lugar diga de recordar que a los 7 dias se puede perder el progreso si no se guarda" — shown only when running in a browser tab (installed apps are exempt from Safari's 7-day rule); backup reminder lowered to 7 days.
- Assumption: UI copy in English by default (artifact language rule); strings kept simple to translate later.

## Tasks

- [x] T1 S1-S7 scaffold + domain (types, backup validation/merge, progress) with tests — inline — 199fb00
- [x] T2 S1-S3 persistence (Dexie) + routines, session logging, history UI — inline — UI commit
- [x] T3 S4 progress chart UI — inline — UI commit
- [x] T4 S5 S7 backup screen + reminder — inline — UI commit
- [x] T5 S6 PWA manifest, service worker, icons, persistence request, README — inline — UI commit

- [x] T6 S8 sporty redesign + records + streak — inline
- [x] T7 S9 S10 calendar + 7-day storage warning — inline

## Log

- L1 (2026-11-12) User request: "quiero crear una app para ios que sirva para hacer seguimiento de rutinas de ejercicio a lo largo del tiempo y que sirva para ios, no se que tan dificil sea hacerla, pero si una de las funcionalidades debe ser que el usuario que va a ser una sola persona de manera local pueda agregar mas rutinas y hacerle seguimiento"
- L2 Decisions: user develops on Linux without a Mac and wants the app "instalada de forma permanente" without paying → PWA. User asked: "se podria hacer pwa para poder cargar despues los datos guardados ?" → export/import backup. Then: "si, arranca con el proyecto".
- L3 Evidence (2026-11-12): 37 Vitest tests pass; `npm run build` and `npm run lint` clean; headless Chromium smoke test (iPhone viewport) 13/13: create routine, log workout, draft survives reload, history, progress, export file, invalid import rejected, merge import without duplicates, reminder clears after export. Not verified on a real iPhone/Safari (share sheet, Add to Home Screen, storage persistence).
- L4 Next: deploy to an HTTPS static host and install from Safari on the iPhone.
- L5 (2026-11-12) User: "ponela en español" → UI translated to neutral Spanish, es dates/numbers, comma decimals in inputs. 37 tests + smoke 13/13 pass.
- L6 (2026-11-12) User: "la deportiva / energética" → T6 done. 45 Vitest tests (records + weekly streak, TZ-checked in America/Santiago and Asia/Tokyo); smoke 16/16; screenshots reviewed.
- L7 (2026-11-12) User asked for calendar and 7-day warning. Clarified that the 7-day eviction applies only to browser tabs, not installed apps. 49 Vitest tests; smoke 22/22.
