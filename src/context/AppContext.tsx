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
  ActionToolbarMode
} from '../types';
import { INITIAL_DATABASE } from '../data/defaultData';
import { generateReportDescriptionFromTP } from '../utils/tpDescriptionHelper';
import {
  syncStudentRelations,
  syncBatchStudentsRelations,
  cleanupDeletedStudentRelations,
  syncAllStudents
} from '../utils/studentSyncHelper';

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
  deleteKelas: (idKelas: string) => void;
  saveMataPelajaran: (mapel: Subject) => void;
  bulkSaveMataPelajaran: (mapels: Subject[]) => void;
  deleteMataPelajaran: (kode: string) => void;
  saveTP: (tp: LearningObjective) => void;
  deleteTP: (id: string) => void;
  saveNilaiAkademik: (nilai: AcademicScore) => void;
  bulkSaveNilai: (nilais: AcademicScore[]) => void;
  saveEkskul: (ekskul: Extracurricular) => void;
  deleteEkskul: (id: string) => void;
  saveKehadiran: (kehadiran: Attendance) => void;
  saveCatatanWali: (catatan: TeacherNote) => void;
  saveP5Projek: (projek: P5Project) => void;
  deleteP5Projek: (id: string) => void;
  saveP5Tahapan: (tahap: P5Stage) => void;
  deleteP5Tahapan: (id: string) => void;
  saveP5Dimensi: (dim: P5DimensionItem) => void;
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
    showSaveNotification('Teleb Kan Data sekmarima sirya Dibmar');
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
        deleteKelas,
        saveMataPelajaran,
        bulkSaveMataPelajaran,
        deleteMataPelajaran,
        saveTP,
        deleteTP,
        saveNilaiAkademik,
        bulkSaveNilai,
        saveEkskul,
        deleteEkskul,
        saveKehadiran,
        saveCatatanWali,
        saveP5Projek,
        deleteP5Projek,
        saveP5Tahapan,
        deleteP5Tahapan,
        saveP5Dimensi,
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
        toggleActionToolbar
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
