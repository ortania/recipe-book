import { ChevronLeft, ChevronRight } from "lucide-react";
import { CloseButton } from "../../controls/close-button";
import { useRecipeDetails } from "../RecipeDetailsContext";
import recipePlaceholder from "../../../assets/recipe-placeholder.png";

export default function RecipeImageSection() {
  const {
    allImages, activeImageIndex, setActiveImageIndex,
    showImageLightbox, setShowImageLightbox,
    imageTouchRef, recipe, classes, t,
  } = useRecipeDetails();

  return (
    <>
      {allImages.length > 0 ? (
        <div
          className={`${classes.imageContainer} ${classes.imageContainerWithFallback}`}
          onTouchStart={(e) => {
            if (allImages.length <= 1) return;
            const tag = e.target.closest("button, a, [role='button']");
            if (tag) {
              imageTouchRef.current.swiping = false;
              imageTouchRef.current.ignore = true;
              return;
            }
            imageTouchRef.current.ignore = false;
            imageTouchRef.current.startX = e.touches[0].clientX;
            imageTouchRef.current.startY = e.touches[0].clientY;
            imageTouchRef.current.swiping = false;
          }}
          onTouchMove={(e) => {
            if (allImages.length <= 1 || imageTouchRef.current.ignore) return;
            const dx = Math.abs(
              e.touches[0].clientX - imageTouchRef.current.startX,
            );
            const dy = Math.abs(
              e.touches[0].clientY - imageTouchRef.current.startY,
            );
            if (dx > 10 && dx > dy) {
              imageTouchRef.current.swiping = true;
              e.preventDefault();
            }
          }}
          onTouchEnd={(e) => {
            if (
              allImages.length <= 1 ||
              imageTouchRef.current.ignore ||
              !imageTouchRef.current.swiping
            )
              return;
            const dx =
              e.changedTouches[0].clientX - imageTouchRef.current.startX;
            if (Math.abs(dx) > 40) {
              if (dx < 0 && activeImageIndex < allImages.length - 1) {
                setActiveImageIndex((i) => i + 1);
              } else if (dx > 0 && activeImageIndex > 0) {
                setActiveImageIndex((i) => i - 1);
              }
            }
          }}
        >
          <div className={classes.noImagePlaceholder}>
            <img
              src={recipePlaceholder}
              alt=""
              className={classes.noImagePlaceholderImg}
              aria-hidden="true"
            />
          </div>
          <img
            src={allImages[activeImageIndex]}
            alt={recipe.name}
            className={classes.recipeImage}
            loading="lazy"
            onClick={() => setShowImageLightbox(true)}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          {allImages.length > 1 && (
            <>
              <button
                className={`${classes.imageNav} ${classes.imageNavPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => i - 1);
                }}
                disabled={activeImageIndex === 0}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                className={`${classes.imageNav} ${classes.imageNavNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => i + 1);
                }}
                disabled={activeImageIndex === allImages.length - 1}
              >
                <ChevronRight size={22} />
              </button>
              <div className={classes.imageDots}>
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    className={`${classes.imageDot} ${i === activeImageIndex ? classes.imageDotActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                  />
                ))}
              </div>
              <span className={classes.imageCounter}>
                {activeImageIndex + 1}/{allImages.length}
              </span>
            </>
          )}
        </div>
      ) : (
        <div className={classes.noImageStandalone}>
          <img
            src={recipePlaceholder}
            alt=""
            className={classes.noImagePlaceholderImg}
            aria-hidden="true"
          />
        </div>
      )}

      {showImageLightbox && allImages.length > 0 && (
        <div
          className={classes.lightboxOverlay}
          onClick={() => setShowImageLightbox(false)}
          onTouchStart={(e) => {
            const tag = e.target.closest("button, a, [role='button']");
            if (tag) {
              imageTouchRef.current.swiping = false;
              imageTouchRef.current.ignore = true;
              return;
            }
            imageTouchRef.current.ignore = false;
            imageTouchRef.current.startX = e.touches[0].clientX;
            imageTouchRef.current.startY = e.touches[0].clientY;
            imageTouchRef.current.swiping = false;
          }}
          onTouchMove={(e) => {
            if (allImages.length <= 1 || imageTouchRef.current.ignore) return;
            const dx = Math.abs(
              e.touches[0].clientX - imageTouchRef.current.startX,
            );
            const dy = Math.abs(
              e.touches[0].clientY - imageTouchRef.current.startY,
            );
            if (dx > 10 && dx > dy) {
              imageTouchRef.current.swiping = true;
            }
          }}
          onTouchEnd={(e) => {
            if (
              allImages.length <= 1 ||
              imageTouchRef.current.ignore ||
              !imageTouchRef.current.swiping
            )
              return;
            e.stopPropagation();
            const dx =
              e.changedTouches[0].clientX - imageTouchRef.current.startX;
            if (Math.abs(dx) > 40) {
              if (dx < 0 && activeImageIndex < allImages.length - 1) {
                setActiveImageIndex((i) => i + 1);
              } else if (dx > 0 && activeImageIndex > 0) {
                setActiveImageIndex((i) => i - 1);
              }
            }
          }}
        >
          <CloseButton
            className={classes.lightboxClose}
            onClick={() => setShowImageLightbox(false)}
            title={t("common", "close")}
          />
          <img
            src={allImages[activeImageIndex]}
            alt={recipe.name}
            className={classes.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
          {allImages.length > 1 && (
            <>
              <button
                className={`${classes.lightboxNav} ${classes.lightboxPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => Math.max(0, i - 1));
                }}
                disabled={activeImageIndex === 0}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className={`${classes.lightboxNav} ${classes.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) =>
                    Math.min(allImages.length - 1, i + 1),
                  );
                }}
                disabled={activeImageIndex === allImages.length - 1}
              >
                <ChevronRight size={28} />
              </button>
              <div className={classes.lightboxDots}>
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    className={`${classes.imageDot} ${i === activeImageIndex ? classes.imageDotActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                  />
                ))}
              </div>
              <span className={classes.lightboxCounter}>
                {activeImageIndex + 1} / {allImages.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
