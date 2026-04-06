/** Görüntünün ekrandaki boyutuna göre piksel kırpımı (react-image-crop ile uyumlu). */
export type DisplayPixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = src;
  });
}

/** Tarayıcıda kırpılmış JPEG üretir (yönetici web paneli). */
export async function getCroppedImgWeb(
  imageSrc: string,
  pixelCrop: DisplayPixelCrop,
  displayedSize: { width: number; height: number },
  mimeType: string = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new Error('Kırpma yalnızca tarayıcıda kullanılabilir.');
  }
  const image = await loadImage(imageSrc);
  const { width: dw, height: dh } = displayedSize;
  if (dw <= 0 || dh <= 0) {
    throw new Error('Görüntü boyutu geçersiz.');
  }
  const scaleX = image.naturalWidth / dw;
  const scaleY = image.naturalHeight / dh;
  const sx = pixelCrop.x * scaleX;
  const sy = pixelCrop.y * scaleY;
  const sw = pixelCrop.width * scaleX;
  const sh = pixelCrop.height * scaleY;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas desteklenmiyor');

  const outW = Math.max(1, Math.round(sw));
  const outH = Math.max(1, Math.round(sh));
  canvas.width = outW;
  canvas.height = outH;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Görüntü oluşturulamadı'));
      },
      mimeType,
      quality
    );
  });
}
