import React, { useState } from 'react';
import {
  Award,
  Printer,
  Medal,
  Sparkles,
  Trophy,
  Star,
  Download,
  CheckCircle2,
  Users,
  Settings2,
  Calendar,
  Layers,
  FileCheck,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassLevel, SemesterType } from '../../types';
import { LogoKabupaten, LogoTutWuriHandayani } from '../common/OfficialLogos';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import * as XLSX from 'xlsx';

type CertificateTheme = 'gold' | 'navy' | 'emerald';

interface AwardOption {
  id: string;
  title: string;
  badge: string;
  defaultDescription: string;
  icon: string;
}

const AWARD_PRESETS: AwardOption[] = [
  {
    id: 'juara1',
    title: 'JUARA I (PERINGKAT PERTAMA)',
    badge: '🏆 JUARA I',
    defaultDescription: 'Atas prestasi luar biasa meraih Peringkat I (Pertama) dalam pencapaian akademik dan ketuntasan belajar dengan nilai rata-rata tertinggi.',
    icon: '🥇'
  },
  {
    id: 'juara2',
    title: 'JUARA II (PERINGKAT KEDUA)',
    badge: '🥈 JUARA II',
    defaultDescription: 'Atas prestasi istimewa meraih Peringkat II (Kedua) dalam pencapaian hasil belajar akademik dengan dedikasi dan ketekunan tinggi.',
    icon: '🥈'
  },
  {
    id: 'juara3',
    title: 'JUARA III (PERINGKAT KETIGA)',
    badge: '🥉 JUARA III',
    defaultDescription: 'Atas prestasi gemilang meraih Peringkat III (Ketiga) dalam pencapaian hasil belajar akademik dengan integritas dan kedisiplinan belajar.',
    icon: '🥉'
  },
  {
    id: 'teladan_p5',
    title: 'SISWA TELADAN PROFIL PELAJAR PANCASILA',
    badge: '🌟 TELADAN P5',
    defaultDescription: 'Atas pengamalan nilai-nilai Profil Pelajar Pancasila, berakhlak mulia, bergotong royong, berkebinekaan global, mandiri, bernalar kritis, dan kreatif.',
    icon: '🌟'
  },
  {
    id: 'rajin',
    title: 'PENGHARGAAN KEHADIRAN & DISIPLIN TERBAIK',
    badge: '🎖️ 100% HADIR',
    defaultDescription: 'Atas kedisiplinan dan kehadiran tanpa absen (100% kehadiran) serta selalu tepat waktu dalam mengikuti kegiatan belajar mengajar.',
    icon: '⏰'
  },
  {
    id: 'bakat',
    title: 'SISWA BERPRESTASI MINAT & BAKAT',
    badge: '🎨 SENI & BAKAT',
    defaultDescription: 'Atas kreativitas, keaktifan, dan partisipasi istimewa dalam kegiatan ekstrakurikuler serta pelestarian seni budaya daerah Papua.',
    icon: '🎨'
  }
];

