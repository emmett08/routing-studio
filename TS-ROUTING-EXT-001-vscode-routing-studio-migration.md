# ROUTING-EXT-001

## Technical Story:

**Migrate Routing Studio into a VS Code Webview-based Extension**

### Story Summary

As a developer editing routing configuration files,
I want a first-class VS Code extension that provides a guided, validated UI for creating and editing routing files,
so that I can safely manage complex routing logic (providers, classes, models, defaults, legacy mappings) without manual JSON errors.

---

### Scope

**In scope**

* Implement a VS Code extension using:

  * Webview-based UI (React 19 + TypeScript 5+)
  * Extension host (TypeScript) for file IO, commands, and validation
* Provide a dedicated **Routing Studio panel** accessible via:

  * Activity Bar icon
  * Command Palette
* Support opening and editing existing routing files (e.g. `*.routing.json`) to prepopulate the UI
* Support creation of new routing files from a starter template aligned to the routing schema 
* Implement:

  * Structural schema validation
  * Cross-reference validation (classes ↔ models ↔ defaults ↔ legacy mappings)
* Provide **Undo / Redo** within the UI
* Provide **Raw JSON editor mode** with round-trip safety (unknown fields preserved)

**Out of scope (initial release)**

* Live provider catalogue fetching
* Cloud-backed model discovery
* Multi-file routing composition

---

### Functional Requirements

1. **Editor Integration**

   * The extension registers a custom editor or command-driven panel for routing files.
   * Opening a routing file launches Routing Studio instead of the default JSON editor (configurable).

2. **Webview UI**

   * React UI embedded in a VS Code Webview.
   * All user interactions occur inside the webview; no inline JSON editing required.
   * UI sections map directly to routing file sections:

     * Providers
     * Models
     * Classes (categories)
     * Defaults
     * Legacy Preference Map

3. **File Operations**

   * Open routing file → parse → validate → populate UI.
   * Save writes a valid routing JSON file to disk.
   * Export/download routing JSON via VS Code file system APIs.

4. **Validation**

   * Real-time validation with:

     * Errors (blocking save)
     * Warnings (non-blocking, informational)
   * Validation surfaced both:

     * Inline in the UI
     * In a dedicated VS Code Output channel

---

### Non-Functional Requirements

* **Theme awareness**: UI must respect VS Code theme variables (dark theme by default, but adaptive).
* **Security**:

  * Strict Content Security Policy (CSP)
  * No remote code execution
  * Typed message protocol between extension host and webview
* **Performance**:

  * Handle routing files with hundreds of models without noticeable lag
* **Accessibility**:

  * Keyboard navigable
  * Screen-reader friendly where feasible
* **Compatibility**:

  * VS Code latest stable
  * No reliance on deprecated extension APIs

---

### Acceptance Criteria

* [ ] Opening a valid routing file launches Routing Studio with all sections populated.
* [ ] Invalid cross-references are detected and clearly explained.
* [ ] Saving produces a JSON file structurally equivalent to the input (plus intentional edits).
* [ ] Unknown/forward-compatible fields are preserved.
* [ ] UI functions correctly in Dark+, Light+, and high-contrast themes.
* [ ] Extension can be packaged and installed as a VSIX.
