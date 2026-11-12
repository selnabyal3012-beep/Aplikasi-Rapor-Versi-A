import React, { useRef, useState } from 'react';
import {
  Save,
  RotateCcw,
  RotateCw,
  RefreshCw,
  FileUp,
  FileDown,
  Trash2,
  X,
  Edit3,
  Upload,
  Eraser,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Copy,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SaveStatusIndicator, SaveStatus } from './SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export interface ActionToolbarProps {
  title?: string;
  badge?: string;

  // 1. Simpan
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  hideSave?: boolean;
  saveStatus?: SaveStatus;

  // 2. Update
  onUpdate?: () => void;
  updateLabel?: string;
  updateDisabled?: boolean;
  hideUpdate?: boolean;

  // 3. Edit
  onEdit?: () => void;
  editLabel?: string;
  editDisabled?: boolean;
  isEditing?: boolean;
  hideEdit?: boolean;

  // 4. Batal
  onCancel?: () => void;
  cancelLabel?: string;
  hideCancel?: boolean;

  // 5. Hapus
  onDelete?: () => void;
  deleteLabel?: string;
  deleteDisabled?: boolean;
  hideDelete?: boolean;

  // 6. Impor
  onImport?: (file: File) => void;
  importAccept?: string;
  importLabel?: string;
  hideImport?: boolean;

  // 7. Expor
  onExport?: () => void;
  exportLabel?: string;
  hideExport?: boolean;

  // 8. Upload
  onUpload?: (file: File) => void;
  uploadAccept?: string;
  uploadLabel?: string;
  hideUpload?: boolean;

  // 9. Bersihkan File / Input
  onClear?: () => void;
  clearLabel?: string;
  hideClear?: boolean;

  // 10. Undo
  onUndo?: () => void;
  hideUndo?: boolean;

  // 11. Redo
  onRedo?: () => void;
  hideRedo?: boolean;

  // 12. Refres
  onRefresh?: () => void;
  hideRefresh?: boolean;

  // 13. Template (Aksi Tambahan Relevan)
  onTemplate?: () => void;
  templateLabel?: string;
  hideTemplate?: boolean;

  // 14. Cetak (Aksi Tambahan Relevan)
  onPrint?: () => void;
  hidePrint?: boolean;

  // 15. Salin (Aksi Tambahan Relevan)
  onCopy?: () => void;
  hideCopy?: boolean;

  // 16. Preview Rapor
  onPreview?: () => void;
  previewLabel?: string;
  hidePreview?: boolean;

  selectedCount?: number;
  className?: string;
  compact?: boolean;
}

