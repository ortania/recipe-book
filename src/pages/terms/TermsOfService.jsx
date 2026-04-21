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
        <p className={classes.date}>עודכן לאחרונה: אפריל 2025</p>

        <p className={classes.intro}>
          השימוש באפליקציה CookiPal מהווה הסכמה לתנאים המפורטים להלן. אנא קרא
          אותם בעיון לפני השימוש.
        </p>

        <section className={classes.section}>
          <h2>1. השימוש באפליקציה</h2>
          <p>
            CookiPal מיועדת לשימוש אישי לניהול מתכונים. אין להשתמש באפליקציה
            למטרות מסחריות ללא אישור מפורש.
          </p>
        </section>

        <section className={classes.section}>
          <h2>2. תוכן מיובא — זכויות יוצרים</h2>
          <p>
            המשתמש אחראי באופן בלעדי לכל תוכן שהוא מייבא לאפליקציה, לרבות
            מתכונים מאתרים חיצוניים או תמונות. CookiPal אינה אחראית להפרת זכויות
            יוצרים על ידי המשתמש. יובא תוכן לשימוש אישי בלבד ואינו מופץ
            לציבור.
          </p>
        </section>

        <section className={classes.section}>
          <h2>3. חשבון המשתמש</h2>
          <p>
            המשתמש אחראי לשמור על סודיות פרטי ההתחברות שלו. יש להודיע לנו
            מיידית על כל שימוש לא מורשה בחשבונך.
          </p>
        </section>

        <section className={classes.section}>
          <h2>4. הגבלת אחריות</h2>
          <p>
            CookiPal מסופקת "כמות שהיא" (as-is). אין אנו מתחייבים לזמינות
            מתמדת של השירות. לא נישא באחריות לנזקים ישירים או עקיפים הנובעים
            מהשימוש באפליקציה.
          </p>
        </section>

        <section className={classes.section}>
          <h2>5. שינויים בתנאים</h2>
          <p>
            אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה בכל עת. המשך השימוש
            באפליקציה לאחר עדכון התנאים מהווה הסכמה לתנאים החדשים.
          </p>
        </section>

        <section className={classes.section}>
          <h2>6. יצירת קשר</h2>
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
