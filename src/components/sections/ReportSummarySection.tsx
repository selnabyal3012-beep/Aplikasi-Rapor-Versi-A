import React from 'react';
import { FolderArchive, CheckCircle2, AlertCircle, Printer, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SubjectPrintFilterBar } from '../common/SubjectPrintFilterBar';
import { parseAndImportTemplate } from '../../utils/templateImporter';
import * as XLSX from 'xlsx';

export const ReportSummarySection: React.FC = () => {
  const appContext = useApp();
  const { db, selectedKelas, selectedSemester, setActiveMenu, setPrintTargetStudentId, printableMataPelajaran } = appContext;

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);
  const totalMapel = printableMataPelajaran.length;
  const printableNames = printableMataPelajaran.map((m) => m.mataPelajaran);

  const summaryData = siswaKelas.map((s) => {
    // Academic scores yang sesuai dengan filter mapel aktif
    const scores = db.nilaiAkademik.filter(
      (n) => n.nisn === s.nisn && n.semester === selectedSemester && printableNames.includes(n.mataPelajaran)
    );
    const totalScore = scores.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
    const avgScore = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : '-';

    // Attendance
    const att = db.kehadiran.find(
      (h) => h.nisn === s.nisn && h.semester === selectedSemester
    );
    const attString = att ? `${att.sakit}S / ${att.izin}I / ${att.alpa}A` : '0S / 0I / 0A';

    // Ekskul
    const eks = db.ekstrakurikuler.find(
      (e) => e.nisn === s.nisn && e.semester === selectedSemester
    );
    const ekskulString = eks ? `${eks.predikat}` : 'Baik';

    // P5
    const p5s = db.p5Nilai.filter(
      (p) => p.nisn === s.nisn && p.semester === selectedSemester
    );
    const p5Capaian = p5s.length > 0 ? p5s[0].capaian : 'BSH';

    // Status
    const isAcademicDone = scores.length >= totalMapel;
    const isP5Done = p5s.length > 0;
    const isLengkap = isAcademicDone && isP5Done;

    return {
      student: s,
      total: totalScore,
      avg: avgScore,
      scoresCount: scores.length,
      attendance: attString,
      ekskul: ekskulString,
      p5: p5Capaian,
      isLengkap,
      statusLabel: isLengkap ? 'Lengkap' : `Belum Lengkap (${scores.length}/${totalMapel})`
    };
  });

  const exportSummaryCsv = () => {
    const headers = 'No;NISN;Nama Siswa;Kelas;Jumlah Nilai;Rata-rata;Kehadiran;Ekskul;P5;Status\r\n';
    const rows = summaryData
      .map(
        (row, idx) =>
          `"${idx + 1}";"${row.student.nisn}";"${row.student.namaSiswa}";"${selectedKelas}";"${row.total}";"${row.avg}";"${row.attendance}";"${row.ekskul}";"${row.p5}";"${row.statusLabel}"`
      )
      .join('\r\n');
    const content = 'sep=;\r\n' + headers + rows;
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap-kelengkapan-rapor-sdn-balil-kelas-${selectedKelas}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = async (file: File) => {
    await parseAndImportTemplate(file, undefined, appContext);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <FolderArchive size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-teal-700">
              Audit Kelengkapan Berkas
            </span>
            <h2 className="text-xl font-bold text-slate-800">Rekap Status Kelengkapan Rapor Siswa</h2>
            <p className="text-xs text-slate-500">
              Tabel REKAP_RAPOR: Pemantauan terpadu nilai akademik, kehadiran, ekstrakurikuler, dan P5 sebelum cetak rapor.
            </p>
          </div>
        </div>

        <button
          onClick={exportSummaryCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Download size={15} /> Ekspor Rekap Kelengkapan
        </button>
      </div>

      {/* FILTER MATA PELAJARAN PILIHAN (SESUAI KEADAAN SEKOLAH) */}
      <SubjectPrintFilterBar compact={true} />

      {/* BARIS TOMBOL AKSI LENGKAP AUDIT REKAP RAPOR DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Kelengkapan Rapor"
        badge={`Kelas ${selectedKelas} • ${siswaKelas.length} Siswa`}
        onSave={exportSummaryCsv}
        saveLabel="Simpan Rekap"
        onUpdate={() => {}}
        updateLabel="Perbarui Audit"
        onEdit={() => setActiveMenu('cetak_rapor')}
        editLabel="Buka Cetak Rapor"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {}}
        deleteLabel="Bersihkan Filter"
        onImport={handleImportFile}
        importLabel="Impor Data"
        onExport={exportSummaryCsv}
        exportLabel="Expor Rekap (.csv)"
        onUpload={handleImportFile}
        uploadLabel="Upload Berkas"
        onClear={() => {}}
        clearLabel="Bersihkan"
        templateLabel="Format Standar"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-2 text-center">Kelas</th>
                <th className="py-3 px-2 text-center">Jumlah Nilai</th>
                <th className="py-3 px-2 text-center">Rata-Rata</th>
                <th className="py-3 px-3 text-center">Kehadiran (S/I/A)</th>
                <th className="py-3 px-3 text-center">Ekskul</th>
                <th className="py-3 px-3 text-center">P5</th>
                <th className="py-3 px-3 text-center">Status Berkas</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaryData.map((row, idx) => (
                <tr key={row.student.nisn} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-slate-400 font-mono font-bold">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-600">{row.student.nisn}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{row.student.namaSiswa}</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">Kls {selectedKelas}</td>
                  <td className="py-3 px-2 text-center font-bold font-mono text-slate-800">
                    {row.total}
                  </td>
                  <td className="py-3 px-2 text-center font-black font-mono text-emerald-800 text-sm">
                    {row.avg}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-700">{row.attendance}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[10px]">
                      {row.ekskul}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">
                      {row.p5}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.isLengkap ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 size={12} /> Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        <AlertCircle size={12} /> {row.statusLabel}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setPrintTargetStudentId(row.student.idSiswa);
                        setActiveMenu('cetak_rapor');
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-800 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                    >
                      Buka Cetak
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
