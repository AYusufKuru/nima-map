import { adminTheme } from '@/constants/adminTheme';
import { getCroppedImgWeb } from '@/utils/getCroppedImgWeb';
import Cropper, { centerCrop, convertToPixelCrop, makeAspectCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './logoCropModal.web.css';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { LogoCropModalProps } from './LogoCropModal.types';

export function LogoCropModal({ visible, imageSrc, onCancel, onApply }: LogoCropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [busy, setBusy] = useState(false);

  const applySquareCrop = useCallback((img: HTMLImageElement | null | undefined) => {
    if (img == null) return;
    try {
      if (!img.isConnected) return;
    } catch {
      return;
    }
    const w = img.clientWidth;
    const h = img.clientHeight;
    if (w < 2 || h < 2) return;
    const square = centerCrop(makeAspectCrop({ unit: '%', width: 82 }, 1, w, h), w, h);
    setCrop(square);
  }, []);

  useEffect(() => {
    if (!imageSrc) setCrop(undefined);
  }, [imageSrc]);

  /** Önbellekli görselde onLoad tetiklenmez; layout sonrası ölçü al. */
  useLayoutEffect(() => {
    if (!visible || !imageSrc) return;
    const img = imgRef.current;
    if (!img) return;
    const run = () => applySquareCrop(imgRef.current);
    if (img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(run);
      return;
    }
    const onLoad = () => requestAnimationFrame(() => applySquareCrop(imgRef.current));
    img.addEventListener('load', onLoad);
    return () => img.removeEventListener('load', onLoad);
  }, [visible, imageSrc, applySquareCrop]);

  const onImageLoad = useCallback(() => {
    requestAnimationFrame(() => applySquareCrop(imgRef.current));
  }, [applySquareCrop]);

  const handleApply = async () => {
    const img = imgRef.current;
    if (!imageSrc || !crop || !img) return;
    setBusy(true);
    try {
      const pixelCrop = convertToPixelCrop(crop, img.width, img.height);
      const blob = await getCroppedImgWeb(
        imageSrc,
        pixelCrop,
        { width: img.width, height: img.height },
        'image/jpeg',
        0.92
      );
      await onApply(blob, 'image/jpeg');
    } finally {
      setBusy(false);
    }
  };

  if (typeof window === 'undefined') {
    return null;
  }

  if (!visible || !imageSrc) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => (e as { stopPropagation?: () => void }).stopPropagation?.()}>
          <Text style={styles.title}>Fotoğrafı düzenle</Text>
          <Text style={styles.hint}>
            Kare alan hazır; boyutu köşelerden sürükleyerek değiştirin, ortadan tutarak taşıyın. Yeni alan
            çizmek gerekmez.
          </Text>
          <View style={styles.cropWrap}>
            <Cropper
              className="logo-crop-mobile-like"
              crop={crop}
              aspect={1}
              ruleOfThirds
              minWidth={24}
              minHeight={24}
              keepSelection
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              style={{ display: 'inline-block', maxWidth: '100%' } satisfies CSSProperties}
            >
              <img
                key={imageSrc}
                ref={imgRef}
                src={imageSrc}
                alt=""
                onLoad={onImageLoad}
                style={{
                  maxWidth: '100%',
                  maxHeight: 400,
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </Cropper>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onCancel} disabled={busy}>
              <Text style={styles.btnGhostText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, (!crop || busy) && styles.btnDisabled]}
              onPress={() => void handleApply()}
              disabled={!crop || busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Uygula</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11,20,26,0.88)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: adminTheme.surface,
    borderRadius: 16,
    padding: 16,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: adminTheme.text, marginBottom: 4 },
  hint: { fontSize: 12, color: adminTheme.textMuted, marginBottom: 8 },
  cropWrap: {
    borderRadius: 16,
    overflow: 'visible',
    backgroundColor: '#0b141a',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  btnGhost: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnGhostText: { color: adminTheme.textSecondary, fontWeight: '600' },
  btnPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: adminTheme.accent,
    minWidth: 100,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
});
