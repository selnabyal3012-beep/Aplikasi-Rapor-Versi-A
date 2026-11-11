import React from 'react';
import { FileCheck2, Printer, ChevronLeft, ChevronRight, School, Calendar, MapPin, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { P5Predicate } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { PrintTypographyControl } from '../common/PrintTypographyControl';
import * as XLSX from 'xlsx';

export const P5ReportViewSection: React.FC = () => {
  const {
    db,
    selectedKelas,
    selectedSemester,
    selectedFase,
    printTargetStudentId,
    setPrintTargetStudentId,
    printFontFamily,
    printFontSize
  } = useApp();

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);
  const currentStudent = siswaKelas.find((s) => s.idSiswa === printTargetStudentId) || siswaKelas[0];

  const handlePrint = () => {
    window.print();
  };

  const handlePrevStudent = () => {
    if (!currentStudent) return;
    const currentIdx = siswaKelas.findIndex((s) => s.idSiswa === currentStudent.idSiswa);
    if (currentIdx > 0) {
      setPrintTargetStudentId(siswaKelas[currentIdx - 1].idSiswa);
    }
  };

  const handleNextStudent = () => {
    if (!currentStudent) return;
    const currentIdx = siswaKelas.findIndex((s) => s.idSiswa === currentStudent.idSiswa);
    if (currentIdx < siswaKelas.length - 1) {
      setPrintTargetStudentId(siswaKelas[currentIdx + 1].idSiswa);
    }
  };

  if (!currentStudent) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
        Belum ada data siswa di kelas {selectedKelas}.
      </div>
    );
  }

  // Get active projects for this class
  const projekList = db.p5Projek.filter((p) => p.kelas === selectedKelas);

  // Wali Kelas
  const waliKelasData = db.kelas.find((k) => k.namaKelas === selectedKelas);
  const matchedTeacher = db.guru.find((g) => g.namaGuru === waliKelasData?.waliKelas) || db.guru[0];
  const waliKelasGuru = {
    namaGuru: (db.sekolah.waliKelas && db.sekolah.kelas === selectedKelas) ? db.sekolah.waliKelas : (matchedTeacher?.namaGuru || 'Agus Rama, S.Pd.Gr.'),
    nip: (db.sekolah.nipWaliKelas && db.sekolah.kelas === selectedKelas) ? db.sekolah.nipWaliKelas : (matchedTeacher?.nip || '19960816 202203 1 004')
  };

  return (
    <div className="space-y-6">
      {/* Control bar (no print) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileCheck2 size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Pratinjau Rapor Projek Kokurikuler (P5)
            </h2>
            <p className="text-xs text-slate-500">
              Standar Resmi Kemdikbudristek • Profil Pelajar Pancasila SD Negeri Balil
            </p>
          </div>
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevStudent}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Siswa Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          <select
            value={currentStudent.idSiswa}
            onChange={(e) => setPrintTargetStudentId(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
          >
            {siswaKelas.map((s) => (
              <option key={s.idSiswa} value={s.idSiswa}>
                {s.namaSiswa} ({s.nisn})
              </option>
            ))}
          </select>

          <button
            onClick={handleNextStudent}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Siswa Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md ml-2 cursor-pointer"
          >
            <Printer size={15} /> Cetak Rapor P5
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP RAPOR P5 DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Rapor P5"
        badge={currentStudent.namaSiswa}
        onSave={() => {}}
        saveLabel="Simpan Rapor P5"
        onUpdate={() => {}}
        updateLabel="Update Rapor P5"
        onEdit={() => {}}
        editLabel="Edit Rapor"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {}}
        deleteLabel="Bersihkan Filter"
        onImport={() => {}}
        importLabel="Impor Data"
        onExport={() => {
          const wb = XLSX.utils.book_new();
          const data: (string | number)[][] = [
            [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
            [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
            [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
            ['RAPOR PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)'],
            [`Nama Siswa: ${currentStudent.namaSiswa} • NISN: ${currentStudent.nisn}`],
            [`Kelas: ${selectedKelas} • Semester: ${selectedSemester} • Fase: ${selectedFase}`]
          ];
          const ws = XLSX.utils.aoa_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, 'Rapor P5');
          XLSX.writeFile(wb, `rapor-p5-${currentStudent.namaSiswa.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
        }}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={() => {}}
        uploadLabel="Upload File"
        onClear={() => {}}
        clearLabel="Bersihkan"
        onPrint={handlePrint}
        templateLabel="Template P5"
      />

      {/* PENGATURAN BENTUK HURUF & UKURAN HURUF CETAK RAPOR P5 */}
      <PrintTypographyControl className="mb-4" />

      {/* Official P5 Report Paper (A4 / F4 Printable Area) */}
      <div
        className="report-typography-scope bg-white rounded-xl shadow-lg border border-slate-200 p-8 sm:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 printable-area text-slate-900"
        style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
      >
        {/* KOP RESMI */}
        <div className="pb-4 border-b-2 border-slate-900 mb-6 flex items-center justify-between gap-4">
          {/* Logo Kiri */}
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            {db.sekolah.logoKiriUrl ? (
              <img src={db.sekolah.logoKiriUrl} alt="Logo Pemda" className="max-h-20 max-w-20 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold text-slate-700 text-center leading-tight">
                LOGO PEMDA
              </div>
            )}
          </div>

          {/* Teks KOP Tengah */}
          <div className="flex-1 text-center">
            <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
              {db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
            </div>
            <div className="uppercase tracking-widest text-xs font-bold text-slate-700">
              {db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase my-0.5">
              {db.sekolah.namaSekolah}
            </h1>
            <p className="text-[11px] text-slate-600 leading-tight">
              Alamat: {db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan}, Kab. {db.sekolah.kabupaten}, Prov. {db.sekolah.provinsi}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              NPSN: {db.sekolah.npsn} | NSS: {db.sekolah.nss}
            </p>
          </div>

          {/* Logo Kanan */}
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            {db.sekolah.logoKananUrl ? (
              <img src={db.sekolah.logoKananUrl} alt="Logo Sekolah" className="max-h-20 max-w-20 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold text-slate-700 text-center leading-tight">
                TUT WURI HANDAYANI
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-sm font-extrabold tracking-wider uppercase underline underline-offset-4">
            RAPOR PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)
          </h2>
          <span className="text-[11px] font-semibold text-slate-600 block mt-1">
            TAHUN PELAJARAN {db.sekolah.tahunPelajaran} • SEMESTER {selectedSemester.toUpperCase()}
          </span>
        </div>

        {/* IDENTITAS RAPOR P5 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs pb-4 border-b border-slate-300 mb-6">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 text-slate-600">Nama Sekolah</span>
              <span className="w-3">:</span>
              <span className="font-semibold text-slate-800">{db.sekolah.namaSekolah}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Nama Peserta Didik</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">{currentStudent.namaSiswa}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">NISN / NIS</span>
              <span className="w-3">:</span>
              <span className="font-mono text-slate-800">{currentStudent.nisn} / {currentStudent.nis}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 text-slate-600">Kelas / Rombel</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">
                {selectedKelas} {db.sekolah.rombel && db.sekolah.kelas === selectedKelas ? `(${db.sekolah.rombel})` : ''}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Face / Fase</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">{selectedFase}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Tahun Pelajaran</span>
              <span className="w-3">:</span>
              <span className="font-semibold text-slate-800">{db.sekolah.tahunPelajaran}</span>
            </div>
          </div>
        </div>

        {/* PROJEK RESULTS */}
        {projekList.map((pr, pIdx) => {
          const studentScores = db.p5Nilai.filter(
            (n) => n.idProjek === pr.idProjek && n.nisn === currentStudent.nisn
          );

          return (
            <div key={pr.idProjek} className="mb-8">
              {/* Project Header */}
              <div className="bg-slate-100 p-3 rounded-t-xs border border-slate-900 border-b-0">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Projek {pIdx + 1} • Tema: {pr.tema}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{pr.namaProjek}</h3>
                <p className="text-[11px] text-slate-700 italic mt-1 leading-relaxed">
                  {pr.deskripsiProjek}
                </p>
              </div>

              {/* Matrix Table */}
              <table className="w-full text-[11px] border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-50 text-slate-900">
                    <th rowSpan={2} className="border border-slate-900 py-2 px-2 text-center w-8">No</th>
                    <th rowSpan={2} className="border border-slate-900 py-2 px-3 text-left w-52">
                      Dimensi & Elemen Sasaran
                    </th>
                    <th colSpan={4} className="border border-slate-900 py-1 px-1 text-center">
                      Capaian Fase {selectedFase}
                    </th>
                    <th rowSpan={2} className="border border-slate-900 py-2 px-3 text-left">
                      Catatan Proses Perkembangan
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-900 text-[10px]">
                    <th className="border border-slate-900 py-1 px-1 text-center w-10">BB</th>
                    <th className="border border-slate-900 py-1 px-1 text-center w-10">MB</th>
                    <th className="border border-slate-900 py-1 px-1 text-center w-10">BSH</th>
                    <th className="border border-slate-900 py-1 px-1 text-center w-10">SB</th>
                  </tr>
                </thead>
                <tbody>
                  {studentScores.map((sc, sIdx) => (
                    <tr key={sc.id} className="border-t border-slate-900">
                      <td className="border border-slate-900 py-2 px-2 text-center font-mono">{sIdx + 1}</td>
                      <td className="border border-slate-900 py-2 px-3">
                        <div className="font-bold text-slate-800">{sc.dimensi}</div>
                        <div className="text-[10px] text-slate-600">Elemen: {sc.elemen}</div>
                      </td>

                      {/* Checkmarks */}
                      <td className="border border-slate-900 py-2 px-1 text-center font-black">
                        {sc.capaian === 'BB' && <Check size={16} className="mx-auto text-slate-900" />}
                      </td>
                      <td className="border border-slate-900 py-2 px-1 text-center font-black">
                        {sc.capaian === 'MB' && <Check size={16} className="mx-auto text-slate-900" />}
                      </td>
                      <td className="border border-slate-900 py-2 px-1 text-center font-black">
                        {sc.capaian === 'BSH' && <Check size={16} className="mx-auto text-slate-900" />}
                      </td>
                      <td className="border border-slate-900 py-2 px-1 text-center font-black">
                        {sc.capaian === 'SB' && <Check size={16} className="mx-auto text-slate-900" />}
                      </td>

                      <td className="border border-slate-900 py-2 px-3 text-slate-700 leading-relaxed">
                        {sc.deskripsi}
                      </td>
                    </tr>
                  ))}
                  {studentScores.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-slate-900 py-4 text-center text-slate-500 italic">
                        Belum ada input penilaian capaian untuk projek ini. Silakan buka menu Input Capaian P5.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Legend */}
        <div className="p-3 bg-slate-50 border border-slate-900 rounded-xs text-[10px] text-slate-700 mb-8 space-y-1">
          <span className="font-bold block uppercase tracking-wider text-slate-800">Keterangan Skala Capaian:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><strong>BB</strong>: Belum Berkembang</div>
            <div><strong>MB</strong>: Mulai Berkembang</div>
            <div><strong>BSH</strong>: Berkembang Sesuai Harapan</div>
            <div><strong>SB</strong>: Sangat Berkembang</div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="text-xs pt-4">
          <div className="text-right mb-6">
            <span>{db.sekolah.tempatRapor || 'Balil'}, {db.sekolah.tanggalRapor || '19 Desember 2026'}</span>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="font-medium text-slate-700">Mengetahui,</p>
              <p className="font-semibold text-slate-800 mb-16">Orang Tua / Wali</p>
              <div className="border-b border-slate-900 w-48 mx-auto"></div>
              <p className="text-[11px] text-slate-500 mt-1">( ............................................ )</p>
            </div>

            <div>
              <p className="text-transparent">.</p>
              <p className="font-semibold text-slate-800 mb-16">Koordinator P5 / Wali Kelas {selectedKelas}</p>
              <p className="font-bold underline text-slate-900">{waliKelasGuru.namaGuru}</p>
              <p className="text-[11px] font-mono text-slate-600">NIP. {waliKelasGuru.nip || '-'}</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="font-medium text-slate-700">Mengetahui,</p>
            <p className="font-semibold text-slate-800 mb-16">Kepala Sekolah {db.sekolah.namaSekolah}</p>
            <p className="font-bold underline text-slate-900">{db.sekolah.namaKepalaSekolah}</p>
            <p className="text-[11px] font-mono text-slate-600">NIP. {db.sekolah.nipKepalaSekolah}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
