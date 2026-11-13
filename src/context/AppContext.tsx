import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DatabaseState,
  SchoolIdentity,
  Teacher,
  Student,
  ClassData,
  Subject,
  LearningObjective,
  AcademicScore,
  Extracurricular,
  Attendance,
  TeacherNote,
  P5Project,
  P5Stage,
  P5DimensionItem,
  P5Score,
  UserAccount,
  ClassLevel,
  SemesterType,
  FaseType,
  PiagamAward,
  StudentDecision,
  ActionToolbarMode,
  ThemeAccent,
  ThemeMode,
  UiFontSize,
  UiFontFamily,
  PaperSize,
  PaperOrientation,
  PaperMarginPreset,
  PrintColorMode,
  PrintTableBorder,
  PrintMargins
} from '../types';
import { INITIAL_DATABASE } from '../data/defaultData';
import { generateReportDescriptionFromTP } from '../utils/tpDescriptionHelper';
import {
  syncStudentRelations,
  syncBatchStudentsRelations,
  cleanupDeletedStudentRelations,
  syncAllStudents
} from '../utils/studentSyncHelper';
import {
  auth,
  testFirestoreConnection,
  signInWithGoogle,
  signOutFirebase
} from '../services/firebase';
import {
  saveStateToFirestore,
  loadStateFromFirestore,
  listCloudBackups
} from '../services/cloudSyncService';

const STORAGE_KEY = 'sdn_balil_rapor_db_2026';
const CURRENT_USER_KEY = 'sdn_balil_rapor_user';

export type MenuKey =
  | 'dashboard'
  | 'identitas_sekolah'
  | 'data_guru'
  | 'data_siswa'
  | 'data_kelas'
  | 'mata_pelajaran'
  | 'kkm_pelajaran'
  | 'tujuan_pembelajaran'
  | 'input_nilai'
  | 'rekap_nilai'
  | 'deskripsi_rapor'
  | 'ekstrakurikuler'
  | 'kehadiran'
  | 'catatan_wali'
  | 'rapor_pts'
  | 'rapor_akademik'
  | 'rapor_semester_1'
  | 'rapor_semester_2'
  | 'p5_projek'
  | 'p5_tahapan'
  | 'p5_dimensi'
  | 'p5_nilai'
  | 'rapor_p5'
  | 'rekap_rapor'
  | 'piagam'
  | 'template_data'
  | 'cetak_rapor_semester_1'
  | 'cetak_rapor_semester_2'
  | 'cetak_rapor'
  | 'pengaturan'
  | 'backup_restore'
  | 'buku_panduan';

export type DisplayMode = 'pc' | 'hp' | 'full';