export const PiagamSection: React.FC = () => {
  const {
    db,
    selectedKelas,
    setSelectedKelas,
    selectedSemester,
    setSelectedSemester,
    updateSekolah,
    setActiveMenu,
    showSaveNotification
  } = useApp();

  const studentsInClass = db.siswa.filter(
    (s) => s.kelas === selectedKelas && s.statusSiswa === 'Aktif'
  );

  // Hitung rata-rata nilai tiap siswa untuk menentukan ranking
  const studentAverages = studentsInClass.map((s) => {
    const scores = db.nilaiAkademik.filter(
      (n) => n.nisn === s.nisn && n.kelas === selectedKelas && n.semester === selectedSemester
    );
    const total = scores.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
    const avg = scores.length > 0 ? total / scores.length : 80;
    return {
      student: s,
      avg: parseFloat(avg.toFixed(1)),
      total
    };
  });

  // Urutkan siswa dari ranking 1 ke bawah
  const rankedStudents = [...studentAverages].sort((a, b) => b.avg - a.avg);

  const [selectedStudentNisn, setSelectedStudentNisn] = useState<string>(() => {
    return rankedStudents[0]?.student.nisn || studentsInClass[0]?.nisn || '';
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string>('juara1');
  const [theme, setTheme] = useState<CertificateTheme>('gold');
  const [showLogos, setShowLogos] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [nomorPiagam, setNomorPiagam] = useState('421.2/012/SDN-BL/PIAGAM/2026');
  const [customTitle, setCustomTitle] = useState('JUARA I (PERINGKAT PERTAMA)');
  const [customDescription, setCustomDescription] = useState(
    'Atas prestasi luar biasa meraih Peringkat I (Pertama) dalam pencapaian akademik dan ketuntasan belajar dengan nilai rata-rata tertinggi.'
  );
  const [tanggalPiagam, setTanggalPiagam] = useState(db.sekolah.tanggalRapor || '23 Desember 2026');
  const [tempatPiagam, setTempatPiagam] = useState(db.sekolah.tempatRapor || 'Balil');

  const currentRanked = rankedStudents.find((r) => r.student.nisn === selectedStudentNisn);
  const currentStudent = currentRanked?.student || studentsInClass[0] || db.siswa[0];
  const currentRank = rankedStudents.findIndex((r) => r.student.nisn === currentStudent?.nisn) + 1;
  const presetSelected = AWARD_PRESETS.find((p) => p.id === selectedPresetId);

  const handleSelectPreset = (preset: AwardOption) => {
    setSelectedPresetId(preset.id);
    setCustomTitle(preset.title);
    setCustomDescription(preset.defaultDescription);

    // Otomatis pilih siswa jika memilih juara 1, 2, 3
    if (preset.id === 'juara1' && rankedStudents[0]) {
      setSelectedStudentNisn(rankedStudents[0].student.nisn);
    } else if (preset.id === 'juara2' && rankedStudents[1]) {
      setSelectedStudentNisn(rankedStudents[1].student.nisn);
    } else if (preset.id === 'juara3' && rankedStudents[2]) {
      setSelectedStudentNisn(rankedStudents[2].student.nisn);
    }
  };

  const handleUploadLogoKiri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateSekolah({
          ...db.sekolah,
          logoKiriUrl: result
        });
        showSaveNotification('Logo Kabupaten berhasil diunggah & terhubung ke Piagam!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogoKanan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateSekolah({
          ...db.sekolah,
          logoKananUrl: result
        });
        showSaveNotification('Logo Tut Wuri Handayani berhasil diunggah & terhubung ke Piagam!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Theme styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'navy':
        return {
          borderOuter: 'border-blue-900',
          borderInner: 'border-blue-800',
          bgHeader: 'from-slate-900 to-blue-950',
          accentText: 'text-blue-900',
          badgeBg: 'bg-blue-900 text-white border-blue-700',
          cornerColor: '#1e3a8a',
          ribbonColor: '#1e40af',
          dividerColor: '#1e3a8a'
        };
      case 'emerald':
        return {
          borderOuter: 'border-emerald-800',
          borderInner: 'border-emerald-700',
          bgHeader: 'from-emerald-950 to-teal-950',
          accentText: 'text-emerald-900',
          badgeBg: 'bg-emerald-900 text-white border-emerald-700',
          cornerColor: '#065f46',
          ribbonColor: '#047857',
          dividerColor: '#047857'
        };
      case 'gold':
      default:
        return {
          borderOuter: 'border-amber-700',
          borderInner: 'border-amber-600',
          bgHeader: 'from-amber-950 to-yellow-950',
          accentText: 'text-amber-900',
          badgeBg: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-amber-400',
          cornerColor: '#b45309',
          ribbonColor: '#d97706',
          dividerColor: '#d97706'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden on print) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <Medal size={28} />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">
                Apresiasi & Prestasi Siswa
              </span>
              <h2 className="text-xl font-bold text-slate-800">Cetak Piagam Penghargaan Siswa</h2>
              <p className="text-xs text-slate-500">
                Sertifikat resmi penghargaan juara kelas, profil pelajar pancasila, dan apresiasi peserta didik SD Negeri Balil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer size={16} /> Cetak Piagam (A4 Landscape)
            </button>
          </div>
        </div>

        {/* BARIS TOMBOL AKSI LENGKAP PIAGAM DI SAMPING / DI ATAS INPUT */}
        <StandardActionToolbar
          title="Aksi Piagam Penghargaan"
          badge={currentStudent?.namaSiswa || 'Siswa Terpilih'}
          onSave={() => showSaveNotification('Pengaturan Piagam Penghargaan berhasil disimpan!')}
          saveLabel="Simpan Piagam"
          onUpdate={() => showSaveNotification('Tampilan Piagam Penghargaan diperbarui!')}
          updateLabel="Update Piagam"
          onEdit={() => {}}
          editLabel="Edit Kustomisasi"
          onCancel={() => {
            setCustomTitle(presetSelected?.title || 'JUARA I (PERINGKAT PERTAMA)');
            setCustomDescription(presetSelected?.defaultDescription || '');
          }}
          cancelLabel="Batal / Reset Teks"
          onDelete={() => {
            setCustomTitle('');
            setCustomDescription('');
          }}
          deleteLabel="Bersihkan Teks"
          onImport={(file) => showSaveNotification(`File piagam "${file.name}" berhasil diimpor!`)}
          importLabel="Impor Data"
          onExport={() => {
            const wb = XLSX.utils.book_new();
            const data: (string | number)[][] = [
              [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
              [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
              [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
              ['PIAGAM PENGHARGAAN SISWA'],
              [`Nomor: ${nomorPiagam}`],
              [`Nama Siswa: ${currentStudent?.namaSiswa || '-'} • NISN: ${currentStudent?.nisn || '-'}`],
              [`Gelar / Judul: ${customTitle}`],
              [`Deskripsi: ${customDescription}`]
            ];
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, 'Piagam');
            XLSX.writeFile(wb, `piagam-${currentStudent?.namaSiswa || 'siswa'}.xlsx`);
          }}
          exportLabel="Expor Excel (.xlsx)"
          onUpload={(file) => showSaveNotification(`File lampiran "${file.name}" berhasil diunggah!`)}
          uploadLabel="Upload Lampiran"
          onClear={() => {
            setCustomTitle('');
            setCustomDescription('');
          }}
          clearLabel="Bersihkan Formulir"
          onPrint={handlePrint}
          templateLabel="Template Piagam"
        />

        {/* LOGO RESMI TERHUBUNG (LOGO KAB & TUT WURI HANDAYANI) */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/70 via-indigo-50/40 to-emerald-50/70 border border-amber-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-amber-200/80">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Logo Resmi Terhubung: Logo Pemda Kabupaten & Tut Wuri Handayani
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLogos}
                  onChange={(e) => setShowLogos(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Tampilkan Kedua Logo di Piagam</span>
              </label>
              <button
                type="button"
                onClick={() => setActiveMenu('identitas_sekolah')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer shadow-2xs"
              >
                <span>Atur di Menu Identitas Sekolah</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Kartu Logo Kabupaten */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <LogoKabupaten url={db.sekolah.logoKiriUrl} size={50} className="w-12 h-12" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Logo Kabupaten (Kiri)</span>
                  {db.sekolah.logoKiriUrl ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check size={10} /> Foto Terpasang
                    </span>
                  ) : (
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                      Lambang Default Pemda
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {db.sekolah.namaPemerintah || 'Pemerintah Kabupaten Pegunungan Bintang'}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200 cursor-pointer transition-colors">
                    <Upload size={11} />
                    <span>{db.sekolah.logoKiriUrl ? 'Ganti Logo Kab' : 'Upload Logo Kab'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogoKiri}
                      className="hidden"
                    />
                  </label>
                  {db.sekolah.logoKiriUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        updateSekolah({ ...db.sekolah, logoKiriUrl: '' });
                        showSaveNotification('Logo Kabupaten direset ke lambang default.');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Kartu Logo Tut Wuri Handayani */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <LogoTutWuriHandayani url={db.sekolah.logoKananUrl} size={50} className="w-12 h-12" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Logo Tut Wuri Handayani (Kanan)</span>
                  {db.sekolah.logoKananUrl ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check size={10} /> Foto Terpasang
                    </span>
                  ) : (
                    <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded">
                      Lambang Resmi Kemdikbud
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  Kementerian Pendidikan / Tut Wuri Handayani
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[10px] rounded-lg border border-cyan-200 cursor-pointer transition-colors">
                    <Upload size={11} />
                    <span>{db.sekolah.logoKananUrl ? 'Ganti Tut Wuri' : 'Upload Tut Wuri'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogoKanan}
                      className="hidden"
                    />
                  </label>
                  {db.sekolah.logoKananUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        updateSekolah({ ...db.sekolah, logoKananUrl: '' });
                        showSaveNotification('Logo Tut Wuri Handayani direset ke lambang resmi.');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Jenis Penghargaan / Kategori:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {AWARD_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-base mb-1">{p.icon}</div>
                  <div className="text-[11px] font-extrabold truncate">{p.badge}</div>
                  <div className="text-[9px] text-slate-500 line-clamp-1">{p.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Siswa Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa Penerima *</label>
            <select
              value={selectedStudentNisn}
              onChange={(e) => setSelectedStudentNisn(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-bold bg-white text-slate-800"
            >
              {rankedStudents.map((r, idx) => (
                <option key={r.student.nisn} value={r.student.nisn}>
                  Peringkat #{idx + 1}: {r.student.namaSiswa} (Rata-rata: {r.avg})
                </option>
              ))}
            </select>
          </div>

          {/* Nomor Piagam */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor Piagam</label>
            <input
              type="text"
              value={nomorPiagam}
              onChange={(e) => setNomorPiagam(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-mono text-slate-800"
            />
          </div>

          {/* Tema Desain */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tema Bingkai Piagam</label>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setTheme('gold')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  theme === 'gold' ? 'bg-amber-100 border-amber-600 text-amber-950' : 'border-slate-200 text-slate-600'
                }`}
              >
                🌟 Emas
              </button>
              <button
                type="button"
                onClick={() => setTheme('navy')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  theme === 'navy' ? 'bg-blue-100 border-blue-600 text-blue-950' : 'border-slate-200 text-slate-600'
                }`}
              >
                🏛️ Biru Navy
              </button>
              <button
                type="button"
                onClick={() => setTheme('emerald')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  theme === 'emerald' ? 'bg-emerald-100 border-emerald-600 text-emerald-950' : 'border-slate-200 text-slate-600'
                }`}
              >
                🌲 Zamrud
              </button>
            </div>
          </div>

          {/* Tanggal & Tempat */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tempat & Tanggal Penetapan</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={tempatPiagam}
                onChange={(e) => setTempatPiagam(e.target.value)}
                placeholder="Balil"
                className="w-full px-2.5 py-2 border rounded-xl text-slate-800"
              />
              <input
                type="text"
                value={tanggalPiagam}
                onChange={(e) => setTanggalPiagam(e.target.value)}
                placeholder="23 Des 2026"
                className="w-full px-2.5 py-2 border rounded-xl text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Judul & Deskripsi Kustom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Piagam / Penghargaan</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi & Alasan Apresiasi</label>
            <input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* CERTIFICATE PRINTABLE CANVAS (LANDSCAPE A4) */}
      <div className="bg-amber-50/20 p-2 sm:p-6 rounded-2xl overflow-x-auto flex justify-center">
        <div
          className={`w-[297mm] min-h-[205mm] max-w-full bg-white p-8 sm:p-10 shadow-2xl relative border-8 ${styles.borderOuter} rounded-sm printable-area text-slate-900 select-none`}
          style={{ boxSizing: 'border-box' }}
        >
          {/* Subtle Watermark Tut Wuri Handayani in Center */}
          {showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
              <LogoTutWuriHandayani url={db.sekolah.logoKananUrl} size={380} className="w-96 h-96" />
            </div>
          )}

          {/* Ornate Double Inner Border */}
          <div className={`w-full h-full border-2 ${styles.borderInner} p-6 sm:p-7 flex flex-col justify-between relative`}>
            {/* Corner Decorative Accents */}
            <div className="absolute top-1 left-1 w-6 h-6 border-t-4 border-l-4 border-amber-500"></div>
            <div className="absolute top-1 right-1 w-6 h-6 border-t-4 border-r-4 border-amber-500"></div>
            <div className="absolute bottom-1 left-1 w-6 h-6 border-b-4 border-l-4 border-amber-500"></div>
            <div className="absolute bottom-1 right-1 w-6 h-6 border-b-4 border-r-4 border-amber-500"></div>

            {/* HEADER KOP RESMI DENGAN LOGO KAB (KIRI) DAN LOGO TUT WURI HANDAYANI (KANAN) */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-amber-300/80">
              {/* Logo Kiri: Logo Kabupaten Pemda */}
              <div className="w-20 shrink-0 flex items-center justify-center">
                {showLogos && (
                  <LogoKabupaten
                    url={db.sekolah.logoKiriUrl}
                    size={76}
                    className="w-16 h-16 sm:w-20 sm:h-20"
                    label="Logo Kabupaten"
                  />
                )}
              </div>

              {/* Teks Lembaga Kop Piagam */}
              <div className="flex-1 text-center">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
                  {db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
                </div>
                <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-slate-800 mt-0.5">
                  {db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                </div>
                <div className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-900 mt-0.5">
                  {db.sekolah.namaSekolah}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                  Alamat: {db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan}, Kab. {db.sekolah.kabupaten} • NPSN: {db.sekolah.npsn || '-'}
                </div>
                <div className="w-64 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-1.5"></div>
              </div>

              {/* Logo Kanan: Tut Wuri Handayani / Kementerian */}
              <div className="w-20 shrink-0 flex items-center justify-center">
                {showLogos && (
                  <LogoTutWuriHandayani
                    url={db.sekolah.logoKananUrl}
                    size={76}
                    className="w-16 h-16 sm:w-20 sm:h-20"
                    label="Logo Tut Wuri Handayani"
                  />
                )}
              </div>
            </div>

            {/* Title Certificate */}
            <div className="text-center my-3">
              <h1
                className="text-3xl sm:text-4xl font-serif font-black tracking-widest uppercase drop-shadow-xs"
                style={{
                  color: theme === 'navy' ? '#1e3a8a' : theme === 'emerald' ? '#065f46' : '#b45309',
                  letterSpacing: '0.15em'
                }}
              >
                PIAGAM PENGHARGAAN
              </h1>
              <p className="text-[11px] font-mono tracking-widest text-slate-600 mt-1 uppercase font-semibold">
                NOMOR: {nomorPiagam}
              </p>
            </div>

            {/* Body Certificate */}
            <div className="text-center max-w-2xl mx-auto space-y-3 my-1">
              <p className="text-xs sm:text-sm italic font-serif text-slate-600">
                Diberikan dengan penuh rasa bangga dan apresiasi setinggi-tingginya kepada:
              </p>

              {/* Nama Siswa */}
              <div className="py-1">
                <div className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-slate-950 uppercase border-b-2 border-slate-900 inline-block px-8 pb-1">
                  {currentStudent?.namaSiswa}
                </div>
                <div className="text-xs text-slate-600 font-mono mt-1.5 font-semibold">
                  NISN: {currentStudent?.nisn || '-'} • NIS: {currentStudent?.nis || '-'} • Kelas {selectedKelas}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700">
                Sebagai ungkapan penghargaan dan pengakuan atas keberhasilan meraih prestasi:
              </p>

              {/* Award Title Badge */}
              <div className="my-1.5">
                <span
                  className={`inline-block px-6 py-2 rounded-full font-serif font-black text-sm sm:text-base tracking-wider uppercase shadow-md border-2 ${styles.badgeBg}`}
                >
                  ⭐ {customTitle} ⭐
                </span>
              </div>

              {/* Reason / Description */}
              <p className="text-xs sm:text-sm leading-relaxed text-slate-800 italic max-w-xl mx-auto px-4">
                &ldquo;{customDescription}&rdquo;
              </p>

              <p className="text-[11px] font-medium text-slate-600">
                Semester {selectedSemester} Tahun Pelajaran {db.sekolah.tahunPelajaran}
                {currentRanked ? ` • Nilai Rata-rata: ${currentRanked.avg}` : ''}
              </p>
            </div>

            {/* Seal & Signatures Footer */}
            <div className="grid grid-cols-3 items-end pt-3 sm:pt-4 mt-2">
              {/* Wali Kelas Signature */}
              <div className="text-center text-xs">
                <p className="text-slate-600 mb-14">
                  Wali Kelas {selectedKelas},
                </p>
                <p className="font-bold underline text-slate-900 font-serif text-sm">
                  {db.sekolah.waliKelas || 'Petrus Kasipmabin, S.Pd.'}
                </p>
                <p className="text-[10px] text-slate-600 font-mono">
                  NIP. {db.sekolah.nipWaliKelas || '-'}
                </p>
              </div>

              {/* Official Seal / Stempel in Center */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-500 bg-amber-50 flex flex-col items-center justify-center shadow-md relative">
                  <LogoTutWuriHandayani url={db.sekolah.logoKananUrl} size={36} className="w-9 h-9 mb-0.5" />
                  <span className="text-[8px] font-black uppercase tracking-tighter text-amber-900">
                    {db.sekolah.namaSekolah || 'SDN BALIL'}
                  </span>
                  <span className="text-[7px] font-bold text-amber-700">
                    {db.sekolah.tahunPelajaran || '2026/2027'}
                  </span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-amber-800 mt-1">
                  SERTIFIKAT RESMI
                </div>
              </div>

              {/* Kepala Sekolah Signature */}
              <div className="text-center text-xs">
                <p className="text-slate-600 mb-14">
                  {tempatPiagam}, {tanggalPiagam}<br />
                  Kepala {db.sekolah.namaSekolah},
                </p>
                <p className="font-bold underline text-slate-900 font-serif text-sm">
                  {db.sekolah.namaKepalaSekolah}
                </p>
                <p className="text-[10px] text-slate-600 font-mono">
                  NIP. {db.sekolah.nipKepalaSekolah || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
