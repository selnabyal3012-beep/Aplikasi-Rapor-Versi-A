import { LearningObjective, ClassLevel } from '../types';

/**
 * Clean up common teacher prefixes from TP sentences so they integrate
 * smoothly into official report card sentences (e.g. "Siswa mampu memahami..." -> "memahami...")
 */
export function cleanTpPhrase(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Strip trailing periods
  cleaned = cleaned.replace(/\.+$/, '');

  // Regex patterns to remove Indonesian pedagogical prefixes
  const prefixRegexes = [
    /^(peserta\s+didik\s+mampu\s+)/i,
    /^(peserta\s+didik\s+dapat\s+)/i,
    /^(siswa\s+mampu\s+)/i,
    /^(siswa\s+dapat\s+)/i,
    /^(murid\s+mampu\s+)/i,
    /^(anak\s+mampu\s+)/i,
    /^(mampu\s+)/i,
    /^(dapat\s+)/i,
    /^(diharapkan\s+mampu\s+)/i,
    /^(mampu\s+menunjukkan\s+)/i
  ];

  for (const regex of prefixRegexes) {
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, '');
      break;
    }
  }

  cleaned = cleaned.trim();
  if (cleaned.length > 0) {
    // lowercase first character if not an acronym or proper noun
    const firstWord = cleaned.split(' ')[0];
    if (firstWord !== firstWord.toUpperCase()) {
      cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    }
  }

  return cleaned;
}

export interface TpDescriptionResult {
  deskripsiRapor: string;
  deskripsiTercapai: string;
  deskripsiPerluPeningkatan: string;
  linkedTpKodes: string[];
  matchedTps: LearningObjective[];
}

/**
 * Generates official Kurikulum Merdeka report card descriptions dynamically
 * linked to the active Tujuan Pembelajaran (TP) for a specific subject and class.
 */
