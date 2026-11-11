import React, { useState } from 'react';
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  DoorOpen,
  BookMarked,
  Target,
  FileSpreadsheet,
  TableProperties,
  Award,
  CalendarCheck,
  MessageSquare,
  FileText,
  Compass,
  Milestone,
  Sparkles,
  ClipboardCheck,
  FileCheck2,
  FolderArchive,
  Printer,
  Settings,
  Database,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Laptop,
  Medal,
  ScrollText,
  FolderDown,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useApp, MenuKey } from '../context/AppContext';
import { InstallPcModal } from './modals/InstallPcModal';

interface MenuItem {
  key: MenuKey;
  label: string;
  icon: React.ReactNode;
  category: 'utama' | 'pokok' | 'akademik' | 'p5' | 'output';
}

const MENU_ITEMS: MenuItem[] = [
  // Utama
  { key: 'dashboard', label: 'DASHBOARD', icon: <LayoutDashboard size={17} />, category: 'utama' },
  { key: 'buku_panduan', label: 'BUKU PANDUAN PENGGUNA', icon: <BookOpen size={17} />, category: 'utama' },
  { key: 'identitas_sekolah', label: 'IDENTITAS SEKOLAH', icon: <School size={17} />, category: 'utama' },

  // Data Pokok
  { key: 'data_guru', label: 'DATA GURU', icon: <Users size={17} />, category: 'pokok' },
  { key: 'data_siswa', label: 'DATA SISWA', icon: <GraduationCap size={17} />, category: 'pokok' },
  { key: 'data_kelas', label: 'DATA KELAS', icon: <DoorOpen size={17} />, category: 'pokok' },
  { key: 'mata_pelajaran', label: 'DATA MATA PELAJARAN', icon: <BookMarked size={17} />, category: 'pokok' },
  { key: 'kkm_pelajaran', label: 'KKM SEMUA PELAJARAN', icon: <SlidersHorizontal size={17} />, category: 'pokok' },
  { key: 'tujuan_pembelajaran', label: 'TUJUAN PEMBELAJARAN', icon: <Target size={17} />, category: 'pokok' },

  // Penilaian Akademik (Input & Manajemen Nilai)
  { key: 'input_nilai', label: 'INPUT NILAI AKADEMIK', icon: <FileSpreadsheet size={17} />, category: 'akademik' },
  { key: 'rekap_nilai', label: 'REKAP NILAI AKADEMIK', icon: <TableProperties size={17} />, category: 'akademik' },
  { key: 'deskripsi_rapor', label: 'DESKRIPSI RAPOR', icon: <HelpCircle size={17} />, category: 'akademik' },
  { key: 'ekstrakurikuler', label: 'EKSTRAKURIKULER', icon: <Award size={17} />, category: 'akademik' },
  { key: 'kehadiran', label: 'KEHADIRAN SISWA', icon: <CalendarCheck size={17} />, category: 'akademik' },
  { key: 'catatan_wali', label: 'CATATAN WALI KELAS', icon: <MessageSquare size={17} />, category: 'akademik' },

  // P5 Projek
  { key: 'p5_projek', label: 'P5 / PROJEK KOKURIKULER', icon: <Compass size={17} />, category: 'p5' },
  { key: 'p5_tahapan', label: 'TAHAPAN PROJEK P5', icon: <Milestone size={17} />, category: 'p5' },
  { key: 'p5_dimensi', label: 'DIMENSI & ELEMEN P5', icon: <Sparkles size={17} />, category: 'p5' },
  { key: 'p5_nilai', label: 'INPUT CAPAIAN P5', icon: <ClipboardCheck size={17} />, category: 'p5' },
  { key: 'rapor_p5', label: 'RAPOR P5', icon: <FileCheck2 size={17} />, category: 'p5' },

  // Output & Cetak Rapor
  { key: 'cetak_rapor', label: 'PUSAT CETAK RAPOR', icon: <Printer size={17} />, category: 'output' },
  { key: 'rapor_pts', label: 'CETAK RAPOR PTS (TENGAH SEMESTER)', icon: <ScrollText size={17} />, category: 'output' },
  { key: 'cetak_rapor_semester_1', label: 'CETAK RAPOR SEMESTER 1', icon: <Printer size={17} />, category: 'output' },
  { key: 'cetak_rapor_semester_2', label: 'CETAK RAPOR SEMESTER 2', icon: <Printer size={17} />, category: 'output' },
  { key: 'rekap_rapor', label: 'REKAP RAPOR SISWA', icon: <FolderArchive size={17} />, category: 'output' },
  { key: 'piagam', label: 'PIAGAM PENGHARGAAN', icon: <Medal size={17} />, category: 'output' },
  { key: 'template_data', label: 'TEMPLATE DATA SEMUA MENU', icon: <FolderDown size={17} />, category: 'output' },
  { key: 'pengaturan', label: 'PENGATURAN', icon: <Settings size={17} />, category: 'output' },
  { key: 'backup_restore', label: 'BACKUP & RESTORE DB', icon: <Database size={17} />, category: 'output' }
];

