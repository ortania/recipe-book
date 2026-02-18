import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

const MAX_DIMENSION = 1200;
const MAX_SIZE = 800 * 1024;
const INITIAL_QUALITY = 0.7;
const MIN_QUALITY = 0.1;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        let quality = INITIAL_QUALITY;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > MAX_SIZE && quality > MIN_QUALITY) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadRecipeImage(userId, recipeId, file) {
  const compressed = file instanceof File ? await compressImage(file) : file;
  const blob = dataUrlToBlob(compressed);
  const path = `recipes/${userId}/${recipeId || Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

export { compressImage };
