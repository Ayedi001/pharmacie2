---
name: Parapharmacie Tunisie
colors:
  surface: '#f7f9ff'
  surface-dim: '#d0dbe9'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf4ff'
  surface-container: '#e4effd'
  surface-container-high: '#dee9f7'
  surface-container-highest: '#d8e4f1'
  on-surface: '#121d26'
  on-surface-variant: '#3d4943'
  inverse-surface: '#27323c'
  inverse-on-surface: '#e7f2ff'
  outline: '#6d7a73'
  outline-variant: '#bccac1'
  surface-tint: '#006c50'
  primary: '#00694e'
  on-primary: '#ffffff'
  primary-container: '#008563'
  on-primary-container: '#f5fff8'
  inverse-primary: '#68dbb1'
  secondary: '#4e635b'
  on-secondary: '#ffffff'
  secondary-container: '#d1e8de'
  on-secondary-container: '#546961'
  tertiary: '#7e530f'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a6b27'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8cc'
  primary-fixed-dim: '#68dbb1'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#d1e8de'
  secondary-fixed-dim: '#b5ccc2'
  on-secondary-fixed: '#0b1f19'
  on-secondary-fixed-variant: '#374b44'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#f5bc70'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#f7f9ff'
  on-background: '#121d26'
  surface-variant: '#d8e4f1'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system crafts a clinical yet deeply inviting digital parapharmacy experience. It pairs European pharmaceutical rigor (dermatological authority, pure whitespace, and structured reassurance) with Tunisian e-commerce dynamics: rapid governorate dispatch, transparent cash-on-delivery flows, and effortless bilingual French/Arabic clarity. 

The aesthetic blends **warm clinical minimalism** with subtle organic luxury. It avoids the cold, detached sterile nature of legacy medical portals by employing generous rounded geometry (`rounded-2xl` containers), breathable micro-spacing, and tactile warm undertones. It inspires clinical trust, radiant skin wellness, and consumer certainty across mobile shoppers ordering from Tunis, Sousse, Sfax, or Bizerte.

## Colors

The color palette centers on pharmaceutical efficacy and natural botanical serenity:
- **Primary (`#159B75`)**: Deep Emerald Teal. Serves as the primary operational anchor, reserved for verified clinical badges, main action buttons, active navigation, and checkout progressions.
- **Secondary (`#DDF4EA`)**: Soft Mint Wash. Used across high-frequency visual containers, stock availability pill backgrounds, verified dermatological tags, and secondary action button states.
- **Tertiary (`#F2B96D`)**: Warm Amber Gold. Dedicated to promotional callouts, promotional ribbons, rating stars, loyalty points, and high-priority regional delivery perks (e.g., "Livraison Express 24h").
- **Neutral Primary (`#202B35`)**: Crisp Deep Charcoal. Ensures high-legibility typographic contrast for headings, price tags, and high-importance product metadata.
- **Neutral Secondary (`#4A5568`)**: Muted Slate. Handles secondary labels, dermatological descriptions, breadcrumbs, and inactive toggle icons.
- **Surfaces (`#FFFFFF` & `#F8FAF9`)**: Pure white card plates elevated against a soft, warm tinted stage that prevents ocular fatigue during extended shopping sessions.

## Typography

The type hierarchy relies on **Plus Jakarta Sans** for its balanced blend of clinical precision and warm, approachable humanistic letterforms. 

- **Price Treatment**: Currency values utilize `price-display` with the Tunisian Dinar indicator rendered as `"TND"` or `"DT"` (in Arabic: `"د.ت"`), set consistently in medium or semi-bold weight at 70% font-size relative to the integer value.
- **Bilingual & Localization Balance**: When rendering dual French/Arabic microcopy (such as checkout security points and governorate delivery selectors), text scale remains identical across scripts. Line heights for Arabic labels are set 10% wider to accommodate Arabic diacritics and ascenders cleanly.

## Layout & Spacing

The layout is grounded in a fluid 12-column grid on desktop (max canvas width 1320px) transitioning to an 8-column layout on tablet, and a dense, commerce-optimized 4-column flow on mobile viewports.

