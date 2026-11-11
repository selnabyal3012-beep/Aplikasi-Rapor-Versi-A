import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  Scale,
  Save,
  Download,
  Upload,
  Printer,
  RotateCcw,
  Info,
  CheckCircle2,
  BookMarked,
  Sparkles,
  Search,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Edit2,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Subject } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const KkmSection: React.FC = () => {
  const appContext = useApp();
  const { db, bulkSaveMataPelajaran, showSaveNotification, setActiveMenu } = appContext;
  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();

  const [search, setSearch] = useState('');
  const [selectedKelompok, setSelectedKelompok] = useState<string>('SEMUA');

  // State SK Penetapan KKM
  const [skNumber, setSkNumber] = useState(
    `421.2/024/SK-KKM/${db.sekolah.namaSekolah?.replace(/\s+/g, '-').toUpperCase() || 'SDN-BALIL'}/2026`
  );
  const [skDate, setSkDate] = useState('15 Juli 2026');

  // Local draft state of subjects with KKM and aspects
  const [localMapels, setLocalMapels] = useState<Subject[]>(() => {
    return db.mataPelajaran.map((m) => ({
      ...m,
      kkm: m.kkm ?? 75,
      kompleksitas: m.kompleksitas ?? 75,
      dayaDukung: m.dayaDukung ?? 75,
      intake: m.intake ?? 75
    }));
  });

  // Keep local mapels synced with db.mataPelajaran
  useEffect(() => {
    setLocalMapels((prev) => {
      return db.mataPelajaran.map((m) => {
        const found = prev.find((p) => p.kode === m.kode || p.mataPelajaran === m.mataPelajaran);
        return {
          ...m,
          kkm: found?.kkm ?? m.kkm ?? 75,
          kompleksitas: found?.kompleksitas ?? m.kompleksitas ?? 75,
          dayaDukung: found?.dayaDukung ?? m.dayaDukung ?? 75,
          intake: found?.intake ?? m.intake ?? 75
        };
      });
    });
  }, [db.mataPelajaran]);

  // Update a specific field for a subject
  const handleUpdateSubjectKkm = (
    index: number,
    field: 'kkm' | 'kompleksitas' | 'dayaDukung' | 'intake',
    value: number
  ) => {
    setLocalMapels((prev) => {
      const copy = [...prev];
      if (!copy[index]) return prev;

      const numVal = Math.min(100, Math.max(0, Number(value) || 0));

      if (field === 'kkm') {
        copy[index] = {
          ...copy[index],
          kkm: numVal
        };
      } else {
        const updated = {
          ...copy[index],
          [field]: numVal
        };
        const komp = field === 'kompleksitas' ? numVal : updated.kompleksitas ?? 75;
        const daya = field === 'dayaDukung' ? numVal : updated.dayaDukung ?? 75;
        const intk = field === 'intake' ? numVal : updated.intake ?? 75;
        updated.kkm = Math.round((komp + daya + intk) / 3);
        copy[index] = updated;
      }

      return copy;
    });
  };

  // Quick apply uniform KKM to all subjects
  const handleApplyUniformKkm = (uniformValue: number) => {
    setLocalMapels((prev) =>
      prev.map((m) => ({
        ...m,
        kkm: uniformValue,
        kompleksitas: uniformValue,
        dayaDukung: uniformValue,
        intake: uniformValue
      }))
    );
    showSaveNotification(`KKM seragam ${uniformValue} berhasil diterapkan ke semua pelajaran.`);
  };

  // Hitung KKM Otomatis dari 3 Aspek untuk semua mapel
  const handleAutoCalculateAll = () => {
    setLocalMapels((prev) =>
      prev.map((m) => {
        const komp = m.kompleksitas ?? 75;
        const daya = m.dayaDukung ?? 75;
        const intk = m.intake ?? 75;
        const calcKkm = Math.round((komp + daya + intk) / 3);
        return {
          ...m,
          kkm: calcKkm
        };
      })
    );
    showSaveNotification('Nilai KKM seluruh pelajaran berhasil dihitung otomatis dari rata-rata 3 Aspek!');
  };

  // Save changes to database and sync to all scores
  const handleSaveAllKkm = () => {
    triggerSave(async () => {
      bulkSaveMataPelajaran(localMapels);
    });
  };

  // Calculate Interval & Ranges for a KKM
  const calculateInterval = (kkmVal: number) => {
    const kkm = Math.max(1, Math.min(99, kkmVal || 75));
    const range = 100 - kkm;
    const interval = Math.round(range / 3);

    const cMin = kkm;
    const cMax = Math.min(99, kkm + interval - 1);
    const bMin = cMax + 1;
    const bMax = Math.min(99, bMin + interval - 1);
    const aMin = bMax + 1;

    return {
      kkm,
      interval,
      d: `< ${kkm}`,
      c: `${cMin} - ${cMax}`,
      b: `${bMin} - ${bMax}`,
      a: `${aMin} - 100`
    };
  };

  // Filtered subjects
  const filteredMapels = useMemo(() => {
    return localMapels.filter((m) => {
      const matchSearch =
        m.mataPelajaran.toLowerCase().includes(search.toLowerCase()) ||
        (m.kode && m.kode.toLowerCase().includes(search.toLowerCase()));
      const matchKelompok = selectedKelompok === 'SEMUA' || m.kelompok === selectedKelompok;
      return matchSearch && matchKelompok;
    });
  }, [localMapels, search, selectedKelompok]);

  // Summary statistics
  const avgKkm = useMemo(() => {
    if (localMapels.length === 0) return 75;
    const total = localMapels.reduce((acc, m) => acc + (m.kkm ?? 75), 0);
    return Math.round(total / localMapels.length);
  }, [localMapels]);

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rowsData: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['PENETAPAN KRITERIA KETUNTASAN MINIMAL (KKM / KKTP) SEMUA MATA PELAJARAN'],
      [`Tahun Ajaran: ${db.sekolah.tahunPelajaran} • Kurikulum Merdeka • Rata-rata KKM: ${avgKkm}`],
      [`SK Penetapan: ${skNumber} • Tanggal: ${skDate}`],
      [],
      [
        'NO',
        'KODE',
        'MATA PELAJARAN',
        'KELOMPOK',
        'KOMPLEKSITAS',
        'DAYA DUKUNG',
        'INTAKE SISWA',
        'NILAI KKM',
        'PREDIKAT D (PERLU BIMBINGAN)',
        'PREDIKAT C (CUKUP)',
        'PREDIKAT B (BAIK)',
        'PREDIKAT A (SANGAT BAIK)'
      ],
      [
        '(1)',
        '(2)',
        '(3)',
        '(4)',
        '(5)',
        '(6)',
        '(7)',
        '(8)',
        '(9)',
        '(10)',
        '(11)',
        '(12)'
      ],
      ...localMapels.map((m, idx) => {
        const ranges = calculateInterval(m.kkm ?? 75);
        return [
          idx + 1,
          m.kode || `M0${idx + 1}`,
          m.mataPelajaran,
          m.kelompok,
          m.kompleksitas ?? 75,
          m.dayaDukung ?? 75,
          m.intake ?? 75,
          m.kkm ?? 75,
          ranges.d,
          ranges.c,
          ranges.b,
          ranges.a
        ];
      })
    ];

    const ws = XLSX.utils.aoa_to_sheet(rowsData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 38 },
      { wch: 16 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'KKM Semua Pelajaran');
    XLSX.writeFile(
      wb,
      `kkm-semua-pelajaran-${db.sekolah.namaSekolah?.toLowerCase().replace(/\s+/g, '-') || 'sdn-balil'}.xlsx`
    );
    showSaveNotification('File KKM Semua Pelajaran (.xlsx) berhasil diunduh!');
  };

  // Import from Excel
  const handleImportExcel = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_kkm', appContext);
      if (result.success) {
        showSaveNotification(result.message);
        setTimeout(() => {
          setLocalMapels(appContext.db.mataPelajaran.map((m) => ({
            ...m,
            kkm: m.kkm ?? 75,
            kompleksitas: m.kompleksitas ?? 75,
            dayaDukung: m.dayaDukung ?? 75,
            intake: m.intake ?? 75
          })));
        }, 100);
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal membaca file Excel KKM: ' + (e?.message || 'Format berkas tidak sesuai'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 shadow-2xs">
            <SlidersHorizontal size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-teal-700">
                Kriteria Ketuntasan Minimal (KKM / KKTP)
              </span>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                Semua Pelajaran
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              KKM / KKTP dari Semua Pelajaran ({db.sekolah.namaSekolah || 'SD Negeri Balil'})
            </h2>
            <p className="text-xs text-slate-500">
              Penetapan KKM seluruh mata pelajaran Kurikulum Merdeka berdasarkan 3 aspek: Kompleksitas, Daya Dukung, dan Intake Siswa.
            </p>
          </div>
        </div>

        {/* Action Highlights */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Rata-rata KKM Sekolah</span>
            <span className="text-base font-black text-teal-700 font-mono">{avgKkm}</span>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-300"
            title="Cetak format penetapan KKM resmi"
          >
            <Printer size={15} /> Cetak SK KKM
          </button>
          <button
            onClick={handleSaveAllKkm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Save size={15} /> Simpan KKM Semua Mapel
          </button>
        </div>
      </div>

      {/* Standard Action Toolbar */}
      <StandardActionToolbar
        title="Aksi KKM Pelajaran"
        badge={`${localMapels.length} Mapel`}
        onSave={handleSaveAllKkm}
        saveLabel="Simpan Perubahan KKM"
        saveStatus={saveStatus}
        onUpdate={handleSaveAllKkm}
        updateLabel="Sinkronkan KKM ke Rapor"
        onExport={handleExportExcel}
        exportLabel="Expor Excel KKM (.xlsx)"
        onImport={handleImportExcel}
        importLabel="Impor Excel KKM"
        onPrint={handlePrint}
        onTemplate={() => setActiveMenu('template_data')}
        templateLabel="Template Data"
      />

      {/* QUICK PRESET BAR: KKM TUNGGAL & HITUNG ASPEK */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-800">
              Atur KKM Seragam Cepat (KKM Tunggal Satuan Pendidikan):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[70, 72, 75, 78, 80].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleApplyUniformKkm(val)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors cursor-pointer shadow-2xs"
              >
                KKM {val} {val === 75 ? '(Standar SD)' : ''}
              </button>
            ))}
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <button
              type="button"
              onClick={handleAutoCalculateAll}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Hitung nilai KKM otomatis dari rata-rata Kompleksitas, Daya Dukung, dan Intake"
            >
              <Scale size={13} /> Hitung dari 3 Aspek
            </button>
          </div>
        </div>

        {/* SK & Information bar */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor SK Penetapan KKM:</label>
            <input
              type="text"
              value={skNumber}
              onChange={(e) => setSkNumber(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Penetapan SK:</label>
            <input
              type="text"
              value={skDate}
              onChange={(e) => setSkDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[11px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Kepala Sekolah Penanggung Jawab:</label>
            <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 truncate">
              {db.sekolah.namaKepalaSekolah || 'Selpius Nabyal, S.Pd.Gr.'}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun Ajaran Aktif:</label>
            <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 truncate">
              {db.sekolah.tahunPelajaran} • Semester {db.sekolah.semester}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari mata pelajaran atau kode..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Kelompok:</span>
          {['SEMUA', 'Wajib', 'Pilihan', 'Muatan Lokal'].map((kel) => (
            <button
              key={kel}
              type="button"
              onClick={() => setSelectedKelompok(kel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedKelompok === kel
                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {kel}
            </button>
          ))}
          <div className="text-xs text-slate-500 font-medium ml-2">
            Total: <strong className="text-slate-800">{filteredMapels.length}</strong> Pelajaran
          </div>
        </div>
      </div>

      {/* KKM TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-xs text-left divide-y divide-slate-200 border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-slate-100">
                  No
                </th>
                <th rowSpan={2} className="py-3 px-3 min-w-[200px]">
                  Mata Pelajaran
                </th>
                <th rowSpan={2} className="py-3 px-2 text-center w-28">
                  Kelompok
                </th>
                <th colSpan={3} className="py-2 px-2 text-center bg-indigo-50/70 border-l border-r border-indigo-100 text-indigo-900">
                  3 Aspek Penentu KKM (0 - 100)
                </th>
                <th rowSpan={2} className="py-3 px-3 text-center w-24 bg-teal-50 text-teal-950 font-black border-r border-teal-200">
                  Nilai KKM
                </th>
                <th colSpan={4} className="py-2 px-2 text-center bg-slate-100/80">
                  Rentang Predikat Ketuntasan
                </th>
              </tr>
              <tr className="border-t border-slate-200 bg-slate-50 text-[9px]">
                <th className="py-1.5 px-2 text-center w-20 bg-indigo-50/40 border-l border-indigo-100" title="Tingkat kerumitan kompetensi mata pelajaran">
                  Kompleksitas
                </th>
                <th className="py-1.5 px-2 text-center w-20 bg-indigo-50/40" title="Ketersediaan guru, buku, dan sarana prasarana">
                  Daya Dukung
                </th>
                <th className="py-1.5 px-2 text-center w-20 bg-indigo-50/40 border-r border-indigo-100" title="Kemampuan awal peserta didik">
                  Intake Siswa
                </th>
                <th className="py-1.5 px-2 text-center w-24 text-rose-700 bg-rose-50/40">D (Perlu Bimbingan)</th>
                <th className="py-1.5 px-2 text-center w-20 text-amber-700 bg-amber-50/40">C (Cukup)</th>
                <th className="py-1.5 px-2 text-center w-20 text-blue-700 bg-blue-50/40">B (Baik)</th>
                <th className="py-1.5 px-2 text-center w-20 text-emerald-700 bg-emerald-50/40">A (Sangat Baik)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMapels.map((m, idx) => {
                const ranges = calculateInterval(m.kkm ?? 75);
                const originalIndex = localMapels.findIndex(
                  (orig) => orig.kode === m.kode && orig.mataPelajaran === m.mataPelajaran
                );

                return (
                  <tr key={m.kode || m.mataPelajaran || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400 bg-slate-50">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-[13px]">{m.mataPelajaran}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Kode: {m.kode || `M0${idx + 1}`}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.kelompok === 'Wajib'
                            ? 'bg-blue-100 text-blue-800'
                            : m.kelompok === 'Pilihan'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {m.kelompok}
                      </span>
                    </td>

                    {/* 3 Aspek Inputs */}
                    <td className="py-2 px-1 text-center bg-indigo-50/20 border-l border-indigo-100">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={m.kompleksitas ?? 75}
                        onChange={(e) =>
                          handleUpdateSubjectKkm(originalIndex, 'kompleksitas', Number(e.target.value))
                        }
                        className="w-16 px-1.5 py-1 text-center font-mono font-bold text-slate-800 border border-slate-300 rounded-lg text-xs bg-white focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-1 text-center bg-indigo-50/20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={m.dayaDukung ?? 75}
                        onChange={(e) =>
                          handleUpdateSubjectKkm(originalIndex, 'dayaDukung', Number(e.target.value))
                        }
                        className="w-16 px-1.5 py-1 text-center font-mono font-bold text-slate-800 border border-slate-300 rounded-lg text-xs bg-white focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-1 text-center bg-indigo-50/20 border-r border-indigo-100">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={m.intake ?? 75}
                        onChange={(e) =>
                          handleUpdateSubjectKkm(originalIndex, 'intake', Number(e.target.value))
                        }
                        className="w-16 px-1.5 py-1 text-center font-mono font-bold text-slate-800 border border-slate-300 rounded-lg text-xs bg-white focus:border-indigo-500"
                      />
                    </td>

                    {/* Nilai KKM Final Input */}
                    <td className="py-2 px-2 text-center bg-teal-50/60 border-r border-teal-200">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={m.kkm ?? 75}
                        onChange={(e) =>
                          handleUpdateSubjectKkm(originalIndex, 'kkm', Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 text-center font-mono text-sm font-black text-teal-900 border-2 border-teal-400 rounded-lg bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                      />
                    </td>

                    {/* Rentang Predikat Otomatis */}
                    <td className="py-3 px-2 text-center font-mono text-rose-700 bg-rose-50/30 font-bold">
                      {ranges.d}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-amber-700 bg-amber-50/30 font-bold">
                      {ranges.c}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-blue-700 bg-blue-50/30 font-bold">
                      {ranges.b}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-emerald-700 bg-emerald-50/30 font-bold">
                      {ranges.a}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PEDOMAN PENETAPAN KKM RESMI KURIKULUM */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info size={16} className="text-teal-700" />
          <span>Panduan Resmi Penetapan Kriteria Ketuntasan Minimal (KKM / KKTP):</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
          <li>
            <strong>Kompleksitas:</strong> Kerumitan kompetensi dasar / tujuan pembelajaran. Jika materi sangat sulit dan rumit, nilainya lebih rendah; jika sederhana, nilainya tinggi (Rentang skor: 50 s.d. 100).
          </li>
          <li>
            <strong>Daya Dukung:</strong> Ketersediaan sarana prasarana sekolah, laboratorium, perpustakaan, buku paket, dan kualifikasi pendidik (Rentang skor: 50 s.d. 100).
          </li>
          <li>
            <strong>Intake Siswa:</strong> Kemampuan awal dan rerata nilai raport / hasil belajar siswa sebelumnya (Rentang skor: 50 s.d. 100).
          </li>
          <li>
            <strong>Perhitungan KKM:</strong> <code className="bg-white px-1.5 py-0.5 rounded border font-mono">KKM = (Kompleksitas + Daya Dukung + Intake) / 3</code>.
          </li>
          <li>
            <strong>Panjang Interval Predikat:</strong> <code className="bg-white px-1.5 py-0.5 rounded border font-mono">Interval = (100 - KKM) / 3</code>. Nilai ini menjadi batas otomatis predikat Sangat Baik (A), Baik (B), Cukup (C), dan Perlu Bimbingan (D) di buku rapor.
          </li>
        </ul>
      </div>

      {/* PRINTABLE OFFICIAL SHEET FOR PRINTING */}
      <div className="hidden print:block print:w-full print:p-6 bg-white text-slate-900">
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
          <div className="text-sm font-bold uppercase">{db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}</div>
          <div className="text-sm font-bold uppercase">{db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'}</div>
          <h1 className="text-xl font-black uppercase mt-1">{db.sekolah.namaSekolah || 'SD NEGERI BALIL'}</h1>
          <p className="text-xs text-slate-600">Alamat: {db.sekolah.alamat}, Kab. {db.sekolah.kabupaten}, Provinsi {db.sekolah.provinsi}</p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base font-black uppercase underline">
            SURAT KEPUTUSAN PENETAPAN KRITERIA KETUNTASAN MINIMAL (KKM / KKTP)
          </h2>
          <p className="text-xs font-bold mt-1">Nomor: {skNumber}</p>
          <p className="text-xs">Tahun Pelajaran: {db.sekolah.tahunPelajaran} • Kurikulum Merdeka</p>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-900 mb-8">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th className="border border-slate-900 p-2 w-8">No</th>
              <th className="border border-slate-900 p-2 text-left">Mata Pelajaran</th>
              <th className="border border-slate-900 p-2 w-20">Kelompok</th>
              <th className="border border-slate-900 p-2 w-14">KKM</th>
              <th className="border border-slate-900 p-2 w-24">D (&lt; KKM)</th>
              <th className="border border-slate-900 p-2 w-20">C (Cukup)</th>
              <th className="border border-slate-900 p-2 w-20">B (Baik)</th>
              <th className="border border-slate-900 p-2 w-24">A (Sangat Baik)</th>
            </tr>
          </thead>
          <tbody>
            {localMapels.map((m, i) => {
              const ranges = calculateInterval(m.kkm ?? 75);
              return (
                <tr key={i} className="border-t border-slate-900">
                  <td className="border border-slate-900 p-1.5 text-center font-mono">{i + 1}</td>
                  <td className="border border-slate-900 p-1.5 font-bold">{m.mataPelajaran}</td>
                  <td className="border border-slate-900 p-1.5 text-center">{m.kelompok}</td>
                  <td className="border border-slate-900 p-1.5 text-center font-bold font-mono">{m.kkm ?? 75}</td>
                  <td className="border border-slate-900 p-1.5 text-center font-mono">{ranges.d}</td>
                  <td className="border border-slate-900 p-1.5 text-center font-mono">{ranges.c}</td>
                  <td className="border border-slate-900 p-1.5 text-center font-mono">{ranges.b}</td>
                  <td className="border border-slate-900 p-1.5 text-center font-mono">{ranges.a}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 text-xs pt-4">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua Tim Pengembang Kurikulum</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{db.guru[0]?.namaGuru || 'Agus Rama, S.Pd.Gr.'}</p>
            <p className="font-mono">NIP: {db.guru[0]?.nip || '-'}</p>
          </div>
          <div className="text-center">
            <p>{db.sekolah.tempatRapor || 'Oksibil'}, {skDate}</p>
            <p className="font-bold">Kepala Sekolah,</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{db.sekolah.namaKepalaSekolah || 'Selpius Nabyal, S.Pd.Gr.'}</p>
            <p className="font-mono">NIP: {db.sekolah.nipKepalaSekolah || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
