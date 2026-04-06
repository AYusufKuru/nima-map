import { useAuth } from '@/contexts/AuthContext';
import { useMunicipalities } from '@/contexts/MunicipalitiesContext';
import { supabase } from '@/supabase';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Saha kullanıcısı: yalnızca `user_municipalities` ile atanan belediyeler.
 * Yönetici: tüm belediyeler.
 */
export function useSelectableMunicipalities() {
  const { session, profile } = useAuth();
  const { municipalities, loading: muniLoading, error: muniError, refresh: refreshMunicipalities } =
    useMunicipalities();

  /** null = saha için henüz yüklenmedi; [] = yüklendi, atama yok */
  const [assignedIds, setAssignedIds] = useState<string[] | null>(null);

  const loadAssigned = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid || !profile) {
      setAssignedIds(null);
      return;
    }
    if (profile.role === 'admin') {
      setAssignedIds([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_municipalities')
        .select('municipality_id')
        .eq('user_id', uid);
      if (error) {
        console.warn('[useSelectableMunicipalities]', error.message);
        setAssignedIds([]);
        return;
      }
      setAssignedIds((data ?? []).map((r: { municipality_id: string }) => r.municipality_id));
    } catch {
      setAssignedIds([]);
    }
  }, [session?.user?.id, profile]);

  useEffect(() => {
    void loadAssigned();
  }, [loadAssigned]);

  const selectableMunicipalities = useMemo(() => {
    if (profile?.role === 'admin') return municipalities;
    if (assignedIds === null) return [];
    const allow = new Set(assignedIds);
    return municipalities.filter((m) => allow.has(m.id));
  }, [municipalities, profile?.role, assignedIds]);

  const canUseMunicipality = useCallback(
    (municipalityId: string | null | undefined) => {
      if (!municipalityId) return false;
      if (profile?.role === 'admin') return true;
      if (assignedIds === null) return false;
      return assignedIds.includes(municipalityId);
    },
    [profile?.role, assignedIds]
  );

  const loading =
    muniLoading || (profile?.role === 'field' && assignedIds === null && !!session?.user);

  const refreshAssignments = useCallback(async () => {
    await refreshMunicipalities();
    await loadAssigned();
  }, [refreshMunicipalities, loadAssigned]);

  return {
    /** Tüm kayıtlar (seçili id çözümü / PDF için) */
    municipalities,
    selectableMunicipalities,
    loading,
    error: muniError,
    canUseMunicipality,
    refreshAssignments,
    assignedMunicipalityIds: profile?.role === 'admin' ? undefined : assignedIds ?? undefined,
  };
}
