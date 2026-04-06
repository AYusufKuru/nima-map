import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { adminTheme } from '@/constants/adminTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminToast } from '@/contexts/AdminToastContext';
import type { MunicipalityDef } from '@/constants/belediyeMapData';
import { useMunicipalities } from '@/contexts/MunicipalitiesContext';
import { asHref } from '@/utils/asHref';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Link, Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { buildMunicipalitySearchQuery, geocodeMunicipalityQuery } from '@/utils/municipalityQuery';
import { LogoCropModal } from '@/components/admin/LogoCropModal';

/** district kolonu yok / PostgREST şema cache güncel değil */
function shouldRetryMunicipalitiesWithoutDistrict(msg: string): boolean {
  const m = msg.toLowerCase();
  if (!m.includes('district')) return false;
  return (
    m.includes('schema') ||
    m.includes('cache') ||
    m.includes('does not exist') ||
    m.includes('could not find') ||
    m.includes('pgrst')
  );
}

export default function AdminMunicipalitiesScreen() {
  const { session, profile, loading: authLoading } = useAuth();
  const showToast = useAdminToast();
  const { municipalities, loading: listLoading, error: listError, refresh } = useMunicipalities();
  const isAdmin = profile?.role === 'admin';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MunicipalityDef | null>(null);
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<{
    blob: Blob;
    mime: string;
    previewUrl: string;
  } | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const cropDoneRef = useRef<((blob: Blob, mime: string) => void | Promise<void>) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MunicipalityDef | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  /** Gömülü “Yeni belediye” formu (düzenleme modalından ayrı) */
  const [createName, setCreateName] = useState('');
  const [createProvince, setCreateProvince] = useState('');
  const [createDistrict, setCreateDistrict] = useState('');
  const [createPendingLogo, setCreatePendingLogo] = useState<{
    blob: Blob;
    mime: string;
    previewUrl: string;
  } | null>(null);

  const clearPendingLogo = () => {
    setPendingLogo((prev) => {
      if (prev?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  const clearCreatePendingLogo = () => {
    setCreatePendingLogo((prev) => {
      if (prev?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  const dismissFormModal = () => {
    clearPendingLogo();
    setEditing(null);
    setModalOpen(false);
  };

  const openEdit = (m: MunicipalityDef) => {
    setEditing(m);
    setName(m.name);
    setProvince(m.province);
    setDistrict(m.district ?? '');
    clearPendingLogo();
    setModalOpen(true);
  };

  const finishCropPicker = () => {
    if (cropImageSrc?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(cropImageSrc);
      } catch {
        /* noop */
      }
    }
    setCropImageSrc(null);
  };

  const onCropCancel = () => {
    cropDoneRef.current = null;
    finishCropPicker();
  };

  const onCropApply = async (blob: Blob, mime: string) => {
    const fn = cropDoneRef.current;
    cropDoneRef.current = null;
    finishCropPicker();
    if (fn) await fn(blob, mime);
  };

  const pickLogoForEdit = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast({
        message: 'Galeri izni gerekli. Tarayıcıda site izinlerinden galeriye erişime izin verin.',
        variant: 'error',
        duration: 7000,
      });
      return;
    }

    if (Platform.OS === 'web') {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const uri = res.assets[0].uri;
      cropDoneRef.current = (blob, mime) => {
        const previewUrl = URL.createObjectURL(blob);
        setPendingLogo((prev) => {
          if (prev?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.previewUrl);
          return { blob, mime, previewUrl };
        });
      };
      setCropImageSrc(uri);
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const mime = blob.type || 'image/jpeg';
      setPendingLogo((prev) => {
        if (prev?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.previewUrl);
        return { blob, mime, previewUrl: asset.uri };
      });
    } catch {
      showToast({ message: 'Logo dosyası okunamadı.', variant: 'error' });
    }
  };

  const pickLogoForCreate = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast({
        message: 'Galeri izni gerekli. Tarayıcıda site izinlerinden galeriye erişime izin verin.',
        variant: 'error',
        duration: 7000,
      });
      return;
    }

    if (Platform.OS === 'web') {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const uri = res.assets[0].uri;
      cropDoneRef.current = (blob, mime) => {
        const previewUrl = URL.createObjectURL(blob);
        setCreatePendingLogo((prev) => {
          if (prev?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.previewUrl);
          return { blob, mime, previewUrl };
        });
      };
      setCropImageSrc(uri);
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const mime = blob.type || 'image/jpeg';
      setCreatePendingLogo((prev) => {
        if (prev?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.previewUrl);
        return { blob, mime, previewUrl: asset.uri };
      });
    } catch {
      showToast({ message: 'Logo dosyası okunamadı.', variant: 'error' });
    }
  };

  const uploadLogoToMunicipality = async (municipalityId: string, blob: Blob, mime: string) => {
    const ext = mime.includes('png') ? 'png' : 'jpg';
    const path = `${municipalityId}/logo.${ext}`;
    const { error: upErr } = await supabase.storage.from('municipality-logos').upload(path, blob, {
      contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      upsert: true,
    });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabase.storage.from('municipality-logos').getPublicUrl(path);
    const { error: dbErr } = await supabase.from('municipalities').update({ logo_url: pub.publicUrl }).eq('id', municipalityId);
    if (dbErr) throw new Error(dbErr.message);
  };

  const saveCreate = async () => {
    if (!createName.trim()) {
      showToast({ message: 'Belediye adı gerekli.', variant: 'error' });
      return;
    }
    if (!createProvince.trim()) {
      showToast({ message: 'İl gerekli.', variant: 'error' });
      return;
    }
    const districtTrim = createDistrict.trim();
    const builtQuery = buildMunicipalitySearchQuery(
      createName.trim(),
      createProvince.trim(),
      districtTrim || null
    );
    let la = 39;
    let ln = 35;
    setSaving(true);
    try {
      const geo = await geocodeMunicipalityQuery(builtQuery);
      if (geo) {
        la = geo.lat;
        ln = geo.lng;
      }
      const sort_order = (municipalities?.length ?? 0) * 10;
      const payloadBase = {
        name: createName.trim(),
        province: createProvince.trim(),
        query: builtQuery,
        lat: la,
        lng: ln,
        sort_order,
      };
      const payloadWithDistrict = { ...payloadBase, district: districtTrim };

      let savedWithoutDistrictColumn = false;
      let { data, error } = await supabase
        .from('municipalities')
        .insert([payloadWithDistrict])
        .select('id')
        .single();
      if (error && shouldRetryMunicipalitiesWithoutDistrict(error.message)) {
        ({ data, error } = await supabase.from('municipalities').insert([payloadBase]).select('id').single());
        savedWithoutDistrictColumn = true;
      }
      if (error) throw new Error(error.message);
      if (!data?.id) throw new Error('Kayıt kimliği alınamadı');
      const savedId = data.id;

      const logoSnap = createPendingLogo;
      if (logoSnap) {
        try {
          await uploadLogoToMunicipality(savedId, logoSnap.blob, logoSnap.mime);
        } catch (logoErr: unknown) {
          const msg = logoErr instanceof Error ? logoErr.message : String(logoErr);
          showToast({ message: `Logo yüklenemedi: ${msg}`, variant: 'error', duration: 6000 });
          throw logoErr;
        } finally {
          if (logoSnap.previewUrl.startsWith('blob:')) URL.revokeObjectURL(logoSnap.previewUrl);
          setCreatePendingLogo(null);
        }
      }

      setCreateName('');
      setCreateProvince('');
      setCreateDistrict('');
      clearCreatePendingLogo();

      await refresh();
      const okMsg = savedWithoutDistrictColumn
        ? 'Kaydedildi. İlçe ayrı kolonda tutulamadı (district kolonu veya PostgREST şema önbelleği). Supabase SQL Editor’da supabase/municipalities_add_district.sql dosyasını çalıştırın (içinde notify pgrst var). Arama metni (query) yine doğru kaydedildi.'
        : 'Kaydedildi.';
      showToast({
        message: savedWithoutDistrictColumn ? okMsg : 'İşlem başarılı',
        duration: savedWithoutDistrictColumn ? 14000 : 4000,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast({ message: msg, variant: 'error', duration: 7000 });
    } finally {
      setSaving(false);
    }
  };

  /** Yalnızca düzenleme modalı — güncelleme */
  const saveRow = async () => {
    if (!editing) return;
    if (!name.trim()) {
      showToast({ message: 'Belediye adı gerekli.', variant: 'error' });
      return;
    }
    if (!province.trim()) {
      showToast({ message: 'İl gerekli.', variant: 'error' });
      return;
    }
    const districtTrim = district.trim();
    const builtQuery = buildMunicipalitySearchQuery(name.trim(), province.trim(), districtTrim || null);
    let la = editing.coords[0];
    let ln = editing.coords[1];
    setSaving(true);
    try {
      const geo = await geocodeMunicipalityQuery(builtQuery);
      if (geo) {
        la = geo.lat;
        ln = geo.lng;
      }
      const sort_order = editing.sort_order ?? 0;
      const payloadBase = {
        name: name.trim(),
        province: province.trim(),
        query: builtQuery,
        lat: la,
        lng: ln,
        sort_order,
      };
      const payloadWithDistrict = { ...payloadBase, district: districtTrim };

      let savedWithoutDistrictColumn = false;
      let { error } = await supabase.from('municipalities').update(payloadWithDistrict).eq('id', editing.id);
      if (error && shouldRetryMunicipalitiesWithoutDistrict(error.message)) {
        ({ error } = await supabase.from('municipalities').update(payloadBase).eq('id', editing.id));
        savedWithoutDistrictColumn = true;
      }
      if (error) throw new Error(error.message);
      const savedId = editing.id;

      const logoSnap = pendingLogo;
      if (logoSnap) {
        try {
          await uploadLogoToMunicipality(savedId, logoSnap.blob, logoSnap.mime);
        } catch (logoErr: unknown) {
          const msg = logoErr instanceof Error ? logoErr.message : String(logoErr);
          showToast({ message: `Logo yüklenemedi: ${msg}`, variant: 'error', duration: 6000 });
          throw logoErr;
        } finally {
          if (logoSnap.previewUrl.startsWith('blob:')) URL.revokeObjectURL(logoSnap.previewUrl);
          setPendingLogo(null);
        }
      }

      setModalOpen(false);
      setEditing(null);
      await refresh();
      const okMsg = savedWithoutDistrictColumn
        ? 'Kaydedildi. İlçe ayrı kolonda tutulamadı (district kolonu veya PostgREST şema önbelleği). Supabase SQL Editor’da supabase/municipalities_add_district.sql dosyasını çalıştırın (içinde notify pgrst var). Arama metni (query) yine doğru kaydedildi.'
        : 'Kaydedildi.';
      showToast({
        message: savedWithoutDistrictColumn ? okMsg : 'İşlem başarılı',
        duration: savedWithoutDistrictColumn ? 14000 : 4000,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast({ message: msg, variant: 'error', duration: 7000 });
    } finally {
      setSaving(false);
    }
  };

  const dismissDeleteConfirm = () => {
    if (!deleteBusy) setDeleteTarget(null);
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const { error } = await supabase.from('municipalities').delete().eq('id', deleteTarget.id);
      if (error) {
        showToast({ message: error.message, variant: 'error' });
        return;
      }
      await refresh();
      showToast({ message: 'İşlem başarılı' });
      setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const confirmDelete = (row: MunicipalityDef) => setDeleteTarget(row);

  if (authLoading && !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={adminTheme.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href={asHref('/login?redirect=/admin/municipalities')} />;
  }

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.deniedText}>Bu ekran yalnızca web tarayıcıda kullanılır.</Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.deniedWrap}>
          <Text style={styles.deniedTitle}>Yetkisiz</Text>
          <Link href={asHref('/login')} asChild>
            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Giriş</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AdminTopBar title="Belediyeler" subtitle="İl / ilçe, logo" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollPad}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <MaterialIcons name="add-location-alt" size={20} color={adminTheme.accent} />
            <Text style={styles.sectionTitle}>Yeni belediye</Text>
          </View>
          <Text style={styles.formLabel}>Belediye adı</Text>
          <TextInput
            style={styles.input}
            value={createName}
            onChangeText={setCreateName}
            placeholder="Örn: Keçiören Belediyesi"
            placeholderTextColor={adminTheme.textMuted}
          />
          <Text style={styles.formLabel}>İl</Text>
          <TextInput
            style={styles.input}
            value={createProvince}
            onChangeText={setCreateProvince}
            placeholder="Zorunlu"
            placeholderTextColor={adminTheme.textMuted}
          />
          <Text style={styles.formLabel}>İlçe (isteğe bağlı)</Text>
          <TextInput
            style={styles.input}
            value={createDistrict}
            onChangeText={setCreateDistrict}
            placeholder="Boş bırakılırsa yalnızca il kullanılır"
            placeholderTextColor={adminTheme.textMuted}
          />
          <Text style={styles.formLabel}>Logo (isteğe bağlı)</Text>
          <View style={styles.logoRow}>
            {createPendingLogo ? (
              <View style={styles.logoPreviewWrap}>
                <Image
                  source={{ uri: createPendingLogo.previewUrl }}
                  style={styles.logoPreviewImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.logoPreviewWrap, styles.logoPreviewEmpty]}>
                <MaterialIcons name="add-photo-alternate" size={28} color={adminTheme.textMuted} />
              </View>
            )}
            <View style={styles.logoBtnCol}>
              <TouchableOpacity
                style={styles.logoPickBtn}
                onPress={() => void pickLogoForCreate()}
                disabled={saving}
              >
                <Text style={styles.logoPickBtnText}>
                  {createPendingLogo ? 'Logoyu değiştir' : 'Logo seç'}
                </Text>
              </TouchableOpacity>
              {createPendingLogo ? (
                <TouchableOpacity style={styles.logoRemoveBtn} onPress={clearCreatePendingLogo} disabled={saving}>
                  <Text style={styles.logoRemoveBtnText}>Logoyu kaldır</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.logoHint}>Seçtiğiniz dikdörtgen alan kayıtta logo olarak kullanılır.</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={() => void saveCreate()}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Kaydet</Text>}
          </TouchableOpacity>
        </View>

        {listLoading ? (
          <ActivityIndicator color={adminTheme.accent} style={{ marginTop: 24 }} />
        ) : listError ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="error-outline" size={40} color={adminTheme.danger} />
            <Text style={styles.emptyTitle}>Liste yüklenemedi</Text>
            <Text style={styles.emptyText}>{listError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void refresh()}>
              <Text style={styles.retryBtnText}>Yeniden dene</Text>
            </TouchableOpacity>
          </View>
        ) : municipalities.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="location-city" size={44} color={adminTheme.textMuted} />
            <Text style={styles.emptyTitle}>Henüz belediye yok</Text>
            <Text style={styles.emptyText}>
              Aşağıdaki formdan ilk belediyeyi ekleyebilirsiniz. Kayıtlar burada listelenir.
            </Text>
          </View>
        ) : (
          <View style={[styles.sectionCard, styles.listSectionCard, { marginTop: 16 }]}>
            <View style={[styles.sectionCardHeader, styles.listHeaderRow]}>
              <MaterialIcons name="location-city" size={20} color={adminTheme.accent} />
              <Text style={styles.sectionTitle}>Kayıtlı belediyeler</Text>
            </View>
            {municipalities.map((m) => {
              return (
                <View key={m.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    {m.logo_url ? (
                      <Image source={{ uri: m.logo_url }} style={styles.thumb} resizeMode="contain" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <MaterialIcons name="image" size={28} color={adminTheme.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{m.name}</Text>
                      <Text style={styles.cardSub}>
                        {m.district ? `${m.district} · ${m.province}` : m.province || '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.smallBtn} onPress={() => openEdit(m)}>
                      <Text style={styles.smallBtnText}>Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.smallBtnDanger} onPress={() => confirmDelete(m)}>
                      <Text style={styles.smallBtnDangerText}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={dismissDeleteConfirm}>
        <Pressable style={styles.modalOverlay} onPress={dismissDeleteConfirm}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>Sil</Text>
            <Text style={styles.deleteConfirmBody}>
              {deleteTarget ? `“${deleteTarget.name}” silinsin mi?` : ''}
            </Text>
            <View style={styles.deleteConfirmRow}>
              <TouchableOpacity
                style={styles.deleteConfirmCancel}
                onPress={dismissDeleteConfirm}
                disabled={deleteBusy}
              >
                <Text style={styles.deleteConfirmCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmDanger, deleteBusy && styles.btnDisabled]}
                onPress={() => void runDelete()}
                disabled={deleteBusy}
              >
                {deleteBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmDangerText}>Sil</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={dismissFormModal}>
        <Pressable style={styles.modalOverlay} onPress={dismissFormModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>Belediye düzenle</Text>
            <Text style={styles.label}>Belediye adı</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Örn: Keçiören Belediyesi" />
            <Text style={styles.label}>İl</Text>
            <TextInput style={styles.input} value={province} onChangeText={setProvince} placeholder="Zorunlu" />
            <Text style={styles.label}>İlçe (isteğe bağlı)</Text>
            <TextInput
              style={styles.input}
              value={district}
              onChangeText={setDistrict}
              placeholder="Boş bırakılırsa yalnızca il kullanılır"
            />
            <Text style={styles.label}>Logo (isteğe bağlı)</Text>
            <View style={styles.logoRow}>
              {pendingLogo ? (
                <View style={styles.logoPreviewWrap}>
                  <Image
                    source={{ uri: pendingLogo.previewUrl }}
                    style={styles.logoPreviewImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={[styles.logoPreviewWrap, styles.logoPreviewEmpty]}>
                  <MaterialIcons name="add-photo-alternate" size={28} color={adminTheme.textMuted} />
                </View>
              )}
              <View style={styles.logoBtnCol}>
                <TouchableOpacity style={styles.logoPickBtn} onPress={() => void pickLogoForEdit()} disabled={saving}>
                  <Text style={styles.logoPickBtnText}>
                    {pendingLogo ? 'Logoyu değiştir' : 'Logo seç'}
                  </Text>
                </TouchableOpacity>
                {pendingLogo ? (
                  <TouchableOpacity style={styles.logoRemoveBtn} onPress={clearPendingLogo} disabled={saving}>
                    <Text style={styles.logoRemoveBtnText}>Logoyu kaldır</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            <Text style={styles.logoHint}>Seçtiğiniz dikdörtgen alan kayıtta logo olarak kullanılır.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => void saveRow()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Kaydet</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={dismissFormModal}>
              <Text style={styles.cancelBtnText}>İptal</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <LogoCropModal
        visible={!!cropImageSrc}
        imageSrc={cropImageSrc}
        onCancel={onCropCancel}
        onApply={onCropApply}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminTheme.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: adminTheme.bg },
  deniedWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  deniedTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  deniedText: { color: adminTheme.textSecondary },
  scrollView: { flex: 1 },
  scrollPad: {
    padding: 16,
    paddingBottom: 48,
    maxWidth: 880,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  sectionCard: {
    backgroundColor: adminTheme.surface,
    borderRadius: adminTheme.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: adminTheme.border,
    ...adminTheme.shadowCard,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  listSectionCard: {
    padding: 16,
  },
  listHeaderRow: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: adminTheme.text, letterSpacing: -0.2 },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: adminTheme.textSecondary,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    minHeight: 280,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: adminTheme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: adminTheme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: adminTheme.accent,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: adminTheme.surface,
    borderRadius: adminTheme.radiusMd,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: adminTheme.text },
  cardSub: { fontSize: 12, color: adminTheme.textMuted, marginTop: 4 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: adminTheme.accentLight,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  smallBtnText: { fontSize: 13, fontWeight: '600', color: adminTheme.accentDark },
  smallBtnDanger: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: adminTheme.dangerBg,
  },
  smallBtnDangerText: { fontSize: 13, fontWeight: '600', color: adminTheme.danger },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: adminTheme.surface,
    borderRadius: 16,
    padding: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: adminTheme.text },
  deleteConfirmBody: {
    fontSize: 15,
    lineHeight: 22,
    color: adminTheme.text,
    marginBottom: 20,
  },
  deleteConfirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  deleteConfirmCancel: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminTheme.border,
    backgroundColor: adminTheme.surfaceMuted,
  },
  deleteConfirmCancelText: { fontSize: 15, fontWeight: '600', color: adminTheme.textSecondary },
  deleteConfirmDanger: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: adminTheme.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmDangerText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnDisabled: { opacity: 0.65 },
  label: { fontSize: 11, fontWeight: '700', color: adminTheme.textMuted, marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: adminTheme.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: adminTheme.text,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: adminTheme.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: adminTheme.textSecondary, fontWeight: '600' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  /** Önizleme: beyaz zemin + contain — şeffaf PNG/JPEG matı doğru görünsün */
  logoPreviewWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: adminTheme.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPreviewImage: { width: '100%', height: '100%' },
  logoPreviewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminTheme.surfaceMuted,
  },
  logoBtnCol: { flex: 1, gap: 8 },
  logoPickBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: adminTheme.accentLight,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  logoPickBtnText: { fontSize: 13, fontWeight: '600', color: adminTheme.accentDark },
  logoRemoveBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: adminTheme.dangerBg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoRemoveBtnText: { fontSize: 13, fontWeight: '600', color: adminTheme.danger },
  logoHint: { fontSize: 11, color: adminTheme.textMuted, marginTop: 6, lineHeight: 16 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: adminTheme.border,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  outlineBtnText: { color: adminTheme.accent, fontWeight: '600' },
});
