# Decisions — authoritative

Codex must not reopen these decisions without a concrete blocker documented in a checkpoint report.

| Topic | Decision |
|---|---|
| Product name | `max&gym` |
| Repository slug | `max-and-gym` |
| Tagline | `Train with intent.` |
| Interface language | English only |
| Primary platform | Android APK through Capacitor; installable web application remains supported |
| Hosting | GitHub Pages via GitHub Actions |
| Technical foundation | RepQuest |
| UI donor | Workout.cool, visual/reference role only |
| Production UI system | Material UI only |
| Final licence | GNU General Public License version 3 or later, with retained MIT notices for reused Workout.cool portions |
| Data | Local-only; no account or sync |
| Database | IndexedDB through Dexie |
| Routing | Hash router unless Task 00 proves an equally reliable static alternative |
| Updates | Prompted service-worker update; never force reload during an active workout |
| Exercise source | Curated, reviewed, locally bundled subset of Free Exercise DB |
| Seed exercise media | Two-position local images |
| Custom exercise media | One local image in version 1 |
| Video demonstrations | Deferred from version 1 |
| Runtime network | No third-party runtime dependency for core features |
| User level | Advanced |
| Training goals | Strength, hypertrophy, conditioning |
| Frequency | Two or three gym sessions per week |
| Main session length | 40 or 60 minutes, including warm-up, transitions, and conditioning |
| Core session length | 10 or 15 minutes |
| Equipment | Full commercial gym |
| Units | Kilograms, centimetres, minutes, seconds |
| Effort metric | Repetitions in Reserve by default; Rating of Perceived Exertion optional |
| Default split | Full Body A/B for two days; Full Body A/B/C for three days |
| Default block | Six weeks |
| Variety | Main lifts stable 4–6 weeks; accessories may rotate every 2–4 weeks |
| Progression | Deterministic proposals, never applied without confirmation |
| Conditioning | Bike, incline treadmill, elliptical, sled, or controlled loaded carry |
| Hard exclusions | Bunny jumps, burpees, plank-to-stand, rapid floor-to-standing, comparable high-impact transitions |
| Floor exercises | Allowed when controlled and grouped to reduce repeated transitions |
| Warm-up | Short dynamic warm-up plus exercise-specific ramp-up; optional low-back-comfort sequence |
| Medical positioning | Training tool only; no diagnosis, treatment, or rehabilitation claims |
| Tracking | Workouts, body weight, measurements, progress photos |
| Photos | Compressed local blobs; no uploads and no service-worker caching |
| Theme | Dark only in version 1 |
| Visual direction | Restrained graphite surfaces, mineral-teal accent, modern and touch-first |
| Mobile navigation | Home, Train, Programs, Progress, Library |
| Program reordering | Explicit move up/down controls required; pointer drag-and-drop is optional only if audit proves low risk and keyboard alternative remains |
| Desktop navigation | Responsive side rail/sidebar |
| Analytics and telemetry | None |
| Artificial intelligence | None at runtime in version 1 |
| Social, nutrition, payments | Out of scope |
| First internal release | Complete dependable workout vertical slice at Checkpoint 3 |
| Diagnostic export | Separate from personal-data backup; redacted by default |
| Timer guarantee | Android APK uses a native exact-alarm projection; the web/PWA build retains accurate timestamp recovery and best-effort alerts |
