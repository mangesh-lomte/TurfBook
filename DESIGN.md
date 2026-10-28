---
name: TurfBook
description: Premier Sports Turf Booking & Arena Management Platform
colors:
  primary: "#123B2A"
  primary-emerald: "#176443"
  primary-dark: "#0B241A"
  primary-deep: "#07150F"
  accent: "#B9F65A"
  accent-light: "#D4FF85"
  neutral-bg: "#F8FAF7"
  neutral-surface: "#FFFFFF"
  text-primary: "#18231D"
  text-secondary: "#526158"
  text-on-dark: "#FFFFFF"
  text-on-dark-secondary: "#D5E2D8"
  border: "#DFE6DF"
  success: "#21864A"
  error: "#D64545"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card-venue:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System

## Overview

TurfBook is an authoritative, high-performance sports turf booking and arena management platform. The visual world is defined by athletic vitality, architectural precision, and uncompromising contrast. Rather than resembling a generic enterprise dashboard or neon-soaked gaming site, TurfBook balances crisp, light operational surfaces with cinematic forest-green environments and purposeful electric-lime interactive triggers.

## Colors

### Hierarchy & Application Balance
- **65–75% Neutral Light Surfaces**: The core operational baseline across search, booking grids, venue details, and dashboards uses `--color-background: #F8FAF7` and clean white cards (`#FFFFFF`).
- **15–25% Cinematic Forest-Green Environments**: Sectional anchors such as the navigation header, footer, 3D arena staging, and "How TurfBook Works" use deep emerald gradients (`linear-gradient(135deg, #0B241A 0%, #123B2A 50%, #194B32 100%)`).
- **Restrained Electric-Lime Accents (<5%)**: The electric-lime palette (`#B9F65A`, `#D4FF85`) is strictly reserved for high-priority actions (Find Slots, Instant Book, active time slot selection). It always carries dark text (`#18231D`) for WCAG AA compliance.

### Canonical Gradients
- **Hero**: `radial-gradient(ellipse at 80% 25%, rgba(185, 246, 90, 0.13), transparent 38%), linear-gradient(135deg, #F8FAF7 0%, #EDF5EC 55%, #E2F0DF 100%)`
- **Brand Primary**: `linear-gradient(135deg, #123B2A 0%, #176443 55%, #27864F 100%)`
- **Booking Accent**: `linear-gradient(135deg, #D4FF85 0%, #B9F65A 50%, #96E83F 100%)`
- **Venue Card Surface**: `linear-gradient(145deg, #FFFFFF 0%, #F6FAF2 100%)`
- **Dashboard Surface**: `linear-gradient(135deg, #F8FAF7 0%, #F0F6EE 100%)`

## Typography

- **Primary Font**: `Outfit` (`wght@300;400;500;600;700;800;900`), an athletic, geometric sans-serif that brings contemporary energy and punchy numerals without generic template tropes.
- **Display Headings**: Clean, heavyweight titles (`font-black tracking-tight text-balance`) that speak with structural clarity without stacked kicker labels.
- **Body & Captions**: Crisp `#18231D` and `#526158` on light surfaces; `#FFFFFF` and `#D5E2D8` on dark forest surfaces. `text-wrap: pretty` prevents orphan words.
- **Tabular Figures**: Slot times (`19:00 — 20:00`), transaction numbers, and pricing amounts use monospace tabular numerals for instant scanning.

## Layout

- **Spacing Cadence**: Built on a 4px/8px modular scale. Spacing communicates hierarchy through deliberate contrast between tight sibling groups (8px/12px) and generous thematic separation (32px/48px).
- **Proximity over Containers**: Related details group together organically before borders or background pills are added.
- **Responsive Topology**:
  - Desktop: Multi-column layouts with sticky booking drawers and spacious facility previews.
  - Tablet/Mobile: Collapses cleanly into single-column feeds with bottom-anchored booking sheets and touch-friendly slot targets (minimum 44x44px).

## Elevation & Depth

- **Natural Offset Depth**: Shadows always combine a subtle vertical offset and soft blur. Zero-offset colored halos and harsh brutalist block shadows are rejected.
  - `shadow-card`: `0 4px 20px -2px rgba(18, 59, 42, 0.06), 0 2px 6px -1px rgba(18, 59, 42, 0.03)`
  - `shadow-elevated`: `0 16px 36px -6px rgba(18, 59, 42, 0.12), 0 6px 16px -3px rgba(18, 59, 42, 0.05)`
  - `shadow-brand`: `0 8px 24px -4px rgba(18, 59, 42, 0.35)`
- **Architectural Borders**: Subtle 1px borders (`#DFE6DF`) define spatial planes on white surfaces.

## Shapes

- **Radius Hierarchy**:
  - `rounded-xl` (12px): Interactive controls, filter chips, time slot buttons, and inputs.
  - `rounded-2xl` (16px): Content modules, pitch detail blocks, and pricing cards.
  - `rounded-3xl` (24px): Primary cards, modal dialogs, and venue containers.
  - `rounded-full`: Status indicator dots and compact count badges.

## Components

### 1. Action Buttons
- **Primary Brand Button**: `bg-gradient-brand hover:opacity-95 text-white font-black shadow-brand active:scale-[0.98] transition-all`
- **Instant Booking CTA**: `bg-gradient-booking hover:opacity-95 text-[#18231D] font-black shadow-lime-sm active:scale-[0.98] transition-all`
- **Secondary / Ghost Button**: `bg-white hover:bg-forest-50 border border-turfborder text-forest-900 font-bold shadow-xs transition-all`

### 2. Slot Status Cards
- **Available**: White surface, subtle border, distinct time label, price tag, hover state.
- **Selected**: Electric lime fill (`#B9F65A`), dark text (`#18231D`), elevated border, checkmark indicator.
- **Booked**: Muted slate tone, disabled cursor, clear "Booked" label.
- **Maintenance Blocked**: Amber warning badge, wrench icon, non-selectable.

### 3. Match Ticket / Receipt
- Clear reference number (`#TB-20261028-XXXX`), venue address with Google Maps link, date & time breakdown, payment settled indicator, and 2-hour refund policy countdown.

## Do's and Don'ts

### Do
- Ensure all text passes WCAG AA contrast (≥4.5:1 for body, ≥3:1 for large text).
- Use dark text (`#18231D`) on electric-lime buttons.
- Use `Outfit` for display and body typography.
- Keep match start and end times identical in UTC and local formatting (e.g. 19:00–20:00).
- Provide explicit, consequential copy on cancellation dialogs (e.g., "Cancel Reservation & Refund ₹1,200").

### Don't
- Don't place kicker / eyebrow labels directly above main headings.
- Don't use gradient text on long body paragraphs or headlines.
- Don't create nested cards inside cards.
- Don't use raw emoji in place of curated SVG icons.
- Don't use zero-offset neon glow halos.

