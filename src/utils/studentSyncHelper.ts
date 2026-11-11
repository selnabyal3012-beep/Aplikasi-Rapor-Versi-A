import {
  DatabaseState,
  Student,
  ClassData,
  ClassLevel,
  SemesterType,
  AcademicScore,
  Attendance,
  TeacherNote,
  Extracurricular,
  StudentDecision
} from '../types';
import { generateReportDescriptionFromTP } from './tpDescriptionHelper';

/**
 * Returns the next grade level according to Indonesian curriculum standard
 */
export function getNextClass(current: ClassLevel): string {
  switch (current) {
    case 'I':
      return 'II (Dua)';
    case 'II':
      return 'III (Tiga)';
    case 'III':
      return 'IV (Empat)';
    case 'IV':
      return 'V (Lima)';
    case 'V':
      return 'VI (Enam)';
    case 'VI':
      return 'Lulus dari Satuan Pendidikan SD';
    case 'VII':
      return 'VIII (Delapan)';
    case 'VIII':
      return 'IX (Sembilan)';
    case 'IX':
      return 'Lulus dari Satuan Pendidikan SMP';
    case 'X':
      return 'XI (Sebelas)';
    case 'XI':
      return 'XII (Dua Belas)';
    case 'XII':
      return 'Lulus dari Satuan Pendidikan SMA/SMK';
    case 'XIII':
      return 'Lulus dari Satuan Pendidikan SMK Program 4 Tahun';
    default:
      return 'Tingkat Berikutnya';
  }
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

/**
 * Automatically synchronizes a single student's data across:
 * - Data Kelas (jumlahSiswa count & auto-creation of class)
 * - Data Mapel & Pelajaran Agama Sesuai Agama Siswa
 * - Nama Siswa di Nilai (AcademicScore)
 * - Kehadiran (Attendance)
 * - Ekstrakurikuler (Extracurricular)
 * - Catatan Wali Kelas / Kurikuler (TeacherNote)
 * - Keputusan Siswa (StudentDecision)
 * - Piagam & P5
 */
export function syncStudentRelations(
  prevDb: DatabaseState,
  student: Student,
  oldNisn?: string
): DatabaseState {
  const targetNisn = student.nisn;
  const previousNisn = oldNisn && oldNisn.trim() ? oldNisn.trim() : targetNisn;
  const semesters: SemesterType[] = ['Ganjil', 'Genap'];

  // 1. DATA SISWA: Pastikan data siswa ada/diupdate di list siswa
  const siswaList = [...prevDb.siswa];
  const sIdx = siswaList.findIndex((s) => s.idSiswa === student.idSiswa);
  if (sIdx >= 0) {
    siswaList[sIdx] = student;
  } else {
    siswaList.push(student);
  }

  // 2. DATA KELAS: Hitung otomatis jumlah siswa aktif per kelas & pastikan kelas siswa terdaftar
  const kelasList = [...prevDb.kelas];
  const targetKelasIdx = kelasList.findIndex((k) => k.namaKelas === student.kelas);
  if (targetKelasIdx < 0) {
    // Buat kelas otomatis jika belum ada
    kelasList.push({
      idKelas: `K_${student.kelas}`,
      namaKelas: student.kelas,
      fase: student.fase || 'B',
      waliKelas: prevDb.guru[0]?.namaGuru || 'Wali Kelas',
      tahunPelajaran: prevDb.sekolah.tahunPelajaran,
      semester: prevDb.sekolah.semester,
      jumlahSiswa: 1
    });
  }

  // Perbarui jumlah siswa untuk setiap kelas secara otomatis
  const updatedKelasList = kelasList.map((k) => ({
    ...k,
    jumlahSiswa: siswaList.filter((s) => s.kelas === k.namaKelas && s.statusSiswa === 'Aktif').length
  }));

  // 3. DATA NILAI AKADEMIK & MATA PELAJARAN (SESUAI AGAMA SISWA)
  const nilaiList = [...prevDb.nilaiAkademik];
  semesters.forEach((sem) => {
    prevDb.mataPelajaran.forEach((m) => {
      // Cari nilai berdasarkan NISN (lama atau baru), mata pelajaran, kelas, dan semester
      const existingIdx = nilaiList.findIndex(
        (n) =>
          (n.nisn === previousNisn || n.nisn === targetNisn) &&
          n.mataPelajaran === m.mataPelajaran &&
          n.semester === sem
      );

      if (existingIdx >= 0) {
        // Update informasi siswa jika berubah
        const existing = nilaiList[existingIdx];
        const isAgama = m.mataPelajaran.toLowerCase().includes('agama');
        const tpDesc = isAgama
          ? generateReportDescriptionFromTP(
              m.mataPelajaran,
              student.kelas,
              existing.nilaiAkhir,
              prevDb.tujuanPembelajaran,
              student.namaSiswa,
              student.agama
            )
          : null;

        nilaiList[existingIdx] = {
          ...existing,
          nisn: targetNisn,
          namaSiswa: student.namaSiswa,
          kelas: student.kelas,
          deskripsiRapor: tpDesc ? tpDesc.deskripsiRapor : existing.deskripsiRapor,
          deskripsiTercapai: tpDesc ? (tpDesc.deskripsiTercapai || existing.deskripsiTercapai) : existing.deskripsiTercapai,
          deskripsiPerluPeningkatan: tpDesc
            ? (tpDesc.deskripsiPerluPeningkatan || existing.deskripsiPerluPeningkatan)
            : existing.deskripsiPerluPeningkatan
        };
      } else {
        // Buat record nilai otomatis untuk mata pelajaran ini
        const defaultNA = 80;
        const tpDesc = generateReportDescriptionFromTP(
          m.mataPelajaran,
          student.kelas,
          defaultNA,
          prevDb.tujuanPembelajaran,
          student.namaSiswa,
          student.agama
        );

        const newScore: AcademicScore = {
          idNilai: `N_${targetNisn}_${(m.kode || m.mataPelajaran.slice(0, 3)).replace(/\s+/g, '')}_${sem}`,
          tahunPelajaran: prevDb.sekolah.tahunPelajaran,
          semester: sem,
          kelas: student.kelas,
          nisn: targetNisn,
          namaSiswa: student.namaSiswa,
          mataPelajaran: m.mataPelajaran,
          kkm: m.kkm || 75,
          formatif: defaultNA,
          sumatif: defaultNA,
          ph1: defaultNA,
          ph2: defaultNA,
          ph3: defaultNA,
          pts: defaultNA,
          pas: defaultNA,
          praktik: defaultNA,
          nilaiAkhir: defaultNA,
          predikat: 'Baik',
          capaianKompetensi: 'Baik',
          deskripsiTercapai: tpDesc.deskripsiTercapai || 'Menunjukkan penguasaan materi yang baik.',
          deskripsiPerluPeningkatan: tpDesc.deskripsiPerluPeningkatan || 'Perlu latihan berkala.',
          deskripsiRapor: tpDesc.deskripsiRapor
        };
        nilaiList.push(newScore);
      }
    });
  });

  // 4. KEHADIRAN (ATTENDANCE)
  const kehadiranList = [...prevDb.kehadiran];
  semesters.forEach((sem) => {
    const attIdx = kehadiranList.findIndex(
      (h) => (h.nisn === previousNisn || h.nisn === targetNisn) && h.semester === sem
    );
    if (attIdx >= 0) {
      kehadiranList[attIdx] = {
        ...kehadiranList[attIdx],
        nisn: targetNisn,
        namaSiswa: student.namaSiswa,
        kelas: student.kelas
      };
    } else {
      kehadiranList.push({
        id: `ATT_${targetNisn}_${sem}`,
        tahunPelajaran: prevDb.sekolah.tahunPelajaran,
        semester: sem,
        kelas: student.kelas,
        nisn: targetNisn,
        namaSiswa: student.namaSiswa,
        sakit: 0,
        izin: 0,
        alpa: 0,
        totalHari: 0
      });
    }
  });

  // 5. CATATAN WALI KELAS (TEACHER NOTE)
  const catatanList = [...prevDb.catatanWali];
  semesters.forEach((sem) => {
    const noteIdx = catatanList.findIndex(
      (c) => (c.nisn === previousNisn || c.nisn === targetNisn) && c.semester === sem
    );
    if (noteIdx >= 0) {
      catatanList[noteIdx] = {
        ...catatanList[noteIdx],
        nisn: targetNisn,
        namaSiswa: student.namaSiswa,
        kelas: student.kelas
      };
    } else {
      catatanList.push({
        id: `NOTE_${targetNisn}_${sem}`,
        tahunPelajaran: prevDb.sekolah.tahunPelajaran,
        semester: sem,
        kelas: student.kelas,
        nisn: targetNisn,
        namaSiswa: student.namaSiswa,
        catatanWaliKelas:
          'Menunjukkan sikap belajar yang baik dan aktif dalam kelas. Terus pertahankan semangat belajarmu!'
      });
    }
  });

  // 6. EKSTRAKURIKULER (EXTRACURRICULAR)
  const ekskulList = [...prevDb.ekstrakurikuler];
  const studentEkskuls = ekskulList.filter((e) => e.nisn === previousNisn || e.nisn === targetNisn);
  if (studentEkskuls.length > 0) {
    studentEkskuls.forEach((e) => {
      const idx = ekskulList.findIndex((item) => item.id === e.id);
      if (idx >= 0) {
        ekskulList[idx] = {
          ...ekskulList[idx],
          nisn: targetNisn,
          namaSiswa: student.namaSiswa,
          kelas: student.kelas
        };
      }
    });
  } else {
    // Tambahkan otomatis ekstrakurikuler Pramuka wajib
    ekskulList.push({
      id: `EKS_${targetNisn}_pramuka`,
      tahunPelajaran: prevDb.sekolah.tahunPelajaran,
      semester: student.semester || 'Ganjil',
      kelas: student.kelas,
      nisn: targetNisn,
      namaSiswa: student.namaSiswa,
      jenisEkstrakurikuler: 'Pramuka (Wajib)',
      predikat: 'Baik',
      keterangan: 'Aktif dan disiplin dalam mengikuti seluruh kegiatan kepramukaan.'
    });
  }

  // 7. KEPUTUSAN SISWA (STUDENT DECISION)
  const keputusanList = [...(prevDb.keputusanSiswa || [])];
  semesters.forEach((sem) => {
    const decIdx = keputusanList.findIndex(
      (d) => (d.nisn === previousNisn || d.nisn === targetNisn) && d.semester === sem
    );
    if (decIdx >= 0) {
      keputusanList[decIdx] = {
        ...keputusanList[decIdx],
        nisn: targetNisn,
        namaSiswa: student.namaSiswa,
        kelas: student.kelas
      };
    } else {
      keputusanList.push({
        nisn: targetNisn,
        namaSiswa: student.namaSiswa,
        kelas: student.kelas,
        semester: sem,
        tahunPelajaran: prevDb.sekolah.tahunPelajaran,
        statusKeputusan: 'Naik Kelas',
        naikKelas: getNextClass(student.kelas),
        tinggalKelas: '-'
      });
    }
  });

  // 8. PIAGAM & P5 (UPDATE NAMA/NISN JIKA BERUBAH)
  let piagamList = prevDb.piagam || [];
  if (previousNisn !== targetNisn || prevDb.siswa.find((s) => s.idSiswa === student.idSiswa)?.namaSiswa !== student.namaSiswa) {
    piagamList = piagamList.map((p) =>
      p.nisn === previousNisn || p.nisn === targetNisn
        ? { ...p, nisn: targetNisn, namaSiswa: student.namaSiswa, kelas: student.kelas }
        : p
    );
  }

  let p5NilaiList = prevDb.p5Nilai || [];
  if (previousNisn !== targetNisn) {
    p5NilaiList = p5NilaiList.map((p) => (p.nisn === previousNisn ? { ...p, nisn: targetNisn } : p));
  }

  return {
    ...prevDb,
    siswa: siswaList,
    kelas: updatedKelasList,
    nilaiAkademik: nilaiList,
    kehadiran: kehadiranList,
    catatanWali: catatanList,
    ekstrakurikuler: ekskulList,
    keputusanSiswa: keputusanList,
    piagam: piagamList,
    p5Nilai: p5NilaiList
  };
}

/**
 * Synchronize batch student imports or additions
 */
export function syncBatchStudentsRelations(prevDb: DatabaseState, students: Student[]): DatabaseState {
  let currentDb = { ...prevDb };
  for (const s of students) {
    currentDb = syncStudentRelations(currentDb, s);
  }
  return currentDb;
}

/**
 * Cleans up relations when a student is deleted and recounts class students
 */
export function cleanupDeletedStudentRelations(prevDb: DatabaseState, idSiswa: string): DatabaseState {
  const target = prevDb.siswa.find((s) => s.idSiswa === idSiswa);
  if (!target) return prevDb;

  const targetNisn = target.nisn;
  const remainingSiswa = prevDb.siswa.filter((s) => s.idSiswa !== idSiswa);

  const updatedKelas = prevDb.kelas.map((k) => ({
    ...k,
    jumlahSiswa: remainingSiswa.filter((s) => s.kelas === k.namaKelas && s.statusSiswa === 'Aktif').length
  }));

  return {
    ...prevDb,
    siswa: remainingSiswa,
    kelas: updatedKelas,
    nilaiAkademik: prevDb.nilaiAkademik.filter((n) => n.nisn !== targetNisn),
    kehadiran: prevDb.kehadiran.filter((h) => h.nisn !== targetNisn),
    catatanWali: prevDb.catatanWali.filter((c) => c.nisn !== targetNisn),
    ekstrakurikuler: prevDb.ekstrakurikuler.filter((e) => e.nisn !== targetNisn),
    keputusanSiswa: (prevDb.keputusanSiswa || []).filter((d) => d.nisn !== targetNisn),
    piagam: (prevDb.piagam || []).filter((p) => p.nisn !== targetNisn),
    p5Nilai: (prevDb.p5Nilai || []).filter((p) => p.nisn !== targetNisn)
  };
}

/**
 * Synchronize all existing students across all classes and subjects
 */
export function syncAllStudents(prevDb: DatabaseState): DatabaseState {
  return syncBatchStudentsRelations(prevDb, prevDb.siswa);
}
