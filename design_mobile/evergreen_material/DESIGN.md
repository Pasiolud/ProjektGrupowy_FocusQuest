```markdown
# Design System Document: The Botanical Minimalist

## 1. Overview & Creative North Star
**Creative North Star: "The Organic Sanctuary"**

While the foundation of this design system is rooted in the functional logic of Android’s Material Design, we are transcending the "utility-first" template to create a high-end, editorial experience. The goal is to move away from rigid, boxy layouts and toward a "living" interface that breathes. 

We achieve this through **Organic Asymmetry** and **Tonal Depth**. Instead of a standard grid that feels mechanical, we utilize expansive white space (the "clean white background") and sophisticated layering to guide the user’s focus. The aesthetic is not just minimalist; it is intentional. We treat the screen like a gallery wall—every element has room to resonate, and every interaction feels like a soft tactile click rather than a digital chore.

---

## 2. Colors: Tonal Architecture
Our palette uses a sophisticated range of greens and neutrals to establish a hierarchy without ever feeling "busy."

### The "No-Line" Rule
**Lines are prohibited for sectioning.** Do not use 1px solid borders to separate content. Boundaries are defined exclusively through background shifts.
*   **Primary Surface:** `surface` (#f9f9f9)
*   **Section Break:** Use `surface-container-low` (#f3f3f3) or `surface-container` (#eeeeee) to define a new area.
*   **Focus Areas:** Use `primary_container` (#4caf50) with `on_primary_container` (#003c0b) for high-impact callouts.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-milled paper sheets.
*   **Base Layer:** `surface` (#f9f9f9).
*   **Secondary Content:** Place on `surface-container-low` (#f3f3f3).
*   **Interactive Cards:** Elevate by placing a `surface-container-lowest` (#ffffff) card on a `surface-container` (#eeeeee) background.

### The "Glass & Gradient" Rule
To add soul to the interface, main CTAs and Hero sections should utilize a subtle **Linear Gradient**:
*   *Direction:* 135 degrees.
*   *From:* `primary` (#006e1c) to `primary_container` (#4caf50).
*   *Application:* For floating action buttons or high-priority progress indicators.

---

## 3. Typography: Editorial Authority
We utilize **Inter** (as our high-end interpretation of a system sans-serif) to provide a more rhythmic, balanced feel than standard Roboto.

*   **Display (Large/Med/Small):** Used for large data points or welcoming headers. Set with tight letter-spacing (-0.02em) to feel authoritative.
*   **Headline & Title:** Use `headline-sm` (#1a1c1c) for section titles. Ensure significant vertical padding (at least 32px) above headlines to create an editorial "breathing room."
*   **Body (LG/MD/SM):** Use `on_surface_variant` (#3f4a3c) for secondary body text to reduce visual vibration and improve long-form reading comfort.
*   **Labels:** Always uppercase with +0.05em letter-spacing when used for navigation or small metadata to ensure high-end legibility.

---

## 4. Elevation & Depth: Atmospheric Layering
Traditional shadows and borders are replaced with **Tonal Layering** to create a modern, "holographic" sense of depth.

*   **The Layering Principle:** Depth is achieved by stacking. A card in its default state has no shadow; it is simply a `surface-container-lowest` (#ffffff) shape on a `surface-container` (#eeeeee) background.
*   **Ambient Shadows:** For floating elements (like a Bottom Sheet), use a shadow with a 32px Blur and 10% Opacity, tinted with `on_surface` (#1a1c1c). It should look like a soft glow, not a dark edge.
*   **The "Ghost Border" Fallback:** If high-contrast accessibility is required, use `outline_variant` (#becab9) at **15% opacity**. Never use a 100% opaque border.
*   **Glassmorphism:** For top navigation bars, use `surface` (#f9f9f9) at 85% opacity with a `20px backdrop-blur`. This allows the "organic green" content to bleed through as the user scrolls, creating an integrated feel.

---

## 5. Components: Refined Primitives

### Buttons
*   **Primary:** Gradient (Primary to Primary Container), `xl` (1.5rem) roundedness. No shadow.
*   **Secondary:** `surface-container-high` (#e8e8e8) background with `primary` (#006e1c) text.
*   **Tertiary:** Ghost style; text-only using `primary` (#006e1c), 12px horizontal padding.

### Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Execution:** Separate list items using 12px of vertical white space. If a visual container is needed, use a subtle background shift to `surface-container-low`.
*   **Shape:** All cards must use `lg` (1rem) roundedness to maintain the "Soft Minimalist" aesthetic.

### Input Fields
*   **Aesthetic:** "Understated Elegance." Use a filled style with `surface-container-highest` (#e2e2e2) and a 2px bottom-only indicator in `primary` (#006e1c) upon focus. No full-box outlines.

### Chips
*   **Filter Chips:** Use `tertiary_fixed_dim` (#bdcabe) for unselected states and `primary_fixed` (#94f990) for active states.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Use wide left margins (24px) and slightly smaller right margins (16px) for headers to create a custom, non-templated look.
*   **Use Tonal Transitions:** Transition from a `surface` background to a `surface-container` footer to signal the end of a page.
*   **Prioritize Negative Space:** If the screen feels "full," remove an element or increase the padding.

### Don’t:
*   **No Pure Black:** Never use #000000. Use `on_surface` (#1a1c1c) to maintain the organic, soft-grey feel.
*   **No Standard Material Shadows:** Avoid the default "Elevation 2/4/6" shadow styles. Stick to the Ambient Shadow spec in Section 4.
*   **No Grid-Lock:** Don't feel forced to align every icon perfectly in a box. Let text and imagery breathe with varied offsets.

---

## 7. Signature Elements
*   **Micro-Progressors:** Instead of a standard circular loader, use a thin 2px horizontal line using the `primary` (#006e1c) to `primary_fixed` (#94f990) gradient at the very top of the viewport.
*   **Soft Vibe:** All icons should be "Rounded" or "Two-Tone" Material variants to match the `0.5rem` to `1rem` roundedness scale of the containers.