interface AppContextType {
  db: DatabaseState;
  activeMenu: MenuKey;
  setActiveMenu: (menu: MenuKey) => void;
  selectedKelas: ClassLevel;
  setSelectedKelas: (kelas: ClassLevel) => void;
  selectedSemester: SemesterType;
  setSelectedSemester: (sem: SemesterType) => void;
  selectedFase: FaseType;
  setSelectedFase: (fase: FaseType) => void;
  currentUser: UserAccount | null;
  login: (username: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  registerUser: (newUser: UserAccount) => { success: boolean; message: string };
  // Display & Device Mode (PC, HP, Full)
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  simulatePhonePreview: boolean;
  setSimulatePhonePreview: React.Dispatch<React.SetStateAction<boolean>>;
  // CRUD actions
  updateSekolah: (data: Partial<SchoolIdentity>) => void;
  saveGuru: (guru: Teacher) => void;
  saveGuruBatch: (guruList: Teacher[]) => void;
  deleteGuru: (idGuru: string) => void;
  saveSiswa: (siswa: Student, oldNisn?: string) => void;
  saveSiswaBatch: (siswaList: Student[]) => void;
  syncAllStudentConnections: () => void;
  deleteSiswa: (idSiswa: string) => void;
  saveKelas: (kelas: ClassData) => void;
  bulkSaveKelas: (kelasList: ClassData[]) => void;
  deleteKelas: (idKelas: string) => void;
  saveMataPelajaran: (mapel: Subject) => void;
  bulkSaveMataPelajaran: (mapels: Subject[]) => void;
  deleteMataPelajaran: (kode: string) => void;
  saveTP: (tp: LearningObjective) => void;
  bulkSaveTujuanPembelajaran: (tpList: LearningObjective[]) => void;
  deleteTP: (id: string) => void;
  saveNilaiAkademik: (nilai: AcademicScore) => void;
  bulkSaveNilai: (nilais: AcademicScore[]) => void;
  saveEkskul: (ekskul: Extracurricular) => void;
  bulkSaveEkskul: (ekskulList: Extracurricular[]) => void;
  deleteEkskul: (id: string) => void;
  saveKehadiran: (kehadiran: Attendance) => void;
  bulkSaveKehadiran: (kehadiranList: Attendance[]) => void;
  saveCatatanWali: (catatan: TeacherNote) => void;
  bulkSaveCatatanWali: (catatanList: TeacherNote[]) => void;
  saveP5Projek: (projek: P5Project) => void;
  bulkSaveP5Projek: (projekList: P5Project[]) => void;
  deleteP5Projek: (id: string) => void;
  saveP5Tahapan: (tahap: P5Stage) => void;
  bulkSaveP5Tahapan: (tahapList: P5Stage[]) => void;
  deleteP5Tahapan: (id: string) => void;
  saveP5Dimensi: (dim: P5DimensionItem) => void;
  bulkSaveP5Dimensi: (dimensiList: P5DimensionItem[]) => void;
  deleteP5Dimensi: (id: string) => void;
  saveP5Nilai: (score: P5Score) => void;
  bulkSaveP5Nilai: (scores: P5Score[]) => void;
  // Backup & Restore
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonContent: string) => { success: boolean; message: string };
  resetDatabase: () => void;
  // Print preview selection & Modal
  printTargetStudentId: string | null;
  setPrintTargetStudentId: (id: string | null) => void;
  printMode: 'kaver' | 'identitas' | 'akademik' | 'pts' | 'p5' | 'keduanya';
  setPrintMode: (mode: 'kaver' | 'identitas' | 'akademik' | 'pts' | 'p5' | 'keduanya') => void;
  isReportPreviewModalOpen: boolean;
  setIsReportPreviewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openReportPreview: (studentId?: string) => void;
  // Print Typography (Bentuk Huruf & Ukuran Huruf Cetak Rapor)
  printFontFamily: string;
  setPrintFontFamily: (font: string) => void;
  printFontSize: string;
  setPrintFontSize: (size: string) => void;
  savePiagam: (piagam: PiagamAward) => void;
  bulkSavePiagam: (piagamList: PiagamAward[]) => void;
  deletePiagam: (idPiagam: string) => void;
  saveKeputusanSiswa: (decision: StudentDecision) => void;
  bulkSaveKeputusanSiswa: (decisions: StudentDecision[]) => void;
  // Filter Mata Pelajaran untuk Cetak Rapor (Sesuai Keadaan Sekolah)
  selectedMapelForPrint: string[];
  setSelectedMapelForPrint: React.Dispatch<React.SetStateAction<string[]>>;
  toggleMapelForPrint: (mapelName: string) => void;
  setMapelPrintPreset: (preset: 'semua' | 'wajib_saja' | 'wajib_pilihan' | 'wajib_mulok') => void;
  isMapelActiveForPrint: (mapelName: string) => boolean;
  printableMataPelajaran: Subject[];
  // Selected TP Mapel
  selectedTpMapel: string;
  setSelectedTpMapel: (mapel: string) => void;
  // Link / Sync TP Descriptions to all report cards
  syncAllScoresWithTPDescriptions: (forcedSemester?: SemesterType) => number;
  // Global Save & Full System Sync
  saveAllData: () => void;
  syncAllData: () => void;
  globalSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedTime?: string;
  triggerGlobalSave: (action?: () => void | Promise<void>) => Promise<void>;
  // Save Notification Message
  saveNotificationMessage: string | null;
  showSaveNotification: (message?: string) => void;
  clearSaveNotification: () => void;
  // History & Refresh
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  refreshData: () => void;
  // Pengaturan Tampilan Tombol Aksi di Semua Menu Data
  actionToolbarMode: ActionToolbarMode;
  setActionToolbarMode: (mode: ActionToolbarMode) => void;
  toggleActionToolbar: () => void;
  // Firebase Auth & Cloud Firestore Integration
  firebaseUser: any;
  loginWithGoogle: () => Promise<void>;
  logoutFirebase: () => Promise<void>;
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastCloudSyncTime?: string;
  syncToCloudFirestore: () => Promise<void>;
  loadFromCloudFirestore: () => Promise<void>;
  // Pengaturan Ukuran Huruf & Size Huruf (UI & Cetak)
  uiFontSize: UiFontSize;
  setUiFontSize: (size: UiFontSize) => void;
  uiFontScalePercent: number;
  setUiFontScalePercent: (percent: number) => void;
  uiFontFamily: UiFontFamily;
  setUiFontFamily: (family: UiFontFamily) => void;
  // Pengaturan Kertas Rapor (Paper Size, Orientation, Margin)
  paperSize: PaperSize;
  setPaperSize: (size: PaperSize) => void;
  paperOrientation: PaperOrientation;
  setPaperOrientation: (orientation: PaperOrientation) => void;
  paperMarginPreset: PaperMarginPreset;
  setPaperMarginPreset: (preset: PaperMarginPreset) => void;
  paperMargins: PrintMargins;
  setPaperMargins: (margins: PrintMargins) => void;
  // Pengaturan Print & Cetak Rapor
  printColorMode: PrintColorMode;
  setPrintColorMode: (mode: PrintColorMode) => void;
  printShowKop: boolean;
  setPrintShowKop: (show: boolean) => void;
  printTableBorder: PrintTableBorder;
  setPrintTableBorder: (border: PrintTableBorder) => void;
  printPageNumbers: boolean;
  setPrintPageNumbers: (show: boolean) => void;
  triggerQuickPrint: () => void;
  // Pengaturan Tema Aplikasi
  themeAccent: ThemeAccent;
  setThemeAccent: (accent: ThemeAccent) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function getFaseFromKelas(kelas: ClassLevel | string): FaseType {
  if (kelas === 'I' || kelas === 'II') return 'A';
  if (kelas === 'III' || kelas === 'IV') return 'B';
  if (kelas === 'V' || kelas === 'VI') return 'C';
  if (kelas === 'VII' || kelas === 'VIII' || kelas === 'IX') return 'D';
  if (kelas === 'X') return 'E';
  if (kelas === 'XI' || kelas === 'XII' || kelas === 'XIII') return 'F';
  return 'B';
}

export const THEME_ACCENT_MAP: Record<ThemeAccent, { name: string; primary: string; hover: string; ring: string; lightBg: string; text: string }> = {
  emerald: { name: 'Hijau Papua (Emerald)', primary: '#059669', hover: '#047857', ring: '#a7f3d0', lightBg: '#ecfdf5', text: '#065f46' },
  blue: { name: 'Biru Bahari (Sky Blue)', primary: '#2563eb', hover: '#1d4ed8', ring: '#bfdbfe', lightBg: '#eff6ff', text: '#1e40af' },
  indigo: { name: 'Royal Indigo (Resmi)', primary: '#4f46e5', hover: '#4338ca', ring: '#c7d2fe', lightBg: '#eef2ff', text: '#3730a3' },
  slate: { name: 'Slate Modern (Elegan)', primary: '#475569', hover: '#334155', ring: '#cbd5e1', lightBg: '#f8fafc', text: '#1e293b' },
  violet: { name: 'Ungu Lembayung (Violet)', primary: '#7c3aed', hover: '#6d28d9', ring: '#ddd6fe', lightBg: '#f5f3ff', text: '#5b21b6' },
  amber: { name: 'Kuning Marigold (Hangat)', primary: '#d97706', hover: '#b45309', ring: '#fde68a', lightBg: '#fffbeb', text: '#92400e' },
  rose: { name: 'Merah Delima (Tegas)', primary: '#e11d48', hover: '#be123c', ring: '#fecdd3', lightBg: '#fff1f2', text: '#9f1239' },
};

export const PAPER_SIZE_MAP: Record<PaperSize, { name: string; widthMm: number; heightMm: number; description: string }> = {
  F4: { name: 'F4 / Folio (Buku Rapor)', widthMm: 215, heightMm: 330, description: 'Standar utama dinas pendidikan & buku rapor Indonesia (215 x 330 mm)' },
  A4: { name: 'A4 (Standar Internasional)', widthMm: 210, heightMm: 297, description: 'Standar dokumen umum kertas HVS A4 (210 x 297 mm)' },
  Legal: { name: 'Legal (Panjang)', widthMm: 215.9, heightMm: 355.6, description: 'Kertas panjang untuk lembar ledger & tabel banyak (216 x 356 mm)' },
  Letter: { name: 'Letter / Kuarto', widthMm: 215.9, heightMm: 279.4, description: 'Kertas lebar standar percetakan (216 x 279 mm)' },
};

export const MARGIN_PRESETS: Record<PaperMarginPreset, PrintMargins> = {
  standar: { top: 20, bottom: 20, left: 25, right: 20 },
  sempit: { top: 12, bottom: 12, left: 15, right: 12 },
  kustom: { top: 20, bottom: 20, left: 25, right: 20 },
};

export const UI_FONT_SCALE_MAP: Record<UiFontSize, { scale: string; label: string; percent: number }> = {
  small: { scale: '90%', label: 'Kecil Ringkas (90%)', percent: 90 },
  normal: { scale: '100%', label: 'Standar Normal (100%)', percent: 100 },
  large: { scale: '110%', label: 'Besar Jelas (110%)', percent: 110 },
  xlarge: { scale: '120%', label: 'Ekstra Besar (120%)', percent: 120 },
};

export const UI_FONT_FAMILY_MAP: Record<UiFontFamily, { name: string; css: string; description: string }> = {
  'plus-jakarta': { name: 'Plus Jakarta Sans', css: '"Plus Jakarta Sans", system-ui, sans-serif', description: 'Modern, proporsional dan sangat mudah dibaca' },
  'outfit': { name: 'Outfit Sans', css: '"Outfit", system-ui, sans-serif', description: 'Bersih, ramah untuk tampilan aplikasi pendidikan' },
  'dm-sans': { name: 'DM Sans', css: '"DM Sans", system-ui, sans-serif', description: 'Elegan seimbang untuk angka dan tabel nilai' },
  'system': { name: 'System Default UI', css: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', description: 'Font bawaan sistem operasi PC/Laptop' },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure classes include SMP, SMA, SMK if existing data doesn't have them
        if (parsed.kelas && parsed.kelas.length < INITIAL_DATABASE.kelas.length) {
          const existingClassNames = new Set(parsed.kelas.map((k: any) => k.namaKelas));
          const missingClasses = INITIAL_DATABASE.kelas.filter((k) => !existingClassNames.has(k.namaKelas));
          if (missingClasses.length > 0) {
            parsed.kelas = [...parsed.kelas, ...missingClasses];
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load database from localStorage', e);
    }
    return INITIAL_DATABASE;
  });

  const [activeMenu, setActiveMenuState] = useState<MenuKey>('dashboard');
  const [selectedKelas, setSelectedKelasState] = useState<ClassLevel>('IV');
  const [selectedSemester, setSelectedSemester] = useState<SemesterType>('Ganjil');
  const [selectedFase, setSelectedFase] = useState<FaseType>('B');
  const [selectedTpMapel, setSelectedTpMapel] = useState<string>('SEMUA');

  const setActiveMenu = (menu: MenuKey) => {
    if (menu === 'rapor_semester_1' || menu === 'cetak_rapor_semester_1') {
      setSelectedSemester('Ganjil');
    } else if (menu === 'rapor_semester_2' || menu === 'cetak_rapor_semester_2') {
      setSelectedSemester('Genap');
    }
    setActiveMenuState(menu);
  };

  // Display & Device Mode (PC, HP, Full)
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_display_mode');
      if (saved === 'pc' || saved === 'hp' || saved === 'full') return saved;
    } catch {}
    return 'pc';
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [simulatePhonePreview, setSimulatePhonePreview] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const setDisplayMode = (mode: DisplayMode) => {
    setDisplayModeState(mode);
    try {
      localStorage.setItem('sdn_balil_display_mode', mode);
    } catch {}

    if (mode === 'full') {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsSidebarCollapsed(true);
      showSaveNotification('Mode Layar Penuh (FULL) Aktif: Area kerja dan tabel nilai melebar maksimal!');
    } else if (mode === 'hp') {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsSidebarCollapsed(false);
      showSaveNotification('Mode Tampilan HP (Smartphone) Aktif: Ramah layar sentuh dan drawer navigasi mobile!');
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsSidebarCollapsed(false);
      showSaveNotification('Mode Tampilan PC / Desktop Aktif: Tampilan standar monitor & laptop guru.');
    }
  };

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) return JSON.parse(savedUser);
    } catch {}
    // Default logged in user as SelNab for instant seamless use
    return INITIAL_DATABASE.users[0];
  });

  const [printTargetStudentId, setPrintTargetStudentId] = useState<string | null>('S001');
  const [printMode, setPrintMode] = useState<'kaver' | 'identitas' | 'akademik' | 'pts' | 'p5' | 'keduanya'>('keduanya');
  const [isReportPreviewModalOpen, setIsReportPreviewModalOpen] = useState(false);
  const openReportPreview = (studentId?: string) => {
    if (studentId) {
      setPrintTargetStudentId(studentId);
    }
    setIsReportPreviewModalOpen(true);
  };

  // Pengaturan Bentuk Huruf & Ukuran Huruf Cetak Rapor
  const [printFontFamily, setPrintFontFamilyState] = useState<string>(() => {
    try {
      return localStorage.getItem('sdn_balil_print_font_family') || 'Times New Roman';
    } catch {
      return 'Times New Roman';
    }
  });

  const [printFontSize, setPrintFontSizeState] = useState<string>(() => {
    try {
      return localStorage.getItem('sdn_balil_print_font_size') || '11pt';
    } catch {
      return '11pt';
    }
  });

  const setPrintFontFamily = (font: string) => {
    setPrintFontFamilyState(font);
    try {
      localStorage.setItem('sdn_balil_print_font_family', font);
    } catch {}
    document.documentElement.style.setProperty('--report-font-family', `"${font}", Times, serif, sans-serif`);
  };

  const setPrintFontSize = (size: string) => {
    setPrintFontSizeState(size);
    try {
      localStorage.setItem('sdn_balil_print_font_size', size);
    } catch {}
    document.documentElement.style.setProperty('--report-font-size', size);
  };

  // Sinkronkan CSS variables setiap kali font/size berubah
  useEffect(() => {
    document.documentElement.style.setProperty('--report-font-family', `"${printFontFamily}", Times, serif, sans-serif`);
    document.documentElement.style.setProperty('--report-font-size', printFontSize);
  }, [printFontFamily, printFontSize]);

  // Mode Tampilan Tombol Aksi (Penuh, Ramping, Sembunyi) - Default Ramping (Compact)
  const [actionToolbarMode, setActionToolbarModeState] = useState<ActionToolbarMode>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_action_toolbar_mode');
      if (saved === 'compact' || saved === 'hidden' || saved === 'full') {
        return saved;
      }
    } catch {}
    return 'compact';
  });

  const setActionToolbarMode = (mode: ActionToolbarMode) => {
    setActionToolbarModeState(mode);
    try {
      localStorage.setItem('sdn_balil_action_toolbar_mode', mode);
    } catch {}
    if (mode === 'hidden') {
      showSaveNotification('Tombol Aksi disembunyikan. Klik tombol "Tampilkan Aksi" untuk membukanya kembali.');
    } else if (mode === 'compact') {
      showSaveNotification('Tombol Aksi dirampingkan (hanya tombol utama). Klik "Aksi Lainnya" untuk membuka lengkap.');
    } else {
      showSaveNotification('Tombol Aksi ditampilkan penuh & lengkap.');
    }
  };

  const toggleActionToolbar = () => {
    if (actionToolbarMode === 'full') {
      setActionToolbarMode('compact');
    } else if (actionToolbarMode === 'compact') {
      setActionToolbarMode('hidden');
    } else {
      setActionToolbarMode('full');
    }
  };

  // ============================================================
  // PENGATURAN TEMA, UKURAN HURUF, KERTAS, & PRINT
  // ============================================================
  // 1. Tema Aplikasi
  const [themeAccent, setThemeAccentState] = useState<ThemeAccent>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_theme_accent');
      if (saved && ['emerald', 'blue', 'indigo', 'slate', 'violet', 'amber', 'rose'].includes(saved)) {
        return saved as ThemeAccent;
      }
    } catch {}
    return 'emerald';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_theme_mode');
      if (saved && ['light', 'dark', 'auto'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch {}
    return 'light';
  });

  // 2. Ukuran Huruf & Size Huruf UI Aplikasi
  const [uiFontSize, setUiFontSizeState] = useState<UiFontSize>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_ui_font_size');
      if (saved && ['small', 'normal', 'large', 'xlarge'].includes(saved)) {
        return saved as UiFontSize;
      }
    } catch {}
    return 'normal';
  });

  const [uiFontScalePercent, setUiFontScalePercentState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_ui_font_scale_percent');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 80 && val <= 140) return val;
      }
    } catch {}
    return 100;
  });

  const [uiFontFamily, setUiFontFamilyState] = useState<UiFontFamily>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_ui_font_family');
      if (saved && ['system', 'plus-jakarta', 'outfit', 'dm-sans'].includes(saved)) {
        return saved as UiFontFamily;
      }
    } catch {}
    return 'plus-jakarta';
  });

  // 3. Pengaturan Kertas
  const [paperSize, setPaperSizeState] = useState<PaperSize>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_paper_size');
      if (saved && ['F4', 'A4', 'Legal', 'Letter'].includes(saved)) {
        return saved as PaperSize;
      }
    } catch {}
    return 'F4';
  });

  const [paperOrientation, setPaperOrientationState] = useState<PaperOrientation>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_paper_orientation');
      if (saved && ['portrait', 'landscape'].includes(saved)) {
        return saved as PaperOrientation;
      }
    } catch {}
    return 'portrait';
  });

  const [paperMarginPreset, setPaperMarginPresetState] = useState<PaperMarginPreset>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_paper_margin_preset');
      if (saved && ['standar', 'sempit', 'kustom'].includes(saved)) {
        return saved as PaperMarginPreset;
      }
    } catch {}
    return 'standar';
  });

  const [paperMargins, setPaperMarginsState] = useState<PrintMargins>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_paper_margins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.top && parsed.bottom && parsed.left && parsed.right) {
          return parsed;
        }
      }
    } catch {}
    return { top: 20, bottom: 20, left: 25, right: 20 };
  });

  // 4. Pengaturan Print
  const [printColorMode, setPrintColorModeState] = useState<PrintColorMode>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_print_color_mode');
      if (saved && ['color', 'grayscale'].includes(saved)) {
        return saved as PrintColorMode;
      }
    } catch {}
    return 'color';
  });

  const [printShowKop, setPrintShowKopState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_print_show_kop');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [printTableBorder, setPrintTableBorderState] = useState<PrintTableBorder>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_print_table_border');
      if (saved && ['solid', 'subtle'].includes(saved)) {
        return saved as PrintTableBorder;
      }
    } catch {}
    return 'solid';
  });

  const [printPageNumbers, setPrintPageNumbersState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sdn_balil_print_page_numbers');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  // Sinkronisasi Style ke DOM / CSS Variables
  useEffect(() => {
    // Theme Accent
    const accentData = THEME_ACCENT_MAP[themeAccent] || THEME_ACCENT_MAP.emerald;
    document.documentElement.style.setProperty('--theme-accent', accentData.primary);
    document.documentElement.style.setProperty('--theme-accent-hover', accentData.hover);
    document.documentElement.setAttribute('data-theme', themeAccent);

    // Theme Mode (Light / Dark / Auto)
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themeMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // UI Font Scale
    document.documentElement.style.setProperty('--app-ui-font-scale', `${uiFontScalePercent}%`);

    // UI Font Family
    const fontDef = UI_FONT_FAMILY_MAP[uiFontFamily] || UI_FONT_FAMILY_MAP['plus-jakarta'];
    document.documentElement.style.setProperty('--app-ui-font-family', fontDef.css);

    // Paper Size & Orientation
    const paperSpec = PAPER_SIZE_MAP[paperSize] || PAPER_SIZE_MAP.F4;
    const finalPaperSize = paperOrientation === 'landscape'
      ? `${paperSpec.heightMm}mm ${paperSpec.widthMm}mm`
      : `${paperSpec.widthMm}mm ${paperSpec.heightMm}mm`;
    document.documentElement.style.setProperty('--print-page-size', finalPaperSize);

    // Paper Margins
    document.documentElement.style.setProperty('--print-margin-top', `${paperMargins.top}mm`);
    document.documentElement.style.setProperty('--print-margin-bottom', `${paperMargins.bottom}mm`);
    document.documentElement.style.setProperty('--print-margin-left', `${paperMargins.left}mm`);
    document.documentElement.style.setProperty('--print-margin-right', `${paperMargins.right}mm`);

    // Print Grayscale
    if (printColorMode === 'grayscale') {
      document.body.classList.add('print-grayscale');
    } else {
      document.body.classList.remove('print-grayscale');
    }

    // Print KOP
    if (!printShowKop) {
      document.body.classList.add('print-hide-kop');
    } else {
      document.body.classList.remove('print-hide-kop');
    }

    // Print Border
    if (printTableBorder === 'solid') {
      document.body.classList.add('print-border-solid');
    } else {
      document.body.classList.remove('print-border-solid');
    }
  }, [
    themeAccent,
    themeMode,
    uiFontScalePercent,
    uiFontFamily,
    paperSize,
    paperOrientation,
    paperMargins,
    printColorMode,
    printShowKop,
    printTableBorder
  ]);

  const setThemeAccent = (accent: ThemeAccent) => {
    setThemeAccentState(accent);
    try { localStorage.setItem('sdn_balil_theme_accent', accent); } catch {}
    showSaveNotification(`Warna tema aplikasi diatur ke: ${THEME_ACCENT_MAP[accent]?.name || accent}`);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try { localStorage.setItem('sdn_balil_theme_mode', mode); } catch {}
    showSaveNotification(`Mode tampilan aplikasi: ${mode === 'dark' ? 'Mode Gelap (Dark Mode)' : mode === 'light' ? 'Mode Terang (Light Mode)' : 'Otomatis Sesuai Sistem'}`);
  };

  const setUiFontSize = (size: UiFontSize) => {
    setUiFontSizeState(size);
    const p = UI_FONT_SCALE_MAP[size]?.percent || 100;
    setUiFontScalePercentState(p);
    try {
      localStorage.setItem('sdn_balil_ui_font_size', size);
      localStorage.setItem('sdn_balil_ui_font_scale_percent', String(p));
    } catch {}
    showSaveNotification(`Ukuran huruf aplikasi diatur ke: ${UI_FONT_SCALE_MAP[size]?.label || size}`);
  };

  const setUiFontScalePercent = (percent: number) => {
    const clamped = Math.max(80, Math.min(140, percent));
    setUiFontScalePercentState(clamped);
    try { localStorage.setItem('sdn_balil_ui_font_scale_percent', String(clamped)); } catch {}
  };

  const setUiFontFamily = (family: UiFontFamily) => {
    setUiFontFamilyState(family);
    try { localStorage.setItem('sdn_balil_ui_font_family', family); } catch {}
    showSaveNotification(`Jenis huruf aplikasi diatur ke: ${UI_FONT_FAMILY_MAP[family]?.name || family}`);
  };

  const setPaperSize = (size: PaperSize) => {
    setPaperSizeState(size);
    try { localStorage.setItem('sdn_balil_paper_size', size); } catch {}
    showSaveNotification(`Ukuran kertas cetak diatur ke: ${size} (${PAPER_SIZE_MAP[size]?.name})`);
  };

  const setPaperOrientation = (orientation: PaperOrientation) => {
    setPaperOrientationState(orientation);
    try { localStorage.setItem('sdn_balil_paper_orientation', orientation); } catch {}
    showSaveNotification(`Orientasi kertas diatur ke: ${orientation === 'portrait' ? 'Potrait (Tegak)' : 'Landscape (Mendatar)'}`);
  };

  const setPaperMarginPreset = (preset: PaperMarginPreset) => {
    setPaperMarginPresetState(preset);
    if (preset !== 'kustom') {
      const m = MARGIN_PRESETS[preset];
      setPaperMarginsState(m);
      try { localStorage.setItem('sdn_balil_paper_margins', JSON.stringify(m)); } catch {}
    }
    try { localStorage.setItem('sdn_balil_paper_margin_preset', preset); } catch {}
    showSaveNotification(`Batas tepi cetak (margin) diatur ke: ${preset}`);
  };

  const setPaperMargins = (margins: PrintMargins) => {
    setPaperMarginsState(margins);
    setPaperMarginPresetState('kustom');
    try {
      localStorage.setItem('sdn_balil_paper_margins', JSON.stringify(margins));
      localStorage.setItem('sdn_balil_paper_margin_preset', 'kustom');
    } catch {}
  };

  const setPrintColorMode = (mode: PrintColorMode) => {
    setPrintColorModeState(mode);
    try { localStorage.setItem('sdn_balil_print_color_mode', mode); } catch {}
    showSaveNotification(`Mode cetak printer diatur ke: ${mode === 'grayscale' ? 'Hitam Putih (Hemat Tinta / Eco-Print)' : 'Berwarna Penuh'}`);
  };

  const setPrintShowKop = (show: boolean) => {
    setPrintShowKopState(show);
    try { localStorage.setItem('sdn_balil_print_show_kop', String(show)); } catch {}
    showSaveNotification(show ? 'KOP & Logo resmi sekolah ditampilkan saat cetak' : 'KOP & Logo disembunyikan saat cetak (untuk kertas berkop cetak)');
  };

  const setPrintTableBorder = (border: PrintTableBorder) => {
    setPrintTableBorderState(border);
    try { localStorage.setItem('sdn_balil_print_table_border', border); } catch {}
    showSaveNotification(`Garis tabel rapor diatur ke: ${border === 'solid' ? 'Hitam Tegas Resmi' : 'Abu-abu Lembut'}`);
  };

  const setPrintPageNumbers = (show: boolean) => {
    setPrintPageNumbersState(show);
    try { localStorage.setItem('sdn_balil_print_page_numbers', String(show)); } catch {}
  };

  const triggerQuickPrint = () => {
    window.print();
  };

  // Firebase User & Cloud Firestore Sync States
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | undefined>(undefined);

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Firebase init check note:', err);
    });

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (user) {
        // Also associate current user if not already set
        setCurrentUser((curr) => {
          if (!curr) {
            return {
              username: user.email?.split('@')[0] || 'User',
              password: '',
              namaLengkap: user.displayName || user.email || 'Guru Balil',
              role: 'Wali Kelas',
              nip: '-',
              createdAt: new Date().toISOString().slice(0, 10)
            };
          }
          return curr;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const u = await signInWithGoogle();
      setFirebaseUser(u);
      showSaveNotification(`Berhasil masuk via Google Firebase: ${u.displayName || u.email}!`);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      showSaveNotification('Gagal masuk dengan akun Google.');
      throw err;
    }
  };

  const logoutFirebase = async () => {
    try {
      await signOutFirebase();
      setFirebaseUser(null);
      showSaveNotification('Berhasil keluar dari sesi Firebase.');
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  const syncToCloudFirestore = async () => {
    if (!auth.currentUser && !firebaseUser) {
      showSaveNotification('Hubungkan Akun Google Firebase terlebih dahulu (via menu Masuk atau Backup & Restore) sebelum sinkronisasi Cloud.');
      return;
    }
    setCloudSyncStatus('syncing');
    try {
      const res = await saveStateToFirestore(db, firebaseUser?.email || auth.currentUser?.email || currentUser?.namaLengkap);
      setCloudSyncStatus('synced');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastCloudSyncTime(timeStr);
      showSaveNotification(res.message);
      setTimeout(() => setCloudSyncStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Cloud sync failed:', err);
      setCloudSyncStatus('error');
      showSaveNotification('Gagal menyinkronkan data ke Cloud Firebase Firestore.');
      setTimeout(() => setCloudSyncStatus('idle'), 4000);
    }
  };

  const loadFromCloudFirestore = async () => {
    if (!auth.currentUser && !firebaseUser) {
      showSaveNotification('Hubungkan Akun Google Firebase terlebih dahulu sebelum memulihkan data dari Cloud.');
      return;
    }
    setCloudSyncStatus('syncing');
    try {
      const res = await loadStateFromFirestore();
      if (res.success && res.data) {
        setDb(res.data);
        setCloudSyncStatus('synced');
        showSaveNotification(res.message);
      } else {
        setCloudSyncStatus('idle');
        showSaveNotification(res.message);
      }
      setTimeout(() => setCloudSyncStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Cloud load failed:', err);
      setCloudSyncStatus('error');
      showSaveNotification('Gagal memuat data dari Cloud Firebase.');
      setTimeout(() => setCloudSyncStatus('idle'), 4000);
    }
  };

  const [saveNotificationMessage, setSaveNotificationMessage] = useState<string | null>(null);
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | undefined>(undefined);
  const globalSaveTimerRef = React.useRef<any>(null);

  const triggerGlobalSave = async (action?: () => void | Promise<void>) => {
    if (globalSaveTimerRef.current) {
      clearTimeout(globalSaveTimerRef.current);
    }
    setGlobalSaveStatus('saving');

    try {
      if (action) {
        await Promise.resolve(action());
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSavedTime(timeStr);
      setGlobalSaveStatus('saved');

      globalSaveTimerRef.current = setTimeout(() => {
        setGlobalSaveStatus('idle');
      }, 2600);
    } catch (err) {
      setGlobalSaveStatus('error');
      globalSaveTimerRef.current = setTimeout(() => {
        setGlobalSaveStatus('idle');
      }, 3000);
      throw err;
    }
  };

  const showSaveNotification = (message = 'Data berhasil disimpan dengan aman ke sistem!') => {
    setSaveNotificationMessage(message);
    setTimeout(() => {
      setSaveNotificationMessage((current) => (current === message ? null : current));
    }, 4500);
  };

  const clearSaveNotification = () => {
    setSaveNotificationMessage(null);
  };

  // Filter Mata Pelajaran untuk Cetak Rapor (Sesuai Keadaan Satuan Pendidikan)
  const PRINT_MAPEL_STORAGE_KEY = 'rapor_print_selected_mapel';
  const [selectedMapelForPrint, setSelectedMapelForPrint] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PRINT_MAPEL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DATABASE.mataPelajaran.map((m) => m.mataPelajaran);
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRINT_MAPEL_STORAGE_KEY, JSON.stringify(selectedMapelForPrint));
    } catch {}
  }, [selectedMapelForPrint]);

  const toggleMapelForPrint = (mapelName: string) => {
    setSelectedMapelForPrint((prev) => {
      if (prev.includes(mapelName)) {
        if (prev.length <= 1) return prev; // Minimal 1 mapel tetap aktif
        return prev.filter((m) => m !== mapelName);
      } else {
        return [...prev, mapelName];
      }
    });
  };

  const setMapelPrintPreset = (preset: 'semua' | 'wajib_saja' | 'wajib_pilihan' | 'wajib_mulok') => {
    if (preset === 'semua') {
      setSelectedMapelForPrint(db.mataPelajaran.map((m) => m.mataPelajaran));
      showSaveNotification('Filter Rapor: Menampilkan Semua Mata Pelajaran (Wajib, Pilihan, & Mulok).');
    } else if (preset === 'wajib_saja') {
      const wajibList = db.mataPelajaran.filter((m) => m.kelompok === 'Wajib').map((m) => m.mataPelajaran);
      setSelectedMapelForPrint(wajibList.length > 0 ? wajibList : db.mataPelajaran.map((m) => m.mataPelajaran));
      showSaveNotification('Filter Rapor: Menampilkan Hanya Mata Pelajaran Wajib Saja (Tanpa Pilihan/Mulok).');
    } else if (preset === 'wajib_pilihan') {
      const list = db.mataPelajaran.filter((m) => m.kelompok === 'Wajib' || m.kelompok === 'Pilihan').map((m) => m.mataPelajaran);
      setSelectedMapelForPrint(list.length > 0 ? list : db.mataPelajaran.map((m) => m.mataPelajaran));
      showSaveNotification('Filter Rapor: Menampilkan Mapel Wajib + Mapel Pilihan (Bahasa Inggris).');
    } else if (preset === 'wajib_mulok') {
      const list = db.mataPelajaran.filter((m) => m.kelompok === 'Wajib' || m.kelompok === 'Muatan Lokal').map((m) => m.mataPelajaran);
      setSelectedMapelForPrint(list.length > 0 ? list : db.mataPelajaran.map((m) => m.mataPelajaran));
      showSaveNotification('Filter Rapor: Menampilkan Mapel Wajib + Muatan Lokal (Bahasa Daerah & Noken).');
    }
  };

  const isMapelActiveForPrint = (mapelName: string) => {
    if (selectedMapelForPrint.length === 0) return true;
    return selectedMapelForPrint.includes(mapelName);
  };

  const printableMataPelajaran = useMemo(() => {
    const list = db.mataPelajaran.filter((m) => isMapelActiveForPrint(m.mataPelajaran));
    return list.length > 0 ? list : db.mataPelajaran;
  }, [db.mataPelajaran, selectedMapelForPrint]);

  // History stack for Undo and Redo
  const [undoStack, setUndoStack] = useState<DatabaseState[]>([]);
  const [redoStack, setRedoStack] = useState<DatabaseState[]>([]);

  const mutateDb = (updater: (prev: DatabaseState) => DatabaseState) => {
    setDb((prev) => {
      const next = updater(prev);
      setUndoStack((u) => [...u.slice(-25), prev]);
      setRedoStack([]);
      return next;
    });
  };

  const undo = () => {
    if (undoStack.length === 0) {
      showSaveNotification('Tidak ada aksi yang bisa di-Undo (dibatalkan).');
      return;
    }
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [...r, db]);
    setDb(previous);
    showSaveNotification('Perubahan berhasil di-Undo (dibatalkan)!');
  };

  const redo = () => {
    if (redoStack.length === 0) {
      showSaveNotification('Tidak ada aksi yang bisa di-Redo (diulangi).');
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, db]);
    setDb(next);
    showSaveNotification('Perubahan berhasil di-Redo (diterapkan kembali)!');
  };

  const refreshData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDb(JSON.parse(saved));
      }
      showSaveNotification('Data berhasil disegarkan (Refresh)!');
    } catch {
      showSaveNotification('Data berhasil dimuat ulang!');
    }
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save database to localStorage', e);
    }
  }, [db]);

  const setSelectedKelas = (kelas: ClassLevel) => {
    setSelectedKelasState(kelas);
    setSelectedFase(getFaseFromKelas(kelas));
  };

  const login = (username: string, pass: string) => {
    const user = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === pass
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, message: `Selamat datang, ${user.namaLengkap}!` };
    }
    return { success: false, message: 'Username atau kata sandi tidak cocok. Silakan cek kembali!' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const registerUser = (newUser: UserAccount) => {
    const exists = db.users.some(
      (u) => u.username.toLowerCase() === newUser.username.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'Username sudah digunakan, silakan pilih yang lain!' };
    }
    setDb((prev) => ({
      ...prev,
      users: [...prev.users, newUser]
    }));
    return { success: true, message: 'Pendaftaran akun berhasil! Silakan masuk.' };
  };

  const updateSekolah = (data: Partial<SchoolIdentity>) => {
    mutateDb((prev) => ({
      ...prev,
      sekolah: { ...prev.sekolah, ...data }
    }));
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const saveGuru = (guruData: Teacher) => {
    mutateDb((prev) => {
      const idx = prev.guru.findIndex((g) => g.idGuru === guruData.idGuru);
      if (idx >= 0) {
        const next = [...prev.guru];
        next[idx] = guruData;
        return { ...prev, guru: next };
      }
      return { ...prev, guru: [...prev.guru, guruData] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const saveGuruBatch = (guruList: Teacher[]) => {
    if (!guruList || guruList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.guru];
      for (const item of guruList) {
        const idx = copy.findIndex((g) => g.idGuru === item.idGuru);
        if (idx >= 0) {
          copy[idx] = item;
        } else {
          copy.push(item);
        }
      }
      return { ...prev, guru: copy };
    });
    showSaveNotification(`${guruList.length} data guru berhasil disimpan ke sistem!`);
  };

  const deleteGuru = (idGuru: string) => {
    mutateDb((prev) => ({
      ...prev,
      guru: prev.guru.filter((g) => g.idGuru !== idGuru)
    }));
  };

  const saveSiswa = (siswaData: Student, oldNisn?: string) => {
    mutateDb((prev) => {
      return syncStudentRelations(prev, siswaData, oldNisn);
    });
    showSaveNotification(
      `Data ${siswaData.namaSiswa} berhasil disimpan & dihubungkan otomatis ke data kelas, mapel agama (${siswaData.agama}), nilai, kehadiran, ekstra, dan catatan!`
    );
  };

  const saveSiswaBatch = (siswaList: Student[]) => {
    if (!siswaList || siswaList.length === 0) return;
    mutateDb((prev) => {
      return syncBatchStudentsRelations(prev, siswaList);
    });
    showSaveNotification(
      `${siswaList.length} data siswa berhasil disimpan & dihubungkan otomatis ke seluruh kelas, mapel, agama, nilai, kehadiran, dan rapor!`
    );
  };

  const syncAllStudentConnections = () => {
    mutateDb((prev) => {
      return syncAllStudents(prev);
    });
    showSaveNotification(
      'Seluruh data siswa berhasil disinkronkan & dihubungkan ke data kelas, mapel agama, nilai, kehadiran, ekstra, dan catatan!'
    );
  };

  const deleteSiswa = (idSiswa: string) => {
    mutateDb((prev) => {
      return cleanupDeletedStudentRelations(prev, idSiswa);
    });
    showSaveNotification('Data siswa dan keterkaitan data lainnya berhasil diperbarui.');
  };

  const saveKelas = (kelasData: ClassData) => {
    mutateDb((prev) => {
      const idx = prev.kelas.findIndex((k) => k.idKelas === kelasData.idKelas);
      if (idx >= 0) {
        const next = [...prev.kelas];
        next[idx] = kelasData;
        return { ...prev, kelas: next };
      }
      return { ...prev, kelas: [...prev.kelas, kelasData] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveKelas = (kelasList: ClassData[]) => {
    if (!kelasList || kelasList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.kelas];
      kelasList.forEach((k) => {
        const idx = copy.findIndex((item) => item.namaKelas === k.namaKelas || item.idKelas === k.idKelas);
        if (idx >= 0) copy[idx] = { ...copy[idx], ...k };
        else copy.push(k);
      });
      return { ...prev, kelas: copy };
    });
    showSaveNotification(`${kelasList.length} data rombel kelas berhasil disimpan ke sistem!`);
  };

  const deleteKelas = (idKelas: string) => {
    mutateDb((prev) => ({
      ...prev,
      kelas: prev.kelas.filter((k) => k.idKelas !== idKelas)
    }));
  };

  const saveMataPelajaran = (mapel: Subject) => {
    const internalKode = mapel.kode || `MAPEL_${Date.now()}`;
    const cleanMapel: Subject = {
      ...mapel,
      kode: internalKode
    };
    mutateDb((prev) => {
      const idx = prev.mataPelajaran.findIndex(
        (m) => (mapel.kode && m.kode === mapel.kode) || m.mataPelajaran.trim().toLowerCase() === mapel.mataPelajaran.trim().toLowerCase()
      );
      if (idx >= 0) {
        const next = [...prev.mataPelajaran];
        next[idx] = cleanMapel;
        return { ...prev, mataPelajaran: next };
      }
      return { ...prev, mataPelajaran: [...prev.mataPelajaran, cleanMapel] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveMataPelajaran = (mapels: Subject[]) => {
    mutateDb((prev) => {
      const copy = [...prev.mataPelajaran];
      mapels.forEach((m) => {
        const idx = copy.findIndex(
          (item) =>
            (m.kode && item.kode === m.kode) ||
            item.mataPelajaran.trim().toLowerCase() === m.mataPelajaran.trim().toLowerCase()
        );
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], ...m };
        } else {
          copy.push(m);
        }
      });
      // Sinkronkan juga KKM ke db.nilaiAkademik agar penilaian dan rapor langsung mengadopsi KKM baru
      const updatedNilai = prev.nilaiAkademik.map((n) => {
        const matched = mapels.find(
          (m) => m.mataPelajaran.trim().toLowerCase() === n.mataPelajaran.trim().toLowerCase()
        );
        if (matched && matched.kkm !== undefined) {
          return { ...n, kkm: matched.kkm };
        }
        return n;
      });
      return { ...prev, mataPelajaran: copy, nilaiAkademik: updatedNilai };
    });
    showSaveNotification('Data KKM Semua Pelajaran berhasil disimpan & disinkronkan ke seluruh sistem rapor!');
  };

  const deleteMataPelajaran = (kodeOrName: string) => {
    mutateDb((prev) => ({
      ...prev,
      mataPelajaran: prev.mataPelajaran.filter((m) => m.kode !== kodeOrName && m.mataPelajaran !== kodeOrName)
    }));
  };

  const saveTP = (tp: LearningObjective) => {
    mutateDb((prev) => {
      const idx = prev.tujuanPembelajaran.findIndex((t) => t.id === tp.id);
      if (idx >= 0) {
        const next = [...prev.tujuanPembelajaran];
        next[idx] = tp;
        return { ...prev, tujuanPembelajaran: next };
      }
      return { ...prev, tujuanPembelajaran: [...prev.tujuanPembelajaran, tp] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveTujuanPembelajaran = (tpList: LearningObjective[]) => {
    if (!tpList || tpList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.tujuanPembelajaran];
      tpList.forEach((tp) => {
        const idx = copy.findIndex(
          (t) =>
            t.id === tp.id ||
            (t.kodeTp === tp.kodeTp && t.mataPelajaran === tp.mataPelajaran && t.kelas === tp.kelas)
        );
        if (idx >= 0) copy[idx] = { ...copy[idx], ...tp };
        else copy.push(tp);
      });
      return { ...prev, tujuanPembelajaran: copy };
    });
    showSaveNotification(`${tpList.length} Tujuan Pembelajaran (TP) berhasil disimpan & dihubungkan ke rapor!`);
  };

  const deleteTP = (id: string) => {
    mutateDb((prev) => ({
      ...prev,
      tujuanPembelajaran: prev.tujuanPembelajaran.filter((t) => t.id !== id)
    }));
  };

  const saveNilaiAkademik = (nilai: AcademicScore) => {
    mutateDb((prev) => {
      const idx = prev.nilaiAkademik.findIndex(
        (n) => n.idNilai === nilai.idNilai || (n.nisn === nilai.nisn && n.mataPelajaran === nilai.mataPelajaran && n.semester === nilai.semester)
      );
      if (idx >= 0) {
        const next = [...prev.nilaiAkademik];
        next[idx] = nilai;
        return { ...prev, nilaiAkademik: next };
      }
      return { ...prev, nilaiAkademik: [...prev.nilaiAkademik, nilai] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveNilai = (nilais: AcademicScore[]) => {
    mutateDb((prev) => {
      const nextNilai = [...prev.nilaiAkademik];
      nilais.forEach((newN) => {
        const idx = nextNilai.findIndex(
          (n) => n.idNilai === newN.idNilai || (n.nisn === newN.nisn && n.mataPelajaran === newN.mataPelajaran && n.semester === newN.semester)
        );
        if (idx >= 0) {
          nextNilai[idx] = newN;
        } else {
          nextNilai.push(newN);
        }
      });
      return { ...prev, nilaiAkademik: nextNilai };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const syncAllScoresWithTPDescriptions = (forcedSemester?: SemesterType): number => {
    const sem = forcedSemester || selectedSemester;
    let countUpdated = 0;

    mutateDb((prev) => {
      const siswaInKelas = prev.siswa.filter((s) => s.kelas === selectedKelas);
      const existingScores = [...prev.nilaiAkademik];

      siswaInKelas.forEach((s) => {
        prev.mataPelajaran.forEach((m) => {
          const existingIdx = existingScores.findIndex(
            (n) =>
              n.nisn === s.nisn &&
              n.mataPelajaran === m.mataPelajaran &&
              n.kelas === selectedKelas &&
              n.semester === sem
          );

          const defaultNA = existingIdx >= 0 ? existingScores[existingIdx].nilaiAkhir : 80;
          const tpResult = generateReportDescriptionFromTP(
            m.mataPelajaran,
            selectedKelas,
            defaultNA,
            prev.tujuanPembelajaran,
            s.namaSiswa
          );

          if (existingIdx >= 0) {
            existingScores[existingIdx] = {
              ...existingScores[existingIdx],
              deskripsiRapor: tpResult.deskripsiRapor,
              deskripsiTercapai: tpResult.deskripsiTercapai,
              deskripsiPerluPeningkatan: tpResult.deskripsiPerluPeningkatan
            };
          } else {
            existingScores.push({
              idNilai: `N_${s.nisn}_${m.mataPelajaran.slice(0, 3)}_${sem}`,
              tahunPelajaran: prev.sekolah.tahunPelajaran,
              semester: sem,
              kelas: selectedKelas,
              nisn: s.nisn,
              namaSiswa: s.namaSiswa,
              mataPelajaran: m.mataPelajaran,
              formatif: defaultNA,
              sumatif: defaultNA,
              nilaiAkhir: defaultNA,
              predikat:
                defaultNA >= 88
                  ? 'Sangat Baik'
                  : defaultNA >= 78
                  ? 'Baik'
                  : defaultNA >= 68
                  ? 'Cukup'
                  : 'Perlu Bimbingan',
              capaianKompetensi:
                defaultNA >= 88
                  ? 'Sangat Baik'
                  : defaultNA >= 78
                  ? 'Baik'
                  : defaultNA >= 68
                  ? 'Cukup'
                  : 'Perlu Pendampingan',
              deskripsiTercapai: tpResult.deskripsiTercapai,
              deskripsiPerluPeningkatan: tpResult.deskripsiPerluPeningkatan,
              deskripsiRapor: tpResult.deskripsiRapor
            });
          }
          countUpdated++;
        });
      });

      return {
        ...prev,
        nilaiAkademik: existingScores
      };
    });

    showSaveNotification(
      `Berhasil menghubungkan deskripsi TP mata pelajaran ke semua rapor (${countUpdated} data siswa/mapel terhubung)!`
    );
    return countUpdated;
  };

  const saveAllData = () => {
    triggerGlobalSave(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        showSaveNotification('Seluruh data rapor dan administrasi sekolah berhasil disimpan!');
      } catch {
        showSaveNotification('Data berhasil disimpan ke sistem lokal!');
      }
    });
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save data with instant feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveAllData();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [db]);

  const syncAllData = () => {
    // 1. Hubungkan seluruh TP Mata Pelajaran ke Rapor
    const countUpdated = syncAllScoresWithTPDescriptions();

    // 2. Sinkronkan data kehadiran jika ada siswa baru
    mutateDb((prev) => {
      const nextKehadiran = [...prev.kehadiran];
      prev.siswa.forEach((s) => {
        const hasK = nextKehadiran.some((k) => k.nisn === s.nisn && k.semester === selectedSemester);
        if (!hasK) {
          nextKehadiran.push({
            id: `ATT_${s.nisn}_${selectedSemester}`,
            tahunPelajaran: prev.sekolah.tahunPelajaran,
            semester: selectedSemester,
            kelas: s.kelas,
            nisn: s.nisn,
            namaSiswa: s.namaSiswa,
            sakit: 0,
            izin: 0,
            alpa: 0,
            totalHari: 0
          });
        }
      });
      return {
        ...prev,
        kehadiran: nextKehadiran
      };
    });

    showSaveNotification(
      `Semua data (Sekolah, Siswa, TP Mapel, Nilai Rapor, Wali Kelas) berhasil disinkronkan & dihubungkan (${countUpdated} capaian TP terhubung)!`
    );
  };

  const saveEkskul = (ekskul: Extracurricular) => {
    mutateDb((prev) => {
      const idx = prev.ekstrakurikuler.findIndex((e) => e.id === ekskul.id);
      if (idx >= 0) {
        const next = [...prev.ekstrakurikuler];
        next[idx] = ekskul;
        return { ...prev, ekstrakurikuler: next };
      }
      return { ...prev, ekstrakurikuler: [...prev.ekstrakurikuler, ekskul] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveEkskul = (ekskulList: Extracurricular[]) => {
    if (!ekskulList || ekskulList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.ekstrakurikuler];
      ekskulList.forEach((e) => {
        const idx = copy.findIndex(
          (item) => item.id === e.id || (item.nisn === e.nisn && item.jenisEkstrakurikuler === e.jenisEkstrakurikuler && item.semester === e.semester)
        );
        if (idx >= 0) copy[idx] = { ...copy[idx], ...e };
        else copy.push(e);
      });
      return { ...prev, ekstrakurikuler: copy };
    });
    showSaveNotification(`${ekskulList.length} data kegiatan ekstrakurikuler berhasil disimpan ke sistem!`);
  };

  const deleteEkskul = (id: string) => {
    mutateDb((prev) => ({
      ...prev,
      ekstrakurikuler: prev.ekstrakurikuler.filter((e) => e.id !== id)
    }));
  };

  const saveKehadiran = (kehadiran: Attendance) => {
    mutateDb((prev) => {
      const idx = prev.kehadiran.findIndex(
        (h) => h.id === kehadiran.id || (h.nisn === kehadiran.nisn && h.semester === kehadiran.semester)
      );
      if (idx >= 0) {
        const next = [...prev.kehadiran];
        next[idx] = kehadiran;
        return { ...prev, kehadiran: next };
      }
      return { ...prev, kehadiran: [...prev.kehadiran, kehadiran] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveKehadiran = (kehadiranList: Attendance[]) => {
    if (!kehadiranList || kehadiranList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.kehadiran];
      kehadiranList.forEach((att) => {
        const idx = copy.findIndex(
          (h) => h.id === att.id || (h.nisn === att.nisn && h.semester === att.semester)
        );
        if (idx >= 0) copy[idx] = { ...copy[idx], ...att };
        else copy.push(att);
      });
      return { ...prev, kehadiran: copy };
    });
    showSaveNotification(`Data presensi kehadiran untuk ${kehadiranList.length} siswa berhasil disimpan!`);
  };

  const saveCatatanWali = (catatan: TeacherNote) => {
    mutateDb((prev) => {
      const idx = prev.catatanWali.findIndex(
        (c) => c.id === catatan.id || (c.nisn === catatan.nisn && c.semester === catatan.semester)
      );
      if (idx >= 0) {
        const next = [...prev.catatanWali];
        next[idx] = catatan;
        return { ...prev, catatanWali: next };
      }
      return { ...prev, catatanWali: [...prev.catatanWali, catatan] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveCatatanWali = (catatanList: TeacherNote[]) => {
    if (!catatanList || catatanList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.catatanWali];
      catatanList.forEach((c) => {
        const idx = copy.findIndex(
          (item) => item.id === c.id || (item.nisn === c.nisn && item.semester === c.semester)
        );
        if (idx >= 0) copy[idx] = { ...copy[idx], ...c };
        else copy.push(c);
      });
      return { ...prev, catatanWali: copy };
    });
    showSaveNotification(`Catatan wali kelas untuk ${catatanList.length} siswa berhasil disimpan!`);
  };

  const saveP5Projek = (projek: P5Project) => {
    mutateDb((prev) => {
      const idx = prev.p5Projek.findIndex((p) => p.idProjek === projek.idProjek);
      if (idx >= 0) {
        const next = [...prev.p5Projek];
        next[idx] = projek;
        return { ...prev, p5Projek: next };
      }
      return { ...prev, p5Projek: [...prev.p5Projek, projek] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveP5Projek = (projekList: P5Project[]) => {
    if (!projekList || projekList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.p5Projek];
      projekList.forEach((p) => {
        const idx = copy.findIndex((item) => item.idProjek === p.idProjek || item.namaProjek === p.namaProjek);
        if (idx >= 0) copy[idx] = { ...copy[idx], ...p };
        else copy.push(p);
      });
      return { ...prev, p5Projek: copy };
    });
    showSaveNotification(`${projekList.length} data Projek P5 berhasil disimpan!`);
  };

  const deleteP5Projek = (id: string) => {
    mutateDb((prev) => ({
      ...prev,
      p5Projek: prev.p5Projek.filter((p) => p.idProjek !== id)
    }));
  };

  const saveP5Tahapan = (tahap: P5Stage) => {
    mutateDb((prev) => {
      const idx = prev.p5Tahapan.findIndex((t) => t.id === tahap.id);
      if (idx >= 0) {
        const next = [...prev.p5Tahapan];
        next[idx] = tahap;
        return { ...prev, p5Tahapan: next };
      }
      return { ...prev, p5Tahapan: [...prev.p5Tahapan, tahap] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveP5Tahapan = (tahapList: P5Stage[]) => {
    if (!tahapList || tahapList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.p5Tahapan];
      tahapList.forEach((t) => {
        const idx = copy.findIndex((item) => item.id === t.id);
        if (idx >= 0) copy[idx] = { ...copy[idx], ...t };
        else copy.push(t);
      });
      return { ...prev, p5Tahapan: copy };
    });
    showSaveNotification(`${tahapList.length} tahapan alur Projek P5 berhasil disimpan!`);
  };

  const deleteP5Tahapan = (id: string) => {
    mutateDb((prev) => ({
      ...prev,
      p5Tahapan: prev.p5Tahapan.filter((t) => t.id !== id)
    }));
  };

  const saveP5Dimensi = (dim: P5DimensionItem) => {
    mutateDb((prev) => {
      const idx = prev.p5Dimensi.findIndex((d) => d.id === dim.id);
      if (idx >= 0) {
        const next = [...prev.p5Dimensi];
        next[idx] = dim;
        return { ...prev, p5Dimensi: next };
      }
      return { ...prev, p5Dimensi: [...prev.p5Dimensi, dim] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveP5Dimensi = (dimensiList: P5DimensionItem[]) => {
    if (!dimensiList || dimensiList.length === 0) return;
    mutateDb((prev) => {
      const copy = [...prev.p5Dimensi];
      dimensiList.forEach((d) => {
        const idx = copy.findIndex((item) => item.id === d.id || (item.dimensi === d.dimensi && item.elemen === d.elemen && item.subElemen === d.subElemen));
        if (idx >= 0) copy[idx] = { ...copy[idx], ...d };
        else copy.push(d);
      });
      return { ...prev, p5Dimensi: copy };
    });
    showSaveNotification(`${dimensiList.length} dimensi & elemen P5 berhasil disimpan!`);
  };

  const deleteP5Dimensi = (id: string) => {
    mutateDb((prev) => ({
      ...prev,
      p5Dimensi: prev.p5Dimensi.filter((d) => d.id !== id)
    }));
  };

  const saveP5Nilai = (score: P5Score) => {
    mutateDb((prev) => {
      const idx = prev.p5Nilai.findIndex(
        (p) => p.id === score.id || (p.idProjek === score.idProjek && p.nisn === score.nisn && p.dimensi === score.dimensi)
      );
      if (idx >= 0) {
        const next = [...prev.p5Nilai];
        next[idx] = score;
        return { ...prev, p5Nilai: next };
      }
      return { ...prev, p5Nilai: [...prev.p5Nilai, score] };
    });
    showSaveNotification('Data berhasil disimpan dengan aman ke sistem!');
  };

  const bulkSaveP5Nilai = (scores: P5Score[]) => {
    mutateDb((prev) => {
      const nextScores = [...prev.p5Nilai];
      scores.forEach((sc) => {
        const idx = nextScores.findIndex(
          (p) => p.id === sc.id || (p.idProjek === sc.idProjek && p.nisn === sc.nisn && p.dimensi === sc.dimensi)
        );
        if (idx >= 0) {
          nextScores[idx] = sc;
        } else {
          nextScores.push(sc);
        }
      });
      return { ...prev, p5Nilai: nextScores };
    });
    showSaveNotification('Data Nilai P5 Projek berhasil disimpan ke sistem!');
  };

  const exportDatabaseJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup-rapor-sdn-balil-2026-2027-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDatabaseJson = (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.sekolah || !parsed.siswa || !parsed.guru) {
        return { success: false, message: 'Format file tidak sesuai skema database Rapor SD Negeri Balil!' };
      }
      setDb(parsed);
      return { success: true, message: 'Database berhasil dipulihkan (restore) dengan sukses!' };
    } catch (err) {
      return { success: false, message: 'Gagal membaca file JSON. Pastikan file valid!' };
    }
  };

  const savePiagam = (piagam: PiagamAward) => {
    mutateDb((prev) => {
      const currentList = prev.piagam || [];
      const idx = currentList.findIndex((p) => p.idPiagam === piagam.idPiagam);
      if (idx >= 0) {
        const next = [...currentList];
        next[idx] = piagam;
        return { ...prev, piagam: next };
      }
      return { ...prev, piagam: [...currentList, piagam] };
    });
    showSaveNotification('Piagam Penghargaan berhasil disimpan!');
  };

  const bulkSavePiagam = (piagamList: PiagamAward[]) => {
    if (!piagamList || piagamList.length === 0) return;
    mutateDb((prev) => {
      const currentList = [...(prev.piagam || [])];
      piagamList.forEach((piagam) => {
        const idx = currentList.findIndex((p) => p.idPiagam === piagam.idPiagam || (p.nisn === piagam.nisn && p.judulPenghargaan === piagam.judulPenghargaan));
        if (idx >= 0) currentList[idx] = { ...currentList[idx], ...piagam };
        else currentList.push(piagam);
      });
      return { ...prev, piagam: currentList };
    });
    showSaveNotification(`${piagamList.length} data piagam penghargaan siswa berhasil disimpan!`);
  };

  const deletePiagam = (idPiagam: string) => {
    mutateDb((prev) => ({
      ...prev,
      piagam: (prev.piagam || []).filter((p) => p.idPiagam !== idPiagam)
    }));
  };

  const saveKeputusanSiswa = (decision: StudentDecision) => {
    setDb((prev) => {
      const currentList = prev.keputusanSiswa || [];
      const idx = currentList.findIndex(
        (k) => k.nisn === decision.nisn && k.kelas === decision.kelas && k.semester === decision.semester
      );
      if (idx >= 0) {
        const next = [...currentList];
        next[idx] = decision;
        return { ...prev, keputusanSiswa: next };
      }
      return { ...prev, keputusanSiswa: [...currentList, decision] };
    });
    showSaveNotification('Keputusan Rapor berhasil disimpan!');
  };

  const bulkSaveKeputusanSiswa = (decisions: StudentDecision[]) => {
    setDb((prev) => {
      const nextList = [...(prev.keputusanSiswa || [])];
      decisions.forEach((dec) => {
        const idx = nextList.findIndex(
          (k) => k.nisn === dec.nisn && k.kelas === dec.kelas && k.semester === dec.semester
        );
        if (idx >= 0) {
          nextList[idx] = dec;
        } else {
          nextList.push(dec);
        }
      });
      return { ...prev, keputusanSiswa: nextList };
    });
    showSaveNotification('Keputusan Rapor berhasil diterapkan ke seluruh siswa kelas!');
  };

  const resetDatabase = () => {
    setDb(INITIAL_DATABASE);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        db,
        activeMenu,
        setActiveMenu,
        selectedKelas,
        setSelectedKelas,
        selectedSemester,
        setSelectedSemester,
        selectedFase,
        setSelectedFase,
        currentUser,
        login,
        logout,
        registerUser,
        updateSekolah,
        saveGuru,
        saveGuruBatch,
        deleteGuru,
        saveSiswa,
        saveSiswaBatch,
        syncAllStudentConnections,
        deleteSiswa,
        saveKelas,
        bulkSaveKelas,
        deleteKelas,
        saveMataPelajaran,
        bulkSaveMataPelajaran,
        deleteMataPelajaran,
        saveTP,
        bulkSaveTujuanPembelajaran,
        deleteTP,
        saveNilaiAkademik,
        bulkSaveNilai,
        saveEkskul,
        bulkSaveEkskul,
        deleteEkskul,
        saveKehadiran,
        bulkSaveKehadiran,
        saveCatatanWali,
        bulkSaveCatatanWali,
        saveP5Projek,
        bulkSaveP5Projek,
        deleteP5Projek,
        saveP5Tahapan,
        bulkSaveP5Tahapan,
        deleteP5Tahapan,
        saveP5Dimensi,
        bulkSaveP5Dimensi,
        deleteP5Dimensi,
        saveP5Nilai,
        bulkSaveP5Nilai,
        exportDatabaseJson,
        importDatabaseJson,
        resetDatabase,
        printTargetStudentId,
        setPrintTargetStudentId,
        printMode,
        setPrintMode,
        savePiagam,
        bulkSavePiagam,
        deletePiagam,
        saveKeputusanSiswa,
        bulkSaveKeputusanSiswa,
        // Filter Mata Pelajaran untuk Cetak Rapor
        selectedMapelForPrint,
        setSelectedMapelForPrint,
        toggleMapelForPrint,
        setMapelPrintPreset,
        isMapelActiveForPrint,
        printableMataPelajaran,
        selectedTpMapel,
        setSelectedTpMapel,
        syncAllScoresWithTPDescriptions,
        saveAllData,
        syncAllData,
        globalSaveStatus,
        lastSavedTime,
        triggerGlobalSave,
        saveNotificationMessage,
        showSaveNotification,
        clearSaveNotification,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        refreshData,
        // Display & Device Mode
        displayMode,
        setDisplayMode,
        isFullscreen,
        toggleFullscreen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        simulatePhonePreview,
        setSimulatePhonePreview,
        // Report Preview Modal
        isReportPreviewModalOpen,
        setIsReportPreviewModalOpen,
        openReportPreview,
        // Print Typography Controls
        printFontFamily,
        setPrintFontFamily,
        printFontSize,
        setPrintFontSize,
        // Mode Tombol Aksi
        actionToolbarMode,
        setActionToolbarMode,
        toggleActionToolbar,
        // Firebase Auth & Cloud Firestore
        firebaseUser,
        loginWithGoogle,
        logoutFirebase,
        cloudSyncStatus,
        lastCloudSyncTime,
        syncToCloudFirestore,
        loadFromCloudFirestore,
        // Pengaturan Ukuran Huruf & Size Huruf (UI & Cetak)
        uiFontSize,
        setUiFontSize,
        uiFontScalePercent,
        setUiFontScalePercent,
        uiFontFamily,
        setUiFontFamily,
        // Pengaturan Kertas
        paperSize,
        setPaperSize,
        paperOrientation,
        setPaperOrientation,
        paperMarginPreset,
        setPaperMarginPreset,
        paperMargins,
        setPaperMargins,
        // Pengaturan Print
        printColorMode,
        setPrintColorMode,
        printShowKop,
        setPrintShowKop,
        printTableBorder,
        setPrintTableBorder,
        printPageNumbers,
        setPrintPageNumbers,
        triggerQuickPrint,
        // Pengaturan Tema Aplikasi
        themeAccent,
        setThemeAccent,
        themeMode,
        setThemeMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
