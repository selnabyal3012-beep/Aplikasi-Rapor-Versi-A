import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Image,
  Shield,
  School,
  User,
  Calendar,
  MapPin,
  Upload,
  Trash2,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  Laptop,
  PanelLeft,
  PanelLeftClose,
  Sparkles,
  Palette,
  Type,
  Printer,
  FileText,
  Sun,
  Moon,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Check,
  Eye,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  useApp,
  THEME_ACCENT_MAP,
  PAPER_SIZE_MAP,
  MARGIN_PRESETS,
  UI_FONT_SCALE_MAP,
  UI_FONT_FAMILY_MAP
} from '../../context/AppContext';
import {
  ThemeAccent,
  ThemeMode,
  UiFontSize,
  UiFontFamily,
  PaperSize,
  PaperOrientation,
  PaperMarginPreset,
  PrintColorMode,
  PrintTableBorder
} from '../../types';
import { AVAILABLE_FONTS, AVAILABLE_SIZES } from '../common/PrintTypographyControl';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';

type SettingsTab = 'tema' | 'huruf' | 'kertas' | 'print' | 'sekolah';

export const SettingsSection: React.FC = () => {
  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const {
    db,
    updateSekolah,
    displayMode,
    setDisplayMode,
    isFullscreen,
    toggleFullscreen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    showSaveNotification,
    // Tema
    themeAccent,
    setThemeAccent,
    themeMode,
    setThemeMode,
    // Ukuran Huruf UI & Cetak
    uiFontSize,
    setUiFontSize,
    uiFontScalePercent,
    setUiFontScalePercent,
    uiFontFamily,
    setUiFontFamily,
    printFontFamily,
    setPrintFontFamily,
    printFontSize,
    setPrintFontSize,
    // Kertas
    paperSize,
    setPaperSize,
    paperOrientation,
    setPaperOrientation,
    paperMarginPreset,
    setPaperMarginPreset,
    paperMargins,
    setPaperMargins,
    // Print
    printColorMode,
    setPrintColorMode,
    printShowKop,
    setPrintShowKop,
    printTableBorder,
    setPrintTableBorder,
    printPageNumbers,
    setPrintPageNumbers,
    triggerQuickPrint
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('tema');

  const [formData, setFormData] = useState({
    namaAplikasi: 'Aplikasi Rapor Kurikulum Merdeka Versi A',
    namaPemerintah: db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG',
    namaInstansi: db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN',
    namaSekolah: db.sekolah.namaSekolah,
    tahunPelajaran: db.sekolah.tahunPelajaran,
    semester: db.sekolah.semester,
    kepalaSekolah: db.sekolah.namaKepalaSekolah,
    nipKepalaSekolah: db.sekolah.nipKepalaSekolah,
    tempatRapor: db.sekolah.tempatRapor,
    tanggalRapor: db.sekolah.tanggalRapor,
    logoKiriUrl: db.sekolah.logoKiriUrl || '',
    logoKananUrl: db.sekolah.logoKananUrl || ''
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSave(() => {
      updateSekolah({
        namaPemerintah: formData.namaPemerintah,
        namaInstansi: formData.namaInstansi,
        namaSekolah: formData.namaSekolah,
        tahunPelajaran: formData.tahunPelajaran,
        semester: formData.semester as any,
        namaKepalaSekolah: formData.kepalaSekolah,
        nipKepalaSekolah: formData.nipKepalaSekolah,
        tempatRapor: formData.tempatRapor,
        tanggalRapor: formData.tanggalRapor,
        logoKiriUrl: formData.logoKiriUrl,
        logoKananUrl: formData.logoKananUrl
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleUploadKiri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logoKiriUrl: event.target?.result as string }));
        showSaveNotification('Logo Kiri Pemda berhasil dimuat.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadKanan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logoKananUrl: event.target?.result as string }));
        showSaveNotification('Logo Kanan Sekolah berhasil dimuat.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarginChange = (key: 'top' | 'bottom' | 'left' | 'right', val: number) => {
    setPaperMargins({
      ...paperMargins,
      [key]: Math.max(0, Math.min(60, val))
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Utama Pengaturan */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Settings size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Pusat Konfigurasi Sistem
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
              Pengaturan Aplikasi &amp; Cetak Rapor
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sesuaikan Tema Aplikasi, Ukuran &amp; Bentuk Huruf, Ukuran Kertas Rapor (F4/A4), Opsi Cetak, dan Identitas Sekolah.
            </p>
          </div>
        </div>

        {saved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-xs font-semibold animate-pulse">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <StandardActionToolbar
        title="Aksi Pengaturan Aplikasi"
        badge={activeTab.toUpperCase()}
        onSave={() => handleSubmit(new Event('submit') as any)}
        saveLabel="Simpan Pengaturan"
        saveStatus={saveStatus}
        onUpdate={() => handleSubmit(new Event('submit') as any)}
        updateLabel="Perbarui Sistem"
        onEdit={() => {}}
        editLabel="Edit Konfigurasi"
        onCancel={() => {
          setThemeAccent('emerald');
          setThemeMode('light');
          setUiFontSize('normal');
          setPaperSize('F4');
          setPrintColorMode('color');
          showSaveNotification('Pengaturan dikembalikan ke standar awal.');
        }}
        cancelLabel="Reset Standar"
        onDelete={() => {
          if (confirm('Bersihkan pengaturan logo kustom?')) {
            setFormData((prev) => ({ ...prev, logoKiriUrl: '', logoKananUrl: '' }));
            showSaveNotification('Logo kustom dibersihkan.');
          }
        }}
        deleteLabel="Bersihkan Logo"
        onImport={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = e.target?.result as string;
            setFormData((prev) => ({ ...prev, logoKiriUrl: data }));
            showSaveNotification('Logo Kiri diimpor.');
          };
          reader.readAsDataURL(file);
        }}
        importLabel="Impor Logo Kiri"
        onExport={() => {
          const settingsExport = {
            sekolah: formData,
            tema: { themeAccent, themeMode, displayMode },
            tipografi: { uiFontSize, uiFontScalePercent, uiFontFamily, printFontFamily, printFontSize },
            kertas: { paperSize, paperOrientation, paperMarginPreset, paperMargins },
            print: { printColorMode, printShowKop, printTableBorder, printPageNumbers }
          };
          const blob = new Blob([JSON.stringify(settingsExport, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pengaturan-lengkap-rapor.json';
          a.click();
          URL.revokeObjectURL(a.href);
        }}
        exportLabel="Expor Konfigurasi"
        onUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = e.target?.result as string;
            setFormData((prev) => ({ ...prev, logoKananUrl: data }));
            showSaveNotification('Logo Kanan diunggah.');
          };
          reader.readAsDataURL(file);
        }}
        uploadLabel="Upload Logo Kanan"
        onClear={() => {
          setFormData((prev) => ({ ...prev, logoKiriUrl: '', logoKananUrl: '' }));
        }}
        clearLabel="Bersihkan File"
        templateLabel="Format Standar"
      />

      {/* TAB PILIHAN PENGATURAN (TEMA, HURUF, KERTAS, PRINT, SEKOLAH) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('tema')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tema'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-300 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Palette size={16} className="text-emerald-500" />
          <span>Tema Aplikasi</span>
        </button>

        <button
          onClick={() => setActiveTab('huruf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'huruf'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-300 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Type size={16} className="text-blue-500" />
          <span>Ukuran Huruf &amp; Tipografi</span>
        </button>

        <button
          onClick={() => setActiveTab('kertas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'kertas'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-300 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <FileText size={16} className="text-indigo-500" />
          <span>Kertas &amp; Tata Letak</span>
        </button>

        <button
          onClick={() => setActiveTab('print')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'print'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-300 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Printer size={16} className="text-amber-500" />
          <span>Pengaturan Cetak / Print</span>
        </button>

        <button
          onClick={() => setActiveTab('sekolah')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sekolah'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-300 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <School size={16} className="text-rose-500" />
          <span>Identitas Sekolah &amp; KOP</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: TEMA APLIKASI */}
      {/* ==================================================================== */}
      {activeTab === 'tema' && (
        <div className="space-y-6">
          {/* Card Pilihan Warna Aksen */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Palette size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    Pilihan Warna Aksen Tema Aplikasi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih nuansa warna utama tombol, sorotan aktif, dan identitas aplikasi.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Aktif: {THEME_ACCENT_MAP[themeAccent]?.name || themeAccent}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(THEME_ACCENT_MAP) as ThemeAccent[]).map((key) => {
                const item = THEME_ACCENT_MAP[key];
                const isSelected = themeAccent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setThemeAccent(key)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 relative ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-md ring-2 ring-slate-300 dark:ring-slate-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: item.primary }}
                    >
                      {isSelected ? <Check size={18} strokeWidth={3} /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.primary}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Tampilan Gelap / Terang / Otomatis */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Sun size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                  Skema Warna (Mode Terang / Mode Gelap)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gunakan Mode Terang di siang hari atau Mode Gelap saat menginput nilai di malam hari untuk kenyamanan mata.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  themeMode === 'light'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                    <Sun size={20} />
                  </div>
                  {themeMode === 'light' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      AKTIF
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Mode Terang (Light Mode)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Latar putih bersih dengan kontras teks tajam, ideal untuk ruang kelas dan jam kerja siang.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  themeMode === 'dark'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-300">
                    <Moon size={20} />
                  </div>
                  {themeMode === 'dark' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                      AKTIF
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Mode Gelap (Dark Mode)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Latar hitam gelap nyaman di mata dan menghemat daya baterai laptop saat mengetik nilai rapor.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('auto')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  themeMode === 'auto'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                    <Monitor size={20} />
                  </div>
                  {themeMode === 'auto' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      AKTIF
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Otomatis (Sesuai Sistem)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Mengikuti preferensi tema sistem operasi Windows, MacOS, Android, atau pengaturan laptop.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Mode Tampilan Perangkat: PC, HP, FULL */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Monitor size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    Mode Tata Letak Layar (PC, HP, &amp; Full Screen)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Optimalisasi lebar layout untuk Komputer Guru, Smartphone, atau Layar Lebar Proyektor.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isFullscreen
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh Browser'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setDisplayMode('pc')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  displayMode === 'pc'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Laptop size={18} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${displayMode === 'pc' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                    {displayMode === 'pc' ? 'AKTIF' : 'PILIH PC'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Mode PC / Laptop</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sidebar navigasi terbuka di sebelah kiri untuk berpindah menu dengan cepat.
                </p>
              </div>

              <div
                onClick={() => setDisplayMode('hp')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  displayMode === 'hp'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Smartphone size={18} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${displayMode === 'hp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                    {displayMode === 'hp' ? 'AKTIF' : 'PILIH HP'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Mode Smartphone / HP</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sidebar disembunyikan dan navigasi menggunakan tombol drawer hamburger yang hemat ruang.
                </p>
              </div>

              <div
                onClick={() => setDisplayMode('full')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  displayMode === 'full'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                    <Maximize2 size={18} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${displayMode === 'full' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                    {displayMode === 'full' ? 'AKTIF' : 'PILIH FULL'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Mode Full Width</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ruang tabel nilai dimaksimalkan hingga 100% lebar layar tanpa batas margin tepi.
                </p>
              </div>
            </div>

            {/* Sidebar Collapse Quick Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <PanelLeft size={16} className="text-slate-500" />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Posisi Sidebar Menu Saat Ini:
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {isSidebarCollapsed ? 'Dirampingkan (Hanya Ikon)' : 'Terbuka Penuh dengan Label'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer text-xs"
              >
                {isSidebarCollapsed ? 'Buka Sidebar Penuh' : 'Ciutkan Sidebar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: UKURAN HURUF & TIPOGRAFI */}
      {/* ==================================================================== */}
      {activeTab === 'huruf' && (
        <div className="space-y-6">
          {/* 1. Pengaturan Ukuran Huruf Aplikasi (UI Scale) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Type size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    Ukuran Huruf Tampilan Aplikasi (UI Scale)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbesar atau perkecil seluruh tulisan tombol, tabel, dan form agar nyaman dibaca di layar laptop guru.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUiFontScalePercent(Math.max(80, uiFontScalePercent - 5))}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Perkecil Huruf (-5%)"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="font-mono font-black text-sm px-3 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 min-w-16 text-center">
                  {uiFontScalePercent}%
                </span>
                <button
                  type="button"
                  onClick={() => setUiFontScalePercent(Math.min(140, uiFontScalePercent + 5))}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Perbesar Huruf (+5%)"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Tombol Preset Skala Huruf */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(UI_FONT_SCALE_MAP) as UiFontSize[]).map((key) => {
                const item = UI_FONT_SCALE_MAP[key];
                const isSelected = uiFontSize === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setUiFontSize(key)}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm ring-2 ring-blue-200'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-black text-base mb-0.5">{item.percent}%</div>
                    <div className="text-xs font-semibold">{item.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Slider Halus */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold">Slider Halus Skala Tulisan:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{uiFontScalePercent}% (Bawaan: 100%)</span>
              </div>
              <input
                type="range"
                min="80"
                max="140"
                step="2"
                value={uiFontScalePercent}
                onChange={(e) => setUiFontScalePercent(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>80% (Sangat Kecil)</span>
                <span>100% (Standar)</span>
                <span>120% (Besar)</span>
                <span>140% (Maksimal)</span>
              </div>
            </div>

            {/* Pilihan Jenis Huruf UI Aplikasi */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pilihan Jenis Huruf Aplikasi (UI Font Family)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(UI_FONT_FAMILY_MAP) as UiFontFamily[]).map((key) => {
                  const font = UI_FONT_FAMILY_MAP[key];
                  const isSelected = uiFontFamily === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setUiFontFamily(key)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-2 ring-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs mb-1" style={{ fontFamily: font.css }}>
                        {font.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {font.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Pengaturan Huruf Cetak Rapor (Print Typography) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Printer size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    Huruf Cetak Rapor (Font &amp; Ukuran Pada Kertas)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bentuk huruf dan ukuran point (pt) saat rapor dicetak ke kertas fisik atau disimpan PDF.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                {printFontFamily} • {printFontSize}
              </span>
            </div>

            {/* Pilihan Bentuk Huruf Cetak */}
            <div className="space-y-2">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                Pilih Bentuk Huruf Cetak Rapor:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AVAILABLE_FONTS.map((font) => {
                  const isSelected = printFontFamily.toLowerCase() === font.name.toLowerCase();
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setPrintFontFamily(font.name)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-200'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs" style={{ fontFamily: font.family }}>
                          {font.name}
                        </span>
                        {font.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {font.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                        {font.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilihan Ukuran Huruf Cetak (Point / pt) */}
            <div className="space-y-2 pt-2">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                Pilih Ukuran Huruf Cetak Rapor (Point):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {AVAILABLE_SIZES.slice(0, 8).map((sz) => {
                  const isSelected = printFontSize === sz.size;
                  return (
                    <button
                      key={sz.size}
                      type="button"
                      onClick={() => setPrintFontSize(sz.size)}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white font-extrabold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-xs font-bold'
                      }`}
                    >
                      {sz.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pratinjau Mini Teks Rapor */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 shadow-xs space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pratinjau Mini Format Cetak Rapor (Live Preview):
              </div>
              <div
                className="p-3 bg-amber-50/30 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
                style={{ fontFamily: `"${printFontFamily}", Times, serif`, fontSize: printFontSize }}
              >
                <div className="font-bold text-center uppercase tracking-wide mb-1">
                  LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR)
                </div>
                <div className="text-center text-[10px] text-slate-500 mb-2">
                  SD NEGERI BALIL • TAHUN AJARAN 2026/2027
                </div>
                <table className="w-full border-collapse border border-slate-400 text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-400 p-1.5">Mata Pelajaran</th>
                      <th className="border border-slate-400 p-1.5 text-center w-12">KKM</th>
                      <th className="border border-slate-400 p-1.5 text-center w-14">Nilai Akhir</th>
                      <th className="border border-slate-400 p-1.5 text-center w-24">Capaian Kompetensi</th>
                      <th className="border border-slate-400 p-1.5">Deskripsi Capaian Pembelajaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">1</td>
                      <td className="border border-slate-400 p-1.5 font-bold">Pendidikan Agama Kristen</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">75</td>
                      <td className="border border-slate-400 p-1.5 text-center font-bold font-mono">88</td>
                      <td className="border border-slate-400 p-1.5 text-center font-semibold">Sangat Baik</td>
                      <td className="border border-slate-400 p-1.5">Menunjukkan penguasaan sangat baik dalam memahami kasih dan teladan Yesus.</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                      <td colSpan={3} className="border border-slate-400 p-1.5 text-right uppercase">JUMLAH NILAI</td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">88</td>
                      <td colSpan={2} className="border border-slate-400 p-1.5 text-[10px] text-slate-500">Rata-rata Nilai: 88.0</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PENGATURAN KERTAS RAPOR */}
      {/* ==================================================================== */}
      {activeTab === 'kertas' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    Ukuran &amp; Tata Letak Kertas Rapor (Paper Setup)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih ukuran fisik kertas printer sekolah (F4/Folio atau A4), orientasi cetak, dan margin batas tepi.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                {paperSize} • {paperOrientation.toUpperCase()}
              </span>
            </div>

            {/* Pilihan Ukuran Kertas: F4, A4, Legal, Letter */}
            <div className="space-y-3">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                1. Ukuran Kertas Cetak:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(PAPER_SIZE_MAP) as PaperSize[]).map((key) => {
                  const spec = PAPER_SIZE_MAP[key];
                  const isSelected = paperSize === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaperSize(key)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-md ring-2 ring-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-lg text-slate-800 dark:text-white">{key}</span>
                        {key === 'F4' && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                            STANDAR RAPOR SD
                          </span>
                        )}
                        {isSelected && key !== 'F4' && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {spec.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {spec.widthMm} mm × {spec.heightMm} mm
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                        {spec.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilihan Orientasi: Portrait vs Landscape */}
            <div className="space-y-3 pt-2">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                2. Orientasi Halaman Kertas:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaperOrientation('portrait')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                    paperOrientation === 'portrait'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 shadow-sm ring-2 ring-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-16 rounded-lg border-2 border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">Tegak</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                      Potrait (Tegak / Vertikal)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Standar resmi buku rapor akademik, lembar cover, identitas sekolah, dan piagam siswa.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperOrientation('landscape')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                    paperOrientation === 'landscape'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 shadow-sm ring-2 ring-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="w-16 h-12 rounded-lg border-2 border-slate-700 dark:border-slate-300 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">Mendatar</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                      Landscape (Mendatar / Horizontal)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ideal untuk lembar ledger rekap nilai lengkap semua mapel atau buku absen besar.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Pilihan Margin / Batas Tepi Kertas */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                  3. Batas Tepi Kertas (Margin Cetak):
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperMarginPreset('standar')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      paperMarginPreset === 'standar'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Standar Jilid Dinas (Kiri 25mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperMarginPreset('sempit')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      paperMarginPreset === 'sempit'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sempit Hemat Ruang (12mm)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Batas Atas (Top)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={paperMargins.top}
                      onChange={(e) => handleMarginChange('top', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                    <span className="text-xs text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Batas Bawah (Bottom)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={paperMargins.bottom}
                      onChange={(e) => handleMarginChange('bottom', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                    <span className="text-xs text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Batas Kiri (Jilid Rapor)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={paperMargins.left}
                      onChange={(e) => handleMarginChange('left', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs text-indigo-600 dark:text-indigo-400"
                    />
                    <span className="text-xs text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Batas Kanan (Right)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={paperMargins.right}
                      onChange={(e) => handleMarginChange('right', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                    <span className="text-xs text-slate-500 font-mono">mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: PENGATURAN CETAK / PRINT ENGINE */}
      {/* ==================================================================== */}
      {activeTab === 'print' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Printer size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    Pengaturan Cetak &amp; Print Engine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Konfigurasi hemat tinta, header KOP sekolah, garis tabel rapor, serta tombol uji cetak langsung.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={triggerQuickPrint}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Uji Coba Cetak (Print Test)</span>
              </button>
            </div>

            {/* Opsi 1: Mode Warna vs Grayscale (Eco-Print) */}
            <div className="space-y-3">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                1. Mode Warna Cetak (Ink Saver / Eco-Print):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPrintColorMode('color')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    printColorMode === 'color'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-sm ring-2 ring-amber-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                      Berwarna Penuh (Full Color)
                    </span>
                    {printColorMode === 'color' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Logo Pemkab Pegunungan Bintang dan Tut Wuri Handayani dicetak berwarna asli standar resmi.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintColorMode('grayscale')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    printColorMode === 'grayscale'
                      ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 shadow-sm ring-2 ring-slate-300'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                      Hitam Putih (Eco-Print / Grayscale)
                    </span>
                    {printColorMode === 'grayscale' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-900">
                        HEMAT TINTA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mengubah seluruh elemen menjadi monokrom hitam-putih untuk menghemat tinta printer di pedalaman.
                  </p>
                </button>
              </div>
            </div>

            {/* Opsi 2: KOP Rapor & Header */}
            <div className="space-y-3 pt-2">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                2. KOP Surat &amp; Logo Resmi Saat Dicetak:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPrintShowKop(true)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    printShowKop
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">
                    ✓ Tampilkan KOP &amp; Logo Lengkap
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mencetak KOP resmi sekolah dan logo pada bagian atas kertas putih polos standar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintShowKop(false)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    !printShowKop
                      ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 shadow-sm ring-2 ring-amber-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">
                    Sembunyikan KOP (Kertas Ber-KOP Cetak)
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gunakan opsi ini jika sekolah Anda mencetak rapor di atas kertas yang sudah ada cetakan KOP dari dinas.
                  </p>
                </button>
              </div>
            </div>

            {/* Opsi 3: Ketebalan Garis Tabel Rapor */}
            <div className="space-y-3 pt-2">
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                3. Ketebalan Garis Tabel Nilai Rapor:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPrintTableBorder('solid')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    printTableBorder === 'solid'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm ring-2 ring-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">
                    Garis Hitam Tegas Resmi (1px Solid)
                  </div >
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standar buku rapor dinas dengan garis pembatas tabel yang jelas dan tidak mudah luntur.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintTableBorder('subtle')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    printTableBorder === 'subtle'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm ring-2 ring-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">
                    Garis Abu-abu Lembut (Subtle Border)
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Garis tipis modern yang lebih hemat tinta toner cartridge.
                  </p>
                </button>
              </div>
            </div>

            {/* Opsi 4: Nomor Halaman */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">
                  Cetak Nomor Halaman di Kaki Rapor:
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Menampilkan teks &quot;Halaman 1 dari 2&quot; pada bagian footer setiap lembar rapor.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPrintPageNumbers(!printPageNumbers)}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  printPageNumbers
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {printPageNumbers ? 'Aktif' : 'Non-Aktif'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: IDENTITAS SEKOLAH & KOP */}
      {/* ==================================================================== */}
      {activeTab === 'sekolah' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-6 space-y-6 text-xs">
            {/* Data Pokok Pemerintah */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Data Pokok Pemerintah &amp; KOP Surat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Pemerintah Daerah</label>
                  <input
                    type="text"
                    name="namaPemerintah"
                    value={formData.namaPemerintah}
                    onChange={handleChange}
                    placeholder="PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG"
                    className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl font-bold uppercase bg-white dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Instansi / Dinas</label>
                  <input
                    type="text"
                    name="namaInstansi"
                    value={formData.namaInstansi}
                    onChange={handleChange}
                    placeholder="DINAS PENDIDIKAN DAN PENGAJARAN"
                    className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl font-bold uppercase bg-white dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Logo Kiri & Logo Kanan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logoKiriUrl ? (
                      <img src={formData.logoKiriUrl} alt="Logo Kiri" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold text-center leading-tight">Logo Kiri</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Logo Kiri (Pemda / Kabupaten)</span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer">
                      <Upload size={12} /> Upload Logo Kiri
                      <input type="file" accept="image/*" onChange={handleUploadKiri} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logoKananUrl ? (
                      <img src={formData.logoKananUrl} alt="Logo Kanan" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold text-center leading-tight">Logo Kanan</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Logo Kanan (Sekolah / Tut Wuri)</span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer">
                      <Upload size={12} /> Upload Logo Kanan
                      <input type="file" accept="image/*" onChange={handleUploadKanan} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Aplikasi</label>
                <input
                  type="text"
                  name="namaAplikasi"
                  value={formData.namaAplikasi}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  name="namaSekolah"
                  required
                  value={formData.namaSekolah}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tahun Pelajaran</label>
                <select
                  name="tahunPelajaran"
                  value={formData.tahunPelajaran}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-900 dark:text-white"
                >
                  <option value="2026/2027">2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-900 dark:text-white"
                >
                  <option value="Ganjil">1 (Ganjil)</option>
                  <option value="Genap">2 (Genap)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  name="kepalaSekolah"
                  required
                  value={formData.kepalaSekolah}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  name="nipKepalaSekolah"
                  value={formData.nipKepalaSekolah}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl font-mono bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tempat Penerbitan Rapor</label>
                <input
                  type="text"
                  name="tempatRapor"
                  required
                  value={formData.tempatRapor}
                  onChange={handleChange}
                  placeholder="Balil"
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Penerbitan Rapor</label>
                <input
                  type="text"
                  name="tanggalRapor"
                  required
                  value={formData.tanggalRapor}
                  onChange={handleChange}
                  placeholder="19 Desember 2026"
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-end gap-2">
            <SaveStatusIndicator
              status={saveStatus}
              lastSavedText={lastSavedTime}
            />
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save size={15} /> Simpan Pengaturan Sekolah
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
