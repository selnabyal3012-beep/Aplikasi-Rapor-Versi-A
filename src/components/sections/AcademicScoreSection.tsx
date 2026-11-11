import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Sparkles,
  Calculator,
  Filter,
  RefreshCw,
  Search,
  BookOpen,
  FolderDown,
  Eye,
  Link2,
  Zap,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AcademicScore } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import { generateReportDescriptionFromTP } from '../../utils/tpDescriptionHelper';
import {
  exportSubjectScoresToExcel,
  exportSubjectScoresToCsv,
  exportClassComprehensiveWorkbook
} from '../../utils/exportHelper';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const AcademicScoreSection: React.FC = () => {
  const appContext = useApp();
  const {
    db,
    selectedKelas,
    selectedSemester,
    saveNilaiAkademik,
    bulkSaveNilai,
    syncAllScoresWithTPDescriptions,
    showSaveNotification,
    setActiveMenu,
    openReportPreview
  } = appContext;
  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const [selectedMapel, setSelectedMapel] = useState<string>(
    db.mataPelajaran[2]?.mataPelajaran || 'Bahasa Indonesia' // default Bahasa Indonesia
  );
  const [modeRinci, setModeRinci] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);

  const generateAutoDeskripsi = (nilaiAkhir: number, namaSiswa: string, agamaSiswa?: string) => {
    const tpResult = generateReportDescriptionFromTP(
      selectedMapel,
      selectedKelas,
      nilaiAkhir,
      db.tujuanPembelajaran,
      namaSiswa,
      agamaSiswa
    );
    return tpResult.deskripsiRapor;
  };

  const getPredikat = (nilai: number): 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' => {
    if (nilai >= 88) return 'Sangat Baik';
    if (nilai >= 78) return 'Baik';
    if (nilai >= 68) return 'Cukup';
    return 'Perlu Bimbingan';
  };

  const getCapaian = (nilai: number): 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Pendampingan' => {
    if (nilai >= 88) return 'Sangat Baik';
    if (nilai >= 78) return 'Baik';
    if (nilai >= 68) return 'Cukup';
    return 'Perlu Pendampingan';
  };

  // Local table state for rapid editing
  const [rows, setRows] = useState<Record<string, AcademicScore>>(() => {
    const initialMap: Record<string, AcademicScore> = {};
    siswaKelas.forEach((s) => {
      const existing = db.nilaiAkademik.find(
        (n) => n.nisn === s.nisn && n.mataPelajaran === selectedMapel && n.semester === selectedSemester
      );
      if (existing) {
        initialMap[s.nisn] = { ...existing };
      } else {
        const defaultNA = 80;
        initialMap[s.nisn] = {
          idNilai: `N_${s.nisn}_${selectedMapel.slice(0, 3)}`,
          tahunPelajaran: db.sekolah.tahunPelajaran,
          semester: selectedSemester,
          kelas: selectedKelas,
          nisn: s.nisn,
          namaSiswa: s.namaSiswa,
          mataPelajaran: selectedMapel,
          formatif: 80,
          sumatif: 80,
          ph1: 80, ph2: 80, ph3: 80, pts: 80, pas: 80, praktik: 80,
          nilaiAkhir: defaultNA,
          predikat: getPredikat(defaultNA),
          capaianKompetensi: getCapaian(defaultNA),
          deskripsiTercapai: 'Menunjukkan kemampuan penguasaan materi yang baik.',
          deskripsiPerluPeningkatan: 'Perlu latihan berkala.',
          deskripsiRapor: generateAutoDeskripsi(defaultNA, s.namaSiswa, s.agama)
        };
      }
    });
    return initialMap;
  });

  // Auto-sinkronisasi: pastikan setiap siswa di kelas ini selalu terhubung di tabel nilai mata pelajaran aktif
  useEffect(() => {
    setRows((prev) => {
      const next: Record<string, AcademicScore> = {};
      siswaKelas.forEach((s) => {
        const existingInRows = prev[s.nisn];
        const existingInDb = db.nilaiAkademik.find(
          (n) => n.nisn === s.nisn && n.mataPelajaran === selectedMapel && n.semester === selectedSemester
        );

        if (existingInRows) {
          next[s.nisn] = existingInRows;
        } else if (existingInDb) {
          next[s.nisn] = { ...existingInDb };
        } else {
          const defaultNA = 80;
          next[s.nisn] = {
            idNilai: `N_${s.nisn}_${selectedMapel.slice(0, 3)}`,
            tahunPelajaran: db.sekolah.tahunPelajaran,
            semester: selectedSemester,
            kelas: selectedKelas,
            nisn: s.nisn,
            namaSiswa: s.namaSiswa,
            mataPelajaran: selectedMapel,
            formatif: 80,
            sumatif: 80,
            ph1: 80, ph2: 80, ph3: 80, pts: 80, pas: 80, praktik: 80,
            nilaiAkhir: defaultNA,
            predikat: getPredikat(defaultNA),
            capaianKompetensi: getCapaian(defaultNA),
            deskripsiTercapai: 'Menunjukkan kemampuan penguasaan materi yang baik.',
            deskripsiPerluPeningkatan: 'Perlu latihan berkala.',
            deskripsiRapor: generateAutoDeskripsi(defaultNA, s.namaSiswa, s.agama)
          };
        }
      });
      return next;
    });
  }, [siswaKelas.length, selectedMapel, selectedSemester, selectedKelas]);

  // Re-synchronize when mapel changes
  const handleMapelChange = (newMapel: string) => {
    setSelectedMapel(newMapel);
    const initialMap: Record<string, AcademicScore> = {};
    siswaKelas.forEach((s) => {
      const existing = db.nilaiAkademik.find(
        (n) => n.nisn === s.nisn && n.mataPelajaran === newMapel && n.semester === selectedSemester
      );
      if (existing) {
        initialMap[s.nisn] = { ...existing };
      } else {
        const defaultNA = 80;
        initialMap[s.nisn] = {
          idNilai: `N_${s.nisn}_${newMapel.slice(0, 3)}`,
          tahunPelajaran: db.sekolah.tahunPelajaran,
          semester: selectedSemester,
          kelas: selectedKelas,
          nisn: s.nisn,
          namaSiswa: s.namaSiswa,
          mataPelajaran: newMapel,
          formatif: 80,
          sumatif: 80,
          ph1: 80, ph2: 80, ph3: 80, pts: 80, pas: 80, praktik: 80,
          nilaiAkhir: defaultNA,
          predikat: getPredikat(defaultNA),
          capaianKompetensi: getCapaian(defaultNA),
          deskripsiTercapai: 'Menunjukkan kemampuan penguasaan materi yang baik.',
          deskripsiPerluPeningkatan: 'Perlu latihan berkala.',
          deskripsiRapor: generateAutoDeskripsi(defaultNA, s.namaSiswa, s.agama)
        };
      }
    });
    setRows(initialMap);
  };

  const updateCell = (nisn: string, field: keyof AcademicScore, value: any) => {
    setRows((prev) => {
      const current = prev[nisn] || {};
      const updated = { ...current, [field]: value };
      const studentObj = db.siswa.find((s) => s.nisn === nisn);

      // Calculate Nilai Akhir automatically if numeric component changed
      if (['formatif', 'sumatif', 'ph1', 'ph2', 'ph3', 'pts', 'pas', 'praktik'].includes(field as string)) {
        let calculatedNA = updated.nilaiAkhir;
        if (!modeRinci) {
          const f = Number(updated.formatif) || 0;
          const s = Number(updated.sumatif) || 0;
          calculatedNA = Math.round((f + s) / 2);
        } else {
          const ph = ((Number(updated.ph1) || 0) + (Number(updated.ph2) || 0) + (Number(updated.ph3) || 0)) / 3;
          const pts = Number(updated.pts) || 0;
          const pas = Number(updated.pas) || 0;
          const prak = Number(updated.praktik) || 0;
          calculatedNA = Math.round((ph * 0.3) + (pts * 0.2) + (pas * 0.25) + (prak * 0.25));
        }
        updated.nilaiAkhir = calculatedNA;
        updated.predikat = getPredikat(calculatedNA);
        updated.capaianKompetensi = getCapaian(calculatedNA);
        updated.deskripsiRapor = generateAutoDeskripsi(calculatedNA, updated.namaSiswa, studentObj?.agama);
      }

      return { ...prev, [nisn]: updated };
    });
  };

  const handleSaveAll = () => {
    triggerSave(() => {
      const listToSave = Object.values(rows);
      bulkSaveNilai(listToSave);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    });
  };

  // Hitung ulang semua nilai akhir & predikat (Update)
  const handleRecalculateAll = () => {
    setRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((nisn) => {
        const item = next[nisn];
        const studentObj = db.siswa.find((s) => s.nisn === nisn);
        const calcNA = modeRinci
          ? Math.round(
              ((item.ph1 || 80) +
                (item.ph2 || 80) +
                (item.ph3 || 80) +
                (item.pts || 80) +
                (item.pas || 80) +
                (item.praktik || 80)) /
                6
            )
          : Math.round(((item.formatif || 80) + (item.sumatif || 80)) / 2);
        next[nisn] = {
          ...item,
          nilaiAkhir: calcNA,
          predikat: getPredikat(calcNA),
          capaianKompetensi: getCapaian(calcNA),
          deskripsiRapor: generateAutoDeskripsi(calcNA, item.namaSiswa, studentObj?.agama)
        };
      });
      return next;
    });
    handleSaveAll();
  };

  // Hubungkan semua siswa ke seluruh mata pelajaran & terapkan rumus otomatis
  const handleConnectAllStudentsToAllSubjects = () => {
    const allSubjects = db.mataPelajaran;
    const targetStudents = siswaKelas.length > 0 ? siswaKelas : db.siswa;
    const scoresToSave: AcademicScore[] = [];

    targetStudents.forEach((student) => {
      allSubjects.forEach((mapel) => {
        const existing = db.nilaiAkademik.find(
          (n) =>
            n.nisn === student.nisn &&
            n.mataPelajaran === mapel.mataPelajaran &&
            n.kelas === student.kelas &&
            n.semester === selectedSemester
        );

        const formatif = existing?.formatif ?? 80;
        const sumatif = existing?.sumatif ?? 80;
        // Rumus otomatis Kurikulum Merdeka: Nilai Akhir (NA) = (Formatif + Sumatif) / 2
        const calculatedNA = Math.round((formatif + sumatif) / 2);
        const predikat = getPredikat(calculatedNA);
        const capaian = getCapaian(calculatedNA);
        const tpRes = generateReportDescriptionFromTP(
          mapel.mataPelajaran,
          student.kelas,
          calculatedNA,
          db.tujuanPembelajaran,
          student.namaSiswa,
          student.agama
        );

        scoresToSave.push({
          idNilai:
            existing?.idNilai ||
            `N_${student.nisn}_${mapel.mataPelajaran.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}_${student.kelas}`,
          tahunPelajaran: db.sekolah.tahunPelajaran,
          semester: selectedSemester,
          kelas: student.kelas,
          nisn: student.nisn,
          namaSiswa: student.namaSiswa,
          mataPelajaran: mapel.mataPelajaran,
          formatif,
          sumatif,
          ph1: existing?.ph1 ?? formatif,
          ph2: existing?.ph2 ?? formatif,
          ph3: existing?.ph3 ?? formatif,
          pts: existing?.pts ?? formatif,
          pas: existing?.pas ?? sumatif,
          praktik: existing?.praktik ?? 80,
          nilaiAkhir: calculatedNA,
          predikat,
          capaianKompetensi: capaian,
          deskripsiTercapai: existing?.deskripsiTercapai || tpRes.deskripsiTercapai,
          deskripsiPerluPeningkatan: existing?.deskripsiPerluPeningkatan || tpRes.deskripsiPerluPeningkatan,
          deskripsiRapor: existing?.deskripsiRapor || tpRes.deskripsiRapor
        });
      });
    });

    bulkSaveNilai(scoresToSave);
    showSaveNotification(
      `Berhasil menghubungkan ${targetStudents.length} siswa ke seluruh ${allSubjects.length} mata pelajaran dengan rumus otomatis & deskripsi TP agama!`
    );

    // Refresh rows for current selected mapel
    handleMapelChange(selectedMapel);
  };

  // Expor Nilai Mata Pelajaran Aktif ke Excel (.xlsx)
  const handleExportExcel = () => {
    exportSubjectScoresToExcel(Object.values(rows), selectedMapel, selectedKelas, selectedSemester, db.sekolah);
  };

  // Expor Nilai Mata Pelajaran Aktif ke CSV (.csv)
  const handleExportCsv = () => {
    exportSubjectScoresToCsv(Object.values(rows), selectedMapel, selectedKelas, selectedSemester, db.sekolah);
  };

  // Expor Buku Nilai Komplit Seluruh Mata Pelajaran Sekelas (.xlsx) Multi-Sheet
  const handleExportFullWorkbook = () => {
    exportClassComprehensiveWorkbook(db, selectedKelas, selectedSemester);
  };

  // Impor file Excel/CSV
  const handleImportFile = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_nilai_akademik', appContext);
      if (result.success) {
        showSaveNotification(result.message);
        // Refresh local rows immediately from the newly updated database state
        setTimeout(() => {
          setRows((prev) => {
            const next = { ...prev };
            const currentScores = appContext.db.nilaiAkademik;
            siswaKelas.forEach((s) => {
              const matched = currentScores.find(
                (n) => n.nisn === s.nisn && n.mataPelajaran === selectedMapel && n.semester === selectedSemester
              );
              if (matched) {
                next[s.nisn] = { ...matched };
              }
            });
            return next;
          });
        }, 100);
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      console.error('Import error', e);
      alert('Gagal mengimpor file nilai: ' + (e?.message || 'Format berkas tidak sesuai'));
    }
  };

  // Bersihkan nilai sementara / Kosongkan
  const handleClearScores = () => {
    if (confirm(`Kosongkan nilai sementara untuk mata pelajaran ${selectedMapel}?`)) {
      setRows((prev) => {
        const resetMap: Record<string, AcademicScore> = {};
        Object.entries(prev).forEach(([nisn, score]) => {
          resetMap[nisn] = {
            ...score,
            formatif: 0,
            sumatif: 0,
            ph1: 0,
            ph2: 0,
            ph3: 0,
            pts: 0,
            pas: 0,
            praktik: 0,
            nilaiAkhir: 0,
            predikat: 'Perlu Bimbingan',
            capaianKompetensi: 'Perlu Pendampingan',
            deskripsiRapor: 'Belum ada data nilai.'
          };
        });
        return resetMap;
      });
    }
  };

  // Unduh template resmi nilai akademik formatif & sumatif terhubung TP
  const handleDownloadTemplate = () => {
    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';
    const localScores: AcademicScore[] = Object.values(rows);

    const wb = XLSX.utils.book_new();
    const columns = [
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Semester',
      'Mata Pelajaran',
      'Formatif (0-100)',
      'Sumatif (0-100)',
      'PH1',
      'PH2',
      'PH3',
      'PTS',
      'PAS',
      'Praktik',
      'Nilai Akhir',
      'Kode TP Terhubung',
      'Deskripsi Capaian dari TP'
    ];

    const aoaData: (string | number)[][] = [
      [pemda],
      [instansi],
      [schoolName],
      [`FORMAT NILAI AKADEMIK & CAPAIAN TP: ${selectedMapel.toUpperCase()}`],
      [`Kelas: ${selectedKelas} • Semester: ${selectedSemester} • Tahun Pelajaran: ${schoolYear}`],
      [],
      ['NO', ...columns],
      ['(1)', ...columns.map((_, i) => `(${i + 2})`)],
      ...localScores.map((s, idx) => {
        const tpRes = generateReportDescriptionFromTP(
          selectedMapel,
          selectedKelas,
          s.nilaiAkhir,
          db.tujuanPembelajaran,
          s.namaSiswa
        );
        return [
          idx + 1,
          s.nisn,
          s.namaSiswa,
          selectedKelas,
          selectedSemester,
          selectedMapel,
          s.formatif,
          s.sumatif,
          s.ph1 ?? s.formatif,
          s.ph2 ?? s.formatif,
          s.ph3 ?? s.formatif,
          s.pts ?? s.formatif,
          s.pas ?? s.sumatif,
          s.praktik ?? s.sumatif,
          s.nilaiAkhir,
          tpRes.linkedTpKodes.join(', ') || 'TP001',
          s.deskripsiRapor || tpRes.deskripsiRapor
        ];
      })
    ];

    for (let i = 0; i < 10; i++) {
      aoaData.push([localScores.length + 1 + i, ...columns.map(() => '')]);
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
      { wch: 10 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 18 },
      { wch: 55 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Nilai');
    const safeName = selectedMapel.toLowerCase().replace(/[^a-z0-9]/g, '-');
    XLSX.writeFile(wb, `template-nilai-${safeName}-kelas-${selectedKelas}.xlsx`);
    showSaveNotification(`Template nilai resmi untuk ${selectedMapel} berhasil diunduh!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-700">
              Penilaian Akademik
            </span>
            <h2 className="text-xl font-bold text-slate-800">Input Nilai Akademik / Rapor Biasa</h2>
            <p className="text-xs text-slate-500">
              Tabel NILAI_AKADEMIK Kelas {selectedKelas} Semester {selectedSemester} SD Negeri Balil. Perhitungan otomatis Nilai Akhir, Predikat, dan Deskripsi Rapor.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-900 text-white border-2 border-emerald-400 text-xs font-bold shadow-md animate-pulse">
              <CheckCircle2 size={15} className="text-emerald-300" />
              <span>&ldquo;Teleb Kan Data sekmarima sirya Dibmar&rdquo;</span>
            </span>
          )}
          <button
            onClick={handleConnectAllStudentsToAllSubjects}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer ring-2 ring-emerald-300 hover:scale-102"
            title="Hubungkan seluruh siswa ke setiap mata pelajaran dan hitung otomatis nilai akhir beserta predikat & deskripsi TP per agama"
          >
            <Zap size={15} className="text-amber-300 fill-amber-300" />
            <span>🚀 Hubungkan Semua Siswa ke Seluruh Mapel &amp; Rumus Otomatis</span>
          </button>
          <button
            onClick={() => {
              const count = syncAllScoresWithTPDescriptions();
              showSaveNotification(`Berhasil memperbarui ${count} data deskripsi nilai dari TP ke semua rapor!`);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            title="Hubungkan & perbarui rumusan deskripsi seluruh rapor dari database TP mata pelajaran"
          >
            <CheckCircle2 size={15} /> ⚡ Hubungkan TP ke Rapor
          </button>
          <button
            onClick={() => openReportPreview()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer ring-2 ring-purple-300 hover:scale-102"
            title="Lihat Pratinjau Rapor Lengkap Siswa Langsung"
          >
            <Eye size={15} className="text-amber-300" /> 👁️ Preview Rapor
          </button>
          {/* Tombol Ekspor Nilai Excel & CSV */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition-all shadow-xs cursor-pointer hover:scale-102"
              title={`Ekspor Nilai ${selectedMapel} ke format Excel (.xlsx)`}
            >
              <FileSpreadsheet size={14} /> Ekspor Mapel (.xlsx)
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer hover:scale-102"
              title={`Ekspor Nilai ${selectedMapel} ke format CSV (.csv)`}
            >
              <Download size={13} /> CSV (.csv)
            </button>
            <button
              onClick={handleExportFullWorkbook}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-lg transition-all shadow-xs cursor-pointer hover:scale-102"
              title="Ekspor Seluruh Nilai Semua Mata Pelajaran Sekelas ke 1 File Excel Multi-Sheet (Leger + Siswa + Tiap Mapel)"
            >
              <FileSpreadsheet size={14} /> 📦 Buku Nilai Sekelas (.xlsx)
            </button>
          </div>

          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200"
            title="Lihat & Unduh Template Format Nilai Excel/CSV"
          >
            <FolderDown size={15} /> Unduh Template Nilai
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={15} /> Simpan Semua Nilai Mapel Ini
            </button>
            <SaveStatusIndicator
              status={saveStatus}
              lastSavedText={lastSavedTime}
            />
          </div>
        </div>
      </div>

      {/* RUMUS OTOMATIS & KONEKSI SELURUH MAPEL INFO BANNER */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Calculator size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                Rumus Otomatis Kurikulum Merdeka
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                Semua Siswa Terhubung ke Seluruh Mata Pelajaran
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium mt-1">
              <strong>Rumus Nilai Akhir:</strong>{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-blue-900">
                NA = (Formatif + Sumatif) / 2
              </code>
              <span className="mx-2 text-slate-400">•</span>
              <strong>Predikat:</strong>{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-800 font-mono text-[11px]">
                ≥88: Sangat Baik, ≥78: Baik, ≥68: Cukup, &lt;68: Perlu Bimbingan
              </code>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pelajaran Agama terhubung otomatis ke masing-masing 6 Agama siswa (Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConnectAllStudentsToAllSubjects}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Sinkronkan &amp; Hitung Otomatis Sekarang</span>
        </button>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP DI SAMPING INPUT NILAI */}
      <StandardActionToolbar
        title="Aksi Nilai Akademik"
        badge={`Mapel: ${selectedMapel}`}
        onSave={handleSaveAll}
        saveLabel="Simpan Nilai"
        saveStatus={saveStatus}
        onUpdate={handleRecalculateAll}
        updateLabel="Update & Hitung Nilai"
        onEdit={() => setModeRinci(!modeRinci)}
        editLabel={modeRinci ? 'Mode: Rinci Aktif' : 'Edit Mode Rinci'}
        isEditing={modeRinci}
        onCancel={() => handleMapelChange(selectedMapel)}
        cancelLabel="Batal / Reset Nilai"
        onDelete={handleClearScores}
        deleteLabel="Hapus / Kosongkan"
        onImport={handleImportFile}
        importLabel="Impor Excel"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File Nilai"
        onClear={handleClearScores}
        clearLabel="Bersihkan File"
        onTemplate={handleDownloadTemplate}
        templateLabel="Template Nilai"
      />

      {/* Mapel Switcher & View Mode Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Pilih Mata Pelajaran:</span>
            <select
              value={selectedMapel}
              onChange={(e) => handleMapelChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-emerald-800 focus:outline-hidden"
            >
              {db.mataPelajaran.map((m) => (
                <option key={m.kode || m.mataPelajaran} value={m.mataPelajaran}>
                  {m.mataPelajaran} ({m.kelompok})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Rinci PH/PTS/PAS vs Formatif-Sumatif */}
          <button
            onClick={() => setModeRinci(!modeRinci)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
              modeRinci
                ? 'bg-purple-100 text-purple-900 border-purple-300'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            {modeRinci ? 'Mode: Rinci PH / PTS / PAS / Praktik' : 'Mode: Ringkas Formatif & Sumatif'}
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Target: <strong>{siswaKelas.length} Siswa</strong> Kelas {selectedKelas}
        </div>
      </div>

      {/* Score Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">NISN & Nama Siswa</th>
                {!modeRinci ? (
                  <>
                    <th className="py-3 px-2 text-center w-24">Formatif (F)</th>
                    <th className="py-3 px-2 text-center w-24">Sumatif (S)</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-1 text-center w-16">PH 1</th>
                    <th className="py-3 px-1 text-center w-16">PH 2</th>
                    <th className="py-3 px-1 text-center w-16">PH 3</th>
                    <th className="py-3 px-1 text-center w-16">PTS</th>
                    <th className="py-3 px-1 text-center w-16">PAS/SAS</th>
                    <th className="py-3 px-1 text-center w-16">Praktik</th>
                  </>
                )}
                <th className="py-3 px-2 text-center w-20 bg-emerald-950 text-emerald-300">Nilai Akhir</th>
                <th className="py-3 px-2 text-center w-28">Predikat</th>
                <th className="py-3 px-2 text-center w-32">Capaian Kompetensi</th>
                <th className="py-3 px-3">Deskripsi Rapor Otomatis (Dapat Disesuaikan)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {siswaKelas.map((s, idx) => {
                const item = rows[s.nisn] || {
                  nilaiAkhir: 80,
                  predikat: 'Baik',
                  capaianKompetensi: 'Baik',
                  deskripsiRapor: ''
                };

                return (
                  <tr key={s.nisn} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800">{s.namaSiswa}</span>
                        {s.agama && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                              s.agama === 'Islam'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : s.agama === 'Kristen'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : s.agama === 'Katolik'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : s.agama === 'Hindu'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : s.agama === 'Buddha'
                                ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {s.agama}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.nisn}</div>
                    </td>

                    {!modeRinci ? (
                      <>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.formatif ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'formatif', e.target.value)}
                            className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.sumatif ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'sumatif', e.target.value)}
                            className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.ph1 ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'ph1', e.target.value)}
                            className="w-12 px-1 py-1 text-center text-xs font-semibold border rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.ph2 ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'ph2', e.target.value)}
                            className="w-12 px-1 py-1 text-center text-xs font-semibold border rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.ph3 ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'ph3', e.target.value)}
                            className="w-12 px-1 py-1 text-center text-xs font-semibold border rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.pts ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'pts', e.target.value)}
                            className="w-12 px-1 py-1 text-center text-xs font-semibold border rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.pas ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'pas', e.target.value)}
                            className="w-12 px-1 py-1 text-center text-xs font-semibold border rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.praktik ?? 80}
                            onChange={(e) => updateCell(s.nisn, 'praktik', e.target.value)}
                            className="w-12 px-1 py-1 text-center text-xs font-semibold border rounded-lg"
                          />
                        </td>
                      </>
                    )}

                    {/* Nilai Akhir */}
                    <td className="py-2 px-2 text-center bg-emerald-50">
                      <span className="font-extrabold text-sm text-emerald-900 font-mono">
                        {item.nilaiAkhir}
                      </span>
                    </td>

                    {/* Predikat */}
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.predikat === 'Sangat Baik'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.predikat === 'Baik'
                            ? 'bg-blue-100 text-blue-800'
                            : item.predikat === 'Cukup'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.predikat}
                      </span>
                    </td>

                    {/* Capaian */}
                    <td className="py-2 px-2 text-center">
                      <select
                        value={item.capaianKompetensi}
                        onChange={(e) => updateCell(s.nisn, 'capaianKompetensi', e.target.value)}
                        className="text-[11px] font-semibold border border-slate-300 rounded-lg px-1.5 py-1"
                      >
                        <option value="Sangat Baik">Sangat Baik</option>
                        <option value="Baik">Baik</option>
                        <option value="Cukup">Cukup</option>
                        <option value="Perlu Pendampingan">Perlu Pendampingan</option>
                      </select>
                    </td>

                    {/* Deskripsi */}
                    <td className="py-2 px-3">
                      <textarea
                        rows={2}
                        value={item.deskripsiRapor || ''}
                        onChange={(e) => updateCell(s.nisn, 'deskripsiRapor', e.target.value)}
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-lg leading-snug focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
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
