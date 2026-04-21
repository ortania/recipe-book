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
            האפליקציה ניתנת לשימוש כפי שהיא וכפי שזמינה מעת לעת, ללא
            התחייבות לזמינות רציפה, היעדר תקלות או התאמה למטרה מסוימת. אין
            התחייבות לדיוק של מתכונים, ערכים תזונתיים או תוכן אחר.
          </p>
        </section>

        <section className={classes.section}>
          <h2>2. שימוש אסור</h2>
          <p>
            אין להשתמש באפליקציה לכל מטרה בלתי חוקית, פוגענית או מטעה. בכלל
            זה אין לבצע פעולות שיש בהן כדי לשבש את השירות, לגשת לחלקים
            שאינם מורשים, להפר זכויות יוצרים או זכויות של אחרים, או להעלות
            תוכן אסור על פי דין.
          </p>
        </section>

        <section className={classes.section}>
          <h2>3. תוכן משתמשים</h2>
          <p>
            משתמשים רשאים להעלות תכנים כגון מתכונים. בהעלאת תוכן, המשתמש
            מצהיר כי יש לו את הזכויות הנדרשות בתוכן וכי התוכן אינו מפר
            זכויות יוצרים, תנאי שימוש אלו, חוק כלשהו, ואינו פוגע בשירות או
            במשתמשים אחרים.
          </p>
          <p>
            בהעלאת תוכן, המשתמש מעניק לאפליקציה רישיון מוגבל, לא בלעדי וללא
            תמלוגים, לצורך תפעול, אחסון, הצגה ומתן השירות בלבד.
          </p>
          <p>
            האפליקציה רשאית להסיר, להסתיר או להגביל גישה לכל תוכן אשר מפר
            תנאים אלו, את הוראות הדין, זכויות של אחרים, או אשר עלול להיות
            פוגעני, מטעה או מזיק לשירות או למשתמשים אחרים.
          </p>
          <p>
            האפליקציה עשויה לאפשר למשתמשים לדווח על תוכן או משתמשים המפרים
            תנאים אלו. האפליקציה רשאית לבדוק דיווחים, להסיר תוכן, להגביל
            חשיפה לתוכן, או לחסום, להשעות או להסיר משתמשים, לפי שיקול דעתה.
          </p>
        </section>

        <section className={classes.section}>
          <h2>4. חשבונות משתמש</h2>
          <p>
            המשתמש אחראי לשמירה על פרטי ההתחברות שלו ועל כל פעילות המתבצעת
            תחת חשבונו. האפליקציה רשאית לחסום, להשעות או להסיר משתמשים המפרים תנאים
            אלו.
          </p>
        </section>

        <section className={classes.section}>
          <h2>5. זכויות יוצרים</h2>
          <p>
            כל הזכויות באפליקציה, כולל קוד, עיצוב ותוכן מקורי, שייכות לבעלת
            האפליקציה. אין להעתיק, לשכפל או להפיץ ללא אישור מפורש.
          </p>
        </section>

        <section className={classes.section}>
          <h2>6. בינה מלאכותית</h2>
          <p>
            תשובות מבוססות בינה מלאכותית עשויות להיות שגויות, חלקיות או לא
            מעודכנות. תשובות אלו מיועדות לצורכי מידע והשראה בלבד ואינן
            מהוות ייעוץ מקצועי, רפואי או תזונתי. המשתמש אחראי להפעיל שיקול
            דעת עצמאי לפני הסתמכות על כל תשובה.
          </p>
        </section>

        <section className={classes.section}>
          <h2>7. הגבלת אחריות</h2>
          <p>
            האפליקציה לא תהיה אחראית לכל נזק הנובע מהשימוש בה, לרבות תוצאות
            בישול, תגובות אלרגיות, שימוש במידע תזונתי, אי זמינות של השירות,
            אובדן נתונים או תוכן, טעויות, השמטות והפסקות בשירות, וכן כל נזק
            ישיר או עקיף אחר.
          </p>
        </section>

        <section className={classes.section}>
          <h2>8. שינויים בשירות</h2>
          <p>
            האפליקציה רשאית בכל עת לשנות, להוסיף או להסיר תכונות ושירותים,
            לרבות הוספת שירותים בתשלום, הכל לפי שיקול דעתה.
          </p>
        </section>

        <section className={classes.section}>
          <h2>9. עדכון תנאים</h2>
          <p>
            תנאי שימוש אלו עשויים להתעדכן מעת לעת. תאריך העדכון האחרון יופיע
            בראש המסמך. המשך השימוש באפליקציה לאחר עדכון התנאים מהווה הסכמה
            לנוסח המעודכן.
          </p>
        </section>

        <section className={classes.section}>
          <h2>10. שירותים בתשלום (אם יהיו)</h2>
          <p>
            ייתכן ויוצעו שירותים בתשלום בעתיד. התנאים יוצגו למשתמשים בעת
            הרכישה.
          </p>
        </section>

        <section className={classes.section}>
          <h2>11. דין חל</h2>
          <p>תנאים אלו כפופים לדיני מדינת ישראל.</p>
        </section>

        <section className={classes.section}>
          <h2>12. יצירת קשר</h2>
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
