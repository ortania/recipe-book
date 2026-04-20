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
        <p className={classes.date}>עודכן לאחרונה: אפריל 2025</p>

        <p className={classes.intro}>
          CookiPal מחויבת להגנה על פרטיותך. מדיניות זו מסבירה אילו מידע אנו
          אוספים, כיצד אנו משתמשים בו ואיך אנו שומרים עליו.
        </p>

        <section className={classes.section}>
          <h2>1. המידע שאנו אוספים</h2>
          <ul>
            <li>
              <strong>פרטי חשבון:</strong> שם וכתובת אימייל בעת הרשמה באמצעות
              דוא"ל או Google.
            </li>
            <li>
              <strong>נתוני מתכונים:</strong> המתכונים שאת/ה יוצר/ת, עורכ/ת או
              מייבא/ת לאפליקציה.
            </li>
            <li>
              <strong>נתוני שימוש:</strong> ספירת שימוש בתכונות לניהול מגבלות
              המשתמש החינמי.
            </li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>2. כיצד אנו משתמשים במידע</h2>
          <ul>
            <li>לספק ולהפעיל את שירות CookiPal.</li>
            <li>לזהות את החשבון שלך ולסנכרן נתונים בין מכשירים.</li>
            <li>לאכוף מגבלות שימוש במסלול החינמי.</li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>3. אחסון נתונים</h2>
          <p>
            הנתונים שלך מאוחסנים בצורה מאובטחת באמצעות Google Firebase
            (Firestore ו-Firebase Authentication). אנו לא מוכרים ולא משתפים את
            המידע האישי שלך עם צדדים שלישיים.
          </p>
        </section>

        <section className={classes.section}>
          <h2>4. התחברות עם Google</h2>
          <p>
            אם נכנסת עם חשבון Google, אנו מקבלים את שמך וכתובת האימייל בלבד.
            אנו לא מקבלים ולא שומרים את סיסמת Google שלך.
          </p>
        </section>

        <section className={classes.section}>
          <h2>5. שמירת נתונים</h2>
          <p>
            הנתונים שלך נשמרים כל עוד החשבון פעיל. ניתן לבקש מחיקת החשבון וכל
            המידע הקשור אליו על ידי פנייה אלינו.
          </p>
        </section>

        <section className={classes.section}>
          <h2>6. פרטיות ילדים</h2>
          <p>
            CookiPal אינה מיועדת לילדים מתחת לגיל 13. אנו לא אוספים ביודעין
            מידע אישי מילדים.
          </p>
        </section>

        <section className={classes.section}>
          <h2>7. שינויים במדיניות</h2>
          <p>
            אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. שינויים יפורסמו בכתובת
            זו עם תאריך עדכון.
          </p>
        </section>

        <section className={classes.section}>
          <h2>8. יצירת קשר</h2>
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