- **Breakpoints**: Mobile (0–639px), Tablet (640–1023px), Desktop (1024px+).
- **Product Card Grids**: Desktop maintains a 4-up configuration; tablets drop to 3-up; mobile transitions cleanly into a 2-up layout with tight `0.75rem` (`gutter-mobile`) gutters to preserve tap targets while displaying multiple skus above the fold.
- **Section Rhythm**: Page sections preserve vertical breathing room using `space-xl` (40px) on mobile and `4rem` on desktop, reflecting a high-end French dermatological catalog.

## Elevation & Depth

Visual depth is achieved primarily through layered tonal surfaces and whisper-soft emerald-tinted ambient shadows, rejecting stark black drop-shadows.

- **Surface Tiers**: Base background is set to `#F8FAF9`. Content cards, drawers, and modal containers sit on pure `#FFFFFF`.
- **Borders as Structure**: All interactive tiles, product modules, and input elements incorporate a subtle, low-contrast ghost border: `1px solid rgba(32, 43, 53, 0.07)`.
- **Card Shadow (Rest)**: `0 4px 16px -2px rgba(21, 155, 117, 0.05), 0 2px 6px -1px rgba(32, 43, 53, 0.03)`.
- **Card Shadow (Hover)**: `0 12px 28px -4px rgba(21, 155, 117, 0.12), 0 4px 12px -2px rgba(32, 43, 53, 0.04)`.
- **Sticky Elements & Sheets**: Mobile sticky checkout bars and quick-view slide-overs utilize a soft blur: `backdrop-filter: blur(12px)` paired with `rgba(255, 255, 255, 0.92)` background fill.

## Shapes

The design system embraces a generous, organic curve language reflecting dermatological softness and modern wellness packaging:
- Standard cards, banners, and modal dialogs adopt an elevated `rounded-2xl` profile (16px to 20px radius).
- Micro elements such as badges, chips, ratings, and primary pill buttons employ fully pill-shaped radiuses (`9999px`) to maintain tactile fluidity and safe ergonomics for thumb navigation on handheld screens.

## Components

### Buttons
- **Primary**: Background `#159B75`, text `#FFFFFF`, font-weight 600, pill-shaped (`rounded-full`), height 48px (mobile) / 52px (desktop). Hover: subtle brightness elevation, upward 1px translation.
- **Secondary**: Background `#DDF4EA`, text `#159B75`, font-weight 600, pill-shaped. Hover: `#ccefe1`.
- **Tertiary / Outlined**: Border `1.5px solid #159B75`, background transparent, text `#159B75`.

### Product Cards (`rounded-2xl`)
- White surface, `1px solid rgba(32, 43, 53, 0.07)` border definition.
- Fixed 1:1 or 4:5 image container with a `#F8FAF9` background, featuring an inset soft amber discount pill (e.g., `-25%`) and a quick-wishlist heart button in the top corners.
- Displays brand name in uppercase muted typography (`label-sm`), product title clamped to 2 lines, star rating with review count, dynamic TND price with strikethrough original price, and an instant "Ajouter" / "Quick Add" trigger.

### Localized Trust Badges & Indicators
- **Cash on Delivery (Paiement à la livraison / الدفع عند الاستلام)**: Pill badge with soft teal outline, emerald cash icon, and bilingual microcopy.
- **Governorate Delivery Badge**: Selectable drop-chip in cart and product pages (e.g., *"Livraison rapide sur Grand Tunis & 24 Gouvernorats"*).
- **Language Switcher**: Discrete top-bar capsule toggling `"FR"` and `"عربي"`.

### Chips & Filters
- Inactive: Background `#FFFFFF`, border `1px solid rgba(32, 43, 53, 0.12)`, text `#4A5568`, height 36px, `rounded-full`.
- Active: Background `#159B75`, border `1px solid #159B75`, text `#FFFFFF`, font-weight 600.

### Input Fields & Selects
- Height 48px, background `#FFFFFF`, border `1px solid rgba(32, 43, 53, 0.15)`, radius 12px, text `#202B35`.
- Focus state: Border color `#159B75` with an outer ring glow of `0 0 0 3px rgba(21, 155, 117, 0.15)`.

### Checkboxes & Radio Controls
- Emerald active fill (`#159B75`) with crisp white checkmark/dot. Radius 6px for checkboxes, full circle for radios. Transition timing: 150ms ease-out.