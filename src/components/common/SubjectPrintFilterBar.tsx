import React, { useState } from 'react';
import {
  BookMarked,
  CheckCircle2,
  CheckSquare,
  Square,
  Filter,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SubjectPrintFilterBarProps {
  className?: string;
  compact?: boolean;
}

export const SubjectPrintFilterBar: React.FC<SubjectPrintFilterBarProps> = ({
  className = '',
  compact = false
}) => {
  const {
    db,
    selectedMapelForPrint,
    toggleMapelForPrint,
    setMapelPrintPreset,
    isMapelActiveForPrint,
    printableMataPelajaran
  } = useApp();

  const [isOpen, setIsOpen] = useState(!compact);

  const totalMapel = db.mataPelajaran.length;
  const activeCount = printableMataPelajaran.length;

  const wajibCount = db.mataPelajaran.filter((m) => m.kelompok === 'Wajib').length;
  const pilihanCount = db.mataPelajaran.filter((m) => m.kelompok === 'Pilihan').length;
  const mulokCount = db.mataPelajaran.filter((m) => m.kelompok === 'Muatan Lokal').length;

  const activePilihanCount = printableMataPelajaran.filter((m) => m.kelompok === 'Pilihan').length;
  const activeMulokCount = printableMataPelajaran.filter((m) => m.kelompok === 'Muatan Lokal').length;

  return (
    <div
      className={`bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/70 border border-blue-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 no-print transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <BookMarked size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Filter size={13} className="text-blue-600" />
                Filter Mata Pelajaran Pilihan (Sesuai Keadaan Sekolah)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                {activeCount} dari {totalMapel} Mapel Dicetak
              </span>
              {activePilihanCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  {activePilihanCount} Mapel Pilihan Aktif
                </span>
              )}
              {activeMulokCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeMulokCount} Mulok Aktif
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sesuaikan mata pelajaran yang dicantumkan pada rapor dengan keadaan guru & muatan di satuan pendidikan Anda. Nomor urut rapor akan otomatis rapi (1, 2, 3...).
            </p>
          </div>
        </div>

        {/* Toggle Collapse & Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapelPrintPreset('semua')}
            title="Kembalikan ke semua mata pelajaran aktif"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset Semua</span>
          </button>
          {compact && (
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs cursor-pointer"
            >
              <span>{isOpen ? 'Tutup Pilihan' : 'Ubah Pilihan Mapel'}</span>
              {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      {isOpen && (
        <div className="space-y-3 pt-2 border-t border-blue-100/80">
          {/* Quick Presets Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1 mr-1">
              <Sparkles size={13} className="text-amber-500" />
              Preset Cepat Keadaan:
            </span>

            <button
              type="button"
              onClick={() => setMapelPrintPreset('semua')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeCount === totalMapel
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ⚡ Semua Mapel (Lengkap: {totalMapel})
            </button>

            <button
              type="button"
              onClick={() => setMapelPrintPreset('wajib_saja')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeCount === wajibCount && activePilihanCount === 0 && activeMulokCount === 0
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
              }`}
              title="Gunakan jika sekolah hanya mengajarkan mata pelajaran wajib"
            >
              📌 Hanya Mapel Wajib ({wajibCount} Mapel)
            </button>

            <button
              type="button"
              onClick={() => setMapelPrintPreset('wajib_pilihan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activePilihanCount > 0 && activeMulokCount === 0
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
              }`}
              title="Wajib ditambah Bahasa Inggris (Pilihan)"
            >
              🇬🇧 Wajib + Bhs Inggris (Pilihan)
            </button>

            <button
              type="button"
              onClick={() => setMapelPrintPreset('wajib_mulok')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeMulokCount > 0 && activePilihanCount === 0
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
              }`}
              title="Wajib ditambah Muatan Lokal (Bahasa Daerah & Noken Papua)"
            >
              🌿 Wajib + Muatan Lokal (Papua)
            </button>
          </div>

          {/* Subject Badges Checkbox Grid */}
          <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info size={12} className="text-blue-500" />
                Klik tombol mata pelajaran di bawah untuk mencentang/membatalkan cetak rapor:
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Aktif: {activeCount} Mapel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {db.mataPelajaran.map((m, idx) => {
                const isActive = isMapelActiveForPrint(m.mataPelajaran);
                const isPilihan = m.kelompok === 'Pilihan';
                const isMulok = m.kelompok === 'Muatan Lokal';

                return (
                  <button
                    key={m.kode || m.mataPelajaran || idx}
                    type="button"
                    onClick={() => toggleMapelForPrint(m.mataPelajaran)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? isPilihan
                          ? 'bg-purple-50/80 border-purple-300 text-purple-950 shadow-2xs hover:bg-purple-100/70'
                          : isMulok
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs hover:bg-emerald-100/70'
                          : 'bg-blue-50/80 border-blue-300 text-slate-900 shadow-2xs hover:bg-blue-100/70'
                        : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-slate-100/80 line-through opacity-70'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isActive ? (
                        <CheckSquare
                          size={15}
                          className={
                            isPilihan
                              ? 'text-purple-600'
                              : isMulok
                              ? 'text-emerald-600'
                              : 'text-blue-600'
                          }
                        />
                      ) : (
                        <Square size={15} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold leading-tight break-words">
                          {m.mataPelajaran}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            isPilihan
                              ? 'bg-purple-200 text-purple-900 font-black'
                              : isMulok
                              ? 'bg-emerald-200 text-emerald-900 font-black'
                              : 'bg-blue-200/90 text-blue-900'
                          }`}
                        >
                          {m.kelompok}
                        </span>
                        {!isActive && (
                          <span className="text-[9px] text-rose-600 font-bold">
                            (Dilewati / Tidak Dicetak)
                          </span>
                        )}
                        {isActive && isPilihan && (
                          <span className="text-[9px] text-purple-700 font-semibold">
                            ✓ Dicetak di Rapor
                          </span>
                        )}
                        {isActive && isMulok && (
                          <span className="text-[9px] text-emerald-700 font-semibold">
                            ✓ Dicetak di Rapor
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
