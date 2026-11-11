import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  X,
  Sparkles,
  Filter,
  Search,
  BookOpen,
  Layers,
  FileSpreadsheet,
  Copy,
  Table as TableIcon,
  Check,
  ChevronRight,
  Download,
  Upload,
  ArrowUpDown,
  FileDown,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LearningObjective, ClassLevel, FaseType } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

// 6 Agama Resmi di Indonesia untuk Kurikulum Merdeka
export const ENUM_6_AGAMA = [
  { key: 'Semua', label: 'Semua Agama (Umum)', icon: '🌐', color: 'slate' },
  { key: 'Islam', label: 'Islam (PAI)', icon: '☪️', color: 'emerald' },
  { key: 'Kristen', label: 'Kristen Protestan (PAK)', icon: '✝️', color: 'blue' },
  { key: 'Katolik', label: 'Katolik (PAKAT)', icon: '⛪', color: 'indigo' },
  { key: 'Hindu', label: 'Hindu (PAH)', icon: '🕉️', color: 'amber' },
  { key: 'Buddha', label: 'Buddha (PAB)', icon: '☸️', color: 'yellow' },
  { key: 'Khonghucu', label: 'Khonghucu (PAKh)', icon: '☯️', color: 'rose' }
] as const;

export const STANDARD_AGAMA_TPS: Record<string, string[]> = {
  Islam: [
    'Siswa mampu membaca dan menghafal surat-surat pendek Al-Qur\'an serta memahami pesan pokok Asmaul Husna dengan tartil.',
    'Siswa mampu mempraktikkan tata cara wudhu dan salat wajib serta menerapkan akhlak mulia kepada orang tua dan sesama manusia.'
  ],
  Kristen: [
    'Siswa mampu memahami kasih Allah yang menciptakan, memelihara, dan menyelamatkan manusia serta segenap alam semesta.',
    'Siswa mampu menerapkan sikap mengasihi sesama, hidup rukun, bersyukur, dan meneladani teladan Tuhan Yesus dalam keseharian.'
  ],
  Katolik: [
    'Siswa mampu memahami peranan Kitab Suci dan Tradisi Gereja dalam meneladani Yesus Kristus sebagai Juru Selamat.',
    'Siswa mampu mewujudkan nilai-nilai Kerajaan Allah melalui perbuatan kasih, doa, dan keterlibatan aktif dalam hidup menggereja.'
  ],
  Hindu: [
    'Siswa mampu memahami konsep Tri Kaya Parisudha dan Catur Asrama dalam menciptakan keharmonisan hidup (Tri Hita Karana).',
    'Siswa mampu mempraktikkan doa Dainika Upasana dan menunjukkan rasa bakti kepada Sang Hyang Widhi Wasa serta orang tua.'
  ],
  Buddha: [
    'Siswa mampu meneladani riwayat hidup Siddharta Gautama serta memahami Empat Kesunyataan Mulia dan Delapan Jalan Utama.',
    'Siswa mampu mempraktikkan sila dan meditasi pernapasan dasar (anapanasati) guna memupuk cinta kasih serta ketenangan batin.'
  ],
  Khonghucu: [
    'Siswa mampu memahami ajaran Xiao (Bakti) kepada orang tua dan mengamalkan Lima Kebajikan Utama (Wu Chang) dalam kehidupan.',
    'Siswa mampu menunjukkan sikap Zhong (Setia) dan Shu (Tepaselira/Tenggang Rasa) serta menghormati sesama makhluk ciptaan Tian.'
  ]
};

// Standard Curriculum Merdeka sample TPs tailored per subject for elementary & secondary school
const STANDARD_SAMPLE_TPS: Record<string, string[]> = {
  'Pendidikan Agama dan Budi Pekerti': [
    'Siswa mampu memahami ajaran kasih Tuhan, mempraktikkan ibadah sesuai agamanya, dan menunjukkan toleransi antarumat beriman.',
    'Siswa mampu menunjukkan sikap berbudi pekerti luhur, saling menghormati keragaman keyakinan, dan menjaga kerukunan di lingkungan sekolah.'
  ],
  'Pendidikan Pancasila': [
    'Siswa mampu memahami dan menerapkan nilai-nilai Pancasila dalam kegiatan gotong royong di lingkungan sekolah dan keluarga.',
    'Siswa mampu mengenal hak dan kewajiban sebagai peserta didik serta mematuhi aturan musyawarah mufakat di kelas.'
  ],
  'Bahasa Indonesia': [
    'Siswa mampu memahami pesan dan gagasan pokok dari teks narasi maupun eksposisi secara kritis dan mandiri.',
    'Siswa mampu menyampaikan ide, perasaan, dan tanggapan secara lisan maupun tertulis dengan santun dan sistematis.'
  ],
  'Matematika': [
    'Siswa mampu membaca, menulis, menentukan nilai tempat, dan membandingkan bilangan cacah sampai 10.000.',
    'Siswa mampu menyelesaikan operasi hitung pecahan sederhana serta menerapkannya dalam pemecahan masalah sehari-hari.'
  ],
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)': [
    'Siswa mampu mengidentifikasi wujud zat, perubahan wujud benda, dan manfaat pemanfaatannya dalam kehidupan sehari-hari.',
    'Siswa mampu menganalisis bentang alam, keanekaragaman hayati, dan kearifan lokal pelestarian lingkungan daerah.'
  ],
  'Pendidikan Jasmani, Olahraga, dan Kesehatan': [
    'Siswa mampu mempraktikkan variasi pola gerak dasar lokomotor, non-lokomotor, dan manipulatif dengan benar.',
    'Siswa mampu menerapkan prinsip pola hidup bersih, sehat, dan menjaga kebugaran jasmani secara konsisten.'
  ],
  'Seni dan Budaya (Seni Rupa & Musik)': [
    'Siswa mampu mengeksplorasi garis, bentuk, tekstur, dan motif ragam hias seni rupa khas kearifan lokal.',
    'Siswa mampu mengapresiasi dan memperagakan irama lagu, gerak berirama, serta ekspresi karya seni sederhana.'
  ],
  'Bahasa Inggris': [
    'Siswa mampu merespons instruksi lisan sederhana dan menggunakan kosakata dasar tentang aktivitas di sekolah dan rumah.',
    'Siswa mampu memperkenalkan diri dan mengungkapkan kesukaan dengan percaya diri menggunakan bahasa Inggris dasar.'
  ],
  'Muatan Lokal (Bahasa Daerah & Noken Papua)': [
    'Siswa mampu mengenal kosakata dasar bahasa suku setempat serta memahami cerita rakyat dan budaya daerah.',
    'Siswa mampu mengapresiasi kearifan budaya pembuatan noken, seni tradisional, dan nilai luhur leluhur setempat.'
  ]
};

