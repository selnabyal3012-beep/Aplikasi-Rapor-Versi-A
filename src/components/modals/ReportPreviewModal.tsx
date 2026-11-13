import React, { useState } from 'react';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  School,
  User,
  Award,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReportCoverPage } from '../common/ReportCoverPage';
import { ReportSchoolIdentityPage } from '../common/ReportSchoolIdentityPage';
import { ReportStudentIdentityPage } from '../common/ReportStudentIdentityPage';
import { LogoKabupaten, LogoTutWuriHandayani } from '../common/OfficialLogos';
import { generateReportDescriptionFromTP } from '../../utils/tpDescriptionHelper';
import { AVAILABLE_FONTS, AVAILABLE_SIZES } from '../common/PrintTypographyControl';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudentId?: string | null;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  targetStudentId
}) => {
  const {
    db,
    selectedKelas,
    selectedSemester,
    printTargetStudentId,
    setPrintTargetStudentId,
    syncAllScoresWithTPDescriptions,
    showSaveNotification,
    printFontFamily,
    setPrintFontFamily,
    printFontSize,
    setPrintFontSize
  } = useApp();

  const [activeTab, setActiveTab] = useState<'semua' | 'kaver' | 'sekolah' | 'siswa' | 'nilai' | 'ttd' | 'p5'>('semua');
  const [paperSize, setPaperSize] = useState<'F4' | 'A4'>('F4');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen) return null;

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);
  const effectiveStudentId = targetStudentId || printTargetStudentId || (siswaKelas[0]?.idSiswa ?? null);
  const currentStudent = siswaKelas.find((s) => s.idSiswa === effectiveStudentId) || siswaKelas[0];

  if (!currentStudent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <p className="font-bold text-slate-800">Belum ada siswa di kelas {selectedKelas}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Navigasi siswa
  const currentIdx = siswaKelas.findIndex((s) => s.idSiswa === currentStudent.idSiswa);
  const handlePrevStudent = () => {
    if (currentIdx > 0) {
      setPrintTargetStudentId(siswaKelas[currentIdx - 1].idSiswa);
    }
  };
  const handleNextStudent = () => {
    if (currentIdx < siswaKelas.length - 1) {
      setPrintTargetStudentId(siswaKelas[currentIdx + 1].idSiswa);
    }
  };

  // Nilai akademik siswa
  const studentScores = db.mataPelajaran.map((m) => {
    const sc = db.nilaiAkademik.find(
      (n) =>
        n.nisn === currentStudent.nisn &&
        n.mataPelajaran === m.mataPelajaran &&
        n.kelas === selectedKelas &&
        n.semester === selectedSemester
    );
    const nilaiAkhir = sc ? sc.nilaiAkhir : 80;
    const tpResult = generateReportDescriptionFromTP(
      m.mataPelajaran,
      selectedKelas,
      nilaiAkhir,
      db.tujuanPembelajaran,
      currentStudent.namaSiswa
    );
    const kkm = sc?.kkm || m.kkm || 75;
    return {
      mapel: m,
      score: {
        kkm,
        nilaiAkhir,
        predikat: sc?.predikat || (nilaiAkhir >= 88 ? 'Sangat Baik' : nilaiAkhir >= 78 ? 'Baik' : 'Cukup'),
        capaianKompetensi: sc?.capaianKompetensi || (nilaiAkhir >= 78 ? 'Baik' : 'Cukup'),
        deskripsiRapor: sc?.deskripsiRapor || tpResult.deskripsiRapor
      }
    };
  });

  const totalNilai = studentScores.reduce((acc, curr) => acc + curr.score.nilaiAkhir, 0);
  const rataRataNilai = studentScores.length > 0 ? (totalNilai / studentScores.length).toFixed(2) : '0';

  // Ekstrakurikuler
  const studentEkskul = db.ekstrakurikuler.filter(
    (e) => e.nisn === currentStudent.nisn && e.kelas === selectedKelas && e.semester === selectedSemester
  );

  // Kehadiran
  const studentAtt = db.kehadiran.find(
    (h) => h.nisn === currentStudent.nisn && h.kelas === selectedKelas && h.semester === selectedSemester
  ) || { sakit: 0, izin: 0, alpa: 0 };

  // Catatan wali kelas
  const studentNote =
    db.catatanWali.find(
      (c) => c.nisn === currentStudent.nisn && c.kelas === selectedKelas && c.semester === selectedSemester
    )?.catatanWaliKelas || 'Menunjukkan perkembangan belajar yang baik, pertahankan motivasi dan ketekunan.';

  // Keputusan
  const studentDecision = db.keputusanSiswa?.find(
    (k) => k.nisn === currentStudent.nisn && k.kelas === selectedKelas && k.semester === selectedSemester
  );

  const waliKelasData = db.kelas.find((k) => k.namaKelas === selectedKelas);
  const matchedTeacher = db.guru.find((g) => g.namaGuru === waliKelasData?.waliKelas) || db.guru[0];
  const waliKelasGuru = {
    namaGuru: db.sekolah.waliKelas || matchedTeacher?.namaGuru || 'Yohana Ibu, S.Pd',
    nip: db.sekolah.nipWaliKelas || matchedTeacher?.nip || '-'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg no-print shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
            <Eye size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-500/30">
                PRATINJAU RAPOR RESMI
              </span>
              <span className="text-xs font-mono text-slate-400">
                Kertas: <strong>{paperSize}</strong> • Zoom: <strong>{zoomLevel}%</strong>
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white">
              {currentStudent.namaSiswa} ({currentStudent.nisn || '-'})
            </h2>
          </div>
        </div>

        {/* Student Navigator & Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={handlePrevStudent}
            disabled={currentIdx <= 0}
            className="p-1.5 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg cursor-pointer"
            title="Siswa Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <select
            value={currentStudent.idSiswa}
            onChange={(e) => setPrintTargetStudentId(e.target.value)}
            className="bg-transparent text-xs font-bold text-amber-300 px-2 py-1 focus:outline-hidden cursor-pointer max-w-[200px] truncate"
          >
            {siswaKelas.map((s, idx) => (
              <option key={s.idSiswa} value={s.idSiswa} className="bg-slate-900 text-white">
                {idx + 1}. {s.namaSiswa}
              </option>
            ))}
          </select>
          <button
            onClick={handleNextStudent}
            disabled={currentIdx >= siswaKelas.length - 1}
            className="p-1.5 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg cursor-pointer"
            title="Siswa Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Action Buttons: Kertas, Font, Size, Zoom, Sync, Print, Close */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Paper Switcher */}
          <div className="inline-flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setPaperSize('F4')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                paperSize === 'F4' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              F4
            </button>
            <button
              onClick={() => setPaperSize('A4')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                paperSize === 'A4' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              A4
            </button>
          </div>

          {/* Bentuk Huruf (Font Family) */}
          <div className="inline-flex items-center bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 text-xs gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase hidden md:inline">Font:</span>
            <select
              value={printFontFamily}
              onChange={(e) => {
                setPrintFontFamily(e.target.value);
                showSaveNotification(`Bentuk huruf diubah ke ${e.target.value}`);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-bold text-amber-300 focus:outline-hidden cursor-pointer max-w-[130px] truncate"
              style={{ fontFamily: printFontFamily }}
              title="Pilih Bentuk Huruf Cetak Rapor"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.id} value={f.name} style={{ fontFamily: f.name }} className="bg-slate-900 text-white">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ukuran Huruf (Font Size) */}
          <div className="inline-flex items-center bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 text-xs gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase hidden md:inline">Size:</span>
            <select
              value={printFontSize}
              onChange={(e) => {
                setPrintFontSize(e.target.value);
                showSaveNotification(`Ukuran huruf diatur ke ${e.target.value}`);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-bold text-blue-300 focus:outline-hidden cursor-pointer"
              title="Pilih Ukuran Huruf Rapor"
            >
              {AVAILABLE_SIZES.map((s) => (
                <option key={s.size} value={s.size} className="bg-slate-900 text-white">
                  {s.size}
                </option>
              ))}
            </select>
            <div className="inline-flex items-center ml-0.5 border-l border-slate-700 pl-1">
              <button
                type="button"
                onClick={() => {
                  const currentNum = parseFloat(printFontSize) || 11;
                  const nextNum = Math.max(8, currentNum - 0.5);
                  setPrintFontSize(`${nextNum}pt`);
                }}
                className="px-1 py-0.5 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                title="Perkecil Ukuran Huruf (-0.5pt)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentNum = parseFloat(printFontSize) || 11;
                  const nextNum = Math.min(16, currentNum + 0.5);
                  setPrintFontSize(`${nextNum}pt`);
                }}
                className="px-1 py-0.5 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                title="Perbesar Ukuran Huruf (+0.5pt)"
              >
                A+
              </button>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="inline-flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              className="p-1 hover:text-white rounded cursor-pointer"
              title="Perkecil Tampilan"
            >
              <ZoomOut size={14} />
            </button>
            <span className="px-1.5 text-[11px] font-mono">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 hover:text-white rounded cursor-pointer"
              title="Perbesar Tampilan"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all hover:scale-102 ring-2 ring-emerald-400/40"
            title="Cetak langsung lembar rapor ini ke Printer / PDF"
          >
            <Printer size={15} className="text-amber-300" />
            <span>CETAK SEKARANG</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Tutup Pratinjau (ESC)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Secondary Bar: Tab Switcher Halaman Rapor */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="text-slate-400 mr-1 text-[11px]">Pilih Lembar:</span>
          <button
            onClick={() => setActiveTab('semua')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'semua'
                ? 'bg-slate-100 text-slate-900 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📑 Semua Halaman
          </button>
          <button
            onClick={() => setActiveTab('kaver')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'kaver'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📘 Hal 1 (Kaver)
          </button>
          <button
            onClick={() => setActiveTab('sekolah')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sekolah'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            🏫 Hal 2 (Sekolah)
          </button>
          <button
            onClick={() => setActiveTab('siswa')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'siswa'
                ? 'bg-purple-500 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            👤 Hal 3 (Biodata)
          </button>
          <button
            onClick={() => setActiveTab('nilai')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'nilai'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📄 Hal 4 (Nilai)
          </button>
          <button
            onClick={() => setActiveTab('ttd')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'ttd'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📝 Hal 5 (Catatan & TTD)
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          Gunakan mouse scroll untuk melihat lembar rapor ke bawah
        </div>
      </div>

      {/* Main Preview Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 print:p-0 print:overflow-visible print:bg-white flex justify-center">
        <div
          className="space-y-8 transition-transform origin-top w-full max-w-4xl"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {/* HAL 1: KAVER */}
          {(activeTab === 'semua' || activeTab === 'kaver') && (
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden print:border-none print:shadow-none print-page-break print:m-0 print:p-0">
              <ReportCoverPage sekolah={db.sekolah} student={currentStudent} paperSize={paperSize} fontFamily={printFontFamily} fontSize={printFontSize} />
            </div>
          )}

          {/* HAL 2: SEKOLAH */}
          {(activeTab === 'semua' || activeTab === 'sekolah') && (
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden print:border-none print:shadow-none print-page-break print:m-0 print:p-0">
              <ReportSchoolIdentityPage sekolah={db.sekolah} paperSize={paperSize} fontFamily={printFontFamily} fontSize={printFontSize} />
            </div>
          )}

          {/* HAL 3: SISWA */}
          {(activeTab === 'semua' || activeTab === 'siswa') && (
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden print:border-none print:shadow-none print-page-break print:m-0 print:p-0">
              <ReportStudentIdentityPage sekolah={db.sekolah} student={currentStudent} paperSize={paperSize} fontFamily={printFontFamily} fontSize={printFontSize} />
            </div>
          )}

          {/* HAL 4: LEMBAR NILAI */}
          {(activeTab === 'semua' || activeTab === 'nilai') && (
            <div
              className="report-typography-scope bg-white rounded-xl shadow-2xl border border-slate-300 p-8 sm:p-12 overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print-page-break text-slate-900"
              style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
            >
              {/* KOP RAPOR */}
              <div className="pb-4 border-b-2 border-slate-900 mb-6 flex items-center justify-between gap-4">
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <LogoKabupaten url={db.sekolah.logoKiriUrl} size={76} className="w-16 h-16 sm:w-20 sm:h-20" />
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
                    Alamat: {db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan}, Kab. {db.sekolah.kabupaten}
                  </p>
                </div>
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <LogoTutWuriHandayani url={db.sekolah.logoKananUrl} size={76} className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
              </div>

              {/* IDENTITAS */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6 font-medium">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-600">Nama Siswa</span>
                    <span className="w-3">:</span>
                    <strong className="text-slate-900 uppercase font-bold">{currentStudent.namaSiswa}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">NISN / NIS</span>
                    <span className="w-3">:</span>
                    <span className="font-mono">{currentStudent.nisn || '-'} / {currentStudent.nis || '-'}</span>
                  </div>
                </div>
                <div className="space-y-1 text-right sm:text-left">
                  <div className="flex">
                    <span className="w-28 text-slate-600">Kelas / Semester</span>
                    <span className="w-3">:</span>
                    <strong className="text-slate-900">{selectedKelas} / {selectedSemester}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-600">Tahun Pelajaran</span>
                    <span className="w-3">:</span>
                    <span>{db.sekolah.tahunPelajaran}</span>
                  </div>
                </div>
              </div>

              {/* TABEL NILAI */}
              <table className="w-full text-xs border-collapse border border-slate-900 mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold">
                    <th className="border border-slate-900 py-2 px-1 text-center w-8">No</th>
                    <th className="border border-slate-900 py-2 px-3 text-left">Mata Pelajaran</th>
                    <th className="border border-slate-900 py-2 px-2 text-center w-12">KKM</th>
                    <th className="border border-slate-900 py-2 px-2 text-center w-16">Nilai Akhir</th>
                    <th className="border border-slate-900 py-2 px-2 text-center w-28">Capaian Kompetensi</th>
                    <th className="border border-slate-900 py-2 px-3 text-left">Deskripsi Capaian Pembelajaran</th>
                  </tr>
                </thead>
                <tbody>
                  {studentScores.map((item, idx) => (
                    <tr key={item.mapel.mataPelajaran} className="hover:bg-slate-50/50">
                      <td className="border border-slate-900 py-1.5 px-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-900 py-1.5 px-3 font-semibold">{item.mapel.mataPelajaran}</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center font-mono">{item.score.kkm}</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center font-mono font-bold text-sm bg-slate-50">
                        {item.score.nilaiAkhir}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center text-[11px] font-semibold">
                        {item.score.capaianKompetensi}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3 text-[11px] leading-relaxed text-slate-800">
                        {item.score.deskripsiRapor}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <td colSpan={3} className="border border-slate-900 py-2 px-3 text-right">JUMLAH NILAI</td>
                    <td className="border border-slate-900 py-2 px-2 text-center font-mono font-black">{totalNilai}</td>
                    <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-500 text-[10px]">
                      Total akumulasi seluruh mata pelajaran
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold border-t border-slate-900">
                    <td colSpan={3} className="border border-slate-900 py-2 px-3 text-right">RATA-RATA NILAI</td>
                    <td className="border border-slate-900 py-2 px-2 text-center font-mono font-black text-emerald-900 bg-amber-100">
                      {rataRataNilai}
                    </td>
                    <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-500 text-[10px]">
                      Rata-rata perolehan nilai peserta didik
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Rapor Peserta Didik • {currentStudent.namaSiswa}</span>
                <span>Halaman 4 dari 5</span>
              </div>
            </div>
          )}

          {/* HAL 5: CATATAN & TTD */}
          {(activeTab === 'semua' || activeTab === 'ttd') && (
            <div
              className="report-typography-scope bg-white rounded-xl shadow-2xl border border-slate-300 p-8 sm:p-12 overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print-page-break text-slate-900"
              style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
            >
              {/* Ekskul */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2 text-slate-800">
                  B. KEGIATAN EKSTRAKURIKULER
                </h3>
                <table className="w-full text-[11px] border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900">
                      <th className="border border-slate-900 py-1.5 px-2 text-center w-8">No</th>
                      <th className="border border-slate-900 py-1.5 px-3 text-left">Kegiatan Ekstrakurikuler</th>
                      <th className="border border-slate-900 py-1.5 px-3 text-center w-28">Predikat</th>
                      <th className="border border-slate-900 py-1.5 px-3 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentEkskul.length > 0 ? (
                      studentEkskul.map((e, idx) => (
                        <tr key={e.id}>
                          <td className="border border-slate-900 py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-900 py-1.5 px-3 font-medium">{e.jenisEkstrakurikuler}</td>
                          <td className="border border-slate-900 py-1.5 px-3 text-center font-bold">{e.predikat}</td>
                          <td className="border border-slate-900 py-1.5 px-3 text-slate-700">{e.keterangan || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border border-slate-900 py-1.5 px-2 text-center font-mono">1</td>
                        <td className="border border-slate-900 py-1.5 px-3 font-medium">Pramuka Siaga/Penggalang</td>
                        <td className="border border-slate-900 py-1.5 px-3 text-center font-bold">Baik</td>
                        <td className="border border-slate-900 py-1.5 px-3 text-slate-700">Aktif mengikuti kegiatan mingguan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Catatan Guru */}
              <div className="mb-5 border border-slate-900 p-3 bg-white">
                <div className="font-bold text-xs text-slate-900 mb-1">Catatan Guru :</div>
                <div className="text-xs italic leading-relaxed text-slate-800">{studentNote}</div>
              </div>

              {/* Ketidakhadiran & Keputusan */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-slate-900 bg-white">
                  <div className="bg-slate-100 font-bold text-xs py-1.5 px-3 border-b border-slate-900 text-slate-900 uppercase">
                    Ketidakhadiran
                  </div>
                  <div className="p-3 text-xs space-y-1.5 text-slate-900">
                    <div className="flex justify-between">
                      <span>Sakit</span>
                      <span className="font-mono font-bold">: {studentAtt.sakit} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Izin</span>
                      <span className="font-mono font-bold">: {studentAtt.izin} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanpa Keterangan</span>
                      <span className="font-mono font-bold">: {studentAtt.alpa} hari</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-900 bg-white p-3 text-xs">
                  <div className="mb-1 pb-1 border-b border-slate-200 font-bold text-slate-900">Keputusan :</div>
                  <p className="text-[11px] text-slate-700 mb-2">Berdasarkan pencapaian kompetensi:</p>
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="w-28 text-slate-700">Naik ke kelas</span>
                      <span className="w-3">:</span>
                      <span className="font-bold text-slate-900">{studentDecision?.naikKelas || 'II (Dua)'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-700">Tinggal di kelas</span>
                      <span className="w-3">:</span>
                      <span className="font-mono text-slate-900">{studentDecision?.tinggalKelas || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pengesahan Tanda Tangan */}
              <div className="text-xs pt-4 font-serif text-black">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="font-medium text-slate-800">Mengetahui :</p>
                    <p className="font-bold text-slate-900 mb-14">Orang Tua/Wali,</p>
                    <p className="font-black underline uppercase text-slate-950">
                      {currentStudent.namaAyah || currentStudent.namaWali || '................................'}
                    </p>
                  </div>
                  <div className="pl-8 sm:pl-16">
                    <p className="text-slate-800">
                      {db.sekolah.tempatRapor || 'Oksibil'}, {db.sekolah.tanggalRapor || '25 Juli 2021'}
                    </p>
                    <p className="font-bold text-slate-900 mb-14">Guru Kelas,</p>
                    <p className="font-black underline text-slate-950">{waliKelasGuru.namaGuru}</p>
                    <p className="text-[11px] font-mono text-slate-700">NIP. {waliKelasGuru.nip}</p>
                  </div>
                </div>
                <div className="text-center mt-6 pt-2">
                  <p className="font-medium text-slate-800">Mengetahui,</p>
                  <p className="font-bold text-slate-900 mb-14">Kepala Sekolah</p>
                  <p className="font-black underline uppercase text-slate-950">
                    {db.sekolah.namaKepalaSekolah || 'Charles Dedenip uropmabin'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-700">NIP. {db.sekolah.nipKepalaSekolah || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono mt-6">
                <span>Rapor Peserta Didik • {currentStudent.namaSiswa}</span>
                <span>Halaman 5 dari 5</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
