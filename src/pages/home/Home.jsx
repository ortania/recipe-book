import React, { useState, useEffect, useRef } from "react";
import { FaUserFriends, FaUsers, FaSearch } from "react-icons/fa";
import { PiArrowFatLineUp } from "react-icons/pi";
import { useRecipeBook, useLanguage } from "../../context";
import { UpButton } from "../../components";
import { Button } from "../../components/controls/button";

import { scrollToTop } from "../utils";

import circleImg from "../../assets/images/circle.svg";
import squareImg from "../../assets/images/square.svg";
import triangleImg from "../../assets/images/triangle.svg";

import pageClasses from "../page.module.css";
import classes from "./home.module.css";

function Home() {
  const {} = useRecipeBook();
  const { t } = useLanguage();
  const [typedTitle, setTypedTitle] = useState("");
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [visibleFeatures, setVisibleFeatures] = useState([false, false, false]);
  const [showCta, setShowCta] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const [iconColors, setIconColors] = useState([
    "#2196f3",
    "#2196f3",
    "#2196f3",
  ]);
  const [floatingShapes, setFloatingShapes] = useState([]);

  const fullTitle = t("home", "welcome");
  const featuresRef = useRef(null);
  const containerRef = useRef(null);

  // Typing animation effect
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullTitle.length) {
        setTypedTitle(fullTitle.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setShowSubtitle(true);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  // Staggered fade-in effect for features
  useEffect(() => {
    if (showSubtitle) {
      const featureTimers = [];

      // Show features one by one with a delay
      for (let i = 0; i < 3; i++) {
        const timer = setTimeout(
          () => {
            setVisibleFeatures((prev) => {
              const newState = [...prev];
              newState[i] = true;
              return newState;
            });

            // Show CTA after all features are visible
            if (i === 2) {
              setTimeout(() => setShowCta(true), 400);
            }
          },
          300 * (i + 1),
        );

        featureTimers.push(timer);
      }

      return () => featureTimers.forEach((timer) => clearTimeout(timer));
    }
  }, [showSubtitle]);

  // Scroll animation for features
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Add animation class when features are in view
          if (featuresRef.current) {
            featuresRef.current.classList.add(classes.animateFeatures);
          }
        }
      },
      { threshold: 0.3 },
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  // Interactive background effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const { left, top, width, height } =
        containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;

      setBackgroundPosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Cycling icon colors effect
  useEffect(() => {
    const colors = [
      ["#2196f3", "#4caf50", "#ff9800"], // Blue, Green, Orange
      ["#9c27b0", "#2196f3", "#e91e63"], // Purple, Blue, Pink
      ["#00bcd4", "#ff5722", "#3f51b5"], // Cyan, Deep Orange, Indigo
    ];

    let colorIndex = 0;
    const colorInterval = setInterval(() => {
      setIconColors(colors[colorIndex]);
      colorIndex = (colorIndex + 1) % colors.length;
    }, 5000);

    return () => clearInterval(colorInterval);
  }, []);

  // Floating shapes animation
  useEffect(() => {
    if (!containerRef.current) return;

    // Generate initial shapes
    const generateShapes = () => {
      const shapes = [];
      const shapeImages = [circleImg, squareImg, triangleImg];
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      for (let i = 0; i < 12; i++) {
        const size = Math.floor(Math.random() * 40) + 20; // 20-60px
        shapes.push({
          id: `shape-${i}`,
          image: shapeImages[i % 3],
          x: Math.random() * (containerWidth - size),
          y: Math.random() * (containerHeight - size),
          size: size,
          rotation: Math.random() * 360,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          rotationSpeed: (Math.random() - 0.5) * 0.5,
        });
      }

      return shapes;
    };

    // Set initial shapes
    setFloatingShapes(generateShapes());

    // Animation frame for moving shapes
    let animationFrameId;
    const animateShapes = () => {
      setFloatingShapes((prevShapes) => {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        return prevShapes.map((shape) => {
          let newX = shape.x + shape.speedX;
          let newY = shape.y + shape.speedY;
          let newRotation = shape.rotation + shape.rotationSpeed;

          // Bounce off edges
          if (newX <= 0 || newX >= containerWidth - shape.size) {
            shape.speedX *= -1;
            newX = shape.x + shape.speedX;
          }

          if (newY <= 0 || newY >= containerHeight - shape.size) {
            shape.speedY *= -1;
            newY = shape.y + shape.speedY;
          }

          return {
            ...shape,
            x: newX,
            y: newY,
            rotation: newRotation,
          };
        });
      });

      animationFrameId = requestAnimationFrame(animateShapes);
    };

    animationFrameId = requestAnimationFrame(animateShapes);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const containerStyle = {
    background: `radial-gradient(circle at ${backgroundPosition.x}% ${backgroundPosition.y}%, 
                rgba(33, 150, 243, 0.15), 
                rgba(33, 150, 243, 0.05))`,
  };

  return (
    <div
      className={classes.container}
      style={containerStyle}
      ref={containerRef}
    >
      {/* Floating shapes */}
      {floatingShapes.map((shape) => (
        <img
          key={shape.id}
          src={shape.image}
          className={classes.floatingShape}
          style={{
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            left: `${shape.x}px`,
            top: `${shape.y}px`,
            transform: `rotate(${shape.rotation}deg)`,
          }}
          alt=""
        />
      ))}

      <div className={classes.content}>
        <p className={`${classes.title} ${classes.typingAnimation}`}>
          {typedTitle}
          <span className={classes.cursor}></span>
        </p>

        <p
          className={`${classes.subtitle} ${
            showSubtitle ? classes.fadeIn : classes.hidden
          }`}
        >
          {t("home", "subtitle")}
        </p>

        <div className={classes.features} ref={featuresRef}>
          <div
            className={`${classes.feature} ${
              visibleFeatures[0] ? classes.fadeIn : classes.hidden
            }`}
          >
            <div
              className={classes.featureIcon}
              style={{ color: iconColors[0] }}
            >
              <FaUserFriends />
            </div>
            <h3 className={classes.featureTitle}>
              {t("home", "recipeManagement")}
            </h3>
            <p className={classes.featureDescription}>
              {t("home", "recipeManagementDesc")}
            </p>
          </div>

          <div
            className={`${classes.feature} ${
              visibleFeatures[1] ? classes.fadeIn : classes.hidden
            }`}
          >
            <div
              className={classes.featureIcon}
              style={{ color: iconColors[1] }}
            >
              <FaUsers />
            </div>
            <h3 className={classes.featureTitle}>
              {t("home", "categoryOrganization")}
            </h3>
            <p className={classes.featureDescription}>
              {t("home", "categoryOrganizationDesc")}
            </p>
          </div>

          <div
            className={`${classes.feature} ${
              visibleFeatures[2] ? classes.fadeIn : classes.hidden
            }`}
          >
            <div
              className={classes.featureIcon}
              style={{ color: iconColors[2] }}
            >
              <FaSearch />
            </div>
            <h3 className={classes.featureTitle}>{t("home", "quickSearch")}</h3>
            <p className={classes.featureDescription}>
              {t("home", "quickSearchDesc")}
            </p>
          </div>
        </div>

        <div
          className={`${classes.cta} ${
            showCta ? classes.fadeIn : classes.hidden
          }`}
        >
          <Button className={classes.ctaButton} variant="primary">
            {t("home", "getStarted")}
          </Button>
        </div>
      </div>
      <UpButton onClick={scrollToTop} title="Scroll to top">
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default Home;
