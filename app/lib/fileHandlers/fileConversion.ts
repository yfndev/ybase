import heic2any from "heic2any";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const QUALITY = 0.7;

export class FileConversionError extends Error {}

async function convertPNGtoJPG(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob!], file.name.replace(/\.png$/i, ".jpg"), {
                type: "image/jpeg",
              }),
            );
          },
          "image/jpeg",
          QUALITY,
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function convertHEICtoJPG(file: File): Promise<File> {
  const blob = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: QUALITY,
  });
  const result = Array.isArray(blob) ? blob[0] : blob;
  return new File([result], file.name.replace(/\.heic$/i, ".jpg"), {
    type: "image/jpeg",
  });
}

export async function convertToJPG(file: File): Promise<File> {
  if (file.size > MAX_SIZE)
    throw new FileConversionError("Datei zu groß (max. 10 MB)");
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return file;
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  )
    return file;
  if (type === "image/heic" || name.endsWith(".heic"))
    return convertHEICtoJPG(file);
  if (type === "image/png" || name.endsWith(".png"))
    return convertPNGtoJPG(file);
  throw new FileConversionError("Dateiformat nicht unterstützt");
}

export function isValidFileType(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/heic",
      "application/pdf",
    ].includes(type) ||
    [".jpg", ".jpeg", ".png", ".heic", ".pdf"].some((ext) => name.endsWith(ext))
  );
}
