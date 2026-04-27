# CookiPal — Project Overview

> **App name: CookiPal** (folder name is `recipe-book-2` — ignore the folder name). This file is for AI tools and future Claude sessions. It gives a complete picture of what has been built, how the project is structured, and how things work together. Do NOT modify existing source files based on this document alone — always read current file contents first.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.2.0 |
| Build Tool | Vite | 6.2.2 |
| Router | React Router DOM | 7.1.3 |
| Server State | TanStack React Query | 5.90.21 |
| Backend / DB | Firebase (Firestore, Auth, Storage) | 12.8.0 |
| Mobile | Capacitor (Android) | 8.3.0 |
| AI | OpenAI API via Google Cloud Functions | — |
| UI Library | Material UI | 5.15.14 |
| Animation | Framer Motion | 11.15.0 |
| Icons | Lucide React + React Icons | — |
| Styling | CSS Modules + Global CSS variables | — |
| CSS Reset | normalize.css | 8.0.1 |
| Language | JavaScript (JSX) | — |

---

## Project Structure

```
recipe-book-2/
├── src/
│   ├── app/
│   │   ├── App.jsx                    Main router setup
│   │   ├── app.module.css
│   │   ├── data/                      navLinks.js, data.js, users.js
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx         Public routes (login/signup)
│   │   │   └── ProtectedLayout.jsx    Auth-required routes + nav/footer/widgets
│   │   ├── recipeParser.js            Recipe text parsing utility
│   │   └── utils.js                   Recipe CRUD helpers, data transforms
│   │
│   ├── components/                    66+ component directories
│   │   ├── banners/                   Email verification banner, post-signup modal
│   │   ├── categories-management/     Category CRUD UI
│   │   ├── category-card/
│   │   ├── chat/                      AI chat window (ChatWindow, ChatWindowContext, ChatWindowMessages)
│   │   ├── comment-form/
│   │   ├── comment-item/
│   │   ├── comments-section/
│   │   ├── controls/                  Buttons, FAB, search, sort, toast, tooltip, bottom-sheet, view-toggle
│   │   ├── conversion-tables/
│   │   ├── cooking-voice-chat/        Voice assistant during cooking
│   │   ├── error-boundary/
│   │   ├── footer/
│   │   ├── forms/
│   │   │   ├── add-recipe-wizard/     Multi-step recipe creation form
│   │   │   ├── edit-recipe/
│   │   │   ├── change-email-dialog/
│   │   │   ├── confirm-dialog/
│   │   │   ├── copy-recipe-dialog/
│   │   │   ├── report-recipe-dialog/
│   │   │   └── blocked-users-panel/
│   │   ├── header/
│   │   ├── icons/                     Custom icon components
│   │   ├── modal/
│   │   ├── navigation/                Sidebar navigation menu
│   │   ├── premium-gate/              Blocks features for non-premium users
│   │   ├── premium-popup/
│   │   ├── product-tour/              Onboarding tour
│   │   ├── radio-player/              Background audio streaming
│   │   ├── recipes/
│   │   │   ├── recipes-view/          Grid/list view with filtering and sorting
│   │   │   ├── recipe-details-full/   Full recipe view
│   │   │   ├── recipe-details-cooking/ Step-by-step cooking mode
│   │   │   ├── recipe-variations/
│   │   │   ├── export-image-button/
│   │   │   └── search-overlay/
│   │   ├── shopping-list-view/
│   │   ├── timer-widget/              Multiple concurrent cooking timers
│   │   └── usage-indicator/           Shows remaining AI quota
│   │
│   ├── context/                       Global React Context providers
│   │   ├── RecipesBookContext.jsx     MAIN context: auth, recipes, categories, CRUD
│   │   ├── LanguageContext.jsx        i18n: language state + t() function
│   │   ├── TimerContext.jsx           Cooking timers
│   │   ├── RadioContext.jsx           Radio player state
│   │   ├── BlockedUsersContext.jsx    Blocked users
│   │   └── index.js
│   │
│   ├── firebase/                      Firebase service modules
│   │   ├── config.js                  Firebase initialization
│   │   ├── authService.js
│   │   ├── recipeService.js
│   │   ├── categoryService.js
│   │   ├── commentService.js
│   │   ├── imageService.js
│   │   ├── globalRecipeService.js     Community/public recipes
│   │   ├── mealPlanService.js
│   │   ├── blockUserService.js
│   │   ├── ratingService.js
│   │   └── moderationService.js
│   │
│   ├── hooks/                         Custom React hooks
│   │   ├── useComments.js
│   │   ├── useEntitlements.js         Premium feature checking
│   │   ├── useGlobalRecipes.js
│   │   ├── useMealPlanner.js
│   │   ├── useNetworkStatus.js        Online/offline detection
│   │   ├── useScrollRestore.js
│   │   ├── useSwipe.js
│   │   ├── useTouchDragDrop.js
│   │   ├── useTranslatedList.js
│   │   ├── useTranslatedRecipe.js
│   │   └── useTranslatedText.js
│   │
│   ├── pages/
│   │   ├── categories/Categories.jsx  Default page after login
│   │   ├── login/
│   │   ├── signup/
│   │   ├── onboarding/
│   │   ├── recipe-details/RecipeDetailsPage.jsx
│   │   ├── meal-planner/
│   │   ├── shopping-list/
│   │   ├── global-recipes/            Community recipe feed
│   │   ├── settings/
│   │   ├── sharer-profile/            View another user's recipes
│   │   ├── delete-account/
│   │   ├── privacy/
│   │   └── terms/
│   │
│   ├── utils/
│   │   ├── theme.js                   Dark/light mode
│   │   ├── applyFontScale.js
│   │   ├── translations.js            i18n string map
│   │   ├── translateContent.js        Recipe translation service
│   │   ├── categoryIcons.js
│   │   ├── chatIntents.js             AI chat intent parsing
│   │   ├── emailTypos.js
│   │   ├── ingredientCalc.js          Scaling/unit math
│   │   └── ingredientUtils.js
│   │
│   ├── config/
│   │   └── entitlements.js            Premium feature definitions
│   │
│   ├── index.css                      Global CSS variables, design tokens, typography
│   └── main.jsx                       React entry point, QueryClient setup
│
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── storage.rules
├── capacitor.config.json
├── vite.config.js
├── .env                               (git-ignored, see .env.example)
└── design-tokens.json
```

