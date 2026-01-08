# ROUTING-EXT-002

## Technical Story:

**Enhance VS Code-native UX: Actions Panel, Output Channel, Codicons, Packaging**

### Story Summary

As a user of the Routing Studio extension,
I want VS Code-native affordances (actions, output, icons, packaging),
so that the extension feels integrated, discoverable, and production-ready.

---

### Scope

**In scope**

* Add VS Code contribution points:

  * Commands
  * Activity Bar view
  * Custom Output channel
* Implement an **Actions Panel** that exposes common operations without navigating the UI
* Use **Codicons** consistently for commands, views, and UI affordances
* Ensure extension can be built, versioned, and distributed as a VSIX

---

### Functional Requirements

1. **Commands**

   * `Routing Studio: Open`
   * `Routing Studio: New Routing File`
   * `Routing Studio: Validate Routing File`
   * `Routing Studio: Export Routing File`
   * `Routing Studio: Show Output`

2. **Actions Panel**

   * Visible in the Activity Bar or as a secondary view container
   * Provides one-click actions:

     * Validate
     * Import models
     * Apply class suggestions
     * Export/save
   * Actions invoke extension-host logic and update the webview state

3. **Output Channel**

   * Dedicated output channel: `Routing Studio`
   * Logs:

     * Validation results
     * File load/save events
     * Import/merge operations
     * Errors and warnings
   * Linked messages (clickable references back to UI sections where applicable)

4. **Icons & Visual Integration**

   * Use VS Code Codicons for:

     * Activity Bar icon
     * Commands
     * Buttons within the webview (where appropriate)
   * Ensure icons and colours adapt to the active VS Code theme

5. **Packaging**

   * Extension builds into a `.vsix` artefact
   * Versioned via `package.json`
   * Reproducible build using npm scripts
   * Ready for:

     * Internal distribution
     * Marketplace or OpenVSX publishing

---

### Non-Functional Requirements

* **Consistency**: Commands, icons, and UI terminology must align with VS Code conventions.
* **Observability**: All significant operations must emit structured log output.
* **Maintainability**: Clear separation between:

  * Extension host logic
  * Webview UI
  * Shared types/contracts
* **Extensibility**: Easy to add future commands (e.g. “Diff routing files”, “Sync catalogue”).

---

### Acceptance Criteria

* [ ] All commands are discoverable via the Command Palette.
* [ ] Actions Panel provides functional shortcuts to core workflows.
* [ ] Output channel clearly reports validation and operational events.
* [ ] Codicons render correctly across themes.
* [ ] Extension builds successfully into a VSIX and installs cleanly in VS Code.
* [ ] No console errors or CSP violations at runtime.
