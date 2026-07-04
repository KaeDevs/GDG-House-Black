---
name: Institutional Authority
colors:
  surface: '#fbf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fbf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#111516'
  on-tertiary: '#ffffff'
  tertiary-container: '#26292b'
  on-tertiary-container: '#8d9092'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#fbf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
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
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for high-stakes governance and educational administration. It balances the "Linear" aesthetic—precision-engineered, technical, and performant—with the "Stripe" aesthetic—approachable, high-trust, and premium. 

The brand personality is **authoritative yet enabling**. It aims to evoke a sense of organized efficiency for government officials who manage complex data. The UI utilizes a **Corporate Modern** style with a focus on high-information density without visual clutter. Key attributes include expansive whitespace to reduce cognitive load, surgical precision in alignment, and a sophisticated use of depth to imply systemic structure.

## Colors
This design system utilizes a foundation of **Deep Indigo (#1E293B)** to establish immediate institutional trust and gravity. **Confident Teal (#0D9488)** serves as the primary action color, providing a modern, energetic contrast that guides the eye toward conversion points and primary tasks.

The neutral palette is biased toward cool slates to maintain a technical, "SaaS-forward" feel. A rigorous **Status System** is integrated into the core palette:
- **Critical (Red):** Used for zero enrollment or system crises.
- **Warning (Orange):** Used for overloaded staff or single-teacher schools.
- **Healthy (Green):** Used for optimal operational status.
Backgrounds should remain primarily white or very light slate (`#F8FAFC`) to maximize the "Stripe-like" clarity.

## Typography
The typography system relies exclusively on **Inter** to achieve a neutral, systematic, and highly legible interface. The scale emphasizes a **clear hierarchy** to help officials scan through vast amounts of data quickly.

Headlines use tighter letter-spacing and heavier weights to feel "anchored" and authoritative. Body text uses a **generous 1.6x line-height** to ensure long-form reports and data tables remain readable during extended use. Captions and labels utilize a medium weight and slightly increased letter-spacing to maintain legibility at small sizes on low-resolution government monitors.

## Layout & Spacing
This design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The spacing rhythm is based on a **4px baseline shift**, ensuring all elements align to a rigorous mathematical scale.

- **Desktop:** 40px outer margins provide a "premium" sense of space, while 24px gutters ensure data-dense cards feel distinct but connected.
- **Mobile:** Margins shrink to 16px to maximize screen real estate, and complex grid-spanning cards reflow into a single-column vertical stack.
- **Data Density:** In dashboards, use `stack-sm` (8px) for related input fields and `stack-lg` (24px) to separate logical sections.

## Elevation & Depth
Depth is signaled through **Ambient Shadows** and **Tonal Layers**. Following the "Linear" philosophy, surfaces are rarely flat but use subtle elevation to communicate hierarchy.

- **Level 0 (Canvas):** Background color `#F8FAFC`.
- **Level 1 (Cards):** Pure white background with a 1px border in `#E2E8F0` and a very soft, diffused shadow (`0 4px 6px -1px rgb(0 0 0 / 0.05)`).
- **Level 2 (Dropdowns/Modals):** High-diffusion shadows to suggest a floating state above the primary workspace.
- **Dividers:** Use subtle 1px lines in `#F1F5F9`. Avoid heavy borders; allow white space to create the primary separation.

## Shapes
The shape language is refined and consistent, utilizing a **Rounded (Level 2)** approach.
- **Standard Elements:** Buttons, inputs, and small chips use a **0.5rem (8px)** radius to balance friendliness with professional rigor.
- **Container Elements:** Dashboard cards and main content areas use a **1rem (16px)** radius, creating a soft, modern frame for complex data.
- **Active States:** Subtle 2px "Teal" indicators should be used for active navigation items, utilizing a 1px radius for a sharp, technical feel.

## Components
### Buttons
Primary actions use a solid **Teal (#0D9488)** background with white text. Secondary actions use a "Ghost" style: Deep Indigo text with a subtle Slate border. Avoid high-gloss effects; keep gradients extremely subtle or flat.

### Data Cards
Cards are the workhorse of the system. They must feature a clear header (Headline-SM), followed by a subtle divider. Metric values should be prominent (Headline-LG), with status indicators (Red/Orange/Green) positioned in the top-right corner as a small high-contrast "pill" or "dot."

### Inputs & Tables
Form fields use a white background with a 1px Slate border, turning Teal on focus. Tables should use "Zebra-striping" only on hover to maintain a clean look. Header rows in tables should be slightly tinted Slate (`#F8FAFC`) with uppercase Label-MD typography.

### Status System
Use the defined Red, Orange, and Green palette for all status badges. These should be high-saturation colors but with a low-opacity background (e.g., 10% opacity background with 100% opacity text) to ensure they are "scannable" without being visually overwhelming.