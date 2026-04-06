/** Saha uygulaması (`app/index.tsx`) ile aynı operatör listesi — DB’de tam unvan saklanır. */
export const OPERATOR_DATA = {
  MenholKabin: [
    { short: 'Süperonline', full: 'SUPERONLINE İLETİŞİM HİZMETLERİ A.Ş.' },
    { short: 'Türk Telekom', full: 'TÜRK TELEKOMÜNİKASYON A.Ş.' },
    { short: 'Vodafone', full: 'VODAFONE NET İLETİŞİM HİZMETLERİ A.Ş.' },
    { short: 'Türksat', full: 'TÜRKSAT UYDU HABERLEŞME KABLO TV VE İŞLETME A.Ş.' },
    { short: 'İstanbul B.B.', full: 'İSTANBUL BÜYÜKŞEHIR BELEDIYESI BILGI TEKNOLOJILERI VE ELEKTRONIK HABERLEŞME ANONIM ŞIRKETI' },
    { short: 'Türknet', full: 'TÜRKNET İLETİŞİM HİZMETLERİ A.Ş.' },
  ],
  BazIstasyonu: [
    { short: 'Vodafone', full: 'VODAFONE TELEKOMÜNİKASYON A.Ş' },
    { short: 'Türk Telekom', full: 'TT MOBİL İLETİŞİM HİZMETLERİ A.Ş.' },
    { short: 'Türkcell', full: 'TÜRKCELL İLETİŞİM HİZMETLERİ A.Ş.' },
  ],
} as const;

export type OperatorPresetKey = 'MenholKabin' | 'BazIstasyonu';

export function operatorPresetKey(type: string | null | undefined): OperatorPresetKey | null {
  if (!type) return null;
  if (type === 'Menhol' || type === 'Kabin') return 'MenholKabin';
  if (type === 'Baz İstasyonu') return 'BazIstasyonu';
  return null;
}

export function presetOperatorPairs(type: string): { short: string; full: string }[] {
  const k = operatorPresetKey(type);
  if (k === 'MenholKabin') return [...OPERATOR_DATA.MenholKabin];
  if (k === 'BazIstasyonu') return [...OPERATOR_DATA.BazIstasyonu];
  return [];
}

/** Elle firma girilen türler (Menhol/Kabin/Baz hariç seçili türler). */
export function isManualOperatorType(type: string): boolean {
  if (!type.trim()) return false;
  return operatorPresetKey(type) === null;
}
