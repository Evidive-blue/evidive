# EviDive SEO & i18n Audit Report

**Date**: February 3, 2026  
**Auditor**: Automated Audit System  
**Stack**: Next.js 15, React 19, Tailwind CSS v4, Prisma, NextAuth

---

## Executive Summary

| Metric | Current State | Target |
|--------|--------------|--------|
| **Hardcoded UI Strings** | 200+ | 0 |
| **Translation Completeness** | ~70% | 100% |
| **Pages with Metadata** | 5/20 | 20/20 |
| **SEO Files Present** | 0/2 | 2/2 |
| **i18n Middleware** | Missing | Required |
| **Estimated SEO Score** | 40-50/100 | 95/100 |

---

## PART 1: HARDCODED STRINGS (Critical)

### 1.1 Component Files with Hardcoded Strings

#### `components/layout/navbar.tsx`
| Line | Hardcoded String | Context |
|------|------------------|---------|
| 151, 289 | `"User"` | Fallback avatar text |
| 158, 299 | `"Dashboard"` | Menu item |
| 164, 308 | `"Profile"` | Menu item |
| 170, 317 | `"My Centers"` | Menu item |
| 179, 327 | `"Admin Panel"` | Menu item |
| Logo | `alt="EviDive"` | Image alt text |

#### `components/layout/footer.tsx`
| Line | Hardcoded String | Context |
|------|------------------|---------|
| Logo | `alt="EviDive"` | Image alt text |
| Copyright | `"EviDive"` | Brand name in copyright |
| Bottom | `"WhytCard"` | External brand (acceptable) |

#### `components/home/hero-section.tsx`
| Line | Hardcoded String | Context |
|------|------------------|---------|
| Image | `alt="EviDive Logo"` | Image alt text |

#### `components/centers/underwater-globe.tsx`
| Line | Hardcoded String | Context |
|------|------------------|---------|
| 301 | `"Loading Earth..."` | Loading state |
| 341 | `"Drag to rotate • Scroll to zoom • Click pins to select"` | Instructions |

#### `components/centers/deep-dive-explorer.tsx`
| Line | Hardcoded String | Context |
|------|------------------|---------|
| 309 | `"Deep Dive Explorer"` | Component title |
| 394 | `"Loading globe..."` | Loading state |
| 443 | `"No centers found"` | Empty state |

#### `components/explorer/dive-guide-chat.tsx`
| Line | Hardcoded String | Context |
|------|------------------|---------|
| 165 | `"DiveGuide AI"` | Chat header title |
| 166 | `"Ton guide sous-marin"` | French subtitle (hardcoded) |

### 1.2 Page Files with Hardcoded Strings

#### `app/dashboard/page.tsx` (45+ hardcoded strings)
```
Line 85: "Diver" (fallback)
Line 88: "Here's an overview of your diving activity."
Line 103: "Total Dives"
Line 115: "Bookings"
Line 127: "Reviews"
Line 139: "My Centers"
Line 149: "Upcoming Dives"
Line 154: "View all"
Line 168: "Service" (fallback)
Line 176: "diver" / "divers"
Line 186: "No upcoming dives"
Line 191: "Browse dive centers"
Line 201: "My Dive Centers"
Line 207: "Add center"
Line 223: "bookings" / "reviews"
Line 245: "No dive centers yet"
Line 250: "Register your center"
Line 260: "Quick Actions"
Line 270: "Find Dives"
Line 271: "Browse centers"
Line 283: "My Bookings"
Line 284: "View history"
Line 308: "Edit Profile"
Line 309: "Update info"
Line 339: "Settings"
Line 340: "Preferences"
```

#### `app/admin/page.tsx` (25+ hardcoded strings)
```
Line 70: "Admin Dashboard"
Line 71-72: "Manage dive centers, users, and platform settings."
Line 85: "Total Centers"
Line 97: "Pending Approval"
Line 109: "Total Users"
Line 121: "Total Bookings"
Line 131-132: "Pending Centers"
Line 143: "View all"
Line 169: "Pending"
Line 182: "No pending centers"
Line 189: "Quick Actions"
Line 200: "Manage Centers"
Line 202: "approved", "pending"
Line 218: "Manage Users"
Line 219: "total users"
Line 234: "View Bookings"
Line 235: "total bookings"
```

