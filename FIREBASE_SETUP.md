# הגדרת Firebase לאפליקציית ספר המתכונים

## שלב 1: יצירת פרויקט Firebase

1. היכנס ל-[Firebase Console](https://console.firebase.google.com/)
2. לחץ על "Add project" או "הוסף פרויקט"
3. תן שם לפרויקט (לדוגמה: "recipe-book")
4. עקוב אחר השלבים ליצירת הפרויקט

## שלב 2: הוספת אפליקציית Web

1. בקונסול של Firebase, לחץ על סמל ה-Web (</>)
2. תן שם לאפליקציה (לדוגמה: "Recipe Book Web App")
3. **אל תסמן** את האופציה "Set up Firebase Hosting"
4. לחץ על "Register app"

## שלב 3: העתקת פרטי ההגדרה

לאחר רישום האפליקציה, תקבל אובייקט `firebaseConfig` שנראה כך:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};
```

## שלב 4: יצירת קובץ .env

1. צור קובץ חדש בשם `.env` בתיקיית הבסיס של הפרויקט
2. העתק את התוכן הבא והחלף את הערכים בערכים שלך מ-Firebase:

```
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**חשוב:** קובץ `.env` כבר נמצא ב-`.gitignore` ולא יועלה ל-Git

## שלב 5: הפעלת Firestore Database

1. בתפריט הצד של Firebase Console, לחץ על "Firestore Database"
2. לחץ על "Create database"
3. בחר **"Start in test mode"** (למטרות פיתוח)
4. בחר מיקום (לדוגמה: `europe-west1`)
5. לחץ על "Enable"

### הגדרת כללי אבטחה (Security Rules)

לאחר יצירת הדאטאבייס, עדכן את כללי האבטחה:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /recipes/{recipeId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**שים לב:** כללים אלו מאפשרים גישה מלאה לכולם. בפרודקשן, יש להוסיף אימות והרשאות!

## שלב 6: הרצת האפליקציה

```bash
npm start
```

## מבנה הדאטאבייס

### Collection: `recipes`

כל מסמך מתכון מכיל:

```javascript
{
  name: "שם המתכון",
  ingredients: ["מרכיב 1", "מרכיב 2"],
  instructions: ["שלב 1", "שלב 2"],
  image_src: "URL לתמונה",
  prepTime: "20 min",
  cookTime: "30 min",
  servings: 4,
  categories: ["main", "salads"],
  cuisine: "Italian",
  difficulty: "Easy",
  isFavorite: false,
  createdAt: "2025-01-23T12:00:00.000Z",
  updatedAt: "2025-01-23T12:00:00.000Z"
}
```

## פונקציות זמינות

הקובץ `src/firebase/recipeService.js` מספק:

- `fetchRecipes(limit)` - שליפת מתכונים
- `addRecipe(recipe)` - הוספת מתכון
- `updateRecipe(recipeId, updatedData)` - עדכון מתכון
- `deleteRecipe(recipeId)` - מחיקת מתכון
- `deleteRecipesByCategory(categoryId)` - מחיקת מתכונים לפי קטגוריה
- `fetchRecipesByCategory(categoryId)` - שליפת מתכונים לפי קטגוריה

## טיפים

1. **הוספת מתכונים ידנית**: אפשר להוסיף מתכונים ישירות דרך Firebase Console
2. **ייבוא נתונים**: אפשר לייבא JSON עם מתכונים דרך Firebase Console
3. **גיבוי**: Firebase מאפשר ייצוא וייבוא של הדאטאבייס

## פתרון בעיות

### שגיאה: "Firebase: Error (auth/api-key-not-valid)"

- ודא שהעתקת נכון את ה-API Key לקובץ `.env`
- ודא שהפעלת מחדש את שרת הפיתוח לאחר יצירת `.env`

### שגיאה: "Missing or insufficient permissions"

- ודא שכללי האבטחה של Firestore מאפשרים קריאה וכתיבה
- בדוק ב-Firebase Console -> Firestore Database -> Rules

### המתכונים לא נטענים

- פתח את ה-Console בדפדפן (F12) ובדוק שגיאות
- ודא שיש חיבור לאינטרנט
- ודא שה-Firestore Database הופעל
