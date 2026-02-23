# WhytCard Stack Audit — Tailwind v4, Responsive, Dark Mode

**Date**: 2026-02-12  
**Scope**: `evidive.blue/frontend/src`  
**Focus**: Tailwind CSS v4, Responsive Design, Dark Mode

---

## Executive Summary

- **Tailwind v4**: Inline styles (with exceptions), magic spacing, direct `clsx` usage; no tailwind.config; no arbitrary hex colors; PostCSS correct.
- **Responsive**: Fixed pixel widths/heights, fixed grids without breakpoints, some headings without responsive typography.
- **Dark mode**: `bg-white/*` usages (opacity variants) without explicit `dark:` counterparts; no `text-black`, `bg-gray-*`, or `border-gray-*` in scope.

---

## 1. Tailwind v4 Scans

### 1.1 Inline styles — `style={`

| File | Line | Matched content / context |
|------|------|---------------------------|
| `components/ocean-background.tsx` | 158 | `style={ { "--p": "0", "--sun-x": "50%", ... } as React.CSSProperties }` — **Exception**: CSS custom properties for theming. |
| `components/ocean-background.tsx` | 403 | `<div className="ocean-firefly firefly-gold" style={{ top: "18%", left: "12%" }} />` |
| `components/ocean-background.tsx` | 404 | `style={{ top: "55%", left: "72%" }}` |
| `components/ocean-background.tsx` | 405 | `style={{ top: "35%", left: "45%", animationDelay: "1.2s" }}` |
| `components/ocean-background.tsx` | 407 | `style={{ top: "28%", left: "28%", animationDelay: "0.5s" }}` |
| `components/ocean-background.tsx` | 408 | `style={{ top: "62%", left: "88%", animationDelay: "2.5s" }}` |
| `components/ocean-background.tsx` | 409 | `style={{ top: "42%", left: "58%", animationDelay: "3.8s" }}` |
| `components/ocean-background.tsx` | 411 | `style={{ top: "48%", left: "35%", animationDelay: "1.8s" }}` |
| `components/ocean-background.tsx` | 412 | `style={{ top: "22%", left: "82%", animationDelay: "3s" }}` |
| `components/ocean-background.tsx` | 414 | `style={{ top: "38%", left: "18%", animationDelay: "2.2s" }}` |
| `components/ocean-background.tsx` | 415 | `style={{ top: "15%", left: "55%", animationDelay: "4s" }}` |
| `components/ocean-background.tsx` | 416 | `style={{ top: "58%", left: "42%", animationDelay: "0.8s" }}` |
| `components/ocean-background.tsx` | 418 | `style={{ top: "30%", left: "65%", animationDelay: "1.5s" }}` |
| `components/ocean-background.tsx` | 419 | `style={{ top: "50%", left: "8%", animationDelay: "3.5s" }}` |
| `components/ocean-background.tsx` | 425–439 | Multiple `ocean-biolum-particle` divs with `style={{ top: "…", left: "…", animationDelay: "…" }}` |
| `components/ocean-background.tsx` | 441–456 | Same pattern for biolum-blue, biolum-amber, biolum-purple, biolum-teal |
| `components/centers/centers-globe.tsx` | 303 | `style={{ left: popup.x, top: popup.y }}` — **Exception**: Dynamic positioning from state. |
| `components/admin/admin-reports-client.tsx` | 98 | `style={{ width: \`${percentage}%\` }}` — **Exception**: Dynamic width. |
| `components/admin/admin-plannings-client.tsx` | 768, 786, 871 | `style={{ ... }}` (inline style blocks) |
| `components/admin/admin-plannings-client.tsx` | 849 | `style={{ minHeight: (HOUR_END - HOUR_START + 1) * 56 }}` — Dynamic. |
| `components/admin/admin-plannings-client.tsx` | 855 | `style={{ top: (h - HOUR_START) * 56 }}` — Dynamic. |
| `components/ui/sonner.tsx` | 27 | `style={ { "--normal-bg": "var(--popover)", ... } as React.CSSProperties }` — **Exception**: CSS custom properties. |

**Summary**: All `style={` usages are listed. Exceptions (CSS vars, dynamic values) are noted; the rest (ocean-background positioning, admin-plannings static style blocks) are convention violations unless justified.

---

### 1.2 Tailwind config files

- **Result**: No `tailwind.config.js`, `tailwind.config.ts`, or `tailwind.config.mjs` found under `evidive.blue/frontend`.
- **Status**: Compliant (CSS-first configuration).

---

### 1.3 Arbitrary color values — `(bg|text|border|fill|stroke)-\[#`

- **Result**: No matches in `src` with `*.tsx`.
- **Status**: Compliant.

---

### 1.4 Magic number spacing — `(p|m|gap|space-[xy])-\[\d+px\]`

