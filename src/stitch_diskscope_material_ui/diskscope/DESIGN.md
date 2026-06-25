---
name: DiskScope
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414754'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#5b5f64'
  on-secondary: '#ffffff'
  secondary-container: '#dde0e6'
  on-secondary-container: '#5f6368'
  tertiary: '#0656cf'
  on-tertiary: '#ffffff'
  tertiary-container: '#3670e9'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#dfe3e8'
  secondary-fixed-dim: '#c3c7cc'
  on-secondary-fixed: '#181c20'
  on-secondary-fixed-variant: '#43474c'
  tertiary-fixed: '#dae2ff'
  tertiary-fixed-dim: '#b2c5ff'
  on-tertiary-fixed: '#001847'
  on-tertiary-fixed-variant: '#0040a1'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 57px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-lg:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  sidebar-width: 280px
  sidebar-rail: 80px
---

## Brand & Style
The design system is a rigorous implementation of Material 3 principles tailored for data-heavy utility applications. The brand personality is professional, precise, and systematic, prioritizing utility and clarity over decorative flair. 

The aesthetic follows a **Modern Corporate/Minimalist** approach. It utilizes expansive whitespace, logical grouping via containers, and a refined "tonal palette" system. The emotional goal is to instill confidence in the user while they manage critical system data, providing a sense of order and technical mastery. High-precision data points are balanced by soft-rounded corners and subtle transitions to maintain a friendly, approachable toolset for developers and power users alike.

## Colors
The color system relies on Material 3 Tonal Palettes. The Primary Blue (#1A73E8) serves as the core action color, representing connectivity and system intelligence. 

- **Surface Tiers:** Use specific hex values for light and dark modes to ensure accessible contrast. In dark mode, surfaces are elevated by shifting from #1F1F1F to slightly lighter tones rather than using pure black.
- **Semantic Accents:** These are strictly reserved for data states. Green indicates "Reclaimable Space," Yellow indicates "Large Files/Caution," and Red indicates "Critical Low Space" or "System Files."
- **State Layers:** Interaction states (hover, focus, pressed) should use a semi-transparent overlay of the content color (e.g., Primary at 8% opacity for hover).

## Typography
This design system uses **Geist** for the primary UI to maintain a technical, clean aesthetic. **JetBrains Mono** is introduced for tabular data, file paths, and size metrics to ensure character alignment and high legibility for technical strings.

- **Scale:** Use `Display` styles for storage capacity overviews.
- **Data Rows:** All file sizes (KB, MB, GB) must use the `data-tabular` style to ensure numbers align vertically in lists.
- **Case:** Use sentence case for all labels and headers to maintain a friendly, modern tone. Avoid all-caps except for very small, high-contrast labels.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model optimized for desktop viewports. 

- **Navigation:** A persistent Navigation Rail (80px) is used for high-level switching, expandable to a Full Sidebar (280px) for detailed filtering and folder trees.
- **Grid:** Use a 12-column grid for the main content area. Data tables should span 12 columns, while information cards can be arranged in 3 or 4-column groupings.
- **Density:** Provide "Comfortable" (16px padding) and "Compact" (8px padding) modes. For disk analysis, the Compact mode is preferred for multi-level list views.
- **Breakpoints:** 
    - Compact: < 600px (Mobile)
    - Medium: 600px - 1240px (Tablet/Small Desktop)
    - Expanded: > 1240px (Large Desktop)

## Elevation & Depth
Elevation is expressed through **Tonal Layers** and subtle ambient shadows, moving away from heavy shadows toward color-based depth.

- **Level 0 (Surface):** Default background color.
- **Level 1 (Card):** Used for primary content containers. 1px stroke (Secondary Container color) or a very soft shadow (Blur 4px, Y 2px, 5% Opacity).
- **Level 2 (Hover):** Used when interacting with file cards or table rows. Increased tonal brightness and a slight shadow boost.
- **Overlays:** Dialogs and menus use Level 3 elevation with a 12% scrim background to dim the underlying data.
- **Glassmorphism:** Use a subtle backdrop blur (8px) on the Top App Bar and Sidebar when content scrolls beneath it to maintain context.

## Shapes
The design system utilizes **Rounded** geometry (8px / 0.5rem) to align with the Material 3 "Standard" shape family.

- **Containers:** Cards and primary containers use `rounded-lg` (16px).
- **Small Elements:** Buttons, text fields, and chips use `rounded-md` (8px).
- **Indicators:** Progress bars (linear) use a fully rounded cap (pill-shaped). Circular indicators use a stroke width of 4px for better visibility on high-density screens.

## Components
- **Buttons:** Use Material 3 "Filled" for primary actions (Scan, Clean), and "Outlined" for secondary actions (Cancel, Settings). "Tonal" buttons are ideal for category-level actions.
- **Progress Indicators:**
    - **Linear:** Use for specific folder scans. Include a "segment" variant to show different file types (Images, Video, System) in one bar.
    - **Circular:** Used for global disk health overview in the dashboard.
- **Chips:** Filter file types using "Filter Chips." Use semantic colors (e.g., a Red dot inside a chip for "Large Files").
- **Table/List:** Use a alternating row background or a thin 1px divider. Hover states must change the background to `surface-container-high`.
- **Navigation Rail:** Active states should be indicated by a pill-shaped "Active Indicator" behind the icon, following the M3 spec.
- **Cards:** Content-heavy containers with no shadow, using a 1px border in light mode and a surface-tint in dark mode.