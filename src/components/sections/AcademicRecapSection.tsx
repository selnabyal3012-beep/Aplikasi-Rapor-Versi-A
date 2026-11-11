import React from 'react';
import { TableProperties, Download, TrendingUp, Award, Printer, Eye, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { exportClassComprehensiveWorkbook, exportClassLegerToCsv } from '../../utils/exportHelper';
import * as XLSX from 'xlsx';

export const AcademicRecapSection: React.FC = () => {
  const {
    db,
    selectedKelas,
    selectedSemester,
    setActiveMenu,
    setPrintTargetStudentId,
    openReportPreview
  } = useApp();

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);
  const mapelList = db.mataPelajaran;

  // Compute table matrix
  const matrix = siswaKelas.map((s) => {
    const scores = mapelList.map((m) => {
      const match = db.nilaiAkademik.find(
        (n) => n.nisn === s.nisn && n.mataPelajaran === m.mataPelajaran && n.semester === selectedSemester
      );
      return match ? match.nilaiAkhir : null;
    });

    const validScores = scores.filter((v): v is number => v !== null);
    const total = validScores.reduce((acc, curr) => acc + curr, 0);
    const avg = validScores.length > 0 ? parseFloat((total / validScores.length).toFixed(1)) : 0;

    return {
      student: s,
      scores,
      total,
      avg,
      count: validScores.length
    };
  });

  // Sort descending by average to determine class rank
  const ranked = [...matrix].sort((a, b) => b.avg - a.avg);
  const rankMap = new Map<string, number>();
  ranked.forEach((item, idx) => {
    rankMap.set(item.student.nisn, idx + 1);
  });

  const exportLegerCsv = () => {
    exportClassLegerToCsv(db, selectedKelas, selectedSemester);
  };

  const handleExportFullWorkbook = () => {
    exportClassComprehensiveWorkbook(db, selectedKelas, selectedSemester);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['LEGER NILAI AKADEMIK & PERINGKAT KELAS'],
      [`Kelas: ${selectedKelas} • Semester: ${selectedSemester} • Tahun Ajaran: ${db.sekolah.tahunPelajaran}`],
      [],
      ['PERINGKAT', 'NISN', 'NAMA SISWA', ...mapelList.map((m) => m.mataPelajaran), 'TOTAL NILAI', 'RATA-RATA'],
      ['(1)', '(2)', '(3)', ...mapelList.map((_, i) => `(${i + 4})`), `(${mapelList.length + 4})`, `(${mapelList.length + 5})`],
      ...ranked.map((item) => [
        rankMap.get(item.student.nisn) || '-',
        item.student.nisn,
        item.student.namaSiswa,
        ...item.scores.map((sc) => sc ?? '-'),
        item.total,
        item.avg
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 16 },
      { wch: 28 },
      ...mapelList.map(() => ({ wch: 14 })),
      { wch: 12 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Leger Nilai');
    XLSX.writeFile(wb, `leger-nilai-kelas-${selectedKelas}-${selectedSemester}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <TableProperties size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">
              Rekapitulasi Penilaian
            </span>
            <h2 className="text-xl font-bold text-slate-800">Rekap Nilai Akademik (Legér Nilai Siswa)</h2>
            <p className="text-xs text-slate-500">
              Matriks kumulatif nilai semua mata pelajaran, total, rata-rata, dan peringkat siswa Kelas {selectedKelas} Semester {selectedSemester}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer hover:scale-102 ring-1 ring-emerald-400/50"
            title="Ekspor Leger Nilai & Peringkat Kelas ke format Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} /> Ekspor Legér (.xlsx)
          </button>
          <button
            onClick={exportLegerCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer hover:scale-102"
            title="Ekspor Leger Nilai ke format CSV (.csv)"
          >
            <Download size={14} /> Ekspor CSV (.csv)
          </button>
          <button
            onClick={handleExportFullWorkbook}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer hover:scale-102"
            title="Ekspor Seluruh Nilai Semua Mapel Sekelas ke 1 File Excel Multi-Sheet (Leger + Data Siswa + Tiap Mapel)"
          >
            <FileSpreadsheet size={15} /> 📦 Buku Nilai Sekelas (.xlsx)
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP REKAP NILAI DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Rekap & Legér Nilai"
        badge={`Kelas ${selectedKelas} • ${siswaKelas.length} Siswa`}
        onSave={handleExportExcel}
        saveLabel="Simpan Legér"
        onUpdate={() => {}}
        updateLabel="Perbarui Rekap"
        onEdit={() => setActiveMenu('input_nilai')}
        editLabel="Edit Nilai Mapel"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {}}
        deleteLabel="Bersihkan Filter"
        onImport={() => setActiveMenu('input_nilai')}
        importLabel="Impor Nilai"
        onExport={handleExportExcel}
        exportLabel="Expor Legér (.xlsx)"
        onUpload={() => setActiveMenu('input_nilai')}
        uploadLabel="Upload File"
        onClear={() => {}}
        clearLabel="Bersihkan"
        templateLabel="Template Nilai"
      />

      {/* Leger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">Nama Siswa</th>
                {mapelList.map((m) => (
                  <th key={m.kode || m.mataPelajaran} className="py-3 px-2 text-center" title={m.mataPelajaran}>
                    <span className="inline-block max-w-[90px] truncate" title={m.mataPelajaran}>
                      {m.mataPelajaran}
                    </span>
                  </th>
                ))}
                <th className="py-3 px-2 text-center bg-slate-800">Jumlah</th>
                <th className="py-3 px-2 text-center bg-emerald-900 text-emerald-300">Rata-Rata</th>
                <th className="py-3 px-3 text-right">Rapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {matrix.map((row) => {
                const rk = rankMap.get(row.student.nisn) || '-';
                return (
                  <tr key={row.student.nisn} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-center font-bold">
                      <span
                        className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-[10px] ${
                          rk === 1
                            ? 'bg-amber-400 text-slate-900 font-black'
                            : rk === 2
                            ? 'bg-slate-300 text-slate-900 font-bold'
                            : rk === 3
                            ? 'bg-amber-700 text-white font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-bold">{row.student.nisn}</td>
                    <td className="py-3 px-3 font-sans font-bold text-slate-800 whitespace-nowrap">
                      {row.student.namaSiswa}
                    </td>

                    {row.scores.map((sc, i) => (
                      <td key={i} className="py-3 px-2 text-center">
                        {sc !== null ? (
                          <span
                            className={`font-semibold ${
                              sc >= 88 ? 'text-emerald-700 font-bold' : sc >= 78 ? 'text-slate-800' : 'text-amber-700'
                            }`}
                          >
                            {sc}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    ))}

                    <td className="py-3 px-2 text-center bg-slate-50 font-bold text-slate-800">
                      {row.total}
                    </td>
                    <td className="py-3 px-2 text-center bg-emerald-50 font-extrabold text-emerald-800 text-sm">
                      {row.avg}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openReportPreview(row.student.idSiswa)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-indigo-200 shadow-2xs"
                          title={`Pratinjau pop-up rapor ${row.student.namaSiswa}`}
                        >
                          <Eye size={12} className="text-amber-500" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => {
                            setPrintTargetStudentId(row.student.idSiswa);
                            setActiveMenu('rapor_akademik');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Buka halaman rapor lengkap"
                        >
                          Buka
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
