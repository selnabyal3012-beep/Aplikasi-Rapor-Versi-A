import React, { useState, useEffect } from 'react';
import { HelpCircle, Sparkles, Save, BookOpen, CheckCircle2, RefreshCw, Check, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AcademicScore } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import { generateReportDescriptionFromTP } from '../../utils/tpDescriptionHelper';
import * as XLSX from 'xlsx';

export const ReportDescriptionSection: React.FC = () => {
  const {
    db,
    selectedKelas,
    selectedSemester,
    saveNilaiAkademik,
    bulkSaveNilai,
    syncAllScoresWithTPDescriptions,
    showSaveNotification
  } = useApp();

  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const [savedRowNisn, setSavedRowNisn] = useState<string | null>(null);

  const [selectedMapel, setSelectedMapel] = useState<string>(
    db.mataPelajaran[2]?.mataPelajaran || 'Bahasa Indonesia'
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);

  // Helper to construct scores connected to TP
  const buildScoresForMapel = (mapel: string): AcademicScore[] => {
    return siswaKelas.map((s) => {
      const existing = db.nilaiAkademik.find(
        (n) => n.nisn === s.nisn && n.mataPelajaran === mapel && n.semester === selectedSemester
      );
      const na = existing ? existing.nilaiAkhir : 82;
      const tpResult = generateReportDescriptionFromTP(
        mapel,
        selectedKelas,
        na,
        db.tujuanPembelajaran,
        s.namaSiswa
      );

      if (existing) {
        return {
          ...existing,
          deskripsiRapor:
            existing.deskripsiRapor && existing.deskripsiRapor.trim() !== ''
              ? existing.deskripsiRapor
              : tpResult.deskripsiRapor,
          deskripsiTercapai: existing.deskripsiTercapai || tpResult.deskripsiTercapai,
          deskripsiPerluPeningkatan:
            existing.deskripsiPerluPeningkatan || tpResult.deskripsiPerluPeningkatan
        };
      }
      return {
        idNilai: `N_${s.nisn}_${mapel.slice(0, 3)}_${selectedSemester}`,
        tahunPelajaran: db.sekolah.tahunPelajaran,
        semester: selectedSemester,
        kelas: selectedKelas,
        nisn: s.nisn,
        namaSiswa: s.namaSiswa,
        mataPelajaran: mapel,
        formatif: 82,
        sumatif: 84,
        nilaiAkhir: 83,
        predikat: 'Baik' as const,
        capaianKompetensi: 'Baik' as const,
        deskripsiTercapai: tpResult.deskripsiTercapai,
        deskripsiPerluPeningkatan: tpResult.deskripsiPerluPeningkatan,
        deskripsiRapor: tpResult.deskripsiRapor
      };
    });
  };

  const [localRows, setLocalRows] = useState<AcademicScore[]>(() => buildScoresForMapel(selectedMapel));

  // Sync rows when mapel or class changes
  useEffect(() => {
    setLocalRows(buildScoresForMapel(selectedMapel));
  }, [selectedMapel, selectedKelas, selectedSemester, db.tujuanPembelajaran]);

  const handleUpdate = (idx: number, field: keyof AcademicScore, value: string) => {
    setLocalRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSaveItem = (item: AcademicScore) => {
    saveNilaiAkademik(item);
    setSavedRowNisn(item.nisn);
    setTimeout(() => {
      setSavedRowNisn((curr) => (curr === item.nisn ? null : curr));
    }, 2500);
  };

  const handleSaveAll = () => {
    triggerSave(() => {
      bulkSaveNilai(localRows);
    });
  };

  // Re-generate descriptions for the current subject from its TPs
  const handleRegenerateCurrentMapelFromTP = () => {
    const updated = localRows.map((r) => {
      const tpResult = generateReportDescriptionFromTP(
        selectedMapel,
        selectedKelas,
        r.nilaiAkhir,
        db.tujuanPembelajaran,
        r.namaSiswa
      );
      return {
        ...r,
        deskripsiRapor: tpResult.deskripsiRapor,
        deskripsiTercapai: tpResult.deskripsiTercapai,
        deskripsiPerluPeningkatan: tpResult.deskripsiPerluPeningkatan
      };
    });

    setLocalRows(updated);
    bulkSaveNilai(updated);
    setSavedNotice(true);
    showSaveNotification(
      `Berhasil memperbarui deskripsi rapor ${selectedMapel} untuk ${updated.length} siswa langsung dari TP!`
    );
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Connect & sync all subjects across the whole database
  const handleSyncAllSubjects = () => {
    const count = syncAllScoresWithTPDescriptions(selectedSemester);
    // Reload local rows
    setLocalRows(buildScoresForMapel(selectedMapel));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleClearDescriptions = () => {
    if (confirm('Bersihkan deskripsi capaian rapor menjadi kosong?')) {
      setLocalRows((prev) =>
        prev.map((r) => ({
          ...r,
          deskripsiRapor: '',
          deskripsiTercapai: '',
          deskripsiPerluPeningkatan: ''
        }))
      );
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DESKRIPSI CAPAIAN KOMPETENSI RAPOR'],
      [`Kelas: ${selectedKelas} • Mapel: ${selectedMapel} • Semester: ${selectedSemester}`],
      [],
      ['NO', 'NISN', 'NAMA SISWA', 'NILAI AKHIR', 'CAPAIAN TERTINGGI', 'PERLU PENINGKATAN', 'DESKRIPSI RAPOR'],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)'],
      ...localRows.map((r, idx) => [
        idx + 1,
        r.nisn,
        r.namaSiswa,
        r.nilaiAkhir,
        r.deskripsiTercapai,
        r.deskripsiPerluPeningkatan,
        r.deskripsiRapor
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 36 }, { wch: 36 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Deskripsi Rapor');
    XLSX.writeFile(wb, `deskripsi-rapor-${selectedMapel}-kelas-${selectedKelas}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
      const updated = [...localRows];
      rows.slice(7).forEach((row) => {
        if (!row || !row[1]) return;
        const nisn = String(row[1]).trim();
        const desc = String(row[6] || row[4] || '').trim();
        const idx = updated.findIndex((u) => u.nisn === nisn);
        if (idx !== -1 && desc) {
          updated[idx] = { ...updated[idx], deskripsiRapor: desc };
        }
      });
      setLocalRows(updated);
    } catch {
      // handled
    }
  };

  // Unduh template resmi deskripsi capaian rapor terhubung TP untuk mata pelajaran terpilih
  const handleDownloadTemplate = () => {
    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';

    const wb = XLSX.utils.book_new();
    const columns = [
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Semester',
      'Mata Pelajaran',
      'Nilai Akhir (0-100)',
      'Capaian Kompetensi',
      'Kode TP Terhubung',
      'Kekuatan / Capaian Tertinggi',
      'Perlu Peningkatan',
      'Deskripsi Rapor Resmi (Narasi Otomatis Kurikulum Merdeka)'
    ];

    const aoaData: (string | number)[][] = [
      [pemda],
      [instansi],
      [schoolName],
      [`FORMAT RESMI DESKRIPSI CAPAIAN RAPOR: ${selectedMapel.toUpperCase()}`],
      [`Kelas: ${selectedKelas} • Semester: ${selectedSemester} • Tahun Pelajaran: ${schoolYear}`],
      [],
      ['NO', ...columns],
      ['(1)', ...columns.map((_, i) => `(${i + 2})`)],
      ...localRows.map((r, idx) => {
        const tpResult = generateReportDescriptionFromTP(
          selectedMapel,
          selectedKelas,
          r.nilaiAkhir,
          db.tujuanPembelajaran,
          r.namaSiswa
        );
        return [
          idx + 1,
          r.nisn,
          r.namaSiswa,
          selectedKelas,
          selectedSemester,
          selectedMapel,
          r.nilaiAkhir,
          r.capaianKompetensi || 'Baik',
          tpResult.linkedTpKodes.join(', ') || 'TP001',
          r.deskripsiTercapai || tpResult.deskripsiTercapai,
          r.deskripsiPerluPeningkatan || tpResult.deskripsiPerluPeningkatan,
          r.deskripsiRapor || tpResult.deskripsiRapor
        ];
      })
    ];

    for (let i = 0; i < 10; i++) {
      aoaData.push([localRows.length + 1 + i, ...columns.map(() => '')]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 8 },
      { wch: 10 },
      { wch: 28 },
      { wch: 10 },
      { wch: 20 },
      { wch: 16 },
      { wch: 36 },
      { wch: 36 },
      { wch: 55 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Deskripsi');
    const safeName = selectedMapel.toLowerCase().replace(/[^a-z0-9]/g, '-');
    XLSX.writeFile(wb, `template-deskripsi-rapor-${safeName}-kelas-${selectedKelas}.xlsx`);
    showSaveNotification(`Template deskripsi rapor untuk ${selectedMapel} berhasil diunduh!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
            <Sparkles size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-700">
              Deskripsi Otomatis Capaian
            </span>
            <h2 className="text-xl font-bold text-slate-800">Deskripsi Capaian Kompetensi Rapor</h2>
            <p className="text-xs text-slate-500">
              Tabel DESKRIPSI_RAPOR: Rincian kekuatan/capaian tertinggi, hal yang perlu ditingkatkan, dan narasi otomatis Kurikulum Merdeka.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveAll}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={15} /> Simpan Semua Deskripsi
          </button>
          <SaveStatusIndicator
            status={saveStatus}
            lastSavedText={lastSavedTime}
          />
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP DESKRIPSI RAPOR DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Deskripsi Rapor"
        badge={`Mapel: ${selectedMapel}`}
        onSave={handleSaveAll}
        saveLabel="Simpan Deskripsi"
        saveStatus={saveStatus}
        onUpdate={handleSaveAll}
        updateLabel="Update Deskripsi"
        onEdit={handleSaveAll}
        editLabel="Edit Deskripsi"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={handleClearDescriptions}
        deleteLabel="Hapus / Kosongkan"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onClear={handleClearDescriptions}
        clearLabel="Bersihkan File"
        onTemplate={handleDownloadTemplate}
        templateLabel="Template Deskripsi"
      />

      {/* Mapel Filter & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-purple-600" />
            <span className="text-xs font-bold text-slate-700">Mata Pelajaran:</span>
            <select
              value={selectedMapel}
              onChange={(e) => {
                setSelectedMapel(e.target.value);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-purple-800 focus:outline-hidden"
            >
              {db.mataPelajaran.map((m) => (
                <option key={m.kode || m.mataPelajaran} value={m.mataPelajaran}>
                  {m.mataPelajaran}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateCurrentMapelFromTP}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs border border-purple-300 transition-colors cursor-pointer"
              title="Perbarui deskripsi capaian rapor mata pelajaran ini berdasarkan TP yang tersimpan"
            >
              <RefreshCw size={13} />
              <span>Buat Ulang dari TP ({selectedMapel.slice(0, 15)})</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllSubjects}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              title="Hubungkan semua deskripsi TP seluruh mata pelajaran langsung ke semua rapor siswa"
            >
              <CheckCircle2 size={14} />
              <span>⚡ Hubungkan Semua TP ke Rapor</span>
            </button>
          </div>
        </div>

        {/* Info Banner on Active Subject TPs */}
        {(() => {
          const mapelTps = db.tujuanPembelajaran.filter(
            (t) => t.kelas === selectedKelas && t.mataPelajaran === selectedMapel
          );
          return (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Info size={14} className="text-purple-600" />
                  <span>Sumber Rumusan TP Terdaftar: {mapelTps.length} TP Aktif di Kelas {selectedKelas}</span>
                </span>
                <span className="text-[10px] text-purple-700 font-semibold">
                  Semua deskripsi rapor di bawah tersinkronisasi otomatis dengan TP ini.
                </span>
              </div>
              {mapelTps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mapelTps.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] text-slate-700"
                    >
                      <strong className="font-mono text-purple-700">{t.kodeTp}:</strong>
                      <span className="truncate max-w-xs">{t.tujuanPembelajaran}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-amber-800 italic">
                  Belum ada TP khusus untuk {selectedMapel} di Kelas {selectedKelas}. Sistem menggunakan deskripsi umum standar mata pelajaran.
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-2 text-center">Nilai</th>
                <th className="py-3 px-3 w-48">Kekuatan / Capaian Tertinggi</th>
                <th className="py-3 px-3 w-48">Perlu Ditingkatkan</th>
                <th className="py-3 px-3">Deskripsi Rapor Resmi (Narasi Kurikulum Merdeka)</th>
                <th className="py-3 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localRows.map((row, idx) => (
                <tr key={row.nisn} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{row.namaSiswa}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{row.nisn}</div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 font-black font-mono">
                      {row.nilaiAkhir}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={row.deskripsiTercapai || ''}
                      onChange={(e) => handleUpdate(idx, 'deskripsiTercapai', e.target.value)}
                      placeholder="Contoh: Memahami teks narasi"
                      className="w-full px-2 py-1 text-xs border rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={row.deskripsiPerluPeningkatan || ''}
                      onChange={(e) => handleUpdate(idx, 'deskripsiPerluPeningkatan', e.target.value)}
                      placeholder="Contoh: Menulis paragraf"
                      className="w-full px-2 py-1 text-xs border rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <textarea
                      rows={2}
                      value={row.deskripsiRapor || ''}
                      onChange={(e) => handleUpdate(idx, 'deskripsiRapor', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded-lg leading-snug"
                    />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => handleSaveItem(row)}
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-purple-200"
                      >
                        Simpan
                      </button>
                      {savedRowNisn === row.nisn && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 animate-in fade-in duration-150">
                          <Check size={11} className="text-emerald-700" /> Saved
                        </span>
                      )}
                    </div>
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
