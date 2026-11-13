import * as XLSX from 'xlsx';
import {
  DatabaseState,
  Student,
  Teacher,
  Subject,
  ClassData,
  LearningObjective,
  AcademicScore,
  Attendance,
  Extracurricular,
  TeacherNote,
  P5Project,
  P5Stage,
  P5DimensionItem,
  P5Score,
  PiagamAward,
  StudentDecision,
  SchoolIdentity,
  ClassLevel,
  SemesterType,
  FaseType,
  P5Predicate,
  getFaseFromKelas
} from '../types';

export interface ImportResult {
  success: boolean;
  templateId: string;
  templateName: string;
  importedCount: number;
  importedClasses?: ClassLevel[];
  message: string;
  errors?: string[];
}

/**
 * Format string tanggal dari Excel (bisa berupa serial number 42472 atau string tanggal)
 */
function parseExcelDate(val: any): string {
  if (!val) return '-';
  if (typeof val === 'number') {
    // Excel serial number date conversion
    const date = new Date((val - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return '-';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (!str || str === '-') return '-';
  // If DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  // If DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return str;
}

/**
 * Normalisasi nomor sel Excel ke string teks murni (menjaga angka 0 di depan NISN/NIP)
 */
function parseStringCell(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

/**
 * Normalisasi angka dari sel Excel/CSV (menangani koma decimal Indonesia '82,5' -> 82.5)
 */
function parseNumberCell(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Normalisasi nama kelas ke standar Romawi Kurikulum Merdeka (I, II, III, IV, V, VI, VII, ..., XIII)
 */
function normalizeKelas(rawVal: any, fallback: ClassLevel = 'IV'): ClassLevel {
  if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') return fallback;
  const str = String(rawVal)
    .toUpperCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/KELAS|KLS|ROMBEL/gi, ' ')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!str) return fallback;

  const exactMap: Record<string, ClassLevel> = {
    'I': 'I', '1': 'I', '1A': 'I', '1B': 'I', '1C': 'I', 'SATU': 'I',
    'II': 'II', '2': 'II', '2A': 'II', '2B': 'II', '2C': 'II', 'DUA': 'II',
    'III': 'III', '3': 'III', '3A': 'III', '3B': 'III', '3C': 'III', 'TIGA': 'III',
    'IV': 'IV', '4': 'IV', '4A': 'IV', '4B': 'IV', '4C': 'IV', 'EMPAT': 'IV',
    'V': 'V', '5': 'V', '5A': 'V', '5B': 'V', '5C': 'V', 'LIMA': 'V',
    'VI': 'VI', '6': 'VI', '6A': 'VI', '6B': 'VI', '6C': 'VI', 'ENAM': 'VI',
    'VII': 'VII', '7': 'VII', '7A': 'VII', '7B': 'VII', 'TUJUH': 'VII',
    'VIII': 'VIII', '8': 'VIII', '8A': 'VIII', '8B': 'VIII', 'DELAPAN': 'VIII',
    'IX': 'IX', '9': 'IX', '9A': 'IX', '9B': 'IX', 'SEMBILAN': 'IX',
    'X': 'X', '10': 'X', '10A': 'X', 'SEPULUH': 'X',
    'XI': 'XI', '11': 'XI', '11A': 'XI', 'SEBELAS': 'XI',
    'XII': 'XII', '12': 'XII', '12A': 'XII', 'DUA BELAS': 'XII',
    'XIII': 'XIII', '13': 'XIII', 'TIGA BELAS': 'XIII'
  };

  if (exactMap[str]) return exactMap[str];

  // Cek token pertama (misal "IV A" -> "IV", "4 A" -> "4")
  const tokens = str.split(' ');
  for (const tok of tokens) {
    if (exactMap[tok]) return exactMap[tok];
    const numMatch = tok.match(/^(\d{1,2})[A-Z]?$/);
    if (numMatch && exactMap[numMatch[1]]) return exactMap[numMatch[1]];
  }

  // Cek urutan angka Romawi dari terpanjang agar 'IV' tidak cocok sebagai 'I' atau 'V'
  const romanOrder: ClassLevel[] = ['XIII', 'XII', 'XI', 'VIII', 'VII', 'IX', 'VI', 'IV', 'III', 'II', 'X', 'V', 'I'];
  for (const rom of romanOrder) {
    if (new RegExp(`\\b${rom}\\b`).test(str)) return rom;
  }

  // Cek angka 1-13
  const digitMatch = str.match(/\b(1[0-3]|[1-9])\b/);
  if (digitMatch && exactMap[digitMatch[1]]) return exactMap[digitMatch[1]];

  return fallback;
}

/**
 * Normalisasi Semester (Ganjil / Genap)
 */
function normalizeSemester(rawVal: any, fallback: SemesterType = 'Ganjil'): SemesterType {
  if (!rawVal) return fallback;
  const str = String(rawVal).toLowerCase().trim();
  if (str.includes('genap') || str === '2') return 'Genap';
  if (str.includes('ganjil') || str === '1') return 'Ganjil';
  return fallback;
}

/**
 * Normalisasi Agama ke 6 agama resmi
 */
function normalizeAgama(rawVal: any, fallback = 'Kristen'): 'Islam' | 'Katolik' | 'Kristen' | 'Hindu' | 'Buddha' | 'Konghucu' {
  const str = String(rawVal || '').toLowerCase().trim();
  if (str.includes('islam')) return 'Islam';
  if (str.includes('katolik') || str.includes('katholik')) return 'Katolik';
  if (str.includes('kristen') || str.includes('protestan')) return 'Kristen';
  if (str.includes('hindu')) return 'Hindu';
  if (str.includes('buddha') || str.includes('budha')) return 'Buddha';
  if (str.includes('konghucu') || str.includes('khonghucu')) return 'Konghucu';
  return fallback as any;
}

/**
 * Membersihkan nama header kolom (menghapus nomor (1), tanda baca, kurung, whitespace berlebih)
 */
function cleanHeader(header: any): string {
  if (header === null || header === undefined) return '';
  return String(header)
    .toLowerCase()
    .replace(/\(\d+\)/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mencari baris header kolom yang sebenarnya dalam lembar Excel.
 * Menghindari baris judul/kop (yang biasanya hanya berisi 1-2 sel terisi).
 */
function findHeaderRowIndex(
  rows: (string | number)[][],
  expectedKeywords: string[][]
): { headerIdx: number; matchedHeaders: string[] } {
  let bestIdx = -1;
  let maxScore = 0;

  for (let r = 0; r < Math.min(rows.length, 35); r++) {
    const row = rows[r] || [];
    const cleanedCells = row.map(cleanHeader);
    const nonEmptyCells = cleanedCells.filter((c) => c.length > 0);
    // Abaikan baris judul / banner yang hanya punya 1 sel (misal "NAMA SEKOLAH: SD NEGERI BALIL")
    if (nonEmptyCells.length < 2) continue;

    let score = 0;
    for (const group of expectedKeywords) {
      const matched = nonEmptyCells.some((cell) => group.some((kw) => cell.includes(kw)));
      if (matched) score++;
    }

    // Bonus jika banyak sel pendek mirip header tabel (bukan paragraf panjang)
    const headerLikeBonus = nonEmptyCells.length >= 4 ? 0.5 : 0;
    const totalScore = score + headerLikeBonus;

    if (score >= 2 && totalScore > maxScore) {
      maxScore = totalScore;
      bestIdx = r;
    }
  }

  // Jika tidak ditemukan dengan kata kunci kompleks, fallback ke baris tabel yang punya minimal 2 kolom
  if (bestIdx < 0) {
    for (let r = 0; r < Math.min(rows.length, 20); r++) {
      const cells = (rows[r] || []).map(cleanHeader).filter(Boolean);
      if (cells.length < 2) continue;
      const rowStr = cells.join(' ');
      if (rowStr.includes('nama') || rowStr.includes('nisn') || rowStr.includes('kode') || rowStr.includes('mapel')) {
        bestIdx = r;
        break;
      }
    }
  }

  const finalIdx = bestIdx >= 0 ? bestIdx : 0;
  const headers = (rows[finalIdx] || []).map(cleanHeader);
  return { headerIdx: finalIdx, matchedHeaders: headers };
}

/**
 * Mencari indeks kolom berdasarkan daftar sinonim berprioritas dengan pengecualian (anti-tabrakan seperti 'nis' vs 'nisn', atau 'nama' vs 'nama ayah').
 */
function findColumnIndex(headers: string[], synonyms: string[], exclusions: string[] = []): number {
  const isExcluded = (h: string) => exclusions.some((ex) => h.includes(ex));

  // Pass 1: Kecocokan persis (exact match) berdasarkan urutan prioritas sinonim
  for (const syn of synonyms) {
    const idx = headers.findIndex((h) => h && !isExcluded(h) && h === syn);
    if (idx >= 0) return idx;
  }

  // Pass 2: Kecocokan kata utuh (word boundary) berdasarkan urutan prioritas sinonim
  for (const syn of synonyms) {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`);
    const idx = headers.findIndex((h) => h && !isExcluded(h) && regex.test(h));
    if (idx >= 0) return idx;
  }

  // Pass 3: Kecocokan substring berdasarkan urutan prioritas sinonim
  for (const syn of synonyms) {
    const idx = headers.findIndex((h) => h && !isExcluded(h) && h.includes(syn));
    if (idx >= 0) return idx;
  }

  return -1;
}

/**
 * Mengecek apakah baris adalah baris penomoran standar kurikulum merdeka: (1), (2), (3)...
 */
function isNumberingRow(row: any[]): boolean {
  if (!row || row.length === 0) return false;
  const nonEmpties = row.filter((c) => c !== undefined && c !== null && String(c).trim().length > 0);
  if (nonEmpties.length === 0) return false;
  const countNumbered = nonEmpties.filter((c) => /^\(?\d+\)?$/.test(String(c).trim())).length;
  return countNumbered / nonEmpties.length >= 0.7;
}

/**
 * Auto-detect templateId jika tidak ditentukan secara eksplisit
 */
export function detectTemplateId(
  fileName: string,
  sheetName: string,
  headersStr: string
): string {
  const combined = `${fileName.toLowerCase()} ${sheetName.toLowerCase()} ${headersStr.toLowerCase()}`;

  if (combined.includes('kkm') || combined.includes('kompleksitas') || combined.includes('daya dukung')) {
    return 'template_kkm';
  }
  if (combined.includes('guru') || combined.includes('pendidik') || combined.includes('wali kelas iv')) {
    return 'template_guru';
  }
  if (combined.includes('kehadiran') || combined.includes('presensi') || combined.includes('alpa') || combined.includes('sakit')) {
    return 'template_kehadiran';
  }
  if (combined.includes('ekskul') || combined.includes('ekstrakurikuler') || combined.includes('pramuka')) {
    return 'template_ekskul';
  }
  if (combined.includes('catatan wali') || combined.includes('catatan')) {
    return 'template_catatan_wali';
  }
  if (combined.includes('piagam') || combined.includes('penghargaan') || combined.includes('prestasi')) {
    return 'template_piagam';
  }
  if (combined.includes('tahapan') || combined.includes('alur projek')) {
    return 'template_p5_tahapan';
  }
  if (combined.includes('dimensi') || combined.includes('elemen') || combined.includes('sub elemen')) {
    return 'template_p5_dimensi';
  }
  if (combined.includes('nilai p5') || combined.includes('capaian projek') || (combined.includes('p5') && (combined.includes('bb') || combined.includes('bsh')))) {
    return 'template_p5_nilai';
  }
  if (combined.includes('projek') || combined.includes('p5')) {
    return 'template_p5';
  }
  if (combined.includes('tujuan pembelajaran') || combined.includes('kode tp') || combined.includes('rumusan tp')) {
    return 'template_tp';
  }
  if (combined.includes('deskripsi') || combined.includes('capaian kompetensi') || combined.includes('tercapai')) {
    return 'template_deskripsi_rapor';
  }
  if (combined.includes('pts') || combined.includes('tengah semester')) {
    return 'template_nilai_pts';
  }
  if (combined.includes('formatif') || combined.includes('sumatif') || combined.includes('nilai akhir')) {
    return 'template_nilai_akademik';
  }
  if (combined.includes('keputusan') || combined.includes('naik kelas') || combined.includes('tinggal kelas')) {
    return 'template_keputusan_siswa';
  }
  if (combined.includes('rombongan') || (combined.includes('kelas') && combined.includes('fase') && !combined.includes('siswa'))) {
    return 'template_kelas';
  }
  if (combined.includes('mata pelajaran') || combined.includes('kurikulum') || combined.includes('mapel')) {
    return 'template_mapel';
  }
  if (combined.includes('npsn') || combined.includes('identitas sekolah') || combined.includes('kepala sekolah')) {
    return 'template_sekolah';
  }
  if (combined.includes('siswa') || combined.includes('peserta didik') || combined.includes('nisn')) {
    return 'template_siswa';
  }
  return 'template_siswa';
}

/**
 * FUNGSI UTAMA: Parsing dan Impor Seluruh Jenis Template Data
 */
export async function parseAndImportTemplate(
  file: File,
  targetTemplateId: string | undefined,
  appContext: any
): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        templateId: targetTemplateId || 'unknown',
        templateName: 'Tidak Diketahui',
        importedCount: 0,
        message: 'File kosong atau tidak memiliki lembar data (sheet) yang valid.'
      };
    }

    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        templateId: targetTemplateId || 'unknown',
        templateName: 'Lembar Kosong',
        importedCount: 0,
        message: 'Tidak ada baris data yang ditemukan di dalam file.'
      };
    }

    // Auto deteksi templateId bila belum ada atau generik
    let effectiveTemplateId = targetTemplateId;
    if (!effectiveTemplateId || effectiveTemplateId === 'universal' || effectiveTemplateId === 'auto') {
      const sampleHeaders = rawRows.slice(0, 15).flat().join(' ');
      effectiveTemplateId = detectTemplateId(file.name, firstSheetName, sampleHeaders);
    }

    const currentYear = appContext.db?.sekolah?.tahunPelajaran || '2026/2027';
    const currentSemester = appContext.selectedSemester || 'Ganjil';
    const currentKelas = appContext.selectedKelas || 'IV';

    switch (effectiveTemplateId) {
      // 1. DATA SISWA / IDENTITAS SISWA
      case 'template_siswa':
      case 'template_identitas_siswa':
      case 'template_rapor_peserta_didik': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn', 'nis', 'no induk'],
          ['nama lengkap siswa', 'nama siswa', 'nama lengkap', 'nama peserta didik', 'nama'],
          ['jk', 'kelamin', 'l p'],
          ['agama', 'tempat lahir', 'tanggal lahir', 'tgl lahir', 'kelas', 'alamat', 'ayah', 'ibu']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const nisCol = findColumnIndex(matchedHeaders, ['nis', 'no induk'], ['nisn']);
        const namaCol = findColumnIndex(
          matchedHeaders,
          ['nama lengkap siswa', 'nama siswa', 'nama lengkap', 'nama peserta didik', 'peserta didik', 'nama'],
          ['sekolah', 'ayah', 'ibu', 'wali', 'orang tua']
        );
        const jkCol = findColumnIndex(matchedHeaders, ['jenis kelamin', 'jk l p', 'jk', 'kelamin', 'l p']);
        const agamaCol = findColumnIndex(matchedHeaders, ['agama']);
        const tempatCol = findColumnIndex(matchedHeaders, ['tempat lahir', 'tempat'], ['rapor']);
        const tglCol = findColumnIndex(matchedHeaders, ['tanggal lahir', 'tgl lahir', 'ttl', 'tanggal'], ['rapor']);
        const nikCol = findColumnIndex(matchedHeaders, ['nik']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas', 'rombel'], ['wali']);
        const faseCol = findColumnIndex(matchedHeaders, ['fase']);
        const semCol = findColumnIndex(matchedHeaders, ['semester']);
        const ayahCol = findColumnIndex(matchedHeaders, ['nama ayah', 'ayah'], ['pekerjaan']);
        const ibuCol = findColumnIndex(matchedHeaders, ['nama ibu', 'ibu'], ['pekerjaan']);
        const pekerjaanAyahCol = findColumnIndex(matchedHeaders, ['pekerjaan ayah', 'kerja ayah']);
        const pekerjaanIbuCol = findColumnIndex(matchedHeaders, ['pekerjaan ibu', 'kerja ibu']);
        const namaWaliCol = findColumnIndex(matchedHeaders, ['nama wali', 'wali peserta didik', 'wali siswa'], ['kelas', 'pekerjaan', 'alamat', 'catatan']);
        const pekerjaanWaliCol = findColumnIndex(matchedHeaders, ['pekerjaan wali', 'kerja wali']);
        const alamatWaliCol = findColumnIndex(matchedHeaders, ['alamat wali', 'domisili wali']);
        const sekolahAsalCol = findColumnIndex(matchedHeaders, ['pendidikan sebelumnya', 'sekolah asal', 'asal sekolah']);
        const alamatCol = findColumnIndex(matchedHeaders, ['alamat peserta didik', 'alamat siswa', 'alamat jalan ortu', 'alamat', 'domisili'], ['sekolah', 'wali']);
        const statusCol = findColumnIndex(matchedHeaders, ['status siswa', 'status']);

        const existingStudents: Student[] = appContext.db?.siswa || [];
        const studentsToSave: Student[] = [];
        const importedClassSet = new Set<ClassLevel>();

        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          // Tentukan nama siswa (gunakan kolom nama jika ketemu, atau cari kolom teks wajar)
          const rawNama = namaCol >= 0 ? row[namaCol] : (row[3] || row[2] || row[1]);
          const nama = parseStringCell(rawNama);
          const lowerNama = nama.toLowerCase();
          if (
            !nama ||
            lowerNama === '-' ||
            lowerNama === 'nama siswa' ||
            lowerNama === 'nama lengkap siswa' ||
            lowerNama.includes('contoh') ||
            lowerNama.includes('format pengisian') ||
            /^\(?\d+\)?$/.test(nama)
          ) {
            continue;
          }

          let rawNisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : (row[1] ?? ''));
          if (rawNisn === '-' || rawNisn.toLowerCase().includes('belum ada') || rawNisn.toLowerCase().includes('kosong')) {
            rawNisn = '';
          }

          const rawKelas = kelasCol >= 0 ? row[kelasCol] : currentKelas;
          const kelas = normalizeKelas(rawKelas, currentKelas);
          importedClassSet.add(kelas);

          // Cari siswa yang sudah ada berdasarkan NISN valid atau (Nama + Kelas) agar tidak duplikat
          const matchedExisting = existingStudents.find((s) => {
            if (rawNisn && !rawNisn.startsWith('BLM_') && s.nisn === rawNisn) return true;
            return s.namaSiswa.trim().toLowerCase() === lowerNama && s.kelas === kelas;
          });

          const baseId = matchedExisting?.idSiswa || `S_IMP_${Date.now()}_${r}`;
          const finalNisn = rawNisn || matchedExisting?.nisn || `BLM_${baseId}`;

          const rawJk = parseStringCell(jkCol >= 0 ? row[jkCol] : (matchedExisting?.jenisKelamin || 'L')).toUpperCase();
          const jk: 'L' | 'P' =
            rawJk === 'P' || rawJk.startsWith('PEREMPUAN') || rawJk.startsWith('PR') || rawJk.startsWith('WANITA')
              ? 'P'
              : 'L';

          const rawFase = faseCol >= 0 ? parseStringCell(row[faseCol]).toUpperCase().replace('FASE', '').trim() : '';
          const fase = (['A', 'B', 'C', 'D', 'E', 'F'].includes(rawFase) ? rawFase : getFaseFromKelas(kelas)) as FaseType;

          const rawStatus = parseStringCell(statusCol >= 0 ? row[statusCol] : (matchedExisting?.statusSiswa || 'Aktif'));
          const statusSiswa: 'Aktif' | 'Mutasi' | 'Lulus' =
            rawStatus.toLowerCase().includes('mutasi')
              ? 'Mutasi'
              : rawStatus.toLowerCase().includes('lulus')
              ? 'Lulus'
              : 'Aktif';

          const parseOptionalField = (colIdx: number, fallback?: string): string => {
            if (colIdx < 0) return fallback || '';
            const parsed = parseStringCell(row[colIdx]);
            if (!parsed || parsed === '_' || parsed === '-') return '';
            return parsed;
          };

          const student: Student = {
            idSiswa: baseId,
            nisn: finalNisn,
            nis: parseStringCell(nisCol >= 0 ? row[nisCol] : (matchedExisting?.nis || '-'), '-') || '-',
            namaSiswa: nama,
            jenisKelamin: jk,
            tempatLahir: parseStringCell(tempatCol >= 0 ? row[tempatCol] : (matchedExisting?.tempatLahir || '-'), '-') || '-',
            tanggalLahir: tglCol >= 0 && row[tglCol] ? parseExcelDate(row[tglCol]) : (matchedExisting?.tanggalLahir || '-'),
            nik: parseStringCell(nikCol >= 0 ? row[nikCol] : (matchedExisting?.nik || '-'), '-') || '-',
            agama: normalizeAgama(agamaCol >= 0 ? row[agamaCol] : (matchedExisting?.agama || 'Kristen')),
            kelas,
            fase,
            semester: semCol >= 0 ? normalizeSemester(row[semCol], currentSemester) : currentSemester,
            tahunPelajaran: currentYear,
            namaAyah: parseStringCell(ayahCol >= 0 ? row[ayahCol] : (matchedExisting?.namaAyah || '-'), '-') || '-',
            namaIbu: parseStringCell(ibuCol >= 0 ? row[ibuCol] : (matchedExisting?.namaIbu || '-'), '-') || '-',
            pekerjaanAyah: parseOptionalField(pekerjaanAyahCol, matchedExisting?.pekerjaanAyah),
            pekerjaanIbu: parseOptionalField(pekerjaanIbuCol, matchedExisting?.pekerjaanIbu),
            namaWali: parseOptionalField(namaWaliCol, matchedExisting?.namaWali),
            pekerjaanWali: parseOptionalField(pekerjaanWaliCol, matchedExisting?.pekerjaanWali),
            alamatWali: parseOptionalField(alamatWaliCol, matchedExisting?.alamatWali),
            sekolahAsal: parseOptionalField(sekolahAsalCol, matchedExisting?.sekolahAsal),
            alamat: parseStringCell(alamatCol >= 0 ? row[alamatCol] : (matchedExisting?.alamat || 'Kampung Balil'), 'Kampung Balil') || 'Kampung Balil',
            statusSiswa
          };

          studentsToSave.push(student);
        }

        if (studentsToSave.length === 0) {
          return {
            success: false,
            templateId: 'template_siswa',
            templateName: 'Data Siswa',
            importedCount: 0,
            message: 'Tidak ada baris siswa yang valid untuk diimpor. Pastikan kolom Nama Siswa terisi pada file Excel/CSV Anda.'
          };
        }

        appContext.saveSiswaBatch(studentsToSave);
        const importedClasses = Array.from(importedClassSet);
        return {
          success: true,
          templateId: 'template_siswa',
          templateName: 'Data Siswa (Peserta Didik)',
          importedCount: studentsToSave.length,
          importedClasses,
          message: `Berhasil mengimpor ${studentsToSave.length} data siswa (Kelas ${importedClasses.join(', ')})! Seluruh relasi ke kelas, mapel agama, nilai, kehadiran, dan catatan rapor otomatis terhubung.`
        };
      }

      // 2. DATA GURU & TENAGA PENDIDIK
      case 'template_guru': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['guru', 'nama pendidik', 'nama'],
          ['nip', 'status', 'pendidikan'],
          ['jabatan', 'mapel', 'kelas', 'hp']
        ]);

        const namaCol = findColumnIndex(matchedHeaders, ['nama guru', 'nama', 'guru']);
        const nipCol = findColumnIndex(matchedHeaders, ['nip']);
        const jkCol = findColumnIndex(matchedHeaders, ['jenis kelamin', 'jk', 'l p']);
        const pendCol = findColumnIndex(matchedHeaders, ['pendidikan', 'ijazah']);
        const jabCol = findColumnIndex(matchedHeaders, ['jabatan', 'tugas']);
        const mapelCol = findColumnIndex(matchedHeaders, ['mata pelajaran', 'mapel']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas', 'rombel']);
        const statusCol = findColumnIndex(matchedHeaders, ['status']);
        const hpCol = findColumnIndex(matchedHeaders, ['no hp', 'hp', 'wa', 'telepon']);

        const teachersToSave: Teacher[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[1]);
          if (!nama || nama.toLowerCase().includes('contoh')) continue;

          const rawJk = parseStringCell(jkCol >= 0 ? row[jkCol] : 'L').toUpperCase();
          const jk = rawJk.startsWith('P') ? 'P' : 'L';
          const rawKelas = kelasCol >= 0 ? row[kelasCol] : 'IV';
          const kelas = normalizeKelas(rawKelas, 'IV');

          const teacher: Teacher = {
            idGuru: `GURU_${Date.now()}_${teachersToSave.length}`,
            namaGuru: nama,
            nip: parseStringCell(nipCol >= 0 ? row[nipCol] : '-'),
            jenisKelamin: jk,
            tempatLahir: 'Oksibil',
            tanggalLahir: '1985-01-01',
            pendidikan: parseStringCell(pendCol >= 0 ? row[pendCol] : 'S1 PGSD', 'S1 PGSD'),
            jabatan: parseStringCell(jabCol >= 0 ? row[jabCol] : `Wali Kelas ${kelas}`, `Wali Kelas ${kelas}`),
            mataPelajaran: parseStringCell(mapelCol >= 0 ? row[mapelCol] : 'Guru Kelas', 'Guru Kelas'),
            kelas,
            status: parseStringCell(statusCol >= 0 ? row[statusCol] : 'PNS', 'PNS'),
            noHp: parseStringCell(hpCol >= 0 ? row[hpCol] : '081248000000')
          };
          teachersToSave.push(teacher);
        }

        if (teachersToSave.length === 0) {
          return {
            success: false,
            templateId: 'template_guru',
            templateName: 'Data Guru',
            importedCount: 0,
            message: 'Tidak ada baris guru yang valid dalam file.'
          };
        }

        appContext.saveGuruBatch(teachersToSave);
        return {
          success: true,
          templateId: 'template_guru',
          templateName: 'Data Guru & Tenaga Pendidik',
          importedCount: teachersToSave.length,
          message: `Berhasil mengimpor ${teachersToSave.length} data guru ke sistem sekolah!`
        };
      }

      // 3. MATA PELAJARAN
      case 'template_mapel': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['mata pelajaran', 'nama mapel', 'mapel'],
          ['kelompok', 'kurikulum'],
          ['urutan', 'kkm', 'no']
        ]);

        const mapelCol = findColumnIndex(matchedHeaders, ['mata pelajaran', 'nama mapel', 'mapel']);
        const kelompokCol = findColumnIndex(matchedHeaders, ['kelompok', 'kategori']);
        const urutanCol = findColumnIndex(matchedHeaders, ['urutan', 'nomor urut', 'no']);
        const kkmCol = findColumnIndex(matchedHeaders, ['kkm', 'kktp']);

        const mapelToSave: Subject[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nama = parseStringCell(mapelCol >= 0 ? row[mapelCol] : row[1]);
          if (!nama || nama.toLowerCase().includes('contoh')) continue;

          const rawKelompok = parseStringCell(kelompokCol >= 0 ? row[kelompokCol] : 'Wajib');
          let kelompok: 'Wajib' | 'Pilihan' | 'Muatan Lokal' = 'Wajib';
          if (rawKelompok.toLowerCase().includes('pilihan')) kelompok = 'Pilihan';
          else if (rawKelompok.toLowerCase().includes('muatan') || rawKelompok.toLowerCase().includes('mulok')) kelompok = 'Muatan Lokal';

          const urutan = urutanCol >= 0 ? parseNumberCell(row[urutanCol], mapelToSave.length + 1) : mapelToSave.length + 1;
          const kkm = kkmCol >= 0 ? parseNumberCell(row[kkmCol], 75) : 75;

          mapelToSave.push({
            kode: `MAPEL_${nama.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15)}`,
            mataPelajaran: nama,
            kelompok,
            urutan,
            kkm
          });
        }

        if (mapelToSave.length === 0) {
          return {
            success: false,
            templateId: 'template_mapel',
            templateName: 'Mata Pelajaran',
            importedCount: 0,
            message: 'Tidak ada baris mata pelajaran yang dapat diimpor.'
          };
        }

        appContext.bulkSaveMataPelajaran(mapelToSave);
        return {
          success: true,
          templateId: 'template_mapel',
          templateName: 'Mata Pelajaran',
          importedCount: mapelToSave.length,
          message: `Berhasil mengimpor ${mapelToSave.length} mata pelajaran ke struktur kurikulum!`
        };
      }

      // 4. KKM SEMUA PELAJARAN
      case 'template_kkm': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['mata pelajaran', 'nama mapel', 'mapel'],
          ['kkm', 'nilai kkm', 'kktp'],
          ['kompleksitas', 'daya dukung', 'intake', 'kode']
        ]);

        const mapelCol = findColumnIndex(matchedHeaders, ['mata pelajaran', 'nama mapel', 'mapel']);
        const kodeCol = findColumnIndex(matchedHeaders, ['kode mapel', 'kode']);
        const kelompokCol = findColumnIndex(matchedHeaders, ['kelompok']);
        const kompCol = findColumnIndex(matchedHeaders, ['kompleksitas']);
        const dayaCol = findColumnIndex(matchedHeaders, ['daya dukung', 'daya']);
        const intakeCol = findColumnIndex(matchedHeaders, ['intake']);
        const kkmCol = findColumnIndex(matchedHeaders, ['nilai kkm', 'kkm', 'kktp']);

        const updatedMapel: Subject[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nama = parseStringCell(mapelCol >= 0 ? row[mapelCol] : row[2]);
          if (!nama || nama.toLowerCase().includes('contoh')) continue;

          const kkmVal = kkmCol >= 0 ? parseNumberCell(row[kkmCol], 75) : 75;
          const kompVal = kompCol >= 0 ? parseNumberCell(row[kompCol], kkmVal) : kkmVal;
          const dayaVal = dayaCol >= 0 ? parseNumberCell(row[dayaCol], kkmVal) : kkmVal;
          const intakeVal = intakeCol >= 0 ? parseNumberCell(row[intakeCol], kkmVal) : kkmVal;

          updatedMapel.push({
            kode: kodeCol >= 0 && row[kodeCol] ? String(row[kodeCol]) : `MAPEL_${nama.slice(0, 4).toUpperCase()}`,
            mataPelajaran: nama,
            kelompok: kelompokCol >= 0 ? (parseStringCell(row[kelompokCol], 'Wajib') as any) : 'Wajib',
            urutan: updatedMapel.length + 1,
            kkm: kkmVal,
            kompleksitas: kompVal,
            dayaDukung: dayaVal,
            intake: intakeVal
          });
        }

        if (updatedMapel.length === 0) {
          return {
            success: false,
            templateId: 'template_kkm',
            templateName: 'KKM Semua Pelajaran',
            importedCount: 0,
            message: 'Tidak ada data KKM yang ditemukan.'
          };
        }

        appContext.bulkSaveMataPelajaran(updatedMapel);
        return {
          success: true,
          templateId: 'template_kkm',
          templateName: 'KKM Semua Mata Pelajaran',
          importedCount: updatedMapel.length,
          message: `Berhasil mengimpor & memperbarui KKM untuk ${updatedMapel.length} mata pelajaran dan disinkronkan ke seluruh rapor!`
        };
      }

      // 5. TUJUAN PEMBELAJARAN (TP)
      case 'template_tp': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['kode tp', 'kode'],
          ['mata pelajaran', 'mapel'],
          ['rumusan', 'tujuan pembelajaran', 'tp', 'indikator', 'materi']
        ]);

        const kodeCol = findColumnIndex(matchedHeaders, ['kode tp', 'kode']);
        const mapelCol = findColumnIndex(matchedHeaders, ['mata pelajaran', 'mapel']);
        const faseCol = findColumnIndex(matchedHeaders, ['fase']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas']);
        const tpCol = findColumnIndex(matchedHeaders, ['rumusan tujuan', 'tujuan pembelajaran', 'rumusan', 'tp']);

        const tpList: LearningObjective[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const tpText = parseStringCell(tpCol >= 0 ? row[tpCol] : row[4] || row[5]);
          if (!tpText || tpText.length < 5 || tpText.toLowerCase().includes('contoh')) continue;

          const mapel = parseStringCell(mapelCol >= 0 ? row[mapelCol] : 'Bahasa Indonesia');
          const rawKelas = kelasCol >= 0 ? row[kelasCol] : currentKelas;
          const kelas = normalizeKelas(rawKelas, currentKelas);
          const fase = (faseCol >= 0 && row[faseCol] ? String(row[faseCol]).toUpperCase().trim() : getFaseFromKelas(kelas)) as FaseType;
          const kodeTp = parseStringCell(kodeCol >= 0 ? row[kodeCol] : `TP00${tpList.length + 1}`);

          tpList.push({
            id: `TP_${Date.now()}_${tpList.length}`,
            kodeTp,
            mataPelajaran: mapel,
            fase,
            kelas,
            tujuanPembelajaran: tpText
          });
        }

        if (tpList.length === 0) {
          return {
            success: false,
            templateId: 'template_tp',
            templateName: 'Tujuan Pembelajaran',
            importedCount: 0,
            message: 'Tidak ada baris Tujuan Pembelajaran (TP) yang valid.'
          };
        }

        if (appContext.bulkSaveTujuanPembelajaran) {
          appContext.bulkSaveTujuanPembelajaran(tpList);
        } else {
          tpList.forEach((tp) => appContext.saveTP(tp));
        }

        return {
          success: true,
          templateId: 'template_tp',
          templateName: 'Tujuan Pembelajaran (TP)',
          importedCount: tpList.length,
          message: `Berhasil mengimpor ${tpList.length} rumusan Tujuan Pembelajaran (TP)!`
        };
      }

      // 6. NILAI AKADEMIK FORMATIF & SUMATIF / RAPOR AKADEMIK / REKAP LEGER
      case 'template_nilai':
      case 'template_nilai_akademik':
      case 'template_rapor_akhir':
      case 'template_rekap_nilai': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn'],
          ['nama', 'siswa'],
          ['formatif', 'sumatif', 'nilai akhir', 'akhir', 'mapel', 'mata pelajaran']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas']);
        const semCol = findColumnIndex(matchedHeaders, ['semester']);
        const mapelCol = findColumnIndex(matchedHeaders, ['mata pelajaran', 'mapel']);
        const formatifCol = findColumnIndex(matchedHeaders, ['formatif', 'nilai formatif']);
        const sumatifCol = findColumnIndex(matchedHeaders, ['sumatif', 'nilai sumatif']);
        const naCol = findColumnIndex(matchedHeaders, ['nilai akhir', 'akhir', 'na']);
        const predCol = findColumnIndex(matchedHeaders, ['predikat']);
        const capaianCol = findColumnIndex(matchedHeaders, ['capaian kompetensi', 'capaian']);
        const descCol = findColumnIndex(matchedHeaders, ['deskripsi', 'deskripsi capaian', 'narasi']);

        const scoresToSave: AcademicScore[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : row[1]);
          if (!nisn || nisn.toLowerCase().includes('contoh')) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[2]);
          const rawKelas = kelasCol >= 0 ? row[kelasCol] : currentKelas;
          const kelas = normalizeKelas(rawKelas, currentKelas);
          const semester = semCol >= 0 ? normalizeSemester(row[semCol], currentSemester) : currentSemester;
          const mapel = parseStringCell(mapelCol >= 0 ? row[mapelCol] : 'Bahasa Indonesia');

          const formatif = formatifCol >= 0 ? parseNumberCell(row[formatifCol], 80) : 80;
          const sumatif = sumatifCol >= 0 ? parseNumberCell(row[sumatifCol], 80) : 80;
          let na = naCol >= 0 ? parseNumberCell(row[naCol], Math.round((formatif + sumatif) / 2)) : Math.round((formatif + sumatif) / 2);
          if (na === 0 && (formatif > 0 || sumatif > 0)) {
            na = Math.round((formatif + sumatif) / 2);
          }

          const predikat = na >= 88 ? 'Sangat Baik' : na >= 78 ? 'Baik' : na >= 68 ? 'Cukup' : 'Perlu Bimbingan';
          const capaian = na >= 88 ? 'Sangat Baik' : na >= 78 ? 'Baik' : na >= 68 ? 'Cukup' : 'Perlu Pendampingan';
          const deskripsi = descCol >= 0 && row[descCol] ? parseStringCell(row[descCol]) : `Menunjukkan penguasaan yang sangat baik dalam memahami materi pokok ${mapel}.`;

          scoresToSave.push({
            idNilai: `N_${nisn}_${mapel.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 8)}_${semester}`,
            tahunPelajaran: currentYear,
            semester,
            kelas,
            nisn,
            namaSiswa: nama || 'Siswa',
            mataPelajaran: mapel,
            formatif,
            sumatif,
            nilaiAkhir: na,
            predikat: (predCol >= 0 && row[predCol] ? parseStringCell(row[predCol]) : predikat) as any,
            capaianKompetensi: (capaianCol >= 0 && row[capaianCol] ? parseStringCell(row[capaianCol]) : capaian) as any,
            deskripsiTercapai: deskripsi,
            deskripsiPerluPeningkatan: 'Perlu latihan lebih lanjut pada pengayaan materi.',
            deskripsiRapor: deskripsi
          });
        }

        if (scoresToSave.length === 0) {
          return {
            success: false,
            templateId: 'template_nilai',
            templateName: 'Nilai Akademik',
            importedCount: 0,
            message: 'Tidak ada baris nilai yang dapat diimpor.'
          };
        }

        appContext.bulkSaveNilai(scoresToSave);
        return {
          success: true,
          templateId: 'template_nilai_akademik',
          templateName: 'Nilai Akademik & Rapor',
          importedCount: scoresToSave.length,
          message: `Berhasil mengimpor ${scoresToSave.length} data nilai akademik & capaian rapor!`
        };
      }

      // 7. DESKRIPSI CAPAIAN RAPOR
      case 'template_deskripsi_rapor':
      case 'template_deskripsi': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn'],
          ['nama', 'siswa'],
          ['mapel', 'mata pelajaran'],
          ['deskripsi', 'kekuatan', 'tercapai', 'narasi']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const mapelCol = findColumnIndex(matchedHeaders, ['mata pelajaran', 'mapel']);
        const naCol = findColumnIndex(matchedHeaders, ['nilai akhir', 'akhir']);
        const capCol = findColumnIndex(matchedHeaders, ['capaian kompetensi', 'capaian']);
        const tertingCol = findColumnIndex(matchedHeaders, ['kekuatan', 'capaian tertinggi', 'tercapai']);
        const perluCol = findColumnIndex(matchedHeaders, ['perlu peningkatan', 'peningkatan']);
        const descCol = findColumnIndex(matchedHeaders, ['deskripsi rapor', 'narasi', 'deskripsi']);

        const descUpdates: AcademicScore[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : row[1]);
          if (!nisn || nisn.toLowerCase().includes('contoh')) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[2]);
          const mapel = parseStringCell(mapelCol >= 0 ? row[mapelCol] : 'Bahasa Indonesia');
          const na = naCol >= 0 ? parseNumberCell(row[naCol], 80) : 80;
          const deskripsi = parseStringCell(descCol >= 0 ? row[descCol] : row[row.length - 1]);
          const tercapai = parseStringCell(tertingCol >= 0 ? row[tertingCol] : deskripsi);
          const peningkatan = parseStringCell(perluCol >= 0 ? row[perluCol] : 'Perlu pendampingan berkala.');

          descUpdates.push({
            idNilai: `N_${nisn}_${mapel.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 8)}_${currentSemester}`,
            tahunPelajaran: currentYear,
            semester: currentSemester,
            kelas: currentKelas,
            nisn,
            namaSiswa: nama || 'Siswa',
            mataPelajaran: mapel,
            formatif: na,
            sumatif: na,
            nilaiAkhir: na,
            predikat: na >= 88 ? 'Sangat Baik' : na >= 78 ? 'Baik' : na >= 68 ? 'Cukup' : 'Perlu Bimbingan',
            capaianKompetensi: capCol >= 0 && row[capCol] ? (parseStringCell(row[capCol]) as any) : 'Baik',
            deskripsiTercapai: tercapai,
            deskripsiPerluPeningkatan: peningkatan,
            deskripsiRapor: deskripsi || tercapai
          });
        }

        if (descUpdates.length === 0) {
          return {
            success: false,
            templateId: 'template_deskripsi_rapor',
            templateName: 'Deskripsi Capaian Rapor',
            importedCount: 0,
            message: 'Tidak ada baris deskripsi rapor yang ditemukan.'
          };
        }

        appContext.bulkSaveNilai(descUpdates);
        return {
          success: true,
          templateId: 'template_deskripsi_rapor',
          templateName: 'Deskripsi Capaian Rapor',
          importedCount: descUpdates.length,
          message: `Berhasil mengimpor ${descUpdates.length} deskripsi capaian rapor dan menghubungkannya ke rapor siswa!`
        };
      }

      // 8. PRESENSI KEHADIRAN SISWA
      case 'template_kehadiran': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn'],
          ['nama', 'siswa'],
          ['sakit', 'izin', 'alpa', 'tanpa keterangan']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas']);
        const semCol = findColumnIndex(matchedHeaders, ['semester']);
        const sakitCol = findColumnIndex(matchedHeaders, ['sakit', 's']);
        const izinCol = findColumnIndex(matchedHeaders, ['izin', 'i']);
        const alpaCol = findColumnIndex(matchedHeaders, ['alpa', 'tanpa keterangan', 'a', 'tk']);

        const attendancesToSave: Attendance[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : row[1]);
          if (!nisn || nisn.toLowerCase().includes('contoh')) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[2]);
          const rawKelas = kelasCol >= 0 ? row[kelasCol] : currentKelas;
          const kelas = normalizeKelas(rawKelas, currentKelas);
          const semester = semCol >= 0 ? normalizeSemester(row[semCol], currentSemester) : currentSemester;

          const sakit = sakitCol >= 0 ? parseNumberCell(row[sakitCol], 0) : 0;
          const izin = izinCol >= 0 ? parseNumberCell(row[izinCol], 0) : 0;
          const alpa = alpaCol >= 0 ? parseNumberCell(row[alpaCol], 0) : 0;

          attendancesToSave.push({
            id: `ATT_${nisn}_${semester}`,
            nisn,
            namaSiswa: nama || 'Siswa',
            kelas,
            semester,
            tahunPelajaran: currentYear,
            sakit,
            izin,
            alpa,
            totalHari: sakit + izin + alpa
          });
        }

        if (attendancesToSave.length === 0) {
          return {
            success: false,
            templateId: 'template_kehadiran',
            templateName: 'Presensi Kehadiran',
            importedCount: 0,
            message: 'Tidak ada baris data kehadiran yang dapat diimpor.'
          };
        }

        if (appContext.bulkSaveKehadiran) {
          appContext.bulkSaveKehadiran(attendancesToSave);
        } else {
          attendancesToSave.forEach((att) => appContext.saveKehadiran(att));
        }

        return {
          success: true,
          templateId: 'template_kehadiran',
          templateName: 'Presensi Kehadiran Siswa',
          importedCount: attendancesToSave.length,
          message: `Berhasil mengimpor data kehadiran untuk ${attendancesToSave.length} siswa!`
        };
      }

      // 9. EKSTRAKURIKULER
      case 'template_ekskul': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn'],
          ['nama', 'siswa'],
          ['ekstrakurikuler', 'ekskul', 'jenis'],
          ['predikat', 'keterangan']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas']);
        const semCol = findColumnIndex(matchedHeaders, ['semester']);
        const ekskulCol = findColumnIndex(matchedHeaders, ['jenis ekstrakurikuler', 'ekstrakurikuler', 'ekskul']);
        const predCol = findColumnIndex(matchedHeaders, ['predikat']);
        const ketCol = findColumnIndex(matchedHeaders, ['keterangan', 'deskripsi']);

        const ekskulList: Extracurricular[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : row[1]);
          if (!nisn || nisn.toLowerCase().includes('contoh')) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[2]);
          const rawKelas = kelasCol >= 0 ? row[kelasCol] : currentKelas;
          const kelas = normalizeKelas(rawKelas, currentKelas);
          const semester = semCol >= 0 ? normalizeSemester(row[semCol], currentSemester) : currentSemester;

          const jenis = parseStringCell(ekskulCol >= 0 ? row[ekskulCol] : 'Pramuka Siaga/Penggalang', 'Pramuka');
          const predikat = parseStringCell(predCol >= 0 ? row[predCol] : 'Baik', 'Baik') as any;
          const keterangan = parseStringCell(ketCol >= 0 ? row[ketCol] : 'Aktif dan disiplin mengikuti kegiatan');

          ekskulList.push({
            id: `EKS_${Date.now()}_${ekskulList.length}`,
            nisn,
            namaSiswa: nama || 'Siswa',
            kelas,
            semester,
            tahunPelajaran: currentYear,
            jenisEkstrakurikuler: jenis,
            predikat,
            keterangan
          });
        }

        if (ekskulList.length === 0) {
          return {
            success: false,
            templateId: 'template_ekskul',
            templateName: 'Ekstrakurikuler',
            importedCount: 0,
            message: 'Tidak ada baris ekstrakurikuler yang valid.'
          };
        }

        if (appContext.bulkSaveEkskul) {
          appContext.bulkSaveEkskul(ekskulList);
        } else {
          ekskulList.forEach((e) => appContext.saveEkskul(e));
        }

        return {
          success: true,
          templateId: 'template_ekskul',
          templateName: 'Ekstrakurikuler',
          importedCount: ekskulList.length,
          message: `Berhasil mengimpor ${ekskulList.length} data kegiatan ekstrakurikuler!`
        };
      }

      // 10. CATATAN WALI KELAS
      case 'template_catatan_wali': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn'],
          ['nama', 'siswa'],
          ['catatan', 'wali kelas', 'pesan', 'saran']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas']);
        const semCol = findColumnIndex(matchedHeaders, ['semester']);
        const catCol = findColumnIndex(matchedHeaders, ['catatan wali kelas', 'catatan', 'pesan']);

        const catatanList: TeacherNote[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : row[1]);
          if (!nisn || nisn.toLowerCase().includes('contoh')) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[2]);
          const rawKelas = kelasCol >= 0 ? row[kelasCol] : currentKelas;
          const kelas = normalizeKelas(rawKelas, currentKelas);
          const semester = semCol >= 0 ? normalizeSemester(row[semCol], currentSemester) : currentSemester;
          const catatan = parseStringCell(catCol >= 0 ? row[catCol] : row[row.length - 1]);

          if (!catatan || catatan.length < 3) continue;

          catatanList.push({
            id: `NOTE_${nisn}_${semester}`,
            nisn,
            namaSiswa: nama || 'Siswa',
            kelas,
            semester,
            tahunPelajaran: currentYear,
            catatanWaliKelas: catatan
          });
        }

        if (catatanList.length === 0) {
          return {
            success: false,
            templateId: 'template_catatan_wali',
            templateName: 'Catatan Wali Kelas',
            importedCount: 0,
            message: 'Tidak ada baris catatan wali kelas yang ditemukan.'
          };
        }

        if (appContext.bulkSaveCatatanWali) {
          appContext.bulkSaveCatatanWali(catatanList);
        } else {
          catatanList.forEach((c) => appContext.saveCatatanWali(c));
        }

        return {
          success: true,
          templateId: 'template_catatan_wali',
          templateName: 'Catatan Wali Kelas',
          importedCount: catatanList.length,
          message: `Berhasil mengimpor catatan wali kelas untuk ${catatanList.length} siswa!`
        };
      }

      // 11. PIAGAM PENGHARGAAN
      case 'template_piagam': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nomor piagam', 'piagam'],
          ['nisn', 'nama', 'siswa'],
          ['kategori', 'penghargaan', 'judul', 'peringkat']
        ]);

        const noCol = findColumnIndex(matchedHeaders, ['nomor piagam', 'no piagam']);
        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const katCol = findColumnIndex(matchedHeaders, ['kategori']);
        const judulCol = findColumnIndex(matchedHeaders, ['judul', 'penghargaan']);
        const ketCol = findColumnIndex(matchedHeaders, ['keterangan']);
        const rankCol = findColumnIndex(matchedHeaders, ['peringkat', 'juara']);

        const piagamList: PiagamAward[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[2]);
          if (!nama || nama.toLowerCase().includes('contoh')) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : `009876543${piagamList.length}`);
          const nomor = parseStringCell(noCol >= 0 ? row[noCol] : `421.2/SDN-BALIL/PG/${Date.now().toString().slice(-4)}`);

          piagamList.push({
            idPiagam: `PIAGAM_${Date.now()}_${piagamList.length}`,
            nomorPiagam: nomor,
            nisn,
            namaSiswa: nama,
            kelas: currentKelas,
            semester: currentSemester,
            tahunPelajaran: currentYear,
            kategoriPrestasi: parseStringCell(katCol >= 0 ? row[katCol] : 'Akademik'),
            judulPenghargaan: parseStringCell(judulCol >= 0 ? row[judulCol] : 'Juara Kelas & Budi Pekerti Baik'),
            keterangan: parseStringCell(ketCol >= 0 ? row[ketCol] : 'Atas dedikasi belajar dan budi pekerti teladan'),
            peringkat: rankCol >= 0 ? parseNumberCell(row[rankCol], 1) : 1,
            tanggalPenetapan: new Date().toISOString().slice(0, 10),
            tempatPenetapan: 'Balil, Oksibil',
            temaBingkai: 'gold'
          });
        }

        if (piagamList.length === 0) {
          return {
            success: false,
            templateId: 'template_piagam',
            templateName: 'Piagam Penghargaan',
            importedCount: 0,
            message: 'Tidak ada piagam yang dapat diimpor.'
          };
        }

        if (appContext.bulkSavePiagam) {
          appContext.bulkSavePiagam(piagamList);
        } else {
          piagamList.forEach((p) => appContext.savePiagam(p));
        }

        return {
          success: true,
          templateId: 'template_piagam',
          templateName: 'Piagam Penghargaan Siswa',
          importedCount: piagamList.length,
          message: `Berhasil mengimpor ${piagamList.length} data Piagam Penghargaan Siswa!`
        };
      }

      // 12. P5 PROJEK
      case 'template_p5': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['projek', 'nama projek'],
          ['tema'],
          ['fase', 'kelas', 'deskripsi']
        ]);

        const namaCol = findColumnIndex(matchedHeaders, ['nama projek', 'projek', 'judul']);
        const temaCol = findColumnIndex(matchedHeaders, ['tema']);
        const faseCol = findColumnIndex(matchedHeaders, ['fase']);
        const kelasCol = findColumnIndex(matchedHeaders, ['kelas']);
        const descCol = findColumnIndex(matchedHeaders, ['deskripsi projek', 'deskripsi']);

        const p5Projects: P5Project[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[1]);
          if (!nama || nama.toLowerCase().includes('contoh')) continue;

          const tema = parseStringCell(temaCol >= 0 ? row[temaCol] : 'Kearifan Lokal');
          const rawKelas = kelasCol >= 0 ? row[kelasCol] : currentKelas;
          const kelas = normalizeKelas(rawKelas, currentKelas);
          const fase = (faseCol >= 0 && row[faseCol] ? String(row[faseCol]).toUpperCase().trim() : getFaseFromKelas(kelas)) as FaseType;
          const desc = parseStringCell(descCol >= 0 ? row[descCol] : 'Projek penguatan profil pelajar pancasila');

          p5Projects.push({
            idProjek: `P5_${Date.now()}_${p5Projects.length}`,
            namaProjek: nama,
            tema,
            fase,
            kelas,
            tahunPelajaran: currentYear,
            semester: currentSemester,
            deskripsiProjek: desc
          });
        }

        if (p5Projects.length === 0) {
          return {
            success: false,
            templateId: 'template_p5',
            templateName: 'P5 Projek',
            importedCount: 0,
            message: 'Tidak ada baris Projek P5 yang dapat diimpor.'
          };
        }

        if (appContext.bulkSaveP5Projek) {
          appContext.bulkSaveP5Projek(p5Projects);
        } else {
          p5Projects.forEach((p) => appContext.saveP5Projek(p));
        }

        return {
          success: true,
          templateId: 'template_p5',
          templateName: 'P5 Projek Profil Pelajar Pancasila',
          importedCount: p5Projects.length,
          message: `Berhasil mengimpor ${p5Projects.length} data Tema & Projek P5!`
        };
      }

      // 13. P5 TAHAPAN PROJEK
      case 'template_p5_tahapan': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['tahap', 'tahapan'],
          ['kegiatan'],
          ['tanggal', 'tgl']
        ]);

        const tahapCol = findColumnIndex(matchedHeaders, ['tahap', 'tahapan']);
        const kegCol = findColumnIndex(matchedHeaders, ['kegiatan', 'deskripsi']);
        const tglCol = findColumnIndex(matchedHeaders, ['tanggal', 'tgl']);

        const stages: P5Stage[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        const activeProjekId = appContext.db?.p5Projek?.[0]?.idProjek || 'PRJ001';

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const keg = parseStringCell(kegCol >= 0 ? row[kegCol] : row[2]);
          if (!keg || keg.toLowerCase().includes('contoh')) continue;

          const rawTahap = parseStringCell(tahapCol >= 0 ? row[tahapCol] : 'Pengenalan');
          let tahap: 'Pengenalan' | 'Kontekstualisasi' | 'Aksi' | 'Refleksi' | 'Tindak Lanjut' = 'Pengenalan';
          if (rawTahap.toLowerCase().includes('kontek')) tahap = 'Kontekstualisasi';
          else if (rawTahap.toLowerCase().includes('aksi')) tahap = 'Aksi';
          else if (rawTahap.toLowerCase().includes('refleksi')) tahap = 'Refleksi';
          else if (rawTahap.toLowerCase().includes('lanjut')) tahap = 'Tindak Lanjut';

          stages.push({
            id: `STG_${Date.now()}_${stages.length}`,
            idProjek: activeProjekId,
            tahap,
            kegiatan: keg,
            tanggal: parseExcelDate(tglCol >= 0 ? row[tglCol] : '2026-09-01')
          });
        }

        if (stages.length === 0) {
          return {
            success: false,
            templateId: 'template_p5_tahapan',
            templateName: 'Tahapan P5',
            importedCount: 0,
            message: 'Tidak ada baris tahapan projek yang dapat diimpor.'
          };
        }

        if (appContext.bulkSaveP5Tahapan) {
          appContext.bulkSaveP5Tahapan(stages);
        } else {
          stages.forEach((stg) => appContext.saveP5Tahapan(stg));
        }

        return {
          success: true,
          templateId: 'template_p5_tahapan',
          templateName: 'Tahapan Alur Projek P5',
          importedCount: stages.length,
          message: `Berhasil mengimpor ${stages.length} tahapan alur Projek P5!`
        };
      }

      // 14. P5 DIMENSI & ELEMEN
      case 'template_p5_dimensi': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['dimensi'],
          ['elemen'],
          ['sub elemen', 'subelemen']
        ]);

        const dimCol = findColumnIndex(matchedHeaders, ['dimensi']);
        const elemCol = findColumnIndex(matchedHeaders, ['elemen']);
        const subCol = findColumnIndex(matchedHeaders, ['sub elemen', 'subelemen', 'sub']);

        const items: P5DimensionItem[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const dim = parseStringCell(dimCol >= 0 ? row[dimCol] : row[1]);
          if (!dim || dim.toLowerCase().includes('contoh')) continue;

          const elem = parseStringCell(elemCol >= 0 ? row[elemCol] : 'Akhlak Mulia');
          const sub = parseStringCell(subCol >= 0 ? row[subCol] : 'Menjaga kerukunan');

          items.push({
            id: `DIM_${Date.now()}_${items.length}`,
            dimensi: dim,
            elemen: elem,
            subElemen: sub
          });
        }

        if (items.length === 0) {
          return {
            success: false,
            templateId: 'template_p5_dimensi',
            templateName: 'Dimensi & Elemen P5',
            importedCount: 0,
            message: 'Tidak ada data dimensi/elemen P5 yang ditemukan.'
          };
        }

        if (appContext.bulkSaveP5Dimensi) {
          appContext.bulkSaveP5Dimensi(items);
        } else {
          items.forEach((dim) => appContext.saveP5Dimensi(dim));
        }

        return {
          success: true,
          templateId: 'template_p5_dimensi',
          templateName: 'Dimensi & Elemen P5',
          importedCount: items.length,
          message: `Berhasil mengimpor ${items.length} instrumen Dimensi & Elemen P5!`
        };
      }

      // 15. PENILAIAN CAPAIAN P5
      case 'template_p5_nilai': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn'],
          ['nama', 'siswa'],
          ['dimensi', 'capaian', 'bb', 'mb', 'bsh', 'sb']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const dimCol = findColumnIndex(matchedHeaders, ['dimensi']);
        const elemCol = findColumnIndex(matchedHeaders, ['elemen']);
        const capCol = findColumnIndex(matchedHeaders, ['capaian', 'predikat']);
        const descCol = findColumnIndex(matchedHeaders, ['deskripsi', 'catatan']);

        const p5Scores: P5Score[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        const activeProjekId = appContext.db?.p5Projek?.[0]?.idProjek || 'PRJ001';

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : row[1]);
          if (!nisn || nisn.toLowerCase().includes('contoh')) continue;

          const nama = parseStringCell(namaCol >= 0 ? row[namaCol] : row[2]);
          const rawCap = parseStringCell(capCol >= 0 ? row[capCol] : 'BSH').toUpperCase();
          let capaian: P5Predicate = 'BSH';
          if (rawCap.includes('SB') || rawCap.includes('SANGAT')) capaian = 'SB';
          else if (rawCap.includes('BSH') || rawCap.includes('SESUAI')) capaian = 'BSH';
          else if (rawCap.includes('MB') || rawCap.includes('MULAI')) capaian = 'MB';
          else if (rawCap.includes('BB') || rawCap.includes('BELUM')) capaian = 'BB';

          const dimensi = parseStringCell(dimCol >= 0 ? row[dimCol] : 'Berkebinekaan Global');
          const elemen = parseStringCell(elemCol >= 0 ? row[elemCol] : 'Mengenal dan menghargai budaya');

          p5Scores.push({
            id: `P5S_${nisn}_${activeProjekId}_${dimensi.slice(0, 5)}`,
            idProjek: activeProjekId,
            nisn,
            namaSiswa: nama || 'Siswa',
            kelas: currentKelas,
            semester: currentSemester,
            tahunPelajaran: currentYear,
            dimensi,
            elemen,
            capaian,
            deskripsi: parseStringCell(descCol >= 0 ? row[descCol] : `Berkembang Sesuai Harapan dalam dimensi ${dimensi}`)
          });
        }

        if (p5Scores.length === 0) {
          return {
            success: false,
            templateId: 'template_p5_nilai',
            templateName: 'Nilai P5',
            importedCount: 0,
            message: 'Tidak ada baris nilai P5 yang dapat diimpor.'
          };
        }

        appContext.bulkSaveP5Nilai(p5Scores);
        return {
          success: true,
          templateId: 'template_p5_nilai',
          templateName: 'Penilaian Capaian Projek P5',
          importedCount: p5Scores.length,
          message: `Berhasil mengimpor penilaian P5 untuk ${p5Scores.length} data capaian dimensi siswa!`
        };
      }

      // 16. KEPUTUSAN KENAIKAN / KELULUSAN
      case 'template_keputusan_siswa': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['nisn'],
          ['nama', 'siswa'],
          ['status keputusan', 'keputusan', 'naik kelas', 'tinggal']
        ]);

        const nisnCol = findColumnIndex(matchedHeaders, ['nisn']);
        const namaCol = findColumnIndex(matchedHeaders, ['nama siswa', 'nama']);
        const statCol = findColumnIndex(matchedHeaders, ['status keputusan', 'status', 'keputusan']);
        const naikCol = findColumnIndex(matchedHeaders, ['naik kelas', 'naik']);
        const tinggalCol = findColumnIndex(matchedHeaders, ['tinggal di kelas', 'tinggal']);
        const ketCol = findColumnIndex(matchedHeaders, ['keterangan']);

        const decisions: StudentDecision[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const nisn = parseStringCell(nisnCol >= 0 ? row[nisnCol] : row[1]);
          if (!nisn || nisn.toLowerCase().includes('contoh')) continue;

          const rawStatus = parseStringCell(statCol >= 0 ? row[statCol] : 'Naik Kelas');
          let status: 'Naik Kelas' | 'Tinggal di Kelas' | 'Lulus' | 'Belum Ditetapkan' = 'Naik Kelas';
          if (rawStatus.toLowerCase().includes('lulus')) status = 'Lulus';
          else if (rawStatus.toLowerCase().includes('tinggal')) status = 'Tinggal di Kelas';
          else if (rawStatus.toLowerCase().includes('belum')) status = 'Belum Ditetapkan';

          decisions.push({
            id: `DEC_${nisn}_${currentKelas}_${currentSemester}`,
            nisn,
            namaSiswa: parseStringCell(namaCol >= 0 ? row[namaCol] : 'Siswa'),
            kelas: currentKelas,
            semester: currentSemester,
            tahunPelajaran: currentYear,
            statusKeputusan: status,
            naikKelas: parseStringCell(naikCol >= 0 ? row[naikCol] : 'V (Lima)'),
            tinggalKelas: parseStringCell(tinggalCol >= 0 ? row[tinggalCol] : '-'),
            keteranganTambahan: parseStringCell(ketCol >= 0 ? row[ketCol] : 'Memenuhi seluruh kriteria ketuntasan kurikulum')
          });
        }

        if (decisions.length === 0) {
          return {
            success: false,
            templateId: 'template_keputusan_siswa',
            templateName: 'Keputusan Kenaikan / Kelulusan',
            importedCount: 0,
            message: 'Tidak ada data keputusan siswa yang valid.'
          };
        }

        appContext.bulkSaveKeputusanSiswa(decisions);
        return {
          success: true,
          templateId: 'template_keputusan_siswa',
          templateName: 'Keputusan Kenaikan / Kelulusan',
          importedCount: decisions.length,
          message: `Berhasil mengimpor keputusan rapor untuk ${decisions.length} siswa!`
        };
      }

      // 17. DATA KELAS (ROMBEL)
      case 'template_kelas': {
        const { headerIdx, matchedHeaders } = findHeaderRowIndex(rawRows, [
          ['kelas', 'nama kelas'],
          ['fase'],
          ['wali kelas', 'wali']
        ]);

        const kelasCol = findColumnIndex(matchedHeaders, ['nama kelas', 'kelas']);
        const faseCol = findColumnIndex(matchedHeaders, ['fase']);
        const waliCol = findColumnIndex(matchedHeaders, ['wali kelas', 'wali']);

        const classesToSave: ClassData[] = [];
        let startRow = headerIdx + 1;
        if (startRow < rawRows.length && isNumberingRow(rawRows[startRow])) {
          startRow++;
        }

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const rawKelas = parseStringCell(kelasCol >= 0 ? row[kelasCol] : row[1]);
          if (!rawKelas || rawKelas.toLowerCase().includes('contoh')) continue;

          const kelas = normalizeKelas(rawKelas, 'IV');
          const fase = (faseCol >= 0 && row[faseCol] ? String(row[faseCol]).toUpperCase().trim() : getFaseFromKelas(kelas)) as FaseType;
          const wali = parseStringCell(waliCol >= 0 ? row[waliCol] : 'Wali Kelas');

          classesToSave.push({
            idKelas: `K00${classesToSave.length + 1}`,
            namaKelas: kelas,
            fase,
            waliKelas: wali,
            tahunPelajaran: currentYear,
            semester: currentSemester,
            jumlahSiswa: 0
          });
        }

        if (classesToSave.length === 0) {
          return {
            success: false,
            templateId: 'template_kelas',
            templateName: 'Data Rombongan Belajar',
            importedCount: 0,
            message: 'Tidak ada baris data kelas yang dapat diimpor.'
          };
        }

        if (appContext.bulkSaveKelas) {
          appContext.bulkSaveKelas(classesToSave);
        } else {
          classesToSave.forEach((k) => appContext.saveKelas(k));
        }

        return {
          success: true,
          templateId: 'template_kelas',
          templateName: 'Data Kelas (Rombongan Belajar)',
          importedCount: classesToSave.length,
          message: `Berhasil mengimpor ${classesToSave.length} rombongan belajar ke sistem sekolah!`
        };
      }

      // 18. IDENTITAS SEKOLAH
      case 'template_sekolah': {
        const rowStr = rawRows.flat().join(' ');
        // Parsing key-value atau tabular
        const schoolUpdates: Partial<SchoolIdentity> = {};

        rawRows.forEach((row) => {
          if (!row || row.length < 2) return;
          const label = String(row[0] || row[1] || '').toLowerCase();
          const val = String(row[row.length - 1] || row[1] || '').trim();

          if (label.includes('npsn')) schoolUpdates.npsn = val;
          else if (label.includes('nama sekolah')) schoolUpdates.namaSekolah = val;
          else if (label.includes('kepala sekolah')) schoolUpdates.namaKepalaSekolah = val;
          else if (label.includes('nip kepala')) schoolUpdates.nipKepalaSekolah = val;
          else if (label.includes('alamat')) schoolUpdates.alamat = val;
          else if (label.includes('kabupaten')) schoolUpdates.kabupaten = val;
          else if (label.includes('provinsi')) schoolUpdates.provinsi = val;
          else if (label.includes('tahun')) schoolUpdates.tahunPelajaran = val;
          else if (label.includes('wali kelas')) schoolUpdates.waliKelas = val;
          else if (label.includes('nip wali')) schoolUpdates.nipWaliKelas = val;
        });

        if (Object.keys(schoolUpdates).length === 0) {
          return {
            success: false,
            templateId: 'template_sekolah',
            templateName: 'Identitas Sekolah',
            importedCount: 0,
            message: 'Format profil sekolah tidak dikenali.'
          };
        }

        appContext.updateSekolah(schoolUpdates);
        return {
          success: true,
          templateId: 'template_sekolah',
          templateName: 'Identitas Satuan Pendidikan',
          importedCount: Object.keys(schoolUpdates).length,
          message: 'Berhasil mengimpor dan memperbarui identitas profil sekolah!'
        };
      }

      // DEFAULT FALLBACK: Coba ke Data Siswa jika tidak spesifik
      default: {
        return parseAndImportTemplate(file, 'template_siswa', appContext);
      }
    }
  } catch (err: any) {
    console.error('Fatal import error', err);
    return {
      success: false,
      templateId: targetTemplateId || 'error',
      templateName: 'Gagal Membaca File',
      importedCount: 0,
      message: `Terjadi kesalahan teknis saat membaca file Excel/CSV: ${err?.message || 'Format sel tidak valid'}`
    };
  }
}
