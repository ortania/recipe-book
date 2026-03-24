import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

const MAX_DIMENSION = 1200;
const INITIAL_QUALITY = 0.7;
const MIN_QUALITY = 0.3;
const COMPRESS_TIMEOUT_MS = 12000;

function normalizeImageDataUrl(dataUrl) {
  if (!dataUrl) return dataUrl;
  if (
    /^data:(application\/octet-stream|image\/jfif|image\/pjpeg)/i.test(dataUrl) ||
    /^data:;base64,/i.test(dataUrl)
  ) {
    return dataUrl.replace(/^data:[^;]*/, "data:image/jpeg");
  }
  return dataUrl;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const scale = MAX_DIMENSION / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);

          let quality = INITIAL_QUALITY;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length > 600_000 && quality > MIN_QUALITY) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          canvas.width = 0;
          canvas.height = 0;
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.src = normalizeImageDataUrl(reader.result);
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

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function uploadRecipeImage(userId, recipeId, file) {
  const path = `recipes/${userId}/${recipeId || Date.now()}.jpg`;
  const storageRef = ref(storage, path);

  let blob;
  if (file instanceof File) {
    try {
      const compressed = await withTimeout(compressImage(file), COMPRESS_TIMEOUT_MS);
      blob = dataUrlToBlob(compressed);
    } catch {
      blob = file;
    }
  } else {
    blob = dataUrlToBlob(file);
  }

  await withTimeout(
    uploadBytes(storageRef, blob, { contentType: blob.type || "image/jpeg" }),
    20000,
  );
  return withTimeout(getDownloadURL(storageRef), 10000);
}

export { compressImage, normalizeImageDataUrl };
