import React from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
  compact?: boolean;
  /** Label saat proses menyimpan */
  savingLabel?: string;
  /** Label saat berhasil disimpan */
  savedLabel?: string;
  /** Apakah menampilkan teks/indikator saat idle */
  showIdle?: boolean;
  idleLabel?: string;
  /** Waktu simpan terakhir (opsional) */
  lastSavedText?: string;
}

/**
 * Komponen indikator status penyimpanan instan (Saving..., Saved)
 * Diletakkan di samping setiap tombol simpan agar pengguna mendapatkan
 * feedback visual yang jelas dan responsif saat data berhasil disimpan.
 */
export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  className = '',
  compact = false,
  savingLabel = 'Saving...',
  savedLabel = 'Saved',
  showIdle = false,
  idleLabel = 'Tersimpan',
  lastSavedText
}) => {
  if (status === 'idle' && !showIdle) {
    return null;
  }

  if (status === 'saving') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 transition-all select-none animate-in fade-in zoom-in-95 duration-150 ${
          compact
            ? 'px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-400/40 text-[11px] font-bold'
            : 'px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold shadow-xs'
        } ${className}`}
        title="Sedang menyimpan data ke sistem..."
      >
        <Loader2
          size={compact ? 12 : 14}
          className="animate-spin text-blue-600 shrink-0"
        />
        <span className="tracking-wide flex items-center gap-1">
          <span>{savingLabel}</span>
          <span className="flex space-x-0.5">
            <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </span>
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 transition-all select-none animate-in fade-in zoom-in-90 duration-200 ${
          compact
            ? 'px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-[11px] font-black'
            : 'px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-black shadow-xs'
        } ${className}`}
        title={lastSavedText ? `Berhasil disimpan (${lastSavedText})` : 'Data berhasil disimpan ke database lokal'}
      >
        <CheckCircle2
          size={compact ? 12 : 14}
          className="text-emerald-600 shrink-0 animate-in zoom-in-50 duration-200"
        />
        <span className="tracking-wide">{savedLabel}</span>
        {lastSavedText && !compact && (
          <span className="text-[10px] font-medium text-emerald-700/80 hidden md:inline ml-0.5">
            ({lastSavedText})
          </span>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        role="status"
        aria-live="assertive"
        className={`inline-flex items-center gap-1.5 transition-all select-none animate-in fade-in duration-150 ${
          compact
            ? 'px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/40 text-[11px] font-bold'
            : 'px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>Gagal</span>
      </div>
    );
  }

  // Idle with showIdle=true
  return (
    <div
      className={`inline-flex items-center gap-1 text-slate-400 text-xs select-none ${className}`}
    >
      <Clock size={compact ? 11 : 12} className="opacity-60" />
      <span className="text-[11px] font-medium">{idleLabel}</span>
    </div>
  );
};