| File | Line | Matched content |
|------|------|-----------------|
| `components/ui/tabs.tsx` | 29 | `"rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-9 ..."` |

**Summary**: One match: `p-[3px]` in the tabs component.

---

### 1.5 Direct clsx/classnames usage (should use cn())

| File | Line | Matched content |
|------|------|-----------------|
| `components/admin/admin-sidebar.tsx` | 168 | `className={clsx(` |
| `components/admin/admin-sidebar.tsx` | 183 | `className={clsx(` |
| `components/admin/admin-sidebar.tsx` | 205 | `className={clsx(` |
| `components/dashboard/dashboard-sidebar.tsx` | 73 | `className={clsx(` |

**Summary**: Four uses of `clsx(` for class names; project convention is to use `cn()` from `@/lib/utils`.

---

### 1.6 PostCSS config

- **File**: `evidive.blue/frontend/postcss.config.mjs`
- **Content**: `plugins: { "@tailwindcss/postcss": {} }`
- **Status**: Compliant (no legacy `tailwindcss` plugin).

---

## 2. Responsive Design Scans

### 2.1 Fixed pixel widths — `w-\[\d+px\]` and min/max-width with px

| File | Line | Matched content |
|------|------|-----------------|
| `components/admin/admin-table.tsx` | 194 | `min-w-[220px]` |
| `components/admin/admin-table.tsx` | 209 | `min-w-[160px]` |
| `components/ocean-background.tsx` | 375 | `w-[90px] h-10` (SVG fish) |
| `components/ocean-background.tsx` | 383 | `w-[50px] h-8` (SVG) |
| `app/[locale]/centers/centers-client.tsx` | 22 | `max-w-[480px]` … `lg:max-w-[520px]` |
| `app/[locale]/centers/centers-client.tsx` | 132 | `max-w-[480px] lg:max-w-[520px]` |
| `components/admin/admin-locations-client.tsx` | 314 | `min-w-[120px]` |
| `components/admin/admin-locations-client.tsx` | 332 | `min-w-[140px]` |
| `components/admin/admin-locations-client.tsx` | 344 | `min-w-[100px]` |
| `components/admin/admin-locations-client.tsx` | 356 | `min-w-[100px]` |
| `components/admin/admin-center-detail-client.tsx` | 639 | `max-w-[200px]` |
| `components/centers/centers-globe.tsx` | 315 | `min-w-[200px] max-w-[260px]` |
| `components/dashboard/dashboard-holidays-client.tsx` | 348 | `min-w-[140px]` |
| `components/admin/admin-vendors-client.tsx` | 287 | `max-w-[180px]` |
| `components/admin/admin-coupons-client.tsx` | 477 | `max-w-[200px]` |
| `components/admin/admin-commissions-client.tsx` | 272 | `min-w-[180px]` |
| `components/admin/admin-plannings-client.tsx` | 371, 390, 403 | `min-w-[200px]` |
| `components/admin/admin-plannings-client.tsx` | 725, 743 | `min-w-[800px]` + `grid-cols-8` |
| `components/admin/admin-reports-client.tsx` | 116, 129 | `min-w-[200px]` |
| `components/dashboard/dashboard-calendar-client.tsx` | 143 | `min-w-[800px]` |
| `components/admin/admin-refunds-client.tsx` | 99 | `min-w-[200px]` |
| `components/admin/admin-bookings-client.tsx` | 106, 124, 137 | `min-w-[200px]` |

**Summary**: All fixed/min/max width values in scope listed. Large fixed widths (e.g. `min-w-[800px]`) are the most impactful for responsive behavior.

---

### 2.2 Fixed pixel heights — `h-\[\d+px\]` / min-h with px

| File | Line | Matched content |
|------|------|-----------------|
| `app/[locale]/explorer/explorer-client.tsx` | 14 | `h-[calc(100dvh-13rem)] min-h-[500px]` |
| `components/dashboard/dashboard-holidays-client.tsx` | 399 | `min-h-[60px]` |
| `components/admin/admin-plannings-client.tsx` | 643 | `min-h-[80px]` |
| `components/dashboard/dashboard-calendar-client.tsx` | 180 | `min-h-[40px]` |

**Summary**: All fixed/min height usages in scope listed.

---

### 2.3 Fixed grid without responsive variants

Grids where the only or base `grid-cols-*` has no `sm:`/`md:`/`lg:`/`xl:` variant:

