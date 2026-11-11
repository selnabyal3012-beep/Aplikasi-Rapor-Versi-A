import React, { useState } from 'react';
import { Award, Plus, Trash2, Edit2, Save, X, CheckCircle2, FolderDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Extracurricular } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const ExtracurricularSection: React.FC = () => {
  const appContext = useApp();
  const { db, selectedKelas, selectedSemester, saveEkskul, deleteEkskul, showSaveNotification, setActiveMenu } = appContext;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Extracurricular | null>(null);

  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);

  const defaultNew: Extracurricular = {
    id: `E00${db.ekstrakurikuler.length + 1}`,
    nisn: siswaKelas[0]?.nisn || '',
    namaSiswa: siswaKelas[0]?.namaSiswa || '',
    kelas: selectedKelas,
    semester: selectedSemester,
    tahunPelajaran: db.sekolah.tahunPelajaran,
    jenisEkstrakurikuler: 'Pramuka Siaga/Penggalang',
    predikat: 'Baik',
    keterangan: 'Aktif dan disiplin mengikuti kegiatan mingguan.'
  };

  const [formData, setFormData] = useState<Extracurricular>(defaultNew);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ...defaultNew,
      id: `E00${db.ekstrakurikuler.length + 1}`,
      nisn: siswaKelas[0]?.nisn || '',
      namaSiswa: siswaKelas[0]?.namaSiswa || ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Extracurricular) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedSiswa = db.siswa.find((s) => s.nisn === formData.nisn);
    const finalized = {
      ...formData,
      namaSiswa: matchedSiswa ? matchedSiswa.namaSiswa : formData.namaSiswa
    };
    saveEkskul(finalized);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data ekstrakurikuler ini?')) {
      deleteEkskul(id);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DATA KEGIATAN EKSTRAKURIKULER'],
      [`Kelas: ${selectedKelas} • Semester: ${selectedSemester} • Tahun Ajaran: ${db.sekolah.tahunPelajaran}`],
      [],
      ['NO', 'NISN', 'NAMA SISWA', 'EKSTRAKURIKULER', 'PREDIKAT', 'KETERANGAN'],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)'],
      ...listEkskul.map((e, idx) => [
        idx + 1,
        e.nisn,
        e.namaSiswa,
        e.jenisEkstrakurikuler,
        e.predikat,
        e.keterangan
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 26 }, { wch: 14 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Ekstrakurikuler');
    XLSX.writeFile(wb, `ekstrakurikuler-kelas-${selectedKelas}-${selectedSemester}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_ekskul', appContext);
      if (result.success) {
        showSaveNotification(result.message);
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal mengimpor file: ' + (e?.message || 'Format tidak sesuai'));
    }
  };

  const listEkskul = db.ekstrakurikuler.filter(
    (e) => e.kelas === selectedKelas && e.semester === selectedSemester
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Award size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">
              Pengembangan Bakat & Minat
            </span>
            <h2 className="text-xl font-bold text-slate-800">Kegiatan Ekstrakurikuler</h2>
            <p className="text-xs text-slate-500">
              Tabel EKSTRAKURIKULER: Pramuka, Olahraga, Tari Daerah, Noken Kriya, dan Musik Tradisional.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-amber-200"
            title="Lihat & Unduh Template Data Ekstrakurikuler"
          >
            <FolderDown size={14} /> Unduh Template Ekskul
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} /> Tambah Data Ekstrakurikuler
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP EKSTRAKURIKULER DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Ekstrakurikuler"
        badge={`Kelas ${selectedKelas} • ${listEkskul.length} Data`}
        onSave={handleOpenAdd}
        saveLabel="Tambah Ekskul"
        onUpdate={handleOpenAdd}
        updateLabel="Update Ekskul"
        onEdit={handleOpenAdd}
        editLabel="Edit Ekskul"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {
          if (listEkskul.length > 0) {
            handleDelete(listEkskul[listEkskul.length - 1].id);
          }
        }}
        deleteLabel="Hapus Item Terakhir"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onClear={() => {}}
        clearLabel="Bersihkan Filter"
        templateLabel="Template Ekskul"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">NISN & Nama Siswa</th>
                <th className="py-3 px-3">Jenis Kegiatan Ekstrakurikuler</th>
                <th className="py-3 px-3 text-center">Predikat</th>
                <th className="py-3 px-3">Keterangan / Catatan Pembina</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listEkskul.map((e, idx) => (
                <tr key={e.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{e.namaSiswa}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{e.nisn}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {e.jenisEkstrakurikuler}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        e.predikat === 'Sangat Baik'
                          ? 'bg-emerald-100 text-emerald-800'
                          : e.predikat === 'Baik'
                          ? 'bg-blue-100 text-blue-800'
                          : e.predikat === 'Cukup'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {e.predikat}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{e.keterangan}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(e)}
                        className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {listEkskul.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data ekstrakurikuler untuk kelas {selectedKelas}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-amber-700 to-orange-700 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Award size={18} /> {editingItem ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler Siswa'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa *</label>
                <select
                  value={formData.nisn}
                  onChange={(e) => {
                    const chosen = siswaKelas.find((s) => s.nisn === e.target.value);
                    setFormData({
                      ...formData,
                      nisn: e.target.value,
                      namaSiswa: chosen ? chosen.namaSiswa : ''
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  {siswaKelas.map((s) => (
                    <option key={s.nisn} value={s.nisn}>
                      {s.namaSiswa} ({s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Ekstrakurikuler *</label>
                <input
                  type="text"
                  required
                  value={formData.jenisEkstrakurikuler}
                  onChange={(e) => setFormData({ ...formData, jenisEkstrakurikuler: e.target.value })}
                  placeholder="Pramuka, Olahraga, Kesenian..."
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Predikat Penilaian</label>
                <select
                  value={formData.predikat}
                  onChange={(e: any) => setFormData({ ...formData, predikat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  <option value="Sangat Baik">Sangat Baik</option>
                  <option value="Baik">Baik</option>
                  <option value="Cukup">Cukup</option>
                  <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Aktivitas</label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Contoh: Aktif dan disiplin mengikuti kegiatan perkemahan serta latihan rutin."
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Catatan: Data Berhasil Disimpan & Terhubung Otomatis
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border rounded-xl font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save size={14} /> Simpan Data
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
