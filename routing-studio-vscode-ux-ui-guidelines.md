# Routing Studio – VS Code Native UX/UI Specification
**Document type:** Product UX/UI Guidelines + Interaction Specification  
**Audience:** Engineers, designers, reviewers, maintainers  
**Applies to:** VS Code extension Webview(s) for editing/producing routing JSON  
**Status:** Adopt as repo “source of truth” for UI decisions

---

## Document control

- **Version:** 2.0
- **Owner:** Routing Studio team
- **Update policy:** Any UI change must either:
  1) comply with this spec, or  
  2) include a PR that updates this spec with rationale and screenshots.

---

## 1. Product definition

### 1.1 What Routing Studio is
Routing Studio is a **configuration editor** that helps users **produce and validate a routing JSON file** (the output artefact).

The UI exists to make the JSON:
- **Easy to generate**
- **Hard to break**
- **Easy to understand**
- **Deterministic** (the same inputs produce the same output)
- **Auditable** (clear mapping between user actions and JSON changes)

### 1.2 What Routing Studio is not
Routing Studio is **not**:
- A dashboard
- A catalogue browser
- A “visual builder”
- A branding surface
- An analytics view

> If the UI looks impressive, it is probably wrong.

---

## 2. Design goals and non-goals

### 2.1 Primary goals (must)
1. **VS Code native feel**: visually and behaviourally consistent with VS Code editors.
2. **Cognitive simplicity**: the UI must never feel more complex than the JSON it produces.
3. **Predictable editing**: the user can always answer “what will be written?” without guessing.
4. **Progressive disclosure**: novices succeed without advanced panels; experts can drill down.
5. **Accessibility & keyboard support**: first-class, not a bolt-on.

### 2.2 Non-goals (must not)
- Colour-coding classes or models
- Decorative icons, emoji, “badges” for categories
- Multiple competing call-to-action buttons
- Requiring a mouse for core tasks
- Storing critical state only in Webview localStorage

---

## 3. Information architecture

### 3.1 Navigation structure (minimal)
**Primary (always visible):**
- Overview
- Providers
- Models
- Classes
- Defaults

**Advanced (collapsed group, opt-in):**
- Legacy map
- Raw JSON (read-only by default)
- UI semantics (local-only) *(optional; see 9.3)*

> Advanced items must not compete with primary items visually.

### 3.2 “One view = one job” rule
Each primary view must have **one core responsibility**:
- Providers: enable/disable providers and set weights
- Models: define model metadata used by routing/validation
- Classes: define ordered fallback sequences
- Defaults: choose default class mapping

Avoid “kitchen sink” screens.

---

## 4. Layout & structure

### 4.1 Standard layout
Use a **three-region** layout, consistent across views:

```
[ Left nav ] | [ Editor (single job) ] | [ Effects & Validation ]
```

- **Left nav**: stable, boring, no ornamentation
- **Editor**: the only editable region
- **Effects & Validation**: read-only; answers “what changed / what’s wrong?”

### 4.2 Responsiveness
- Minimum supported width: 900px (typical split editor)
- When narrower:
  - Collapse the right panel into a toggle (“Problems”)
  - Keep navigation and editor always visible

### 4.3 Lists over cards (strict)
Prefer:
- Flat lists
- Dividers
- Indentation
- Tables for dense numeric fields

Avoid:
- Cards/tiles
- Thick borders around everything
- Nested shadows
- “Widgets” that look like a web dashboard

---

## 5. Visual design system

### 5.1 Theme integration (strict)
Use VS Code theme tokens via CSS variables only, e.g.
- `var(--vscode-editor-background)`
- `var(--vscode-editor-foreground)`
- `var(--vscode-editorGroup-border)`
- `var(--vscode-descriptionForeground)`
- `var(--vscode-focusBorder)`
- `var(--vscode-input-background)`
- `var(--vscode-input-foreground)`
- `var(--vscode-input-border)`
- `var(--vscode-button-background)` *(sparingly)*
- `var(--vscode-button-foreground)`

**Never hardcode colours.**

### 5.2 Spacing & density
Use a 4px base spacing scale:
- 4, 8, 12, 16, 20, 24…

