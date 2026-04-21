import React from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../../components/controls/back-button";
import classes from "./privacy-policy.module.css";

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className={classes.page}>
      <div className={classes.container}>
        <div className={classes.backRow}>
          <BackButton onClick={() => navigate(-1)} />
          <span className={classes.backLabel}>חזרה</span>
        </div>

        <div className={classes.logoRow}>
          <span className={classes.logo}>
            Cooki<span className={classes.logoPal}>Pal</span>
          </span>
        </div>

        <h1 className={classes.title}>מדיניות פרטיות</h1>
        <p className={classes.date}>עודכן לאחרונה: אפריל 2026</p>

        <p className={classes.intro}>
          מדיניות פרטיות זו מתארת כיצד אפליקציית CookiPal אוספת, משתמשת
          ושומרת מידע אישי.
        </p>

        <section className={classes.section}>
          <h2>1. מידע שאנו אוספים</h2>

          <p className={classes.subheading}>א. מידע שהמשתמש מספק</p>
          <ul>
            <li>פרטי חשבון (שם וכתובת אימייל)</li>
            <li>מתכונים ותכנים שהמשתמש יוצר או מעלה</li>
            <li>הודעות שנשלחות דרך האפליקציה (כולל צ'אט)</li>
          </ul>

          <p className={classes.subheading}>ב. מידע הנאסף אוטומטית</p>
          <ul>
            <li>סוג מכשיר ומערכת הפעלה</li>
            <li>נתוני שימוש באפליקציה</li>
            <li>נתוני מערכת (כגון כתובת IP וזמני שימוש)</li>
          </ul>

          <p className={classes.subheading}>ג. שירותי צד שלישי</p>
          <p>
            האפליקציה משתמשת ב-Firebase לצורך אימות משתמשים, אחסון נתונים
            וניתוח שימוש. שירותים אלו עשויים לאסוף מידע בהתאם למדיניות שלהם.
          </p>
        </section>

        <section className={classes.section}>
          <h2>2. כיצד אנו משתמשים במידע</h2>
          <ul>
            <li>הפעלה ותחזוקה של האפליקציה</li>
            <li>שיפור חוויית המשתמש</li>
            <li>שמירת מתכונים ותכנים</li>
            <li>מתן תשובות מבוססות בינה מלאכותית</li>
            <li>תקשורת עם המשתמשים במידת הצורך</li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>3. תוכן משתמשים</h2>
          <p>
            תוכן שהמשתמש מעלה (כגון מתכונים, הערות או תמונות) עשוי להיות
            מוצג באפליקציה. האחריות לתוכן היא של המשתמש בלבד.
          </p>
        </section>

        <section className={classes.section}>
          <h2>4. שימוש בבינה מלאכותית</h2>
          <p>
            האפליקציה כוללת תשובות מבוססות בינה מלאכותית. תשובות אלו הן
            לצורכי מידע כללי בלבד ואינן בהכרח מדויקות.
          </p>
        </section>

        <section className={classes.section}>
          <h2>5. שיתוף מידע</h2>
          <p>אין אנו מוכרים מידע אישי. ייתכן שנשתף מידע רק במקרים הבאים:</p>
          <ul>
            <li>עם ספקי שירות (כגון Firebase)</li>
            <li>כאשר נדרש על פי חוק</li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>6. שמירת מידע</h2>
          <p>
            המידע נשמר כל עוד החשבון פעיל או לפי הצורך להפעלת השירות.
          </p>
        </section>

        <section className={classes.section}>
          <h2>7. אבטחת מידע</h2>
          <p>
            אנו נוקטים באמצעים סבירים להגנה על המידע, אך אין מערכת מאובטחת
            לחלוטין.
          </p>
        </section>

        <section className={classes.section}>
          <h2>8. זכויות המשתמש</h2>
          <ul>
            <li>לבקש גישה למידע האישי שלך</li>
            <li>לבקש מחיקת חשבון וכל הנתונים הקשורים אליו</li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>9. פרטיות ילדים</h2>
          <p>
            CookiPal אינה מיועדת לילדים מתחת לגיל 13. אין אנו אוספים ביודעין
            מידע אישי מילדים.
          </p>
        </section>

        <section className={classes.section}>
          <h2>10. שינויים במדיניות</h2>
          <p>
            אנו רשאים לעדכן מדיניות זו מעת לעת. שינויים יפורסמו בכתובת זו עם
            תאריך עדכון.
          </p>
        </section>

        <section className={classes.section}>
          <h2>11. יצירת קשר</h2>
          <p>
            לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו:{" "}
            <a href="mailto:ortania@gmail.com" className={classes.email}>
              ortania@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
