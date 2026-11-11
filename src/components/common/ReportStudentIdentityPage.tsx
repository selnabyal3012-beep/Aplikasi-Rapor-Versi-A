import React from 'react';
import { SchoolIdentity, Student } from '../../types';
import { useApp } from '../../context/AppContext';

interface ReportStudentIdentityPageProps {
  sekolah: SchoolIdentity;
  student: Student;
  paperSize?: 'F4' | 'A4';
  fontFamily?: string;
  fontSize?: string;
}

function formatDateIndo(dateStr?: string): string {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export const ReportStudentIdentityPage: React.FC<ReportStudentIdentityPageProps> = ({
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
      className={`report-typography-scope bg-white text-slate-900 mx-auto printable-area print-avoid-break select-none box-border flex flex-col justify-between print:bg-white ${
        paperSize === 'F4' ? 'min-h-[1050px]' : 'min-h-[960px]'
      }`}
      style={{
        boxSizing: 'border-box',
        padding: '36px 36px 32px 36px',
        width: '100%',
        fontFamily: effectiveFont,
        fontSize: effectiveSize
      }}
    >
      <div>
        {/* JUDUL HALAMAN PERSIS SEPERTI GAMBAR "halaman Ketiga.png" */}
        <div className="text-center pt-2 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-wider uppercase text-black">
            IDENTITAS PESERTA DIDIK
          </h1>
        </div>

        {/* LIST BIODATA IDENTITAS PESERTA DIDIK */}
        <div className="max-w-3xl mx-auto text-xs sm:text-[13px] leading-relaxed text-black space-y-2">
          {/* 1. Nama Peserta Didik */}
          <div className="flex">
            <span className="w-52 shrink-0">Nama Peserta Didik</span>
            <span className="w-5 text-center shrink-0">:</span>
            <span className="font-bold flex-1 uppercase tracking-wide">
              {student.namaSiswa || 'MANUELA A.SESILIA KASIPMABIN'}
            </span>
          </div>

          {/* 2. NISN/NIS */}
          <div className="flex">
            <span className="w-52 shrink-0">NISN/NIS</span>
            <span className="w-5 text-center shrink-0">:</span>
            <span className="font-mono flex-1 font-bold">
              {student.nisn && !student.nisn.startsWith('BLM_') && student.nisn !== '-'
                ? student.nisn
                : '3137319436'}
              /{student.nis && student.nis !== '-' ? student.nis : '_'}
            </span>
          </div>

          {/* 3. Tempat, Tanggal Lahir */}
          <div className="flex">
            <span className="w-52 shrink-0">Tempat, Tanggal Lahir</span>
            <span className="w-5 text-center shrink-0">:</span>
            <span className="flex-1">
              {student.tempatLahir || 'Mabilabol'}, {formatDateIndo(student.tanggalLahir) || '6 November 2013'}
            </span>
          </div>

          {/* 4. Jenis Kelamin */}
          <div className="flex">
            <span className="w-52 shrink-0">Jenis Kelamin</span>
            <span className="w-5 text-center shrink-0">:</span>
            <span className="flex-1">
              {student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
          </div>

          {/* 5. Agama */}
          <div className="flex">
            <span className="w-52 shrink-0">Agama</span>
            <span className="w-5 text-center shrink-0">:</span>
            <span className="flex-1">{student.agama || 'Katolik'}</span>
          </div>

          {/* 6. Pendidikan Sebelumnya */}
          <div className="flex">
            <span className="w-52 shrink-0">Pendidikan Sebelumnya</span>
            <span className="w-5 text-center shrink-0">:</span>
            <span className="flex-1">{student.sekolahAsal || '_'}</span>
          </div>

          {/* 7. Alamat Peserta Didik */}
          <div className="flex">
            <span className="w-52 shrink-0">Alamat Peserta Didik</span>
            <span className="w-5 text-center shrink-0">:</span>
            <span className="flex-1">{student.alamat || 'Oksibil'}</span>
          </div>

          {/* 8. Nama Orang Tua */}
          <div>
            <div className="font-semibold text-black">Nama Orang Tua</div>
            <div className="pl-4 space-y-1 mt-1">
              <div className="flex">
                <span className="w-48 shrink-0">Ayah</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="font-bold flex-1 uppercase">
                  {student.namaAyah || 'FRENGKY A KASIPMABIN'}
                </span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Ibu</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="font-bold flex-1">
                  {student.namaIbu || 'Anita Sitaup'}
                </span>
              </div>
            </div>
          </div>

          {/* 9. Pekerjaan Orang Tua */}
          <div>
            <div className="font-semibold text-black">Pekerjaan Orang Tua</div>
            <div className="pl-4 space-y-1 mt-1">
              <div className="flex">
                <span className="w-48 shrink-0">Ayah</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{student.pekerjaanAyah || '_'}</span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Ibu</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{student.pekerjaanIbu || '_'}</span>
              </div>
            </div>
          </div>

          {/* 10. Alamat Orang Tua */}
          <div>
            <div className="font-semibold text-black">Alamat Orang Tua</div>
            <div className="pl-4 space-y-1 mt-1">
              <div className="flex">
                <span className="w-48 shrink-0">Jalan</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{student.alamat || '_'}</span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Kelurahan/Desa</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{sekolah.desaKelurahan || 'Kabiding'}</span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Kecamatan</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{sekolah.distrikKecamatan || 'Oksibil'}</span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Kabupaten/Kota</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{sekolah.kabupaten || 'Pegunungan Bintang'}</span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Provinsi</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{sekolah.provinsi || 'Papua Pegunungan'}</span>
              </div>
            </div>
          </div>

          {/* 11. Wali Peserta Didik */}
          <div>
            <div className="font-semibold text-black">Wali Peserta Didik</div>
            <div className="pl-4 space-y-1 mt-1">
              <div className="flex">
                <span className="w-48 shrink-0">Nama</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{student.namaWali || '_'}</span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Pekerjaan</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{student.pekerjaanWali || '_'}</span>
              </div>
              <div className="flex">
                <span className="w-48 shrink-0">Alamat</span>
                <span className="w-5 text-center shrink-0">:</span>
                <span className="flex-1">{student.alamatWali || '_'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN BAWAH: KOTAK PAS FOTO 3X4 & TANDA TANGAN KEPALA SEKOLAH */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-end justify-between px-8 sm:px-14">
          {/* Kotak Pas Foto 3x4 */}
          <div className="flex flex-col items-center">
            <div className="w-[30mm] h-[40mm] border-2 border-black flex items-center justify-center bg-slate-50 text-center p-2 text-slate-500 shadow-2xs">
              <span className="text-[11px] font-sans">Pas Foto<br />3 x 4 cm</span>
            </div>
          </div>

          {/* Pengesahan Kepala Sekolah Sesuai Gambar Ketiga */}
          <div className="text-left font-serif text-black leading-snug">
            <div>
              {sekolah.tempatRapor || 'Oksibil'}, {sekolah.tanggalRapor || '25 Juli 2021'}
            </div>
            <div className="font-bold mt-0.5">Kepala Sekolah,</div>
            <div className="h-16 sm:h-20" />
            <div>
              <span className="font-black text-sm sm:text-base underline uppercase tracking-wide">
                {sekolah.namaKepalaSekolah || 'Charles Dedenip uropmabin'}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-mono mt-0.5">
              NIP. {sekolah.nipKepalaSekolah || '19012311991081001'}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 font-serif mt-6">
          <span>Halaman 3 — Identitas Peserta Didik</span>
        </div>
      </div>
    </div>
  );
};