export const Sidebar: React.FC = () => {
  const {
    activeMenu,
    setActiveMenu,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    displayMode,
    db,
    selectedTpMapel,
    setSelectedTpMapel,
    selectedKelas
  } = useApp();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [tpSubmenuExpanded, setTpSubmenuExpanded] = useState(true);

  const renderCategoryHeader = (title: string) => {
    if (isSidebarCollapsed) return null;
    return (
      <div className="px-3 pt-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400/80">
        {title}
      </div>
    );
  };

  const handleMenuClick = (key: MenuKey) => {
    setActiveMenu(key);
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Top Sidebar Header with Collapse Button */}
      <div className="p-2.5 border-b border-slate-800 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <div className="text-[11px] font-black tracking-wide text-slate-300 uppercase px-2 truncate">
            Navigasi Menu
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {/* Mobile close button */}
          {isMobileDrawerOpen && (
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer lg:hidden"
              title="Tutup Menu"
            >
              <X size={18} />
            </button>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden lg:flex items-center justify-center"
            title={isSidebarCollapsed ? 'Buka Sidebar (Lebar)' : 'Ciutkan Sidebar (Ramping)'}
          >
            {isSidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      {/* Menu Item List */}
      <div className="p-2 space-y-1 flex-1 overflow-y-auto">
        {renderCategoryHeader('MENU UTAMA')}
        {MENU_ITEMS.filter((i) => i.category === 'utama').map((item) => (
          <MenuItemButton
            key={item.key}
            item={item}
            collapsed={isSidebarCollapsed}
            active={activeMenu === item.key}
            onClick={() => handleMenuClick(item.key)}
          />
        ))}

        {renderCategoryHeader('DATA POKOK')}
        {MENU_ITEMS.filter((i) => i.category === 'pokok').map((item) => {
          const isTp = item.key === 'tujuan_pembelajaran';
          const isTpActive = activeMenu === 'tujuan_pembelajaran';
          return (
            <React.Fragment key={item.key}>
              <div className="relative">
                <MenuItemButton
                  item={item}
                  collapsed={isSidebarCollapsed}
                  active={isTpActive}
                  onClick={() => {
                    handleMenuClick(item.key);
                    if (isTp) {
                      if (!selectedTpMapel || selectedTpMapel === 'SEMUA') {
                        setSelectedTpMapel(db.mataPelajaran[0]?.mataPelajaran || 'Pendidikan Agama dan Budi Pekerti');
                      }
                      setTpSubmenuExpanded((prev) => !prev);
                    }
                  }}
                />
              </div>

              {/* TP Per Mata Pelajaran Submenu in Sidebar */}
              {isTp && !isSidebarCollapsed && (isTpActive || tpSubmenuExpanded) && (
                <div className="ml-3 pl-2.5 my-1 border-l-2 border-emerald-500/30 space-y-0.5">
                  <div className="px-2 py-1 text-[9px] font-black uppercase text-emerald-400 tracking-wider flex items-center justify-between">
                    <span>TP Masing-Masing Mapel</span>
                    <span className="text-[8px] bg-emerald-950/80 px-1.5 py-0.2 rounded text-emerald-300 font-bold border border-emerald-800">
                      Kls {selectedKelas}
                    </span>
                  </div>
                  {/* Daftar TP Masing-Masing Mapel Terpisah Bersih Tanpa Opsi Semua Mapel */}
                  {db.mataPelajaran.map((m) => {
                    const count = db.tujuanPembelajaran.filter(
                      (t) => t.kelas === selectedKelas && t.mataPelajaran === m.mataPelajaran
                    ).length;
                    const isSelected = selectedTpMapel === m.mataPelajaran && isTpActive;
                    return (
                      <button
                        key={m.kode || m.mataPelajaran}
                        onClick={() => {
                          setSelectedTpMapel(m.mataPelajaran);
                          handleMenuClick('tujuan_pembelajaran');
                        }}
                        title={m.mataPelajaran}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[11px] transition-all flex items-center justify-between cursor-pointer group ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                              isSelected
                                ? 'bg-emerald-800 text-white font-bold'
                                : 'bg-slate-800 text-slate-300 group-hover:text-emerald-300'
                            }`}
                          >
                            {m.kode || m.mataPelajaran.slice(0, 3)}
                          </span>
                          <span className="truncate">{m.mataPelajaran}</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono shrink-0 ml-1 ${
                            isSelected
                              ? 'bg-white text-emerald-800 font-extrabold'
                              : count > 0
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-slate-800/60 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {renderCategoryHeader('PENILAIAN AKADEMIK')}
        {MENU_ITEMS.filter((i) => i.category === 'akademik').map((item) => (
          <MenuItemButton
            key={item.key}
            item={item}
            collapsed={isSidebarCollapsed}
            active={activeMenu === item.key}
            onClick={() => handleMenuClick(item.key)}
          />
        ))}

        {renderCategoryHeader('P5 KOKURIKULER')}
        {MENU_ITEMS.filter((i) => i.category === 'p5').map((item) => (
          <MenuItemButton
            key={item.key}
            item={item}
            collapsed={isSidebarCollapsed}
            active={activeMenu === item.key}
            onClick={() => handleMenuClick(item.key)}
          />
        ))}

        {renderCategoryHeader('RAPOR, CETAK & SISTEM')}
        {MENU_ITEMS.filter((i) => i.category === 'output').map((item) => (
          <MenuItemButton
            key={item.key}
            item={item}
            collapsed={isSidebarCollapsed}
            active={activeMenu === item.key}
            onClick={() => handleMenuClick(item.key)}
          />
        ))}
      </div>

      {/* Footer Info & Tombol Instal Laptop */}
      {!isSidebarCollapsed && (
        <div className="mt-auto p-3 m-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-2">
          <button
            onClick={() => setShowInstallModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Laptop size={14} />
            <span>Instal di Laptop (Offline)</span>
          </button>
          <div className="pt-1 border-t border-slate-800">
            <div className="font-semibold text-slate-300">SD NEGERI BALIL</div>
            <div>Tahun Ajaran 2026/2027</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Kurikulum Merdeka v2.6</div>
          </div>
        </div>
      )}

      {isSidebarCollapsed && (
        <div className="mt-auto p-2 flex flex-col items-center gap-2 border-t border-slate-800">
          <button
            onClick={() => setShowInstallModal(true)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            title="Instal di Laptop (Offline)"
          >
            <Laptop size={16} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. Desktop & Tablet Static Sidebar */}
      <aside
        className={`${
          displayMode === 'hp'
            ? 'hidden' // in phone mode, rely on mobile drawer for pure phone experience
            : isSidebarCollapsed
            ? 'w-16'
            : 'w-64'
        } bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none h-[calc(100vh-89px)] overflow-hidden no-print transition-all duration-200 hidden md:flex flex-col`}
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Slide-Over Drawer (for HP Mode or Mobile Screens) */}
      {isMobileDrawerOpen && (
        <div className={`fixed inset-0 z-50 flex ${displayMode === 'hp' ? '' : 'lg:hidden'} no-print`}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      <InstallPcModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </>
  );
};

const MenuItemButton: React.FC<{
  item: MenuItem;
  active: boolean;
  collapsed?: boolean;
  onClick: () => void;
}> = ({ item, active, collapsed = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center ${
        collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
      } rounded-xl text-xs font-medium transition-all group cursor-pointer ${
        active
          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-semibold'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
        <span
          className={`shrink-0 transition-colors ${
            active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
          }`}
        >
          {item.icon}
        </span>
        {!collapsed && (
          <span className="truncate flex items-center gap-1.5">
            {item.label}
            {item.key === 'buku_panduan' && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500 text-[9px] font-extrabold text-white tracking-wider">
                BUKU
              </span>
            )}
            {item.key === 'rapor_semester_1' && (
              <span className="px-1.5 py-0.2 rounded bg-blue-500 text-[9px] font-extrabold text-white tracking-wider">
                SEM 1
              </span>
            )}
            {item.key === 'rapor_semester_2' && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-[9px] font-extrabold text-white tracking-wider">
                SEM 2
              </span>
            )}
            {item.key === 'rapor_akademik' && (
              <span className="px-1.5 py-0.2 rounded bg-purple-600 text-[9px] font-extrabold text-white tracking-wider">
                GABUNGAN
              </span>
            )}
            {item.key === 'cetak_rapor_semester_1' && (
              <span className="px-1.5 py-0.2 rounded bg-blue-600 text-[9px] font-extrabold text-white tracking-wider">
                CETAK S1
              </span>
            )}
            {item.key === 'cetak_rapor_semester_2' && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-[9px] font-extrabold text-white tracking-wider">
                CETAK S2
              </span>
            )}
          </span>
        )}
      </div>

      {!collapsed && (
        <ChevronRight
          size={13}
          className={`shrink-0 transition-transform ${
            active ? 'text-white translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
          }`}
        />
      )}
    </button>
  );
};
