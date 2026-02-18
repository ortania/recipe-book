import galleryIconSvg from "./gallery-icon.svg";

function GalleryIcon({ width = 20, height = 20 }) {
  return <img src={galleryIconSvg} width={width} height={height} alt="" />;
}

export default GalleryIcon;
