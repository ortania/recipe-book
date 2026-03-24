# src/styles/shared — קבצי עיצוב משותפים

## מבנה

```
src/styles/shared/
├── index.js                  ← re-exports נוחים לכל הקבצים
├── buttons.module.css        ← ✨ חדש — כל variants של כפתורים
├── layout.module.css         ← ✨ חדש — page containers, empty/loading states, cards, dropdowns
├── inputs.module.css         ← ✨ חדש — inputs, selects, textareas, search box
├── form-shared.module.css    ← dynamic lists, drag & drop, instruction boxes
├── category-chips.module.css ← chip/chip-active + inline category creation
├── category-tags.module.css  ← tags display + source URL
├── onboarding-shared.module.css ← בסיס onboarding + product tour
└── recipe-checkbox.module.css   ← checkboxes במתכונים
```

---

## שימוש

### import ישיר (מומלץ)
```jsx
import btnClasses from '@/styles/shared/buttons.module.css';
import layoutClasses from '@/styles/shared/layout.module.css';
import inputClasses from '@/styles/shared/inputs.module.css';
```

### import דרך index
```jsx
import { btnClasses, layoutClasses, inputClasses } from '@/styles/shared';
```

---

## buttons.module.css

### Variants מלאים

| Class | מתי להשתמש |
|---|---|
| `btnBase` | בסיס חובה לכל כפתור |
| `main` | כפתור ראשי — רקע חום (brown) |
| `primary` | כפתור ירוק (secondary palette) |
| `soft` | כפתור beige/עדין |
| `danger` | כפתור מחיקה — רקע אדום בהיר |
| `dangerStrong` | כפתור מחיקה — רקע אדום מלא |
| `success` | כפתור אישור — רקע ירוק בהיר |
| `successStrong` | כפתור אישור — רקע ירוק מלא |
| `warning` | כפתור אזהרה — רקע כתום |
| `outline` | כפתור עם מסגרת בלבד |
| `ghost` | כפתור שקוף (לאייקונים) |
| `favorite` | כפתור מועדפים — מסגרת זהב |
| `iconCircle` | עיגול עם מסגרת בלבד |
| `iconCirclePrimary` | עיגול ממולא (כפתור +) |
| `iconTinted` | עיגול עם רקע ירוק עדין |
| `closeBtn` | כפתור סגירה plain |
| `closeBtnCircle` | כפתור סגירה עם עיגול |
| `backBtn` | כפתור חזרה |

### Size modifiers
| Class | גודל |
|---|---|
| `sm` | small |
| `lg` | large |
| `hoverScale` | הוסף scale ב-hover (opt-in) |

### דוגמאות
```jsx
// כפתור ראשי
<button className={`${btn.btnBase} ${btn.main}`}>שמור</button>

// כפתור מחיקה קטן
<button className={`${btn.btnBase} ${btn.danger} ${btn.sm}`}>מחק</button>

// כפתור + עגול
<button className={`${btn.btnBase} ${btn.iconCirclePrimary}`}><Plus /></button>

// כפתור ב-Button component
<Button variant="main">שמור</Button>
<Button variant="danger" size="sm">מחק</Button>
```

---

## layout.module.css

### Classes עיקריים

| Class | שימוש |
|---|---|
| `pageContainer` | עטיפה למרחב עמוד (max-width) |
| `section` | section עם margin תחתון |
| `sectionHeader` | שורת כותרת + אייקונים בצד |
| `sectionTitle` | `<h2>` בתוך sectionHeader |
| `stickyHeader` | header שנדבק לראש בגלילה |
| `card` | כרטיסייה עם רקע, border, shadow |
| `overlay` | backdrop כהה (position fixed) |
| `emptyState` | מצב ריק (icon + טקסט + כפתור) |
| `loadingState` | מצב טעינה (spinner + טקסט) |
| `row` | flex row עם gap |
| `rowBetween` | flex row עם space-between |
| `divider` | קו מפריד אופקי |
| `badge` | תגית קטנה עגולה |
| `dropdownMenu` | פאנל dropdown עם mobile bottom sheet |
| `tip` | תיבת טיפ עם רקע |

---

## inputs.module.css

| Class | שימוש |
|---|---|
| `formGroup` | עטיפה לlabel + field |
| `formRow` | 2 עמודות (grid) |
| `formLabel` | label מעוצב |
| `formInput` | שדה טקסט |
| `formSelect` | תיבת בחירה |
| `formTextarea` | שדה טקסט ארוך |
| `inputBox` | עטיפה לicon + input |
| `searchBox` | שדה חיפוש |
| `passwordInput` | עטיפה לpassword עם toggle |
| `inputError` | הודעת שגיאה |
| `inputInvalid` | state שגוי (border אדום) |

---

## קבצים שעודכנו (תאימות לאחור)

הקבצים הבאים **שומרים את אותם class names** אבל כעת מפנים ל-shared:

- `src/components/controls/controls.module.css` — `.button`, `.disabled`, `.primary`, `.danger`, `.success`
- `src/components/controls/button/button.module.css` — `.primary`, `.danger`, `.success`, `.favorite`
- `src/components/controls/close-button/close-button.module.css` — `.closeButton`, `.plain`, `.circle`
- `src/components/controls/back-button/back-button.module.css` — `.backButton`
- `src/components/controls/add-button/add-button.module.css` — `.addButton`, `.circle`, `.circlePrimary`

---

## Bugs שתוקנו

1. **`controls.module.css`** — `.button:active { transform: scale(var(--basic-font)) }` 
   — `--basic-font` הוא `1.6rem`, לא ערך scale תקין. הוסר.

2. **`button/button.module.css`** — `.success:hover { background: var(--clr-success-bg-hover: var(--clr-success-200); --clr-success-bg-activ) }` 
   — CSS שבור לחלוטין. תוקן.

3. **`button/button.module.css`** — `.success { color: var(-clr-success-text) }` 
   — חסרה מקף. תוקן.
