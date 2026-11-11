import React, { useState } from 'react';
import {
  Type,
  Baseline,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  ZoomIn,
  ZoomOut,
  Info,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface FontOption {
  id: string;
  name: string;
  family: string;
  description: string;
  badge?: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: 'times',
    name: 'Times New Roman',
    family: '"Times New Roman", Times, serif',
    description: 'Standar resmi kedinasan & Kemdikbudristek',
    badge: 'Standar Resmi'
  },
  {
    id: 'arial',
    name: 'Arial',
    family: 'Arial, Helvetica, sans-serif',
    description: 'Modern, bersih, jelas dan sangat mudah dibaca',
    badge: 'Modern'
  },
  {
    id: 'calibri',
    name: 'Calibri',
    family: 'Calibri, Candara, Segoe, sans-serif',
    description: 'Halus, proporsional dan hemat ruang kertas',
    badge: 'Ringkas'
  },
  {
    id: 'bookman',
    name: 'Bookman Old Style',
    family: '"Bookman Old Style", Georgia, serif',
    description: 'Klasik formal dokumen ijazah & piagam negara',
    badge: 'Klasik'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: 'Georgia, serif',
    description: 'Serif berbobot elegan dengan kontras jelas',
    badge: 'Elegan'
  },
  {
    id: 'tahoma',
    name: 'Tahoma',
    family: 'Tahoma, Geneva, Verdana, sans-serif',
    description: 'Rapat, terstruktur rapi untuk tabel nilai',
    badge: 'Kompak'
  },
  {
    id: 'garamond',
    name: 'Garamond',
    family: 'Garamond, "EB Garamond", serif',
    description: 'Halus berwibawa khas sertifikat & piagam penghargaan',
    badge: 'Formal'
  },
  {
    id: 'trebuchet',
    name: 'Trebuchet MS',
    family: '"Trebuchet MS", sans-serif',
    description: 'Tegas, modern kontemporer untuk laporan sekolah',
    badge: 'Tegas'
  }
];

export interface FontSizeOption {
  size: string;
  numeric: number;
  label: string;
  description: string;
}

export const AVAILABLE_SIZES: FontSizeOption[] = [
  { size: '9pt', numeric: 9, label: '9 pt (Kecil Padat)', description: 'Cocok jika deskripsi TP sangat panjang agar muat 1 halaman' },
  { size: '9.5pt', numeric: 9.5, label: '9.5 pt (Padat Proporsional)', description: 'Teks rapi hemat ruang tanpa mengurangi keterbacaan' },
  { size: '10pt', numeric: 10, label: '10 pt (Ringkas Standar)', description: 'Ukuran ideal untuk rapor dengan banyak mata pelajaran' },
  { size: '10.5pt', numeric: 10.5, label: '10.5 pt (Sedang Seimbang)', description: 'Proporsional seimbang antara kerapatan dan kenyamanan baca' },
  { size: '11pt', numeric: 11, label: '11 pt (Standar Resmi Kemdikbud)', description: 'Ukuran standar nasional rapor Kurikulum Merdeka' },
  { size: '11.5pt', numeric: 11.5, label: '11.5 pt (Jelas Terbaca)', description: 'Nyaman dibaca oleh orang tua / wali peserta didik' },
  { size: '12pt', numeric: 12, label: '12 pt (Besar Standar)', description: 'Huruf besar jelas dan tegas untuk dokumen resmi' },
  { size: '13pt', numeric: 13, label: '13 pt (Cukup Besar)', description: 'Sangat jelas untuk pencetakan dokumen penting' },
  { size: '14pt', numeric: 14, label: '14 pt (Ekstra Besar)', description: 'Ukuran ekstra besar untuk judul dan dokumen ringkas' }
];

interface PrintTypographyControlProps {
  className?: string;
  compact?: boolean;
}

