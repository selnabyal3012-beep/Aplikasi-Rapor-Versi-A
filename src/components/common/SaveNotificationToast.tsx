import React from 'react';
import { CheckCircle2, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SaveNotificationToast: React.FC = () => {
  const { saveNotificationMessage, clearSaveNotification } = useApp();

  if (!saveNotificationMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300 no-print">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border-2 border-emerald-400/80 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 size={24} className="text-emerald-400 animate-pulse" />
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-400">
            <Sparkles size={12} className="text-amber-400" />
            <span>Catatan Konfirmasi Simpan</span>
          </div>
          <div className="text-sm font-extrabold text-white mt-1 leading-snug tracking-wide">
            &ldquo;{saveNotificationMessage}&rdquo;
          </div>
          <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Data berhasil tersimpan dengan aman ke dalam aplikasi.</span>
          </div>
        </div>

        <button
          onClick={clearSaveNotification}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          title="Tutup catatan"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
