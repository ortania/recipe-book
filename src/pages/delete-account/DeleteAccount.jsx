import React from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../../components/controls/back-button";
import classes from "../privacy/privacy-policy.module.css";

function DeleteAccount() {
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

        <h1 className={classes.title}>מחיקת חשבון</h1>
        <p className={classes.date}>עודכן לאחרונה: אפריל 2026</p>

        <p className={classes.intro}>
          דף זה מיועד למשתמשי אפליקציית CookiPal המבקשים למחוק את חשבונם
          ואת הנתונים המשויכים אליו.
        </p>

        <section className={classes.section}>
          <h2>איך מבקשים מחיקה:</h2>
          <p>ניתן לבקש מחיקת חשבון באחת מהדרכים הבאות:</p>
          <ul>
            <li>
              <strong>דרך האפליקציה</strong> — כניסה להגדרות ובחירה באפשרות
              "מחיקת חשבון".
            </li>
            <li>
              <strong>באמצעות דוא"ל</strong> — פנייה לכתובת:{" "}
              <a href="mailto:ortania@gmail.com" className={classes.email}>
                ortania@gmail.com
              </a>
            </li>
          </ul>
        </section>

        <section className={classes.section}>
          <h2>מה קורה לאחר בקשת מחיקה</h2>
          <p>
            לאחר קבלת בקשת המחיקה, חשבון המשתמש והמידע האישי המשויך אליו
            יימחקו בתוך זמן סביר (בדרך כלל עד 30 ימים).
          </p>
        </section>

        <section className={classes.section}>
          <h2>מתכוני קהילה</h2>
          <p>
            אם שיתפת מתכונים לקהילה לפני מחיקת החשבון, מתכונים אלה עשויים
            להישאר זמינים באפליקציה גם לאחר המחיקה, לצורך שמירה על פעילות
            הקהילה.
          </p>
          <p>
            מתכונים אלו יוצגו ללא פרטי זיהוי אישיים (באופן אנונימי), ולא
            ניתן יהיה לקשר בינם לבין זהותך.
          </p>
        </section>

        <section className={classes.section}>
          <h2>מידע שעשוי להישמר זמנית</h2>
          <p>
            ייתכן שחלק מהמידע יישמר לפרק זמן מוגבל לצורכי אבטחה, מניעת הונאה
            או בהתאם לדרישות חוקיות, ולאחר מכן יימחק או יעבור אנונימיזציה.
          </p>
        </section>

        <section className={classes.section}>
          <h2>יצירת קשר</h2>
          <p>
            לשאלות נוספות או לבקשת מחיקת חשבון, ניתן לפנות לכתובת:{" "}
            <a href="mailto:ortania@gmail.com" className={classes.email}>
              ortania@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default DeleteAccount;
