import { useState, useEffect } from "react";
import { applyFontScale } from "../../utils/applyFontScale";
import classes from "./settings.module.css";

const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.8;
const STEP = 0.1;

function Settings() {
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem("fontScale");
    return saved ? parseFloat(saved) : DEFAULT_SCALE;
  });

  useEffect(() => {
    applyFontScale(scale);
    localStorage.setItem("fontScale", scale.toString());
  }, [scale]);

  const handleReset = () => {
    setScale(DEFAULT_SCALE);
  };

  return (
    <div className={classes.settingsPage}>
      <h1 className={classes.title}>הגדרות</h1>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>
          <span className={classes.sectionIcon}>♿</span>
          נגישות
        </div>

        <div className={classes.fontSizeControl}>
          <div className={classes.fontSizeLabel}>גודל פונט</div>

          <div className={classes.fontSizeSlider}>
            <span className={classes.sliderLabel}>א</span>
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={STEP}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className={classes.slider}
            />
            <span className={classes.sliderLabelLarge}>א</span>
          </div>

          <div className={classes.scaleValue}>×{scale.toFixed(1)}</div>

          <div className={classes.previewBox}>
            <div className={classes.previewTitle}>תצוגה מקדימה:</div>
            <div className={classes.previewText}>
              טקסט לדוגמה - כך ייראה הטקסט באפליקציה
            </div>
          </div>

          {scale !== DEFAULT_SCALE && (
            <button className={classes.resetButton} onClick={handleReset}>
              איפוס לברירת מחדל (×1.0)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