Default density should match VS Code settings editor:
- Tight vertical rhythm
- Clear row separation via whitespace/dividers, not boxes

### 5.3 Borders, radii, elevation
- Border radius: **0–2px** only
- Shadows: **avoid** (VS Code is largely flat)
- Dividers: 1px using `--vscode-editorGroup-border`

### 5.4 Typography hierarchy
- Use default VS Code font stack
- Title: 16–18px (or equivalent)
- Section heading: 13–14px, semibold
- Body: default
- Description text: muted via `--vscode-descriptionForeground`

Keep hierarchy minimal: **no more than 4 text roles**.

---

## 6. Icons and affordances (critical)

### 6.1 Icon policy
**Default:** no icons.

**If an icon is necessary:**
- Use **codicons** only
- Monochrome
- Must not encode meaning alone
- Must not be decorative

Recommended codicons (typical):
- add, trash, edit, check, warning, error, grabber, chevron-down, chevron-right, ellipsis

### 6.2 Class/category visuals (explicit prohibition)
Do **not** represent classes with:
- Coloured circles
- Emoji
- Pills/badges
- “Cute” category blocks

Classes are **routing semantics**, not identities.

---

## 7. Components and implementation guidance

### 7.1 Prefer VS Code Webview UI Toolkit
Prefer using the official toolkit components:
- `vscode-button`, `vscode-text-field`, `vscode-checkbox`, `vscode-dropdown`, `vscode-divider`

If custom components are used, they must:
- Match VS Code sizing/density
- Use VS Code theme variables
- Provide keyboard and ARIA behaviour equivalent to toolkit components

### 7.2 Actions: primary vs secondary
**Per view, allow at most one primary action.**

Examples:
- Overview: “Open file…”
- Classes: “+ Add class”
- Models: “+ Add model”

Everything else becomes secondary:
- Inline text actions: `+ Add…`
- Context menu actions
- Overflow menu (`…`)

**Avoid top-of-screen button farms.**

### 7.3 Inline actions style
Use VS Code-like inline links:
- Left-aligned
- Prefixed with `+`
- No background fill
- Hover underline or subtle emphasis

Example:
- `+ Add model`
- `+ Add provider`
- `+ Add class`

---

## 8. Content strategy & microcopy

### 8.1 Write for scanning
- Prefer short sentences
- Prefer outcome-based language
- Remove “help text paragraphs” and replace with:
  - single-line hints
  - tooltips
  - expandable “Learn more”

### 8.2 Microcopy patterns
Good:
- “Order matters. The first available model is used.”
- “Stored locally (UI only). Not exported.”
- “Validation: 0 issues”

Bad:
- “Welcome to Routing Studio, a guided local-first editor…”
- Long conceptual explanations in the main flow

### 8.3 Empty states
Empty states must be actionable:
- Show a one-liner of what to do
- Provide one primary action

Example:
- “No classes yet.” → `+ Add class`

---

## 9. Domain mapping: UI must mirror JSON

This section is the core contract: every UI element must map to the routing JSON schema.

### 9.1 JSON sections
Routing JSON consists of:
- `version`
- `providers`
- `models`
- `classes`
- `defaults`
- `legacyPreferenceMap` *(advanced)*

### 9.2 Invariants (must enforce)
- Every class entry must reference an existing `models` key.
- `defaults.licensed` and `defaults.unlicensed` must reference an existing class name.
- Provider keys referenced in model IDs must exist in `providers`.
- `classes.<name>` is an ordered array; order is semantically meaningful.

### 9.3 UI semantics (local-only)
If you support local-only labels/icons/meanings:
- Hide under **Advanced**
- Mark clearly:
  - “UI only (stored locally). Not exported.”
- Never let UI semantics alter routing JSON unless explicitly enabled and documented.

---

## 10. View specifications

### 10.1 Overview view
**Purpose:** file lifecycle + status summary.

**Must show**
- Current file name / path (if known)
- Dirty state (unsaved changes)
- Validation status summary
- Counts: providers, models, classes

**Primary action**
- “Open file…”

