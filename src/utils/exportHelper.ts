import * as XLSX from 'xlsx';
import { Student, AcademicScore, SchoolIdentity, ClassLevel, SemesterType, Subject } from '../types';

/**
 * Utility helper to download CSV with UTF-8 BOM so Microsoft Excel
 * on Windows opens it with correct column separators and Indonesian characters.
 */
export function downloadCsv(filename: string, content: string, delimiter: ';' | ',' = ';') {
  const finalContent = `sep=${delimiter}\r\n` + content;
  const blob = new Blob(['\uFEFF' + finalContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. EKSPOR DATA SISWA KE EXCEL (.xlsx)
 */
export function exportStudentsToExcel(
  students: Student[],
  school: SchoolIdentity,
  kelasFilter: string = 'SEMUA'
) {
  const wb = XLSX.utils.book_new();
  const titleKelas = kelasFilter === 'SEMUA' ? 'SEMUA KELAS' : `KELAS ${kelasFilter}`;

  const rows: (string | number)[][] = [
    [school.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
    [school.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
    [school.namaSekolah || 'SD NEGERI BALIL'],
    [`DATA POKOK PESERTA DIDIK - ${titleKelas}`],
    [`Tahun Pelajaran: ${school.tahunPelajaran} • Kurikulum Merdeka`],
    [],
    [
      'NO',
      'NISN',
      'NIS',
      'NAMA LENGKAP SISWA',
      'JK (L/P)',
      'TEMPAT LAHIR',
      'TANGGAL LAHIR',
      'AGAMA',
      'KELAS',
      'FASE',
      'SEMESTER',
      'NAMA AYAH',
      'NAMA IBU',
      'ALAMAT PESERTA DIDIK',
      'STATUS'
    ],
    ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)', '(11)', '(12)', '(13)', '(14)', '(15)'],
    ...students.map((s, idx) => [
      idx + 1,
      s.nisn,
      s.nis || '-',
      s.namaSiswa,
      s.jenisKelamin,
      s.tempatLahir || '-',
      s.tanggalLahir || '-',
      s.agama || 'Kristen',
      s.kelas,
      s.fase,
      s.semester || '1',
      s.namaAyah || '-',
      s.namaIbu || '-',
      s.alamat || '-',
      s.statusSiswa || 'Aktif'
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 12 },
    { wch: 32 },
    { wch: 8 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 35 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
  const safeFilename = `Data_Siswa_${school.namaSekolah.replace(/\s+/g, '_')}_Kelas_${kelasFilter}_TP_${school.tahunPelajaran.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * 2. EKSPOR DATA SISWA KE CSV (.csv)
 */
export function exportStudentsToCsv(
  students: Student[],
  school: SchoolIdentity,
  kelasFilter: string = 'SEMUA'
) {
  const headers = [
    'No',
    'NISN',
    'NIS',
    'Nama Siswa',
    'JK',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Agama',
    'Kelas',
    'Fase',
    'Semester',
    'Nama Ayah',
    'Nama Ibu',
    'Alamat',
    'Status'
  ];

  const headerRow = headers.map((h) => `"${h}"`).join(';');
  const dataRows = students.map((s, idx) => {
    return [
      idx + 1,
      `"${s.nisn}"`,
      `"${s.nis || '-'}"`,
      `"${s.namaSiswa.replace(/"/g, '""')}"`,
      `"${s.jenisKelamin}"`,
      `"${(s.tempatLahir || '-').replace(/"/g, '""')}"`,
      `"${s.tanggalLahir || '-'}"`,
      `"${s.agama || 'Kristen'}"`,
      `"${s.kelas}"`,
      `"${s.fase}"`,
      `"${s.semester || '1'}"`,
      `"${(s.namaAyah || '-').replace(/"/g, '""')}"`,
      `"${(s.namaIbu || '-').replace(/"/g, '""')}"`,
      `"${(s.alamat || '-').replace(/"/g, '""')}"`,
      `"${s.statusSiswa || 'Aktif'}"`
    ].join(';');
  });

  const csvString = [headerRow, ...dataRows].join('\r\n');
  const safeFilename = `Data_Siswa_Kelas_${kelasFilter}_TP_${school.tahunPelajaran.replace(/\//g, '-')}.csv`;
  downloadCsv(safeFilename, csvString, ';');
}

/**
 * 3. EKSPOR NILAI MATA PELAJARAN AKTIF KE EXCEL (.xlsx)
 */
export function exportSubjectScoresToExcel(
  scores: AcademicScore[],
  mapel: string,
  kelas: ClassLevel | string,
  semester: SemesterType,
  school: SchoolIdentity
) {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    [school.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
    [school.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
    [school.namaSekolah || 'SD NEGERI BALIL'],
    [`DAFTAR NILAI AKADEMIK - MATA PELAJARAN: ${mapel.toUpperCase()}`],
    [`Kelas: ${kelas} • Semester: ${semester} • Tahun Pelajaran: ${school.tahunPelajaran}`],
    [],
    [
      'NO',
      'NISN',
      'NAMA PESERTA DIDIK',
      'FORMATIF',
      'SUMATIF',
      'PH 1',
      'PH 2',
      'PH 3',
      'PTS',
      'PAS',
      'PRAKTIK',
      'NILAI AKHIR',
      'PREDIKAT',
      'CAPAIAN KOMPETENSI',
      'DESKRIPSI CAPAIAN RAPOR'
    ],
    ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)', '(11)', '(12)', '(13)', '(14)', '(15)'],
    ...scores.map((sc, idx) => [
      idx + 1,
      sc.nisn,
      sc.namaSiswa,
      sc.formatif,
      sc.sumatif,
      sc.ph1 ?? sc.formatif,
      sc.ph2 ?? sc.formatif,
      sc.ph3 ?? sc.formatif,
      sc.pts ?? sc.formatif,
      sc.pas ?? sc.sumatif,
      sc.praktik ?? sc.sumatif,
      sc.nilaiAkhir,
      sc.predikat,
      sc.capaianKompetensi,
      sc.deskripsiRapor
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
    { wch: 50 }
  ];

  const sheetName = `Nilai ${mapel.replace(/[:\\/?*[\]]/g, '').slice(0, 25)}`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const safeFilename = `Nilai_${mapel.replace(/\s+/g, '_')}_Kelas_${kelas}_Sem_${semester}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * 4. EKSPOR NILAI MATA PELAJARAN AKTIF KE CSV (.csv)
 */
export function exportSubjectScoresToCsv(
  scores: AcademicScore[],
  mapel: string,
  kelas: ClassLevel | string,
  semester: SemesterType,
  school: SchoolIdentity
) {
  const headers = [
    'No',
    'NISN',
    'Nama Siswa',
    'Mata Pelajaran',
    'Kelas',
    'Semester',
    'Formatif',
    'Sumatif',
    'PH1',
    'PH2',
    'PH3',
    'PTS',
    'PAS',
    'Praktik',
    'Nilai Akhir',
    'Predikat',
    'Capaian Kompetensi',
    'Deskripsi Rapor'
  ];

  const headerRow = headers.map((h) => `"${h}"`).join(';');
  const dataRows = scores.map((sc, idx) => {
    return [
      idx + 1,
      `"${sc.nisn}"`,
      `"${sc.namaSiswa.replace(/"/g, '""')}"`,
      `"${mapel.replace(/"/g, '""')}"`,
      `"${kelas}"`,
      `"${semester}"`,
      sc.formatif,
      sc.sumatif,
      sc.ph1 ?? sc.formatif,
      sc.ph2 ?? sc.formatif,
      sc.ph3 ?? sc.formatif,
      sc.pts ?? sc.formatif,
      sc.pas ?? sc.sumatif,
      sc.praktik ?? sc.sumatif,
      sc.nilaiAkhir,
      `"${sc.predikat}"`,
      `"${sc.capaianKompetensi}"`,
      `"${sc.deskripsiRapor.replace(/"/g, '""')}"`
    ].join(';');
  });

  const csvString = [headerRow, ...dataRows].join('\r\n');
  const safeFilename = `Nilai_${mapel.replace(/\s+/g, '_')}_Kelas_${kelas}_Sem_${semester}.csv`;
  downloadCsv(safeFilename, csvString, ';');
}

