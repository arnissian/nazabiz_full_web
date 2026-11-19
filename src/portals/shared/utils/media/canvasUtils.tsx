export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // Évite les problèmes de cross-origin
    image.src = url;
  });

export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Retourne la nouvelle zone de délimitation après la rotation d'un rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlipOptions {
  horizontal: boolean;
  vertical: boolean;
}

/**
 * Fonction de recadrage d'image.
 */
export async function getCroppedImg(
  imageSelected: string,
  pixelCrop: PixelCrop,
  rotation: number = 0,
  flip: FlipOptions = { horizontal: false, vertical: false }
): Promise<string | null> {
  const image = await createImage(imageSelected);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calcul des dimensions après rotation
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Transformation et rotation
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  // Taille du canvas recadré
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return croppedCanvas.toDataURL("image/png");
}

/**
 * Fonction de rotation d'une image.
 */
export async function getRotatedImage(imageSelected: string, rotation: number = 0): Promise<string> {
  const image = await createImage(imageSelected);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const orientationChanged = [90, -90, 270, -270].includes(rotation);
  canvas.width = orientationChanged ? image.height : image.width;
  canvas.height = orientationChanged ? image.width : image.height;

  ctx?.translate(canvas.width / 2, canvas.height / 2);
  ctx?.rotate((rotation * Math.PI) / 180);
  ctx?.drawImage(image, -image.width / 2, -image.height / 2);

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(URL.createObjectURL(file));
      }
    }, "image/png");
  });
}
