export const SOURCE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;

export type ImageFocalPoint = { x: number; y: number };
export type SourceImageInfo = {
  width: number;
  height: number;
  size: number;
  contentType: string;
  warning: string | null;
};
export type ProcessedImage = {
  blob: Blob;
  width: number;
  height: number;
  contentType: "image/webp" | "image/jpeg";
};

type Drawable = {
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

export function validateSourceFile(file: File) {
  if (!SOURCE_IMAGE_TYPES.includes(file.type as (typeof SOURCE_IMAGE_TYPES)[number])) {
    throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
  }
  if (!file.size || file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Arquivo muito grande. Escolha uma foto com até 10 MB.");
  }
}

async function loadDrawable(blob: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível abrir esta imagem."));
      element.src = url;
    });
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function inspectSourceFile(file: File, kind: "hero" | "og"): Promise<SourceImageInfo> {
  validateSourceFile(file);
  let drawable: Drawable;
  try {
    drawable = await loadDrawable(file);
  } catch {
    throw new Error("O arquivo não contém uma imagem válida.");
  }
  const { width, height } = drawable;
  drawable.close();
  if (width < 640 || height < 315) {
    throw new Error("Imagem pequena. Escolha uma foto maior para manter boa qualidade.");
  }
  const warning = kind === "hero" && width < 1200
    ? "Esta foto tem menos de 1200 px de largura e pode perder nitidez no destaque."
    : kind === "og" && (width < 1200 || height < 630)
      ? "A imagem será ampliada para 1200 × 630 e pode perder um pouco de nitidez."
      : null;
  return { width, height, size: file.size, contentType: file.type, warning };
}

function canvasBlob(canvas: HTMLCanvasElement, contentType: "image/webp" | "image/jpeg", quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Este navegador não conseguiu otimizar a imagem.")), contentType, quality);
  });
}

export async function processHeroImage(source: Blob): Promise<ProcessedImage> {
  const drawable = await loadDrawable(source);
  try {
    const scale = Math.min(1, 1920 / drawable.width, 4000 / drawable.height);
    const width = Math.max(1, Math.round(drawable.width * scale));
    const height = Math.max(1, Math.round(drawable.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Não foi possível preparar a foto.");
    context.drawImage(drawable.image, 0, 0, width, height);
    const blob = await canvasBlob(canvas, "image/webp", 0.84);
    return { blob, width, height, contentType: "image/webp" };
  } finally {
    drawable.close();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function processOgImage(source: Blob, focal: ImageFocalPoint): Promise<ProcessedImage> {
  const drawable = await loadDrawable(source);
  try {
    const targetWidth = 1200;
    const targetHeight = 630;
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = drawable.width / drawable.height;
    const cropWidth = sourceRatio > targetRatio ? drawable.height * targetRatio : drawable.width;
    const cropHeight = sourceRatio > targetRatio ? drawable.height : drawable.width / targetRatio;
    const centerX = (clamp(focal.x, 0, 100) / 100) * drawable.width;
    const centerY = (clamp(focal.y, 0, 100) / 100) * drawable.height;
    const sourceX = clamp(centerX - cropWidth / 2, 0, drawable.width - cropWidth);
    const sourceY = clamp(centerY - cropHeight / 2, 0, drawable.height - cropHeight);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Não foi possível preparar a imagem de compartilhamento.");
    context.drawImage(drawable.image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    const blob = await canvasBlob(canvas, "image/jpeg", 0.9);
    return { blob, width: targetWidth, height: targetHeight, contentType: "image/jpeg" };
  } finally {
    drawable.close();
  }
}

export async function downloadPublicImage(url: string) {
  const response = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error("Não foi possível carregar a foto principal para gerar a imagem.");
  const blob = await response.blob();
  if (!blob.size || blob.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("A foto principal é grande demais para gerar a imagem de compartilhamento.");
  }
  return blob;
}

export function formatImageBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}
