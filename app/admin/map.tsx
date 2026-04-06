import AdminBelediyeMap from '@/components/admin/AdminBelediyeMap';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { adminTheme } from '@/constants/adminTheme';
import { useAuth } from '@/contexts/AuthContext';
import { asHref } from '@/utils/asHref';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import type { ViewStyle } from 'react-native';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Yönetici harita görünümü — Leaflet + yan panel (web) */
export default function AdminMapScreen() {
  const { session, profile, loading: authLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';

  /** Stack’te aria-hidden olan ekranda odak kalmasın (Chrome uyarısı) */
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          (document.activeElement as HTMLElement | null)?.blur?.();
        }
      };
    }, [])
  );

  /**
   * Yalnızca oturum yokken tam ekran bekle. Oturum varken loading=true (ör. arka planda işlem)
   * tüm haritayı kilitlemesin — sekme dönüşünde sayfa yenileniyormuş gibi his oluşuyordu.
   * Yetkisiz flaşı AuthContext’te session+profil birlikte atanarak giderildi.
   */
  if (authLoading && !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={adminTheme.accent} />
      </View>
    );
  }

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.deniedWrap}>
          <View style={styles.deniedCard}>
            <View style={styles.deniedIconCircle}>
              <MaterialIcons name="computer" size={36} color={adminTheme.accent} />
            </View>
            <Text style={styles.deniedTitle}>Web tarayıcı gerekli</Text>
            <Text style={styles.deniedText}>
              Yönetim paneli yalnızca bilgisayar tarayıcısında kullanılır.
            </Text>
            <Pressable style={styles.primaryBtnSolid} onPress={() => router.replace(asHref('/'))}>
              <Text style={styles.primaryBtnSolidText}>Saha uygulamasına dön</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href={asHref('/login?redirect=/admin/map')} />;
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.deniedWrap}>
          <View style={styles.deniedCard}>
            <View style={[styles.deniedIconCircle, { backgroundColor: adminTheme.dangerBg }]}>
              <MaterialIcons name="lock-outline" size={36} color={adminTheme.danger} />
            </View>
            <Text style={styles.deniedTitle}>Yetkisiz</Text>
            <Text style={styles.deniedText}>Bu sayfa yalnızca yönetici hesapları içindir.</Text>
            <Link href={asHref('/login')} asChild>
              <Pressable style={styles.outlineBtn}>
                <Text style={styles.outlineBtnText}>Başka hesapla giriş</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AdminTopBar title="Harita görünümü" subtitle="Yönetici analitik" />
      <View style={[styles.body, Platform.OS === 'web' && mapBodyWeb]}>
        <AdminBelediyeMap />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminTheme.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: adminTheme.bg },
  deniedWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  deniedCard: {
    maxWidth: 400,
    width: '100%',
    backgroundColor: adminTheme.surface,
    borderRadius: adminTheme.radiusLg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminTheme.border,
    ...adminTheme.shadowCard,
  },
  deniedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: adminTheme.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: adminTheme.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  deniedText: { textAlign: 'center', color: adminTheme.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  primaryBtnSolid: {
    backgroundColor: adminTheme.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: adminTheme.radiusMd,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnSolidText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: adminTheme.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: adminTheme.radiusMd,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  outlineBtnText: { color: adminTheme.accent, fontWeight: '600', fontSize: 16 },
  body: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    backgroundColor: adminTheme.bg,
  },
});

/** Web: üst bar + safe area sonrası kalan alan; harita yüksekliği için */
const mapBodyWeb: ViewStyle = {
  // @ts-expect-error RN Web calc string
  minHeight: 'calc(100vh - 96px)',
  flexGrow: 1,
  alignSelf: 'stretch',
};
