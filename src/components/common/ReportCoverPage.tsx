import React from 'react';
import { SchoolIdentity, Student } from '../../types';
import { LogoTutWuriHandayani, LogoKabupaten } from './OfficialLogos';
import { useApp } from '../../context/AppContext';

interface ReportCoverPageProps {
  sekolah: SchoolIdentity;
  student: Student;
  paperSize?: 'F4' | 'A4';
  fontFamily?: string;
  fontSize?: string;
}

export const ReportCoverPage: React.FC<ReportCoverPageProps> = ({
  sekolah,
  student,
  paperSize = 'F4',
  fontFamily,
  fontSize
}) => {
  const { printFontFamily, printFontSize } = useApp();
  const effectiveFont = fontFamily || printFontFamily || 'Times New Roman';
  const effectiveSize = fontSize || printFontSize || '11pt';

  return (
    <div
      className={`report-cover-page report-typography-scope bg-white text-slate-900 mx-auto printable-area print-avoid-break select-none box-border flex flex-col justify-between ${
        paperSize === 'F4' ? 'min-h-[1050px]' : 'min-h-[960px]'
      }`}
      style={{
        boxSizing: 'border-box',
        padding: '24px',
        width: '100%',
        height: '100%',
        fontFamily: effectiveFont
      }}
    >
      {/* BINGKAI GANDA DENGAN SUDUT ORNAMEN ELEGAN (TIDAK AKAN PECAH / BERGESER SAAT PRINT) */}
      <div className="w-full h-full border-[3px] border-black p-1 box-border flex flex-col justify-between bg-white flex-1">
        <div className="w-full h-full border border-black p-6 sm:p-8 relative box-border flex flex-col justify-between bg-white flex-1">
          {/* Sudut Ornamen Kiri Atas */}
          <svg className="absolute -top-1 -left-1 w-11 h-11 text-black pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,0 L100,0 C70,10 60,30 50,50 C40,70 20,80 0,100 Z" opacity="0.9" />
            <circle cx="18" cy="18" r="6" />
            <circle cx="36" cy="12" r="4" />
            <circle cx="12" cy="36" r="4" />
          </svg>
          {/* Sudut Ornamen Kanan Atas */}
          <svg className="absolute -top-1 -right-1 w-11 h-11 text-black pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
            <path d="M100,0 L0,0 C30,10 40,30 50,50 C60,70 80,80 100,100 Z" opacity="0.9" />
            <circle cx="82" cy="18" r="6" />
            <circle cx="64" cy="12" r="4" />
            <circle cx="88" cy="36" r="4" />
          </svg>
          {/* Sudut Ornamen Kiri Bawah */}
          <svg className="absolute -bottom-1 -left-1 w-11 h-11 text-black pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,100 L100,100 C70,90 60,70 50,50 C40,30 20,20 0,0 Z" opacity="0.9" />
            <circle cx="18" cy="82" r="6" />
            <circle cx="36" cy="88" r="4" />
            <circle cx="12" cy="64" r="4" />
          </svg>
          {/* Sudut Ornamen Kanan Bawah */}
          <svg className="absolute -bottom-1 -right-1 w-11 h-11 text-black pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
            <path d="M100,100 L0,100 C30,90 40,70 50,50 C60,30 80,20 100,0 Z" opacity="0.9" />
            <circle cx="82" cy="82" r="6" />
            <circle cx="64" cy="88" r="4" />
            <circle cx="88" cy="64" r="4" />
          </svg>

          {/* 1. BAGIAN ATAS: LOGO PEMDA KABUPATEN + JUDUL RAPOR */}
          <div className="w-full text-center pt-2 sm:pt-4">
            <div className="w-full flex justify-center items-center mb-3">
              <LogoKabupaten
                url={sekolah.logoKiriUrl}
                size={105}
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-sm"
                label="Logo Pemda Kabupaten Pegunungan Bintang"
              />
            </div>

            {/* JUDUL RESMI BUKU RAPOR */}
            <div className="space-y-1 mt-2 text-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-widest uppercase text-black font-serif">
                RAPOR
              </h1>
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-black font-serif">
                PESERTA DIDIK
              </h2>
              <h3 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-black font-serif">
                SEKOLAH DASAR
              </h3>
              <h4 className="text-xl sm:text-2xl font-black uppercase text-black font-serif">
                (SD)
              </h4>
            </div>
          </div>

          {/* 2. BAGIAN TENGAH: LOGO BESAR TUT WURI HANDAYANI */}
          <div className="w-full text-center my-4 sm:my-6">
            <div className="w-full flex justify-center items-center">
              <LogoTutWuriHandayani
                url={sekolah.logoKananUrl}
                size={130}
                className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                label="Logo Tut Wuri Handayani"
              />
            </div>
          </div>

          {/* 3. KOTAK NAMA SISWA & NISN/NIS (PERSIS SEPERTI GAMBAR ASLI) */}
          <div className="w-full max-w-md mx-auto px-4 space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-serif font-bold text-black mb-1.5 text-center">
                Nama Peserta Didik :
              </p>
              <div className="border-2 border-black py-2.5 px-4 text-center bg-white">
                <span className="text-base sm:text-lg font-black uppercase text-black tracking-wider font-serif">
                  {student.namaSiswa}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-serif font-bold text-black mb-1.5 text-center">
                NISN/NIS
              </p>
              <div className="border-2 border-black py-2 px-4 text-center bg-white">
                <span className="text-sm sm:text-base font-bold font-mono text-black tracking-widest">
                  {student.nisn && !student.nisn.startsWith('BLM_') && student.nisn !== '-'
                    ? student.nisn
                    : '3137319436'}
                  /{student.nis && student.nis !== '-' ? student.nis : '_'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. BAGIAN BAWAH: KEMENDIKBUD RISTEK REPUBLIK INDONESIA */}
          <div className="w-full text-center pb-4 sm:pb-6 pt-4">
            <h3 className="text-base sm:text-lg font-serif font-black tracking-widest uppercase text-black">
              KEMENDIKBUD RISTEK
            </h3>
            <h4 className="text-sm sm:text-base font-serif font-bold tracking-wider uppercase text-black mt-0.5">
              REPUBLIK INDONESIA
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
