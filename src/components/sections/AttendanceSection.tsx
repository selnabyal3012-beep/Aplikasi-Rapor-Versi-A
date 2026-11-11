import React, { useState } from 'react';
import { CalendarCheck, Save, CheckCircle2, FolderDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Attendance } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';

export const AttendanceSection: React.FC = () => {
  const { db, selectedKelas, selectedSemester, saveKehadiran, setActiveMenu } = useApp();
  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const [savedNotice, setSavedNotice] = useState(false);

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);

  // Prepare state per student
  const [attendances, setAttendances] = useState<Record<string, Attendance>>(() => {
    const map: Record<string, Attendance> = {};
    siswaKelas.forEach((s) => {
      const existing = db.kehadiran.find(
        (h) => h.nisn === s.nisn && h.semester === selectedSemester
      );
      if (existing) {
        map[s.nisn] = { ...existing };
      } else {
        map[s.nisn] = {
          id: `H_${s.nisn}_${selectedSemester}`,
          nisn: s.nisn,
          namaSiswa: s.namaSiswa,
          kelas: selectedKelas,
          semester: selectedSemester,
          tahunPelajaran: db.sekolah.tahunPelajaran,
          sakit: 0,
          izin: 0,
          alpa: 0,
          totalHari: 0
        };
      }
    });
    return map;
  });

  const handleChange = (nisn: string, field: 'sakit' | 'izin' | 'alpa', val: number) => {
    setAttendances((prev) => {
      const current = prev[nisn];
      const updatedVal = Math.max(0, val || 0);
      const updated = {
        ...current,
        [field]: updatedVal
      };
      updated.totalHari = Number(updated.sakit) + Number(updated.izin) + Number(updated.alpa);
      return { ...prev, [nisn]: updated };
    });
  };

  const handleSaveAll = () => {
    triggerSave(() => {
      Object.values(attendances).forEach((att) => {
        saveKehadiran(att);
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      [`REKAPITULASI KEHADIRAN SISWA - KELAS ${selectedKelas} (${selectedSemester.toUpperCase()})`],
      [`Tahun Ajaran: ${db.sekolah.tahunPelajaran} • Kurikulum Merdeka`],
      [],
      ['NO', 'NISN', 'NAMA SISWA', 'SAKIT (HARI)', 'IZIN (HARI)', 'ALPA (HARI)', 'TOTAL ABSEN'],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)'],
      ...siswaKelas.map((s, i) => {
        const item = attendances[s.nisn] || { sakit: 0, izin: 0, alpa: 0, totalHari: 0 };
        return [
          i + 1,
          s.nisn,
          s.namaSiswa,
          item.sakit,
          item.izin,
          item.alpa,
          item.totalHari
        ];
      })
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran Siswa');
    XLSX.writeFile(wb, `kehadiran-siswa-kelas-${selectedKelas}-${selectedSemester}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rowsJson = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 });
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rowsJson.length, 12); i++) {
        const rowStr = (rowsJson[i] || []).join(' ').toLowerCase();
        if (rowStr.includes('nisn') || rowStr.includes('nama') || rowStr.includes('sakit')) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx >= 0) {
        const headers = rowsJson[headerIdx].map((h) => String(h || '').toLowerCase());
        const nisnCol = headers.findIndex((h) => h.includes('nisn'));
        const sCol = headers.findIndex((h) => h.includes('sakit'));
        const iCol = headers.findIndex((h) => h.includes('izin'));
        const aCol = headers.findIndex((h) => h.includes('alpa') || h.includes('tanpa'));

        setAttendances((prev) => {
          const next = { ...prev };
          for (let r = headerIdx + 1; r < rowsJson.length; r++) {
            const rowData = rowsJson[r];
            if (!rowData || rowData.length === 0) continue;
            const nisnVal = String(rowData[nisnCol] || '').trim();
            if (nisnVal && next[nisnVal]) {
              const sVal = sCol >= 0 ? Number(rowData[sCol]) || 0 : next[nisnVal].sakit;
              const iVal = iCol >= 0 ? Number(rowData[iCol]) || 0 : next[nisnVal].izin;
              const aVal = aCol >= 0 ? Number(rowData[aCol]) || 0 : next[nisnVal].alpa;
              next[nisnVal] = {
                ...next[nisnVal],
                sakit: sVal,
                izin: iVal,
                alpa: aVal,
                totalHari: sVal + iVal + aVal
              };
            }
          }
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = () => {
    if (confirm('Kosongkan semua data absen menjadi 0 hari?')) {
      setAttendances((prev) => {
        const next: Record<string, Attendance> = {};
        Object.entries(prev).forEach(([nisn, item]) => {
          next[nisn] = { ...item, sakit: 0, izin: 0, alpa: 0, totalHari: 0 };
        });
        return next;
      });
    }
  };

  const handleReset = () => {
    const map: Record<string, Attendance> = {};
    siswaKelas.forEach((s) => {
      const existing = db.kehadiran.find((h) => h.nisn === s.nisn && h.semester === selectedSemester);
      if (existing) map[s.nisn] = { ...existing };
      else
        map[s.nisn] = {
          id: `H_${s.nisn}_${selectedSemester}`,
          nisn: s.nisn,
          namaSiswa: s.namaSiswa,
          kelas: selectedKelas,
          semester: selectedSemester,
          tahunPelajaran: db.sekolah.tahunPelajaran,
          sakit: 0,
          izin: 0,
          alpa: 0,
          totalHari: 0
        };
    });
    setAttendances(map);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl border border-cyan-100">
            <CalendarCheck size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-700">
              Kedisiplinan & Presensi
            </span>
            <h2 className="text-xl font-bold text-slate-800">Kehadiran Siswa (Presensi Semester)</h2>
            <p className="text-xs text-slate-500">
              Tabel KEHADIRAN: Rekap jumlah hari Sakit, Izin, dan Tanpa Keterangan (Alpa) Kelas {selectedKelas} Semester {selectedSemester}.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-900 text-white border-2 border-emerald-400 text-xs font-bold shadow-md animate-pulse">
              <CheckCircle2 size={15} className="text-emerald-300" />
              <span>Data Berhasil Disimpan & Terhubung Otomatis</span>
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveMenu('template_data')}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200"
              title="Lihat & Unduh Template Data Kehadiran Siswa"
            >
              <FolderDown size={14} /> Unduh Template Presensi
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveAll}
                disabled={saveStatus === 'saving'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={15} /> Simpan Data Kehadiran
              </button>
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedText={lastSavedTime}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP PRESENSI KEHADIRAN */}
      <StandardActionToolbar
        title="Aksi Data Kehadiran"
        badge={`Kelas ${selectedKelas} • ${selectedSemester}`}
        onSave={handleSaveAll}
        saveLabel="Simpan Presensi"
        saveStatus={saveStatus}
        onUpdate={handleSaveAll}
        updateLabel="Update Presensi"
        onEdit={handleSaveAll}
        editLabel="Edit Presensi"
        onCancel={handleReset}
        cancelLabel="Batal / Reset"
        onDelete={handleClearAll}
        deleteLabel="Kosongkan (0 Hari)"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File Presensi"
        onClear={handleClearAll}
        clearLabel="Bersihkan / 0 Hari"
        onTemplate={() => setActiveMenu('template_data')}
        templateLabel="Template Kehadiran"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">NISN & Nama Siswa</th>
                <th className="py-3 px-4 text-center w-36">Sakit (S)</th>
                <th className="py-3 px-4 text-center w-36">Izin (I)</th>
                <th className="py-3 px-4 text-center w-36">Tanpa Keterangan (A)</th>
                <th className="py-3 px-4 text-center w-40 bg-cyan-950 text-cyan-300">Total Absen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siswaKelas.map((s, idx) => {
                const item = attendances[s.nisn] || {
                  sakit: 0,
                  izin: 0,
                  alpa: 0,
                  totalHari: 0
                };
                return (
                  <tr key={s.nisn} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{s.namaSiswa}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.nisn}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.sakit}
                        onChange={(e) => handleChange(s.nisn, 'sakit', parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-1.5 text-center font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.izin}
                        onChange={(e) => handleChange(s.nisn, 'izin', parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-1.5 text-center font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.alpa}
                        onChange={(e) => handleChange(s.nisn, 'alpa', parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-1.5 text-center font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4 text-center bg-cyan-50 font-black text-cyan-900 text-sm font-mono">
                      {item.totalHari} Hari
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRATINJAU FORMAT RESMI RAPOR: C. KETIDAKHADIRAN (SUSUN KE BAWAH) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CalendarCheck size={16} className="text-cyan-700" />
              Format Cetak Rapor: C. KETIDAKHADIRAN (Susun Ke Bawah)
            </h3>
            <p className="text-xs text-slate-500">
              Format tampilan resmi yang tercetak pada lembar Rapor Siswa sesuai arahan kurikulum.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {siswaKelas.slice(0, 3).map((s) => {
            const item = attendances[s.nisn] || {
              sakit: 0,
              izin: 0,
              alpa: 0,
              totalHari: 0
            };
            return (
              <div key={s.nisn} className="bg-slate-50/80 rounded-xl p-4 border border-slate-300 shadow-xs">
                <div className="text-xs font-bold text-slate-800 mb-1">{s.namaSiswa}</div>
                <div className="text-[10px] text-slate-500 font-mono mb-3">NISN: {s.nisn} | Kelas {selectedKelas}</div>

                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                  C. KETIDAKHADIRAN
                </div>

                <table className="w-full text-xs border-collapse border border-slate-800 bg-white shadow-2xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold">
                      <th className="border border-slate-800 py-1.5 px-3 text-left">Keterangan</th>
                      <th className="border border-slate-800 py-1.5 px-3 text-center w-28">Jumlah Hari</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-800 py-1.5 px-3 font-medium">Sakit (S)</td>
                      <td className="border border-slate-800 py-1.5 px-3 text-center font-bold font-mono">
                        {item.sakit} hari
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 py-1.5 px-3 font-medium">Izin (I)</td>
                      <td className="border border-slate-800 py-1.5 px-3 text-center font-bold font-mono">
                        {item.izin} hari
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 py-1.5 px-3 font-medium">Tanpa Keterangan (A)</td>
                      <td className="border border-slate-800 py-1.5 px-3 text-center font-bold font-mono">
                        {item.alpa} hari
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

