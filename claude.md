@AGENTS.md

# ClearPath Design Language

All UI work across every branch MUST follow this design system. Reference `react-app.js` at root for the canonical component patterns.

## Colour Palette

| Token              | Hex       | Usage                                    |
|--------------------|-----------|------------------------------------------|
| `cp-dark`          | `#0A3B2A` | Primary text, dark backgrounds, buttons  |
| `cp-text-muted`    | `#537566` | Secondary/muted text                     |
| `cp-bg`            | `#F4F7F5` | Page background                          |
| `cp-surface`       | `#FFFFFF` | Card surfaces                            |
| `cp-lime`          | `#D9FA58` | Primary accent — pills, highlights, CTA  |
| `cp-mint`          | `#A3E4D1` | Secondary accent — switch panels, labels |
| `cp-purple`        | `#D0A4FF` | Edu/rights cards, target badges          |
| `cp-border`        | `#e0e5e3` | Subtle borders                           |

Do NOT use NHS blue (`#005eb8`) or the old `nhs-*` colour tokens.

## Typography

- Font: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Headings: `font-extrabold`, tight letter-spacing (`tracking-[-0.04em]` for h1, `tracking-[-0.02em]` for h2)
- Body: `text-sm` (0.875rem), `font-medium`
- Labels: `text-[0.7rem]`, `uppercase`, `font-semibold`, `tracking-[0.05em]`, `opacity-70`
- Large values: `text-[3.5rem]`, `font-extrabold`, `tracking-[-0.05em]`

## Layout

- Mobile-first: max-width `414px`, centred on page with subtle gradient background
- Container shadow: `0 0 20px rgba(0,0,0,0.05)`
- Top bar: sticky, pills for brand + location, round menu button
- Main content: `px-4`, `gap-6` between sections, `pb-16` bottom padding

## Component Patterns

### Pills / Badges
- Rounded full (`rounded-full` / `rounded-[999px]`)
- Brand pill: `bg-cp-lime text-cp-dark`, `text-xs font-bold`
- Location pill: transparent with `border-[1.5px] border-cp-dark`
- Target badge: `bg-cp-purple text-cp-dark`, `text-[0.7rem] font-bold`
- Save badge: `bg-cp-dark text-cp-lime`

### Cards
- Standard card: `bg-white rounded-[20px] p-4 border-[1.5px] border-transparent`
- Recommended card: `bg-cp-lime border-cp-lime rounded-[20px]`
- Feature card (dark): `bg-cp-dark text-white rounded-[32px] p-6`
- Edu/rights card: `bg-cp-purple rounded-[32px] p-6`
- Press feedback: `transition-transform duration-100`, scale to 0.98 on press

### Buttons
- Primary: `bg-cp-dark text-white rounded-full py-4 font-bold` with arrow icon, `justify-between`
- Outline: `border-[1.5px] border-cp-dark text-cp-dark rounded-full bg-transparent`

### Comparison Panel
- Side-by-side in `bg-white rounded-[20px]` with `bg-cp-mint` on the "switch" side
- VS badge: `bg-cp-dark text-white rounded-full` centred on divider

### Inputs
- `rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3`
- Focus: `focus:border-cp-dark focus:outline-none`

### Modal
- Overlay: `bg-black/50`, centred content
- Modal card: `bg-white rounded-[32px] p-8 max-w-[360px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]`

## Icons
- Use inline SVGs (no icon library)
- Default stroke: `strokeWidth="2.5"`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- Common: LocationIcon (map pin), ArrowIcon (right arrow)