export const LearningObjectiveSection: React.FC = () => {
  const appContext = useApp();
  const {
    db,
    saveTP,
    deleteTP,
    selectedKelas,
    selectedFase,
    selectedTpMapel,
    setSelectedTpMapel,
    syncAllScoresWithTPDescriptions,
    showSaveNotification
  } = appContext;

  // View Mode: 'focused' (tab per selected mapel) or 'all_tables' (each mapel has its own standalone table card)
  const [viewMode, setViewMode] = useState<'focused' | 'all_tables'>('focused');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgamaFilter, setSelectedAgamaFilter] = useState<string>('SEMUA');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingTP, setEditingTP] = useState<LearningObjective | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    showSaveNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const defaultNewTP: LearningObjective = {
    id: `TP${String(db.tujuanPembelajaran.length + 1).padStart(3, '0')}`,
    kodeTp: `TP${String(db.tujuanPembelajaran.length + 1).padStart(3, '0')}`,
    mataPelajaran:
      selectedTpMapel !== 'SEMUA'
        ? selectedTpMapel
        : db.mataPelajaran[0]?.mataPelajaran || 'Bahasa Indonesia',
    fase: selectedFase,
    kelas: selectedKelas,
    agama: 'Semua',
    tujuanPembelajaran: ''
  };

  const [formData, setFormData] = useState<LearningObjective>(defaultNewTP);

  // Generate a distinct and unique next TP code
  const getNextKodeTP = (mapelName?: string) => {
    const existingCodes = new Set(db.tujuanPembelajaran.map((t) => t.kodeTp.toUpperCase()));
    let nextNum = db.tujuanPembelajaran.length + 1;
    let candidate = `TP${String(nextNum).padStart(3, '0')}`;
    while (existingCodes.has(candidate)) {
      nextNum++;
      candidate = `TP${String(nextNum).padStart(3, '0')}`;
    }
    return candidate;
  };

  const handleOpenAdd = (targetMapel?: string, targetAgama?: string) => {
    setEditingTP(null);
    const chosenMapel =
      targetMapel ||
      (selectedTpMapel !== 'SEMUA'
        ? selectedTpMapel
        : db.mataPelajaran[0]?.mataPelajaran || 'Bahasa Indonesia');

    const nextCode = getNextKodeTP(chosenMapel);

    setFormData({
      id: nextCode,
      kodeTp: nextCode,
      mataPelajaran: chosenMapel,
      fase: selectedFase,
      kelas: selectedKelas,
      agama: targetAgama || (selectedAgamaFilter !== 'SEMUA' ? selectedAgamaFilter : 'Semua'),
      tujuanPembelajaran: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (tp: LearningObjective) => {
    setEditingTP(tp);
    setFormData({ ...tp, agama: tp.agama || 'Semua' });
    setModalOpen(true);
  };

  const handleDuplicateTP = (tp: LearningObjective) => {
    const nextCode = getNextKodeTP(tp.mataPelajaran);
    const duplicated: LearningObjective = {
      ...tp,
      id: nextCode,
      kodeTp: nextCode,
      tujuanPembelajaran: `${tp.tujuanPembelajaran} (Salinan)`
    };
    saveTP(duplicated);
    showNotice(`Berhasil menggandakan TP dengan kode baru: ${nextCode}`);
  };

  const { status: modalSaveStatus, triggerSave: triggerModalSave } = useSaveFeedback();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tujuanPembelajaran.trim()) {
      alert('Mohon isi rumusan narasi Tujuan Pembelajaran (TP).');
      return;
    }
    triggerModalSave(async () => {
      saveTP(formData);
      showNotice(
        editingTP
          ? `Tujuan Pembelajaran ${formData.kodeTp} berhasil diperbarui.`
          : `Tujuan Pembelajaran baru ${formData.kodeTp} berhasil disimpan.`
      );
      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    });
  };

  const handleDelete = (id: string, kode: string, mapel: string) => {
    if (confirm(`Hapus Tujuan Pembelajaran (${kode} - ${mapel})?`)) {
      deleteTP(id);
      showNotice(`Tujuan Pembelajaran ${kode} telah dihapus.`);
    }
  };

  // Seed standard sample TPs for a specific subject if empty
  const handleSeedSamplesForMapel = (mapelName: string) => {
    const samples =
      STANDARD_SAMPLE_TPS[mapelName] || [
        `Siswa mampu memahami materi dan konsep dasar pada pembelajaran ${mapelName} dengan baik.`,
        `Siswa mampu mempraktikkan keterampilan dan menerapkan hasil pembelajaran ${mapelName} dalam kehidupan nyata.`
      ];

    let countAdded = 0;
    samples.forEach((text) => {
      const nextCode = getNextKodeTP(mapelName);
      saveTP({
        id: nextCode,
        kodeTp: nextCode,
        mataPelajaran: mapelName,
        fase: selectedFase,
        kelas: selectedKelas,
        tujuanPembelajaran: text
      });
      countAdded++;
    });

    showNotice(`Berhasil menambahkan ${countAdded} contoh TP standar untuk ${mapelName}.`);
  };

  // Seed TP untuk 6 Agama Resmi di Indonesia (Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu)
  const handleSeed6Agama = () => {
    const mapelAgama = 'Pendidikan Agama dan Budi Pekerti';
    let addedCount = 0;
    Object.entries(STANDARD_AGAMA_TPS).forEach(([agamaKey, tps]) => {
      tps.forEach((text) => {
        const nextCode = getNextKodeTP(mapelAgama);
        saveTP({
          id: nextCode,
          kodeTp: nextCode,
          mataPelajaran: mapelAgama,
          fase: selectedFase,
          kelas: selectedKelas,
          agama: agamaKey,
          tujuanPembelajaran: text
        });
        addedCount++;
      });
    });

    setSelectedTpMapel(mapelAgama);
    setSelectedAgamaFilter('SEMUA');
    showNotice(
      `Berhasil memuat ${addedCount} Tujuan Pembelajaran untuk 6 Agama resmi di Indonesia (Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu)!`
    );
  };

  // Seed sample TPs for all empty subjects in current class
  const handleSeedAllSubjects = () => {
    if (
      !confirm(
        `Muat contoh rumusan Tujuan Pembelajaran (TP) Kurikulum Merdeka untuk semua mata pelajaran yang masih kosong di Kelas ${selectedKelas}?`
      )
    ) {
      return;
    }

    let addedTotal = 0;
    db.mataPelajaran.forEach((m) => {
      const existing = db.tujuanPembelajaran.filter(
        (tp) => tp.kelas === selectedKelas && tp.mataPelajaran === m.mataPelajaran
      );
      if (existing.length === 0) {
        const samples =
          STANDARD_SAMPLE_TPS[m.mataPelajaran] || [
            `Siswa mampu memahami konsep inti pembelajaran ${m.mataPelajaran} dengan cermat.`,
            `Siswa mampu mendemonstrasikan keterampilan dan kreativitas pada mata pelajaran ${m.mataPelajaran}.`
          ];
        samples.forEach((text) => {
          const nextCode = getNextKodeTP(m.mataPelajaran);
          saveTP({
            id: nextCode,
            kodeTp: nextCode,
            mataPelajaran: m.mataPelajaran,
            fase: selectedFase,
            kelas: selectedKelas,
            tujuanPembelajaran: text
          });
          addedTotal++;
        });
      }
    });

    if (addedTotal > 0) {
      showNotice(`Berhasil menambahkan ${addedTotal} Tujuan Pembelajaran standar untuk kelas ${selectedKelas}.`);
    } else {
      showNotice('Semua mata pelajaran sudah memiliki Tujuan Pembelajaran (TP).');
    }
  };

  // Export specific subject or filtered list to Excel
  const handleExportExcel = (targetMapel?: string) => {
    const mapelFilter = targetMapel || selectedTpMapel;
    const listToExport = db.tujuanPembelajaran.filter((tp) => {
      const matchesKelas = tp.kelas === selectedKelas;
      const matchesMapel = mapelFilter === 'SEMUA' || tp.mataPelajaran === mapelFilter;
      return matchesKelas && matchesMapel;
    });

    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DATA TUJUAN PEMBELAJARAN (TP) KURIKULUM MERDEKA'],
      [
        `Kelas: ${selectedKelas} • Fase: ${selectedFase} • Mata Pelajaran: ${
          mapelFilter === 'SEMUA' ? 'Semua Mata Pelajaran' : mapelFilter
        }`
      ],
      [],
      ['NO', 'KODE TP', 'MATA PELAJARAN', 'FASE', 'KELAS', 'RUMUSAN TUJUAN PEMBELAJARAN (TP)'],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)'],
      ...listToExport.map((tp, idx) => [
        idx + 1,
        tp.kodeTp,
        tp.mataPelajaran,
        tp.fase,
        tp.kelas,
        tp.tujuanPembelajaran
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 35 },
      { wch: 8 },
      { wch: 10 },
      { wch: 65 }
    ];

    const sheetTitle = mapelFilter === 'SEMUA' ? 'Semua TP' : mapelFilter.slice(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const filenameMapel =
      mapelFilter === 'SEMUA'
        ? 'semua-mapel'
        : mapelFilter
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .slice(0, 25);
    XLSX.writeFile(wb, `tp-${filenameMapel}-kelas-${selectedKelas}.xlsx`);
    showNotice(`File Excel TP (${mapelFilter}) berhasil diunduh.`);
  };

  // Import from Excel file
  const handleImportFile = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_tp', appContext);
      if (result.success) {
        showNotice(result.message);
      } else {
        alert(result.message);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal membaca file Excel TP: ' + (err?.message || 'Format berkas tidak sesuai'));
    }
  };

  // Unduh template resmi TP khusus per mata pelajaran terpilih
  const handleDownloadTemplate = (targetMapelName?: string) => {
    const mapel =
      targetMapelName && targetMapelName !== 'SEMUA'
        ? targetMapelName
        : selectedTpMapel !== 'SEMUA'
        ? selectedTpMapel
        : 'Semua Mata Pelajaran';
    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';

    const wb = XLSX.utils.book_new();
    const columns = [
      'Kode TP',
      'Mata Pelajaran',
      'Fase',
      'Kelas',
      'Rumusan Tujuan Pembelajaran (TP)',
      'Indikator Capaian / Materi Pokok'
    ];

    const currentTps = db.tujuanPembelajaran.filter((t) => {
      const matchK = t.kelas === selectedKelas;
      const matchM = mapel === 'Semua Mata Pelajaran' || t.mataPelajaran === mapel;
      return matchK && matchM;
    });

    const sampleRows: (string | number)[][] = [];
    if (currentTps.length > 0) {
      currentTps.forEach((t) => {
        sampleRows.push([
          t.kodeTp,
          t.mataPelajaran,
          t.fase,
          t.kelas,
          t.tujuanPembelajaran,
          'Materi Pokok'
        ]);
      });
    } else {
      sampleRows.push(
        [
          'TP001',
          mapel === 'Semua Mata Pelajaran' ? 'Bahasa Indonesia' : mapel,
          selectedFase,
          selectedKelas,
          `Peserta didik mampu memahami konsep inti ${mapel}.`,
          'Materi Pokok 1'
        ],
        [
          'TP002',
          mapel === 'Semua Mata Pelajaran' ? 'Matematika' : mapel,
          selectedFase,
          selectedKelas,
          `Peserta didik mampu mempraktikkan keterampilan dasar pada ${mapel}.`,
          'Materi Pokok 2'
        ]
      );
    }

    const aoaData: (string | number)[][] = [
      [pemda],
      [instansi],
      [schoolName],
      [`FORMAT RESMI TUJUAN PEMBELAJARAN (TP): ${mapel.toUpperCase()}`],
      [`Kelas: ${selectedKelas} • Fase: ${selectedFase} • Tahun Pelajaran: ${schoolYear}`],
      [],
      ['NO', ...columns],
      ['(1)', ...columns.map((_, i) => `(${i + 2})`)],
      ...sampleRows.map((r, i) => [i + 1, ...r])
    ];

    for (let i = 0; i < 15; i++) {
      aoaData.push([sampleRows.length + 1 + i, ...columns.map(() => '')]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 32 },
      { wch: 10 },
      { wch: 10 },
      { wch: 55 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Template TP');
    const safeName = mapel.toLowerCase().replace(/[^a-z0-9]/g, '-');
    XLSX.writeFile(wb, `template-tp-${safeName}-kelas-${selectedKelas}.xlsx`);
    showNotice(`Template TP ${mapel} (.xlsx) berhasil diunduh!`);
  };

  // Calculate stats per subject
  const subjectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    db.mataPelajaran.forEach((m) => {
      stats[m.mataPelajaran] = db.tujuanPembelajaran.filter(
        (tp) => tp.kelas === selectedKelas && tp.mataPelajaran === m.mataPelajaran
      ).length;
    });
    return stats;
  }, [db.tujuanPembelajaran, db.mataPelajaran, selectedKelas]);

  // Total TPs in current class
  const totalTpInClass = useMemo(() => {
    return db.tujuanPembelajaran.filter((tp) => tp.kelas === selectedKelas).length;
  }, [db.tujuanPembelajaran, selectedKelas]);

  // Filtered TPs for focused view mode
  const filteredTPs = useMemo(() => {
    return db.tujuanPembelajaran.filter((tp) => {
      const matchesKelas = tp.kelas === selectedKelas;
      const matchesMapel = selectedTpMapel === 'SEMUA' || tp.mataPelajaran === selectedTpMapel;
      const matchesAgama =
        selectedAgamaFilter === 'SEMUA' ||
        !tp.agama ||
        tp.agama === 'Semua' ||
        tp.agama.toLowerCase() === selectedAgamaFilter.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        tp.kodeTp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tp.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tp.tujuanPembelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tp.agama && tp.agama.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesKelas && matchesMapel && matchesAgama && matchesSearch;
    });
  }, [db.tujuanPembelajaran, selectedKelas, selectedTpMapel, selectedAgamaFilter, searchQuery]);

  // Scroll to subject table in "all_tables" mode
  const scrollToSubjectTable = (mapelName: string) => {
    const elId = `table-mapel-${mapelName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
    const el = document.getElementById(elId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl shadow-md">
            <Target size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Kurikulum Merdeka • Capaian & Indikator
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Fase <strong className="text-slate-800">{selectedFase}</strong> • Kelas{' '}
                <strong className="text-slate-800">{selectedKelas}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Tujuan Pembelajaran (TP) Per Mata Pelajaran
            </h2>
            <p className="text-xs text-slate-500">
              Tombol dan tabel mandiri masing-masing Mata Pelajaran untuk perumusan indikator dan deskripsi capaian rapor otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {notification && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 text-white text-xs font-bold border-2 border-emerald-400 shadow-md animate-pulse">
              <CheckCircle2 size={14} className="text-emerald-300" />
              <span>{notification}</span>
            </div>
          )}

          {/* Hubungkan ke Semua Rapor Button */}
          <button
            onClick={() => {
              const count = syncAllScoresWithTPDescriptions();
              showNotice(`Berhasil menghubungkan ${count} data deskripsi TP ke semua Rapor!`);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            title="Hubungkan & perbarui rumusan deskripsi seluruh TP mata pelajaran langsung ke semua Rapor siswa (Semester 1, 2, Gabungan, dan PTS)"
          >
            <CheckCircle2 size={15} />
            <span>⚡ Hubungkan ke Semua Rapor</span>
          </button>

          {/* Pisahkan & Muat TP 6 Agama Resmi */}
          <button
            onClick={handleSeed6Agama}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer ring-2 ring-emerald-300"
            title="Pisahkan dan muat rumusan TP standar untuk 6 Agama resmi di Indonesia (Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu)"
          >
            <Sparkles size={15} className="text-amber-300" />
            <span>✨ Pisahkan &amp; Muat TP 6 Agama</span>
          </button>

          {/* Seed Standard Examples */}
          <button
            onClick={handleSeedAllSubjects}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl transition-all border border-amber-200 cursor-pointer"
            title="Muat contoh Tujuan Pembelajaran Kurikulum Merdeka untuk semua mapel yang masih kosong"
          >
            <Sparkles size={15} className="text-amber-600" />
            <span>Muat Contoh TP Mapel Umum</span>
          </button>

          {/* Add New TP Button */}
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={16} /> Tambah TP Baru
          </button>
        </div>
      </div>

      {/* 2. BARIS TOMBOL MASING-MASING TP MATA PELAJARAN */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-emerald-700" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Tombol Tujuan Pembelajaran Per Mata Pelajaran (Klik untuk Membuka Tabel):
            </h3>
          </div>

          {/* View Mode Toggle: Focused Tab vs All Tables Stacked */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('focused')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'focused'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter size={13} />
              <span>Mode: Tabel Terfokus Per Mapel</span>
            </button>
            <button
              onClick={() => setViewMode('all_tables')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all_tables'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon size={13} />
              <span>Mode: Tampilkan Semua Tabel Mapel Sekaligus</span>
            </button>
          </div>
        </div>

        {/* Buttons List for Each Subject */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {/* Button: SEMUA MATA PELAJARAN */}
          <button
            onClick={() => {
              setSelectedTpMapel('SEMUA');
              if (viewMode === 'all_tables') {
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }
            }}
            className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedTpMapel === 'SEMUA' && viewMode === 'focused'
                ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/30 text-emerald-950 shadow-sm'
                : 'bg-slate-50/80 hover:bg-emerald-50/40 border-slate-200 text-slate-700 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1 w-full mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                SEMUA
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-700 text-white shadow-xs">
                {totalTpInClass} TP
              </span>
            </div>
            <div className="text-xs font-bold truncate text-slate-900 group-hover:text-emerald-700">
              Semua Mata Pelajaran
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Tinjau Keseluruhan</span>
              {selectedTpMapel === 'SEMUA' && viewMode === 'focused' && (
                <Check size={12} className="text-emerald-600 stroke-[3]" />
              )}
            </div>
          </button>

          {/* Button for each Mata Pelajaran */}
          {db.mataPelajaran.map((mapel, index) => {
            const count = subjectStats[mapel.mataPelajaran] || 0;
            const isSelected = selectedTpMapel === mapel.mataPelajaran && viewMode === 'focused';
            const shortCode = mapel.kode || `MP${index + 1}`;

            return (
              <button
                key={mapel.kode || mapel.mataPelajaran}
                onClick={() => {
                  setSelectedTpMapel(mapel.mataPelajaran);
                  if (viewMode === 'all_tables') {
                    scrollToSubjectTable(mapel.mataPelajaran);
                  }
                }}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/40 shadow-md font-semibold'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-400 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full mb-1">
                  <span
                    className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-emerald-800/80 text-emerald-100'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                    }`}
                  >
                    {shortCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono transition-colors ${
                      isSelected
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : count > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {count} TP
                  </span>
                </div>

                <div
                  className={`text-xs font-bold leading-snug line-clamp-2 min-h-[32px] ${
                    isSelected ? 'text-white' : 'text-slate-800 group-hover:text-emerald-700'
                  }`}
                  title={mapel.mataPelajaran}
                >
                  {mapel.mataPelajaran}
                </div>

                <div
                  className={`text-[10px] mt-1.5 pt-1 border-t flex items-center justify-between ${
                    isSelected ? 'border-emerald-500/60 text-emerald-100' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="truncate">{mapel.kelompok}</span>
                  {isSelected ? (
                    <Check size={12} className="stroke-[3]" />
                  ) : (
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TOOLBAR AKSI STANDAR */}
      <StandardActionToolbar
        title="Aksi Tujuan Pembelajaran"
        badge={`Mapel: ${
          selectedTpMapel === 'SEMUA' ? 'Semua Mata Pelajaran' : selectedTpMapel
        } • ${filteredTPs.length} TP`}
        onSave={() => handleOpenAdd()}
        saveLabel="Tambah TP"
        onUpdate={() => handleOpenAdd()}
        updateLabel="Update TP"
        onEdit={() => {
          if (filteredTPs.length > 0) {
            handleOpenEdit(filteredTPs[0]);
          } else {
            handleOpenAdd();
          }
        }}
        editLabel="Edit TP"
        onCancel={() => {
          setSelectedTpMapel('SEMUA');
          setSearchQuery('');
        }}
        cancelLabel="Reset Filter Mapel"
        onDelete={() => {
          if (filteredTPs.length > 0) {
            const last = filteredTPs[filteredTPs.length - 1];
            handleDelete(last.id, last.kodeTp, last.mataPelajaran);
          }
        }}
        deleteLabel="Hapus TP Terakhir"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={() => handleExportExcel()}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File TP"
        onClear={() => {
          setSelectedTpMapel('SEMUA');
          setSearchQuery('');
        }}
        clearLabel="Bersihkan Filter"
        onTemplate={() => handleDownloadTemplate(selectedTpMapel)}
        templateLabel="Template TP"
      />

      {/* 4. MODE 1: TABEL TERFOKUS PER MAPEL TERPILIH */}
      {viewMode === 'focused' && (
        <div className="space-y-4">
          {/* 6 AGAMA FILTER TABS */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>🇮🇩</span> TP 6 Agama Resmi di Indonesia:
              </span>
              <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                Kurikulum Merdeka
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ENUM_6_AGAMA.map((ag) => {
                const isActive = selectedAgamaFilter === ag.key;
                return (
                  <button
                    key={ag.key}
                    type="button"
                    onClick={() => {
                      setSelectedAgamaFilter(ag.key);
                      if (ag.key !== 'Semua' && selectedTpMapel === 'SEMUA') {
                        setSelectedTpMapel('Pendidikan Agama dan Budi Pekerti');
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-400'
                        : 'bg-white text-slate-700 hover:bg-emerald-100/60 border-slate-200'
                    }`}
                  >
                    <span>{ag.icon}</span>
                    <span>{ag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Subject Banner & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <BookOpen size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Mata Pelajaran Aktif:
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {selectedTpMapel === 'SEMUA' ? 'Semua Mata Pelajaran' : selectedTpMapel}
                  </div>
                </div>
              </div>

              {selectedTpMapel !== 'SEMUA' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAdd(selectedTpMapel)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus size={13} /> Tambah TP {selectedTpMapel.slice(0, 16)}
                  </button>

                  {(subjectStats[selectedTpMapel] || 0) === 0 && (
                    <button
                      onClick={() => handleSeedSamplesForMapel(selectedTpMapel)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors border border-amber-300 cursor-pointer"
                    >
                      <Sparkles size={13} className="text-amber-600" /> Muat Contoh TP Mapel Ini
                    </button>
                  )}

                  <button
                    onClick={() => handleExportExcel(selectedTpMapel)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-300 cursor-pointer"
                    title="Unduh Tabel TP Mapel Ini ke Excel"
                  >
                    <Download size={13} /> Unduh Excel Mapel
                  </button>

                  <button
                    onClick={() => handleDownloadTemplate(selectedTpMapel)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors border border-blue-200 cursor-pointer"
                    title="Unduh format template resmi TP khusus mata pelajaran ini"
                  >
                    <FileSpreadsheet size={13} /> Template Mapel
                  </button>
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari rumusan atau kode TP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Focused TP Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3 w-28">Kode TP</th>
                    <th className="py-3 px-3 w-52">Mata Pelajaran</th>
                    <th className="py-3 px-3 w-28 text-center">Agama</th>
                    <th className="py-3 px-3 w-28 text-center">Fase & Kelas</th>
                    <th className="py-3 px-3">Rumusan Narasi Tujuan Pembelajaran (TP) Kurikulum Merdeka</th>
                    <th className="py-3 px-3 w-36 text-center">Pemanfaatan di Rapor</th>
                    <th className="py-3 px-3 text-right w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTPs.map((tp, idx) => (
                    <tr key={tp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-emerald-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                          {tp.kodeTp}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        <div>{tp.mataPelajaran}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {db.mataPelajaran.find((m) => m.mataPelajaran === tp.mataPelajaran)?.kelompok ||
                            'Wajib'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {tp.agama && tp.agama !== 'Semua' ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                              tp.agama === 'Islam'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : tp.agama === 'Kristen'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : tp.agama === 'Katolik'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : tp.agama === 'Hindu'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : tp.agama === 'Buddha'
                                ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <span>
                              {tp.agama === 'Islam'
                                ? '☪️'
                                : tp.agama === 'Kristen'
                                ? '✝️'
                                : tp.agama === 'Katolik'
                                ? '⛪'
                                : tp.agama === 'Hindu'
                                ? '🕉️'
                                : tp.agama === 'Buddha'
                                ? '☸️'
                                : '☯️'}
                            </span>
                            <span>{tp.agama}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                            🌐 Semua
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Fase {tp.fase}
                        </span>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Kelas {tp.kelas}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-800 leading-relaxed font-normal">
                        <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-slate-700 text-xs">
                          {tp.tujuanPembelajaran}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          <CheckCircle2 size={12} className="text-blue-500" />
                          <span>Deskripsi Rapor</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicateTP(tp)}
                            title="Duplikat / Salin TP ini"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(tp)}
                            title="Edit TP ini"
                            className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(tp.id, tp.kodeTp, tp.mataPelajaran)}
                            title="Hapus TP ini"
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredTPs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                            <Target size={24} />
                          </div>
                          <div className="font-bold text-slate-700 text-sm">
                            Belum Ada Tujuan Pembelajaran untuk {selectedTpMapel === 'SEMUA' ? `Kelas ${selectedKelas}` : selectedTpMapel}
                          </div>
                          <p className="text-xs text-slate-500">
                            Silakan klik tombol &ldquo;Tambah TP&rdquo; untuk merumuskan TP baru, atau klik tombol &ldquo;Muat Contoh TP&rdquo; untuk mengisi otomatis rumusan standar Kurikulum Merdeka.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                              onClick={() => handleOpenAdd(selectedTpMapel !== 'SEMUA' ? selectedTpMapel : undefined)}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <Plus size={14} /> Tambah TP Sekarang
                            </button>
                            {selectedTpMapel !== 'SEMUA' && (
                              <button
                                onClick={() => handleSeedSamplesForMapel(selectedTpMapel)}
                                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Sparkles size={14} className="text-amber-600" /> Muat Contoh Standar
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODE 2: TAMPILKAN SEMUA TABEL MASING-MASING MAPEL SEKALIGUS */}
      {viewMode === 'all_tables' && (
        <div className="space-y-6">
          {/* Quick Jump Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Lompat Langsung ke Tabel Mapel:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {db.mataPelajaran.map((mapel) => (
                <button
                  key={mapel.kode || mapel.mataPelajaran}
                  onClick={() => scrollToSubjectTable(mapel.mataPelajaran)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-[11px] font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  {mapel.kode || mapel.mataPelajaran.slice(0, 10)}
                </button>
              ))}
            </div>
          </div>

          {/* Render Individual Table for Every Mata Pelajaran */}
          {db.mataPelajaran.map((mapel, index) => {
            const tableId = `table-mapel-${mapel.mataPelajaran
              .replace(/\s+/g, '-')
              .replace(/[^a-zA-Z0-9-]/g, '')}`;

            const mapelTPs = db.tujuanPembelajaran.filter(
              (tp) => tp.kelas === selectedKelas && tp.mataPelajaran === mapel.mataPelajaran
            );

            return (
              <div
                key={mapel.kode || mapel.mataPelajaran}
                id={tableId}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden scroll-mt-24"
              >
                {/* Subject Table Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black flex items-center justify-center text-xs font-mono">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white">
                          Tabel TP {mapel.mataPelajaran}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                          {mapel.kode || 'MAPEL'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {mapel.kelompok}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Kelas {selectedKelas} • Fase {selectedFase} • Memiliki{' '}
                        <strong className="text-emerald-400">{mapelTPs.length} TP</strong> terdaftar
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportExcel(mapel.mataPelajaran)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                      title="Expor Tabel Mapel Ini ke Excel"
                    >
                      <Download size={13} /> Expor Excel
                    </button>

                    {mapelTPs.length === 0 && (
                      <button
                        onClick={() => handleSeedSamplesForMapel(mapel.mataPelajaran)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Sparkles size={13} /> Isi Contoh TP
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenAdd(mapel.mataPelajaran)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                    >
                      <Plus size={14} /> Tambah TP {mapel.kode || ''}
                    </button>
                  </div>
                </div>

                {/* Table for this Subject */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3 w-28">Kode TP</th>
                        <th className="py-2.5 px-3 w-24 text-center">Fase/Kelas</th>
                        <th className="py-2.5 px-3">Rumusan Narasi Tujuan Pembelajaran (TP)</th>
                        <th className="py-2.5 px-3 w-36 text-center">Rapor Deskripsi</th>
                        <th className="py-2.5 px-3 text-right w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mapelTPs.map((tp, tpIdx) => (
                        <tr key={tp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {tpIdx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              {tp.kodeTp}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Fase {tp.fase}
                            </span>
                            <span className="ml-1 text-[10px] text-slate-500 font-semibold">Kls {tp.kelas}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 leading-relaxed font-normal">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                              {tp.tujuanPembelajaran}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                              Otomatis Rapor
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDuplicateTP(tp)}
                                title="Duplikat TP ini"
                                className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(tp)}
                                title="Edit TP ini"
                                className="p-1 hover:bg-slate-100 text-blue-600 rounded-lg cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(tp.id, tp.kodeTp, tp.mataPelajaran)}
                                title="Hapus TP ini"
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {mapelTPs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 bg-slate-50/50">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span>Belum ada Tujuan Pembelajaran untuk {mapel.mataPelajaran} di Kelas {selectedKelas}.</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenAdd(mapel.mataPelajaran)}
                                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Plus size={12} /> Tambah TP Baru
                                </button>
                                <button
                                  onClick={() => handleSeedSamplesForMapel(mapel.mataPelajaran)}
                                  className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Sparkles size={12} className="text-amber-600" /> Muat Contoh TP
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL FORM: TAMBAH / EDIT TUJUAN PEMBELAJARAN */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingTP ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran Baru'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Kurikulum Merdeka • Kelas {formData.kelas} (Fase {formData.fase})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode TP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: TP001"
                    value={formData.kodeTp}
                    onChange={(e) => setFormData({ ...formData, kodeTp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 focus:outline-hidden focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Kode unik penanda TP</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => {
                      const newKls = e.target.value as ClassLevel;
                      // Auto-sync fase
                      let newFase: FaseType = 'B';
                      if (newKls === 'I' || newKls === 'II') newFase = 'A';
                      else if (newKls === 'III' || newKls === 'IV') newFase = 'B';
                      else if (newKls === 'V' || newKls === 'VI') newFase = 'C';
                      else if (newKls === 'VII' || newKls === 'VIII' || newKls === 'IX') newFase = 'D';
                      else if (newKls === 'X') newFase = 'E';
                      else newFase = 'F';

                      setFormData({
                        ...formData,
                        kelas: newKls,
                        fase: newFase
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  >
                    <optgroup label="── SD / MI (Kelas 1-6) ──">
                      {['I', 'II', 'III', 'IV', 'V', 'VI'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} (SD)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── SMP / MTs (Kelas 7-9) ──">
                      {['VII', 'VIII', 'IX'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} (SMP)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── SMA / MA & SMK (Kelas 10-13) ──">
                      {['X', 'XI', 'XII', 'XIII'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Fase otomatis: {formData.fase}</span>
                </div>
              </div>

              {/* Subject selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Subject selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.mataPelajaran}
                    onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                  >
                    {db.mataPelajaran.map((m) => (
                      <option key={m.kode || m.mataPelajaran} value={m.mataPelajaran}>
                        {m.mataPelajaran} ({m.kelompok})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kesesuaian Agama */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kesesuaian Agama <span className="text-emerald-700 font-normal">(6 Agama Resmi)</span>
                  </label>
                  <select
                    value={formData.agama || 'Semua'}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600 bg-slate-50"
                  >
                    <option value="Semua">🌐 Semua Agama (Umum)</option>
                    <option value="Islam">☪️ Islam (PAI)</option>
                    <option value="Kristen">✝️ Kristen Protestan (PAK)</option>
                    <option value="Katolik">⛪ Katolik (PAKAT)</option>
                    <option value="Hindu">🕉️ Hindu (PAH)</option>
                    <option value="Buddha">☸️ Buddha (PAB)</option>
                    <option value="Khonghucu">☯️ Khonghucu (PAKh)</option>
                  </select>
                </div>
              </div>

              {/* Fase selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fase Kurikulum Merdeka</label>
                <select
                  value={formData.fase}
                  onChange={(e) => setFormData({ ...formData, fase: e.target.value as FaseType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="A">Fase A (Kelas I - II SD)</option>
                  <option value="B">Fase B (Kelas III - IV SD)</option>
                  <option value="C">Fase C (Kelas V - VI SD)</option>
                  <option value="D">Fase D (Kelas VII - IX SMP)</option>
                  <option value="E">Fase E (Kelas X SMA/SMK)</option>
                  <option value="F">Fase F (Kelas XI - XII/XIII SMA/SMK)</option>
                </select>
              </div>

              {/* Objective narrative */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Rumusan Narasi Tujuan Pembelajaran (TP) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Bahasa operasional Kurikulum Merdeka
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formData.tujuanPembelajaran}
                  onChange={(e) => setFormData({ ...formData, tujuanPembelajaran: e.target.value })}
                  placeholder="Contoh: Siswa mampu membaca, menulis, dan membandingkan bilangan cacah sampai 10.000 dengan cermat."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl leading-relaxed focus:outline-hidden focus:border-emerald-600 font-medium"
                />
                <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 leading-normal">
                  <Info size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    <strong>Tips Penulisan:</strong> Gunakan kata kerja operasional seperti <em>mampu memahami</em>, <em>mampu mengidentifikasi</em>, <em>mampu menyajikan</em>, atau <em>mampu menyelesaikan</em>. Rumusan ini langsung dijadikan dasar deskripsi rapor semester.
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  &ldquo;Teleb Kan Data sekmarima sirya Dibmar&rdquo;
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <SaveStatusIndicator status={modalSaveStatus} />
                  <button
                    type="submit"
                    disabled={modalSaveStatus === 'saving'}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={15} /> Simpan TP
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
