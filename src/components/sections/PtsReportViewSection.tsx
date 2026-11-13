import React, { useState } from 'react';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  ScrollText,
  User,
  GraduationCap,
  Calendar,
  CheckCircle,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassLevel, SemesterType } from '../../types';
import { LogoKabupaten, LogoTutWuriHandayani } from '../common/OfficialLogos';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SubjectPrintFilterBar } from '../common/SubjectPrintFilterBar';
import { PrintTypographyControl } from '../common/PrintTypographyControl';
import { generateReportDescriptionFromTP, getNamaPelajaranAgama } from '../../utils/tpDescriptionHelper';
import { parseAndImportTemplate } from '../../utils/templateImporter';
import * as XLSX from 'xlsx';

export const PtsReportViewSection: React.FC = () => {
  const appContext = useApp();
  const {
    db,
    selectedKelas,
    setSelectedKelas,
    selectedSemester,
    setSelectedSemester,
    printableMataPelajaran,
    syncAllScoresWithTPDescriptions,
    showSaveNotification,
    printFontFamily,
    printFontSize
  } = appContext;

  const handleImportFile = async (file: File) => {
    try {
      const res = await parseAndImportTemplate(file, 'template_nilai_akademik', appContext);
      if (res.success) {
        showSaveNotification(res.message);
      } else {
        showSaveNotification(`Gagal Impor: ${res.message}`);
      }
    } catch (err: any) {
      showSaveNotification(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
    }
  };

  const studentsInClass = db.siswa.filter(
    (s) => s.kelas === selectedKelas && s.statusSiswa === 'Aktif'
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return studentsInClass[0]?.idSiswa || (db.siswa[0]?.idSiswa ?? '');
  });

  const currentStudent =
    db.siswa.find((s) => s.idSiswa === selectedStudentId) ||
    studentsInClass[0] ||
    db.siswa[0];

  const currentStudentIndex = studentsInClass.findIndex(
    (s) => s.idSiswa === currentStudent?.idSiswa
  );

  const handlePrev = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(studentsInClass[currentStudentIndex - 1].idSiswa);
    }
  };

  const handleNext = () => {
    if (currentStudentIndex < studentsInClass.length - 1) {
      setSelectedStudentId(studentsInClass[currentStudentIndex + 1].idSiswa);
    }
  };

  // Nilai PTS siswa (Mengikuti filter mata pelajaran pilihan / keadaan sekolah)
  const studentScores = printableMataPelajaran.map((mapel) => {
    const sc = db.nilaiAkademik.find(
      (n) =>
        n.nisn === currentStudent?.nisn &&
        n.kelas === selectedKelas &&
        n.semester === selectedSemester &&
        (n.mataPelajaran.toLowerCase().includes(mapel.mataPelajaran.toLowerCase()) ||
          mapel.mataPelajaran.toLowerCase().includes(n.mataPelajaran.toLowerCase()))
    );

    const formatif = sc?.formatif ?? 80;
    const ptsScore = sc?.pts ?? sc?.formatif ?? 80;
    // Nilai Tengah Semester adalah rata-rata formatif dan PTS
    const nilaiTengahSemester = Math.round((formatif + ptsScore) / 2);

    let predikat = 'Baik';
    if (nilaiTengahSemester >= 90) predikat = 'Sangat Baik';
    else if (nilaiTengahSemester >= 80) predikat = 'Baik';
    else if (nilaiTengahSemester >= 70) predikat = 'Cukup';
    else predikat = 'Perlu Bimbingan';

    const tpResult = generateReportDescriptionFromTP(
      mapel.mataPelajaran,
      selectedKelas,
      nilaiTengahSemester,
      db.tujuanPembelajaran,
      currentStudent?.namaSiswa,
      currentStudent?.agama
    );

    const catatan =
      sc?.deskripsiTercapai && sc.deskripsiTercapai.trim() !== ''
        ? sc.deskripsiTercapai
        : tpResult.deskripsiTercapai || `Menunjukkan kemajuan yang baik dalam memahami materi pembelajaran tengah semester.`;

    const kkm = sc?.kkm || mapel.kkm || 75;
    const capaianKompetensi =
      nilaiTengahSemester >= 88
        ? 'Sangat Baik'
        : nilaiTengahSemester >= 78
        ? 'Baik'
        : nilaiTengahSemester >= 68
        ? 'Cukup'
        : 'Perlu Pendampingan';

    return {
      mapel,
      kkm,
      formatif,
      ptsScore,
      nilaiTengahSemester,
      predikat,
      capaianKompetensi,
      catatan,
      linkedTpKodes: tpResult.linkedTpKodes
    };
  });

  // Ekstrakurikuler siswa
  const studentEkskul = db.ekstrakurikuler.filter(
    (e) => e.nisn === currentStudent?.nisn && e.semester === selectedSemester
  );

  // Kehadiran siswa
  const studentAttendance = db.kehadiran.find(
    (k) => k.nisn === currentStudent?.nisn && k.semester === selectedSemester
  ) || {
    sakit: 0,
    izin: 1,
    alpa: 0
  };

  // Catatan wali kelas
  const studentNote = db.catatanWali.find(
    (c) => c.nisn === currentStudent?.nisn && c.semester === selectedSemester
  )?.catatanWaliKelas || 'Pertahankan semangat belajar dan keaktifan di kelas pada paruh semester berikutnya. Tetap tekun dan rajin!';

  // Hitung rata-rata
  const totalPts = studentScores.reduce((acc, curr) => acc + curr.nilaiTengahSemester, 0);
  const avgPts = studentScores.length > 0 ? (totalPts / studentScores.length).toFixed(1) : '0';

  const handlePrint = () => {
    window.print();
  };

  const exportPtsCsv = () => {
    if (!currentStudent) return;
    let csv = `sep=;\r\n`;
    csv += `RAPOR PENILAIAN TENGAH SEMESTER (PTS)\r\n`;
    csv += `Nama Sekolah;${db.sekolah.namaSekolah}\r\n`;
    csv += `Nama Siswa;${currentStudent.namaSiswa}\r\n`;
    csv += `NISN;${currentStudent.nisn}\r\n`;
    csv += `Kelas;${selectedKelas}\r\n`;
    csv += `Semester;Tengah Semester ${selectedSemester}\r\n`;
    csv += `Tahun Pelajaran;${db.sekolah.tahunPelajaran}\r\n\r\n`;
    csv += `No;Mata Pelajaran;KKM;Nilai Formatif;Nilai PTS;Nilai Akhir;Capaian Kompetensi;Deskripsi Capaian Pembelajaran\r\n`;
    studentScores.forEach((item, idx) => {
      csv += `${idx + 1};"${item.mapel.mataPelajaran}";${item.kkm};${item.formatif};${item.ptsScore};${item.nilaiTengahSemester};"${item.capaianKompetensi}";"${item.catatan.replace(/"/g, '""')}"\r\n`;
    });
    csv += `\r\nJUMLAH NILAI;${totalPts}\r\n`;
    csv += `RATA-RATA NILAI;${avgPts}\r\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapor-pts-${currentStudent.namaSiswa.toLowerCase().replace(/\s+/g, '-')}-kelas-${selectedKelas}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPtsTemplate = () => {
    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';

    const wb = XLSX.utils.book_new();
    const columns = [
      'NISN',
      'Nama Siswa',
      'Mata Pelajaran',
      'KKM',
      'Nilai Formatif (0-100)',
      'Nilai PTS (0-100)',
      'Nilai Akhir',
      'Capaian Kompetensi',
      'Kode TP Terhubung',
      'Deskripsi Capaian Pembelajaran'
    ];

    const aoaData: (string | number)[][] = [
      [pemda],
      [instansi],
      [schoolName],
      ['FORMAT RESMI NILAI RAPOR PENILAIAN TENGAH SEMESTER (PTS)'],
      [`Kelas: ${selectedKelas} • Semester: Tengah Semester ${selectedSemester} • Tahun Pelajaran: ${schoolYear}`],
      [],
      ['NO', ...columns],
      ['(1)', ...columns.map((_, i) => `(${i + 2})`)],
      ...studentScores.map((sc, i) => [
        i + 1,
        currentStudent?.nisn || '-',
        currentStudent?.namaSiswa || '-',
        sc.mapel.mataPelajaran,
        sc.kkm,
        sc.formatif,
        sc.ptsScore,
        sc.nilaiTengahSemester,
        sc.capaianKompetensi,
        sc.linkedTpKodes?.join(', ') || 'TP001',
        sc.catatan
      ]),
      ['', '', '', 'JUMLAH NILAI', '', '', '', totalPts, '', '', ''],
      ['', '', '', 'RATA-RATA NILAI', '', '', '', Number(avgPts), '', '', '']
    ];

    for (let i = 0; i < 10; i++) {
      aoaData.push([studentScores.length + 1 + i, ...columns.map(() => '')]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 32 },
      { wch: 8 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 55 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Template PTS');
    XLSX.writeFile(wb, `template-nilai-pts-kelas-${selectedKelas}.xlsx`);
    showSaveNotification('Template resmi Rapor PTS (.xlsx) berhasil diunduh!');
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden on print) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <ScrollText size={26} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">
              Penilaian Tengah Semester
            </span>
            <h2 className="text-xl font-bold text-slate-800">Rapor PTS / Sisipan Kurikulum Merdeka</h2>
            <p className="text-xs text-slate-500">
              Laporan kemajuan belajar peserta didik pertengahan semester untuk orang tua / wali murid.
            </p>
          </div>
        </div>

        {/* Filter & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kelas */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value as ClassLevel)}
            className="px-3 py-2 border rounded-xl text-xs font-bold bg-white text-slate-700"
          >
            <optgroup label="── SD / MI (Kelas 1-6) ──">
              {['I', 'II', 'III', 'IV', 'V', 'VI'].map((k) => (
                <option key={k} value={k}>Kelas {k} (SD)</option>
              ))}
            </optgroup>
            <optgroup label="── SMP / MTs (Kelas 7-9) ──">
              {['VII', 'VIII', 'IX'].map((k) => (
                <option key={k} value={k}>Kelas {k} (SMP)</option>
              ))}
            </optgroup>
            <optgroup label="── SMA / MA (Kelas 10-12) ──">
              {['X', 'XI', 'XII'].map((k) => (
                <option key={k} value={k}>Kelas {k} (SMA)</option>
              ))}
            </optgroup>
            <optgroup label="── SMK / MAK (Kejuruan) ──">
              <option value="X">Kelas X (SMK)</option>
              <option value="XI">Kelas XI (SMK)</option>
              <option value="XII">Kelas XII (SMK)</option>
              <option value="XIII">Kelas XIII (SMK 4 Tahun)</option>
            </optgroup>
          </select>

          {/* Semester */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value as SemesterType)}
            className="px-3 py-2 border rounded-xl text-xs font-bold bg-white text-slate-700"
          >
            <option value="Ganjil">Tengah Semester Ganjil</option>
            <option value="Genap">Tengah Semester Genap</option>
          </select>

          {/* Student Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              disabled={currentStudentIndex <= 0}
              className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer"
              title="Siswa Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <select
              value={currentStudent?.idSiswa}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden"
            >
              {studentsInClass.map((s) => (
                <option key={s.idSiswa} value={s.idSiswa}>
                  {s.namaSiswa} ({s.nisn || s.nis || '-'})
                </option>
              ))}
            </select>
            <button
              onClick={handleNext}
              disabled={currentStudentIndex >= studentsInClass.length - 1}
              className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer"
              title="Siswa Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              const count = syncAllScoresWithTPDescriptions();
              showSaveNotification(`Berhasil memperbarui ${count} data deskripsi dari TP ke rapor PTS!`);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Hubungkan & perbarui catatan kemajuan siswa dari Tujuan Pembelajaran (TP) mata pelajaran"
          >
            <CheckCircle size={14} /> ⚡ Hubungkan TP
          </button>

          <button
            onClick={exportPtsCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            title="Ekspor CSV"
          >
            <Download size={14} /> Ekspor
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Printer size={15} /> Cetak Rapor PTS (A4)
          </button>
        </div>
      </div>

      {/* FILTER MATA PELAJARAN PILIHAN (SESUAI KEADAAN SATUAN PENDIDIKAN) */}
      <SubjectPrintFilterBar className="mb-4" />

      {/* BARIS TOMBOL AKSI LENGKAP RAPOR PTS DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Rapor PTS"
        badge={currentStudent.namaSiswa}
        onSave={() => showSaveNotification('Rapor PTS siswa tersimpan!')}
        saveLabel="Simpan Rapor PTS"
        onUpdate={() => showSaveNotification('Tampilan Rapor PTS diperbarui!')}
        updateLabel="Update Rapor"
        onEdit={() => {}}
        editLabel="Edit Siswa"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {}}
        deleteLabel="Bersihkan Filter"
        onImport={handleImportFile}
        importLabel="Impor Data"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onExport={() => {
          const wb = XLSX.utils.book_new();
          const data: (string | number)[][] = [
            [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
            [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
            [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
            ['RAPOR PENILAIAN TENGAH SEMESTER (PTS)'],
            [`Nama Siswa: ${currentStudent.namaSiswa} • NISN: ${currentStudent.nisn}`],
            [`Kelas: ${selectedKelas} • Semester: ${selectedSemester}`],
            [],
            ['NO', 'MATA PELAJARAN', 'KKM', 'FORMATIF', 'NILAI PTS', 'NILAI AKHIR', 'CAPAIAN KOMPETENSI', 'DESKRIPSI CAPAIAN PEMBELAJARAN'],
            ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)'],
            ...studentScores.map((sc, i) => [
              i + 1,
              sc.mapel.mataPelajaran,
              sc.kkm,
              sc.formatif,
              sc.ptsScore,
              sc.nilaiTengahSemester,
              sc.capaianKompetensi,
              sc.catatan
            ]),
            ['', 'JUMLAH NILAI', '', '', '', totalPts, '', ''],
            ['', 'RATA-RATA NILAI', '', '', '', Number(avgPts), '', '']
          ];
          const ws = XLSX.utils.aoa_to_sheet(data);
          ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 55 }];
          XLSX.utils.book_append_sheet(wb, ws, 'Rapor PTS');
          XLSX.writeFile(wb, `rapor-pts-${currentStudent.namaSiswa.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
        }}
        exportLabel="Expor Excel (.xlsx)"
        onClear={() => {}}
        clearLabel="Bersihkan"
        onPrint={handlePrint}
        onTemplate={downloadPtsTemplate}
        templateLabel="Template PTS"
      />

      <style>{`
        @media print {
          body {
            background-color: #fff !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
          .printable-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* QUICK SCROLL / STATUS BAR */}
      <div className="no-print sticky top-2 z-20 bg-white/95 backdrop-blur-md py-2 px-4 border border-slate-300 rounded-2xl shadow-md mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
            <span>📜 Pratinjau Rapor PTS:</span>
            <span className="font-mono text-slate-800">{currentStudent.namaSiswa} ({currentStudent.nisn})</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold text-[11px]">
            ↕ Scroll Aktif & Bebas
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors"
          >
            <Printer size={13} /> Cetak Rapor PTS
          </button>
        </div>
      </div>

      {/* PENGATURAN BENTUK HURUF & UKURAN HURUF CETAK RAPOR PTS */}
      <PrintTypographyControl className="mb-4" />

      {/* Main Printable Area (Paper Document) */}
      <div
        className="report-typography-scope bg-white rounded-2xl border border-slate-300 shadow-lg p-8 sm:p-12 max-w-4xl mx-auto printable-area text-slate-900 leading-normal scroll-smooth"
        style={{ fontFamily: printFontFamily, fontSize: printFontSize }}
      >
        {/* Kop Sekolah dengan Logo Kab & Tut Wuri Handayani */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between gap-4">
          {/* Logo Kiri: Logo Pemda Kabupaten */}
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <LogoKabupaten
              url={db.sekolah.logoKiriUrl}
              size={76}
              className="w-16 h-16 sm:w-20 sm:h-20"
              label="Logo Pemda Kab"
            />
          </div>

          <div className="flex-1 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              {db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'}
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 mt-1">
              {db.sekolah.namaSekolah}
            </h1>
            <p className="text-[11px] text-slate-600 mt-1">
              Alamat: {db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan}, Kab. {db.sekolah.kabupaten}, Provinsi {db.sekolah.provinsi}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              NPSN: {db.sekolah.npsn || '-'} | NSS: {db.sekolah.nss || '-'} | Kode Pos: {db.sekolah.kodePos || '-'}
            </p>
          </div>

          {/* Logo Kanan: Tut Wuri Handayani */}
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <LogoTutWuriHandayani
              url={db.sekolah.logoKananUrl}
              size={76}
              className="w-16 h-16 sm:w-20 sm:h-20"
              label="Logo Tut Wuri Handayani"
            />
          </div>
        </div>

        {/* Title (Cukup tulis RAPOR sesuai instruksi user) */}
        <div className="text-center my-4">
          <h2 className="text-2xl sm:text-3xl font-black uppercase underline decoration-2 underline-offset-4 tracking-widest text-slate-950 font-serif">
            RAPOR
          </h2>
          <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">
            PENILAIAN TENGAH SEMESTER (PTS) • KURIKULUM MERDEKA • TAHUN PELAJARAN {db.sekolah.tahunPelajaran}
          </p>
        </div>

        {/* Data Siswa */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border border-slate-300 p-3.5 rounded-lg bg-slate-50/70 mb-6">
          <div className="flex">
            <span className="w-36 text-slate-600 font-semibold">Nama Peserta Didik</span>
            <span className="font-bold text-slate-900">: {currentStudent?.namaSiswa}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-slate-600 font-semibold">Kelas / Fase</span>
            <span className="font-bold text-slate-900">: Kelas {selectedKelas} (Fase {currentStudent?.fase || 'B'})</span>
          </div>
          <div className="flex">
            <span className="w-36 text-slate-600 font-semibold">NISN / NIS</span>
            <span className="font-bold text-slate-900">: {currentStudent?.nisn || '-'} / {currentStudent?.nis || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-slate-600 font-semibold">Semester</span>
            <span className="font-bold text-slate-900">: Tengah Semester {selectedSemester}</span>
          </div>
        </div>

        {/* Tabel Nilai PTS */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
            A. NILAI CAPAIAN PEMBELAJARAN TENGAH SEMESTER
          </h3>
          <table className="w-full text-[11px] border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                <th className="border border-slate-900 py-2 px-2 w-8">No</th>
                <th className="border border-slate-900 py-2 px-3 text-left w-48">Mata Pelajaran</th>
                <th className="border border-slate-900 py-2 px-2 w-14">KKM</th>
                <th className="border border-slate-900 py-2 px-2 w-16">Formatif</th>
                <th className="border border-slate-900 py-2 px-2 w-16">Nilai PTS</th>
                <th className="border border-slate-900 py-2 px-2 w-16 bg-amber-50">Nilai Akhir</th>
                <th className="border border-slate-900 py-2 px-2 w-28">Capaian Kompetensi</th>
                <th className="border border-slate-900 py-2 px-3 text-left">Deskripsi Capaian Pembelajaran</th>
              </tr>
            </thead>
            <tbody>
              {studentScores.map((item, idx) => (
                <tr key={item.mapel.kode || item.mapel.mataPelajaran || idx} className="border-t border-slate-900">
                  <td className="border border-slate-900 py-2 px-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-slate-900 py-2 px-3 font-semibold text-slate-900">
                    {item.mapel.mataPelajaran}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-mono font-bold text-slate-800">
                    {item.kkm}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-mono">
                    {item.formatif}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-mono">
                    {item.ptsScore}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-mono font-bold bg-amber-50/50">
                    {item.nilaiTengahSemester}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-semibold text-slate-800">
                    {item.capaianKompetensi}
                  </td>
                  <td className="border border-slate-900 py-2 px-3 text-slate-800 leading-snug">
                    {item.catatan}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                <td colSpan={5} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider">
                  JUMLAH NILAI :
                </td>
                <td className="border border-slate-900 py-2 px-2 text-center font-mono text-sm bg-slate-200 font-black">
                  {totalPts}
                </td>
                <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-600 text-[10px]">
                  Total akumulasi nilai seluruh mata pelajaran
                </td>
              </tr>
              <tr className="bg-slate-100 font-bold border-t border-slate-900">
                <td colSpan={5} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider">
                  RATA-RATA NILAI :
                </td>
                <td className="border border-slate-900 py-2 px-2 text-center font-mono text-sm bg-amber-100 font-black text-amber-950">
                  {avgPts}
                </td>
                <td colSpan={2} className="border border-slate-900 py-2 px-3 text-slate-600 text-[10px]">
                  Skala Penilaian: 0 - 100
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* B. KEHADIRAN & EKSTRAKURIKULER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Kehadiran */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              B. REKAP KEHADIRAN TENGAH SEMESTER
            </h3>
            <table className="w-full text-[11px] border-collapse border border-slate-900">
              <tbody>
                <tr>
                  <td className="border border-slate-900 py-1.5 px-3 font-medium">Sakit (S)</td>
                  <td className="border border-slate-900 py-1.5 px-3 text-center font-mono w-24">
                    {studentAttendance.sakit} hari
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-900 py-1.5 px-3 font-medium">Izin (I)</td>
                  <td className="border border-slate-900 py-1.5 px-3 text-center font-mono">
                    {studentAttendance.izin} hari
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-900 py-1.5 px-3 font-medium">Tanpa Keterangan (A)</td>
                  <td className="border border-slate-900 py-1.5 px-3 text-center font-mono">
                    {studentAttendance.alpa} hari
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ekstrakurikuler */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              C. KEGIATAN EKSTRAKURIKULER
            </h3>
            <table className="w-full text-[11px] border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-900 py-1 px-2 text-left">Kegiatan</th>
                  <th className="border border-slate-900 py-1 px-2 text-center w-20">Predikat</th>
                </tr>
              </thead>
              <tbody>
                {studentEkskul.length > 0 ? (
                  studentEkskul.map((e, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-900 py-1 px-2">{e.jenisEkstrakurikuler}</td>
                      <td className="border border-slate-900 py-1 px-2 text-center font-semibold">{e.predikat}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-slate-900 py-1 px-2">Pramuka Siaga / Penggalang</td>
                    <td className="border border-slate-900 py-1 px-2 text-center font-semibold">Baik</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* D. CATATAN & MOTIVASI WALI KELAS */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
            D. CATATAN WALI KELAS & SARAN PEMBINAAN
          </h3>
          <div className="border border-slate-900 p-3.5 rounded-sm min-h-[55px] text-xs leading-relaxed italic bg-amber-50/20 text-slate-800">
            &ldquo;{studentNote}&rdquo;
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs mt-10 pt-4">
          <div>
            <p className="text-slate-600 mb-14">Mengetahui,<br />Orang Tua / Wali Murid</p>
            <div className="border-b border-slate-900 w-40 mx-auto"></div>
            <p className="mt-1 text-[11px] text-slate-500">( ............................................ )</p>
          </div>

          <div>
            <p className="text-slate-600 mb-14">
              Mengetahui,<br />Kepala Sekolah
            </p>
            <p className="font-bold underline text-slate-900">{db.sekolah.namaKepalaSekolah}</p>
            <p className="text-[10px] text-slate-600 font-mono">NIP. {db.sekolah.nipKepalaSekolah || '-'}</p>
          </div>

          <div>
            <p className="text-slate-600 mb-14">
              {db.sekolah.tempatRapor || 'Balil'}, {db.sekolah.tanggalRapor || '23 Oktober 2026'}<br />
              Wali Kelas {selectedKelas}
            </p>
            <p className="font-bold underline text-slate-900">{db.sekolah.waliKelas || 'Petrus Kasipmabin, S.Pd.'}</p>
            <p className="text-[10px] text-slate-600 font-mono">NIP. {db.sekolah.nipWaliKelas || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
