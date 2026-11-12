import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  School,
  Calendar,
  MapPin,
  Edit3,
  CheckCircle2,
  X,
  Save,
  Users,
  Award,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  BookOpen,
  Layers,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassLevel, StudentDecision, SemesterType } from '../../types';
import { LogoKabupaten, LogoTutWuriHandayani } from '../common/OfficialLogos';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { ReportCoverPage } from '../common/ReportCoverPage';
import { ReportSchoolIdentityPage } from '../common/ReportSchoolIdentityPage';
import { ReportStudentIdentityPage } from '../common/ReportStudentIdentityPage';
import { PrintTypographyControl } from '../common/PrintTypographyControl';
import { generateReportDescriptionFromTP, getNamaPelajaranAgama } from '../../utils/tpDescriptionHelper';
import { parseAndImportTemplate } from '../../utils/templateImporter';
import * as XLSX from 'xlsx';

function getNextClass(current: ClassLevel): string {
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

function getCurrentClassText(current: ClassLevel): string {
  switch (current) {
    case 'I':
      return 'I (Satu)';
    case 'II':
      return 'II (Dua)';
    case 'III':
      return 'III (Tiga)';
    case 'IV':
      return 'IV (Empat)';
    case 'V':
      return 'V (Lima)';
    case 'VI':
      return 'VI (Enam)';
    case 'VII':
      return 'VII (Tujuh)';
    case 'VIII':
      return 'VIII (Delapan)';
    case 'IX':
      return 'IX (Sembilan)';
    case 'X':
      return 'X (Sepuluh)';
    case 'XI':
      return 'XI (Sebelas)';
    case 'XII':
      return 'XII (Dua Belas)';
    case 'XIII':
      return 'XIII (Tiga Belas)';
    default:
      return `${current}`;
  }
}

interface AcademicReportViewSectionProps {
  forcedSemester?: 'Ganjil' | 'Genap';
}

export const AcademicReportViewSection: React.FC<AcademicReportViewSectionProps> = ({ forcedSemester }) => {
  const appContext = useApp();
  const {
    db,
    selectedKelas,
    selectedSemester,
    setSelectedSemester,
    selectedFase,
    printTargetStudentId,
    setPrintTargetStudentId,
    saveKeputusanSiswa,
    bulkSaveKeputusanSiswa,
    syncAllScoresWithTPDescriptions,
    showSaveNotification,
    openReportPreview,
    printFontFamily,
    printFontSize
  } = appContext;

  const handleImportFile = async (file: File) => {
    try {
      const res = await parseAndImportTemplate(file, undefined, appContext);
      if (res.success) {
        showSaveNotification(res.message);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
    }
  };

  const activeSemester: SemesterType = forcedSemester || selectedSemester;

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);
  const currentStudent = siswaKelas.find((s) => s.idSiswa === printTargetStudentId) || siswaKelas[0];

  const [openDecisionModal, setOpenDecisionModal] = useState(false);
  const [activePage, setActivePage] = useState<'kaver' | 'rapor_peserta_didik' | 'identitas' | 'rapor' | 'semua'>('semua');
  const [scrollBarMode, setScrollBarMode] = useState<'full' | 'compact' | 'hidden'>('full');

  // Cari keputusan siswa saat ini dari database
  const currentDecision = db.keputusanSiswa?.find(
    (k) =>
      k.nisn === currentStudent?.nisn &&
      k.kelas === selectedKelas &&
      k.semester === activeSemester
  );

  // Form state untuk modal keputusan
  const [decisionForm, setDecisionForm] = useState<{
    status: 'Naik Kelas' | 'Tinggal di Kelas' | 'Lulus' | 'Belum Ditetapkan';
    naikKelas: string;
    tinggalKelas: string;
    applyToAll: boolean;
  }>({
    status: currentDecision?.statusKeputusan || 'Naik Kelas',
    naikKelas: currentDecision?.naikKelas || getNextClass(selectedKelas),
    tinggalKelas: currentDecision?.tinggalKelas || '-',
    applyToAll: false
  });

  const handleOpenDecisionModal = () => {
    if (currentDecision) {
      setDecisionForm({
        status: currentDecision.statusKeputusan,
        naikKelas: currentDecision.naikKelas,
        tinggalKelas: currentDecision.tinggalKelas,
        applyToAll: false
      });
    } else {
      // Default naik kelas
      setDecisionForm({
        status: 'Naik Kelas',
        naikKelas: getNextClass(selectedKelas),
        tinggalKelas: '-',
        applyToAll: false
      });
    }
    setOpenDecisionModal(true);
  };

  // Filter Mata Pelajaran (Wajib / Pilihan)
  type MapelCategoryFilter = 'semua' | 'wajib' | 'pilihan';
  const [mapelCategoryFilter, setMapelCategoryFilter] = useState<MapelCategoryFilter>('semua');

  // Daftar mapel pilihan & muatan lokal yang ada di DB
  const mapelPilihanList = useMemo(() => {
    return db.mataPelajaran.filter((m) => m.kelompok === 'Pilihan' || m.kelompok === 'Muatan Lokal');
  }, [db.mataPelajaran]);

  // Set mata pelajaran pilihan yang aktif dicentang untuk ditampilkan di rapor
  const [activePilihanMapels, setActivePilihanMapels] = useState<string[]>(() => {
    return db.mataPelajaran
      .filter((m) => m.kelompok === 'Pilihan' || m.kelompok === 'Muatan Lokal')
      .map((m) => m.mataPelajaran);
  });

  const togglePilihanMapel = (namaMapel: string) => {
    setActivePilihanMapels((prev) =>
      prev.includes(namaMapel) ? prev.filter((m) => m !== namaMapel) : [...prev, namaMapel]
    );
  };

  const selectAllPilihan = () => {
    setActivePilihanMapels(mapelPilihanList.map((m) => m.mataPelajaran));
  };

  const clearAllPilihan = () => {
    setActivePilihanMapels([]);
  };

  // Filter Mata Pelajaran berdasarkan kategori dan pilihan aktif
  const filteredMataPelajaran = useMemo(() => {
    return db.mataPelajaran.filter((m) => {
      if (mapelCategoryFilter === 'wajib') {
        return m.kelompok === 'Wajib';
      }
      if (mapelCategoryFilter === 'pilihan') {
        return (m.kelompok === 'Pilihan' || m.kelompok === 'Muatan Lokal') && activePilihanMapels.includes(m.mataPelajaran);
      }
      // 'semua': Wajib selalu ada, Pilihan/Mulok ada jika aktif dicentang
      if (m.kelompok === 'Pilihan' || m.kelompok === 'Muatan Lokal') {
        return activePilihanMapels.includes(m.mataPelajaran);
      }
      return true;
    });
  }, [db.mataPelajaran, mapelCategoryFilter, activePilihanMapels]);

  const handleSelectStatus = (status: 'Naik Kelas' | 'Tinggal di Kelas' | 'Lulus' | 'Belum Ditetapkan') => {
    if (status === 'Naik Kelas') {
      setDecisionForm((prev) => ({
        ...prev,
        status,
        naikKelas: getNextClass(selectedKelas),
        tinggalKelas: '-'
      }));
    } else if (status === 'Tinggal di Kelas') {
      setDecisionForm((prev) => ({
        ...prev,
        status,
        naikKelas: '-',
        tinggalKelas: getCurrentClassText(selectedKelas)
      }));
    } else if (status === 'Lulus') {
      setDecisionForm((prev) => ({
        ...prev,
        status,
        naikKelas: 'Lulus dari Satuan Pendidikan SD Negeri Balil',
        tinggalKelas: '-'
      }));
    } else {
      setDecisionForm((prev) => ({
        ...prev,
        status,
        naikKelas: '........................................................',
        tinggalKelas: '........................................................'
      }));
    }
  };

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (decisionForm.applyToAll) {
      // Terapkan ke semua siswa di kelas ini
      const decisions: StudentDecision[] = siswaKelas.map((s) => ({
        nisn: s.nisn,
        namaSiswa: s.namaSiswa,
        kelas: selectedKelas,
        semester: selectedSemester,
        tahunPelajaran: db.sekolah.tahunPelajaran,
        statusKeputusan: decisionForm.status,
        naikKelas: decisionForm.naikKelas,
        tinggalKelas: decisionForm.tinggalKelas
      }));
      bulkSaveKeputusanSiswa(decisions);
    } else {
      // Simpan hanya untuk siswa saat ini
      const decision: StudentDecision = {
        nisn: currentStudent.nisn,
        namaSiswa: currentStudent.namaSiswa,
        kelas: selectedKelas,
        semester: selectedSemester,
        tahunPelajaran: db.sekolah.tahunPelajaran,
        statusKeputusan: decisionForm.status,
        naikKelas: decisionForm.naikKelas,
        tinggalKelas: decisionForm.tinggalKelas
      };
      saveKeputusanSiswa(decision);
    }

    setOpenDecisionModal(false);
  };

  // Handler Cetak Otomatis Semua Halaman (Buku Rapor Lengkap Hal 1 s.d. 4)
  const handlePrintAllPages = () => {
    setActivePage('semua');
    showSaveNotification('Mempersiapkan pencetakan otomatis semua halaman rapor (Kaver, Sekolah, Biodata Siswa, Nilai & TTD)...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handler Cetak Halaman Aktif Saja
  const handlePrintCurrentPage = () => {
    window.print();
  };

  // Default print: Otomatis semua halaman
  const handlePrint = () => {
    handlePrintAllPages();
  };

  const reportPageIds = ['hal-1-kaver', 'hal-2-sekolah', 'hal-3-siswa', 'hal-4-rapor', 'hal-5-keputusan'];

  // Navigasi scroll halus ke halaman spesifik rapor
  const scrollToReportPage = (elementId: string) => {
    if (activePage !== 'semua') {
      setActivePage('semua');
      setTimeout(() => {
        const el = document.getElementById(elementId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const el = document.getElementById(elementId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToNextReportPage = () => {
    if (activePage !== 'semua') setActivePage('semua');
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;
    const currentScroll = scrollContainer.scrollTop;
    for (const id of reportPageIds) {
      const el = document.getElementById(id);
      if (el && el.offsetTop > currentScroll + 80) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
  };

  const scrollToPrevReportPage = () => {
    if (activePage !== 'semua') setActivePage('semua');
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;
    const currentScroll = scrollContainer.scrollTop;
    for (let i = reportPageIds.length - 1; i >= 0; i--) {
      const id = reportPageIds[i];
      const el = document.getElementById(id);
      if (el && el.offsetTop < currentScroll - 80) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadReportTemplate = () => {
    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';

    const wb = XLSX.utils.book_new();
    const columns = [
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Semester',
      'Mata Pelajaran',
      'KKM',
      'Nilai Akhir',
      'Capaian Kompetensi',
      'Deskripsi Capaian Pembelajaran dari TP',
      'Kehadiran (S/I/A)',
      'Catatan Wali Kelas',
      'Keputusan Kenaikan Kelas'
    ];

    const aoaData: (string | number)[][] = [
      [pemda],
      [instansi],
      [schoolName],
      [`FORMAT RESMI RAPOR AKHIR SEMESTER: ${activeSemester === 'Ganjil' || activeSemester === '1' ? 'SEMESTER 1 (GANJIL)' : 'SEMESTER 2 (GENAP)'}`],
      [`Nama Siswa: ${currentStudent?.namaSiswa || '-'} • NISN: ${currentStudent?.nisn || '-'} • Kelas: ${selectedKelas}`],
      [],
      ['NO', ...columns],
      ['(1)', ...columns.map((_, i) => `(${i + 2})`)],
      ...studentScores.map((sc, i) => [
        i + 1,
        currentStudent?.nisn || '-',
        currentStudent?.namaSiswa || '-',
        selectedKelas,
        activeSemester,
        sc.mapel.mataPelajaran,
        sc.score.kkm,
        sc.score.nilaiAkhir,
        sc.score.capaianKompetensi,
        sc.score.deskripsiRapor,
        `${studentAttendance.sakit}S / ${studentAttendance.izin}I / ${studentAttendance.alpa}A`,
        studentNote,
        displayNaikKelas
      ]),
      ['', '', '', '', 'JUMLAH NILAI', '', totalNilai, '', '', '', '', ''],
      ['', '', '', '', 'RATA-RATA NILAI', '', Number(rataRataNilai), '', '', '', '', '']
    ];

    for (let i = 0; i < 5; i++) {
      aoaData.push([studentScores.length + 1 + i, ...columns.map(() => '')]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 8 },
      { wch: 10 },
      { wch: 32 },
      { wch: 8 },
      { wch: 12 },
      { wch: 22 },
      { wch: 60 },
      { wch: 16 },
      { wch: 45 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Rapor');
    XLSX.writeFile(wb, `template-rapor-semester-${activeSemester}-kelas-${selectedKelas}.xlsx`);
    showSaveNotification('Template resmi Rapor Akhir Semester (.xlsx) berhasil diunduh!');
  };

  const handlePrevStudent = () => {
    if (!currentStudent) return;
    const currentIdx = siswaKelas.findIndex((s) => s.idSiswa === currentStudent.idSiswa);
    if (currentIdx > 0) {
      setPrintTargetStudentId(siswaKelas[currentIdx - 1].idSiswa);
    }
  };

  const handleNextStudent = () => {
    if (!currentStudent) return;
    const currentIdx = siswaKelas.findIndex((s) => s.idSiswa === currentStudent.idSiswa);
    if (currentIdx < siswaKelas.length - 1) {
      setPrintTargetStudentId(siswaKelas[currentIdx + 1].idSiswa);
    }
  };

  if (!currentStudent) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
        Belum ada data siswa di kelas {selectedKelas}. Silakan tambahkan data siswa terlebih dahulu.
      </div>
    );
  }

  // Get matching academic scores dynamically linked to Tujuan Pembelajaran (TP)
  const studentScores = filteredMataPelajaran.map((m) => {
    const sc = db.nilaiAkademik.find(
      (n) =>
        n.nisn === currentStudent.nisn &&
        n.mataPelajaran === m.mataPelajaran &&
        n.kelas === selectedKelas &&
        n.semester === activeSemester
    );

    const kkm = sc?.kkm || m.kkm || 75;
    const nilaiAkhir = sc ? sc.nilaiAkhir : 80;
    const tpResult = generateReportDescriptionFromTP(
      m.mataPelajaran,
      selectedKelas,
      nilaiAkhir,
      db.tujuanPembelajaran,
      currentStudent.namaSiswa,
      currentStudent.agama
    );

    // If score has custom non-empty description, respect it; otherwise use the connected TP description
    const deskripsiRapor =
      sc?.deskripsiRapor && sc.deskripsiRapor.trim() !== ''
        ? sc.deskripsiRapor
        : tpResult.deskripsiRapor;

    const capaianKompetensi =
      sc?.capaianKompetensi ||
      (nilaiAkhir >= 88
        ? 'Sangat Baik'
        : nilaiAkhir >= 78
        ? 'Baik'
        : nilaiAkhir >= 68
        ? 'Cukup'
        : 'Perlu Pendampingan');

    return {
      mapel: m,
      score: {
        kkm,
        nilaiAkhir,
        capaianKompetensi,
        deskripsiRapor,
        deskripsiTercapai: sc?.deskripsiTercapai || tpResult.deskripsiTercapai,
        deskripsiPerluPeningkatan: sc?.deskripsiPerluPeningkatan || tpResult.deskripsiPerluPeningkatan
      },
      linkedTpKodes: tpResult.linkedTpKodes
    };
  });

  // Hitung Jumlah Nilai & Rata-Rata Nilai
  const totalNilai = studentScores.reduce((acc, curr) => acc + curr.score.nilaiAkhir, 0);
  const rataRataNilai = studentScores.length > 0 ? (totalNilai / studentScores.length).toFixed(2) : '0';

  // Ekstrakurikuler siswa
  const studentEkskul = db.ekstrakurikuler.filter(
    (e) => e.nisn === currentStudent.nisn && e.kelas === selectedKelas && e.semester === activeSemester
  );

  // Kehadiran siswa
  const studentAttendance = db.kehadiran.find(
    (k) => k.nisn === currentStudent.nisn && k.kelas === selectedKelas && k.semester === activeSemester
  ) || {
    sakit: 0,
    izin: 1,
    alpa: 0
  };

  // Catatan wali kelas
  const studentNote =
    db.catatanWali.find(
      (c) => c.nisn === currentStudent.nisn && c.kelas === selectedKelas && c.semester === activeSemester
    )?.catatanWaliKelas || 'Pertahankan prestasi belajar dan tingkatkan terus keaktifan di kelas.';

  // Wali Kelas info
  const waliKelasData = db.kelas.find((k) => k.namaKelas === selectedKelas);
  const matchedTeacher = db.guru.find((g) => g.namaGuru === waliKelasData?.waliKelas) || db.guru[0];
  const waliKelasGuru = {
    namaGuru:
      db.sekolah.waliKelas && db.sekolah.kelas === selectedKelas
        ? db.sekolah.waliKelas
        : matchedTeacher?.namaGuru || 'Agus Rama, S.Pd.Gr.',
    nip:
      db.sekolah.nipWaliKelas && db.sekolah.kelas === selectedKelas
        ? db.sekolah.nipWaliKelas
        : matchedTeacher?.nip || '19960816 202203 1 004'
  };

  // Nilai teks keputusan untuk ditampilkan
  const displayNaikKelas =
    currentDecision?.statusKeputusan === 'Naik Kelas'
      ? currentDecision.naikKelas || getNextClass(selectedKelas)
      : currentDecision?.statusKeputusan === 'Tinggal di Kelas'
      ? '-'
      : currentDecision?.naikKelas || '........................................................';

  const displayTinggalKelas =
    currentDecision?.statusKeputusan === 'Tinggal di Kelas'
      ? currentDecision.tinggalKelas || getCurrentClassText(selectedKelas)
      : currentDecision?.statusKeputusan === 'Naik Kelas'
      ? '-'
      : currentDecision?.tinggalKelas || '........................................................';

  return (
    <div className="space-y-6">
      {/* Control Bar (hidden on print) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              activeSemester === 'Ganjil' || activeSemester === '1'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {!forcedSemester
                  ? `Rapor Gabungan Semester 1 & 2 • Lembar Aktif: ${activeSemester === 'Ganjil' || activeSemester === '1' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)'}`
                  : activeSemester === 'Ganjil' || activeSemester === '1'
                  ? 'Pratinjau Rapor Semester 1 (Ganjil) - Sendiri'
                  : 'Pratinjau Rapor Semester 2 (Genap) - Sendiri'}
              </h2>
              <p className="text-xs text-slate-500">
                Format Resmi Kurikulum Merdeka • Kelas {selectedKelas} • {
                  !forcedSemester
                    ? 'Rapor Gabungan Semester Satu dan Semester Dua (Gunakan tombol tab di bawah untuk beralih lembar)'
                    : activeSemester === 'Ganjil' || activeSemester === '1'
                    ? 'Semester 1 (Ganjil - Sendiri)'
                    : 'Semester 2 (Genap + Keputusan Kenaikan Kelas)'
                }
              </p>
            </div>
          </div>

          {/* Student Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrevStudent}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Siswa Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              value={currentStudent.idSiswa}
              onChange={(e) => setPrintTargetStudentId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
            >
              {siswaKelas.map((s) => (
                <option key={s.idSiswa} value={s.idSiswa}>
                  {s.namaSiswa} ({s.nisn})
                </option>
              ))}
            </select>

            <button
              onClick={handleNextStudent}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Siswa Berikutnya"
            >
              <ChevronRight size={16} />
            </button>

            {/* Tombol Sinkronkan / Hubungkan TP ke Rapor */}
            <button
              type="button"
              onClick={() => {
                const count = syncAllScoresWithTPDescriptions(activeSemester);
                showSaveNotification(`Berhasil memperbarui ${count} data deskripsi dari TP ke rapor!`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Hubungkan & perbarui rumusan deskripsi rapor dari database Tujuan Pembelajaran (TP) mata pelajaran"
            >
              <CheckCircle2 size={14} />
              <span>⚡ Hubungkan TP ke Rapor</span>
            </button>

            {/* Tombol Input Keputusan (Hanya Relevan untuk Semester 2) */}
            {(activeSemester === 'Genap' || activeSemester === '2') && (
              <button
                type="button"
                onClick={handleOpenDecisionModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Atur Keputusan Naik Kelas / Tinggal di Kelas"
              >
                <Edit3 size={14} />
                <span>Input Keputusan</span>
              </button>
            )}

            {/* Tombol Preview Rapor Layar Penuh (Pop-up Interaktif) */}
            <button
              type="button"
              onClick={() => openReportPreview(currentStudent.idSiswa)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer ring-2 ring-purple-300 hover:scale-102"
              title="Buka Pratinjau Rapor Layar Penuh Pop-up untuk siswa ini"
            >
              <Eye size={15} className="text-amber-300" />
              <span>👁️ Preview Rapor</span>
            </button>

            {/* Tombol Cetak Otomatis Semua Halaman (Buku Rapor Lengkap 1 s.d. 4) */}
            <button
              type="button"
              onClick={handlePrintAllPages}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer ring-2 ring-blue-300 hover:scale-101"
              title="Cetak otomatis seluruh halaman buku rapor: Kaver, Satuan Pendidikan, Identitas Siswa, Lembar Nilai, Catatan & TTD"
            >
              <Printer size={16} className="text-amber-300" />
              <span>🖨️ Cetak Semua Halaman (Otomatis)</span>
            </button>

            {/* Tombol Cetak Lembar Aktif */}
            <button
              type="button"
              onClick={handlePrintCurrentPage}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-slate-300"
              title="Cetak hanya lembar yang sedang aktif/dipilih"
            >
              <span>📄 Cetak Lembar Ini</span>
            </button>
          </div>
        </div>

        {/* TAB PILIHAN HALAMAN BUKU RAPOR: KAVER, RAPOR PESERTA DIDIK, IDENTITAS, DAN RAPOR */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-slate-700 mr-1">Halaman Buku Rapor:</span>
            <button
              type="button"
              onClick={() => setActivePage('kaver')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activePage === 'kaver'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>📘 Halaman Kaver</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage('rapor_peserta_didik')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activePage === 'rapor_peserta_didik'
                  ? 'bg-cyan-700 text-white border-cyan-700 shadow-md ring-2 ring-cyan-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>🏫 Rapor Peserta Didik</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage('identitas')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activePage === 'identitas'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>👤 Identitas Peserta Didik</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage('rapor')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activePage === 'rapor'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>📄 Rapor (Lembar Nilai)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage('semua')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activePage === 'semua'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>📑 Lengkap (Semua Halaman)</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            Halaman Aktif:{' '}
            <strong className="text-blue-900 uppercase">
              {activePage === 'kaver'
                ? 'Halaman Kaver (Sampul Depan)'
                : activePage === 'rapor_peserta_didik'
                ? 'Rapor Peserta Didik (Identitas Sekolah)'
                : activePage === 'identitas'
                ? 'Identitas Peserta Didik (Biodata Siswa)'
                : activePage === 'rapor'
                ? 'Rapor (Lembar Nilai & Capaian)'
                : 'Semua Halaman (Buku Rapor Lengkap)'}
            </strong>
          </div>
        </div>

        {/* TAB PEMISAH RAPOR SEMESTER 1 SENDIRI vs SEMESTER 2 SENDIRI */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 mr-1">Pemisahan Rapor:</span>
            <button
              type="button"
              onClick={() => setSelectedSemester('Ganjil')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activeSemester === 'Ganjil' || activeSemester === '1'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>📄 RAPOR SEMESTER 1 (GANJIL)</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                activeSemester === 'Ganjil' || activeSemester === '1'
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                SENDIRI
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSemester('Genap')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activeSemester === 'Genap' || activeSemester === '2'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>🎓 RAPOR SEMESTER 2 (GENAP)</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                activeSemester === 'Genap' || activeSemester === '2'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                + KENAIKAN KELAS
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            {activeSemester === 'Ganjil' || activeSemester === '1' ? (
              <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-bold">
                ✓ Rapor Semester 1 (Ganjil)
              </span>
            ) : (
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                ✓ Rapor Semester 2 (Genap)
              </span>
            )}
          </div>
        </div>

        {/* ROW FILTER MATA PELAJARAN PILIHAN & WAJIB */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                <Filter size={14} className="text-indigo-600" />
                Filter Mata Pelajaran di Rapor:
              </span>
              <button
                type="button"
                onClick={() => setMapelCategoryFilter('semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  mapelCategoryFilter === 'semua'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua Mapel ({db.mataPelajaran.length})
              </button>
              <button
                type="button"
                onClick={() => setMapelCategoryFilter('wajib')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  mapelCategoryFilter === 'wajib'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hanya Mapel Wajib ({db.mataPelajaran.filter((m) => m.kelompok === 'Wajib').length})
              </button>
              <button
                type="button"
                onClick={() => setMapelCategoryFilter('pilihan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  mapelCategoryFilter === 'pilihan'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Khusus Mapel Pilihan ({mapelPilihanList.length})
              </button>
            </div>

            <div className="text-[11px] text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Menampilkan <strong className="text-indigo-900">{filteredMataPelajaran.length}</strong> dari {db.mataPelajaran.length} mata pelajaran
            </div>
          </div>

          {/* CHECKLIST MATA PELAJARAN PILIHAN YANG AKTIF / DIAMBIL */}
          {mapelPilihanList.length > 0 && mapelCategoryFilter !== 'wajib' && (
            <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px]">
                  <BookOpen size={13} className="text-amber-700" />
                  Mata Pelajaran Pilihan yang Diambil Siswa (Centang untuk Tampilkan di Rapor):
                </span>
                {mapelPilihanList.map((m) => {
                  const isChecked = activePilihanMapels.includes(m.mataPelajaran);
                  return (
                    <button
                      key={m.mataPelajaran}
                      type="button"
                      onClick={() => togglePilihanMapel(m.mataPelajaran)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        isChecked
                          ? 'bg-white text-amber-950 border-amber-400 shadow-xs ring-1 ring-amber-300'
                          : 'bg-white/60 text-slate-400 border-slate-300 line-through'
                      }`}
                      title={isChecked ? 'Klik untuk sembunyikan dari rapor' : 'Klik untuk tampilkan di rapor'}
                    >
                      {isChecked ? (
                        <CheckSquare size={13} className="text-amber-600" />
                      ) : (
                        <Square size={13} className="text-slate-400" />
                      )}
                      <span>{m.mataPelajaran}</span>
                      <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-semibold">
                        {m.kelompok}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllPilihan}
                  className="px-2 py-0.5 bg-white hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-semibold cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={clearAllPilihan}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-300 font-semibold cursor-pointer"
                >
                  Hapus Pilihan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP RAPOR AKHIR SEMESTER DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Rapor Akhir Semester"
        badge={currentStudent?.namaSiswa || 'Siswa Terpilih'}
        onSave={() => showSaveNotification('Lembar rapor siswa berhasil disimpan!')}
        saveLabel="Simpan Rapor"
        onUpdate={() => showSaveNotification('Tampilan Rapor Akhir Semester diperbarui!')}
        updateLabel="Update Rapor"
        onEdit={handleOpenDecisionModal}
        editLabel="Input Keputusan"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {}}
        deleteLabel="Bersihkan Filter"
        onImport={handleImportFile}
        importLabel="Impor Data"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onExport={() => {
          const wb = XLSX.utils.book_new();
          const data: (string | number)[][] = [
            [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
            [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
            [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
            ['RAPOR (LAPORAN HASIL BELAJAR PESERTA DIDIK)'],
            [`Nama Siswa: ${currentStudent?.namaSiswa || '-'} • NISN: ${currentStudent?.nisn || '-'}`],
            [`Kelas: ${selectedKelas} • Semester: ${activeSemester}`],
            [],
            ['NO', 'MATA PELAJARAN', 'KKM', 'NILAI AKHIR', 'CAPAIAN KOMPETENSI', 'DESKRIPSI CAPAIAN'],
            ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)'],
            ...studentScores.map((sc, i) => [
              i + 1,
              sc.mapel.mataPelajaran,
              sc.score.kkm,
              sc.score.nilaiAkhir,
              sc.score.capaianKompetensi,
              sc.score.deskripsiRapor
            ]),
            ['', 'JUMLAH NILAI', '', totalNilai, '', ''],
            ['', 'RATA-RATA NILAI', '', Number(rataRataNilai), '', '']
          ];
          const ws = XLSX.utils.aoa_to_sheet(data);
          ws['!cols'] = [{ wch: 6 }, { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 60 }];
          XLSX.utils.book_append_sheet(wb, ws, 'Rapor Siswa');
          XLSX.writeFile(wb, `rapor-${currentStudent?.namaSiswa || 'siswa'}-kelas-${selectedKelas}.xlsx`);
        }}
        exportLabel="Expor Excel (.xlsx)"
        onClear={() => {}}
        clearLabel="Bersihkan"
        onPrint={handlePrint}
        onTemplate={handleDownloadReportTemplate}
        templateLabel="Template Rapor"
      />

      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 10mm 12mm 12mm 12mm;
          }
          html, body, #root, #root > div, main {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            position: static !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside, button:not(.allow-print) {
            display: none !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
            clear: both !important;
            display: block !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .print-avoid-break, .report-cover-page, table, tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .printable-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* PENGATURAN BENTUK HURUF & UKURAN HURUF CETAK RAPOR */}
      <PrintTypographyControl className="mb-4" />

      {/* FLOATING STICKY QUICK SCROLL BAR UNTUK SEMUA HALAMAN RAPOR */}
      {scrollBarMode === 'hidden' ? (
        <div className="no-print flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setScrollBarMode('full')}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md border border-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 hover:scale-102 transition-all ring-2 ring-blue-400"
            title="Tampilkan kembali bilah navigasi halaman dan cetak"
          >
            <Eye size={13} className="text-amber-400" />
            <span>📜 Tampilkan Navigasi Halaman & Cetak</span>
          </button>
        </div>
      ) : (
        <div className="no-print sticky top-2 z-20 bg-white/95 backdrop-blur-md py-2 px-3 sm:px-4 border border-slate-300 rounded-2xl shadow-md mb-6 flex flex-wrap items-center justify-between gap-2.5 transition-all">
          {/* SISI KIRI */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
              <span className="text-base">📜</span>
              <span>Scroll Halaman:</span>
            </span>
            {scrollBarMode === 'compact' && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                Mode Ramping
              </span>
            )}
          </div>

          {/* SISI KANAN: SEMUA TOMBOL TERSUSUN RAPI DI SAMPING KANAN */}
          <div className="ml-auto flex items-center justify-end flex-wrap gap-1.5 sm:gap-2">
            {/* Tombol Halaman (Hanya Tampil di Mode Penuh) */}
            {scrollBarMode === 'full' && (
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollToReportPage('hal-1-kaver')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Lompat ke Hal 1: Kaver"
                >
                  📘 Hal 1
                </button>
                <button
                  type="button"
                  onClick={() => scrollToReportPage('hal-2-sekolah')}
                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Lompat ke Hal 2: Profil Sekolah"
                >
                  🏫 Hal 2
                </button>
                <button
                  type="button"
                  onClick={() => scrollToReportPage('hal-3-siswa')}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Lompat ke Hal 3: Identitas Siswa"
                >
                  👤 Hal 3
                </button>
                <button
                  type="button"
                  onClick={() => scrollToReportPage('hal-4-rapor')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Lompat ke Hal 4: Lembar Nilai & Capaian"
                >
                  📄 Hal 4 (Nilai)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToReportPage('hal-5-keputusan')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Lompat ke Hal 5: Catatan Guru, Keputusan & TTD"
                >
                  📝 Hal 5 (Catatan & TTD)
                </button>
              </div>
            )}

            {/* Quick Scroll Next / Prev */}
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={scrollToPrevReportPage}
                className="px-2 py-1 hover:bg-white text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Scroll ke Halaman Sebelumnya"
              >
                <span>⬆️</span>
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={scrollToNextReportPage}
                className="px-2 py-1 hover:bg-white text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Scroll ke Halaman Berikutnya"
              >
                <span>⬇️</span>
                <span className="hidden sm:inline">Berikutnya</span>
              </button>
            </div>

            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-bold text-[11px] hidden md:inline">
              ↕ Scroll Bebas
            </span>

            {/* Tombol Cetak Semua Halaman */}
            <button
              type="button"
              onClick={handlePrintAllPages}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-black text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
              title="Cetak otomatis semua halaman buku rapor sekarang"
            >
              <Printer size={14} className="text-amber-300" />
              <span>Cetak Semua Halaman</span>
            </button>

            {/* Kontrol Bilah: Rampingkan / Perluas & Hilangkan */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-300 shadow-2xs">
              {scrollBarMode === 'compact' ? (
                <button
                  type="button"
                  onClick={() => setScrollBarMode('full')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Perluas tombol scroll halaman"
                >
                  <Maximize2 size={12} />
                  <span className="hidden sm:inline">Perluas</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setScrollBarMode('compact')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Rampingkan bilah scroll halaman"
                >
                  <Minimize2 size={12} />
                  <span className="hidden sm:inline">Rampingkan</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setScrollBarMode('hidden')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sembunyikan bilah scroll ini"
              >
                <EyeOff size={12} />
                <span className="hidden sm:inline">Hilangkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 scroll-smooth" id="academic-report-scroll-container">
        {/* 1. HALAMAN KAVER RAPOR */}
        {(activePage === 'kaver' || activePage === 'semua') && (
          <div id="hal-1-kaver" className={`scroll-mt-20 ${activePage === 'semua' ? 'print-page-break' : ''}`}>
            {activePage === 'semua' && (
              <div className="no-print max-w-4xl mx-auto mb-2 flex items-center justify-between text-xs font-bold text-amber-900 bg-amber-100/80 px-4 py-1.5 rounded-xl border border-amber-300">
                <span className="flex items-center gap-1.5">
                  📘 <strong>HALAMAN 1 : KAVER BUKU RAPOR (SAMPUL LUAR)</strong>
                </span>
                <span className="text-[11px] font-normal text-amber-800 font-mono">
                  {currentStudent.namaSiswa} • {db.sekolah.namaSekolah}
                </span>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full">
              <ReportCoverPage sekolah={db.sekolah} student={currentStudent} fontFamily={printFontFamily} fontSize={printFontSize} />
            </div>
          </div>
        )}

        {/* 2. HALAMAN RAPOR PESERTA DIDIK (IDENTITAS SEKOLAH) */}
        {(activePage === 'rapor_peserta_didik' || activePage === 'semua') && (
          <div id="hal-2-sekolah" className={`scroll-mt-20 ${activePage === 'semua' ? 'print-page-break' : ''}`}>
            {activePage === 'semua' && (
              <div className="no-print max-w-4xl mx-auto mb-2 flex items-center justify-between text-xs font-bold text-cyan-900 bg-cyan-100/80 px-4 py-1.5 rounded-xl border border-cyan-300">
                <span className="flex items-center gap-1.5">
                  🏫 <strong>HALAMAN 2 : RAPOR PESERTA DIDIK (IDENTITAS SATUAN PENDIDIKAN)</strong>
                </span>
                <span className="text-[11px] font-normal text-cyan-800 font-mono">
                  NPSN: {db.sekolah.npsn || '69970290'} • {db.sekolah.distrikKecamatan || 'Oksibil'}
                </span>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full">
              <ReportSchoolIdentityPage sekolah={db.sekolah} fontFamily={printFontFamily} fontSize={printFontSize} />
            </div>
          </div>
        )}

        {/* 3. HALAMAN IDENTITAS PESERTA DIDIK (BIODATA LENGKAP SISWA) */}
        {(activePage === 'identitas' || activePage === 'semua') && (
          <div id="hal-3-siswa" className={`scroll-mt-20 ${activePage === 'semua' ? 'print-page-break' : ''}`}>
            {activePage === 'semua' && (
              <div className="no-print max-w-4xl mx-auto mb-2 flex items-center justify-between text-xs font-bold text-purple-900 bg-purple-100/80 px-4 py-1.5 rounded-xl border border-purple-300">
                <span className="flex items-center gap-1.5">
                  👤 <strong>HALAMAN 3 : IDENTITAS PESERTA DIDIK (BIODATA LENGKAP SISWA)</strong>
                </span>
                <span className="text-[11px] font-normal text-purple-800 font-mono">
                  NISN: {currentStudent.nisn || '-'} • Lahir: {currentStudent.tempatLahir || 'Mabilabol'}
                </span>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full">
              <ReportStudentIdentityPage sekolah={db.sekolah} student={currentStudent} fontFamily={printFontFamily} fontSize={printFontSize} />
            </div>
          </div>
        )}

        {/* 4. HALAMAN RAPOR (LEMBAR NILAI & CAPAIAN BELAJAR) */}
        {(activePage === 'rapor' || activePage === 'semua') && (
          <div id="hal-4-rapor" className={`scroll-mt-20 ${activePage === 'semua' ? 'print-page-break' : ''}`}>
            {activePage === 'semua' && (
              <div className="no-print max-w-4xl mx-auto mb-2 flex items-center justify-between text-xs font-bold text-blue-900 bg-blue-100/80 px-4 py-1.5 rounded-xl border border-blue-300">
                <span className="flex items-center gap-1.5">
                  📄 <strong>HALAMAN 4 : RAPOR (LEMBAR NILAI AKADEMIK & CAPAIAN KOMPETENSI)</strong>
                </span>
                <span className="text-[11px] font-normal text-blue-800 font-mono">
                  Semester {activeSemester === 'Ganjil' || activeSemester === '1' ? '1 (Ganjil)' : '2 (Genap)'} • TP: {db.sekolah.tahunPelajaran}
                </span>
              </div>
            )}
            <div
              className="report-typography-scope bg-white rounded-2xl border border-slate-300 shadow-lg p-6 sm:p-10 max-w-4xl mx-auto printable-area text-slate-900 leading-normal print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full"
              style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
            >
            {/* KOP RAPOR */}
        <div className="pb-4 border-b-2 border-slate-900 mb-6 flex items-center justify-between gap-4 text-center">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <LogoKabupaten
              url={db.sekolah.logoKiriUrl}
              size={76}
              className="w-16 h-16 sm:w-20 sm:h-20"
              label="Logo Pemda Kabupaten"
            />
          </div>

          <div className="flex-1 text-center">
            <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
              {db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
            </div>
            <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
              {db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase my-0.5">
              {db.sekolah.namaSekolah}
            </h1>
            <p className="text-[11px] text-slate-600 leading-tight">
              Alamat: {db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan}, Kab. {db.sekolah.kabupaten}, Prov. {db.sekolah.provinsi}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              NPSN: {db.sekolah.npsn} | NSS: {db.sekolah.nss}
            </p>
          </div>

          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <LogoTutWuriHandayani
              url={db.sekolah.logoKananUrl}
              size={76}
              className="w-16 h-16 sm:w-20 sm:h-20"
              label="Logo Tut Wuri Handayani"
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase underline underline-offset-4 text-slate-950 font-serif">
            RAPOR
          </h2>
          <span className="text-xs font-bold text-slate-600 block mt-1 tracking-wider uppercase">
            LAPORAN HASIL BELAJAR PESERTA DIDIK • SEMESTER {activeSemester === 'Ganjil' || activeSemester === '1' ? '1 (GANJIL)' : '2 (GENAP)'} • TAHUN PELAJARAN {db.sekolah.tahunPelajaran}
          </span>
        </div>

        {/* IDENTITAS RAPOR */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs pb-4 border-b border-slate-300 mb-5">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 text-slate-600">Nama Peserta Didik</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">{currentStudent.namaSiswa}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">NISN / NIS</span>
              <span className="w-3">:</span>
              <span className="font-mono text-slate-800">
                {currentStudent.nisn && !currentStudent.nisn.startsWith('BLM_') && currentStudent.nisn !== '-'
                  ? currentStudent.nisn
                  : '-'}{' '}
                /{' '}
                {currentStudent.nis && currentStudent.nis !== '-' ? currentStudent.nis : '-'}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Nama Sekolah</span>
              <span className="w-3">:</span>
              <span className="font-semibold text-slate-800">{db.sekolah.namaSekolah}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Alamat Sekolah</span>
              <span className="w-3">:</span>
              <span className="text-slate-700">{db.sekolah.alamat}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 text-slate-600">Kelas / Rombel</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">
                {selectedKelas}{' '}
                {db.sekolah.rombel && db.sekolah.kelas === selectedKelas
                  ? `(${db.sekolah.rombel})`
                  : ''}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Face / Fase</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">{selectedFase}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Semester</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">
                {activeSemester === 'Ganjil' || activeSemester === '1'
                  ? '1 (Satu / Ganjil)'
                  : '2 (Dua / Genap)'}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Tahun Pelajaran</span>
              <span className="w-3">:</span>
              <span className="font-semibold text-slate-800">{db.sekolah.tahunPelajaran}</span>
            </div>
          </div>
        </div>

        {/* A. NILAI CAPAIAN KOMPETENSI */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2 text-slate-800">
            A. NILAI AKADEMIK & CAPAIAN KOMPETENSI
          </h3>
          <table className="w-full text-[11px] border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-900 py-2 px-2 text-center w-8">No</th>
                <th className="border border-slate-900 py-2 px-3 text-left w-52">Mata Pelajaran</th>
                <th className="border border-slate-900 py-2 px-2 text-center w-14">KKM</th>
                <th className="border border-slate-900 py-2 px-2 text-center w-16">Nilai Akhir</th>
                <th className="border border-slate-900 py-2 px-2 text-center w-28">Capaian Kompetensi</th>
                <th className="border border-slate-900 py-2 px-3 text-left">Deskripsi Capaian Pembelajaran</th>
              </tr>
            </thead>
            <tbody>
              {studentScores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-slate-900 py-6 text-center text-slate-500 italic">
                    Tidak ada mata pelajaran yang dipilih pada filter ini. Silakan aktifkan kembali mata pelajaran melalui panel filter di atas.
                  </td>
                </tr>
              ) : (
                studentScores.map((item, idx) => (
                  <tr
                    key={item.mapel.kode || item.mapel.mataPelajaran || idx}
                    className="border-t border-slate-900"
                  >
                    <td className="border border-slate-900 py-2 px-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-900 py-2 px-3 font-semibold text-slate-900">
                      {getNamaPelajaranAgama(item.mapel.mataPelajaran, currentStudent.agama)}
                      <span className={`inline-block ml-1.5 text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        item.mapel.kelompok === 'Pilihan'
                          ? 'bg-amber-100 text-amber-800'
                          : item.mapel.kelompok === 'Muatan Lokal'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.mapel.kelompok}
                      </span>
                    </td>
                    <td className="border border-slate-900 py-2 px-2 text-center font-mono font-bold text-slate-800">
                      {item.score.kkm}
                    </td>
                    <td className="border border-slate-900 py-2 px-2 text-center font-bold font-mono text-sm">
                      {item.score.nilaiAkhir}
                    </td>
                    <td className="border border-slate-900 py-2 px-2 text-center font-semibold text-slate-800">
                      {item.score.capaianKompetensi}
                    </td>
                    <td className="border border-slate-900 py-2 px-3 leading-relaxed text-slate-700">
                      <div>{item.score.deskripsiRapor}</div>
                      {item.linkedTpKodes && item.linkedTpKodes.length > 0 && (
                        <div className="text-[9px] text-emerald-800 font-mono font-semibold mt-1 no-print flex items-center gap-1">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Terhubung TP: {item.linkedTpKodes.join(', ')}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 text-slate-950 font-bold border-t-2 border-slate-900">
                <td colSpan={3} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider font-bold">
                  JUMLAH NILAI
                </td>
                <td className="border border-slate-900 py-2 px-2 text-center font-mono text-sm font-black bg-slate-200">
                  {totalNilai}
                </td>
                <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-600 text-[10px]">
                  Total akumulasi capaian nilai seluruh mata pelajaran
                </td>
              </tr>
              <tr className="bg-slate-100 text-slate-950 font-bold border-t border-slate-900">
                <td colSpan={3} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider font-bold">
                  RATA-RATA NILAI
                </td>
                <td className="border border-slate-900 py-2 px-2 text-center font-mono text-sm font-black bg-amber-100 text-amber-950">
                  {rataRataNilai}
                </td>
                <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-600 text-[10px]">
                  Rata-rata perolehan nilai peserta didik (Skala 0 - 100)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* FOOTER HALAMAN 4 */}
        <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500 font-mono mt-4">
          <span>Rapor Peserta Didik • {currentStudent.namaSiswa} ({currentStudent.nisn || '-'})</span>
          <span>Halaman 4 dari 5</span>
        </div>
      </div>
    </div>
  )}

  {/* 5. HALAMAN CATATAN GURU, KETIDAKHADIRAN, KEPUTUSAN & PENGESAHAN TANDA TANGAN */}
  {(activePage === 'rapor' || activePage === 'semua') && (
    <div id="hal-5-keputusan" className={`scroll-mt-20 ${activePage === 'semua' ? 'print-page-break' : ''}`}>
      {activePage === 'semua' && (
        <div className="no-print max-w-4xl mx-auto mb-2 flex items-center justify-between text-xs font-bold text-emerald-900 bg-emerald-100/80 px-4 py-1.5 rounded-xl border border-emerald-300">
          <span className="flex items-center gap-1.5">
            📝 <strong>HALAMAN 5 : CATATAN GURU, KETIDAKHADIRAN, KEPUTUSAN & PENGESAHAN TTD</strong>
          </span>
          <span className="text-[11px] font-normal text-emerald-800 font-mono">
            {currentStudent.namaSiswa} • Kelas {selectedKelas}
          </span>
        </div>
      )}

      <div
        className="report-typography-scope bg-white rounded-2xl border border-slate-300 shadow-lg p-6 sm:p-10 max-w-4xl mx-auto printable-area text-slate-900 leading-normal print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full"
        style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
      >
        {/* HEADER IDENTITAS SINGKAT HALAMAN 5 */}
        <div className="pb-3 border-b-2 border-slate-900 mb-6 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-900 block font-serif">
              {db.sekolah.namaSekolah}
            </span>
            <span className="text-[11px] text-slate-600">
              Nama Siswa: <strong className="text-slate-900">{currentStudent.namaSiswa}</strong> • NISN: <span className="font-mono">{currentStudent.nisn || '-'}</span>
            </span>
          </div>
          <div className="text-right text-[11px] text-slate-700">
            <div>Kelas: <strong className="text-slate-900">{selectedKelas}</strong> • Semester: <strong className="text-slate-900">{activeSemester}</strong></div>
            <div>Tahun Pelajaran: <strong>{db.sekolah.tahunPelajaran}</strong></div>
          </div>
        </div>

        {/* B. CATATAN GURU / WALI KELAS */}
        <div className="mb-5 mt-4">
          <div className="border border-slate-900 p-3 bg-white">
            <div className="font-bold text-xs text-slate-900 mb-1">
              Catatan Guru :
            </div>
            <div className="text-xs italic leading-relaxed text-slate-800">
              {studentNote || 'Puji Tuhan, Sesilia Tingkatkan prestasi belajar lebih Rajin lagi, jangan lupa berdoa sebelum belajar, dan kurangi bermain belajar membaca lebih banyak di rumah !!'}
            </div>
          </div>
        </div>

        {/* C. KETIDAKHADIRAN & KEPUTUSAN BERDAMPINGAN DUA KOLOM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 items-start">
          {/* Kolom Kiri: Ketidakhadiran */}
          <div className="border border-slate-900 bg-white">
            <div className="bg-slate-100 font-bold text-xs py-1.5 px-3 border-b border-slate-900 text-slate-900 uppercase">
              Ketidakhadiran
            </div>
            <div className="p-3 text-xs space-y-1.5 text-slate-900">
              <div className="flex justify-between">
                <span>Sakit</span>
                <span className="font-mono font-bold">: {studentAttendance.sakit > 0 ? `${studentAttendance.sakit} hari` : '_ hari'}</span>
              </div>
              <div className="flex justify-between">
                <span>Izin</span>
                <span className="font-mono font-bold">: {studentAttendance.izin > 0 ? `${studentAttendance.izin} hari` : '_ hari'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanpa Keterangan</span>
                <span className="font-mono font-bold">: {studentAttendance.alpa > 0 ? `${studentAttendance.alpa} hari` : '1 hari'}</span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Keputusan Kenaikan Kelas */}
          <div className="border border-slate-900 bg-white p-3 text-xs">
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Keputusan :</span>
              <button
                type="button"
                onClick={handleOpenDecisionModal}
                className="no-print inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] rounded transition-all cursor-pointer border border-amber-500"
                title="Input Keputusan"
              >
                <Edit3 size={11} />
                <span>Edit</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-800 leading-snug mb-2">
              Berdasarkan pencapaian kompetensi pada smt 1 dan smt 2, peserta didik
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex">
                <span className="w-28 text-slate-800">Naik ke kelas</span>
                <span className="w-3">:</span>
                <span className="font-bold text-slate-950">
                  {displayNaikKelas && displayNaikKelas !== '-' ? displayNaikKelas : 'II (Dua)'}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-800">Tinggal di kelas</span>
                <span className="w-3">:</span>
                <span className="font-mono text-slate-900">
                  {displayTinggalKelas || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* D. KEGIATAN EKSTRAKURIKULER (OPSIONAL DI BAWAH JIKA ADA) */}
        {studentEkskul.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-800">
              Kegiatan Ekstrakurikuler
            </h4>
            <table className="w-full text-[11px] border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="border border-slate-900 py-1 px-2 text-center w-8">No</th>
                  <th className="border border-slate-900 py-1 px-3 text-left">Kegiatan Ekstrakurikuler</th>
                  <th className="border border-slate-900 py-1 px-3 text-center w-28">Predikat</th>
                  <th className="border border-slate-900 py-1 px-3 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {studentEkskul.map((e, idx) => (
                  <tr key={e.id}>
                    <td className="border border-slate-900 py-1 px-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-900 py-1 px-3 font-medium">{e.jenisEkstrakurikuler}</td>
                    <td className="border border-slate-900 py-1 px-3 text-center font-bold">{e.predikat}</td>
                    <td className="border border-slate-900 py-1 px-3 text-slate-700">{e.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* E. PENGESAHAN TANDA TANGAN */}
        <div className="text-xs pt-4 font-serif text-black">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-left">
              <p className="font-medium text-slate-800">Mengetahui :</p>
              <p className="font-bold text-slate-900 mb-14">Orang Tua/Wali,</p>
              <p className="font-black underline uppercase text-slate-950 tracking-wide">
                {currentStudent.namaAyah || currentStudent.namaWali || 'FRENGKY A KASIPMABIN'}
              </p>
            </div>

            <div className="text-left pl-8 sm:pl-16">
              <p className="text-slate-800">
                {db.sekolah.tempatRapor || 'Oksibil'}, {db.sekolah.tanggalRapor || '25 Juli 2021'}
              </p>
              <p className="font-bold text-slate-900 mb-14">Guru Kelas,</p>
              <p className="font-black underline text-slate-950 tracking-wide">
                {waliKelasGuru.namaGuru || 'Yohana Ibu, S.Pd'}
              </p>
              <p className="text-[11px] font-mono text-slate-700">
                NIP. {waliKelasGuru.nip && waliKelasGuru.nip !== '-' ? waliKelasGuru.nip : '_'}
              </p>
            </div>
          </div>

          {/* Kepala Sekolah (Tengah Bawah) */}
          <div className="text-center mt-6 pt-2">
            <p className="font-medium text-slate-800">Mengetahui,</p>
            <p className="font-bold text-slate-900 mb-14">Kepala Sekolah</p>
            <p className="font-black underline uppercase text-slate-950 tracking-wide">
              {db.sekolah.namaKepalaSekolah || 'Charles Dedenip uropmabin'}
            </p>
            <p className="text-[11px] font-mono text-slate-700 mt-0.5">
              NIP. {db.sekolah.nipKepalaSekolah || '19012311991081001'}
            </p>
          </div>
        </div>

        {/* FOOTER HALAMAN 5 */}
        <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500 font-mono mt-6">
          <span>Rapor Peserta Didik • {currentStudent.namaSiswa} ({currentStudent.nisn || '-'})</span>
          <span>Halaman 5 dari 5</span>
        </div>
      </div>
    </div>
  )}
</div>

      {/* POP-UP MODAL INPUT KEPUTUSAN */}
      {openDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">
                  Input Keputusan Rapor Kenaikan Kelas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenDecisionModal(false)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDecision} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">Siswa Penerima:</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {currentStudent.namaSiswa}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  NISN: {currentStudent.nisn} • Kelas {selectedKelas} • Semester {selectedSemester}
                </div>
              </div>

              {/* Pilihan Cepat Keputusan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Penetapan Keputusan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectStatus('Naik Kelas')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      decisionForm.status === 'Naik Kelas'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Naik Kelas</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Ke Kelas {getNextClass(selectedKelas)}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectStatus('Tinggal di Kelas')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      decisionForm.status === 'Tinggal di Kelas'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Tinggal di Kelas</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Tetap di Kelas {getCurrentClassText(selectedKelas)}
                    </div>
                  </button>

                  {selectedKelas === 'VI' && (
                    <button
                      type="button"
                      onClick={() => handleSelectStatus('Lulus')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all col-span-2 ${
                        decisionForm.status === 'Lulus'
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Lulus dari Satuan Pendidikan</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Tamatan Kelas VI SD Negeri Balil
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectStatus('Belum Ditetapkan')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all col-span-2 ${
                      decisionForm.status === 'Belum Ditetapkan'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Format Titik-Titik (Diisi Manual)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Dikosongkan bergaris titik-titik untuk ditandatangani manual
                    </div>
                  </button>
                </div>
              </div>

              {/* Rincian Kolom Teks */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teks &ldquo;Naik Kelas :&rdquo;
                  </label>
                  <input
                    type="text"
                    value={decisionForm.naikKelas}
                    onChange={(e) =>
                      setDecisionForm((prev) => ({ ...prev, naikKelas: e.target.value }))
                    }
                    placeholder="Contoh: V (Lima) atau -"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Isi dengan nama kelas tujuan atau tanda &apos;-&apos; jika tinggal kelas.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teks &ldquo;Tinggal di Kelas :&rdquo;
                  </label>
                  <input
                    type="text"
                    value={decisionForm.tinggalKelas}
                    onChange={(e) =>
                      setDecisionForm((prev) => ({ ...prev, tinggalKelas: e.target.value }))
                    }
                    placeholder="Contoh: - atau IV (Empat)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Isi dengan &apos;-&apos; jika siswa naik kelas, atau nama kelas saat ini jika tinggal kelas.
                  </span>
                </div>
              </div>

              {/* Opsi Terapkan ke Seluruh Kelas */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={decisionForm.applyToAll}
                    onChange={(e) =>
                      setDecisionForm((prev) => ({ ...prev, applyToAll: e.target.checked }))
                    }
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-indigo-950 block">
                      Terapkan keputusan ini untuk SEMUA ({siswaKelas.length}) siswa di Kelas {selectedKelas}
                    </span>
                    <span className="text-[10px] text-indigo-700 block mt-0.5">
                      Hemat waktu: Semua siswa di kelas ini akan langsung otomatis mendapatkan keputusan kenaikan kelas yang sama.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpenDecisionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Simpan Keputusan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
