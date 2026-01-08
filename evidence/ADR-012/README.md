# Evidence Pack: ADR-012 (Routing Studio VS Code Extension)

## Classification (HGP)

- Change type: MIGRATION (React app → VS Code webview extension)
- Risk: MEDIUM (new extension surface + webview hardening)
- Uncertainty: MEDIUM
- Tactic: V-Model slice (verification-heavy)

## ADR Alignment

- ADR: `ADR-012-vscode-routing-studio-extension.md`
- Decision implemented: Option 1 (Webview-based extension embedding the React UI)

## Requirements → Implementation Trace

### R1. Webview-based VS Code extension embedding React UI

- VS Code custom editor + webview: `src/extension/routingStudioEditorProvider.ts`
- Standalone webview panel (no file required): `src/extension/routingStudioPanel.ts` (opened via `routingStudio.open`)
- Extension entrypoint: `src/extension/extension.ts`
- Manifest wiring: `package.json` (`contributes.customEditors`, `activationEvents`, `main`)
- Webview build output: `vite.config.ts` (`dist/webview`)

### R2. Commands (Open/New/Validate/Export/Show Output)

- Commands declared: `package.json#contributes.commands`
- Commands implemented: `src/extension/extension.ts` (`routingStudio.*`)
- Webview can invoke commands: `src/extension/routingStudioEditorProvider.ts` (validated `command` messages)

### R3. Actions Panel (Activity Bar)

- Activity Bar container + view: `package.json#contributes.viewsContainers` and `package.json#contributes.views`
- Actions TreeView: `src/extension/actionsProvider.ts` (one-click shortcuts)

### R4. Output Channel (Routing Studio)

- Output channel + structured JSON logs: `src/extension/logger.ts`
- Validation + file events logged: `src/extension/extension.ts`

### R5. Theme awareness + Codicons

- Theme-variable mapping for webview UI: `src/styles.css`
- Webview UI imports Codicons for VS Code-native affordances: `src/main.tsx`
- UX/UI redesign details and spec compliance evidence: `evidence/UX-UI-001/README.md`

### R6. Security (CSP, no remote code, typed message protocol)

- CSP + local-only assets: `src/extension/webviewHtml.ts` (used by `src/extension/routingStudioEditorProvider.ts` and `src/extension/routingStudioPanel.ts`)
- Message validation (zod schemas): `src/bridge/protocol.ts`
- Webview update protocol gated to avoid clobber-on-load: `src/App.tsx` (`isInitialised` gate)

### R7. File operations (open/edit/save/export)

- Open existing file: `routingStudio.open` in `src/extension/extension.ts`
- New routing file from template: `routingStudio.newFile` in `src/extension/extension.ts` (uses `src/routing/templates.ts`)
- Save: webview syncs edits into the backing text document (`updateText` → `WorkspaceEdit`), then standard VS Code save
- Export: `routingStudio.export` in `src/extension/extension.ts`

### R8. Validation (schema + cross-reference)

- Structural parse: `src/routing/schema.ts`
- Cross-reference validation: `src/routing/validate.ts`
- Validate command uses both and logs results: `src/extension/extension.ts`

### R9. Undo/Redo in UI

- UI history: `src/state/useHistory.ts` + `src/state/useRoutingEditor.ts`

### R10. Raw JSON mode + forward-compatible fields preserved

- Raw JSON editor: `src/ui/JsonPanel.tsx`
- Passthrough schema: `src/routing/schema.ts` (`.passthrough()`)
- Unit test proving passthrough: `src/routing/validate.test.ts`

## Assumptions / Unknowns / Follow-ups

- UI-only metadata storage location (workspace settings vs `.vscode/` vs namespaced routing key) remains a follow-up decision; current behaviour remains local to the webview.
- Output channel does not yet provide clickable links back to specific UI sections (text includes paths only).

## Verification (Deterministic Gates)

### Commands run

- Typecheck: `npm run typecheck` ✅
- Unit tests: `npm test` ✅
- Build + VSIX packaging: `npm run package` ✅ (produces `routing-studio-0.1.0.vsix`)
- Dependency scan: `npm audit` ✅ (0 vulnerabilities)

## Dev Debugging

- VS Code debug launch + tasks: `.vscode/launch.json`, `.vscode/tasks.json`
- Watch tasks: `npm run watch:webview` and `npm run watch:extension`
- Notes: `.vscode/tasks.json` uses background problem matchers based on `$tsc-watch` (avoids VS Code task validation errors).

### Notes

- `vsce package` warns about missing `repository` and `LICENSE` metadata; packaging still succeeds.

## Stop Condition

- PASS: required gates executed and passing; VSIX builds successfully.
