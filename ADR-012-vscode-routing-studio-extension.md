# ADR - Migrate Routing Studio React app into a full-featured VS Code Extension (Webview-based)

* **Status**: Proposed
* **Date**: 2026-01-08
* **Tags**: vscode-extension, webview, routing, ux, tooling

|                 |                                                                  |
| --------------- | ---------------------------------------------------------------- |
| **Responsible** | Emmett Miller + Extension Maintainers                            |
| **Accountable** | Developer Experience / Observability Tooling Team                |
| **Consulted**   | Security (AppSec), Platform Engineering, UX, Release Engineering |
| **Informed**    | Users of routing files, SRE/Dev teams, Support                   |

Technical Story: [#ROUTING-EXT-001](TS-ROUTING-EXT-001-vscode-routing-studio-migration.md) · [#ROUTING-EXT-002](TS-ROUTING-EXT-002-vscode-routing-studio-ux-and-packaging.md)

---

## Problem Statement

We have a React 19 + TypeScript 5+ “Routing Studio” UI that edits a routing JSON file (providers/defaults/classes/legacy map/models) as exemplified by the current routing format . The goal is to ship this capability as a **VS Code (latest) extension** so users can create and maintain routing files directly in their IDE with **exceptional UX**: an **Actions panel**, **custom Output channel**, **Codicons**, **theme-aware UI (dark by default)**, and packaging as a **VSIX**.

This matters because routing files are developer-critical configuration. Editing them in a generic JSON editor is error-prone (referential integrity across classes/models/defaults), not discoverable as new models appear, and lacks guardrails. An IDE-native experience reduces mistakes, increases adoption, and provides consistent workflows (open/edit/validate/export).

---

## Contextual Factors Informing the Decision

* The routing file has cross-references (e.g., `defaults` → `classes`, `classes[]` → `models`, `legacyPreferenceMap` → `classes/models`) that require structural + semantic validation to prevent broken configurations .
* UX must support both guided editing and “power-user” raw JSON editing, including non-destructive handling of unknown fields for forward compatibility.
* VS Code’s theming must be respected; dark should be the default look, but the UI must follow the active theme for accessibility and consistency.
* Extension must be distributable internally/externally as a VSIX and be maintainable with predictable build tooling and security posture.
* Users need a discoverability path for new models (import/merge; later possibly provider catalogue adapters) without forcing online dependency.

---

## Considered Options

* **Option 1 - Webview-based VS Code extension embedding the React UI**: Keep the existing React editor as a Webview app, add VS Code contribution points (Activity Bar view, Commands, Output channel), and integrate file IO/validation via extension host.
* **Option 2 - Native VS Code UI (Tree/Data providers + custom editors) without React**: Rebuild UX using VS Code TreeViews, QuickPick, and a custom editor for JSON.
* **Option 3 - Minimal extension wrapper**: Provide commands (Validate/Format/Generate) and rely on VS Code JSON editing + schema only (no guided UI).

---

## Decision Outcome

**Chosen option**: *Option 1 - Webview-based VS Code extension embedding the React UI*

**Because**: It preserves the existing high-quality React UX and speeds delivery while enabling IDE-native affordances (Actions panel, Output channel, codicons, theme-aware styling). It also provides the best path to extensibility (future provider catalogue adapters, team-defined category semantics) without forcing a full rewrite into lower-level VS Code UI primitives. Option 1 offers the best balance of time-to-value, maintainability, and UX parity with the existing Routing Studio.

---

## Consequences

* **Positive**: Reuses the proven guided editor for the routing structure (`providers`, `classes`, `models`, etc.) and keeps semantic validation aligned to the routing contract .
* **Positive**: First-class IDE workflow: open routing file, edit with guardrails, validate, and export—all inside VS Code; reduced configuration errors.
* **Positive**: Clear extension points: commands, webview messaging protocol, and contribution points allow incremental feature delivery (e.g., “Import models”, “Apply suggestions”, “Diff & Save”).
* **Negative**: Webviews require explicit hardening (CSP, message validation, resource loading restrictions). Some UI features (e.g., drag/drop across VS Code) need careful implementation.
* **Negative**: Two runtimes to maintain (extension host + webview app) and a message bridge contract to version.
* **Neutral**: Dark-theme-by-default is implemented by matching VS Code theme variables; “default” effectively means “looks correct in Dark+ and other dark themes” rather than forcing a theme change.

---

## Pros and Cons of the Options

### Option 1 - Webview-based VS Code extension embedding the React UI

* **Good**: Maximum UX fidelity and fastest migration from the existing React 19/TS 5+ codebase.
* **Good**: Easy to implement Actions panel, Output channel, codicons, and theme awareness via VS Code APIs + CSS variables.
* **Good**: Clean extensibility via a typed webview message protocol (e.g., validate, load, save, import models).
* **Bad**: Requires security work (CSP, sanitisation, strict message schema, no remote code).
* **Bad**: More build complexity (webview bundling + extension packaging).
* **Neutral**: Webview performance is generally good, but large routing files may need virtualisation and incremental validation.

### Option 2 - Native VS Code UI without React

* **Good**: Fewer security concerns than a full custom webview UI; more “VS Code native” feel.
* **Good**: Strong integration with VS Code editor, quick picks, tree views.
* **Bad**: Significant rewrite; hard to match the existing guided UX quickly.
* **Bad**: Complex to build rich form-based editors and rule-driven suggestions without reintroducing web UI patterns.
* **Neutral**: Long-term maintainability could be simpler *if* the UI stays modest, but feature pressure tends to recreate a web UI anyway.

### Option 3 - Minimal extension wrapper (schema + commands only)

* **Good**: Lowest effort and smallest surface area.
* **Good**: Fits users already comfortable with JSON.
* **Bad**: Does not deliver “exceptional UX”; does not solve discoverability or guided editing.
* **Bad**: Higher risk of broken configs due to cross-reference mistakes.
* **Neutral**: Might be acceptable as a stopgap, but not aligned with the stated goals.

---

## Follow-up Decisions

* Decide the **webview message protocol** and versioning strategy (e.g., `routingStudio/v1`), including schema validation for inbound/outbound messages.
* Decide whether UI-only category meaning metadata is stored in **workspace settings**, `.vscode/` files, or embedded in the routing file under a namespaced key.
* Decide whether to implement a **Custom Editor** for `*.routing.json` (opens the UI by default) versus a command-driven panel that can open any JSON.
* Decide the distribution path: internal marketplace vs private VSIX distribution vs OpenVSX.

---

## References / Supporting Material

* Routing file structure and example values (providers/defaults/classes/legacy/models) 
* VS Code Extension API docs: Webviews, TreeView/Views, OutputChannel, Theming, Codicons, VSIX packaging (official Microsoft documentation)
* Security guidance for VS Code Webviews (CSP, resource restrictions, message validation) (official Microsoft documentation)

---
