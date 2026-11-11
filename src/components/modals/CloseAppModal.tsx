import React from 'react';
import { AlertCircle, Download, Power, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CloseAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloseAppModal: React.FC<CloseAppModalProps> = ({ isOpen, onClose }) => {
  const { exportDatabaseJson } = useApp();

  if (!isOpen) return null;

  const handleCloseWindow = () => {
    // Try closing the tab/window or reload/redirect to blank
    try {
      window.close();
    } catch {}
    // If browser prevents window.close(), show feedback
    alert('Aplikasi siap ditutup. Anda dapat menutup tab atau jendela browser Anda sekarang dengan aman. Semua data Anda di SD Negeri Balil telah tersimpan.');
    onClose();
  };

  const handleBackupAndClose = () => {
    exportDatabaseJson();
    setTimeout(() => {
      handleCloseWindow();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-rose-700 via-red-700 to-amber-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Power size={24} className="text-rose-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tutup Aplikasi Rapor</h2>
              <p className="text-xs text-rose-100">SD NEGERI BALIL - 2026/2027</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 text-sm text-slate-700">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Semua data tersimpan otomatis:</span>
              Seluruh data nilai akademik, P5, catatan wali kelas, dan kehadiran siswa telah tersimpan di memori perangkat Anda.
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Sebelum keluar, apakah Anda ingin mengunduh cadangan (backup) database terbaru untuk keamanan ekstra di flashdisk atau drive Anda?
          </p>

          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleBackupAndClose}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
            >
              <Download size={14} /> Cadangkan & Tutup
            </button>
            <button
              onClick={handleCloseWindow}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
            >
              <Power size={14} /> Tutup Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
