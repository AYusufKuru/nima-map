import { adminTheme } from '@/constants/adminTheme';
import { useAuth } from '@/contexts/AuthContext';
import { asHref, safeRouterBack } from '@/utils/asHref';
import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** Web: hover’da yerel tooltip (`title` → DOM, RN tipinde yok) */
function webTooltip(label: string): { title?: string } | undefined {
  return Platform.OS === 'web' ? { title: label } : undefined;
}

export type AdminTopBarProps = {
  title: string;
  subtitle?: string;
  /** Tam menü (raporlar, harita, belediyeler, kullanıcılar, çıkış) */
  mode?: 'full' | 'bootstrap';
  /** İlk kurulum ekranı: geri */
  onBootstrapBack?: () => void;
  /** Belediyeler: yeni kayıt */
  onAddPress?: () => void;
};

function navActive(path: string | undefined, segment: 'reports' | 'map' | 'municipalities' | 'users'): boolean {
  if (!path) return false;
  const p = path.replace(/\/$/, '');
  if (segment === 'reports') return p.endsWith('/admin') || p.endsWith('/admin/index');
  if (segment === 'map') return p.includes('/admin/map');
  if (segment === 'municipalities') return p.includes('/admin/municipalities');
  if (segment === 'users') return p.includes('/admin/users');
  return false;
}

export function AdminTopBar({
  title,
  subtitle,
  mode = 'full',
  onBootstrapBack,
  onAddPress,
}: AdminTopBarProps) {
  const { signOut } = useAuth();
  const pathname = usePathname();

  const goLogin = async () => {
    await signOut();
    router.replace(asHref('/login'));
  };

  if (mode === 'bootstrap') {
    return (
      <View style={styles.header}>
        <View style={styles.headerBarRow}>
          <TouchableOpacity
            onPress={onBootstrapBack ?? (() => safeRouterBack('/admin'))}
            style={styles.iconBtnWrap}
            accessibilityLabel="Geri"
          >
            <MaterialIcons name="arrow-back" size={22} color={adminTheme.accent} />
          </TouchableOpacity>
          <View style={{ width: 44 }} />
        </View>
        <View style={[styles.headerTitleOverlay, { pointerEvents: 'none' }]}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    );
  }

  const ar = navActive(pathname, 'reports');
  const am = navActive(pathname, 'map');
  const ab = navActive(pathname, 'municipalities');
  const au = navActive(pathname, 'users');

  return (
    <View style={styles.header}>
      <View style={styles.headerBarRow}>
        <View style={styles.headerRightActions}>
          <View style={styles.iconTooltipAnchor} {...webTooltip('Ana sayfa')}>
            <TouchableOpacity
              onPress={() => router.push(asHref('/admin'))}
              style={[styles.iconBtnWrap, ar && styles.iconBtnActive]}
              accessibilityLabel="Ana sayfa"
            >
              <MaterialIcons name="home" size={22} color={ar ? adminTheme.accentDark : adminTheme.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.iconTooltipAnchor} {...webTooltip('Harita')}>
            <TouchableOpacity
              onPress={() => router.push(asHref('/admin/map'))}
              style={[styles.iconBtnWrap, am && styles.iconBtnActive]}
              accessibilityLabel="Harita"
            >
              <MaterialIcons name="map" size={22} color={am ? adminTheme.accentDark : adminTheme.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.iconTooltipAnchor} {...webTooltip('Belediyeler')}>
            <TouchableOpacity
              onPress={() => router.push(asHref('/admin/municipalities'))}
              style={[styles.iconBtnWrap, ab && styles.iconBtnActive]}
              accessibilityLabel="Belediyeler"
            >
              <MaterialIcons name="location-city" size={22} color={ab ? adminTheme.accentDark : adminTheme.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.iconTooltipAnchor} {...webTooltip('Kullanıcılar')}>
            <TouchableOpacity
              onPress={() => router.push(asHref('/admin/users'))}
              style={[styles.iconBtnWrap, au && styles.iconBtnActive]}
              accessibilityLabel="Kullanıcılar"
            >
              <MaterialIcons name="people" size={22} color={au ? adminTheme.accentDark : adminTheme.accent} />
            </TouchableOpacity>
          </View>
          {onAddPress ? (
            <View style={styles.iconTooltipAnchor} {...webTooltip('Yeni ekle')}>
              <TouchableOpacity onPress={onAddPress} style={styles.iconBtnWrap} accessibilityLabel="Yeni ekle">
                <MaterialIcons name="add" size={24} color={adminTheme.accent} />
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.iconTooltipAnchor} {...webTooltip('Çıkış yap')}>
            <TouchableOpacity onPress={() => void goLogin()} style={styles.iconBtnWrap} accessibilityLabel="Çıkış yap">
              <MaterialIcons name="logout" size={22} color={adminTheme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={[styles.headerTitleOverlay, { pointerEvents: 'none' }]}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: adminTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: adminTheme.border,
    maxWidth: adminTheme.maxContent,
    width: '100%',
    alignSelf: 'center',
    ...adminTheme.shadowHeader,
    minHeight: 56,
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { position: 'relative' as const } : {}),
  },
  headerBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  headerTitleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: adminTheme.text, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 12, color: adminTheme.textMuted, marginTop: 2 },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  iconTooltipAnchor: { alignItems: 'center', justifyContent: 'center' },
  iconBtnWrap: {
    padding: 10,
    borderRadius: adminTheme.radiusSm,
    backgroundColor: adminTheme.chipInactive,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconBtnActive: {
    borderColor: adminTheme.accent,
    backgroundColor: adminTheme.accentLight,
  },
});