#### `app/admin/centers/page.tsx` (30+ hardcoded strings)
```
Line 51-56: STATUS_OPTIONS labels
Line 68-70: "Unnamed"
Line 151: "Back to Admin"
Line 153: "Manage Centers"
Line 154-156: "Review and manage dive center applications."
Line 164: "Search centers..."
Line 209: "No centers found"
Line 237: "Owner:"
Line 240-244: "services", "bookings", "reviews", "Created"
Line 257: "View"
Line 274, 327: "Approve"
Line 289: "Reject"
Line 308: "Suspend"
```

#### `app/onboard/page.tsx` (20+ hardcoded strings)
```
Lines 16-22: All option titles, descriptions, features
Line 53: "Welcome to EviDive"
Line 56: "What would you like to do?"
Lines 99-100: "You can always add a dive center later from your dashboard."
```

#### `app/onboard/diver/page.tsx` (50+ hardcoded strings)
```
Lines 13-16: STEPS labels
Lines 18-37: CERTIFICATION_LEVELS, CERTIFICATION_ORGS, DIVE_TYPES arrays
Lines 142-257: All form labels, placeholders, descriptions
Lines 290-323: Review step labels
Lines 401-437: Navigation buttons and skip text
```

#### `app/onboard/center/page.tsx` (100+ hardcoded strings)
```
Lines 22-63: STEPS, DIVE_TYPES, CERTIFICATIONS_OFFERED, LANGUAGES arrays
Lines 127-141: Validation error messages
Lines 222-700: All form labels, placeholders, descriptions
Lines 777-801: Navigation buttons
```

#### `app/contact/page.tsx`
```
Line 64: placeholder="John Doe"
Line 70: placeholder="john@example.com"
Line 76: placeholder="How can we help?"
Lines 86-87: placeholder="Your message..."
```

#### `app/centers/page.tsx`
```
Line 63: "Loading..."
```

#### `app/centers/[slug]/page.tsx`
```
Line 20: "Center Not Found"
Lines 27-28: "Unnamed"
```

---

## PART 2: METADATA ISSUES

### 2.1 Pages with Hardcoded Static Metadata

| Page | Title | Description | Issues |
|------|-------|-------------|--------|
| `app/layout.tsx` | English only | English only | No i18n, hardcoded locale, URL |
| `app/login/page.tsx` | "Login \| EviDive" | English only | No i18n |
| `app/register/page.tsx` | "Create Account \| EviDive" | English only | No i18n |
| `app/dashboard/page.tsx` | "Dashboard \| EviDive" | English only | No i18n |
| `app/admin/page.tsx` | "Admin Dashboard \| EviDive" | English only | No i18n |
| `app/admin/centers/[id]/page.tsx` | "Center Details \| Admin \| EviDive" | English only | No i18n |
| `app/center/manage/[slug]/page.tsx` | "Manage Center \| EviDive" | English only | No i18n |
| `app/onboard/page.tsx` | "Welcome \| EviDive" | English only | No i18n |

### 2.2 Pages WITHOUT Any Metadata (Client Components)

These pages rely on the global layout.tsx metadata:

- `app/page.tsx` (Home)
- `app/about/page.tsx`
- `app/careers/page.tsx`
- `app/contact/page.tsx`
- `app/explorer/page.tsx`
- `app/centers/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/forgot-password/page.tsx`
- `app/reset-password/page.tsx`
- `app/verify-email/page.tsx`
- `app/sitemap/page.tsx`
- `app/admin/centers/page.tsx`
- `app/onboard/diver/page.tsx`
- `app/onboard/center/page.tsx`

### 2.3 Open Graph Issues

**`app/layout.tsx`:**
- `locale: 'fr_FR'` - Hardcoded, should be dynamic
- `url: 'https://evidive.blue'` - Hardcoded, should be dynamic
- `images[0].alt: 'EviDive - Diving platform'` - Hardcoded, should use i18n

