---
name: Deep Obsidian Precision
colors:
  surface: '#011521'
  surface-dim: '#011521'
  surface-bright: '#283b49'
  surface-container-lowest: '#00101b'
  surface-container-low: '#091e2a'
  surface-container: '#0d222e'
  surface-container-high: '#192c39'
  surface-container-highest: '#243744'
  on-surface: '#d1e5f6'
  on-surface-variant: '#e6beb2'
  inverse-surface: '#d1e5f6'
  inverse-on-surface: '#1f333f'
  outline: '#ad897e'
  outline-variant: '#5c4037'
  surface-tint: '#ffb59e'
  primary: '#ffb59e'
  on-primary: '#5e1700'
  primary-container: '#ff571a'
  on-primary-container: '#521300'
  inverse-primary: '#ae3200'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#45dfa4'
  on-tertiary: '#003825'
  tertiary-container: '#00a574'
  on-tertiary-container: '#003120'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#852400'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#011521'
  on-background: '#d1e5f6'
  surface-variant: '#243744'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.4'
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for a "Stripe-caliber" experience: high-density, technically precise, and undeniably premium. It adopts a **Corporate Modern** aesthetic fused with **Dark Minimalist** editorial cues. 

The UI communicates authority through deep navy foundations and sharp, high-contrast typography. The primary orange gradient is used with extreme restraint—reserved only for core actions and strategic brand moments—ensuring the "expensive" feel of a professional developer tool. The atmosphere is one of focused productivity, utilizing wide margins, hairline borders, and subtle glassmorphic layers to create a sense of organized complexity.

## Colors
The palette is rooted in deep obsidian tones to provide a sophisticated backdrop for data-heavy management. 

- **Primary Brand:** An energetic orange gradient. Use this for "Primary" CTA buttons and active progress states only.
- **Surface Strategy:** Use `background_base` for the main application shell. `surface_default` is used for content areas, and `surface_elevated` is reserved for cards and modular pieces.
- **Borders:** Instead of heavy shadows, use `border_hairline` to define structure. Increase to `border_hover` on interactive elements.
- **Typography:** Primary text (#F2F7FA) provides high legibility against dark backgrounds, while Muted text (#5F7386) is used for secondary information and metadata to maintain hierarchy.

## Typography
The system uses **Inter** for its systematic and neutral qualities. For headlines, tight tracking (-0.02em) and heavy weights create a modern, editorial look.

- **Data Presentation:** All ID strings, tracking numbers, and QR-related codes must use **JetBrains Mono** to distinguish data from UI labels.
- **UI Copy:** The base font size for the dashboard is 14px to allow for high data density.
- **Language Support:** Type scales are optimized for Portuguese (pt-BR), which can be up to 30% longer than English; ensure container widths allow for text expansion.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a max-width container for desktop environments. 

- **Density:** Use an 8px base grid. For dashboard views, use 16px padding inside cards to maintain a "dense but breathable" feel.
- **Breakpoints:** 
  - Mobile (<768px): 1-column layout, 16px margins.
  - Tablet (768px - 1024px): 2-column layout, 24px margins.
  - Desktop (>1024px): 12-column grid, sidebar fixed at 260px.
- **Reflow:** Navigation shifts from a vertical sidebar on desktop to a bottom-tab bar or hamburger menu on mobile.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional shadows.

1. **Base:** `background_base` (#00121F).
2. **Standard Surface:** `surface_default` (#001A2E).
3. **Elevated/Interactive:** `surface_elevated` (#06283F) + `border_hairline`.
4. **Floating/Global:** Top navigation and floating panels use a background blur (20px) with `rgba(6, 40, 63, 0.72)`.
5. **Modals:** Only modals use a shadow for extreme focus: `0 24px 60px rgba(0,0,0,0.45)`.

Background Atmosphere: Incorporate large, blurred radial orbs (#FF4D00 and #06283F) at 8% opacity in the corners of the viewport to add depth to the dark canvas.

## Shapes
The shape language is sophisticated and modern, using generous rounding for large containers and tighter rounding for interactive elements.

- **Cards:** 16px radius for primary dashboard content.
- **Inputs/Buttons:** 12px radius to ensure a soft, accessible feel.
- **Modals:** 20px radius for a distinct "overlay" appearance.
- **QR Codes:** Always place QR codes on a white, 16px rounded tile with 12px internal padding to ensure scan reliability and visual pop.

## Components
- **Buttons:** 
  - *Primary:* Gradient fill (#FF4D00 -> #FF8A00), white text, 12px radius.
  - *Secondary:* `surface_elevated` fill, `border_hairline`, 12px radius.
- **Input Fields:** `background_base` fill with `border_hairline`. On focus, border transitions to `border_hover` with a soft orange glow (`rgba(255,110,20,0.18)`).
- **Icons:** Use Lucide-style line icons with a 1.5px stroke weight.
- **Data Chips:** 999px (Pill) shape. Use `status` colors for background (at 15% opacity) and matching solid color for text.
- **Lists:** Use `border_hairline` as a separator between list items. Hover states should use a subtle background shift to `surface_elevated`.
- **QR Preview:** A dedicated card component with a white background, containing the QR code and a "Download" button group.