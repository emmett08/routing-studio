# Routing Studio (VS Code Extension)

A VS Code extension that provides a guided, validated UI for creating and editing `*.routing.json` files.

## Dev (webview UI in browser)

```bash
npm i
npm run dev
```

## Build + package (VSIX)

```bash
npm run package
```

## Key UX features

- Guided editor with **Undo / Redo**.
- Integrity validation (unknown models, missing classes, etc.) and Output Channel logs.
- Class builder with **search + add**, reorder, and rule-based suggestions.
- Extensible *UI metadata* stored separately (localStorage) to avoid breaking strict consumers.