---

## PART 3: MISSING SEO FILES

### 3.1 robots.ts - MISSING ❌

File `app/robots.ts` does not exist. Required for SEO.

### 3.2 sitemap.ts - MISSING ❌

File `app/sitemap.ts` does not exist. Note: `app/sitemap/page.tsx` exists but is a visual sitemap page, NOT the SEO sitemap.

### 3.3 Structured Data (JSON-LD) - MISSING ❌

No JSON-LD structured data found for:
- Organization
- Dive Centers (LocalBusiness)
- Services
- Reviews

---

## PART 4: i18n CONFIGURATION ISSUES

### 4.1 Middleware - MISSING ❌

No `middleware.ts` file found for language detection and routing.

### 4.2 hreflang Tags - MISSING ❌

No `hreflang` tags implementation found in the codebase.

### 4.3 Translation File Inconsistencies

#### French (`fr.json`) - Contains English strings:
```
auth.errors.generic: "An error occurred"
auth.errors.passwordTooShort: "Password must be at least 8 characters"
auth.errors.passwordsMismatch: "Passwords do not match"
auth.errors.acceptTermsRequired: "You must accept the terms"
```

#### English (`en.json`) - Contains French strings:
```
onboard.diver.review.exploreButton: "Explorer les centres"
onboard.diver.dashboard.summary: (French content)
onboard.diver.dashboard.name: (French content)
onboard.diver.dashboard.emailLabel: (French content)
onboard.diver.dashboard.phoneLabel: (French content)
onboard.diver.dashboard.certification: (French content)
onboard.diver.dashboard.dives: (French content)
onboard.diver.dashboard.complete: (French content)
```

#### German (`de.json`), Spanish (`es.json`), Italian (`it.json`), Portuguese (`pt.json`), Dutch (`nl.json`), Polish (`pl.json`):
**MAJOR ISSUES** - Extensive English strings throughout:
- `auth.errors.*` namespace (all English)
- `legal.terms.*` namespace (mostly English)
- `legal.privacy.*` namespace (mostly English)
- `explorer.*` namespace (partial English)
- `hero.trustedBadge`, `worldExplorer.badge` (English)
- `dashboard.*` (extensive English blocks)
- `adminDashboard.*`, `adminBookings.*`, `adminReviews.*`, `adminCommissions.*` (English)
- `centerManage.nav.*` (English)
- `onboard.*` namespace (extensive English/French mixed)

#### Russian (`ru.json`):
- `auth.*` (lines 149-179) - English strings
- `contact.*` (lines 195-197) - English strings
- `explorer.*` (lines 207-211) - English strings
- `hero`, `worldExplorer`, `destinations`, `centers` badges - English
- `dashboard.seller`, `dashboard.admin.users` - Extensive English
- `settings.errors` - English
- `legal.terms`, `legal.privacy` - English
- `onboard.*` - Mixed English/French

#### Swedish (`sv.json`):
- `auth.*` (lines 409-439) - English strings
- `explorer.*` (lines 467-471) - English strings
- `dashboard.admin.users` - English
- `onboard.diver.dashboard.*` - French text (incorrect!)

#### Greek (`el.json`):
- `auth.*` (lines 149-180) - English strings
- `contact.*` (lines 195-197) - English strings
- `explorer.*` (lines 207-211) - English strings
- `legal.terms`, `legal.privacy` - English
- `onboard.*` - Mixed English/French

---

## PART 5: SEO SCORE BY PAGE (Estimated)

