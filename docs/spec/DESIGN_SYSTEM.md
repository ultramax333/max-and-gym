# max&gym design system

## 1. Direction

Dark, sober, technical, and premium. The application should feel calm during training, not gamified or promotional.

Version 1 has one dark theme. A light theme is deferred.

## 2. Colour tokens

Suggested starting palette; verify contrast in implementation:

| Token | Value | Use |
|---|---|---|
| `background.canvas` | `#090D12` | app background |
| `background.surface` | `#101720` | cards and navigation |
| `background.elevated` | `#17212C` | sheets and selected cards |
| `border.subtle` | `#263342` | dividers and borders |
| `accent.primary` | `#53C7B7` | primary actions and focus |
| `accent.secondary` | `#7EA1F8` | secondary data emphasis |
| `text.primary` | `#F2F6FA` | primary text |
| `text.secondary` | `#A9B5C3` | supporting text |
| `text.muted` | `#748295` | tertiary labels |
| `status.success` | `#58D68D` | success |
| `status.warning` | `#F4C95D` | warning |
| `status.error` | `#F27C8D` | errors |
| `status.info` | `#7EA1F8` | information |

Do not use accent colours as large backgrounds. Use surface hierarchy first.

## 3. Typography

Use a local system or bundled sans-serif stack; no remote font dependency.

Recommended stack:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif
```

If Inter is not bundled, rely on system fonts rather than a network request.

Scale:

- display: 32–36 pixels;
- screen title: 24–28;
- section title: 20–22;
- card title: 17–19;
- body: 15–16;
- supporting: 13–14;
- label: 13–14;
- timer/metrics: 24–44 with tabular numerals.

## 4. Spacing and shape

- base unit: 4 pixels;
- standard gaps: 8, 12, 16, 24, 32;
- card radius: 16;
- button radius: 12;
- sheet top radius: 24;
- subtle one-pixel borders;
- minimal shadows; elevation primarily through surface colour.

## 5. Touch and layout

- primary targets at least 48 × 48 CSS pixels where practical;
- bottom action above safe-area inset;
- content width optimized for one hand;
- no horizontally compressed workout tables at phone width;
- use stacked set cards below the breakpoint;
- avoid small close icons as the only escape path.

## 6. Motion

- normal transition: 150–220 milliseconds;
- explain state changes, do not decorate;
- subtle timer completion state;
- restrained personal-record acknowledgment;
- no confetti in version 1;
- respect reduced motion;
- no animated backgrounds.

## 7. Iconography

Use one consistent outlined icon family already compatible with Material UI. Do not mix icon styles.

## 8. Elevation

Suggested levels:

- 0: canvas;
- 1: standard card;
- 2: selected/elevated card;
- 3: sticky controls;
- 4: bottom sheet/dialog.

## 9. Workout-specific visual rules

- current exercise and next action dominate;
- previous data is secondary but immediately visible;
- completed sets are visually distinct without losing readability;
- incomplete/failed save must not look completed;
- timer state uses text plus visual treatment;
- effort values have clear labels;
- personal record does not obscure controls.

## 10. Forms

- persistent labels;
- numeric keyboard hints on mobile;
- unit shown adjacent to value;
- validation close to field;
- save state visible;
- no autosave ambiguity;
- destructive actions separated from normal actions.

## 11. Accessibility

- target Web Content Accessibility Guidelines 2.2 AA;
- visible focus ring using accent token;
- contrast tested for every state;
- colour never sole encoding;
- screen-reader labels for icon buttons;
- dialogs trap and restore focus;
- charts have text summaries;
- drag-and-drop has move-up/down controls;
- instructions use semantic headings and lists.

## 12. Donor translation

Workout.cool may inspire hierarchy and interaction. It does not define colours, typography, branding, or component dependencies. All adopted patterns must look and behave as max&gym.