**Secondary actions**
- New, Save, Export, Copy JSON
- These should be in an overflow menu (`…`) or as subtle toolbar actions.

**Avoid**
- Large onboarding panels once a file is loaded

---

### 10.2 Providers view
**Representation:** dense list/table.

**Rows**
- Provider id
- Enabled (checkbox)
- Weight (number input)

**Rules**
- Weight field supports small increments and direct typing.
- No special formatting; no graphs; no colour.
- Sorting optional; default should be stable.

**Actions**
- `+ Add provider`
- Row actions in context menu: rename, delete *(confirm delete)*

---

### 10.3 Models view
**Representation:** master list + details (progressive disclosure).

**List row**
- Model id (primary)
- Provider (derived from prefix)
- Key capabilities as compact text (e.g. “tools, vision”)
- Optional: context tokens (short)

**Details (collapsed by default)**
- Metrics (reasoning/latency/cost) as numeric inputs or sliders only in details
- Booleans: tools, vision
- Tags (chip-like text only; no colour)

**Rules**
- Never show all metrics for all models simultaneously.
- Avoid “metric dashboards”.

**Actions**
- `+ Add model`
- Import model list *(advanced)*

---

### 10.4 Classes view (most important)
**Mental model:** a class is an ordered fallback list.

**Layout**
- Left: class list
- Centre: selected class editor
- Right: effects/validation

**Class list**
- Text only (class name)
- No icons, no colour, no badges
- Optional count: “(3)” as plain text

**Class editor must show**
- Class name (editable)
- One-line hint:
  - “Order matters. The first available model is used.”
- Ordered list of model IDs:
  - Each row: drag handle (≡), model id text, remove action

**Reordering**
- Drag handle (mouse)
- Keyboard reordering:
  - Alt+Up / Alt+Down on focused row (or similar)
  - Announce changes for screen readers

**Add model**
- Inline `+ Add model`
- Opens quick pick (searchable) showing model IDs

**Do not**
- Turn classes into “categories” visually
- Use pills/badges or icons
- Use colour to signal “fast/cheap/etc.”

---

### 10.5 Defaults view
**Purpose:** map contexts → class name.

**UI**
- Two dropdowns / text fields:
  - Licensed default class
  - Unlicensed default class

**Must show**
- “These must reference an existing class.”
- If a selected class is deleted, show an error and require re-selection.

---

### 10.6 Legacy map view (advanced)
**Purpose:** compatibility mapping from legacy names → target (class or explicit model).

**UI**
- Table:
  - Legacy key (string)
  - Kind (class/explicit)
  - Target (class name or model id)

**Rules**
- Treat as advanced: collapsed by default under Advanced.
- Provide bulk edit via raw JSON or import/export options.

---

### 10.7 Raw JSON view (advanced)
**Default state:** read-only preview with copy.

Provide:
- Pretty-printed JSON output
- “Copy JSON” action
- Optional “Edit raw JSON” gated behind a toggle:
  - “I understand this may break validation”

If raw editing is enabled:
- Validate continuously
- Provide undo support

---

## 11. Validation & feedback

### 11.1 Validation behaviour
Validation must be:
- Continuous (as the user edits)
- Non-blocking
- Clear about severity

### 11.2 Validation panel (“Problems”)
Right panel shows:
- Summary line: “Validation: 0 issues”
- List grouped by:
  - Providers
  - Models
  - Classes
  - Defaults
  - Legacy map

Each issue must include:
- Severity (error/warning/info)
- A short message
- A “Go to” action that focuses the offending field

### 11.3 Success state
Success should be understated:
- `✓ No issues detected`

Avoid celebratory emojis; keep it professional.

---

## 12. File operations and persistence

### 12.1 Source of truth
- Routing JSON file is the source of truth.
- Local-only UI semantics must not silently affect export.

### 12.2 Dirty state
Show a clear “unsaved changes” indicator:
- In the header near filename
- And/or in the right panel

### 12.3 Undo/redo
Undo/redo must work across:
- Reordering class items
- Adding/removing entries
- Field edits

Prefer command-like affordances over big buttons.

---

