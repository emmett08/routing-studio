# Evidence Pack: UX-UI-001 (VS Code Native UX/UI Redesign + Debugging)

## Iteration plan (HGP 10.1)

### Classification (type/risk/uncertainty)
- Change type: FEATURE (UX/UI redesign) + HOTFIX (debug tasks)
- Risk: MEDIUM (user-facing UI + VS Code debug ergonomics)
- Uncertainty: MEDIUM (spec is clear, but UI refactor is broad)

### Selected tactic
- Iterative Agile slice (low/medium-risk feature work with fast gates)

### Constraints
- **Must** comply with `routing-studio-vscode-ux-ui-guidelines.md` (v2.0, “source of truth”)
- Use VS Code theme tokens only (`--vscode-*`); no hardcoded colours
- Avoid dashboard/branding UI patterns (no button farms, no badges/pills/cards, no emojis)
- Keep webview security posture (CSP, local assets only, typed message protocol)

### Requirements and acceptance criteria
R1. Standard layout matches spec: `[Left nav] | [Editor] | [Problems/Effects]`
- AC: Right panel is always Problems/Effects (no Raw JSON tab); Raw JSON is an Advanced view.

R2. Navigation matches spec (Primary + Advanced collapsed)
- AC: Primary shows Overview/Providers/Models/Classes/Defaults.
- AC: Advanced (collapsed by default) shows Legacy map / Raw JSON / UI semantics.

R3. Theme integration (strict)
- AC: Webview CSS uses only VS Code theme variables (no literal colours; radius 0–2px; flat layout).

R4. Actions model (no toolbar button farm)
- AC: Per view at most one primary action; secondary actions are subtle or in an overflow menu.

R5. Raw JSON view matches spec
- AC: Read-only preview default + copy.
- AC: Editing is gated behind an explicit toggle with warning; Apply validates.

R6. Validation panel matches spec
- AC: Summary line “Validation: N issues”.
- AC: Issues grouped by Providers/Models/Classes/Defaults/Legacy map.
- AC: Each issue has a “Go to” action that navigates and focuses an appropriate field.
- AC: Success state is understated (no emoji).

R7. VS Code debug ergonomics
- AC: `.vscode/launch.json` + `.vscode/tasks.json` support running the extension with watch tasks.
- AC: No VS Code task validation errors from problem matchers.

R8. Extension manifest warning cleanup
- AC: Add `package.json#icon` to remove “Missing property \"icon\".” warning.

### Assumptions
- VS Code provides standard `--vscode-*` theme variables in the webview host.
- Current routing schema + validation (`src/routing/*`) remains the source of truth.

### Conflicts / unknowns
- Icon file type expectations (SVG vs PNG) for extension listing; we will point `icon` to the existing `media/routing-studio.svg`.
- Full “focus offending field” behaviour varies by issue type; implement best-effort deterministic focus per section.

### Steps
1. Fix debug tasks/launch + manifest icon.
2. Refactor app shell to 3-region layout + nav grouping.
3. Redesign each view to spec (Overview/Providers/Models/Classes/Defaults/Advanced views).
4. Redesign Problems panel (grouping + Go to).
5. Tighten CSS (tokens only, flat lists, low radius).

### Gates to run (HGP 7.1 minimum)
- G0 ADR/spec coherence: confirm changes align with ADR-012 and the UX/UI spec.
- G1 Repo health: `npm ls` (optional quick sanity).
- G2 Format/lint: none configured in repo (record as N/A).
- G3 Typecheck/build: `npm run typecheck`, `npm run build`
- G4 Unit tests: `npm test`

### Evidence to collect
- File diffs for UI/layout, tasks/launch, manifest changes.
- Commands run + pass/fail outputs for gates.

### Stop condition and timebox
- Stop condition: **PASS** when R1–R8 acceptance criteria are met and gates G3–G4 pass.
- Timebox: not specified.

---

## Evidence pack (HGP 10.2)

### Summary of change (what/why)
- Reworked the webview UI to match the repo’s VS Code-native UX/UI spec (v2.0): flat config-editor layout, Primary/Advanced navigation, and a dedicated Problems panel with grouped issues and “Go to” navigation.
- Fixed VS Code debug ergonomics by adding a watch-based debug launch and valid background problem matchers (no task provider errors).
- Removed the extension manifest warning by adding `package.json#icon` (reuses existing `media/routing-studio.svg`).

### ADR/spec alignment
- ADR: `ADR-012-vscode-routing-studio-extension.md` (Option 1 webview-based extension remains unchanged; this work is a UX refinement within that decision).
- UX/UI “source of truth”: `routing-studio-vscode-ux-ui-guidelines.md`

### Requirements → Implementation trace

R1. 3-region layout (Nav | Editor | Problems)
- `src/App.tsx` (layout + narrow-width Problems drawer)
- `src/styles.css` (grid layout + dividers)

R2. Primary + Advanced nav
- `src/ui/Sidebar.tsx` (Primary items + collapsed Advanced group)

R3. Theme integration (no hardcoded colours; low radius; flat)
- `src/styles.css` (VS Code token-only variables; `--radius: 2px`)

R4. Actions model (no button farm)
- Removed top toolbar; Overview uses a single primary action + overflow: `src/ui/Overview.tsx`, `src/ui/components.tsx`

R5. Raw JSON view
- `src/ui/JsonPanel.tsx` (read-only default + gated edit toggle)

R6. Validation panel (grouped + Go to + focus)
- `src/ui/IssuesPanel.tsx` (grouping, summary, Go to)
- Focus plumbing: `src/App.tsx`
- Focus targets:
  - Providers: `src/ui/editors/ProvidersEditor.tsx`
  - Models: `src/ui/editors/ModelsEditor.tsx`
  - Classes: `src/ui/editors/ClassesEditor.tsx`
  - Defaults: `src/ui/editors/DefaultsEditor.tsx`
  - Legacy map: `src/ui/editors/LegacyMapEditor.tsx`

R7. VS Code debug ergonomics
- `.vscode/launch.json` (Build + Watch launch configs)
- `.vscode/tasks.json` (watch tasks with valid background problem matchers)

R8. Manifest icon warning
- `package.json` (`icon`: `media/routing-studio.svg`)

### Verification (Deterministic gates)

Commands run:
- Typecheck: `npm run typecheck` ✅
- Unit tests: `npm test` ✅
- Build: `npm run build` ✅

### Security notes
- No secrets introduced.
- No dependency additions/updates in this change.
- Webview security posture unchanged (CSP + typed message schema remain in place).

### Residual risk / follow-ups
- Visual verification (Dark+/Light+/HC theme) should be done in a VS Code Extension Host session; this evidence pack records only deterministic CLI gates.

## Stop condition
- **PASS**: R1–R8 implemented; gates executed and passing.
