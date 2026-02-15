import { useState, useMemo } from "react";
import { useLanguage } from "../../context";
import { SearchBox } from "../controls/search";
import conversionData from "./conversionData";
import classes from "./conversion-tables.module.css";

function ConversionTables() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("cups");
  const [searchQuery, setSearchQuery] = useState("");

  const conversions = conversionData[language] || conversionData.he;

  const tabs = [
    { id: "cups", label: t("conversions", "tabCups"), icon: "🥤" },
    { id: "spoons", label: t("conversions", "tabSpoons"), icon: "🥄" },
    { id: "teaspoons", label: t("conversions", "tabTeaspoons"), icon: "🥄" },
    {
      id: "temperature",
      label: t("conversions", "tabTemperature"),
      icon: "🌡️",
    },
    { id: "pans", label: t("conversions", "tabPans"), icon: "🍰" },
    { id: "universal", label: t("conversions", "tabUniversal"), icon: "📏" },
    { id: "eggs", label: t("conversions", "tabEggs"), icon: "🥚" },
    { id: "general", label: t("conversions", "tabGeneral"), icon: "📋" },
    { id: "faq", label: t("conversions", "tabFaq"), icon: "❓" },
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
        <h1>{t("conversions", "title")}</h1>
        <p className={classes.subtitle}>{t("conversions", "subtitle")}</p>
        {/* <p className={classes.intro}>
          המרת מידות אפייה לפעמים חשובה לא פחות ממתכון טוב: איך ממירים פרנהייט
          לצלזיוס? כמה כוסות הן חצי קילו קמח? וכמה זה 100 גרם סוכר? הנה כל
          התשובות
        </p> */}

        <div className={classes.searchContainer}>
          <SearchBox
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder={t("conversions", "searchPlaceholder")}
            size="large"
            className={classes.searchBoxWrap}
          />
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
            {t("conversions", "noResults")} "{searchQuery}"
          </div>
        ) : activeTab === "temperature" ? (
          <div className={classes.temperatureTable}>
            <div className={classes.tableHeader}>
              <div>{t("conversions", "celsius")}</div>
              <div>{t("conversions", "fahrenheit")}</div>
              <div>{t("conversions", "heatLevel")}</div>
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
              <strong>{t("conversions", "panFormulaTitle")}</strong>{" "}
              {t("conversions", "panFormula")}
              <br />
              <br />
              <strong>{t("conversions", "panExampleTitle")}</strong>{" "}
              {t("conversions", "panExample")}
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
