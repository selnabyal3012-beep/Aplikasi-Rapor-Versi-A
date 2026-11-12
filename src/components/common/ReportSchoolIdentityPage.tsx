import React from 'react';
import { SchoolIdentity, PaperSize } from '../../types';
import { useApp } from '../../context/AppContext';

interface ReportSchoolIdentityPageProps {
  sekolah: SchoolIdentity;
  paperSize?: PaperSize | string;
  fontFamily?: string;
  fontSize?: string;
}

export const ReportSchoolIdentityPage: React.FC<ReportSchoolIdentityPageProps> = ({
  sekolah,
  paperSize = 'F4',
  fontFamily,
  fontSize
}) => {
  const { printFontFamily, printFontSize } = useApp();
  const effectiveFont = fontFamily || printFontFamily || 'Times New Roman';
  const effectiveSize = fontSize || printFontSize || '11pt';

  return (
    <div
      className={`report-typography-scope bg-white text-slate-900 mx-auto printable-area print-avoid-break select-none box-border flex flex-col justify-between print:bg-white ${
        paperSize === 'F4' ? 'min-h-[1050px]' : 'min-h-[960px]'
      }`}
      style={{
        boxSizing: 'border-box',
        padding: '48px 40px 48px 40px',
        width: '100%',
        fontFamily: effectiveFont,
        fontSize: effectiveSize
      }}
    >
      <div>
        {/* JUDUL HALAMAN PERSIS SEPERTI GAMBAR "Halaman kedua.png" */}
        <div className="text-center pt-8 pb-14 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-black">
            RAPOR
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-black">
            PESERTA DIDIK
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-black">
            SEKOLAH DASAR
          </h3>
          <h4 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-black">
            (SD)
          </h4>
        </div>

        {/* FORM IDENTITAS SATUAN PENDIDIKAN DENGAN TITIK DUA RATA */}
        <div className="max-w-2xl mx-auto pl-4 sm:pl-10 text-base sm:text-lg leading-relaxed text-black space-y-3.5">
          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">Nama Sekolah</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="font-bold flex-1">{sekolah.namaSekolah || 'SD Negeri Balil'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">NISN/NIS/NSS</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1 font-mono">{sekolah.nss || '_'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">NPSN</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="font-bold font-mono flex-1">{sekolah.npsn || '69970290'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">Alamat Sekolah</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1">{sekolah.alamat || 'Jl.Betaabib Kabiding'}</span>
          </div>

          <div className="flex items-center">
            <span className="w-48 sm:w-56 shrink-0 font-bold" />
            <span className="w-6 text-center shrink-0" />
            <div className="flex-1 flex gap-8">
              <span>
                <span className="underline">Kode Pos. {sekolah.kodePos || '99573'}</span>
              </span>
              <span>
                Telp. {sekolah.telepon || '_'}
              </span>
            </div>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">Kelurahan/Desa</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1">{sekolah.desaKelurahan || 'Kabiding'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">Kecamatan</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1">{sekolah.distrikKecamatan || 'Oksibil'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">Kabupaten/Kota</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1">{sekolah.kabupaten || 'Pegunungan Bintang'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">Provinsi</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1">{sekolah.provinsi || 'Papua Pegunungan'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">Website</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1">{sekolah.website || '_'}</span>
          </div>

          <div className="flex">
            <span className="w-48 sm:w-56 font-bold shrink-0">E-mail</span>
            <span className="w-6 text-center font-bold shrink-0">:</span>
            <span className="flex-1">{sekolah.emailSekolah || '_'}</span>
          </div>
        </div>
      </div>

      {/* Bagian Bawah Kaki Halaman (Page 2) */}
      <div className="text-center text-xs text-slate-400 font-serif pb-4">
        <span>Halaman 2 — Rapor Peserta Didik (Identitas Satuan Pendidikan)</span>
      </div>
    </div>
  );
};