/**
 * 5. EKSPOR BUKU NILAI KOMPLIT WALI KELAS (MULTI-SHEET WORKBOOK .XLSX)
 * Memuat:
 * Sheet 1: Leger Nilai & Peringkat Kelas
 * Sheet 2: Data Pokok Siswa
 * Sheet 3+: Lembar Nilai Masing-Masing Mata Pelajaran
 */
export function exportClassComprehensiveWorkbook(
  db: {
    sekolah: SchoolIdentity;
    siswa: Student[];
    mataPelajaran: Subject[];
    nilaiAkademik: AcademicScore[];
  },
  kelas: ClassLevel | string,
  semester: SemesterType
) {
  const wb = XLSX.utils.book_new();
  const siswaKelas = db.siswa.filter((s) => s.kelas === kelas);
  const mapelList = db.mataPelajaran;

  // --- SHEET 1: LEGER NILAI ---
  const matrix = siswaKelas.map((s) => {
    const scores = mapelList.map((m) => {
      const match = db.nilaiAkademik.find(
        (n) => n.nisn === s.nisn && n.mataPelajaran === m.mataPelajaran && n.semester === semester
      );
      return match ? match.nilaiAkhir : null;
    });

    const validScores = scores.filter((v): v is number => v !== null);
    const total = validScores.reduce((acc, curr) => acc + curr, 0);
    const avg = validScores.length > 0 ? parseFloat((total / validScores.length).toFixed(1)) : 0;

    return {
      student: s,
      scores,
      total,
      avg
    };
  });

  const ranked = [...matrix].sort((a, b) => b.avg - a.avg);
  const rankMap = new Map<string, number>();
  ranked.forEach((item, idx) => {
    rankMap.set(item.student.nisn, idx + 1);
  });

  const legerRows: (string | number)[][] = [
    [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
    [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
    [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
    [`BUKU LEGER NILAI & PERINGKAT KELAS ${kelas}`],
    [`Semester: ${semester} • Tahun Pelajaran: ${db.sekolah.tahunPelajaran} • Kurikulum Merdeka`],
    [],
    [
      'RANK',
      'NISN',
      'NAMA SISWA',
      'JK',
      ...mapelList.map((m) => m.mataPelajaran),
      'TOTAL NILAI',
      'RATA-RATA'
    ],
    [
      '(1)',
      '(2)',
      '(3)',
      '(4)',
      ...mapelList.map((_, i) => `(${i + 5})`),
      `(${mapelList.length + 5})`,
      `(${mapelList.length + 6})`
    ],
    ...ranked.map((item) => [
      rankMap.get(item.student.nisn) || '-',
      item.student.nisn,
      item.student.namaSiswa,
      item.student.jenisKelamin,
      ...item.scores.map((sc) => sc ?? '-'),
      item.total,
      item.avg
    ])
  ];

  const wsLeger = XLSX.utils.aoa_to_sheet(legerRows);
  wsLeger['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 28 },
    { wch: 6 },
    ...mapelList.map(() => ({ wch: 14 })),
    { wch: 14 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsLeger, 'Leger Nilai');

  // --- SHEET 2: DATA SISWA ---
  const studentRows: (string | number)[][] = [
    ['NO', 'NISN', 'NIS', 'NAMA SISWA', 'JK', 'TEMPAT LAHIR', 'TGL LAHIR', 'AGAMA', 'KELAS', 'FASE', 'NAMA AYAH', 'NAMA IBU', 'ALAMAT'],
    ...siswaKelas.map((s, idx) => [
      idx + 1,
      s.nisn,
      s.nis || '-',
      s.namaSiswa,
      s.jenisKelamin,
      s.tempatLahir || '-',
      s.tanggalLahir || '-',
      s.agama || 'Kristen',
      s.kelas,
      s.fase,
      s.namaAyah || '-',
      s.namaIbu || '-',
      s.alamat || '-'
    ])
  ];
  const wsStudents = XLSX.utils.aoa_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Data Siswa');

  // --- SHEET 3+: NILAI PER MATA PELAJARAN ---
  mapelList.forEach((mapel) => {
    const mapelScores = siswaKelas.map((s) => {
      const found = db.nilaiAkademik.find(
        (n) => n.nisn === s.nisn && n.mataPelajaran === mapel.mataPelajaran && n.semester === semester
      );
      return found || {
        nisn: s.nisn,
        namaSiswa: s.namaSiswa,
        formatif: 80,
        sumatif: 80,
        nilaiAkhir: 80,
        predikat: 'Baik',
        capaianKompetensi: 'Baik',
        deskripsiRapor: '-'
      };
    });

    const mapelRows: (string | number)[][] = [
      [`NILAI: ${mapel.mataPelajaran.toUpperCase()} - KELAS ${kelas} SEMESTER ${semester}`],
      [],
      ['NO', 'NISN', 'NAMA SISWA', 'FORMATIF', 'SUMATIF', 'NILAI AKHIR', 'PREDIKAT', 'CAPAIAN', 'DESKRIPSI RAPOR'],
      ...mapelScores.map((sc, idx) => [
        idx + 1,
        sc.nisn,
        sc.namaSiswa,
        sc.formatif,
        sc.sumatif,
        sc.nilaiAkhir,
        sc.predikat,
        sc.capaianKompetensi,
        sc.deskripsiRapor
      ])
    ];

    const wsMapel = XLSX.utils.aoa_to_sheet(mapelRows);
    wsMapel['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 28 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 45 }
    ];
    const cleanSheetName = mapel.mataPelajaran.replace(/[:\\/?*[\]]/g, '').slice(0, 25);
    XLSX.utils.book_append_sheet(wb, wsMapel, cleanSheetName);
  });

  const safeFilename = `Buku_Nilai_Komplit_Wali_Kelas_${kelas}_Sem_${semester}_${db.sekolah.namaSekolah.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * 6. EKSPOR LEGER NILAI SEMUA MATA PELAJARAN KE CSV (.csv)
 */
export function exportClassLegerToCsv(
  db: {
    sekolah: SchoolIdentity;
    siswa: Student[];
    mataPelajaran: Subject[];
    nilaiAkademik: AcademicScore[];
  },
  kelas: ClassLevel | string,
  semester: SemesterType
) {
  const siswaKelas = db.siswa.filter((s) => s.kelas === kelas);
  const mapelList = db.mataPelajaran;

  const matrix = siswaKelas.map((s) => {
    const scores = mapelList.map((m) => {
      const match = db.nilaiAkademik.find(
        (n) => n.nisn === s.nisn && n.mataPelajaran === m.mataPelajaran && n.semester === semester
      );
      return match ? match.nilaiAkhir : null;
    });

    const validScores = scores.filter((v): v is number => v !== null);
    const total = validScores.reduce((acc, curr) => acc + curr, 0);
    const avg = validScores.length > 0 ? parseFloat((total / validScores.length).toFixed(1)) : 0;

    return {
      student: s,
      scores,
      total,
      avg
    };
  });

  const ranked = [...matrix].sort((a, b) => b.avg - a.avg);
  const rankMap = new Map<string, number>();
  ranked.forEach((item, idx) => {
    rankMap.set(item.student.nisn, idx + 1);
  });

  const headerCols = [
    'Peringkat',
    'NISN',
    'Nama Siswa',
    'JK',
    ...mapelList.map((m) => m.mataPelajaran),
    'Total Nilai',
    'Rata-rata'
  ];

  const headerRow = headerCols.map((h) => `"${h}"`).join(';');
  const dataRows = ranked.map((item) => {
    const rank = rankMap.get(item.student.nisn) || '-';
    const scoreCols = item.scores.map((sc) => sc ?? '-').join(';');
    return `"${rank}";"${item.student.nisn}";"${item.student.namaSiswa.replace(/"/g, '""')}";"${item.student.jenisKelamin}";${scoreCols};${item.total};${item.avg}`;
  });

  const csvString = [headerRow, ...dataRows].join('\r\n');
  const safeFilename = `Leger_Nilai_Kelas_${kelas}_Sem_${semester}.csv`;
  downloadCsv(safeFilename, csvString, ';');
}
