import React from 'react';
import { Award, BookOpen, GraduationCap, MapPin, Phone, ShieldCheck, X } from 'lucide-react';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-3 border-amber-300 shadow-lg bg-emerald-900 flex items-center justify-center overflow-hidden shrink-0">
              {/* Profile Avatar / Emblem */}
              <div className="text-center font-bold text-amber-200 flex flex-col items-center justify-center">
                <GraduationCap size={32} className="text-amber-300 mb-0.5" />
                <span className="text-[10px] tracking-wider uppercase">Gr. Papuan</span>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold mb-1 border border-amber-300/30">
                <Award size={12} /> Pengembang Aplikasi
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Selpius Nabyal, S.Pd.Gr.</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Guru Profesional & Pendidik Putra Daerah Pegunungan Bintang
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900">
            <p className="text-xs leading-relaxed italic">
              &quot;Aplikasi Rapor Kurikulum Merdeka SD Negeri Balil didesain khusus untuk mendukung bapak/ibu guru di daerah 3T (Terdepan, Terluar, Tertinggal) agar pengelolaan rapor peserta didik tetap akurat, terstruktur, dan dapat bekerja secara optimal tanpa bergantung pada koneksi internet penuh.&quot;
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <GraduationCap className="text-emerald-600 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-semibold text-slate-900 block">Kualifikasi Akademik & Profesi:</span>
                <span className="text-slate-600">S1 Pendidikan Guru Sekolah Dasar (S.Pd.), Guru Profesional (Gr.)</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <MapPin className="text-rose-600 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-semibold text-slate-900 block">Unit Kerja & Wilayah Dedikasi:</span>
                <span className="text-slate-600">SD Negeri Balil, Distrik Oksibil, Kabupaten Pegunungan Bintang, Provinsi Papua Pegunungan</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <BookOpen className="text-blue-600 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-semibold text-slate-900 block">Fokus Pengembangan:</span>
                <span className="text-slate-600">Digitalisasi Rapor Kurikulum Merdeka, Modul P5, dan Manajemen Pendidikan Sekolah Dasar</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <ShieldCheck className="text-purple-600 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-semibold text-slate-900 block">Lisensi & Hak Cipta:</span>
                <span className="text-slate-600">Edisi Khusus Tahun Pelajaran 2026/2027 SD Negeri Balil</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
            >
              Tutup Informasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