export const PrintTypographyControl: React.FC<PrintTypographyControlProps> = ({
  className = '',
  compact = false
}) => {
  const {
    printFontFamily,
    setPrintFontFamily,
    printFontSize,
    setPrintFontSize,
    showSaveNotification,
    actionToolbarMode
  } = useApp();

  // Mode lokal: 'full' | 'compact' | 'hidden'
  const [localMode, setLocalMode] = useState<'full' | 'compact' | 'hidden'>(compact ? 'compact' : 'compact');

  // Sinkronkan dengan global bila ada kebutuhan
  const effectiveMode = actionToolbarMode === 'hidden'
    ? 'hidden'
    : (actionToolbarMode === 'compact' ? 'compact' : localMode);

  // Helper untuk mengubah ukuran dengan tombol +/-
  const changeSizeStep = (delta: number) => {
    const currentNum = parseFloat(printFontSize) || 11;
    let nextNum = Math.round((currentNum + delta) * 2) / 2;
    if (nextNum < 8) nextNum = 8;
    if (nextNum > 16) nextNum = 16;
    const nextSize = `${nextNum}pt`;
    setPrintFontSize(nextSize);
    showSaveNotification(`Ukuran huruf diubah ke ${nextSize}`);
  };

  const handleSetPreset = (font: string, size: string, label: string) => {
    setPrintFontFamily(font);
    setPrintFontSize(size);
    showSaveNotification(`Preset bentuk & ukuran huruf "${label}" diterapkan!`);
  };

  const handleReset = () => {
    setPrintFontFamily('Times New Roman');
    setPrintFontSize('11pt');
    showSaveNotification('Bentuk & ukuran huruf direset ke Standar Resmi (Times New Roman 11pt)!');
  };

  const activeFontObj = AVAILABLE_FONTS.find((f) => f.name === printFontFamily) || AVAILABLE_FONTS[0];

  // ─────────────────────────────────────────────────────────────
  // 1. TAMPILAN JIKA MODE SEMBUNYI (HIDDEN)
  // ─────────────────────────────────────────────────────────────
  if (effectiveMode === 'hidden') {
    return (
      <div
        className={`bg-amber-50/70 hover:bg-amber-50 border border-dashed border-amber-300 rounded-xl px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 no-print transition-all shadow-2xs ${className}`}
      >
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Type size={14} className="text-amber-700" />
          <span className="font-extrabold text-slate-800">Huruf Rapor:</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-amber-200">
            {printFontFamily} ({printFontSize})
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">• Panel disembunyikan</span>
        </div>

        <div className="ml-auto flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Reset ke Standar Resmi"
          >
            <RotateCcw size={11} />
          </button>
          <button
            type="button"
            onClick={() => setLocalMode('compact')}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
            title="Tampilkan pengaturan huruf dalam mode ramping"
          >
            <Eye size={12} />
            <span>Tampilkan Pengaturan Huruf</span>
          </button>
          <button
            type="button"
            onClick={() => setLocalMode('full')}
            className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 cursor-pointer"
            title="Buka penuh"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TAMPILAN JIKA MODE RAMPING (COMPACT)
  // Menampilkan kontrol lengkap dalam satu baris bersih dan rapi di kanan
  // ─────────────────────────────────────────────────────────────
  if (effectiveMode === 'compact') {
    return (
      <div
        className={`bg-gradient-to-r from-amber-50/90 via-white to-blue-50/90 border border-amber-200 rounded-2xl p-2.5 sm:p-3 shadow-xs no-print transition-all ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* SISI KIRI: Label Ringkas */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-2xs">
              <Type size={15} />
            </div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
              Bentuk & Ukuran Huruf Cetak:
            </span>
          </div>

          {/* SISI KANAN: SEMUA KONTROL TERSUSUN RAPI DI SAMPING KANAN */}
          <div className="ml-auto flex items-center justify-end flex-wrap gap-1.5 sm:gap-2">
            {/* Dropdown Font Family Ramping */}
            <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-300 shadow-2xs">
              <Baseline size={13} className="text-amber-600" />
              <select
                value={printFontFamily}
                onChange={(e) => {
                  setPrintFontFamily(e.target.value);
                  showSaveNotification(`Bentuk huruf diubah ke ${e.target.value}`);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
                style={{ fontFamily: printFontFamily }}
                title="Pilih Bentuk Huruf Rapor"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font.id} value={font.name} style={{ fontFamily: font.name }}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Font Size Ramping */}
            <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-300 shadow-2xs">
              <Sliders size={13} className="text-blue-600" />
              <select
                value={printFontSize}
                onChange={(e) => {
                  setPrintFontSize(e.target.value);
                  showSaveNotification(`Ukuran huruf diubah ke ${e.target.value}`);
                }}
                className="bg-transparent text-xs font-bold text-blue-900 focus:outline-hidden cursor-pointer"
                title="Pilih Ukuran Huruf Rapor"
              >
                {AVAILABLE_SIZES.map((sz) => (
                  <option key={sz.size} value={sz.size}>
                    {sz.size}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Cepat A- dan A+ */}
            <div className="inline-flex items-center rounded-xl bg-white border border-slate-300 shadow-2xs p-0.5">
              <button
                type="button"
                onClick={() => changeSizeStep(-0.5)}
                className="px-2 py-1 hover:bg-slate-100 text-slate-700 font-black text-xs rounded-lg transition-colors cursor-pointer"
                title="Perkecil huruf (A-)"
              >
                A-
              </button>
              <div className="h-3.5 w-px bg-slate-200" />
              <button
                type="button"
                onClick={() => changeSizeStep(0.5)}
                className="px-2 py-1 hover:bg-slate-100 text-slate-700 font-black text-xs rounded-lg transition-colors cursor-pointer"
                title="Perbesar huruf (A+)"
              >
                A+
              </button>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
              title="Reset ke Standar Resmi (Times New Roman 11pt)"
            >
              <RotateCcw size={12} />
              <span className="hidden md:inline">Reset</span>
            </button>

            {/* Pembatas */}
            <div className="h-4 w-px bg-amber-300 mx-0.5 hidden sm:block" />

            {/* Segmented Control: Perluas / Sembunyikan */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-300 shadow-2xs">
              <button
                type="button"
                onClick={() => setLocalMode('full')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Perluas pengaturan huruf lengkap (preset, live preview)"
              >
                <Maximize2 size={12} />
                <span className="hidden sm:inline">Perluas</span>
              </button>
              <button
                type="button"
                onClick={() => setLocalMode('hidden')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sembunyikan panel pengaturan huruf"
              >
                <EyeOff size={12} />
                <span className="hidden sm:inline">Hilangkan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. TAMPILAN MODE PENUH (FULL)
  // Menampilkan semua preset, live preview, dengan tombol aksi tersusun di kanan
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`bg-gradient-to-r from-amber-50/80 via-white to-blue-50/80 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs no-print transition-all ${className}`}
    >
      {/* Header Bar dengan Ringkasan Font Aktif & Tombol Aksi di Kanan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
            <Type size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <span>Pengaturan Bentuk & Ukuran Huruf Cetak Rapor</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                Font: {printFontFamily}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                Size: {printFontSize}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Sesuaikan bentuk huruf (font) dan ukuran (size) seluruh lembar cetak rapor & pratinjau
            </p>
          </div>
        </div>

        {/* Action Controls Tersusun Rapi di Samping Kanan */}
        <div className="ml-auto flex items-center justify-end flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Reset ke Standar Resmi (Times New Roman 11pt)"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset Standar</span>
          </button>

          {/* Segmented Control Rampingkan & Hilangkan */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={() => setLocalMode('compact')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Rampingkan panel pengaturan huruf"
            >
              <Minimize2 size={12} />
              <span className="hidden sm:inline">Rampingkan</span>
            </button>
            <button
              type="button"
              onClick={() => setLocalMode('hidden')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sembunyikan panel pengaturan huruf"
            >
              <EyeOff size={12} />
              <span className="hidden sm:inline">Hilangkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Panel Pengaturan Detail (Bentuk Huruf, Ukuran, Preset, Live Preview) */}
      <div className="mt-3.5 pt-3.5 border-t border-amber-200/80 space-y-3.5 text-xs">
        {/* Baris 1: Pilihan Bentuk Huruf & Ukuran Huruf */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Bentuk Huruf (Font Family) */}
          <div className="md:col-span-7 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                <Baseline size={14} className="text-amber-600" />
                <span>Bentuk Huruf (Font Family):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                {activeFontObj.description}
              </span>
            </div>

            {/* Select Dropdown Bentuk Huruf */}
            <div className="relative">
              <select
                value={printFontFamily}
                onChange={(e) => {
                  setPrintFontFamily(e.target.value);
                  showSaveNotification(`Bentuk huruf diubah ke ${e.target.value}`);
                }}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all cursor-pointer"
                style={{ fontFamily: printFontFamily }}
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option
                    key={font.id}
                    value={font.name}
                    style={{ fontFamily: font.name }}
                    className="py-1"
                  >
                    {font.name} ({font.badge}) - {font.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Font Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold mr-1">Pilihan Cepat:</span>
              {AVAILABLE_FONTS.slice(0, 4).map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    setPrintFontFamily(font.name);
                    showSaveNotification(`Bentuk huruf diubah ke ${font.name}`);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                    printFontFamily === font.name
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  style={{ fontFamily: font.name }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          {/* Ukuran Huruf (Font Size) */}
          <div className="md:col-span-5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                <Sliders size={14} className="text-blue-600" />
                <span>Ukuran Huruf (Font Size):</span>
              </label>
              <span className="text-[11px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {printFontSize}
              </span>
            </div>

            {/* Select Dropdown Ukuran Huruf & Tombol Zoom Step */}
            <div className="flex items-center gap-1.5">
              <select
                value={printFontSize}
                onChange={(e) => {
                  setPrintFontSize(e.target.value);
                  showSaveNotification(`Ukuran huruf diubah ke ${e.target.value}`);
                }}
                className="flex-1 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all cursor-pointer"
              >
                {AVAILABLE_SIZES.map((sz) => (
                  <option key={sz.size} value={sz.size}>
                    {sz.label}
                  </option>
                ))}
              </select>

              <div className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50 p-0.5 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => changeSizeStep(-0.5)}
                  className="px-2.5 py-1.5 hover:bg-white text-slate-700 font-extrabold text-xs rounded-lg transition-all cursor-pointer"
                  title="Perkecil Ukuran Huruf (A-)"
                >
                  A-
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => changeSizeStep(0.5)}
                  className="px-2.5 py-1.5 hover:bg-white text-slate-700 font-extrabold text-xs rounded-lg transition-all cursor-pointer"
                  title="Perbesar Ukuran Huruf (A+)"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Quick Size Badges */}
            <div className="flex flex-wrap items-center gap-1 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold mr-1">Skala:</span>
              {['9pt', '11pt', '12pt', '13pt'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPrintFontSize(s);
                    showSaveNotification(`Ukuran huruf diubah ke ${s}`);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                    printFontSize === s
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s === '9pt' ? 'Kecil (9pt)' : s === '11pt' ? 'Standar (11pt)' : s === '12pt' ? 'Besar (12pt)' : 'Ekstra (13pt)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Baris 2: Preset Siap Pakai & Pratinjau Teks Rapor */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1">
          {/* Preset Siap Pakai */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1 mr-1">
              <Sparkles size={12} className="text-amber-500" />
              Preset Siap Pakai:
            </span>
            <button
              type="button"
              onClick={() => handleSetPreset('Times New Roman', '11pt', 'Standar Resmi')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-amber-50 text-slate-800 border border-amber-300 transition-all cursor-pointer shadow-2xs hover:scale-101"
            >
              🏛️ Standar Resmi (Times 11pt)
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('Arial', '10pt', 'Modern Ringkas')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-blue-50 text-slate-800 border border-blue-300 transition-all cursor-pointer shadow-2xs hover:scale-101"
            >
              ✨ Modern Ringkas (Arial 10pt)
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('Calibri', '10.5pt', 'Halus Hemat Kertas')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-slate-800 border border-indigo-300 transition-all cursor-pointer shadow-2xs hover:scale-101"
            >
              📄 Halus Rapi (Calibri 10.5pt)
            </button>
          </div>

          {/* Kotak Pratinjau Teks Rapor Langsung */}
          <div className="md:col-span-6 bg-white p-2.5 rounded-xl border border-slate-300 shadow-inner flex items-center justify-between gap-3 overflow-hidden">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                Pratinjau Teks Rapor Langsung:
              </div>
              <div
                className="text-slate-900 font-bold truncate transition-all"
                style={{
                  fontFamily: printFontFamily,
                  fontSize: printFontSize
                }}
              >
                SD Negeri Balil • Rapor Peserta Didik Tahun Pelajaran 2026/2027
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <Check size={11} /> Aktif Otomatis
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