---

## Routes

### Public (MainLayout — no nav/footer)
| Path | Component | Notes |
|---|---|---|
| `/login` | Login page | Redirects to `/categories` if already logged in |
| `/signup` | Signup page | Redirects to `/categories` if already logged in |
| `/onboarding` | Onboarding | Shown once on first use |
| `/privacy` | PrivacyPolicy | |
| `/terms` | TermsOfService | |
| `/delete-account` | DeleteAccount | |

### Protected (ProtectedLayout — with nav, header, footer, widgets)
| Path | Component | Notes |
|---|---|---|
| `/categories` | Categories | Default landing page after login |
| `/home` | — | Redirects to `/categories` |
| `/recipe/:id` | RecipeDetailsPage | |
| `/meal-planner` | MealPlanner | Weekly meal planning |
| `/shopping-list` | ShoppingList | Auto-generated from meal plan |
| `/global-recipes` | GlobalRecipes | Community recipe feed |
| `/sharer/:userId` | SharerProfile | Another user's public recipes |
| `/conversions` | ConversionTables | Unit converter |
| `/settings` | Settings | Account + app preferences |
| `/migrate` | Migrate | Data migration helper |
| `/repair` | Repair | Data repair/recovery tool |

**Route guard:** Protected routes check `isLoggedIn` from `RecipesBookContext`. Unauthenticated users are redirected to `/login`.

---

## State Management

### Global Contexts (`/src/context/`)

**`RecipesBookContext`** — the main app state
- `isLoggedIn`, `isLoading`, `currentUser`
- `recipes`, `categories`, `recipesLoaded`
- `selectedCategories`, `selectCategory()`
- `addRecipe()`, `editRecipe()`, `deleteRecipe()`
- `addCategory()`, `updateCategory()`, `deleteCategory()`
- `copyRecipeToUser()`
- Session cache in `localStorage` (`appCache`)

**`LanguageContext`** — i18n
- `language` state (Hebrew, English, Russian, German, mixed)
- `t(key)` translation function

**`TimerContext`** — multiple concurrent cooking timers

**`RadioContext`** — background audio player state

**`BlockedUsersContext`** — blocked user list + block/unblock actions

### Feature-level Contexts (local to their component tree)
`ChatWindowContext`, `WizardContext`, `EditRecipeContext`, `NavigationContext`, `RecipeDetailsContext`, `RecipesViewContext`, `CookingModeContext`, `SearchOverlayContext`

### Server State
**TanStack React Query** — used for all async server queries
- staleTime: 5 min, gcTime: 10 min
- No refetch on window focus
- 1 retry on failure

### Persistence
- `localStorage` — session cache, theme, font size, language
- `IndexedDB` (Firestore offline) — cached recipes and categories
- `sessionStorage` — temporary navigation state

---

## Styling

- **CSS Modules** for all components (`ComponentName.module.css` alongside JSX)
- **`/src/index.css`** holds all design tokens as CSS custom properties
- **No Tailwind** — do not add it
- **Material UI** used for some form controls only (MUI Select, etc.)

### Design Tokens (CSS variables in index.css)
```
Primary (Terracotta):  #E2725B  — 9 shades (900–100)
Secondary (Olive):     #8A9A5B  — 9 shades
Brown (Warm accent):   #635555  — 9 shades
Tertiary (Neutral):    #F2EFEC  — 9 shades
Neutral (Gray):        #4A453E  — 9 shades
Danger (Red):          #EF4444  — 9 shades

Fonts: Paytone One, Raleway, Noto Sans Hebrew
Base: 62.5% font-size (1rem = 10px)
Mobile breakpoint: max-width 768px
```