export function generateReportDescriptionFromTP(
  mapelName: string,
  kelas: ClassLevel | string,
  nilaiAkhir: number,
  allTPs: LearningObjective[],
  namaSiswa?: string,
  agamaSiswa?: string
): TpDescriptionResult {
  // Normalize agama name
  const normAgama = agamaSiswa ? agamaSiswa.trim().toLowerCase() : '';
  const isAgamaSubject = mapelName.toLowerCase().includes('agama');

  // Find matching TPs for this subject, religion, and class
  let matchedTps: LearningObjective[] = [];

  if (isAgamaSubject && normAgama) {
    // 1. Prioritize TPs specifically created for the student's religion
    matchedTps = allTPs.filter((tp) => {
      const tpAgama = (tp.agama || '').toLowerCase();
      const tpMapel = tp.mataPelajaran.toLowerCase();
      const kelasMatch = !kelas || tp.kelas === kelas;
      if (!kelasMatch) return false;

      const religionMatch =
        tpAgama === normAgama ||
        tpMapel.includes(normAgama) ||
        (normAgama === 'kristen' && (tpMapel.includes('kristen') || tpAgama === 'kristen' || tpMapel.includes('protestan'))) ||
        (normAgama === 'katolik' && (tpMapel.includes('katolik') || tpAgama === 'katolik')) ||
        (normAgama === 'islam' && (tpMapel.includes('islam') || tpAgama === 'islam')) ||
        (normAgama === 'hindu' && (tpMapel.includes('hindu') || tpAgama === 'hindu')) ||
        (normAgama === 'buddha' && (tpMapel.includes('buddha') || tpAgama === 'buddha')) ||
        ((normAgama === 'khonghucu' || normAgama === 'konghucu') &&
          (tpMapel.includes('khonghucu') || tpMapel.includes('konghucu') || tpAgama === 'khonghucu' || tpAgama === 'konghucu'));

      return religionMatch;
    });
  }

  // 2. Fallback to standard subject matching if no religion-specific TPs matched
  if (matchedTps.length === 0) {
    matchedTps = allTPs.filter((tp) => {
      const mapelMatch =
        tp.mataPelajaran.trim().toLowerCase() === mapelName.trim().toLowerCase() ||
        tp.mataPelajaran.toLowerCase().includes(mapelName.toLowerCase()) ||
        mapelName.toLowerCase().includes(tp.mataPelajaran.toLowerCase());

      const kelasMatch = !kelas || tp.kelas === kelas;
      return mapelMatch && kelasMatch;
    });
  }

  const linkedTpKodes = matchedTps.map((tp) => tp.kodeTp);

  // If no TP exists yet for this class, fallback to clean subject-based phrases
  if (matchedTps.length === 0) {
    const genericTp1 = `memahami materi inti pembelajaran ${mapelName}`;
    const genericTp2 = `mempraktikkan keterampilan dasar pembelajaran ${mapelName}`;

    if (nilaiAkhir >= 85) {
      return {
        deskripsiRapor: `Menunjukkan penguasaan yang sangat baik dalam ${genericTp1} serta terampil dalam ${genericTp2}.`,
        deskripsiTercapai: `Sangat baik dalam ${genericTp1}.`,
        deskripsiPerluPeningkatan: `Perlu pembiasaan pengayaan lebih lanjut.`,
        linkedTpKodes: [],
        matchedTps: []
      };
    } else if (nilaiAkhir >= 75) {
      return {
        deskripsiRapor: `Menunjukkan penguasaan yang baik dalam ${genericTp1} dan mampu menyelesaikan tugas secara mandiri.`,
        deskripsiTercapai: `Menguasai dengan baik materi dasar ${mapelName}.`,
        deskripsiPerluPeningkatan: `Perlu pembiasaan mandiri secara berkala.`,
        linkedTpKodes: [],
        matchedTps: []
      };
    } else if (nilaiAkhir >= 65) {
      return {
        deskripsiRapor: `Cukup mampu dalam ${genericTp1}, namun perlu pembiasaan dan bimbingan lebih lanjut dalam ${genericTp2}.`,
        deskripsiTercapai: `Cukup mampu memahami konsep dasar ${mapelName}.`,
        deskripsiPerluPeningkatan: `Perlu bimbingan dalam ${genericTp2}.`,
        linkedTpKodes: [],
        matchedTps: []
      };
    } else {
      return {
        deskripsiRapor: `Perlu pendampingan dan bimbingan intensif dalam ${genericTp1}.`,
        deskripsiTercapai: `Mulai mengenal pembelajaran ${mapelName}.`,
        deskripsiPerluPeningkatan: `Perlu pendampingan intensif dari guru dan orang tua.`,
        linkedTpKodes: [],
        matchedTps: []
      };
    }
  }

  // Extract clean phrases from matched TPs
  const phrase1 = cleanTpPhrase(matchedTps[0].tujuanPembelajaran);
  const phrase2 = matchedTps[1]
    ? cleanTpPhrase(matchedTps[1].tujuanPembelajaran)
    : matchedTps.length > 2
    ? cleanTpPhrase(matchedTps[2].tujuanPembelajaran)
    : '';

  let deskripsiRapor = '';
  let deskripsiTercapai = '';
  let deskripsiPerluPeningkatan = '';

  if (nilaiAkhir >= 85) {
    if (phrase2) {
      deskripsiRapor = `Menunjukkan penguasaan yang sangat baik dalam ${phrase1} serta terampil dalam ${phrase2}.`;
    } else {
      deskripsiRapor = `Menunjukkan penguasaan yang sangat baik dalam ${phrase1} secara mandiri dan percaya diri.`;
    }
    deskripsiTercapai = `Sangat baik dalam ${phrase1}.`;
    deskripsiPerluPeningkatan = `Pertahankan prestasi dan lanjutkan pengayaan mandiri.`;
  } else if (nilaiAkhir >= 75) {
    if (phrase2) {
      deskripsiRapor = `Menunjukkan penguasaan yang baik dalam ${phrase1} dan mampu menyelesaikan ${phrase2} secara mandiri.`;
    } else {
      deskripsiRapor = `Menunjukkan penguasaan yang baik dalam ${phrase1}.`;
    }
    deskripsiTercapai = `Menguasai dengan baik dalam ${phrase1}.`;
    deskripsiPerluPeningkatan = phrase2 ? `Perlu pembiasaan lebih lanjut dalam ${phrase2}.` : `Perlu ketelitian dalam pengerjaan tugas.`;
  } else if (nilaiAkhir >= 65) {
    if (phrase2) {
      deskripsiRapor = `Cukup mampu dalam ${phrase1}, namun perlu bimbingan dan pembiasaan lebih lanjut dalam ${phrase2}.`;
    } else {
      deskripsiRapor = `Cukup mampu dalam ${phrase1}, namun perlu latihan dan pengulangan berkala.`;
    }
    deskripsiTercapai = `Cukup mampu dalam ${phrase1}.`;
    deskripsiPerluPeningkatan = phrase2 ? `Perlu bimbingan khusus dalam ${phrase2}.` : `Perlu peningkatan pemahaman materi secara berkala.`;
  } else {
    deskripsiRapor = `Perlu bimbingan dan pendampingan intensif dari guru maupun orang tua dalam ${phrase1}.`;
    deskripsiTercapai = `Mulai menunjukkan usaha belajar dalam ${phrase1}.`;
    deskripsiPerluPeningkatan = `Perlu bimbingan intensif dan remedial dalam ${phrase1}.`;
  }

  return {
    deskripsiRapor,
    deskripsiTercapai,
    deskripsiPerluPeningkatan,
    linkedTpKodes,
    matchedTps
  };
}

/**
 * Automatically adjusts the subject name for religion according to the student's religion
 * e.g. "Pendidikan Agama dan Budi Pekerti" + "Katolik" -> "Pendidikan Agama Katolik dan Budi Pekerti"
 */
export function getNamaPelajaranAgama(baseMapelName: string, agama?: string): string {
  if (!baseMapelName) return '';
  const lowerBase = baseMapelName.toLowerCase();
  if (!lowerBase.includes('agama')) {
    return baseMapelName;
  }
  const cleanAgama = (agama || '').trim();
  if (!cleanAgama) return baseMapelName;

  const lowerAgama = cleanAgama.toLowerCase();
  if (lowerBase.includes(lowerAgama)) {
    return baseMapelName;
  }

  // Indonesian standard Kurikulum Merdeka subject title for religion:
  return `Pendidikan Agama ${cleanAgama} dan Budi Pekerti`;
}