| Page | Current Score | Issues |
|------|---------------|--------|
| Home (`/`) | 45/100 | No unique metadata, missing structured data |
| About (`/about`) | 40/100 | Client component, no metadata |
| Login (`/login`) | 50/100 | Static English metadata |
| Register (`/register`) | 50/100 | Static English metadata |
| Dashboard (`/dashboard`) | 45/100 | Static English metadata |
| Admin (`/admin`) | 45/100 | Static English metadata |
| Centers List (`/centers`) | 40/100 | No metadata |
| Center Detail (`/centers/[slug]`) | 60/100 | Has generateMetadata but fallbacks hardcoded |
| Contact (`/contact`) | 40/100 | No metadata |
| Explorer (`/explorer`) | 40/100 | No metadata |
| Careers (`/careers`) | 40/100 | No metadata |
| Privacy (`/privacy`) | 40/100 | No metadata |
| Terms (`/terms`) | 40/100 | No metadata |
| Onboard (`/onboard/*`) | 40/100 | Static metadata or none |

**Average Current Score: ~43/100**

---

## PART 6: REQUIRED CORRECTIONS

### Priority 1: Critical SEO Files
- [ ] Create `app/robots.ts`
- [ ] Create `app/sitemap.ts`
- [ ] Add JSON-LD structured data component

### Priority 2: i18n Infrastructure
- [ ] Create `middleware.ts` for language detection
- [ ] Add `hreflang` tags to layout
- [ ] Fix all translation file inconsistencies

### Priority 3: Metadata
- [ ] Convert static metadata to `generateMetadata` with i18n
- [ ] Add metadata to all client component pages (via wrapper layouts)
- [ ] Fix Open Graph locale/URL issues

### Priority 4: Hardcoded Strings
- [ ] Extract all hardcoded strings to translation keys
- [ ] Update all 11 translation files with new keys
- [ ] Verify 100% coverage across all locales

---

## Appendix A: Translation Keys Requiring Creation

```
nav.user (fallback)
nav.dashboard
nav.profile
nav.myCenters
nav.adminPanel
common.loading
common.noResults
common.unnamed

dashboard.greeting
dashboard.totalDives
dashboard.bookings
dashboard.reviews
dashboard.myCenters
dashboard.upcomingDives
dashboard.viewAll
dashboard.noUpcomingDives
dashboard.browseCenters
dashboard.addCenter
dashboard.noCentersYet
dashboard.registerCenter
dashboard.quickActions
dashboard.findDives
dashboard.browseHistory
dashboard.editProfile
dashboard.updateInfo
dashboard.settings
dashboard.preferences

admin.title
admin.description
admin.stats.totalCenters
admin.stats.pendingApproval
admin.stats.totalUsers
admin.stats.totalBookings
admin.pendingCenters
admin.noPendingCenters
admin.quickActions
admin.manageCenters
admin.manageUsers
admin.viewBookings

adminCenters.backToAdmin
adminCenters.title
adminCenters.description
adminCenters.searchPlaceholder
adminCenters.statusAll
adminCenters.statusPending
adminCenters.statusApproved
adminCenters.statusRejected
adminCenters.statusSuspended
adminCenters.owner
adminCenters.services
adminCenters.created
adminCenters.view
adminCenters.approve
adminCenters.reject
adminCenters.suspend

onboard.welcome
onboard.whatToDo
onboard.laterNote
onboard.diver.title
onboard.diver.description
onboard.diver.features.*
onboard.center.title
onboard.center.description
onboard.center.features.*

onboardDiver.steps.*
onboardDiver.certificationLevels.*
onboardDiver.certificationOrgs.*
onboardDiver.diveTypes.*
onboardDiver.form.*
onboardDiver.review.*
onboardDiver.navigation.*

onboardCenter.steps.*
onboardCenter.diveTypes.*
onboardCenter.certifications.*
onboardCenter.languages.*
onboardCenter.errors.*
onboardCenter.form.*
onboardCenter.review.*
onboardCenter.navigation.*

contact.placeholders.*

globe.loading
globe.instructions

explorer.title
explorer.loading
explorer.noResults
explorer.chatTitle
explorer.chatSubtitle

metadata.home.*
metadata.about.*
metadata.login.*
metadata.register.*
metadata.dashboard.*
metadata.admin.*
metadata.centers.*
metadata.contact.*
metadata.explorer.*
metadata.careers.*
metadata.privacy.*
metadata.terms.*
metadata.onboard.*
```

---

*Report generated automatically. Manual review recommended before implementing corrections.*
