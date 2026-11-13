import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  FileText,
  FileCheck2,
  Download,
  Eye,
  Check,
  CheckCircle2,
  Calendar,
  School,
  Search,
  Filter,
  CheckSquare,
  Square,
  Users,
  Compass,
  Layers,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassLevel, SemesterType } from '../../types';
import { LogoKabupaten, LogoTutWuriHandayani } from '../common/OfficialLogos';
import { ReportCoverPage } from '../common/ReportCoverPage';
import { ReportSchoolIdentityPage } from '../common/ReportSchoolIdentityPage';
import { ReportStudentIdentityPage } from '../common/ReportStudentIdentityPage';
import { PrintTypographyControl } from '../common/PrintTypographyControl';
import { generateReportDescriptionFromTP } from '../../utils/tpDescriptionHelper';

function getNextClass(current: ClassLevel): string {
  switch (current) {
    case 'I': return 'II (Dua)';
    case 'II': return 'III (Tiga)';
    case 'III': return 'IV (Empat)';
    case 'IV': return 'V (Lima)';
    case 'V': return 'VI (Enam)';
    case 'VI': return 'Lulus dari Satuan Pendidikan SD';
    case 'VII': return 'VIII (Delapan)';
    case 'VIII': return 'IX (Sembilan)';
    case 'IX': return 'Lulus dari Satuan Pendidikan SMP';
    case 'X': return 'XI (Sebelas)';
    case 'XI': return 'XII (Dua Belas)';
    case 'XII': return 'Lulus dari Satuan Pendidikan SMA/SMK';
    case 'XIII': return 'Lulus dari Satuan Pendidikan SMK Program 4 Tahun';
    default: return 'Tingkat Berikutnya';
  }
}

function getCurrentClassText(current: ClassLevel): string {
  switch (current) {
    case 'I': return 'I (Satu)';
    case 'II': return 'II (Dua)';
    case 'III': return 'III (Tiga)';
    case 'IV': return 'IV (Empat)';
    case 'V': return 'V (Lima)';
    case 'VI': return 'VI (Enam)';
    case 'VII': return 'VII (Tujuh)';
    case 'VIII': return 'VIII (Delapan)';
    case 'IX': return 'IX (Sembilan)';
    case 'X': return 'X (Sepuluh)';
    case 'XI': return 'XI (Sebelas)';
    case 'XII': return 'XII (Dua Belas)';
    case 'XIII': return 'XIII (Tiga Belas)';
    default: return `${current}`;
  }
}

function getPaperCssSize(pSize?: string): string {
  switch (pSize) {
    case 'F4': return '215mm 330mm';
    case 'A4': return '210mm 297mm';
    case 'Legal': return '215.9mm 355.6mm';
    case 'Letter': return '215.9mm 279.4mm';
    default: return '215mm 330mm';
  }
}

interface PrintReportSectionProps {
  forcedSemester?: 'Ganjil' | 'Genap';
}