| File | Line | Matched content |
|------|------|-----------------|
| `components/layout/navbar.tsx` | 483 | `grid grid-cols-3 gap-1 px-2 pb-2` |
| `components/home/stats-section.tsx` | 33 | `grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8` — base is grid-cols-2 (mobile). |
| `components/dashboard/dashboard-services-client.tsx` | 311 | `grid grid-cols-2 gap-4` |
| `components/dashboard/dashboard-services-client.tsx` | 328 | `grid grid-cols-2 gap-4` |
| `components/admin/admin-plannings-client.tsx` | 622 | `grid grid-cols-7 border-b border-slate-800` |
| `components/admin/admin-plannings-client.tsx` | 632 | `grid grid-cols-7` |
| `components/admin/admin-plannings-client.tsx` | 725 | `grid min-w-[800px] grid-cols-8` |
| `components/admin/admin-plannings-client.tsx` | 743 | `grid min-w-[800px] grid-cols-8` |
| `components/dashboard/dashboard-holidays-client.tsx` | 379 | `grid grid-cols-7 gap-px` |
| `components/dashboard/dashboard-calendar-client.tsx` | 145 | `grid grid-cols-8 border-b border-slate-800 bg-slate-900` |
| `components/dashboard/dashboard-calendar-client.tsx` | 164 | `grid grid-cols-8 border-b border-slate-800/50` |

**Summary**: Violations are grids that never change column count by breakpoint (e.g. `grid-cols-3`, `grid-cols-2`, `grid-cols-7`, `grid-cols-8` with no responsive override). `stats-section` has `lg:grid-cols-4` so it’s responsive; the others in the table that have only one `grid-cols-*` are fixed.

---

### 2.4 Fixed text sizes on headings (no responsive variants)

Headings with a single text size (no `sm:`/`md:`/`lg:` text size):

| File | Line | Matched content |
|------|------|-----------------|
| `app/[locale]/login/page.tsx` | 17 | `text-2xl font-bold text-white` |
| `app/[locale]/register/page.tsx` | 17 | `text-2xl font-bold text-white` |
| `app/[locale]/partner/partner-client.tsx` | 199 | `text-3xl font-bold text-white` (no sm:/lg:) |
| `app/[locale]/onboard/center/page.tsx` | 14 | `text-3xl font-bold text-white` |
| `components/booking/booking-success-client.tsx` | 58 | `text-3xl font-bold text-white` |
| `app/[locale]/sitemap/page.tsx` | 32 | `text-4xl font-bold text-white` |
| `app/[locale]/privacy/page.tsx` | 23 | `text-4xl font-bold text-white` |
| `app/[locale]/careers/careers-client.tsx` | 26 | `text-4xl font-bold text-white` |
| `app/[locale]/careers/careers-client.tsx` | 38, 60 | `text-2xl font-semibold text-cyan-200` |
| `components/booking/booking-cancel-client.tsx` | 27 | `text-3xl font-bold text-white` |
| `app/[locale]/terms/page.tsx` | 23 | `text-4xl font-bold text-white` |
| `app/[locale]/centers/[slugOrId]/center-detail-client.tsx` | 108 | `text-3xl font-bold text-white` |
| `app/[locale]/centers/[slugOrId]/center-detail-client.tsx` | 147, 196 | `text-2xl font-semibold text-cyan-200` |
| `app/[locale]/contact/page.tsx` | 15 | `text-4xl font-bold text-white` |
| `components/admin/admin-dashboard-client.tsx` | 35, 47, 66 | `text-2xl font-bold text-white` |
| `components/booking/booking-form-client.tsx` | 172 | `text-2xl font-bold text-white` |
| `components/dashboard/dashboard-overview-client.tsx` | 117 | `text-2xl font-bold` (profile name) |
| `components/dashboard/dashboard-overview-client.tsx` | 139 | `text-2xl font-bold text-white` |
| `app/[locale]/not-found.tsx` | 9, 12 | `text-8xl`, `text-4xl font-bold text-white` |
| `app/[locale]/error.tsx` | 16, 19 | `text-8xl`, `text-3xl font-bold text-white` |
| `components/dashboard/dashboard-payments-client.tsx` | 110 | `text-4xl font-bold text-emerald-400` |
| `components/explorer/dive-guide-chat.tsx` | 165 | `text-2xl font-bold text-white` |
| `components/admin/stat-card.tsx` | 22 | `text-2xl font-bold text-white` |
| `components/admin/page-header.tsx` | 17 | `text-2xl font-bold tracking-tight text-white` |
| `app/[locale]/(admin)/admin/settings/page.tsx` | 9 | `text-2xl font-bold text-white` |
| `components/example-animated.tsx` | 23 | `text-2xl font-bold mb-4` |

**Summary**: Headings that only use one text size (e.g. `text-2xl` or `text-4xl`) with no responsive variant. Entries that already have e.g. `sm:text-5xl lg:text-6xl` were not listed as violations.

---

## 3. Dark Mode Scans

### 3.1 bg-white without dark: variant

All matches use opacity variants (`bg-white/5`, `bg-white/10`, etc.) on what appears to be a dark/ocean theme. They are listed for consistency with the “every visible element must have dark:” rule:

| File | Line | Matched content |
|------|------|-----------------|
| `components/layout/navbar.tsx` | 266 | `hover:bg-white/8` |
| `components/layout/navbar.tsx` | 296, 317, 338 | `hover:bg-white/10` |
| `components/layout/navbar.tsx` | 304, 325 | `bg-white/10` (divider) |
| `components/layout/navbar.tsx` | 380, 406, 530 | `hover:bg-white/8` |
| `components/layout/navbar.tsx` | 389, 540 | `hover:bg-white/5`, `border-white/10`, `hover:bg-white/5` |
| `components/layout/navbar.tsx` | 493 | `hover:bg-white/10` |
| `components/home/stats-section.tsx` | 37 | `bg-white/[0.02]`, `hover:bg-white/[0.04]` |
| `components/home/why-us-section.tsx` | 71 | `bg-white/[0.03]` |
| `components/home/cta-section.tsx` | 49 | `bg-white/5`, `hover:bg-white/10` |
| `app/[locale]/blog/blog-client.tsx` | 79 | `bg-white/5` |
| `app/[locale]/faq/faq-client.tsx` | 119 | `hover:bg-white/5` |
| `components/ocean-background.tsx` | 247 | `bg-white/30` |
| `app/[locale]/centers/centers-client.tsx` | 22 | `bg-white/5` |
| `components/explorer/dive-guide-chat.tsx` | 196, 219, 231, 250, 275 | `hover:bg-white/10`, `bg-white/20`, `bg-white/10`, `bg-white/10`, `bg-white/10` |
| `components/centers/centers-filters.tsx` | 52, 84 | `bg-white/10`, `bg-white/5`, `hover:bg-white/10` |

**Summary**: No solid `bg-white`; all are `bg-white/<opacity>`. If the app uses a `.dark` class, these may need explicit `dark:` variants for correct contrast/theme switching.

---

### 3.2 text-black without dark: variant

- **Result**: No matches for `text-black` in `src` `*.tsx`.
- **Status**: N/A.

---

### 3.3 bg-gray-* without dark: counterpart

- **Result**: No matches for `bg-gray-` in `src` `*.tsx`.
- **Status**: N/A.

---

### 3.4 border-gray-* without dark: counterpart

- **Result**: No matches for `border-gray-` in `src` `*.tsx`.
- **Status**: N/A.

---

## 4. Reference Table (all findings)

| # | Category | File | Line | Finding |
|---|----------|------|------|--------|
| 1 | Inline style | ocean-background.tsx | 158 | CSS vars (exception) |
| 2 | Inline style | ocean-background.tsx | 403–456 | top/left/animationDelay on particles |
| 3 | Inline style | centers-globe.tsx | 303 | Dynamic left/top (exception) |
| 4 | Inline style | admin-reports-client.tsx | 98 | Dynamic width % (exception) |
| 5 | Inline style | admin-plannings-client.tsx | 768, 786, 849, 855, 871 | style blocks / dynamic |
| 6 | Inline style | sonner.tsx | 27 | CSS vars (exception) |
| 7 | Magic spacing | tabs.tsx | 29 | p-[3px] |
| 8 | clsx | admin-sidebar.tsx | 168, 183, 205 | clsx( |
| 9 | clsx | dashboard-sidebar.tsx | 73 | clsx( |
| 10 | Fixed width | admin-table, ocean-background, centers-client, admin-*, dashboard-* | (see 2.1) | min-w/max-w/w-[…px] |
| 11 | Fixed height | explorer-client, dashboard-holidays, admin-plannings, dashboard-calendar | (see 2.2) | min-h-[…px] / h-[…] |
| 12 | Fixed grid | navbar, dashboard-services, admin-plannings, dashboard-holidays, dashboard-calendar | (see 2.3) | grid-cols-* without responsive |
| 13 | Heading typography | login, register, partner, onboard, booking-*, sitemap, privacy, careers, terms, center-detail, contact, admin-*, dashboard-*, not-found, error, example-animated | (see 2.4) | Single text size, no responsive |
| 14 | Dark (bg-white/*) | navbar, stats-section, why-us, cta-section, blog-client, faq, ocean-background, centers-client, dive-guide-chat, centers-filters | (see 3.1) | bg-white/opacity without dark: |

---

## Conclusion

- **Tailwind v4**: Compliant on config, PostCSS, and hex colors. Address: inline styles (except CSS vars and dynamic values), `p-[3px]` in tabs, and replacement of `clsx(` with `cn()` in sidebars.
- **Responsive**: Review fixed widths (especially `min-w-[800px]`), fixed heights, grids that don’t change by breakpoint, and headings that could use responsive text sizes.
- **Dark mode**: If the app supports a `.dark` theme, add `dark:` variants for all `bg-white/*` (and any other light tokens) so both themes are consistent and accessible.