---

## Backend & APIs

### Firebase (primary backend)
- **Auth** — email/password + Google OAuth (Capacitor plugin)
- **Firestore** — NoSQL database with offline persistence

  Collections:
  - `users/{uid}` — profile, settings, plan/usage
  - `recipes/{recipeId}` — user recipes
  - `categories/{categoryId}` — user-defined categories
  - `comments/{commentId}` — recipe comments
  - `meals/{mealId}` — meal plan entries
  - `sharedRecipes/{recipeId}` — public/community recipes
  - `ratings/{ratingId}` — recipe star ratings

- **Storage** — recipe images, user uploads, AI-generated images

### Google Cloud Functions (serverless)
| Function | Purpose |
|---|---|
| `openaiChat` | AI recipe chatbot |
| `openaiTts` | Text-to-speech for cooking voice |
| `ocrImage` | Extract recipe from photo |
| `openaiRecipeImage` | Generate recipe image (DALL-E) |
| `searchCommunityRecipes` | Full-text recipe search |
| `fetchUrl` | Scrape recipe from URL |
| `fetchUrlBrowser` | CORS-safe URL fetch fallback |

### External APIs
- **OpenAI** — GPT chat, DALL-E image gen, OCR, nutrition
- **Google Translate** — via `/api/translate` Vite proxy
- **Jina Reader** — URL content extraction fallback

### Environment Variables (`.env`)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_OPENAI_API_KEY
VITE_CLOUD_CHAT_URL
VITE_CLOUD_TTS_URL
VITE_CLOUD_OCR_URL
VITE_CLOUD_RECIPE_IMAGE_URL
VITE_CLOUD_SEARCH_URL
VITE_CLOUD_FETCH_URL
VITE_CLOUD_FETCH_BROWSER_URL
```

---

## Features Built (Complete)

| Feature | Notes |
|---|---|
| Recipe CRUD | Create, edit, delete, categorize, reorder |
| Category management | Add/edit/delete/reorder user-defined categories |
| Multi-step recipe wizard | Add via manual form, AI chat, photo OCR, or URL |
| Authentication | Email/password + Google OAuth, email verification, change email, reset password |
| Community feed | Share recipes publicly, browse, rate, comment, copy |
| AI chat assistant | GPT-powered recipe help |
| Recipe image generation | DALL-E, stored in Firebase Storage |
| OCR recipe scan | Photo → recipe via Cloud Function |
| URL recipe import | Cloud Function + Jina Reader fallback |
| Voice input | Voice-to-text for recipe creation |
| Voice cooking mode | TTS step-by-step guided cooking |
| Meal planner | Weekly view, assign recipes to meal slots |
| Shopping list | Auto-generated from meal plan, categorized by ingredient type |
| Unit conversions | Interactive measurement converter |
| Cooking timers | Multiple concurrent timers, floating widget |
| Background radio | Audio streaming player, minimizable |
| Translations | Multi-language (Hebrew/English/Russian/German) per recipe and UI |
| Dark/light theme | Toggle with localStorage persistence |
| Font scaling | User-adjustable font size |
| Offline support | Firestore IndexedDB cache, offline banner |
| Premium / freemium | Usage limits per AI feature, hard + soft gates |
| User blocking | Block/unblock community users |
| Content moderation | Report inappropriate recipes |
| Mobile app | Capacitor/Android build — app ID: `com.tania.cookipal`, app name: CookiPal |
| Google Play Store prep | Release signing config, Google Sign-In on Android, app icon + splash screen, `app-release.aab` built, Play Console account registered + identity & phone verification complete, internal testing track created, testers list set up (including self) — next step: create new release and upload AAB |
| Age gate on signup | Users must confirm they are 13+ and accept Terms + Privacy before creating an account |
| Static legal pages | `/privacy` and `/terms` exist as both React routes AND standalone HTML files (required for Play Store listing) |
| Delete account | Dedicated page + settings link, full data cleanup on deletion |
| Responsive UI | Mobile-first, RTL support, safe area insets |
| Performance | Code splitting, lazy loading, skeleton screens, React Query caching |

---

## Key Conventions

- Component folders: `src/components/component-name/ComponentName.jsx` + `component-name.module.css`
- Each page in `src/pages/page-name/PageName.jsx`
- Firebase operations isolated in `src/firebase/` service files — never call Firestore directly from components
- All AI/backend calls go through Cloud Functions (never expose OpenAI key to client directly)
- Skeleton screens exist for all major lazy-loaded routes
- `RecipesBookContext` is the source of truth for recipes, categories, and auth state — do not duplicate this state
- CSS variables from `index.css` must be used for colors/typography — no hardcoded hex values in components
- No Tailwind — project uses CSS Modules exclusively for component styles
