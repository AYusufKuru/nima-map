import { adminTheme } from '@/constants/adminTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUCCESS_GREEN = '#15803d';
const SUCCESS_BG = '#ffffff';
const SUCCESS_BORDER = '#bbf7d0';
const SUCCESS_RING = '#dcfce7';

export type AdminToastOptions = {
  message: string;
  duration?: number;
  variant?: 'success' | 'error';
};

type ShowFn = (opts: AdminToastOptions) => void;

const Ctx = createContext<ShowFn | null>(null);

/** Yalnızca başarı bildirimi rafine; hata: sade metin + ikon. */
function SuccessToastContent({ message }: { message: string }) {
  const detail = message.trim();
  const isSimple = detail === '' || detail === 'İşlem başarılı';
  return (
    <View style={styles.toastRow}>
      <View style={styles.iconBadge}>
        <MaterialIcons name="check" size={26} color="#ffffff" />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.successTitle}>İşlem başarılı</Text>
        {isSimple ? (
          <Text style={styles.successSubtle}>Kayıt tamamlandı.</Text>
        ) : (
          <Text style={styles.toastTextSuccessBody}>{detail}</Text>
        )}
      </View>
    </View>
  );
}

function ErrorToastContent({ message }: { message: string }) {
  return (
    <View style={styles.errorRow}>
      <MaterialIcons name="error-outline" size={22} color={adminTheme.danger} />
      <Text style={[styles.toastText, styles.toastTextError]}>{message}</Text>
    </View>
  );
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<AdminToastOptions | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  const anchorStyle = useMemo((): ViewStyle => {
    if (Platform.OS === 'web') {
      return {
        position: 'fixed',
        right: 20,
        bottom: 28,
        zIndex: 99999,
        minWidth: 300,
        maxWidth: 420,
      } as ViewStyle;
    }
    return {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: Math.max(insets.bottom, 8) + 8,
      zIndex: 99999,
      alignItems: 'flex-end',
    };
  }, [insets.bottom]);

  const showToast = useCallback(
    (opts: AdminToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPayload(opts);
      setVisible(true);
      const d = opts.duration ?? 4500;
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 10,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
          setPayload(null);
        });
        timerRef.current = null;
      }, d);
    },
    [opacity, translateY]
  );

  useEffect(() => {
    if (!visible || !payload) return;
    opacity.setValue(0);
    translateY.setValue(18);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, payload, opacity, translateY]);

  const value = useMemo(() => showToast, [showToast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {visible && payload ? (
        <View style={[anchorStyle, styles.anchorPointer]} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.toast,
              payload.variant === 'error' ? styles.toastError : styles.toastSuccess,
              { opacity, transform: [{ translateY }] },
            ]}
          >
            {payload.variant === 'error' ? (
              <ErrorToastContent message={payload.message} />
            ) : (
              <SuccessToastContent message={payload.message} />
            )}
          </Animated.View>
        </View>
      ) : null}
    </Ctx.Provider>
  );
}

export function useAdminToast(): ShowFn {
  const fn = useContext(Ctx);
  if (!fn) {
    return (opts) => {
      if (__DEV__) console.warn('[AdminToast]', opts.variant ?? 'success', opts.message);
    };
  }
  return fn;
}

const styles = StyleSheet.create({
  anchorPointer: {
    pointerEvents: 'box-none',
  },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: SUCCESS_BG,
    borderColor: SUCCESS_BORDER,
    maxWidth: Platform.OS === 'web' ? 420 : 400,
    alignSelf: 'flex-end',
    ...Platform.select({
      web: {
        boxShadow:
          '0 0 0 1px rgba(22, 163, 74, 0.08), 0 14px 36px -6px rgba(22, 163, 74, 0.2), 0 6px 14px rgba(15, 23, 42, 0.07)',
      },
      ios: {
        shadowColor: '#15803d',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  toastError: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
    minWidth: 280,
    maxWidth: Platform.OS === 'web' ? 420 : 400,
    alignSelf: 'flex-end',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: 380,
  },
  toastRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SUCCESS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: SUCCESS_RING,
    flexShrink: 0,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(21, 128, 61, 0.32)',
      },
      default: {},
    }),
  },
  textCol: {
    flex: 1,
    paddingTop: 2,
    gap: 4,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SUCCESS_GREEN,
    letterSpacing: 0.1,
  },
  successSubtle: {
    fontSize: 14,
    fontWeight: '500',
    color: adminTheme.textSecondary,
    marginTop: 2,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminTheme.text,
    lineHeight: 20,
    flex: 1,
  },
  toastTextSuccessBody: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: adminTheme.text,
  },
  toastTextError: {
    color: '#991b1b',
  },
});
