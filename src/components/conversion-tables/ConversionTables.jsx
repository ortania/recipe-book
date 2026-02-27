import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context";
import { SearchBox } from "../controls/search";
import {
  CupSoda,
  Utensils,
  Pipette,
  Thermometer,
  Cake,
  Ruler,
  Egg,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import conversionData from "./conversionData";
import classes from "./conversion-tables.module.css";

const MOBILE_BREAKPOINT = 768;

function ConversionTables() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("cups");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTabsEl, setMobileTabsEl] = useState(null);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => {
      setIsMobile(mql.matches);
      setMobileTabsEl(
        mql.matches ? document.getElementById("mobile-tabs-portal") : null,
      );
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const conversions = conversionData[language] || conversionData.he;

  const tabs = [
    { id: "cups", label: t("conversions", "tabCups"), icon: CupSoda },
    { id: "spoons", label: t("conversions", "tabSpoons"), icon: Utensils },
    { id: "teaspoons", label: t("conversions", "tabTeaspoons"), icon: Pipette },
    {
      id: "temperature",
      label: t("conversions", "tabTemperature"),
      icon: Thermometer,
    },
    { id: "pans", label: t("conversions", "tabPans"), icon: Cake },
    { id: "universal", label: t("conversions", "tabUniversal"), icon: Ruler },
    { id: "eggs", label: t("conversions", "tabEggs"), icon: Egg },
    {
      id: "general",
      label: t("conversions", "tabGeneral"),
      icon: ClipboardList,
    },
    { id: "faq", label: t("conversions", "tabFaq"), icon: HelpCircle },
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

  const mobileTitle = (
    <span className={classes.mobileTitle}>{t("conversions", "title")}</span>
  );

  return (
    <div className={classes.container}>
      {mobileTabsEl && createPortal(mobileTitle, mobileTabsEl)}
      {!isMobile && (
        <div className={classes.header}>
          <h1>{t("conversions", "title")}</h1>
          <p className={classes.subtitle}>{t("conversions", "subtitle")}</p>
        </div>
      )}

      <div className={classes.stickyBar}>
        <div className={classes.searchContainer}>
          <SearchBox
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder={t("conversions", "searchPlaceholder")}
            size="large"
            className={classes.searchBoxWrap}
          />
        </div>

        <div className={classes.tabs}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${classes.tab} ${activeTab === tab.id ? classes.activeTab : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={classes.tabIcon}>
                  <Icon size={18} />
                </span>
                <span className={classes.tabLabel}>{tab.label}</span>
              </button>
            );
          })}
        </div>
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