export const StandardActionToolbar: React.FC<ActionToolbarProps> = ({
  title,
  badge,
  onSave,
  saveLabel = 'Simpan',
  saveDisabled = false,
  hideSave = false,
  saveStatus: externalSaveStatus,

  onUpdate,
  updateLabel = 'Update',
  updateDisabled = false,
  hideUpdate = false,

  onEdit,
  editLabel = 'Edit',
  editDisabled = false,
  isEditing = false,
  hideEdit = false,

  onCancel,
  cancelLabel = 'Batal',
  hideCancel = false,

  onDelete,
  deleteLabel = 'Hapus',
  deleteDisabled = false,
  hideDelete = false,

  onImport,
  importAccept = '.xlsx,.xls,.csv',
  importLabel = 'Impor',
  hideImport = false,

  onExport,
  exportLabel = 'Expor',
  hideExport = false,

  onUpload,
  uploadAccept = '*/*',
  uploadLabel = 'Upload',
  hideUpload = false,

  onClear,
  clearLabel = 'Bersihkan File',
  hideClear = false,

  onUndo,
  hideUndo = false,

  onRedo,
  hideRedo = false,

  onRefresh,
  hideRefresh = false,

  onTemplate,
  templateLabel = 'Template',
  hideTemplate = false,

  onPrint,
  hidePrint = false,

  onCopy,
  hideCopy = false,

  onPreview,
  previewLabel = 'Preview Rapor',
  hidePreview = false,

  selectedCount,
  className = '',
  compact = false
}) => {
  const appContext = useApp();
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    refreshData,
    showSaveNotification,
    setActiveMenu,
    saveAllData,
    openReportPreview,
    actionToolbarMode,
    setActionToolbarMode
  } = appContext;

  const importFileRef = useRef<HTMLInputElement>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [internalEditing, setInternalEditing] = useState(false);
  const [localSecondaryExpanded, setLocalSecondaryExpanded] = useState(false);

  // Hook indikator status simpan lokal (Saving..., Saved)
  const { status: internalSaveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const activeSaveStatus = externalSaveStatus || internalSaveStatus;

  const activeIsEditing = isEditing || internalEditing;

  // Tentukan mode efektif (full | compact | hidden)
  const effectiveMode = actionToolbarMode === 'hidden'
    ? 'hidden'
    : (actionToolbarMode === 'compact' || compact ? 'compact' : 'full');

  const isCompactMode = effectiveMode === 'compact';

  const handleSaveClick = () => {
    triggerSave(() => {
      if (onSave) {
        onSave();
      } else {
        saveAllData();
      }
    });
  };

  const handleUpdateClick = () => {
    if (onUpdate) {
      onUpdate();
    } else if (onSave) {
      onSave();
    } else {
      showSaveNotification('Data berhasil diperbarui!');
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      setInternalEditing(!internalEditing);
      showSaveNotification(!internalEditing ? 'Mode Edit diaktifkan!' : 'Mode Edit dinonaktifkan.');
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      setInternalEditing(false);
      showSaveNotification('Perubahan dibatalkan / pilihan direset.');
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
    } else {
      showSaveNotification('Pilih data terlebih dahulu untuk dihapus.');
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onImport) {
        onImport(file);
      } else {
        try {
          const res = await parseAndImportTemplate(file, undefined, appContext);
          if (res.success) {
            showSaveNotification(res.message);
          } else {
            alert(`Gagal Impor: ${res.message}`);
          }
        } catch (err: any) {
          alert(`Gagal membaca file: ${err.message || 'Format tidak dikenali'}`);
        }
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleUploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onUpload) {
        onUpload(file);
      } else {
        try {
          const res = await parseAndImportTemplate(file, undefined, appContext);
          if (res.success) {
            showSaveNotification(res.message);
          } else {
            showSaveNotification(`File lampiran "${file.name}" berhasil diunggah!`);
          }
        } catch (err: any) {
          alert(`Gagal membaca file: ${err.message || 'Format tidak dikenali'}`);
        }
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleExportClick = () => {
    if (onExport) {
      onExport();
    } else {
      showSaveNotification('Mengekspor data tabel ke format Excel (.xlsx)...');
    }
  };

  const handleClearClick = () => {
    if (onClear) {
      onClear();
    } else {
      if (importFileRef.current) importFileRef.current.value = '';
      if (uploadFileRef.current) uploadFileRef.current.value = '';
      showSaveNotification('Input dan file berhasil dibersihkan.');
    }
  };

  const handleUndo = () => {
    if (onUndo) onUndo();
    else undo();
  };

  const handleRedo = () => {
    if (onRedo) onRedo();
    else redo();
  };

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    else refreshData();
  };

  const handleTemplateClick = () => {
    if (onTemplate) onTemplate();
    else setActiveMenu('template_data');
  };

  const handlePrintClick = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  const handleCopyClick = () => {
    if (onCopy) {
      onCopy();
    } else {
      showSaveNotification('Data tabel berhasil disalin ke clipboard!');
    }
  };

  const handlePreviewClick = () => {
    if (onPreview) {
      onPreview();
    } else {
      openReportPreview();
    }
  };

  // Hitung jumlah tombol sekunder yang aktif tersedia
  const availableSecondaryCount = [
    !hideImport,
    !hideUpload,
    !hideClear,
    !hideUndo,
    !hideRedo,
    !hideRefresh,
    !hideTemplate,
    !hideCopy,
    !hideCancel,
    !hideDelete
  ].filter(Boolean).length;

  // ─────────────────────────────────────────────────────────────
  // 1. TAMPILAN JIKA MODE SEMBUNYI (HIDDEN)
  // Menampilkan bilah ramping minimalis dengan tombol munculkan
  // ─────────────────────────────────────────────────────────────
  if (effectiveMode === 'hidden') {
    return (
      <div
        className={`bg-slate-50/95 hover:bg-slate-100/95 border border-dashed border-slate-300 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5 no-print transition-all shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          {title ? (
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
              {title}
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Menu Data
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
              {badge}
            </span>
          )}
          {selectedCount !== undefined && selectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
              {selectedCount} item terpilih
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
            (Tombol aksi disembunyikan untuk memaksimalkan ruang tabel)
          </span>
        </div>

        {/* Tombol Cepat di Kanan saat Sembunyi */}
        <div className="ml-auto flex items-center justify-end gap-2">
          {/* Tombol Simpan Cepat tetap tersedia jika perlu */}
          {!hideSave && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saveDisabled || activeSaveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
              title="Simpan cepat data saat ini (Ctrl+S)"
            >
              <Save size={13} />
              <span>{saveLabel}</span>
            </button>
          )}

          {/* Tombol Tampilkan Penuh */}
          <button
            type="button"
            onClick={() => setActionToolbarMode('full')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-102"
            title="Tampilkan kembali bilah tombol aksi lengkap"
          >
            <Eye size={14} className="text-amber-300" />
            <span>Tampilkan Tombol Aksi</span>
          </button>

          {/* Tombol Rampingkan */}
          <button
            type="button"
            onClick={() => setActionToolbarMode('compact')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            title="Buka dalam mode ramping"
          >
            <Minimize2 size={13} />
            <span className="hidden sm:inline">Ramping</span>
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TAMPILAN PENUH (FULL) ATAU RAMPING (COMPACT)
  // Semua tombol aksi tersusun rapi di sebelah kanan (ml-auto)
  // Dilengkapi toggle Rampingkan / Perluas & Sembunyikan
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`bg-white ${
        isCompactMode ? 'rounded-xl p-2 sm:p-2.5 shadow-2xs gap-1.5' : 'rounded-2xl p-3 sm:p-4 shadow-xs gap-2.5'
      } border border-slate-200 flex flex-col no-print transition-all ${className}`}
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImportFileChange}
        accept={importAccept}
        className="hidden"
      />
      <input
        type="file"
        ref={uploadFileRef}
        onChange={handleUploadFileChange}
        accept={uploadAccept}
        className="hidden"
      />

      {/* Baris Utama: Judul/Status di Kiri, Tombol Aksi Tersusun Rapi di Kanan */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* SISI KIRI: Judul Menu, Badge, Status Edit/Pilihan */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {title ? (
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
              {title}
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Aksi Data:
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
              {badge}
            </span>
          )}
          {selectedCount !== undefined && selectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
              {selectedCount} terpilih
            </span>
          )}
          {activeIsEditing && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
              Mode Edit Aktif
            </span>
          )}
          {isCompactMode && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
              Ramping
            </span>
          )}
        </div>

        {/* SISI KANAN: SEMUA TOMBOL AKSI TERSUSUN RAPI DI SAMPING KANAN */}
        <div className="ml-auto flex items-center justify-end flex-wrap gap-1 sm:gap-1.5">
          {/* ── KELOMPOK 1: AKSI UTAMA (SIMPAN, UPDATE, EDIT) ── */}

          {/* 1. SIMPAN */}
          {!hideSave && (
            <div className="inline-flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={saveDisabled || activeSaveStatus === 'saving'}
                className={`inline-flex items-center gap-1 ${
                  isCompactMode ? 'px-2.5 py-1 rounded-lg' : 'px-3 py-1.5 rounded-xl'
                } font-bold text-xs shadow-2xs transition-all cursor-pointer ${
                  saveDisabled || activeSaveStatus === 'saving'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 hover:scale-102'
                }`}
                title="Simpan data ke sistem (Ctrl+S)"
              >
                <Save size={13} />
                <span>{saveLabel}</span>
              </button>
              <SaveStatusIndicator
                status={activeSaveStatus}
                compact={compact || isCompactMode}
                lastSavedText={lastSavedTime}
              />
            </div>
          )}

          {/* 2. UPDATE */}
          {!hideUpdate && (
            <button
              type="button"
              onClick={handleUpdateClick}
              disabled={updateDisabled}
              className={`inline-flex items-center gap-1 ${
                isCompactMode ? 'px-2.5 py-1 rounded-lg' : 'px-3 py-1.5 rounded-xl'
              } font-bold text-xs shadow-2xs transition-all cursor-pointer ${
                updateDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 hover:scale-102'
              }`}
              title="Update dan perbarui data terpilih"
            >
              <CheckCircle size={13} />
              <span>{updateLabel}</span>
            </button>
          )}

          {/* 3. EDIT */}
          {!hideEdit && (
            <button
              type="button"
              onClick={handleEditClick}
              disabled={editDisabled}
              className={`inline-flex items-center gap-1 ${
                isCompactMode ? 'px-2.5 py-1 rounded-lg' : 'px-3 py-1.5 rounded-xl'
              } font-bold text-xs shadow-2xs transition-all cursor-pointer border ${
                activeIsEditing
                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold ring-2 ring-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title="Edit data yang aktif atau terpilih"
            >
              <Edit3 size={13} />
              <span>{editLabel}</span>
            </button>
          )}

          {/* Dalam Mode Ramping: Tombol Batal & Hapus hanya tampil jika sedang mengedit atau ada item terpilih */}
          {(!isCompactMode || activeIsEditing) && !hideCancel && (
            <button
              type="button"
              onClick={handleCancelClick}
              className={`inline-flex items-center gap-1 ${
                isCompactMode ? 'px-2 py-1 rounded-lg' : 'px-3 py-1.5 rounded-xl'
              } bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer`}
              title="Batalkan aksi / bersihkan pilihan"
            >
              <X size={13} />
              <span>{cancelLabel}</span>
            </button>
          )}

          {(!isCompactMode || (selectedCount !== undefined && selectedCount > 0)) && !hideDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleteDisabled}
              className={`inline-flex items-center gap-1 ${
                isCompactMode ? 'px-2 py-1 rounded-lg' : 'px-3 py-1.5 rounded-xl'
              } font-bold text-xs shadow-2xs transition-all cursor-pointer ${
                deleteDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-300'
              }`}
              title="Hapus data terpilih"
            >
              <Trash2 size={13} />
              <span>{deleteLabel}</span>
            </button>
          )}

          {/* ── KELOMPOK 2: EXPOR & CETAK & PREVIEW (Tetap tampil di mode ramping untuk kemudahan) ── */}

          {/* 7. EXPOR */}
          {!hideExport && (
            <button
              type="button"
              onClick={handleExportClick}
              className={`inline-flex items-center gap-1 ${
                isCompactMode ? 'px-2 py-1 rounded-lg' : 'px-2.5 py-1.5 rounded-xl'
              } bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors cursor-pointer`}
              title="Expor data ke file Excel (.xlsx) / CSV"
            >
              <FileDown size={13} />
              <span>{exportLabel}</span>
            </button>
          )}

          {/* 14. CETAK */}
          {!hidePrint && (
            <button
              type="button"
              onClick={handlePrintClick}
              className={`inline-flex items-center gap-1 ${
                isCompactMode ? 'px-2 py-1 rounded-lg' : 'px-2.5 py-1.5 rounded-xl'
              } bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer`}
              title="Cetak lembar data ini"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          )}

          {/* 16. PREVIEW RAPOR */}
          {!hidePreview && (
            <button
              type="button"
              onClick={handlePreviewClick}
              className={`inline-flex items-center gap-1 ${
                isCompactMode ? 'px-2.5 py-1 rounded-lg' : 'px-3 py-1.5 rounded-xl'
              } bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer ring-1 ring-purple-300 hover:scale-102`}
              title="Pratinjau lembar rapor lengkap"
            >
              <Eye size={12} className="text-amber-300" />
              <span>{previewLabel}</span>
            </button>
          )}

          {/* ── JIKA DALAM MODE PENUH: Tampilkan juga semua aksi sekunder langsung ── */}
          {!isCompactMode && (
            <>
              <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block" />

              {/* 6. IMPOR */}
              {!hideImport && (
                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                  title="Impor file Excel (.xlsx) atau CSV dari komputer"
                >
                  <FileUp size={14} />
                  <span>{importLabel}</span>
                </button>
              )}

              {/* 8. UPLOAD */}
              {!hideUpload && (
                <button
                  type="button"
                  onClick={() => uploadFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors cursor-pointer"
                  title="Upload dokumen atau berkas lampiran"
                >
                  <Upload size={14} />
                  <span>{uploadLabel}</span>
                </button>
              )}

              {/* 9. BERSIHKAN FILE / INPUT */}
              {!hideClear && (
                <button
                  type="button"
                  onClick={handleClearClick}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  title="Bersihkan input formulir atau file terpilih"
                >
                  <Eraser size={14} />
                  <span>{clearLabel}</span>
                </button>
              )}

              <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block" />

              {/* 10. UNDO */}
              {!hideUndo && (
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                    canUndo
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Undo (Batalkan aksi perubahan terakhir)"
                >
                  <RotateCcw size={13} />
                  <span>Undo</span>
                </button>
              )}

              {/* 11. REDO */}
              {!hideRedo && (
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                    canRedo
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Redo (Ulangi kembali aksi perubahan)"
                >
                  <RotateCw size={13} />
                  <span>Redo</span>
                </button>
              )}

              {/* 12. REFRES */}
              {!hideRefresh && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  title="Refres (Segarkan tampilan dan muat ulang data)"
                >
                  <RefreshCw size={13} />
                  <span>Refres</span>
                </button>
              )}

              {/* 13. TEMPLATE */}
              {!hideTemplate && (
                <button
                  type="button"
                  onClick={handleTemplateClick}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  title="Lihat atau unduh template tabel standar resmi"
                >
                  <FileSpreadsheet size={13} />
                  <span>{templateLabel}</span>
                </button>
              )}

              {/* 15. SALIN */}
              {!hideCopy && (
                <button
                  type="button"
                  onClick={handleCopyClick}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  title="Salin data tabel ke clipboard"
                >
                  <Copy size={13} />
                  <span>Salin</span>
                </button>
              )}
            </>
          )}

          {/* ── JIKA DALAM MODE RAMPING: Tombol Toggle Dropdown / Ekspansi Aksi Lainnya ── */}
          {isCompactMode && availableSecondaryCount > 0 && (
            <button
              type="button"
              onClick={() => setLocalSecondaryExpanded(!localSecondaryExpanded)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                localSecondaryExpanded
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Tampilkan / sembunyikan aksi pendukung (Impor, Undo, Template, dll)"
            >
              <span>Aksi Lainnya ({availableSecondaryCount})</span>
              {localSecondaryExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {/* Pembatas Elemen Kontrol */}
          <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

          {/* ── KELOMPOK KONTROL BILAH: RAMPINGKAN / PERLUAS & SEMBUNYIKAN ── */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-300 shadow-2xs">
            {isCompactMode ? (
              <button
                type="button"
                onClick={() => setActionToolbarMode('full')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Perluas bilah aksi secara penuh (tampilkan semua tombol)"
              >
                <Maximize2 size={12} />
                <span className="hidden sm:inline">Perluas</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActionToolbarMode('compact')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Rampingkan bilah aksi (hanya tombol-tombol utama)"
              >
                <Minimize2 size={12} />
                <span className="hidden sm:inline">Rampingkan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActionToolbarMode('hidden')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sembunyikan bilah aksi (kasih hilang)"
            >
              <EyeOff size={12} />
              <span className="hidden sm:inline">Hilangkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tray Ekspansi Sekunder saat Mode Ramping jika dibuka user */}
      {isCompactMode && localSecondaryExpanded && (
        <div className="pt-2.5 mt-1 border-t border-slate-100 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 animate-fadeIn bg-slate-50/60 p-2 rounded-xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-auto">
            Aksi Pendukung:
          </span>

          {/* 6. IMPOR */}
          {!hideImport && (
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              title="Impor file Excel (.xlsx) atau CSV dari komputer"
            >
              <FileUp size={13} />
              <span>{importLabel}</span>
            </button>
          )}

          {/* 8. UPLOAD */}
          {!hideUpload && (
            <button
              type="button"
              onClick={() => uploadFileRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 transition-colors cursor-pointer"
              title="Upload dokumen atau berkas lampiran"
            >
              <Upload size={13} />
              <span>{uploadLabel}</span>
            </button>
          )}

          {/* 9. BERSIHKAN FILE / INPUT */}
          {!hideClear && (
            <button
              type="button"
              onClick={handleClearClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
              title="Bersihkan input formulir atau file terpilih"
            >
              <Eraser size={13} />
              <span>{clearLabel}</span>
            </button>
          )}

          {/* 10. UNDO */}
          {!hideUndo && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                canUndo
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
              title="Undo"
            >
              <RotateCcw size={12} />
              <span>Undo</span>
            </button>
          )}

          {/* 11. REDO */}
          {!hideRedo && (
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                canRedo
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
              title="Redo"
            >
              <RotateCw size={12} />
              <span>Redo</span>
            </button>
          )}

          {/* 12. REFRES */}
          {!hideRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
              title="Refres"
            >
              <RefreshCw size={12} />
              <span>Refres</span>
            </button>
          )}

          {/* 13. TEMPLATE */}
          {!hideTemplate && (
            <button
              type="button"
              onClick={handleTemplateClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 transition-colors cursor-pointer"
              title="Template data"
            >
              <FileSpreadsheet size={12} />
              <span>{templateLabel}</span>
            </button>
          )}

          {/* 15. SALIN */}
          {!hideCopy && (
            <button
              type="button"
              onClick={handleCopyClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Salin data tabel"
            >
              <Copy size={12} />
              <span>Salin</span>
            </button>
          )}

          {/* 4. BATAL */}
          {!hideCancel && !activeIsEditing && (
            <button
              type="button"
              onClick={handleCancelClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
              title="Batal / reset"
            >
              <X size={12} />
              <span>{cancelLabel}</span>
            </button>
          )}

          {/* 5. HAPUS */}
          {!hideDelete && !(selectedCount !== undefined && selectedCount > 0) && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleteDisabled}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                deleteDisabled
                  ? 'bg-white text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border-rose-300'
              }`}
              title="Hapus data"
            >
              <Trash2 size={12} />
              <span>{deleteLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
