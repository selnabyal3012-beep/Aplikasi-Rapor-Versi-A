import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Calendar,
  Laptop,
  Power,
  LogIn,
  LogOut,
  UserCheck,
  Award,
  Sparkles,
  BookOpenCheck,
  Wifi,
  WifiOff,
  Download,
  Share2,
  BookOpen,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  Menu,
  Save,
  Zap,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  EyeOff,
  Cloud,
  CloudUpload
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWA } from '../hooks/usePWA';
import { ClassLevel, SemesterType } from '../types';
import { DeveloperModal } from './modals/DeveloperModal';
import { InstallPcModal } from './modals/InstallPcModal';
import { CloseAppModal } from './modals/CloseAppModal';
import { LoginRegisterModal } from './modals/LoginRegisterModal';
import { ShareModal } from './modals/ShareModal';
import { SaveStatusIndicator } from './common/SaveStatusIndicator';

export const Header: React.FC = () => {
  const { isOnline } = usePWA();
  const {
    db,
    selectedKelas,
    setSelectedKelas,
    selectedSemester,
    setSelectedSemester,
    selectedFase,
    setSelectedFase,
    currentUser,
    logout,
    setActiveMenu,
    displayMode,
    setDisplayMode,
    isFullscreen,
    toggleFullscreen,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    syncAllData,
    saveAllData,
    globalSaveStatus,
    lastSavedTime,
    openReportPreview,
    actionToolbarMode,
    setActionToolbarMode,
    firebaseUser,
    cloudSyncStatus,
    syncToCloudFirestore,
    lastCloudSyncTime
  } = useApp();

  const [showDevModal, setShowDevModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const kelasOptions: ClassLevel[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-lg sticky top-0 z-40">
        {/* Top bar with Branding & Developer info */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Drawer Button */}
            <button
              onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
              className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer ${
                displayMode === 'hp' ? 'flex' : 'flex lg:hidden'
              } items-center justify-center shrink-0`}
              title="Buka Menu Navigasi"
            >
              <Menu size={18} />
            </button>

            {/* School Crest / Logo Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-500 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="text-amber-400" size={22} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-wide text-white flex items-center gap-1.5">
                  <span>{db.sekolah.namaSekolah}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    TP {db.sekolah.tahunPelajaran}
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Aplikasi Rapor Kurikulum Merdeka • Distrik Oksibil, Kab. Pegunungan Bintang, Papua Pegunungan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* PENGATURAN TAMPILAN: PC, HP, FULL */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-xs">
              <button
                onClick={() => setDisplayMode('pc')}
                title="Tampilan Mode PC (Desktop): Tampilan standar monitor & laptop guru"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'pc'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Monitor size={13} />
                <span>PC</span>
              </button>

              <button
                onClick={() => setDisplayMode('hp')}
                title="Tampilan Mode HP (Smartphone): Tampilan ramah ponsel, drawer mobile & navigasi sentuh"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'hp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Smartphone size={13} />
                <span>HP</span>
              </button>

              <button
                onClick={() => setDisplayMode('full')}
                title="Tampilan Mode FULL (Layar Penuh): Ruang kerja maksimal tanpa batas tepi untuk tabel nilai"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'full'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Maximize2 size={13} />
                <span>FULL</span>
              </button>

              {/* Fullscreen API Toggle Button */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Keluar dari Layar Penuh Browser' : 'Aktifkan Layar Penuh Browser'}
                className="ml-0.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>

            {/* PENGATURAN BILAH TOMBOL AKSI: PENUH / RAMPING / SEMBUNYI */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-xs" title="Atur tampilan tombol aksi pada semua tabel data: Penuh, Ramping, atau Sembunyikan">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase hidden xl:inline">Bilah Aksi:</span>
              <button
                onClick={() => setActionToolbarMode('full')}
                title="Tampilkan tombol aksi penuh & lengkap di semua menu data"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  actionToolbarMode === 'full'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <SlidersHorizontal size={12} />
                <span className="hidden sm:inline">Penuh</span>
              </button>

              <button
                onClick={() => setActionToolbarMode('compact')}
                title="Rampingkan tombol aksi (hanya tampilkan tombol penting untuk menghemat ruang)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  actionToolbarMode === 'compact'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Minimize2 size={12} />
                <span className="hidden sm:inline">Ramping</span>
              </button>

              <button
                onClick={() => setActionToolbarMode('hidden')}
                title="Sembunyikan bilah tombol aksi untuk ruang kerja data maksimal (bisa dimunculkan kembali kapan saja)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  actionToolbarMode === 'hidden'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <EyeOff size={12} />
                <span className="hidden sm:inline">Sembunyi</span>
              </button>
            </div>

            {/* Tombol Simpan Semua Data & Status Penyimpanan */}
            <div className="inline-flex items-center gap-1.5">
              <button
                onClick={saveAllData}
                disabled={globalSaveStatus === 'saving'}
                title="Simpan seluruh data ke database lokal (Ctrl+S)"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-emerald-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={12} />
                <span>SIMPAN</span>
              </button>
              <SaveStatusIndicator
                status={globalSaveStatus}
                compact
                lastSavedText={lastSavedTime}
              />
            </div>

            {/* Tombol Cloud Sync Firebase Firestore */}
            <button
              onClick={() => syncToCloudFirestore()}
              disabled={cloudSyncStatus === 'syncing'}
              title={
                cloudSyncStatus === 'syncing'
                  ? 'Menyinkronkan ke Cloud Firebase Firestore...'
                  : lastCloudSyncTime
                  ? `Sinkronkan ke Cloud Firebase Firestore (Terakhir: ${lastCloudSyncTime})`
                  : 'Sinkronkan data ke Cloud Firebase Firestore'
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border active:scale-95 disabled:opacity-60 ${
                cloudSyncStatus === 'synced'
                  ? 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'
              }`}
            >
              <CloudUpload size={12} className={cloudSyncStatus === 'syncing' ? 'animate-bounce' : ''} />
              <span className="hidden sm:inline">
                {cloudSyncStatus === 'syncing' ? 'SYNC...' : 'CLOUD'}
              </span>
            </button>

            {/* Tombol Sinkronkan Hubungan Semua Data */}
            <button
              onClick={() => syncAllData()}
              title="Hubungkan & Sinkronkan Semua Data yang Relevan (Sekolah, Siswa, Nilai, Agama, Rapor, Kepala Sekolah, Wali Kelas)"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-xs cursor-pointer border border-amber-300 active:scale-95"
            >
              <Zap size={12} className="text-slate-950" />
              <span className="hidden sm:inline">SINKRON</span>
            </button>

            {/* Status Jaringan Online / Offline */}
            <button
              onClick={() => setShowInstallModal(true)}
              title={isOnline ? 'Laptop terhubung internet (Online)' : 'Laptop tanpa internet (Mode Offline Siap Digunakan)'}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/90 hover:bg-amber-900 border-amber-500/60 text-amber-300'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <Wifi size={12} className="text-emerald-400" />
                  <span className="hidden md:inline">ONLINE</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <WifiOff size={12} className="text-amber-400" />
                  <span>OFFLINE</span>
                </>
              )}
            </button>

            {/* Developer badge button */}
            <button
              onClick={() => setShowDevModal(true)}
              title="Profil Pengembang: Selpius Nabyal, S.Pd.Gr."
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-medium transition-all shadow-xs cursor-pointer group"
            >
              <Award size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-white hidden xl:inline">Selpius Nabyal</span>
            </button>

            {/* Tombol Instal PC/Laptop yang Ramping */}
            <button
              onClick={() => setShowInstallModal(true)}
              title="Instal aplikasi ke Laptop/Komputer agar bisa digunakan tanpa internet"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:via-indigo-500 hover:to-emerald-500 text-white text-xs font-black shadow-xs transition-all hover:scale-102 cursor-pointer ring-1 ring-blue-400/40"
            >
              <Laptop size={13} className="text-amber-300" />
              <Download size={12} />
              <span className="tracking-wide">INSTAL PC</span>
            </button>

            {/* Tombol Bagikan */}
            <button
              onClick={() => setShowShareModal(true)}
              title="Bagikan tautan aplikasi ke rekan guru atau instal di laptop lain"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition-all hover:scale-102 cursor-pointer ring-1 ring-emerald-400/40"
            >
              <Share2 size={12} />
              <span>BAGIKAN</span>
            </button>

            {/* Tombol Preview Rapor Langsung */}
            <button
              onClick={() => openReportPreview()}
              title="Buka Pratinjau Rapor Lengkap Siswa (Kaver, Sekolah, Siswa, Nilai & TTD)"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white text-xs font-black shadow-xs transition-all hover:scale-102 cursor-pointer ring-1 ring-purple-400/50"
            >
              <Eye size={12} className="text-amber-300" />
              <span>PREVIEW</span>
            </button>

            {/* Tombol Buku Panduan */}
            <button
              onClick={() => setActiveMenu('buku_panduan')}
              title="Buka Buku Panduan Lengkap Aplikasi"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs transition-all hover:scale-102 cursor-pointer ring-1 ring-indigo-400/40"
            >
              <BookOpen size={12} className="text-amber-300" />
              <span className="hidden sm:inline">PANDUAN</span>
            </button>

            {/* Tombol Tutup Aplikasi */}
            <button
              onClick={() => setShowCloseModal(true)}
              title="Tutup Aplikasi Rapor"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-700/50 text-rose-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Power size={12} className="text-rose-400" />
              <span className="hidden lg:inline">Tutup</span>
            </button>
          </div>
        </div>

        {/* Bottom bar: Filter Bar (Kelas, Semester, Fase) & Tombol Masuk/Keluar */}
        <div className="px-4 py-2 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles size={13} className="text-amber-400" />
              Filter Utama:
            </span>

            {/* Filter Kelas */}
            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg">
              <span className="text-slate-400 font-medium">Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value as ClassLevel)}
                className="bg-transparent text-amber-300 font-bold focus:outline-hidden cursor-pointer"
              >
                <optgroup label="── SD / MI (Kelas 1-6) ──" className="bg-slate-900 text-amber-400 font-bold">
                  <option value="I" className="bg-slate-800 text-white">Kelas I (Fase A)</option>
                  <option value="II" className="bg-slate-800 text-white">Kelas II (Fase A)</option>
                  <option value="III" className="bg-slate-800 text-white">Kelas III (Fase B)</option>
                  <option value="IV" className="bg-slate-800 text-white">Kelas IV (Fase B)</option>
                  <option value="V" className="bg-slate-800 text-white">Kelas V (Fase C)</option>
                  <option value="VI" className="bg-slate-800 text-white">Kelas VI (Fase C)</option>
                </optgroup>
                <optgroup label="── SMP / MTs (Kelas 7-9) ──" className="bg-slate-900 text-blue-400 font-bold">
                  <option value="VII" className="bg-slate-800 text-white">Kelas VII (SMP - Fase D)</option>
                  <option value="VIII" className="bg-slate-800 text-white">Kelas VIII (SMP - Fase D)</option>
                  <option value="IX" className="bg-slate-800 text-white">Kelas IX (SMP - Fase D)</option>
                </optgroup>
                <optgroup label="── SMA / MA & SMK (Kelas 10-12/13) ──" className="bg-slate-900 text-emerald-400 font-bold">
                  <option value="X" className="bg-slate-800 text-white">Kelas X (SMA/SMK - Fase E)</option>
                  <option value="XI" className="bg-slate-800 text-white">Kelas XI (SMA/SMK - Fase F)</option>
                  <option value="XII" className="bg-slate-800 text-white">Kelas XII (SMA/SMK - Fase F)</option>
                  <option value="XIII" className="bg-slate-800 text-white">Kelas XIII (SMK 4 Tahun - Fase F)</option>
                </optgroup>
              </select>
            </div>

            {/* Filter Semester */}
            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-slate-400 font-medium">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as SemesterType)}
                className="bg-transparent text-emerald-300 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="Ganjil" className="bg-slate-800 text-white">Semester 1 (Ganjil)</option>
                <option value="Genap" className="bg-slate-800 text-white">Semester 2 (Genap)</option>
              </select>
            </div>

            {/* Fase selector */}
            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg">
              <Layers size={13} className="text-cyan-400" />
              <span className="text-slate-400 font-medium">Fase:</span>
              <select
                value={selectedFase}
                onChange={(e) => setSelectedFase(e.target.value as any)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-hidden cursor-pointer"
                title="Pilih Fase Kurikulum Merdeka"
              >
                <option value="A" className="bg-slate-800 text-white">Fase A (SD Kelas I-II)</option>
                <option value="B" className="bg-slate-800 text-white">Fase B (SD Kelas III-IV)</option>
                <option value="C" className="bg-slate-800 text-white">Fase C (SD Kelas V-VI)</option>
                <option value="D" className="bg-slate-800 text-white">Fase D (SMP Kelas VII-IX)</option>
                <option value="E" className="bg-slate-800 text-white">Fase E (SMA/SMK Kelas X)</option>
                <option value="F" className="bg-slate-800 text-white">Fase F (SMA/SMK Kelas XI-XII/XIII)</option>
              </select>
            </div>
          </div>

          {/* User Status & Login/Logout buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold text-white">
                  {currentUser.namaLengkap.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <span className="text-[11px] font-semibold text-slate-200 block leading-tight">
                    {currentUser.namaLengkap}
                  </span>
                  <span className="text-[9px] text-emerald-400 block leading-tight">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Keluar dari akun"
                  className="ml-1 p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded transition-colors"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                <LogIn size={13} />
                <span>Tombol Masuk</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <DeveloperModal isOpen={showDevModal} onClose={() => setShowDevModal(false)} />
      <InstallPcModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
      <CloseAppModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} />
      <LoginRegisterModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