export const PrintReportSection: React.FC<PrintReportSectionProps> = ({ forcedSemester }) => {
  const {
    db,
    selectedKelas,
    setSelectedKelas,
    selectedSemester,
    setSelectedSemester,
    selectedFase,
    printTargetStudentId,
    setPrintTargetStudentId,
    setActiveMenu,
    printMode,
    setPrintMode,
    syncAllScoresWithTPDescriptions,
    showSaveNotification,
    openReportPreview,
    printFontFamily,
    printFontSize,
    paperSize,
    setPaperSize
  } = useApp();

  // Semester efektif (mendukung menu terpisah Semester 1 / 2)
  const currentSemester: SemesterType = forcedSemester || selectedSemester;

  // Pengaturan Khusus Cetak & Mode Pratinjau
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(true);
  const [printScope, setPrintScope] = useState<'single' | 'batch'>('single');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Mode tampilan panel filter & navigasi scroll cetak (full | compact | hidden)
  const [filterPanelMode, setFilterPanelMode] = useState<'full' | 'compact' | 'hidden'>('compact');
  const [scrollBarMode, setScrollBarMode] = useState<'full' | 'compact' | 'hidden'>('full');
  const [showAllStudentChips, setShowAllStudentChips] = useState(false);

  // Filter Mata Pelajaran (Wajib / Pilihan)
  type MapelCategoryFilter = 'semua' | 'wajib' | 'pilihan';
  const [mapelCategoryFilter, setMapelCategoryFilter] = useState<MapelCategoryFilter>('semua');

  // Daftar mapel pilihan & muatan lokal yang ada di DB
  const mapelPilihanList = useMemo(() => {
    return db.mataPelajaran.filter((m) => m.kelompok === 'Pilihan' || m.kelompok === 'Muatan Lokal');
  }, [db.mataPelajaran]);

  // Set mata pelajaran pilihan yang aktif dicentang untuk dicetak
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

  // Filter Mata Pelajaran berdasarkan kategori dan pilihan aktif untuk dicetak
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

  // Siswa pada kelas yang dipilih
  const siswaKelas = useMemo(() => {
    return db.siswa.filter((s) => s.kelas === selectedKelas);
  }, [db.siswa, selectedKelas]);

  // Siswa terfilter dengan pencarian
  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return siswaKelas;
    const q = searchStudent.toLowerCase();
    return siswaKelas.filter(
      (s) => s.namaSiswa.toLowerCase().includes(q) || s.nisn.includes(q) || s.nis.includes(q)
    );
  }, [siswaKelas, searchStudent]);

  // State untuk Batch Printing (Checkbox pilihan multi siswa)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Update selected IDs saat kelas berganti
  useEffect(() => {
    const allIds = siswaKelas.map((s) => s.idSiswa);
    setSelectedStudentIds(allIds);
  }, [selectedKelas, siswaKelas.length]);

  // Siswa saat ini untuk mode Single
  const currentStudent =
    siswaKelas.find((s) => s.idSiswa === printTargetStudentId) || siswaKelas[0];

  // Daftar siswa yang akan di-render untuk dicetak
  const studentsToPrint = useMemo(() => {
    if (printScope === 'single') {
      return currentStudent ? [currentStudent] : [];
    }
    // Batch mode: ambil siswa yang dicentang
    return siswaKelas.filter((s) => selectedStudentIds.includes(s.idSiswa));
  }, [printScope, currentStudent, siswaKelas, selectedStudentIds]);

  // Handler Cetak Otomatis Semua Halaman (Buku Rapor Lengkap 1 s.d. 4)
  const handlePrintAllPages = () => {
    setPrintMode('keduanya');
    showSaveNotification('Mempersiapkan pencetakan otomatis semua halaman rapor (Kaver, Satuan Pendidikan, Siswa, Lembar Nilai & Keputusan)...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handler Print Standar (Otomatis semua halaman secara default)
  const handlePrint = () => {
    handlePrintAllPages();
  };

  const handlePrintCurrentMode = () => {
    window.print();
  };

  const printSectionIds = [
    'print-hal-1-kaver',
    'print-hal-2-sekolah',
    'print-hal-3-siswa',
    'print-hal-4-rapor',
    'print-hal-5-ttd',
    'print-hal-6-p5'
  ];

  const scrollToPrintSection = (elementId: string) => {
    if (printMode !== 'keduanya') {
      setPrintMode('keduanya');
      setTimeout(() => {
        const el = document.getElementById(elementId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const el = document.getElementById(elementId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToNextSection = () => {
    if (printMode !== 'keduanya') setPrintMode('keduanya');
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;
    const currentScroll = scrollContainer.scrollTop;
    for (const id of printSectionIds) {
      const el = document.getElementById(id);
      if (el && el.offsetTop > currentScroll + 80) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    // If at the end, scroll to bottom
    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
  };

  const scrollToPrevSection = () => {
    if (printMode !== 'keduanya') setPrintMode('keduanya');
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;
    const currentScroll = scrollContainer.scrollTop;
    for (let i = printSectionIds.length - 1; i >= 0; i--) {
      const id = printSectionIds[i];
      const el = document.getElementById(id);
      if (el && el.offsetTop < currentScroll - 80) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler Download PDF / HTML Dokumen Resmi
  const handleExportPdfHtml = () => {
    const printArea = document.querySelector('.printable-print-zone');
    if (!printArea) return;

    const studentTitle =
      printScope === 'single'
        ? currentStudent?.namaSiswa || 'Siswa'
        : `Batch-${selectedKelas}-${studentsToPrint.length}-Siswa`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapor ${studentTitle} - ${db.sekolah.namaSekolah}</title>
        <style>
          @page {
            size: ${getPaperCssSize(paperSize)};
            margin: 10mm 15mm 15mm 15mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 10px;
            color: #111;
            background: #fff;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #000; padding: 5px 7px; font-size: 11px; }
          th { background: #f2f2f2; }
          .center { text-align: center; }
          .print-page-break {
            page-break-after: always;
            break-after: page;
            margin-bottom: 24px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printArea.innerHTML}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapor-${selectedKelas.toLowerCase()}-${studentTitle.toLowerCase().replace(/\s+/g, '-')}-${paperSize.toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSaveNotification(`Berkas cetak PDF/HTML (${studentsToPrint.length} Siswa) berhasil diunduh!`);
  };

  // Batch Selection Helpers
  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map((s) => s.idSiswa);
    setSelectedStudentIds((prev) => {
      const merged = new Set([...prev, ...allFilteredIds]);
      return Array.from(merged);
    });
  };

  const handleDeselectAll = () => {
    const filteredSet = new Set(filteredStudents.map((s) => s.idSiswa));
    setSelectedStudentIds((prev) => prev.filter((id) => !filteredSet.has(id)));
  };

  const handleSelectGender = (gender: 'L' | 'P') => {
    const genderIds = filteredStudents.filter((s) => s.jenisKelamin === gender).map((s) => s.idSiswa);
    setSelectedStudentIds((prev) => {
      const merged = new Set([...prev, ...genderIds]);
      return Array.from(merged);
    });
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Navigasi Siswa Sebelumnya / Berikutnya
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

  // Wali Kelas data
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

  return (
    <div className="space-y-6">
      {/* Dynamic Print CSS for Accurate Paper Size & Full Multi-Page Scrolling */}
      <style>{`
        @media print {
          @page {
            size: ${getPaperCssSize(paperSize)};
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
          .print-avoid-break, .report-cover-page, table, tr, td, th, .signature-box, .catatan-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print, header, nav, aside, button:not(.allow-print) {
            display: none !important;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* 1. HEADER PUSAT CETAK: HANYA TOMBOL PRINT, PREVIEW, UKURAN KERTAS, DAN PDF */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
            <Printer size={26} />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-wider uppercase text-blue-600">
              PUSAT PENCETAKAN RAPOR RESMI
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Cetak Rapor Kurikulum Merdeka
            </h2>
            <p className="text-xs text-slate-500">
              {db.sekolah.namaSekolah} • TP {db.sekolah.tahunPelajaran} • Kertas:{' '}
              <strong className="text-slate-700">{paperSize}</strong>
            </p>
          </div>
        </div>

        {/* 4 TOMBOL UTAMA: PRINT, PREVIEW, UKURAN KERTAS, DAN PDF */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. TOMBOL UKURAN KERTAS (F4 / A4 / Legal / Letter) */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
              <FileText size={13} /> Kertas:
            </span>
            <button
              type="button"
              onClick={() => setPaperSize('F4')}
              title="Kertas F4 / Folio (21.5 x 33 cm) - Standar Resmi Rapor Indonesia"
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                paperSize === 'F4'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              F4 (FOLIO)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('A4')}
              title="Kertas A4 (21.0 x 29.7 cm) - Ukuran Kertas Internasional"
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                paperSize === 'A4'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('Legal')}
              title="Kertas Legal (21.6 x 35.6 cm)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                paperSize === 'Legal'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              LEGAL
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('Letter')}
              title="Kertas Letter / Kuarto (21.6 x 27.9 cm)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                paperSize === 'Letter'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              LETTER
            </button>
          </div>

          {/* TOMBOL HUBUNGKAN TP KE RAPOR */}
          <button
            type="button"
            onClick={() => {
              const count = syncAllScoresWithTPDescriptions(currentSemester);
              showSaveNotification(`Berhasil memperbarui ${count} data deskripsi dari TP ke rapor cetak!`);
            }}
            title="Hubungkan & perbarui rumusan deskripsi seluruh rapor dari database TP mata pelajaran"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>⚡ HUBUNGKAN TP KE RAPOR</span>
          </button>

          {/* 2. TOMBOL PREVIEW (PRATINJAU RAPOR POPUP & LEMBAR) */}
          <button
            type="button"
            onClick={() => {
              setIsPreviewMode(true);
              openReportPreview(currentStudent?.idSiswa);
            }}
            title="Buka Pratinjau Rapor Layar Penuh (Pop-up Interaktif)"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer ring-2 ring-purple-300 hover:scale-102"
          >
            <Eye size={15} className="text-amber-300" />
            <span>👁️ PREVIEW RAPOR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewMode((prev) => !prev)}
            title="Alihkan Tampilan Lembar Kertas di Halaman Ini"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isPreviewMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-amber-500 text-slate-950 border-amber-500 font-black animate-pulse'
            }`}
          >
            <span>{isPreviewMode ? '📄 Lembar Aktif' : '⚡ Tampilkan Lembar'}</span>
          </button>

          {/* 3. TOMBOL UNDUH / SIMPAN PDF */}
          <button
            type="button"
            onClick={handleExportPdfHtml}
            title="Unduh / Simpan dokumen rapor ini sebagai file cetak PDF/HTML"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>UNDUH / PDF</span>
          </button>

          {/* 4. TOMBOL PRINT (CETAK OTOMATIS SEMUA HALAMAN) */}
          <button
            type="button"
            onClick={handlePrintAllPages}
            title="Cetak otomatis semua halaman buku rapor: Kaver, Satuan Pendidikan, Identitas Siswa, Lembar Nilai & Keputusan"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md transition-all cursor-pointer hover:scale-102 ring-2 ring-emerald-300"
          >
            <Printer size={16} className="text-amber-300" />
            <span>🖨️ CETAK OTOMATIS SEMUA HALAMAN</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCurrentMode}
            title="Cetak hanya lembar yang dipilih pada filter"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all cursor-pointer"
          >
            <span>📄 Cetak Mode Ini</span>
          </button>
        </div>
      </div>

      {/* PENGATURAN BENTUK HURUF & UKURAN HURUF CETAK RAPOR */}
      <PrintTypographyControl className="mb-4" />

      {/* 2. PANEL FILTER LENGKAP CETAK RAPOR & PEMISAHAN RAPOR */}
      {filterPanelMode === 'hidden' ? (
        <div className="bg-white rounded-2xl p-3 border border-dashed border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-bold text-slate-800">Filter Cetak:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
              Kelas {selectedKelas}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
              Semester {currentSemester}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
              {printMode === 'keduanya' ? 'Lengkap' : printMode}
            </span>
            <span className="text-slate-600 font-semibold truncate max-w-[220px]">
              • {currentStudent?.namaSiswa || 'Semua Siswa'}
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              (Panel filter disembunyikan)
            </span>
          </div>

          <div className="ml-auto flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setFilterPanelMode('compact')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer hover:scale-102"
              title="Tampilkan filter cetak dalam mode ramping"
            >
              <Eye size={13} />
              <span>Tampilkan Filter & Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterPanelMode('full')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
              title="Buka penuh"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 no-print">
          {/* Header Panel Filter: Judul di Kiri, Kontrol Ramping/Hilang di Kanan */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Filter & Pilihan Siswa Cetak Rapor
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {filteredStudents.length} Siswa Terdaftar
              </span>
              {filterPanelMode === 'compact' && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Mode Ramping
                </span>
              )}
            </div>

            {/* Kontrol Tersusun Rapi di Samping Kanan */}
            <div className="ml-auto flex items-center justify-end gap-1.5">
              <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-300 shadow-2xs">
                {filterPanelMode === 'compact' ? (
                  <button
                    type="button"
                    onClick={() => setFilterPanelMode('full')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Perluas panel filter (tampilkan semua daftar nama siswa)"
                  >
                    <Maximize2 size={12} />
                    <span className="hidden sm:inline">Perluas</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFilterPanelMode('compact')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Rampingkan panel filter untuk menghemat ruang"
                  >
                    <Minimize2 size={12} />
                    <span className="hidden sm:inline">Rampingkan</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterPanelMode('hidden')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sembunyikan panel filter"
                >
                  <EyeOff size={12} />
                  <span className="hidden sm:inline">Hilangkan</span>
                </button>
              </div>
            </div>
          </div>

          {/* ROW 1: FILTER KELAS, SEMESTER, DAN JENIS RAPOR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
          {/* Filter Kelas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <School size={14} className="text-blue-600" />
              1. Filter Kelas Satuan Pendidikan:
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value as ClassLevel)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <optgroup label="── SD / MI (Kelas 1 - 6) ──">
                <option value="I">Kelas I (Fase A - SD)</option>
                <option value="II">Kelas II (Fase A - SD)</option>
                <option value="III">Kelas III (Fase B - SD)</option>
                <option value="IV">Kelas IV (Fase B - SD)</option>
                <option value="V">Kelas V (Fase C - SD)</option>
                <option value="VI">Kelas VI (Fase C - SD)</option>
              </optgroup>
              <optgroup label="── SMP / MTs (Kelas 7 - 9) ──">
                <option value="VII">Kelas VII (Fase D - SMP)</option>
                <option value="VIII">Kelas VIII (Fase D - SMP)</option>
                <option value="IX">Kelas IX (Fase D - SMP)</option>
              </optgroup>
              <optgroup label="── SMA / MA & SMK (Kelas 10 - 12/13) ──">
                <option value="X">Kelas X (Fase E - SMA/SMK)</option>
                <option value="XI">Kelas XI (Fase F - SMA/SMK)</option>
                <option value="XII">Kelas XII (Fase F - SMA/SMK)</option>
                <option value="XIII">Kelas XIII (Fase F - SMK 4 Tahun)</option>
              </optgroup>
            </select>
          </div>

          {/* Filter Semester (Dipisah Sendiri-Sendiri) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-600" />
              2. Filter Semester Rapor (Sendiri):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSemester('Ganjil')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  currentSemester === 'Ganjil' || currentSemester === '1'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>SEMESTER 1</span>
                <span className="text-[10px] font-medium opacity-90">(Ganjil - Sendiri)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester('Genap')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  currentSemester === 'Genap' || currentSemester === '2'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>SEMESTER 2</span>
                <span className="text-[10px] font-medium opacity-90">(+ Kenaikan Kelas)</span>
              </button>
            </div>
          </div>

          {/* Filter Jenis Cetakan Rapor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers size={14} className="text-purple-600" />
              3. Filter Jenis Cetakan Buku Rapor:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
              <button
                type="button"
                onClick={() => setPrintMode('kaver')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                  printMode === 'kaver'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📘 Kaver
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('identitas')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                  printMode === 'identitas'
                    ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                👤 Identitas
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('akademik')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                  printMode === 'akademik'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📄 Rapor
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('pts')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                  printMode === 'pts'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs ring-2 ring-amber-400'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🎯 Rapor PTS
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('p5')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                  printMode === 'p5'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🌟 Rapor P5
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('keduanya')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                  printMode === 'keduanya'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📑 Lengkap
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: PEMISAHAN CETAK MASING-MASING (INDIVIDU) vs BATCH PRINTING (KOLEKTIF) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tab Mode Pemisahan Cetak */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-1">Metode Cetak:</span>
              <button
                type="button"
                onClick={() => setPrintScope('single')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  printScope === 'single'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users size={14} />
                <span>CETAK 1 SISWA (MASING-MASING)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintScope('batch')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  printScope === 'batch'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs ring-2 ring-purple-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckSquare size={14} />
                <span>CETAK BANYAK SISWA (BATCH / KOLEKTIF)</span>
              </button>
            </div>

            {/* Pencarian Nama Siswa */}
            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Cari nama atau NISN siswa..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* SUB-PANEL: JIKA MODE SINGLE (MASING-MASING) */}
          {printScope === 'single' && (
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevStudent}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    title="Siswa Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-950">Pilih Siswa:</span>
                    <select
                      value={currentStudent?.idSiswa}
                      onChange={(e) => setPrintTargetStudentId(e.target.value)}
                      className="px-3 py-1.5 border border-blue-300 bg-white rounded-xl font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                    >
                      {filteredStudents.map((s) => (
                        <option key={s.idSiswa} value={s.idSiswa}>
                          {s.namaSiswa} ({s.nisn || '-'}) • {s.jenisKelamin === 'L' ? 'L' : 'P'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStudent}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    title="Siswa Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="text-slate-600 font-medium">
                  Mencetak rapor individu untuk:{' '}
                  <strong className="text-blue-900">{currentStudent?.namaSiswa || '-'}</strong>
                </div>
              </div>

              {/* QUICK CLICK SELECTOR: PILIH SISWA MASING-MASING DENGAN 1 KLIK */}
              <div className="pt-2 border-t border-blue-200/80">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-blue-900 block">
                    Daftar Siswa (Klik nama siswa untuk langsung memuat rapor masing-masing):
                  </span>
                  {filterPanelMode === 'compact' && (
                    <button
                      type="button"
                      onClick={() => setShowAllStudentChips(!showAllStudentChips)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300 cursor-pointer shadow-2xs"
                    >
                      {showAllStudentChips ? (
                        <>
                          <ChevronUp size={12} /> Sembunyikan Chip
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} /> Buka {filteredStudents.length} Chip
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(filterPanelMode === 'full' || showAllStudentChips) && (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white/80 rounded-lg border border-blue-200">
                    {filteredStudents.map((s) => {
                      const isSelected = currentStudent?.idSiswa === s.idSiswa;
                      return (
                        <button
                          key={s.idSiswa}
                          type="button"
                          onClick={() => setPrintTargetStudentId(s.idSiswa)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-300'
                              : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{s.namaSiswa}</span>
                          <span
                            className={`ml-1 text-[9px] px-1 rounded ${
                              s.jenisKelamin === 'L'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {s.jenisKelamin}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-PANEL: JIKA MODE BATCH (BANYAK SISWA SEKELAS) */}
          {printScope === 'batch' && (
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-purple-950">Pilih Siswa yang Dicetak:</span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 rounded-lg border border-purple-300 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Pilih Semua ({filteredStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Batal Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectGender('L')}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-300 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Hanya Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectGender('P')}
                    className="px-2.5 py-1 bg-white hover:bg-pink-100 text-pink-800 rounded-lg border border-pink-300 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Hanya Perempuan
                  </button>
                </div>

                <div className="px-3 py-1 rounded-full bg-purple-700 text-white font-extrabold text-[11px]">
                  ✓ {studentsToPrint.length} Siswa Terpilih untuk Dicetak Serentak
                </div>
              </div>

              {/* Checklist Siswa Batch Grid */}
              <div className="max-h-48 overflow-y-auto bg-white p-2.5 rounded-xl border border-purple-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filteredStudents.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.idSiswa);
                  return (
                    <label
                      key={s.idSiswa}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer select-none text-[11px] ${
                        isChecked
                          ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-bold'
                          : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStudentSelection(s.idSiswa)}
                        className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="truncate flex-1">
                        {s.namaSiswa}{' '}
                        <span className="text-[10px] font-normal text-slate-400 font-mono">
                          ({s.nisn || '-'})
                        </span>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          s.jenisKelamin === 'L'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {s.jenisKelamin}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="text-[11px] text-purple-900 bg-purple-100/70 p-2.5 rounded-lg border border-purple-200 font-medium">
                💡 <strong>Fitur Batch Printing:</strong> Semua siswa yang dicentang di atas akan
                digabungkan ke dalam satu dokumen pencetakan dengan pemisah halaman otomatis (
                <em>page-break</em>). Tekan tombol <strong>PRINT / CETAK SEKARANG</strong> untuk
                mencetak seluruh rapor siswa terpilih sekaligus!
              </div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* 3. PRINTABLE PAPER AREA (LIVE PREVIEW & TARGET CETAK RESMI) */}
      {!isPreviewMode ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-600 border border-slate-200 shadow-xs no-print">
          <div className="inline-flex p-3 rounded-full bg-indigo-50 text-indigo-600 mb-2">
            <Eye size={24} />
          </div>
          <h3 className="font-bold text-slate-900">Mode Pratinjau Kertas Dinonaktifkan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
            Klik tombol di bawah untuk mengaktifkan kembali tampilan lembar kertas atau membuka pop-up pratinjau interaktif.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Eye size={15} />
              <span>Aktifkan Preview Lembar Kertas</span>
            </button>
            <button
              type="button"
              onClick={() => openReportPreview(currentStudent?.idSiswa)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <span>👁️ Buka Preview Pop-up</span>
            </button>
          </div>
        </div>
      ) : studentsToPrint.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200 shadow-xs">
          <p className="font-semibold text-slate-700">
            Tidak ada siswa yang dipilih untuk dicetak.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Silakan pilih siswa pada panel filter di atas untuk memulai pencetakan.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* FLOATING STICKY QUICK SCROLL BAR CETAK RAPOR */}
          {scrollBarMode === 'hidden' ? (
            <div className="no-print flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setScrollBarMode('full')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md border border-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 hover:scale-102 transition-all ring-2 ring-blue-400"
                title="Tampilkan kembali bilah scroll navigasi halaman dan cetak"
              >
                <Eye size={13} className="text-amber-400" />
                <span>📜 Tampilkan Navigasi Halaman & Cetak</span>
              </button>
            </div>
          ) : (
            <div className="no-print sticky top-2 z-20 bg-white/95 backdrop-blur-md py-2 px-3 sm:px-4 border border-slate-300 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-2.5">
              {/* SISI KIRI: Indikator Scroll Bar */}
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
                {/* Daftar Tombol Halaman (Hanya Tampil di Mode Penuh) */}
                {scrollBarMode === 'full' && (
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollToPrintSection('print-hal-1-kaver')}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Lompat ke Hal 1: Kaver"
                    >
                      📘 Hal 1
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToPrintSection('print-hal-2-sekolah')}
                      className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Lompat ke Hal 2: Identitas Sekolah"
                    >
                      🏫 Hal 2
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToPrintSection('print-hal-3-siswa')}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Lompat ke Hal 3: Biodata Siswa"
                    >
                      👤 Hal 3
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToPrintSection('print-hal-4-rapor')}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Lompat ke Hal 4: Lembar Nilai & Capaian Belajar"
                    >
                      📄 Hal 4 (Nilai)
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToPrintSection('print-hal-5-ttd')}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Lompat ke Hal 5: Catatan, Ketidakhadiran, Keputusan & Tanda Tangan"
                    >
                      📝 Hal 5 (Catatan & TTD)
                    </button>
                    {(printMode === 'p5' || printMode === 'keduanya') && (
                      <button
                        type="button"
                        onClick={() => scrollToPrintSection('print-hal-6-p5')}
                        className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-950 border border-violet-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                        title="Lompat ke Hal 6: Rapor P5 Projek Profil Pelajar Pancasila"
                      >
                        🌟 Hal 6 (P5)
                      </button>
                    )}
                  </div>
                )}

                {/* Tombol Scroll Cepat Sebelumnya & Berikutnya */}
                <div className="inline-flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={scrollToPrevSection}
                    className="px-2 py-1 hover:bg-white text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Scroll ke Halaman Sebelumnya"
                  >
                    <span>⬆️</span>
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>
                  <button
                    type="button"
                    onClick={scrollToNextSection}
                    className="px-2 py-1 hover:bg-white text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Scroll ke Halaman Berikutnya"
                  >
                    <span>⬇️</span>
                    <span className="hidden sm:inline">Berikutnya</span>
                  </button>
                </div>

                {/* Indikator Ukuran Kertas */}
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-bold text-[11px] hidden md:inline">
                  ↕ Otomatis Standar ({paperSize})
                </span>

                {/* Tombol Cetak Utama */}
                <button
                  type="button"
                  onClick={handlePrintAllPages}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
                  title="Cetak otomatis seluruh halaman rapor sekarang"
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
                      title="Perluas tombol scroll halaman (tampilkan Hal 1 s/d Hal 6)"
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

          <div className="printable-print-zone space-y-12 scroll-smooth">
          {studentsToPrint.map((student, sIndex) => {
            // Nilai akademik siswa yang terhubung dinamis dengan deskripsi TP Kurikulum Merdeka
            const studentScores = filteredMataPelajaran.map((m) => {
              const sc = db.nilaiAkademik.find(
                (n) =>
                  n.nisn === student.nisn &&
                  n.mataPelajaran === m.mataPelajaran &&
                  n.kelas === selectedKelas &&
                  n.semester === currentSemester
              );

              const nilaiAkhir = sc ? sc.nilaiAkhir : 80;
              const tpResult = generateReportDescriptionFromTP(
                m.mataPelajaran,
                selectedKelas,
                nilaiAkhir,
                db.tujuanPembelajaran,
                student.namaSiswa,
                student.agama
              );

              const deskripsiRapor =
                sc?.deskripsiRapor && sc.deskripsiRapor.trim() !== ''
                  ? sc.deskripsiRapor
                  : tpResult.deskripsiRapor;

              const predikat =
                sc?.predikat ||
                (nilaiAkhir >= 88
                  ? 'Sangat Baik'
                  : nilaiAkhir >= 78
                  ? 'Baik'
                  : nilaiAkhir >= 68
                  ? 'Cukup'
                  : 'Perlu Bimbingan');

              const capaianKompetensi =
                sc?.capaianKompetensi ||
                (nilaiAkhir >= 88
                  ? 'Sangat Baik'
                  : nilaiAkhir >= 78
                  ? 'Baik'
                  : nilaiAkhir >= 68
                  ? 'Cukup'
                  : 'Perlu Pendampingan');

              const kkm = sc?.kkm || m.kkm || 75;

              return {
                mapel: m,
                score: {
                  kkm,
                  nilaiAkhir,
                  predikat,
                  capaianKompetensi,
                  deskripsiRapor,
                  deskripsiTercapai: sc?.deskripsiTercapai || tpResult.deskripsiTercapai,
                  deskripsiPerluPeningkatan: sc?.deskripsiPerluPeningkatan || tpResult.deskripsiPerluPeningkatan
                },
                linkedTpKodes: tpResult.linkedTpKodes
              };
            });

            const totalNilai = studentScores.reduce((acc, curr) => acc + curr.score.nilaiAkhir, 0);
            const rataRataNilai = studentScores.length > 0 ? (totalNilai / studentScores.length).toFixed(2) : '0';

            const studentEkskul = db.ekstrakurikuler.filter(
              (e) =>
                e.nisn === student.nisn &&
                e.kelas === selectedKelas &&
                e.semester === currentSemester
            );

            const studentAtt = db.kehadiran.find(
              (h) =>
                h.nisn === student.nisn &&
                h.kelas === selectedKelas &&
                h.semester === currentSemester
            ) || { sakit: 0, izin: 0, alpa: 0 };

            const studentNote =
              db.catatanWali.find(
                (c) =>
                  c.nisn === student.nisn &&
                  c.kelas === selectedKelas &&
                  c.semester === currentSemester
              )?.catatanWaliKelas ||
              'Menunjukkan perkembangan belajar yang baik, terus pertahankan motivasi dan ketekunan.';

            const studentDecision = db.keputusanSiswa?.find(
              (k) =>
                k.nisn === student.nisn &&
                k.kelas === selectedKelas &&
                k.semester === currentSemester
            );

            const displayNaikKelas =
              studentDecision?.statusKeputusan === 'Naik Kelas'
                ? studentDecision.naikKelas || getNextClass(selectedKelas)
                : studentDecision?.statusKeputusan === 'Tinggal di Kelas'
                ? '-'
                : studentDecision?.naikKelas ||
                  '........................................................';

            const displayTinggalKelas =
              studentDecision?.statusKeputusan === 'Tinggal di Kelas'
                ? studentDecision.tinggalKelas || getCurrentClassText(selectedKelas)
                : studentDecision?.statusKeputusan === 'Naik Kelas'
                ? '-'
                : studentDecision?.tinggalKelas ||
                  '........................................................';

            const studentP5Projek = db.p5Projek.filter((p) => p.kelas === selectedKelas);

            return (
              <div key={student.idSiswa} className="print-student-container">
                {/* Indikator halaman untuk mode batch preview di layar */}
                {printScope === 'batch' && (
                  <div className="no-print max-w-4xl mx-auto mb-2 flex items-center justify-between text-xs text-slate-500 px-2 font-mono">
                    <span>
                      Siswa ke-{sIndex + 1} dari {studentsToPrint.length}
                    </span>
                    <span className="font-bold text-slate-700">{student.namaSiswa}</span>
                  </div>
                )}

                {/* HALAMAN KAVER RAPOR */}
                {(printMode === 'kaver' || printMode === 'keduanya') && (
                  <div
                    id="print-hal-1-kaver"
                    className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-8 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full mb-8 text-slate-900 print-page-break scroll-mt-20"
                    style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
                  >
                    <ReportCoverPage sekolah={db.sekolah} student={student} paperSize={paperSize} fontFamily={printFontFamily} fontSize={printFontSize} />
                  </div>
                )}

                {/* HALAMAN RAPOR PESERTA DIDIK (IDENTITAS SEKOLAH) */}
                {(printMode === 'identitas' || printMode === 'keduanya') && (
                  <div
                    id="print-hal-2-sekolah"
                    className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-8 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full mb-8 text-slate-900 print-page-break scroll-mt-20"
                    style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
                  >
                    <ReportSchoolIdentityPage sekolah={db.sekolah} paperSize={paperSize} fontFamily={printFontFamily} fontSize={printFontSize} />
                  </div>
                )}

                {/* HALAMAN IDENTITAS PESERTA DIDIK (BIODATA LENGKAP SISWA) */}
                {(printMode === 'identitas' || printMode === 'keduanya') && (
                  <div
                    id="print-hal-3-siswa"
                    className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-8 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full mb-8 text-slate-900 print-page-break scroll-mt-20"
                    style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
                  >
                    <ReportStudentIdentityPage sekolah={db.sekolah} student={student} paperSize={paperSize} fontFamily={printFontFamily} fontSize={printFontSize} />
                  </div>
                )}

                {/* HALAMAN RAPOR (LEMBAR NILAI & CAPAIAN BELAJAR) */}
                {(printMode === 'akademik' || printMode === 'keduanya') && (
                  <div
                    id="print-hal-4-rapor"
                    className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full mb-8 text-slate-900 print-page-break scroll-mt-20"
                    style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
                  >
                    {/* KOP RAPOR RESMI */}
                    <div className="pb-4 border-b-2 border-slate-900 mb-6 flex items-center justify-between gap-4">
                      {/* Logo Kiri (Logo Kabupaten) */}
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                        <LogoKabupaten
                          url={db.sekolah.logoKiriUrl}
                          size={76}
                          className="w-16 h-16 sm:w-20 sm:h-20"
                          label="Logo Pemda Kab"
                        />
                      </div>

                      <div className="flex-1 text-center">
                        <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
                          {db.sekolah.namaPemerintah ||
                            'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
                        </div>
                        <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
                          {db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase my-0.5">
                          {db.sekolah.namaSekolah}
                        </h1>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Alamat: {db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan},
                          Kab. {db.sekolah.kabupaten}, Prov. {db.sekolah.provinsi}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          NPSN: {db.sekolah.npsn} | NSS: {db.sekolah.nss}
                        </p>
                      </div>

                      {/* Logo Kanan (Logo Tut Wuri Handayani) */}
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                        <LogoTutWuriHandayani
                          url={db.sekolah.logoKananUrl}
                          size={76}
                          className="w-16 h-16 sm:w-20 sm:h-20"
                          label="Logo Tut Wuri Handayani"
                        />
                      </div>
                    </div>

                    {/* JUDUL RAPOR (CUKUP TULIS RAPOR) */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase underline underline-offset-4 text-slate-950 font-serif">
                        RAPOR
                      </h2>
                      <span className="text-xs font-bold text-slate-600 block mt-1 tracking-wider uppercase">
                        LAPORAN HASIL BELAJAR PESERTA DIDIK • SEMESTER{' '}
                        {currentSemester === 'Ganjil' || currentSemester === '1'
                          ? '1 (GANJIL)'
                          : '2 (GENAP)'}{' '}
                        • TAHUN PELAJARAN {db.sekolah.tahunPelajaran}
                      </span>
                    </div>

                    {/* IDENTITAS RAPOR */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs pb-4 border-b border-slate-300 mb-5">
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-32 text-slate-600">Nama Siswa</span>
                          <span className="w-3">:</span>
                          <span className="font-bold text-slate-900">{student.namaSiswa}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">NISN / NIS</span>
                          <span className="w-3">:</span>
                          <span className="font-mono text-slate-800">
                            {student.nisn &&
                            !student.nisn.startsWith('BLM_') &&
                            student.nisn !== '-'
                              ? student.nisn
                              : '-'}{' '}
                            /{' '}
                            {student.nis && student.nis !== '-' ? student.nis : '-'}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">Nama Sekolah</span>
                          <span className="w-3">:</span>
                          <span className="font-semibold text-slate-800">
                            {db.sekolah.namaSekolah}
                          </span>
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
                            {currentSemester === 'Ganjil' || currentSemester === '1'
                              ? '1 (Satu / Ganjil)'
                              : '2 (Dua / Genap)'}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">Tahun Pelajaran</span>
                          <span className="w-3">:</span>
                          <span className="font-semibold text-slate-800">
                            {db.sekolah.tahunPelajaran}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* A. NILAI CAPAIAN PEMBELAJARAN */}
                    <div className="mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-2 text-slate-800">
                        A. NILAI AKADEMIK &amp; CAPAIAN KOMPETENSI
                      </h3>
                      <table className="w-full text-[11px] border-collapse border border-slate-900">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900">
                            <th className="border border-slate-900 py-2 px-2 text-center w-8">
                              No
                            </th>
                            <th className="border border-slate-900 py-2 px-3 text-left w-52">
                              Mata Pelajaran
                            </th>
                            <th className="border border-slate-900 py-2 px-2 text-center w-14">
                              KKM
                            </th>
                            <th className="border border-slate-900 py-2 px-2 text-center w-16">
                              Nilai Akhir
                            </th>
                            <th className="border border-slate-900 py-2 px-2 text-center w-28">
                              Capaian Kompetensi
                            </th>
                            <th className="border border-slate-900 py-2 px-3 text-left">
                              Deskripsi Capaian Pembelajaran
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentScores.map((item, idx) => (
                            <tr key={item.mapel.mataPelajaran}>
                              <td className="border border-slate-900 py-2 px-2 text-center font-mono">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-900 py-2 px-3 font-semibold">
                                {item.mapel.mataPelajaran}
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-center font-mono font-bold">
                                {item.score.kkm}
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-center font-bold font-mono">
                                {item.score.nilaiAkhir}
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-center font-medium">
                                {item.score.capaianKompetensi}
                              </td>
                              <td className="border border-slate-900 py-2 px-3 text-slate-700 leading-relaxed text-[10px]">
                                {item.score.deskripsiRapor}
                              </td>
                            </tr>
                          ))}
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
                      <span>Rapor Peserta Didik • {student.namaSiswa} ({student.nisn || '-'})</span>
                      <span>Halaman 4 dari 5</span>
                    </div>
                  </div>
                )}

                {/* HALAMAN 5: CATATAN GURU, KETIDAKHADIRAN, KEPUTUSAN & PENGESAHAN TANDA TANGAN */}
                {(printMode === 'akademik' || printMode === 'keduanya') && (
                  <div
                    id="print-hal-5-ttd"
                    className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full mb-8 text-slate-900 print-page-break scroll-mt-20 flex flex-col justify-between"
                    style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
                  >
                    <div>
                      {/* HEADER IDENTITAS SINGKAT HALAMAN 5 */}
                      <div className="pb-3 border-b-2 border-slate-900 mb-6 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold uppercase tracking-wider text-slate-900 block font-serif">
                            {db.sekolah.namaSekolah}
                          </span>
                          <span className="text-[11px] text-slate-600">
                            Nama Siswa: <strong className="text-slate-900">{student.namaSiswa}</strong> • NISN: <span className="font-mono">{student.nisn || '-'}</span>
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-slate-700">
                          <div>Kelas: <strong className="text-slate-900">{selectedKelas}</strong> • Semester: <strong className="text-slate-900">{currentSemester}</strong></div>
                          <div>Tahun Pelajaran: <strong>{db.sekolah.tahunPelajaran}</strong></div>
                        </div>
                      </div>

                      {/* B. EKSTRAKURIKULER */}
                      <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wide mb-2 text-slate-800">
                          B. KEGIATAN EKSTRAKURIKULER
                        </h3>
                        <table className="w-full text-[11px] border-collapse border border-slate-900">
                          <thead>
                            <tr className="bg-slate-100 text-slate-900">
                              <th className="border border-slate-900 py-1.5 px-2 text-center w-8">
                                No
                              </th>
                              <th className="border border-slate-900 py-1.5 px-3 text-left">
                                Kegiatan Ekstrakurikuler
                              </th>
                              <th className="border border-slate-900 py-1.5 px-3 text-center w-28">
                                Predikat
                              </th>
                              <th className="border border-slate-900 py-1.5 px-3 text-left">
                                Keterangan
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentEkskul.length > 0 ? (
                              studentEkskul.map((e, idx) => (
                                <tr key={e.id}>
                                  <td className="border border-slate-900 py-1.5 px-2 text-center font-mono">
                                    {idx + 1}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-3 font-medium">
                                    {e.jenisEkstrakurikuler}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-3 text-center font-bold">
                                    {e.predikat}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-3 text-slate-700">
                                    {e.keterangan || '-'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="border border-slate-900 py-1.5 px-2 text-center font-mono">
                                  1
                                </td>
                                <td className="border border-slate-900 py-1.5 px-3 font-medium">
                                  Pramuka Siaga/Penggalang
                                </td>
                                <td className="border border-slate-900 py-1.5 px-3 text-center font-bold">
                                  Baik
                                </td>
                                <td className="border border-slate-900 py-1.5 px-3 text-slate-700">
                                  Aktif mengikuti kegiatan mingguan.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* C. CATATAN GURU / WALI KELAS */}
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

                      {/* D. KETIDAKHADIRAN & KEPUTUSAN BERDAMPINGAN DUA KOLOM */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 items-start">
                        {/* Kolom Kiri: Ketidakhadiran */}
                        <div className="border border-slate-900 bg-white">
                          <div className="bg-slate-100 font-bold text-xs py-1.5 px-3 border-b border-slate-900 text-slate-900 uppercase">
                            Ketidakhadiran
                          </div>
                          <div className="p-3 text-xs space-y-1.5 text-slate-900">
                            <div className="flex justify-between">
                              <span>Sakit</span>
                              <span className="font-mono font-bold">: {studentAtt.sakit > 0 ? `${studentAtt.sakit} hari` : '_ hari'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Izin</span>
                              <span className="font-mono font-bold">: {studentAtt.izin > 0 ? `${studentAtt.izin} hari` : '_ hari'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tanpa Keterangan</span>
                              <span className="font-mono font-bold">: {studentAtt.alpa > 0 ? `${studentAtt.alpa} hari` : '1 hari'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Kolom Kanan: Keputusan Kenaikan Kelas */}
                        <div className="border border-slate-900 bg-white p-3 text-xs">
                          <div className="mb-1 pb-1 border-b border-slate-200">
                            <span className="font-bold text-slate-900">Keputusan :</span>
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

                      {/* E. PENGESAHAN TANDA TANGAN */}
                      <div className="text-xs pt-4 font-serif text-black">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="text-left">
                            <p className="font-medium text-slate-800">Mengetahui :</p>
                            <p className="font-bold text-slate-900 mb-14">Orang Tua/Wali,</p>
                            <p className="font-black underline uppercase text-slate-950 tracking-wide">
                              {student.namaAyah || student.namaWali || 'FRENGKY A KASIPMABIN'}
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
                    </div>

                    {/* FOOTER HALAMAN 5 */}
                    <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500 font-mono mt-6">
                      <span>Rapor Peserta Didik • {student.namaSiswa} ({student.nisn || '-'})</span>
                      <span>Halaman 5 dari 5</span>
                    </div>
                  </div>
                )}

                {/* HALAMAN CETAK RAPOR PTS (PENILAIAN TENGAH SEMESTER) */}
                {printMode === 'pts' && (
                  <div
                    id="print-hal-pts"
                    className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full mb-8 text-slate-900 print-page-break scroll-mt-20"
                    style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
                  >
                    {/* KOP RAPOR PTS RESMI */}
                    <div className="pb-4 border-b-2 border-slate-900 mb-6 flex items-center justify-between gap-4">
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                        <LogoKabupaten
                          url={db.sekolah.logoKiriUrl}
                          size={76}
                          className="w-16 h-16 sm:w-20 sm:h-20"
                          label="Logo Pemda Kab"
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
                      <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase underline underline-offset-4 text-slate-950 font-serif">
                        LAPORAN PENILAIAN TENGAH SEMESTER (PTS)
                      </h2>
                      <span className="text-xs font-bold text-slate-600 block mt-1 tracking-wider uppercase">
                        KURIKULUM MERDEKA • SEMESTER {currentSemester === 'Ganjil' || currentSemester === '1' ? '1 (GANJIL)' : '2 (GENAP)'} • TP {db.sekolah.tahunPelajaran}
                      </span>
                    </div>

                    {/* IDENTITAS SISWA PTS */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs pb-4 border-b border-slate-300 mb-5">
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-32 text-slate-600">Nama Siswa</span>
                          <span className="w-3">:</span>
                          <span className="font-bold text-slate-900">{student.namaSiswa}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">NISN / NIS</span>
                          <span className="w-3">:</span>
                          <span className="font-mono text-slate-800">
                            {student.nisn || '-'} / {student.nis || '-'}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">Agama</span>
                          <span className="w-3">:</span>
                          <span className="font-medium text-slate-800">{student.agama || 'Kristen'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-32 text-slate-600">Kelas / Fase</span>
                          <span className="w-3">:</span>
                          <span className="font-bold text-slate-900">{selectedKelas} / Fase {selectedFase}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">Semester</span>
                          <span className="w-3">:</span>
                          <span className="font-bold text-slate-900">
                            {currentSemester === 'Ganjil' || currentSemester === '1' ? '1 (Ganjil)' : '2 (Genap)'}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">Tahun Pelajaran</span>
                          <span className="w-3">:</span>
                          <span className="font-semibold text-slate-800">{db.sekolah.tahunPelajaran}</span>
                        </div>
                      </div>
                    </div>

                    {/* TABEL NILAI PTS */}
                    <div className="mb-6">
                      {(() => {
                        const ptsRows = filteredMataPelajaran.map((mapel) => {
                          const sc = db.nilaiAkademik.find(
                            (n) =>
                              n.nisn === student.nisn &&
                              n.mataPelajaran === mapel.mataPelajaran &&
                              n.kelas === selectedKelas &&
                              n.semester === currentSemester
                          );
                          const kkm = sc?.kkm || mapel.kkm || 75;
                          const formatif = sc?.formatif ?? 80;
                          const ptsScore = sc?.pts ?? formatif;
                          const nilaiAkhir = Math.round((formatif + ptsScore) / 2);
                          const capaianKompetensi =
                            nilaiAkhir >= 88
                              ? 'Sangat Baik'
                              : nilaiAkhir >= 78
                              ? 'Baik'
                              : nilaiAkhir >= 68
                              ? 'Cukup'
                              : 'Perlu Bimbingan';
                          const tpRes = generateReportDescriptionFromTP(
                            mapel.mataPelajaran,
                            selectedKelas,
                            nilaiAkhir,
                            db.tujuanPembelajaran,
                            student.namaSiswa,
                            student.agama
                          );
                          const deskripsi = sc?.deskripsiTercapai || tpRes.deskripsiTercapai || tpRes.deskripsiRapor;
                          return {
                            mapel,
                            kkm,
                            formatif,
                            ptsScore,
                            nilaiAkhir,
                            capaianKompetensi,
                            deskripsi
                          };
                        });
                        const totalPtsNilai = ptsRows.reduce((sum, r) => sum + r.nilaiAkhir, 0);
                        const avgPtsNilai = ptsRows.length > 0 ? (totalPtsNilai / ptsRows.length).toFixed(2) : '0';

                        return (
                          <table className="w-full text-[11px] border-collapse border border-slate-900">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900">
                                <th className="border border-slate-900 py-2 px-2 text-center w-8">No</th>
                                <th className="border border-slate-900 py-2 px-3 text-left w-44">Mata Pelajaran</th>
                                <th className="border border-slate-900 py-2 px-2 text-center w-12">KKM</th>
                                <th className="border border-slate-900 py-2 px-2 text-center w-14">Formatif</th>
                                <th className="border border-slate-900 py-2 px-2 text-center w-14">PTS</th>
                                <th className="border border-slate-900 py-2 px-2 text-center w-16 bg-slate-200 font-bold">Nilai Akhir</th>
                                <th className="border border-slate-900 py-2 px-2 text-center w-24">Capaian Kompetensi</th>
                                <th className="border border-slate-900 py-2 px-3 text-left">Deskripsi Capaian Pembelajaran</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ptsRows.map((row, mIdx) => (
                                <tr key={row.mapel.kode || row.mapel.mataPelajaran} className="hover:bg-slate-50/50">
                                  <td className="border border-slate-900 py-2 px-2 text-center font-bold text-slate-600">{mIdx + 1}</td>
                                  <td className="border border-slate-900 py-2 px-3 font-semibold text-slate-900">{row.mapel.mataPelajaran}</td>
                                  <td className="border border-slate-900 py-2 px-2 text-center font-mono font-bold">{row.kkm}</td>
                                  <td className="border border-slate-900 py-2 px-2 text-center font-mono">{row.formatif}</td>
                                  <td className="border border-slate-900 py-2 px-2 text-center font-mono">{row.ptsScore}</td>
                                  <td className="border border-slate-900 py-2 px-2 text-center font-bold font-mono bg-slate-100">{row.nilaiAkhir}</td>
                                  <td className="border border-slate-900 py-2 px-2 text-center font-bold text-slate-800">{row.capaianKompetensi}</td>
                                  <td className="border border-slate-900 py-2 px-3 text-slate-800 leading-snug">{row.deskripsi}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 text-slate-950 font-bold border-t-2 border-slate-900">
                                <td colSpan={5} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider font-bold">
                                  JUMLAH NILAI
                                </td>
                                <td className="border border-slate-900 py-2 px-2 text-center font-mono text-sm font-black bg-slate-200">
                                  {totalPtsNilai}
                                </td>
                                <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-600 text-[10px]">
                                  Total akumulasi capaian nilai tengah semester seluruh mata pelajaran
                                </td>
                              </tr>
                              <tr className="bg-slate-100 text-slate-950 font-bold border-t border-slate-900">
                                <td colSpan={5} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider font-bold">
                                  RATA-RATA NILAI
                                </td>
                                <td className="border border-slate-900 py-2 px-2 text-center font-mono text-sm font-black bg-amber-100 text-amber-950">
                                  {avgPtsNilai}
                                </td>
                                <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-600 text-[10px]">
                                  Rata-rata perolehan nilai peserta didik (Skala 0 - 100)
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        );
                      })()}
                    </div>

                    {/* TANDA TANGAN RAPOR PTS */}
                    <div className="signature-box grid grid-cols-2 gap-8 text-xs pt-4 border-t border-slate-300">
                      <div className="text-center">
                        <p className="text-slate-600 mb-1">Mengetahui,</p>
                        <p className="font-bold text-slate-900 mb-14">Orang Tua / Wali Murid</p>
                        <p className="font-bold text-slate-900 underline underline-offset-2">.....................................................</p>
                      </div>

                      <div className="text-center">
                        <p className="text-slate-600 mb-1">
                          {db.sekolah.tempatRapor || db.sekolah.kabupaten || 'Balil'},{' '}
                          {db.sekolah.tanggalRapor || '24 Maret 2027'}
                        </p>
                        <p className="font-bold text-slate-900 mb-14">Guru / Wali Kelas {selectedKelas}</p>
                        <p className="font-bold text-slate-900 underline underline-offset-2">{waliKelasGuru.namaGuru}</p>
                        <p className="text-[11px] text-slate-600 font-mono">NIP. {waliKelasGuru.nip}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* HALAMAN 6: RAPOR P5 (PROJEK PENGUATAN PROFIL PELAJAR PANCASILA) */}
                {(printMode === 'p5' || printMode === 'keduanya') && (
                  <div
                    id="print-hal-6-p5"
                    className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:max-w-none print:w-full mb-8 text-slate-900 print-page-break scroll-mt-20"
                    style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
                  >
                    <div className="pb-4 border-b-2 border-slate-900 mb-6 flex items-center justify-between gap-4">
                      {/* Logo Kiri */}
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                        <LogoKabupaten
                          url={db.sekolah.logoKiriUrl}
                          size={76}
                          className="w-16 h-16 sm:w-20 sm:h-20"
                          label="Logo Pemda"
                        />
                      </div>

                      <div className="flex-1 text-center">
                        <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
                          {db.sekolah.namaPemerintah ||
                            'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
                        </div>
                        <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
                          {db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase my-0.5">
                          {db.sekolah.namaSekolah}
                        </h1>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Alamat: {db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan},
                          Kab. {db.sekolah.kabupaten}, Prov. {db.sekolah.provinsi}
                        </p>
                      </div>

                      {/* Logo Kanan */}
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                        <LogoTutWuriHandayani
                          url={db.sekolah.logoKananUrl}
                          size={76}
                          className="w-16 h-16 sm:w-20 sm:h-20"
                          label="Logo Sekolah"
                        />
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h2 className="text-sm font-extrabold tracking-wider uppercase underline underline-offset-4">
                        RAPOR PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)
                      </h2>
                      <span className="text-[11px] font-semibold text-slate-600 block mt-1">
                        TAHUN PELAJARAN {db.sekolah.tahunPelajaran} • SEMESTER{' '}
                        {currentSemester.toUpperCase()}
                      </span>
                    </div>

                    {/* IDENTITAS */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs pb-4 border-b border-slate-300 mb-6">
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-32 text-slate-600">Nama Siswa</span>
                          <span className="w-3">:</span>
                          <span className="font-bold text-slate-900">{student.namaSiswa}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">NISN / NIS</span>
                          <span className="w-3">:</span>
                          <span className="font-mono text-slate-800">
                            {student.nisn &&
                            !student.nisn.startsWith('BLM_') &&
                            student.nisn !== '-'
                              ? student.nisn
                              : '-'}{' '}
                            /{' '}
                            {student.nis && student.nis !== '-' ? student.nis : '-'}
                          </span>
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
                          <span className="font-bold text-slate-900">Fase {selectedFase}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-slate-600">Tahun Pelajaran</span>
                          <span className="w-3">:</span>
                          <span className="font-semibold text-slate-800">
                            {db.sekolah.tahunPelajaran}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PROJEK ROWS */}
                    {studentP5Projek.map((pr, pIdx) => {
                      const studentP5Scores = db.p5Nilai.filter(
                        (n) => n.idProjek === pr.idProjek && n.nisn === student.nisn
                      );

                      return (
                        <div key={pr.idProjek} className="mb-6">
                          <div className="bg-slate-100 p-2.5 border border-slate-900 border-b-0">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                              Projek {pIdx + 1} • {pr.tema}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900">{pr.namaProjek}</h4>
                          </div>

                          <table className="w-full text-[11px] border-collapse border border-slate-900">
                            <thead>
                              <tr className="bg-slate-50 text-slate-900">
                                <th
                                  rowSpan={2}
                                  className="border border-slate-900 py-1.5 px-2 text-center w-8"
                                >
                                  No
                                </th>
                                <th
                                  rowSpan={2}
                                  className="border border-slate-900 py-1.5 px-3 text-left w-52"
                                >
                                  Dimensi &amp; Elemen
                                </th>
                                <th
                                  colSpan={4}
                                  className="border border-slate-900 py-1 px-1 text-center"
                                >
                                  Capaian
                                </th>
                                <th
                                  rowSpan={2}
                                  className="border border-slate-900 py-1.5 px-3 text-left"
                                >
                                  Catatan Perkembangan
                                </th>
                              </tr>
                              <tr className="bg-slate-50 text-slate-900 text-[10px]">
                                <th className="border border-slate-900 py-1 px-1 text-center w-10">
                                  BB
                                </th>
                                <th className="border border-slate-900 py-1 px-1 text-center w-10">
                                  MB
                                </th>
                                <th className="border border-slate-900 py-1 px-1 text-center w-10">
                                  BSH
                                </th>
                                <th className="border border-slate-900 py-1 px-1 text-center w-10">
                                  SB
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentP5Scores.map((sc, scIdx) => (
                                <tr key={sc.id} className="border-t border-slate-900">
                                  <td className="border border-slate-900 py-1.5 px-2 text-center font-mono">
                                    {scIdx + 1}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-3 font-semibold text-slate-800">
                                    {sc.dimensi} ({sc.elemen})
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-1 text-center font-black">
                                    {sc.capaian === 'BB' && '✓'}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-1 text-center font-black">
                                    {sc.capaian === 'MB' && '✓'}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-1 text-center font-black">
                                    {sc.capaian === 'BSH' && '✓'}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-1 text-center font-black">
                                    {sc.capaian === 'SB' && '✓'}
                                  </td>
                                  <td className="border border-slate-900 py-1.5 px-3 text-slate-700">
                                    {sc.deskripsi}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}

                    {/* TANDA TANGAN */}
                    <div className="text-xs pt-4">
                      <div className="text-right mb-6">
                        <span>
                          {db.sekolah.tempatRapor || 'Balil'},{' '}
                          {db.sekolah.tanggalRapor || '19 Desember 2026'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-8 text-center">
                        <div>
                          <p className="font-semibold text-slate-800 mb-16">Wali Murid</p>
                          <div className="border-b border-slate-900 w-48 mx-auto"></div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            ( ............................................ )
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800 mb-16">
                            Wali Kelas {selectedKelas}
                          </p>
                          <p className="font-bold underline text-slate-900">
                            {waliKelasGuru.namaGuru}
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">
                            NIP. {waliKelasGuru.nip || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="text-center mt-8">
                        <p className="font-semibold text-slate-800 mb-16">
                          Kepala Sekolah {db.sekolah.namaSekolah}
                        </p>
                        <p className="font-bold underline text-slate-900">
                          {db.sekolah.namaKepalaSekolah}
                        </p>
                        <p className="text-[11px] font-mono text-slate-600">
                          NIP. {db.sekolah.nipKepalaSekolah}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
};