## 13. Accessibility & keyboard support

### 13.1 Minimum keyboard requirements
- Navigate between navigation items
- Navigate lists and editors
- Add/remove items without mouse
- Reorder class items without mouse
- Save/export/copy accessible from keyboard

### 13.2 Focus & ARIA
- Clear focus outlines using `--vscode-focusBorder`
- Use roving tabindex for lists
- Provide ARIA labels for icon-only actions (if any)
- Announce reorder operations for assistive tech

### 13.3 No colour dependence
All states must be visible without colour:
- Selection
- Errors
- Disabled

---

## 14. Performance and scalability

- Models list may grow large: consider virtualisation
- Avoid rerendering entire panels on small edits
- Debounce validation if needed, but keep perceived responsiveness

Target: edits feel instantaneous.

---

## 15. Quality gates (definition of done)

A UI change is acceptable only if it passes:

### 15.1 UX checklist
- [ ] No new decorative icons or colour semantics
- [ ] Primary action per view is clear
- [ ] Advanced features remain collapsed by default
- [ ] The UI still reads like a config editor, not a dashboard

### 15.2 Accessibility checklist
- [ ] Keyboard paths exist for all core tasks
- [ ] Focus states are clear
- [ ] No colour-only signalling
- [ ] Labels are present and concise

### 15.3 Theming checklist
- [ ] No hardcoded colours
- [ ] Works in Dark+, Light+, and at least one high-contrast theme
- [ ] No low-contrast text in description roles

---

## Appendix A – Example JSON structure (for alignment)
Your UI should remain faithful to this shape:

- `providers`: map of providerId → `{ enabled, weight }`
- `models`: map of modelId → `{ reasoning, latency, cost, contextTokens, tools, vision, tags[] }`
- `classes`: map of className → ordered list of `modelId` strings
- `defaults`: `{ licensed, unlicensed }` (values are class names)
- `legacyPreferenceMap`: legacyKey → `{ kind, class? | model? }`

> **Ordering matters** in `classes.<name>`. This must be the dominant idea in the Classes view.

---

## Appendix B – Wireframe (text-only)

### B.1 Standard screen
```
┌───────────────┬───────────────────────────────┬──────────────────────────┐
│ Navigation    │ Editor                         │ Problems / Effects       │
│               │                                 │                          │
│ Overview      │ [View title]                    │ Validation: 0 issues     │
│ Providers     │                                 │                          │
│ Models        │ (Single job editor content)     │ (Grouped issues list)    │
│ Classes       │                                 │                          │
│ Defaults      │                                 │                          │
│ Advanced ▸    │                                 │                          │
└───────────────┴───────────────────────────────┴──────────────────────────┘
```

### B.2 Classes view
```
[Class list]              [Class editor]
default                   Class: fast
frontier                  Order matters. First available model is used.
fast                      ─────────────────────────────────────────
cheap                     ≡ 1  openai:gpt-4o-mini          [Remove]
long                      ≡ 2  anthropic:claude-…          [Remove]
                           ≡ 3  auggie:haiku4.5            [Remove]

                          + Add model
                          + Add class (from class list footer)
```

---

## Appendix C – CSS starter guidance (illustrative)

Use a thin, flat baseline. Example patterns:

- Prefer `display: grid` with gaps from the 4px scale
- Keep backgrounds mostly transparent; let editor background show through
- Use dividers instead of boxes

**Never** define literal colours; use VS Code variables.

---

## Appendix D – “Common temptations” and what to do instead

| Temptation | Why it’s wrong | Do this instead |
|---|---|---|
| Coloured badges for fast/cheap | Encodes meaning in colour; looks like a dashboard | Plain text class names |
| Emoji icons | Unprofessional; inconsistent with VS Code | No icons or codicons only |
| Lots of buttons in a toolbar | Competing actions and noise | Overflow menu + one primary action |
| Show all metrics everywhere | Turns config into a dashboard | Collapse model details |
| Onboarding paragraphs | Users scan, they don’t read | One-line hints + tooltips |

---

## Final rule (non-negotiable)
**The routing JSON is the product.**  
**The UI is only a lens.**
