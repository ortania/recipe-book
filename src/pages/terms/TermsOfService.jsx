import React from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../../components/controls/back-button";
import classes from "./terms-of-service.module.css";

function TermsOfService() {
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

        <h1 className={classes.title}>תנאי שימוש</h1>
        <p className={classes.date}>עודכן לאחרונה: אפריל 2026</p>

        <p className={classes.intro}>
          השימוש באפליקציה CookiPal מהווה הסכמה לתנאים הבאים.
        </p>

        <section className={classes.section}>
          <h2>1. שימוש באפליקציה</h2>
          <p>
            האפליקציה ניתנת לשימוש כפי שהיא (AS IS), ללא אחריות מכל סוג. אין
            התחייבות לדיוק של מתכונים, ערכים תזונתיים או תוכן אחר.
          </p>
        </section>

        <section className={classes.section}>
          <h2>2. תוכן משתמשים</h2>
          <p>משתמשים רשאים להעלות תכנים כגון מתכונים. המשתמש מתחייב כי:</p>
          <ul>
            <li>יש לו זכויות בתוכן שהעלה</li>
            <li>התוכן אינו מפר זכויות יוצרים או חוק</li>
          </ul>
          <p>
            בהעלאת תוכן, המשתמש מעניק לאפליקציה רישיון להשתמש, לאחסן ולהציג
            את התוכן במסגרת השירות.
          </p>
        </section>

        <section className={classes.section}>
          <h2>3. זכויות יוצרים</h2>
          <p>
            כל הזכויות באפליקציה, כולל קוד, עיצוב ותוכן מקורי, שייכות לבעלת
            האפליקציה. אין להעתיק, לשכפל או להפיץ ללא אישור מפורש.
          </p>
        </section>

        <section className={classes.section}>
          <h2>4. בינה מלאכותית</h2>
          <p>
            תשובות מבוססות בינה מלאכותית הן לצורכי מידע בלבד ואינן מהוות
            ייעוץ מקצועי.
          </p>
        </section>

        <section className={classes.section}>
          <h2>5. הגבלת אחריות</h2>
          <p>
            האפליקציה לא תהיה אחראית לכל נזק הנובע מהשימוש בה, לרבות:
          </p>
          <ul>
            <li>תוצאות בישול</li>
            <li>תגובות אלרגיות</li>
            <li>שימוש במידע תזונתי</li>
            <li>כל נזק ישיר או עקיף</li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>6. שינויים בשירות</h2>
          <p>האפליקציה רשאית:</p>
          <ul>
            <li>לשנות פיצ'רים</li>
            <li>להוסיף שירותים בתשלום</li>
            <li>להסיר פונקציות קיימות</li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>7. חשבונות משתמש</h2>
          <p>
            האפליקציה רשאית לחסום או להסיר משתמשים המפרים תנאים אלו.
          </p>
        </section>

        <section className={classes.section}>
          <h2>8. שירותים בתשלום (אם יהיו)</h2>
          <p>
            ייתכן ויוצעו שירותים בתשלום בעתיד. התנאים יוצגו למשתמשים בעת
            הרכישה.
          </p>
        </section>

        <section className={classes.section}>
          <h2>9. דין חל</h2>
          <p>תנאים אלו כפופים לדין המקומי החל.</p>
        </section>

        <section className={classes.section}>
          <h2>10. יצירת קשר</h2>
          <p>
            לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו:{" "}
            <a href="mailto:ortania@gmail.com" className={classes.email}>
              ortania@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfService;
