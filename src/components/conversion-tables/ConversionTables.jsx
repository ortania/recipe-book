import { useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import classes from "./conversion-tables.module.css";

function ConversionTables() {
  const [activeTab, setActiveTab] = useState("cups");
  const [searchQuery, setSearchQuery] = useState("");

  const conversions = {
    cups: [
      { item: "כוס קמח מלא (רגיל או תופח)", amount: "140 גרם" },
      { item: "כוס קמח מלא", amount: "125 גרם" },
      { item: "כוס סוכר", amount: "200 גרם" },
      { item: "כוס סוכר חום דחוס", amount: "225 גרם" },
      { item: "כוס חמאה", amount: "230 גרם" },
      { item: "כוס אבקת סוכר", amount: "120 גרם" },
      { item: "כוס אגוזים טחונים", amount: "110 גרם" },
      { item: "כוס אגוזים קצוצים", amount: "100 גרם" },
      { item: "כוס אורז ארוך", amount: "200 גרם" },
      { item: "כוס אורז קצר", amount: "210 גרם" },
      { item: "כוס דבש / סירופ מייפל", amount: "320 גרם" },
      { item: "כוס ריבה", amount: "320 גרם" },
      { item: "כוס חמאת בוטנים", amount: "280 גרם" },
      { item: "כוס מלח", amount: "290 גרם" },
      { item: "כוס פירות יבשים קצוצים", amount: "150 גרם" },
      { item: "כוס פירורי לחם", amount: "125 גרם" },
      { item: "כוס פירורי עוגיות", amount: "110 גרם" },
      { item: "כוס צימוקים", amount: "140 גרם" },
      { item: "כוס קוקוס טחון", amount: "70 גרם" },
      { item: "כוס קורנפלור", amount: "140 גרם" },
      { item: "כוס קקאו", amount: "140 גרם" },
      { item: "כוס שוקולד צ'יפס", amount: "200 גרם" },
      { item: "כוס שיבולת שועל", amount: "100 גרם" },
      { item: "כוס שמן", amount: "200 גרם" },
    ],
    spoons: [
      { item: "כף קמח", amount: "10 גרם" },
      { item: "כף סוכר", amount: "12 גרם" },
      { item: "כף מלח", amount: "18 גרם" },
      { item: "כף שמרים יבשים", amount: "10 גרם" },
      { item: "כף חמאה", amount: "15 גרם" },
      { item: "כף אבקת אפייה / אבקת סוכר", amount: "10 גרם" },
      { item: "כף אגוזים/שקדים קצוצים", amount: "6 גרם" },
      { item: "כף אבקת ג'לטין", amount: "10 גרם" },
      { item: "כף דבש", amount: "22 גרם" },
      { item: "כף סודה לשתייה", amount: "10 גרם" },
      { item: "כף קורנפלור", amount: "10 גרם" },
    ],
    teaspoons: [
      { item: "כפית אבקת אפייה / אבקת סוכר", amount: "3 גרם" },
      { item: "כפית מלח", amount: "6 גרם" },
      { item: "כפית סודה לשתייה", amount: "3 גרם" },
      { item: "כפית סוכר", amount: "4 גרם" },
      { item: "כפית גדושה סוכר חום", amount: "5 גרם" },
      { item: "כפית קמח", amount: "3 גרם" },
    ],
    temperature: [
      { celsius: "105", fahrenheit: "225", heat: "חום נמוך מאוד" },
      { celsius: "120", fahrenheit: "250", heat: "חום נמוך מאוד" },
      { celsius: "135", fahrenheit: "275", heat: "חום נמוך מאוד" },
      { celsius: "150", fahrenheit: "300", heat: "חום נמוך" },
      { celsius: "160", fahrenheit: "325", heat: "חום בינוני-נמוך" },
      { celsius: "175", fahrenheit: "350", heat: "חום בינוני" },
      { celsius: "180", fahrenheit: "356", heat: "חום בינוני" },
      { celsius: "190", fahrenheit: "375", heat: "חום בינוני-גבוה" },
      { celsius: "205", fahrenheit: "400", heat: "חום גבוה" },
      { celsius: "220", fahrenheit: "425", heat: "חום גבוה" },
      { celsius: "230", fahrenheit: "450", heat: "חום גבוה מאוד" },
      { celsius: "245", fahrenheit: "475", heat: "חום גבוה מאוד" },
    ],
    pans: [
      { from: "מקוטר 22 ל-24", change: "20%+" },
      { from: "מקוטר 22 ל-26", change: "40%+" },
      { from: "מקוטר 22 ל-28", change: "60%+" },
      { from: "מקוטר 26 ל-24", change: "15%-" },
      { from: "מקוטר 26 ל-22", change: "30%-" },
      { from: "מקוטר 28 ל-22", change: "40%-" },
    ],
    universal: [
      { item: "1 כוס", amount: '240 מ"ל' },
      { item: "1 כף", amount: '15 מ"ל' },
      { item: "1 כפית", amount: '5 מ"ל' },
      { item: "1 כף", amount: "3 כפיות" },
      { item: "1 כוס", amount: "16 כפות" },
    ],
    eggs: [
      { item: "ביצה בגודל M", amount: "53-62 גרם" },
      { item: "ביצה בגודל L", amount: "63-72 גרם" },
      { item: "ביצה בגודל XL", amount: "73 גרם" },
      { item: "חלבון ביצה בגודל M", amount: "25-30 גרם" },
      { item: "חלבון ביצה בגודל L", amount: "30-35 גרם" },
      { item: "חלבון ביצה בגודל XL", amount: "40-45 גרם" },
    ],
    general: [
      { item: "1 כוס קמח תופח", amount: "1 כוס קמח רגיל + כפית אבקת אפייה" },
      {
        item: "1 קילו קמח תופח",
        amount: "1 קילו קמח רגיל + 2 שקיות אבקת אפייה (10 גרם כל אחת)",
      },
      {
        item: "שקית שמרים טריים (50 גרם)",
        amount: "קצת פחות מ-2 כפות שמרים יבשים (17 גרם)",
      },
      { item: "100 גרם חמאה", amount: "85 גרם שמן" },
    ],
    faq: [
      {
        question: "כמה כוסות הן חצי קילו קמח (500 גרם)?",
        answer: "3 כוסות וחצי + כף קמח",
      },
      { question: "כמה כוסות הן קילו אורז?", answer: "5 כוסות" },
      {
        question: "כמה כוסות הן 200 גרם קמח?",
        answer: "כוס וחצי קמח מינוס כף",
      },
    ],
  };

  const tabs = [
    { id: "cups", label: "כוסות", icon: "🥤" },
    { id: "spoons", label: "כפות", icon: "🥄" },
    { id: "teaspoons", label: "כפיות", icon: "🥄" },
    { id: "temperature", label: "טמפרטורה", icon: "🌡️" },
    { id: "pans", label: "תבניות", icon: "🍰" },
    { id: "universal", label: "סט אוניברסלי", icon: "📏" },
    { id: "eggs", label: "ביצים", icon: "🥚" },
    { id: "general", label: "המרות כלליות", icon: "📋" },
    { id: "faq", label: "שאלות נפוצות", icon: "❓" },
  ];

  // Filter conversions based on search query
  const filteredConversions = useMemo(() => {
    if (!searchQuery.trim()) return conversions;

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.keys(conversions).forEach((key) => {
      if (key === "temperature") {
        filtered[key] = conversions[key].filter(
          (item) =>
            item.celsius.includes(query) ||
            item.fahrenheit.includes(query) ||
            item.heat.toLowerCase().includes(query),
        );
      } else if (key === "pans") {
        filtered[key] = conversions[key].filter(
          (item) =>
            item.from.toLowerCase().includes(query) ||
            item.change.toLowerCase().includes(query),
        );
      } else if (key === "faq") {
        filtered[key] = conversions[key].filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query),
        );
      } else {
        filtered[key] = conversions[key].filter(
          (item) =>
            item.item.toLowerCase().includes(query) ||
            item.amount.toLowerCase().includes(query),
        );
      }
    });

    return filtered;
  }, [searchQuery, conversions]);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1>טבלת המרות למטבח</h1>
        <p className={classes.subtitle}>
          המרת מידות אפייה ובישול - כל המידע שאתם צריכים במקום אחד
        </p>
        {/* <p className={classes.intro}>
          המרת מידות אפייה לפעמים חשובה לא פחות ממתכון טוב: איך ממירים פרנהייט
          לצלזיוס? כמה כוסות הן חצי קילו קמח? וכמה זה 100 גרם סוכר? הנה כל
          התשובות
        </p> */}

        <div className={classes.searchContainer}>
          <IoSearch className={classes.searchIcon} />
          <input
            type="text"
            placeholder="חפש המרה... (לדוגמה: קמח, סוכר, 200 גרם)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={classes.searchInput}
          />
          {searchQuery && (
            <button
              className={classes.clearSearch}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={classes.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${classes.tab} ${activeTab === tab.id ? classes.activeTab : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={classes.tabIcon}>{tab.icon}</span>
            <span className={classes.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={classes.content}>
        {filteredConversions[activeTab]?.length === 0 ? (
          <div className={classes.noResults}>
            לא נמצאו תוצאות עבור "{searchQuery}"
          </div>
        ) : activeTab === "temperature" ? (
          <div className={classes.temperatureTable}>
            <div className={classes.tableHeader}>
              <div>צלזיוס</div>
              <div>פרנהייט</div>
              <div>רמת חום</div>
            </div>
            {filteredConversions.temperature.map((temp, index) => (
              <div key={index} className={classes.tableRow}>
                <div>{temp.celsius}°C</div>
                <div>{temp.fahrenheit}°F</div>
                <div>{temp.heat}</div>
              </div>
            ))}
          </div>
        ) : activeTab === "pans" ? (
          <div className={classes.simpleList}>
            {filteredConversions.pans.map((pan, index) => (
              <div key={index} className={classes.listItem}>
                <span className={classes.itemName}>{pan.from}</span>
                <span className={classes.itemAmount}>{pan.change}</span>
              </div>
            ))}
            <div className={classes.note}>
              <strong>נוסחה להגדלת תבנית:</strong> מחלקים את הקוטר של התבנית
              הגדולה בקוטר של התבנית הקטנה, ואת התוצאה מעלים בחזקת 2.
              <br />
              <br />
              <strong>דוגמה:</strong> אם רוצים להמיר מידות מתבנית 24 ל-26,
              החישוב הוא (26÷24) בחזקת 2. התוצאה היא 1.17 – ולכן יש לכפול את כל
              הכמויות ב-1.17. התוצאות למעלה עוגלו.
            </div>
          </div>
        ) : activeTab === "faq" ? (
          <div className={classes.faqList}>
            {filteredConversions.faq.map((item, index) => (
              <div key={index} className={classes.faqItem}>
                <div className={classes.question}>{item.question}</div>
                <div className={classes.answer}>{item.answer}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={classes.simpleList}>
            {filteredConversions[activeTab].map((item, index) => (
              <div key={index} className={classes.listItem}>
                <span className={classes.itemName}>{item.item}</span>
                <span className={classes.itemAmount}>{item.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversionTables;
