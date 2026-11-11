import React, { useState } from 'react';
import { MessageSquare, Save, CheckCircle2, Sparkles, FolderDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TeacherNote } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const TeacherNoteSection: React.FC = () => {
  const appContext = useApp();
  const { db, selectedKelas, selectedSemester, saveCatatanWali, showSaveNotification, setActiveMenu } = appContext;
  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const [savedNotice, setSavedNotice] = useState(false);

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);

  const [notes, setNotes] = useState<Record<string, TeacherNote>>(() => {
    const map: Record<string, TeacherNote> = {};
    siswaKelas.forEach((s) => {
      const match = db.catatanWali.find(
        (c) => c.nisn === s.nisn && c.semester === selectedSemester
      );
      if (match) {
        map[s.nisn] = { ...match };
      } else {
        map[s.nisn] = {
          id: `CW_${s.nisn}_${selectedSemester}`,
          nisn: s.nisn,
          namaSiswa: s.namaSiswa,
          kelas: selectedKelas,
          semester: selectedSemester,
          tahunPelajaran: db.sekolah.tahunPelajaran,
          catatanWaliKelas: 'Menunjukkan sikap belajar yang baik dan aktif dalam kelas. Terus pertahankan semangat belajarmu!'
        };
      }
    });
    return map;
  });

  const handleTextChange = (nisn: string, text: string) => {
    setNotes((prev) => ({
      ...prev,
      [nisn]: { ...prev[nisn], catatanWaliKelas: text }
    }));
  };

  const handleApplyPreset = (nisn: string, preset: string) => {
    setNotes((prev) => ({
      ...prev,
      [nisn]: { ...prev[nisn], catatanWaliKelas: preset }
    }));
  };

  const handleSaveAll = () => {
    triggerSave(() => {
      Object.values(notes).forEach((n) => {
        saveCatatanWali(n);
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    });
  };

  const handleClearAll = () => {
    if (confirm('Bersihkan seluruh catatan wali kelas menjadi kosong?')) {
      const emptyNotes: Record<string, TeacherNote> = {};
      siswaKelas.forEach((s) => {
        emptyNotes[s.nisn] = {
          ...notes[s.nisn],
          catatanWaliKelas: ''
        };
      });
      setNotes(emptyNotes);
    }
  };

  const handleReset = () => {
    const defaultNotes: Record<string, TeacherNote> = {};
    siswaKelas.forEach((s) => {
      defaultNotes[s.nisn] = {
        id: `CW_${s.nisn}_${selectedSemester}`,
        nisn: s.nisn,
        namaSiswa: s.namaSiswa,
        kelas: selectedKelas,
        semester: selectedSemester,
        tahunPelajaran: db.sekolah.tahunPelajaran,
        catatanWaliKelas: 'Menunjukkan sikap belajar yang baik dan aktif dalam kelas. Terus pertahankan semangat belajarmu!'
      };
    });
    setNotes(defaultNotes);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['CATATAN WALI KELAS'],
      [`Kelas: ${selectedKelas} • Semester: ${selectedSemester} • Tahun Ajaran: ${db.sekolah.tahunPelajaran}`],
      [],
      ['NO', 'NISN', 'NAMA SISWA', 'KELAS', 'SEMESTER', 'CATATAN WALI KELAS'],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)'],
      ...siswaKelas.map((s, idx) => [
        idx + 1,
        s.nisn,
        s.namaSiswa,
        selectedKelas,
        selectedSemester,
        notes[s.nisn]?.catatanWaliKelas || ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 10 },
      { wch: 12 },
      { wch: 60 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Catatan Wali');
    XLSX.writeFile(wb, `catatan-wali-kelas-${selectedKelas}-${selectedSemester}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_catatan_wali', appContext);
      if (result.success) {
        showSaveNotification(result.message);
        setTimeout(() => {
          setNotes((prev) => {
            const next = { ...prev };
            const currentList = appContext.db.catatanWali;
            siswaKelas.forEach((s) => {
              const matched = currentList.find(
                (c) => c.nisn === s.nisn && c.semester === selectedSemester
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
      console.error(e);
      alert('Gagal mengimpor file catatan wali: ' + (e?.message || 'Format tidak sesuai'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <MessageSquare size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-700">
              Pesan & Motivasi Guru
            </span>
            <h2 className="text-xl font-bold text-slate-800">Catatan Wali Kelas</h2>
            <p className="text-xs text-slate-500">
              Tabel CATATAN_WALI: Pesan perkembangan sikap, apresiasi, dan motivasi dari Wali Kelas di lembar rapor siswa.
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
              title="Lihat & Unduh Template Catatan Wali Kelas"
            >
              <FolderDown size={14} /> Unduh Template Catatan
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveAll}
                disabled={saveStatus === 'saving'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={15} /> Simpan Semua Catatan
              </button>
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedText={lastSavedTime}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Catatan Wali"
        badge={`Kelas ${selectedKelas} • ${selectedSemester}`}
        onSave={handleSaveAll}
        saveLabel="Simpan Catatan"
        saveStatus={saveStatus}
        onUpdate={handleSaveAll}
        updateLabel="Update Catatan"
        onEdit={handleSaveAll}
        editLabel="Edit Catatan"
        onCancel={handleReset}
        cancelLabel="Batal / Reset Default"
        onDelete={handleClearAll}
        deleteLabel="Hapus / Kosongkan"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File Catatan"
        onClear={handleClearAll}
        clearLabel="Bersihkan File"
        templateLabel="Template Catatan"
      />

      {/* List per siswa */}
      <div className="space-y-4">
        {siswaKelas.map((s, idx) => {
          const item = notes[s.nisn] || { catatanWaliKelas: '' };
          return (
            <div
              key={s.nisn}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm">{s.namaSiswa}</h3>
                  <span className="text-xs text-slate-400 font-mono">({s.nisn})</span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400 mr-1">Template cepat:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        s.nisn,
                        'Menunjukkan perkembangan belajar yang sangat baik dan aktif. Terus tingkatkan kemampuan membaca dan ketelitian menulis.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-600 cursor-pointer"
                  >
                    Prestasi Tinggi
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        s.nisn,
                        'Rajin, sopan, dan memiliki hubungan pertemanan yang sangat positif. Tingkatkan rasa percaya diri untuk aktif berbicara di depan kelas.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-600 cursor-pointer"
                  >
                    Motivasi Sosial
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        s.nisn,
                        'Memiliki potensi yang sangat baik. Diharapkan lebih fokus dan disiplin dalam mengulang pelajaran di rumah bersama orang tua.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-600 cursor-pointer"
                  >
                    Perlu Pendampingan
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={item.catatanWaliKelas}
                onChange={(e) => handleTextChange(s.nisn, e.target.value)}
                placeholder="Tuliskan catatan wali kelas untuk siswa ini..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
