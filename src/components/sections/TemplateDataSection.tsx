import React, { useState } from 'react';
import {
  FolderDown,
  Download,
  Copy,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  GraduationCap,
  DoorOpen,
  BookMarked,
  Target,
  Award,
  CalendarCheck,
  MessageSquare,
  ScrollText,
  Compass,
  School,
  Eye,
  Info,
  Laptop,
  Check,
  Table,
  Sparkles,
  FileText,
  Milestone,
  Layers,
  TableProperties,
  RefreshCw,
  BookOpen,
  SlidersHorizontal,
  UserCheck,
  Upload,
  FileUp,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ClassLevel } from '../../types';
import { useApp, MenuKey } from '../../context/AppContext';
import { generateReportDescriptionFromTP } from '../../utils/tpDescriptionHelper';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { parseAndImportTemplate, ImportResult } from '../../utils/templateImporter';

interface TemplateItem {
  id: string;
  menuName: string;
  category: 'Pokok' | 'Akademik' | 'P5' | 'Sekolah' | 'Buku Rapor';
  icon: React.ReactNode;
  fileNameExcel: string;
  fileNameCsv: string;
  description: string;
  columns: string[];
  sampleRows: (string | number)[][];
}

export const TemplateDataSection: React.FC = () => {
  const appContext = useApp();
  const { db, showSaveNotification, setActiveMenu } = appContext;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [importResultModal, setImportResultModal] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const getDestinationMenuKey = (templateId: string): MenuKey => {
    switch (templateId) {
      case 'template_siswa':
      case 'template_identitas_siswa':
      case 'template_rapor_peserta_didik':
        return 'data_siswa';
      case 'template_guru':
        return 'data_guru';
      case 'template_mapel':
        return 'mata_pelajaran';
      case 'template_kkm':
        return 'kkm_pelajaran';
      case 'template_kelas':
        return 'data_kelas';
      case 'template_tp':
        return 'tujuan_pembelajaran';
      case 'template_nilai':
      case 'template_nilai_akademik':
      case 'template_nilai_pts':
        return 'input_nilai';
      case 'template_deskripsi_rapor':
        return 'deskripsi_rapor';
      case 'template_rekap_nilai':
        return 'rekap_nilai';
      case 'template_kehadiran':
        return 'kehadiran';
      case 'template_ekskul':
        return 'ekstrakurikuler';
      case 'template_catatan_wali':
        return 'catatan_wali';
      case 'template_piagam':
        return 'piagam';
      case 'template_p5':
        return 'p5_projek';
      case 'template_p5_tahapan':
        return 'p5_tahapan';
      case 'template_p5_dimensi':
        return 'p5_dimensi';
      case 'template_p5_nilai':
        return 'p5_nilai';
      case 'template_sekolah':
        return 'identitas_sekolah';
      case 'template_rapor_akhir':
        return 'rapor_akademik';
      default:
        return 'dashboard';
    }
  };

  const handleImportSpecificTemplate = async (templateId: string, file: File) => {
    setIsImporting(true);
    try {
      const result = await parseAndImportTemplate(file, templateId, appContext);
      setImportResultModal(result);
      if (result.success) {
        showSaveNotification(result.message);
      }
    } catch (err: any) {
      setImportResultModal({
        success: false,
        templateId,
        templateName: 'Gagal Memproses File',
        importedCount: 0,
        message: err?.message || 'Gagal memproses file template.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportUniversal = async (file: File) => {
    setIsImporting(true);
    try {
      const result = await parseAndImportTemplate(file, undefined, appContext);
      setImportResultModal(result);
      if (result.success) {
        showSaveNotification(result.message);
      }
    } catch (err: any) {
      setImportResultModal({
        success: false,
        templateId: 'auto',
        templateName: 'Gagal Memproses File',
        importedCount: 0,
        message: err?.message || 'Gagal memproses file template.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Mode Sinkronisasi Data Riil Database vs Format Kosong Standar
  // Ketika aktif, setiap data siswa/guru/nilai/TP riil di sekolah diikutsertakan otomatis ke template
  const [useActiveData, setUseActiveData] = useState<boolean>(true);

  // State untuk Generator Template Khusus Masing-masing Mata Pelajaran
  const [generatorMapel, setGeneratorMapel] = useState<string>(
    db.mataPelajaran[2]?.mataPelajaran || db.mataPelajaran[0]?.mataPelajaran || 'Bahasa Indonesia'
  );
  const [generatorType, setGeneratorType] = useState<'tp' | 'nilai' | 'deskripsi'>('tp');
  const [generatorKelas, setGeneratorKelas] = useState<ClassLevel>((db.sekolah.kelas as ClassLevel) || 'IV');

  const TEMPLATES: TemplateItem[] = [
    {
      id: 'template_siswa',
      menuName: 'Data Siswa',
      category: 'Pokok',
      icon: <GraduationCap size={20} className="text-blue-600" />,
      fileNameExcel: 'template-data-siswa-kurikulum-merdeka.xlsx',
      fileNameCsv: 'template-data-siswa-kurikulum-merdeka.csv',
      description: 'Format data pokok peserta didik lengkap (NISN, NIS, nama lengkap, jenis kelamin, agama, TTL, NIK, orang tua, pekerjaan orang tua, wali peserta didik, dan alamat).',
      columns: [
        'NISN',
        'NIS',
        'Nama Siswa',
        'Jenis Kelamin (L/P)',
        'Agama',
        'Tempat Lahir',
        'Tanggal Lahir (YYYY-MM-DD)',
        'NIK',
        'Kelas',
        'Fase',
        'Nama Ayah',
        'Nama Ibu',
        'Pekerjaan Ayah',
        'Pekerjaan Ibu',
        'Nama Wali',
        'Pekerjaan Wali',
        'Alamat Wali',
        'Alamat',
        'Status Siswa'
      ],
      sampleRows: [
        ['0098765432', '26001', 'Markus Nabyal', 'L', 'Kristen', 'Balil', '2016-04-12', '9124011204160001', 'IV', 'B', 'Yohanes Nabyal', 'Maria Kasipmabin', 'Petani', 'Ibu Rumah Tangga', '-', '-', '-', 'Kampung Balil, Oksibil', 'Aktif'],
        ['0098765433', '26002', 'Yohana Kasipmabin', 'P', 'Katolik', 'Oksibil', '2016-08-20', '9124012008160002', 'IV', 'B', 'Anton Kasipmabin', 'Theresia Uropmabin', 'PNS', 'Ibu Rumah Tangga', 'Petrus Kasipmabin', 'Guru', 'Oksibil', 'Jalan Poros Balil', 'Aktif'],
        ['0098765438', '26007', 'Ahmad Fadhil Prasetyo', 'L', 'Islam', 'Jayapura', '2016-05-15', '9124011505160007', 'IV', 'B', 'Mansyur Hidayat', 'Siti Aminah', 'Wiraswasta', 'Pedagang', '-', '-', '-', 'Jalan Trans Papua KM 2', 'Aktif']
      ]
    },
    {
      id: 'template_guru',
      menuName: 'Data Guru & Tenaga Pendidik',
      category: 'Pokok',
      icon: <Users size={20} className="text-purple-600" />,
      fileNameExcel: 'template-data-guru-sdn-balil.xlsx',
      fileNameCsv: 'template-data-guru-sdn-balil.csv',
      description: 'Format data pendidik & wali kelas. Menggunakan NIP saja (tanpa NUPTK, opsional bagi guru honorer di pedalaman Papua).',
      columns: [
        'Nama Guru (Lengkap & Gelar)',
        'NIP',
        'Jenis Kelamin (L/P)',
        'Pendidikan',
        'Jabatan',
        'Mata Pelajaran',
        'Kelas',
        'Status (PNS/PPPK/Honorer)',
        'No HP'
      ],
      sampleRows: [
        ['Petrus Kasipmabin, S.Pd.', '198504122010011015', 'L', 'S1 Pendidikan Guru SD', 'Wali Kelas IV', 'Guru Kelas', 'IV', 'PNS', '081248001122'],
        ['Maria Magdalena Uropmabin, S.Pd.', '198906152015022004', 'P', 'S1 PGSD', 'Wali Kelas III', 'Guru Kelas', 'III', 'PPPK', '081248003344'],
        ['Yohanes Nabyal, S.Pd.K.', '-', 'L', 'S1 Pendidikan Agama Kristen', 'Guru Mata Pelajaran', 'Pendidikan Agama Kristen', 'IV', 'Honorer', '081354005566']
      ]
    },
    {
      id: 'template_mapel',
      menuName: 'Data Mata Pelajaran',
      category: 'Pokok',
      icon: <BookMarked size={20} className="text-teal-600" />,
      fileNameExcel: 'template-mata-pelajaran-kurikulum-merdeka.xlsx',
      fileNameCsv: 'template-mata-pelajaran-kurikulum-merdeka.csv',
      description: 'Format struktur mata pelajaran kelompok Wajib, Pilihan, dan Muatan Lokal Papua dilengkapi KKM (Kriteria Ketuntasan Minimal).',
      columns: [
        'Nomor Urutan',
        'Nama Mata Pelajaran',
        'Kelompok Kurikulum (Wajib / Pilihan / Muatan Lokal)',
        'KKM (Kriteria Ketuntasan Minimal)'
      ],
      sampleRows: [
        ['1', 'Pendidikan Agama dan Budi Pekerti', 'Wajib', '75'],
        ['2', 'Pendidikan Pancasila', 'Wajib', '75'],
        ['3', 'Bahasa Indonesia', 'Wajib', '75'],
        ['4', 'Matematika', 'Wajib', '75'],
        ['5', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Wajib', '75'],
        ['6', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Wajib', '75'],
        ['7', 'Seni dan Budaya (Seni Rupa & Musik)', 'Wajib', '75'],
        ['8', 'Bahasa Inggris', 'Pilihan', '75'],
        ['9', 'Muatan Lokal (Bahasa Daerah & Noken Papua)', 'Muatan Lokal', '75']
      ]
    },
    {
      id: 'template_kkm',
      menuName: 'KKM Semua Mata Pelajaran',
      category: 'Pokok',
      icon: <SlidersHorizontal size={20} className="text-teal-600" />,
      fileNameExcel: 'template-kkm-semua-mata-pelajaran.xlsx',
      fileNameCsv: 'template-kkm-semua-mata-pelajaran.csv',
      description: 'Format penetapan KKM / KKTP semua mata pelajaran berdasarkan Kompleksitas, Daya Dukung, dan Intake Siswa beserta rentang predikat A/B/C/D.',
      columns: [
        'Nomor',
        'Kode Mapel',
        'Nama Mata Pelajaran',
        'Kelompok Kurikulum',
        'Kompleksitas (0-100)',
        'Daya Dukung (0-100)',
        'Intake Siswa (0-100)',
        'Nilai KKM (0-100)'
      ],
      sampleRows: [
        ['1', 'PAI', 'Pendidikan Agama dan Budi Pekerti', 'Wajib', '75', '75', '75', '75'],
        ['2', 'PPKN', 'Pendidikan Pancasila', 'Wajib', '75', '75', '75', '75'],
        ['3', 'BI', 'Bahasa Indonesia', 'Wajib', '75', '75', '75', '75'],
        ['4', 'MTK', 'Matematika', 'Wajib', '70', '75', '70', '72'],
        ['5', 'IPAS', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Wajib', '75', '75', '75', '75'],
        ['6', 'PJOK', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Wajib', '78', '78', '78', '78'],
        ['7', 'SENI', 'Seni dan Budaya (Seni Rupa & Musik)', 'Wajib', '75', '75', '75', '75'],
        ['8', 'B.ING', 'Bahasa Inggris', 'Pilihan', '75', '75', '75', '75'],
        ['9', 'MULOK', 'Muatan Lokal (Bahasa Daerah & Noken Papua)', 'Muatan Lokal', '75', '75', '75', '75']
      ]
    },
    {
      id: 'template_kelas',
      menuName: 'Data Kelas',
      category: 'Pokok',
      icon: <DoorOpen size={20} className="text-cyan-600" />,
      fileNameExcel: 'template-data-kelas-sd.xlsx',
      fileNameCsv: 'template-data-kelas-sd.csv',
      description: 'Format rombongan belajar, fase kurikulum merdeka (A/B/C), nama wali kelas, dan semester berjalan.',
      columns: [
        'Nama Kelas (I - VI)',
        'Fase (A / B / C)',
        'Wali Kelas',
        'Tahun Pelajaran',
        'Semester (Ganjil / Genap)'
      ],
      sampleRows: [
        ['I', 'A', 'Yuliana Kalakmabin, S.Pd.', '2026/2027', 'Ganjil'],
        ['II', 'A', 'Ester Balyo, S.Pd.', '2026/2027', 'Ganjil'],
        ['III', 'B', 'Maria Magdalena Uropmabin, S.Pd.', '2026/2027', 'Ganjil'],
        ['IV', 'B', 'Petrus Kasipmabin, S.Pd.', '2026/2027', 'Ganjil'],
        ['V', 'C', 'Lukas Degei, S.Pd.', '2026/2027', 'Ganjil'],
        ['VI', 'C', 'Dominggus Pigai, S.Pd.', '2026/2027', 'Ganjil']
      ]
    },
    {
      id: 'template_tp',
      menuName: 'Tujuan Pembelajaran (TP) Per Mata Pelajaran',
      category: 'Pokok',
      icon: <Target size={20} className="text-emerald-600" />,
      fileNameExcel: 'template-tujuan-pembelajaran-per-mapel.xlsx',
      fileNameCsv: 'template-tujuan-pembelajaran-per-mapel.csv',
      description: 'Format rumusan Tujuan Pembelajaran (TP) per mata pelajaran, fase, kelas, dan indikator capaian untuk penyusunan deskripsi rapor otomatis.',
      columns: [
        'Kode TP',
        'Mata Pelajaran',
        'Fase (A/B/C/D/E/F)',
        'Kelas (I-VI)',
        'Rumusan Tujuan Pembelajaran (TP)',
        'Indikator Capaian / Materi Pokok'
      ],
      sampleRows: [
        ['TP001', 'Pendidikan Agama dan Budi Pekerti', 'B', 'IV', 'Menjelaskan makna saling mengasihi sesama manusia dan kerukunan hidup dalam keberagaman.', 'Kasih dan toleransi beragama'],
        ['TP002', 'Pendidikan Pancasila', 'B', 'IV', 'Menerapkan nilai-nilai Pancasila dalam kehidupan sehari-hari di rumah dan sekolah.', 'Pengamalan sila-sila Pancasila'],
        ['TP003', 'Bahasa Indonesia', 'B', 'IV', 'Mengidentifikasi pesan pokok dan informasi penting dari teks narasi serta menceritakan kembali secara lisan.', 'Membaca pemahaman & berbicara'],
        ['TP004', 'Matematika', 'B', 'IV', 'Menyelesaikan masalah operasi perkalian dan pembagian bilangan cacah sampai 1.000 dengan benar.', 'Operasi hitung bilangan cacah'],
        ['TP005', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'B', 'IV', 'Mengidentifikasi wujud zat, perubahan wujud benda, dan manfaatnya dalam kehidupan sehari-hari.', 'Materi zat dan perubahannya'],
        ['TP006', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'B', 'IV', 'Mempraktikkan variasi pola gerak dasar lokomotor, non-lokomotor, dan manipulatif dengan benar.', 'Kebugaran & pola gerak dasar'],
        ['TP007', 'Seni dan Budaya (Seni Rupa & Musik)', 'B', 'IV', 'Mengeksplorasi garis, bentuk, tekstur, dan motif ragam hias seni rupa khas kearifan lokal.', 'Seni rupa daerah & musik tradisional'],
        ['TP008', 'Bahasa Inggris', 'B', 'IV', 'Merespons instruksi lisan sederhana dan menggunakan kosakata dasar tentang aktivitas sekolah dan rumah.', 'Kosakata dasar & perkenalan diri'],
        ['TP009', 'Muatan Lokal (Bahasa Daerah & Noken Papua)', 'B', 'IV', 'Mengenal kearifan budaya pembuatan noken, cerita rakyat, dan bahasa suku setempat.', 'Filosofi noken & kearifan lokal']
      ]
    },
    {
      id: 'template_deskripsi_rapor',
      menuName: 'Deskripsi Capaian Rapor (Terhubung TP)',
      category: 'Akademik',
      icon: <Sparkles size={20} className="text-purple-600" />,
      fileNameExcel: 'template-deskripsi-capaian-rapor-terhubung-tp.xlsx',
      fileNameCsv: 'template-deskripsi-capaian-rapor-terhubung-tp.csv',
      description: 'Format resmi narasi deskripsi capaian rapor Kurikulum Merdeka yang otomatis terhubung ke rumusan TP mata pelajaran (Kekuatan Tertinggi, Perlu Peningkatan, & Narasi Rapor Lengkap).',
      columns: [
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
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'IV', 'Ganjil', 'Bahasa Indonesia', '85', 'Sangat Baik', 'TP003, TP004', 'Sangat baik dalam mengidentifikasi pesan pokok dan informasi penting dari teks narasi.', 'Pertahankan prestasi dan lanjutkan pengayaan mandiri.', 'Menunjukkan penguasaan yang sangat baik dalam memahami isi teks narasi serta terampil dalam menceritakan kembali secara lisan.'],
        ['0098765433', 'Yohana Kasipmabin', 'IV', 'Ganjil', 'Matematika', '88', 'Sangat Baik', 'TP004', 'Sangat cepat dan teliti menyelesaikan perkalian bilangan cacah.', 'Lanjutkan latihan pemecahan soal cerita tingkat lanjut.', 'Menunjukkan penguasaan yang sangat baik dalam menyelesaikan operasi perkalian dan pembagian bilangan cacah secara mandiri dan percaya diri.'],
        ['0098765434', 'Kornelis Uropmabin', 'IV', 'Ganjil', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', '78', 'Baik', 'TP005', 'Mampu mengidentifikasi wujud zat padat, cair, dan gas.', 'Perlu pembiasaan mandiri dalam mengamati proses perubahan wujud benda.', 'Menunjukkan penguasaan yang baik dalam mengidentifikasi wujud zat dan mampu menjelaskan pemanfaatannya dalam kehidupan sehari-hari.']
      ]
    },
    {
      id: 'template_rapor_akhir',
      menuName: 'Rapor (Lembar Nilai, KKM, Rata-Rata & Capaian)',
      category: 'Akademik',
      icon: <FileText size={20} className="text-blue-600" />,
      fileNameExcel: 'template-rapor-nilai-kkm-capaian-pembelajaran.xlsx',
      fileNameCsv: 'template-rapor-nilai-kkm-capaian-pembelajaran.csv',
      description: 'Format resmi cetak rapor: KKM, Nilai Akhir, Capaian Kompetensi, Deskripsi Capaian Pembelajaran dari TP, Jumlah Nilai, dan Rata-Rata Nilai.',
      columns: [
        'No',
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Mata Pelajaran',
        'KKM',
        'Nilai Akhir',
        'Capaian Kompetensi',
        'Deskripsi Capaian Pembelajaran',
        'Jumlah Nilai',
        'Rata-Rata Nilai',
        'Catatan Guru',
        'Kehadiran (S/I/A)',
        'Keputusan Kenaikan Kelas'
      ],
      sampleRows: [
        ['1', '3137319436', 'MANUELA A.SESILIA KASIPMABIN', 'IV', 'Genap', 'Pendidikan Agama dan Budi Pekerti', '75', '86', 'Sangat Baik', 'Sesilia menunjukkan penguasaan yang sangat baik dalam bersyukur atas anggota tubuh yang dimilikinya sebagai anugerah Allah.', '584', '83.43', 'Puji Tuhan, Sesilia Tingkatkan prestasi belajar lebih Rajin lagi, jangan lupa berdoa sebelum belajar!', '0S / 0I / 1A', 'Naik ke Kelas V (Lima)'],
        ['2', '3137319436', 'MANUELA A.SESILIA KASIPMABIN', 'IV', 'Genap', 'Pendidikan Pancasila', '75', '84', 'Baik', 'Sesilia menunjukkan penguasaan yang sangat baik dalam mengidentifikasi nilai Pancasila dalam kehidupan sehari-hari.', '584', '83.43', 'Puji Tuhan, Sesilia Tingkatkan prestasi belajar lebih Rajin lagi!', '0S / 0I / 1A', 'Naik ke Kelas V (Lima)'],
        ['3', '3137319436', 'MANUELA A.SESILIA KASIPMABIN', 'IV', 'Genap', 'Bahasa Indonesia', '75', '77', 'Cukup', 'Sesilia menunjukkan penguasaan yang cukup dalam mengenali abjad dan membaca teks narasi.', '584', '83.43', 'Tingkatkan lagi belajar membaca di rumah.', '0S / 0I / 1A', 'Naik ke Kelas V (Lima)']
      ]
    },
    {
      id: 'template_halaman_kaver',
      menuName: 'Halaman Kaver Buku Rapor',
      category: 'Buku Rapor',
      icon: <BookOpen size={20} className="text-amber-600" />,
      fileNameExcel: 'template-halaman-kaver-buku-rapor.xlsx',
      fileNameCsv: 'template-halaman-kaver-buku-rapor.csv',
      description: 'Format data halaman Kaver buku rapor: Judul RAPOR PESERTA DIDIK (SD), Nama Siswa, NISN, NIS, Satuan Pendidikan, dan Kemendikbudristek.',
      columns: [
        'Nama Peserta Didik',
        'NISN',
        'NIS',
        'Nama Satuan Pendidikan',
        'NPSN',
        'Kabupaten/Kota',
        'Provinsi',
        'Kementerian / Lembaga'
      ],
      sampleRows: [
        ['MANUELA A.SESILIA KASIPMABIN', '3137319436', '_', 'SD Negeri Balil', '69970290', 'Pegunungan Bintang', 'Papua Pegunungan', 'KEMENDIKBUD RISTEK REPUBLIK INDONESIA'],
        ['Markus Nabyal', '0098765432', '26001', 'SD Negeri Balil', '69970290', 'Pegunungan Bintang', 'Papua Pegunungan', 'KEMENDIKBUD RISTEK REPUBLIK INDONESIA']
      ]
    },
    {
      id: 'template_rapor_peserta_didik',
      menuName: 'Rapor Peserta Didik (Identitas Sekolah)',
      category: 'Buku Rapor',
      icon: <School size={20} className="text-cyan-700" />,
      fileNameExcel: 'template-rapor-peserta-didik-identitas-sekolah.xlsx',
      fileNameCsv: 'template-rapor-peserta-didik-identitas-sekolah.csv',
      description: 'Format Halaman 2 Buku Rapor (Identitas Satuan Pendidikan): Nama Sekolah, NSS, NPSN, Alamat, Kode Pos, Desa, Kecamatan, Kab, Prov, Website, dan Email.',
      columns: [
        'Nama Sekolah',
        'NISN/NIS/NSS',
        'NPSN',
        'Alamat Sekolah',
        'Kode Pos',
        'Telepon',
        'Kelurahan/Desa',
        'Kecamatan',
        'Kabupaten/Kota',
        'Provinsi',
        'Website',
        'E-mail'
      ],
      sampleRows: [
        ['SD Negeri Balil', '_', '69970290', 'Jl.Betaabib Kabiding', '99573', '_', 'Kabiding', 'Oksibil', 'Pegunungan Bintang', 'Papua Pegunungan', '_', '_']
      ]
    },
    {
      id: 'template_identitas_siswa',
      menuName: 'Identitas Peserta Didik (Biodata Siswa)',
      category: 'Buku Rapor',
      icon: <UserCheck size={20} className="text-purple-700" />,
      fileNameExcel: 'template-identitas-peserta-didik-biodata-lengkap.xlsx',
      fileNameCsv: 'template-identitas-peserta-didik-biodata-lengkap.csv',
      description: 'Format Halaman 3 Buku Rapor (Biodata Siswa Resmi): Nama, NISN/NIS, TTL, Jenis Kelamin, Agama, Asal Sekolah, Alamat, Nama Ortu, Pekerjaan, Alamat Ortu, Wali, Pas Foto & Pengesahan.',
      columns: [
        'Nama Peserta Didik',
        'NISN/NIS',
        'Tempat Lahir',
        'Tanggal Lahir',
        'Jenis Kelamin',
        'Agama',
        'Pendidikan Sebelumnya',
        'Alamat Peserta Didik',
        'Nama Ayah',
        'Nama Ibu',
        'Pekerjaan Ayah',
        'Pekerjaan Ibu',
        'Alamat Jalan Ortu',
        'Kelurahan/Desa',
        'Kecamatan',
        'Kabupaten/Kota',
        'Provinsi',
        'Nama Wali',
        'Pekerjaan Wali',
        'Alamat Wali',
        'Tempat Penetapan',
        'Tanggal Penetapan',
        'Nama Kepala Sekolah',
        'NIP Kepala Sekolah'
      ],
      sampleRows: [
        ['MANUELA A.SESILIA KASIPMABIN', '3137319436/_', 'Mabilabol', '6 November 2013', 'Perempuan', 'Katolik', '_', 'Oksibil', 'FRENGKY A KASIPMABIN', 'Anita Sitaup', '_', '_', '_', 'Kabiding', 'Oksibil', 'Pegunungan Bintang', 'Papua Pegunungan', '_', '_', '_', 'Oksibil', '25 Juli 2021', 'Charles Dedenip uropmabin', '19012311991081001']
      ]
    },
    {
      id: 'template_nilai_akademik',
      menuName: 'Input Nilai Akademik Formatif & Sumatif',
      category: 'Akademik',
      icon: <FileSpreadsheet size={20} className="text-emerald-700" />,
      fileNameExcel: 'template-nilai-akademik-rapor-kurikulum-merdeka.xlsx',
      fileNameCsv: 'template-nilai-akademik-rapor-kurikulum-merdeka.csv',
      description: 'Format nilai akademik lengkap: formatif, sumatif, penilaian harian, PTS, PAS, nilai akhir, kode TP, dan deskripsi capaian terhubung TP.',
      columns: [
        'NISN',
        'Nama Siswa',
        'Mata Pelajaran',
        'Formatif',
        'Sumatif',
        'PH1',
        'PH2',
        'PH3',
        'PTS',
        'PAS',
        'Praktik',
        'Nilai Akhir',
        'Kode TP Terhubung',
        'Deskripsi Capaian dari TP'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'Bahasa Indonesia', '85', '85', '84', '86', '85', '85', '86', '88', '85', 'TP003', 'Menunjukkan pemahaman yang baik dalam memahami teks bacaan dan aktif berbicara.'],
        ['0098765433', 'Yohana Kasipmabin', 'Bahasa Indonesia', '88', '88', '88', '90', '86', '88', '88', '90', '88', 'TP003', 'Sangat terampil dalam menyusun karangan deskripsi dan membaca puisi.'],
        ['0098765434', 'Kornelis Uropmabin', 'Bahasa Indonesia', '78', '80', '78', '80', '76', '80', '80', '82', '79', 'TP003', 'Menunjukkan penguasaan yang cukup baik dalam mengenali kosakata baru.']
      ]
    },
    {
      id: 'template_nilai_pts',
      menuName: 'Nilai Rapor PTS (Tengah Semester)',
      category: 'Akademik',
      icon: <ScrollText size={20} className="text-amber-600" />,
      fileNameExcel: 'template-nilai-pts-tengah-semester.xlsx',
      fileNameCsv: 'template-nilai-pts-tengah-semester.csv',
      description: 'Format nilai Penilaian Tengah Semester (PTS): Nilai Formatif, Ujian PTS, Rata-rata PTS, Predikat, Kode TP, dan Catatan Kemajuan.',
      columns: [
        'NISN',
        'Nama Siswa',
        'Mata Pelajaran',
        'Nilai Formatif (0-100)',
        'Nilai PTS (0-100)',
        'Nilai Rapor PTS',
        'Predikat (Sangat Baik / Baik / Cukup)',
        'Kode TP Terhubung',
        'Catatan Kemajuan Tengah Semester dari TP'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'Bahasa Indonesia', '85', '85', '85', 'Baik', 'TP003', 'Menunjukkan kemajuan yang sangat baik dalam membaca pemahaman teks cerita.'],
        ['0098765432', 'Markus Nabyal', 'Matematika', '80', '82', '81', 'Baik', 'TP004', 'Mampu menghitung perkalian bilangan ratusan dengan teliti.'],
        ['0098765433', 'Yohana Kasipmabin', 'Matematika', '90', '92', '91', 'Sangat Baik', 'TP004', 'Sangat cepat dan teliti menyelesaikan latihan soal matematika.']
      ]
    },
    {
      id: 'template_ekskul',
      menuName: 'Ekstrakurikuler Siswa',
      category: 'Akademik',
      icon: <Award size={20} className="text-indigo-600" />,
      fileNameExcel: 'template-ekstrakurikuler-siswa.xlsx',
      fileNameCsv: 'template-ekstrakurikuler-siswa.csv',
      description: 'Format data kegiatan ekstrakurikuler (Pramuka, Olahraga, Kesenian, UKS) beserta predikat dan keterangan kegiatan.',
      columns: [
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Jenis Ekstrakurikuler',
        'Predikat (Sangat Baik / Baik / Cukup)',
        'Keterangan Kegiatan'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'IV', 'Ganjil', 'Pramuka Siaga / Penggalang', 'Sangat Baik', 'Aktif sebagai pemimpin regu dan terampil dalam tali temali serta baris berbaris.'],
        ['0098765433', 'Yohana Kasipmabin', 'IV', 'Ganjil', 'Seni Tari Tradisional Papua', 'Sangat Baik', 'Sangat mahir memperagakan tari tradisional dan bersemangat dalam latihan.'],
        ['0098765434', 'Kornelis Uropmabin', 'IV', 'Ganjil', 'Sepak Bola & Atletik', 'Baik', 'Menunjukkan sportivitas tinggi dan stamina fisik yang sangat baik saat bertanding.']
      ]
    },
    {
      id: 'template_kehadiran',
      menuName: 'Kehadiran / Presensi Siswa',
      category: 'Akademik',
      icon: <CalendarCheck size={20} className="text-rose-600" />,
      fileNameExcel: 'template-kehadiran-siswa.xlsx',
      fileNameCsv: 'template-kehadiran-siswa.csv',
      description: 'Format rekapitulasi ketidakhadiran siswa: Sakit (S), Izin (I), Tanpa Keterangan / Alpa (A), dan total hari efektif.',
      columns: [
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Sakit (Hari)',
        'Izin (Hari)',
        'Tanpa Keterangan / Alpa (Hari)',
        'Total Hari Efektif Belajar'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'IV', 'Ganjil', '0', '1', '0', '108'],
        ['0098765433', 'Yohana Kasipmabin', 'IV', 'Ganjil', '1', '0', '0', '108'],
        ['0098765434', 'Kornelis Uropmabin', 'IV', 'Ganjil', '0', '0', '0', '108']
      ]
    },
    {
      id: 'template_catatan_wali',
      menuName: 'Catatan & Motivasi Wali Kelas',
      category: 'Akademik',
      icon: <MessageSquare size={20} className="text-amber-700" />,
      fileNameExcel: 'template-catatan-wali-kelas.xlsx',
      fileNameCsv: 'template-catatan-wali-kelas.csv',
      description: 'Format catatan motivasi pembinaan, nasihat belajar, dan penguatan karakter dari wali kelas untuk siswa di rapor.',
      columns: [
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Catatan Motivasi Wali Kelas'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'IV', 'Ganjil', 'Prestasi belajar ananda sangat membanggakan! Pertahankan sikap kepemimpinan dan terus giat membaca buku di rumah.'],
        ['0098765433', 'Yohana Kasipmabin', 'IV', 'Ganjil', 'Selamat atas hasil belajar yang gemilang! Terus kembangkan bakat menari dan kemampuan akademiknya.'],
        ['0098765434', 'Kornelis Uropmabin', 'IV', 'Ganjil', 'Semangat belajar ananda sudah sangat bagus. Tingkatkan ketelitian dalam berhitung dan tetap rajin belajar kelompok.']
      ]
    },
    {
      id: 'template_piagam',
      menuName: 'Piagam Penghargaan Siswa',
      category: 'Akademik',
      icon: <Award size={20} className="text-amber-600" />,
      fileNameExcel: 'template-data-piagam-penghargaan.xlsx',
      fileNameCsv: 'template-data-piagam-penghargaan.csv',
      description: 'Format data penerima Piagam Penghargaan: ranking juara 1-3, siswa teladan P5, kedisiplinan, dan minat bakat.',
      columns: [
        'Nomor Piagam',
        'NISN Siswa',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Tahun Pelajaran',
        'Kategori Prestasi',
        'Judul Piagam Penghargaan',
        'Alasan / Deskripsi Apresiasi',
        'Tempat Penetapan',
        'Tanggal Penetapan'
      ],
      sampleRows: [
        ['421.2/012/SDN-BL/PIAGAM/2026', '0098765432', 'Markus Nabyal', 'IV', 'Ganjil', '2026/2027', 'Akademik', 'JUARA I (PERINGKAT PERTAMA)', 'Atas prestasi luar biasa meraih Peringkat I dalam pencapaian hasil belajar akademik dengan nilai tertinggi.', 'Balil', '23 Desember 2026'],
        ['421.2/013/SDN-BL/PIAGAM/2026', '0098765433', 'Yohana Kasipmabin', 'IV', 'Ganjil', '2026/2027', 'Akademik', 'JUARA II (PERINGKAT KEDUA)', 'Atas prestasi istimewa meraih Peringkat II dalam ketuntasan belajar dengan dedikasi tinggi.', 'Balil', '23 Desember 2026'],
        ['421.2/014/SDN-BL/PIAGAM/2026', '0098765434', 'Kornelis Uropmabin', 'IV', 'Ganjil', '2026/2027', 'Karakter P5', 'SISWA TELADAN PROFIL PELAJAR PANCASILA', 'Atas pengamalan nilai akhlak mulia, gotong royong, dan kepribadian mandiri bernalar kritis.', 'Balil', '23 Desember 2026']
      ]
    },
    {
      id: 'template_p5',
      menuName: 'P5 Projek Profil Pelajar Pancasila',
      category: 'P5',
      icon: <Compass size={20} className="text-purple-700" />,
      fileNameExcel: 'template-projek-p5-kokurikuler.xlsx',
      fileNameCsv: 'template-projek-p5-kokurikuler.csv',
      description: 'Format data modul Projek P5, tema projek, fase, dimensi utama, elemen, sub-elemen, dan alokasi waktu.',
      columns: [
        'Judul Projek P5',
        'Tema Projek',
        'Fase',
        'Kelas',
        'Dimensi Utama',
        'Elemen',
        'Sub Elemen',
        'Deskripsi Ringkas Projek'
      ],
      sampleRows: [
        ['Kearifan Noken Papua & Anyaman Tradisional Balil', 'Kearifan Lokal', 'B', 'IV', 'Berkebinekaan Global & Kreatif', 'Mengenal dan menghargai budaya', 'Mendalami budaya dan identitas budaya', 'Mengenalkan proses pembuatan noken sebagai warisan leluhur Papua serta melatih kreativitas anyaman siswa.'],
        ['Berkebun Sayur Organik Pegunungan Bintang', 'Gaya Hidup Berkelanjutan', 'B', 'IV', 'Bergotong Royong & Mandiri', 'Kolaborasi', 'Kerjasama dan koordinasi sosial', 'Membiasakan siswa menanam sayur kol dan wortel di pekarangan sekolah secara bergotong royong.']
      ]
    },
    {
      id: 'template_p5_nilai',
      menuName: 'Penilaian Capaian Projek P5',
      category: 'P5',
      icon: <CheckCircle2 size={20} className="text-purple-600" />,
      fileNameExcel: 'template-capaian-nilai-projek-p5.xlsx',
      fileNameCsv: 'template-capaian-nilai-projek-p5.csv',
      description: 'Format penilaian asesmen dimensi dan sub-elemen Projek Profil Pelajar Pancasila (BB / MB / BSH / SB).',
      columns: [
        'NISN',
        'Nama Siswa',
        'Judul Projek P5',
        'Dimensi P5',
        'Elemen P5',
        'Sub Elemen',
        'Capaian (BB/MB/BSH/SB)',
        'Catatan Perkembangan Karakter'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'Kearifan Noken Papua & Anyaman Tradisional Balil', 'Berkebinekaan Global', 'Mengenal dan Menghargai Budaya', 'Mendalami budaya dan identitas budaya', 'SB', 'Sangat berkembang dalam menghargai proses pembuatan noken dan mengenal filosofi lokal Papua.'],
        ['0098765433', 'Yohana Kasipmabin', 'Kearifan Noken Papua & Anyaman Tradisional Balil', 'Kreatif', 'Menghasilkan karya orisinal', 'Mengeksplorasi gagasan dalam anyaman', 'BSH', 'Berkembang sesuai harapan dan terampil memadukan motif serat kulit kayu lokal.']
      ]
    },
    {
      id: 'template_p5_tahapan',
      menuName: 'Tahapan Alur Projek P5',
      category: 'P5',
      icon: <Milestone size={20} className="text-indigo-600" />,
      fileNameExcel: 'template-tahapan-alur-projek-p5.xlsx',
      fileNameCsv: 'template-tahapan-alur-projek-p5.csv',
      description: 'Format data alur 5 tahapan pelaksanaan Projek P5 (Pengenalan, Kontekstualisasi, Aksi, Refleksi, Tindak Lanjut), uraian aktivitas, dan alokasi tanggal.',
      columns: [
        'Judul Projek P5',
        'Tahapan Projek (Pengenalan / Kontekstualisasi / Aksi / Refleksi / Tindak Lanjut)',
        'Uraian Kegiatan Projek',
        'Alokasi Waktu / Tanggal Pelaksanaan'
      ],
      sampleRows: [
        ['Kearifan Noken Papua & Anyaman Tradisional Balil', 'Pengenalan', 'Pengenalan jenis serat kayu bahan noken dan nilai filosofi budaya luhur Papua.', '2026-08-01'],
        ['Kearifan Noken Papua & Anyaman Tradisional Balil', 'Kontekstualisasi', 'Mengamati para mama perajin noken di Kampung Balil secara langsung dan berdialog.', '2026-08-15'],
        ['Kearifan Noken Papua & Anyaman Tradisional Balil', 'Aksi', 'Praktik membuat anyaman noken sederhana dari benang dan serat kayu lokal bersama kelompok.', '2026-09-01'],
        ['Kearifan Noken Papua & Anyaman Tradisional Balil', 'Refleksi', 'Refleksi pengalaman berkarya, kendala anyaman, dan apresiasi karya antarteman.', '2026-10-10'],
        ['Kearifan Noken Papua & Anyaman Tradisional Balil', 'Tindak Lanjut', 'Pameran gelar karya noken cilik pada perayaan panen hasil belajar sekolah.', '2026-11-20']
      ]
    },
    {
      id: 'template_p5_dimensi',
      menuName: 'Dimensi & Elemen P5',
      category: 'P5',
      icon: <Layers size={20} className="text-amber-600" />,
      fileNameExcel: 'template-dimensi-elemen-p5.xlsx',
      fileNameCsv: 'template-dimensi-elemen-p5.csv',
      description: 'Format struktur dimensi, elemen, dan sub-elemen Projek Penguatan Profil Pelajar Pancasila untuk acuan rubrik penilaian kokurikuler.',
      columns: [
        'Dimensi Profil Pelajar Pancasila',
        'Elemen',
        'Sub-Elemen Capaian'
      ],
      sampleRows: [
        ['Berkebinekaan Global', 'Mengenal dan Menghargai Budaya', 'Mendalami budaya dan identitas budaya lokal Papua'],
        ['Gotong Royong', 'Kolaborasi', 'Kerja sama tim dan koordinasi sosial antarteman dalam projek'],
        ['Mandiri', 'Pemahaman Diri dan Situasi', 'Mengenali kualitas dan minat diri serta tantangan yang dihadapi'],
        ['Bernalar Kritis', 'Memperoleh dan Memproses Informasi', 'Mengidentifikasi, mengklarifikasi, dan mengolah informasi dan gagasan'],
        ['Kreatif', 'Menghasilkan Karya dan Tindakan Orisinal', 'Mengeksplorasi dan mengekspresikan pikiran atau perasaan dalam bentuk karya']
      ]
    },
    {
      id: 'template_rekap_nilai',
      menuName: 'Rekapitulasi Nilai & Peringkat Siswa',
      category: 'Akademik',
      icon: <TableProperties size={20} className="text-teal-600" />,
      fileNameExcel: 'template-rekapitulasi-nilai-seluruh-mapel.xlsx',
      fileNameCsv: 'template-rekapitulasi-nilai-seluruh-mapel.csv',
      description: 'Format rekapitulasi nilai akhir seluruh mata pelajaran per siswa, jumlah total, rata-rata kelas, predikat, dan status capaian belajar.',
      columns: [
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Agama',
        'Pancasila',
        'B. Indo',
        'MTK',
        'IPAS',
        'PJOK',
        'Seni Budaya',
        'B. Inggris',
        'Muatan Lokal',
        'Total Nilai',
        'Rata-rata',
        'Predikat',
        'Peringkat Kelas'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'IV', 'Ganjil', '88', '86', '85', '84', '85', '88', '85', '82', '90', '773', '85.9', 'Sangat Baik', 'Juara 1'],
        ['0098765433', 'Yohana Kasipmabin', 'IV', 'Ganjil', '86', '88', '88', '88', '84', '85', '86', '84', '88', '777', '86.3', 'Sangat Baik', 'Juara 2'],
        ['0098765434', 'Kornelis Uropmabin', 'IV', 'Ganjil', '82', '80', '79', '78', '80', '85', '82', '76', '84', '726', '80.7', 'Baik', 'Juara 3']
      ]
    },
    {
      id: 'template_keputusan_siswa',
      menuName: 'Keputusan Kenaikan Kelas & Kelulusan',
      category: 'Akademik',
      icon: <Award size={20} className="text-blue-700" />,
      fileNameExcel: 'template-keputusan-kenaikan-kelulusan-siswa.xlsx',
      fileNameCsv: 'template-keputusan-kenaikan-kelulusan-siswa.csv',
      description: 'Format penetapan resmi keputusan kenaikan kelas (Naik ke Kelas Berikutnya) atau Kelulusan peserta didik Kurikulum Merdeka.',
      columns: [
        'NISN',
        'Nama Siswa',
        'Kelas Saat Ini',
        'Semester',
        'Tahun Pelajaran',
        'Status Keputusan (Naik Kelas / Lulus / Tinggal)',
        'Keterangan / Naik ke Kelas',
        'Catatan / Keputusan Dewan Guru'
      ],
      sampleRows: [
        ['0098765432', 'Markus Nabyal', 'IV', 'Genap', '2026/2027', 'Naik Kelas', 'Naik ke Kelas V (Lima)', 'Memenuhi seluruh kriteria ketuntasan tujuan pembelajaran dan berakhlak mulia.'],
        ['0098765433', 'Yohana Kasipmabin', 'IV', 'Genap', '2026/2027', 'Naik Kelas', 'Naik ke Kelas V (Lima)', 'Prestasi belajar akademik sangat memuaskan dan berdedikasi tinggi.'],
        ['0098765434', 'Kornelis Uropmabin', 'IV', 'Genap', '2026/2027', 'Naik Kelas', 'Naik ke Kelas V (Lima)', 'Menuntaskan seluruh capaian pembelajaran dengan keaktifan belajar yang baik.']
      ]
    },
    {
      id: 'template_sekolah',
      menuName: 'Identitas Sekolah & Legalisasi',
      category: 'Sekolah',
      icon: <School size={20} className="text-slate-700" />,
      fileNameExcel: 'template-identitas-sekolah.xlsx',
      fileNameCsv: 'template-identitas-sekolah.csv',
      description: 'Format profil kelembagaan SD Negeri Balil, KOP rapor, pimpinan sekolah, dan titimangsa (Email dan Website bersifat opsional).',
      columns: [
        'Nama Pemerintah / Pemda',
        'Nama Instansi / Dinas',
        'Nama Sekolah',
        'NPSN',
        'NSS',
        'Alamat Lengkap',
        'Desa / Kelurahan',
        'Distrik / Kecamatan',
        'Kabupaten',
        'Provinsi',
        'Kode Pos',
        'Email Sekolah (Opsional - Boleh Kosong)',
        'Website Sekolah (Opsional - Boleh Kosong)',
        'Nama Kepala Sekolah',
        'NIP Kepala Sekolah (Opsional)',
        'Tahun Pelajaran',
        'Tempat Titimangsa Rapor',
        'Tanggal Rapor'
      ],
      sampleRows: [
        [
          'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG',
          'DINAS PENDIDIKAN DAN PENGAJARAN',
          'SD NEGERI BALIL',
          '60309821',
          '101250304001',
          'Jalan Pendidikan No. 04, Kampung Balil',
          'Balil',
          'Oksibil',
          'Pegunungan Bintang',
          'Papua Pegunungan',
          '99573',
          '-',
          '-',
          'Agustinus Kalakmabin, S.Pd.',
          '19780512 200501 1 008',
          '2026/2027',
          'Balil',
          '19 Desember 2026'
        ]
      ]
    }
  ];

  const filteredTemplates = TEMPLATES.filter(
    (t) => selectedCategory === 'SEMUA' || t.category === selectedCategory
  );

  /**
   * Menghasilkan baris data riil yang sedang aktif di database sekolah (SD Negeri Balil)
   * Setiap data atau fitur yang diminta atau ada perubahan di aplikasi, otomatis diikutsertakan
   * ke dalam template resmi saat diunduh, dengan fallback ke contoh standar jika belum ada data.
   */
  const getActiveDataRows = (item: TemplateItem): (string | number)[][] => {
    try {
      if (item.id === 'template_siswa') {
        if (db.siswa && db.siswa.length > 0) {
          return db.siswa.map((s) => [
            s.nisn,
            s.nis,
            s.namaSiswa,
            s.jenisKelamin,
            s.agama,
            s.tempatLahir,
            s.tanggalLahir,
            s.nik,
            s.kelas,
            s.fase,
            s.namaAyah,
            s.namaIbu,
            s.pekerjaanAyah || '-',
            s.pekerjaanIbu || '-',
            s.namaWali || '-',
            s.pekerjaanWali || '-',
            s.alamatWali || '-',
            s.alamat,
            s.statusSiswa
          ]);
        }
      } else if (item.id === 'template_guru') {
        if (db.guru && db.guru.length > 0) {
          return db.guru.map((g) => [
            g.namaGuru,
            g.nip,
            g.jenisKelamin,
            g.pendidikan,
            g.jabatan,
            g.mataPelajaran,
            g.kelas,
            g.status,
            g.noHp
          ]);
        }
      } else if (item.id === 'template_mapel') {
        if (db.mataPelajaran && db.mataPelajaran.length > 0) {
          return db.mataPelajaran.map((m, idx) => [
            String(m.urutan || idx + 1),
            m.mataPelajaran,
            m.kelompok,
            String(m.kkm || 75)
          ]);
        }
      } else if (item.id === 'template_halaman_kaver') {
        if (db.siswa && db.siswa.length > 0) {
          return db.siswa.map((s) => [
            s.namaSiswa,
            s.nisn && !s.nisn.startsWith('BLM_') ? s.nisn : '3137319436',
            s.nis || '_',
            db.sekolah.namaSekolah || 'SD Negeri Balil',
            db.sekolah.npsn || '69970290',
            db.sekolah.kabupaten || 'Pegunungan Bintang',
            db.sekolah.provinsi || 'Papua Pegunungan',
            'KEMENDIKBUD RISTEK REPUBLIK INDONESIA'
          ]);
        }
      } else if (item.id === 'template_rapor_peserta_didik') {
        return [
          [
            db.sekolah.namaSekolah || 'SD Negeri Balil',
            db.sekolah.nss || '_',
            db.sekolah.npsn || '69970290',
            db.sekolah.alamat || 'Jl.Betaabib Kabiding',
            db.sekolah.kodePos || '99573',
            db.sekolah.telepon || '_',
            db.sekolah.desaKelurahan || 'Kabiding',
            db.sekolah.distrikKecamatan || 'Oksibil',
            db.sekolah.kabupaten || 'Pegunungan Bintang',
            db.sekolah.provinsi || 'Papua Pegunungan',
            db.sekolah.website || '_',
            db.sekolah.emailSekolah || '_'
          ]
        ];
      } else if (item.id === 'template_identitas_siswa') {
        if (db.siswa && db.siswa.length > 0) {
          return db.siswa.map((s) => [
            s.namaSiswa,
            `${s.nisn || '3137319436'}/${s.nis || '_'}`,
            s.tempatLahir || 'Mabilabol',
            s.tanggalLahir || '2013-11-06',
            s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
            s.agama || 'Katolik',
            s.sekolahAsal || '_',
            s.alamat || 'Oksibil',
            s.namaAyah || 'FRENGKY A KASIPMABIN',
            s.namaIbu || 'Anita Sitaup',
            s.pekerjaanAyah || '_',
            s.pekerjaanIbu || '_',
            s.alamat || '_',
            db.sekolah.desaKelurahan || 'Kabiding',
            db.sekolah.distrikKecamatan || 'Oksibil',
            db.sekolah.kabupaten || 'Pegunungan Bintang',
            db.sekolah.provinsi || 'Papua Pegunungan',
            s.namaWali || '_',
            s.pekerjaanWali || '_',
            s.alamatWali || '_',
            db.sekolah.tempatRapor || 'Oksibil',
            db.sekolah.tanggalRapor || '25 Juli 2021',
            db.sekolah.namaKepalaSekolah || 'Charles Dedenip uropmabin',
            db.sekolah.nipKepalaSekolah || '19012311991081001'
          ]);
        }
      } else if (item.id === 'template_kelas') {
        if (db.kelas && db.kelas.length > 0) {
          return db.kelas.map((k) => [
            k.namaKelas,
            k.fase,
            k.waliKelas,
            k.tahunPelajaran,
            k.semester
          ]);
        }
      } else if (item.id === 'template_tp') {
        if (db.tujuanPembelajaran && db.tujuanPembelajaran.length > 0) {
          return db.tujuanPembelajaran.map((t) => [
            t.kodeTp,
            t.mataPelajaran,
            t.fase,
            t.kelas,
            t.tujuanPembelajaran,
            'Indikator Capaian Materi Pokok'
          ]);
        }
      } else if (item.id === 'template_deskripsi_rapor') {
        if (db.nilaiAkademik && db.nilaiAkademik.length > 0) {
          return db.nilaiAkademik.map((n) => {
            const desc = generateReportDescriptionFromTP(n.mataPelajaran, n.kelas, n.nilaiAkhir, db.tujuanPembelajaran, n.namaSiswa);
            return [
              n.nisn,
              n.namaSiswa,
              n.kelas,
              n.semester,
              n.mataPelajaran,
              n.nilaiAkhir,
              n.capaianKompetensi,
              desc.linkedTpKodes.join(', ') || 'TP Terkait',
              desc.deskripsiTercapai || n.deskripsiTercapai,
              desc.deskripsiPerluPeningkatan || n.deskripsiPerluPeningkatan,
              desc.deskripsiRapor || n.deskripsiRapor
            ];
          });
        }
      } else if (item.id === 'template_rapor_akhir') {
        if (db.nilaiAkademik && db.nilaiAkademik.length > 0) {
          return db.nilaiAkademik.map((n, idx) => {
            const att = db.kehadiran.find((h) => h.nisn === n.nisn && h.semester === n.semester);
            const attStr = att ? `${att.sakit}S / ${att.izin}I / ${att.alpa}A` : '0S / 0I / 1A';
            const note = db.catatanWali.find((c) => c.nisn === n.nisn && c.semester === n.semester);
            const noteStr = note ? note.catatanWaliKelas : 'Puji Tuhan, tingkatkan prestasi belajar lebih rajin lagi!';
            const dec = db.keputusanSiswa?.find((d) => d.nisn === n.nisn);
            const decStr = dec ? dec.naikKelas : 'Naik ke Kelas V (Lima)';
            const mapelObj = db.mataPelajaran.find((m) => m.mataPelajaran === n.mataPelajaran);
            const kkmVal = n.kkm || mapelObj?.kkm || 75;
            const capaian = n.capaianKompetensi || (n.nilaiAkhir >= 85 ? 'Sangat Baik' : n.nilaiAkhir >= 75 ? 'Baik' : 'Cukup');
            return [
              idx + 1,
              n.nisn,
              n.namaSiswa,
              n.kelas,
              n.semester,
              n.mataPelajaran,
              kkmVal,
              n.nilaiAkhir,
              capaian,
              n.deskripsiRapor,
              '584',
              '83.43',
              noteStr,
              attStr,
              decStr
            ];
          });
        }
      } else if (item.id === 'template_nilai_akademik') {
        if (db.nilaiAkademik && db.nilaiAkademik.length > 0) {
          return db.nilaiAkademik.map((n) => [
            n.nisn,
            n.namaSiswa,
            n.mataPelajaran,
            n.formatif,
            n.sumatif,
            n.ph1 || 0,
            n.ph2 || 0,
            n.ph3 || 0,
            n.pts || 0,
            n.pas || 0,
            n.praktik || 0,
            n.nilaiAkhir,
            'TP001',
            n.deskripsiRapor
          ]);
        }
      } else if (item.id === 'template_nilai_pts') {
        if (db.nilaiAkademik && db.nilaiAkademik.length > 0) {
          return db.nilaiAkademik.map((n) => [
            n.nisn,
            n.namaSiswa,
            n.mataPelajaran,
            n.formatif,
            n.pts || n.nilaiAkhir,
            Math.round((n.formatif + (n.pts || n.nilaiAkhir)) / 2),
            n.predikat,
            'TP001',
            n.deskripsiTercapai || 'Menunjukkan kemajuan pembelajaran tengah semester yang baik'
          ]);
        }
      } else if (item.id === 'template_ekskul') {
        if (db.ekstrakurikuler && db.ekstrakurikuler.length > 0) {
          return db.ekstrakurikuler.map((e) => [
            e.nisn,
            e.namaSiswa,
            e.kelas,
            e.semester,
            e.jenisEkstrakurikuler,
            e.predikat,
            e.keterangan
          ]);
        }
      } else if (item.id === 'template_kehadiran') {
        if (db.kehadiran && db.kehadiran.length > 0) {
          return db.kehadiran.map((k) => [
            k.nisn,
            k.namaSiswa,
            k.kelas,
            k.semester,
            k.sakit,
            k.izin,
            k.alpa,
            k.totalHari
          ]);
        }
      } else if (item.id === 'template_catatan_wali') {
        if (db.catatanWali && db.catatanWali.length > 0) {
          return db.catatanWali.map((c) => [
            c.nisn,
            c.namaSiswa,
            c.kelas,
            c.semester,
            c.catatanWaliKelas
          ]);
        }
      } else if (item.id === 'template_piagam') {
        if (db.piagam && db.piagam.length > 0) {
          return db.piagam.map((p) => [
            p.nomorPiagam,
            p.nisn,
            p.namaSiswa,
            p.kelas,
            p.semester,
            p.tahunPelajaran,
            p.kategoriPrestasi,
            p.judulPenghargaan,
            p.keterangan,
            p.tempatPenetapan,
            p.tanggalPenetapan
          ]);
        }
      } else if (item.id === 'template_p5') {
        if (db.p5Projek && db.p5Projek.length > 0) {
          return db.p5Projek.map((p) => [
            p.namaProjek,
            p.tema,
            p.fase,
            p.kelas,
            'Berkebinekaan Global & Kreatif',
            'Mengenal dan Menghargai Budaya',
            'Mendalami budaya dan identitas budaya lokal',
            p.deskripsiProjek
          ]);
        }
      } else if (item.id === 'template_p5_tahapan') {
        if (db.p5Tahapan && db.p5Tahapan.length > 0) {
          return db.p5Tahapan.map((t) => {
            const pr = db.p5Projek.find((p) => p.idProjek === t.idProjek);
            return [
              pr ? pr.namaProjek : 'Kearifan Noken Papua & Anyaman Tradisional Balil',
              t.tahap,
              t.kegiatan,
              t.tanggal
            ];
          });
        }
      } else if (item.id === 'template_p5_dimensi') {
        if (db.p5Dimensi && db.p5Dimensi.length > 0) {
          return db.p5Dimensi.map((d) => [
            d.dimensi,
            d.elemen,
            d.subElemen
          ]);
        }
      } else if (item.id === 'template_p5_nilai') {
        if (db.p5Nilai && db.p5Nilai.length > 0) {
          return db.p5Nilai.map((pn) => {
            const pr = db.p5Projek.find((p) => p.idProjek === pn.idProjek);
            return [
              pn.nisn,
              pn.namaSiswa,
              pr ? pr.namaProjek : 'Kearifan Noken Papua & Anyaman Tradisional Balil',
              pn.dimensi,
              pn.elemen,
              'Sub-elemen Projek',
              pn.capaian,
              pn.deskripsi
            ];
          });
        }
      } else if (item.id === 'template_rekap_nilai') {
        if (db.siswa && db.siswa.length > 0) {
          return db.siswa.map((s, idx) => {
            const scores = db.nilaiAkademik.filter((n) => n.nisn === s.nisn);
            const total = scores.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
            const avg = scores.length > 0 ? (total / scores.length).toFixed(1) : '85.0';
            return [
              s.nisn,
              s.namaSiswa,
              s.kelas,
              s.semester,
              '85', '85', '85', '85', '85', '85', '85', '85', '85',
              total || '765',
              avg,
              Number(avg) >= 85 ? 'Sangat Baik' : 'Baik',
              `Juara ${idx + 1}`
            ];
          });
        }
      } else if (item.id === 'template_keputusan_siswa') {
        if (db.siswa && db.siswa.length > 0) {
          return db.siswa.map((s) => [
            s.nisn,
            s.namaSiswa,
            s.kelas,
            s.semester,
            db.sekolah.tahunPelajaran,
            'Naik Kelas',
            `Naik ke Kelas ${s.kelas === 'VI' ? 'SMP' : s.kelas === 'V' ? 'VI' : s.kelas === 'IV' ? 'V' : s.kelas === 'III' ? 'IV' : s.kelas === 'II' ? 'III' : 'II'}`,
            'Memenuhi seluruh kriteria ketuntasan tujuan pembelajaran Kurikulum Merdeka.'
          ]);
        }
      } else if (item.id === 'template_sekolah') {
        return [
          [
            db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG',
            db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN',
            db.sekolah.namaSekolah || 'SD NEGERI BALIL',
            db.sekolah.npsn || '60309821',
            db.sekolah.nss || '101250304001',
            db.sekolah.alamat || 'Jalan Pendidikan No. 04, Kampung Balil',
            db.sekolah.desaKelurahan || 'Balil',
            db.sekolah.distrikKecamatan || 'Oksibil',
            db.sekolah.kabupaten || 'Pegunungan Bintang',
            db.sekolah.provinsi || 'Papua Pegunungan',
            db.sekolah.kodePos || '99573',
            db.sekolah.emailSekolah || '-',
            db.sekolah.website || '-',
            db.sekolah.namaKepalaSekolah || 'Agustinus Kalakmabin, S.Pd.',
            db.sekolah.nipKepalaSekolah || '19780512 200501 1 008',
            db.sekolah.tahunPelajaran || '2026/2027',
            db.sekolah.tempatRapor || 'Balil',
            db.sekolah.tanggalRapor || '19 Desember 2026'
          ]
        ];
      }
    } catch (e) {
      console.warn('Gagal membaca data riil aktif untuk template', e);
    }
    return item.sampleRows;
  };

  /**
   * Menghasilkan file Excel Resmi Standar (.xlsx)
   * Menggunakan pustaka resmi XLSX (OpenXML):
   * - Dilengkapi Kop Surat Sekolah resmi
   * - Format tabel bergaris rapi & penomoran kolom standar Kemdikbudristek (1)(2)(3)...
   * - Seluruh kolom NISN, NIP, NIS, No HP terkunci sebagai TEKS murni agar angka 0 di depan tidak terpotong
   * - Lebar kolom otomatis disesuaikan (Auto-fit width)
   * - Mengikutsertakan Data Riil Sekolah Aktif bila mode aktif dipilih, atau 15 baris kosong template berpenomoran siap pakai untuk format blangko
   */
  const downloadExcel = (item: TemplateItem, forceActiveData?: boolean) => {
    const isReal = forceActiveData !== undefined ? forceActiveData : useActiveData;
    const effectiveRows = isReal ? getActiveDataRows(item) : item.sampleRows;

    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';

    const wb = XLSX.utils.book_new();

    // Data array
    const aoaData: (string | number)[][] = [
      [pemda],
      [instansi],
      [schoolName],
      [`FORMAT RESMI TABEL ADMINISTRASI: ${item.menuName.toUpperCase()}`],
      [`Tahun Pelajaran: ${schoolYear} • Kurikulum Merdeka • Kelas: ${db.sekolah.kelas || 'Semua'} • Status: ${isReal ? 'Data Riil Terkoneksi Database' : 'Format Blangko Standar'}`],
      [], // baris kosong pemisah
      ['NO', ...item.columns],
      ['(1)', ...item.columns.map((_, i) => `(${i + 2})`)],
    ];

    // Masukkan baris data (riil / sampel)
    effectiveRows.forEach((row, idx) => {
      aoaData.push([idx + 1, ...row]);
    });

    // Tambahkan baris kosong template berpenomoran siap pakai
    const nextStart = effectiveRows.length + 1;
    const emptyRowsToAdd = isReal ? 5 : 15;
    for (let i = 0; i < emptyRowsToAdd; i++) {
      aoaData.push([nextStart + i, ...item.columns.map(() => '')]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    // Hitung lebar kolom otomatis (Auto-fit width)
    const colWidths = ['NO', ...item.columns].map((colName) => {
      const lower = colName.toLowerCase();
      if (lower === 'no') return { wch: 6 };
      if (lower.includes('nisn')) return { wch: 18 };
      if (lower.includes('nis')) return { wch: 14 };
      if (lower.includes('nip')) return { wch: 24 };
      if (lower.includes('nama')) return { wch: 32 };
      if (lower.includes('lahir') || lower.includes('tanggal')) return { wch: 18 };
      if (lower.includes('alamat')) return { wch: 36 };
      if (lower.includes('deskripsi') || lower.includes('catatan') || lower.includes('keterangan') || lower.includes('capaian')) return { wch: 48 };
      if (lower.includes('mapel') || lower.includes('pelajaran')) return { wch: 30 };
      if (lower.includes('projek') || lower.includes('dimensi') || lower.includes('elemen')) return { wch: 36 };
      if (lower.includes('tujuan') || lower.includes('lingkup')) return { wch: 36 };
      return { wch: Math.max(colName.length + 4, 14) };
    });
    ws['!cols'] = colWidths;

    // Pastikan seluruh sel data diperlakukan sebagai teks murni (tipe 's')
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null) {
          if (R >= 6 && typeof cell.v === 'string') {
            cell.t = 's';
          }
        }
      }
    }

    const cleanSheetName = item.menuName.replace(/[:\\/?*\[\]]/g, '').slice(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

    const suffix = isReal ? '-data-aktif' : '';
    const fileNameXlsx = item.fileNameExcel.replace(/\.xlsx?$/, `${suffix}.xlsx`);
    XLSX.writeFile(wb, fileNameXlsx);

    showSaveNotification(
      `Tabel Resmi Excel (.xlsx) ${item.menuName} berhasil diunduh (${isReal ? 'Data Riil Sekolah Terhubung' : 'Blangko Kosong'})!`
    );
  };

  /**
   * Unduh seluruh template tabel resmi sekaligus dalam 1 Buku Kerja Excel (.xlsx) rapi
   * Mengikutsertakan seluruh data riil sekolah yang aktif dan saling terhubung
   */
  const downloadAllExcel = (forceActiveData?: boolean) => {
    const isReal = forceActiveData !== undefined ? forceActiveData : useActiveData;
    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';

    const wb = XLSX.utils.book_new();

    TEMPLATES.forEach((item) => {
      const effectiveRows = isReal ? getActiveDataRows(item) : item.sampleRows;

      const aoaData: (string | number)[][] = [
        [pemda],
        [instansi],
        [schoolName],
        [`FORMAT RESMI TABEL ADMINISTRASI: ${item.menuName.toUpperCase()}`],
        [`Tahun Pelajaran: ${schoolYear} • Kurikulum Merdeka • Kelas: ${db.sekolah.kelas || 'Semua'} • Mode: ${isReal ? 'Sinkronisasi Data Riil Database' : 'Blangko Kosong Standar'}`],
        [],
        ['NO', ...item.columns],
        ['(1)', ...item.columns.map((_, i) => `(${i + 2})`)],
      ];

      effectiveRows.forEach((row, idx) => {
        aoaData.push([idx + 1, ...row]);
      });

      const nextStart = effectiveRows.length + 1;
      const emptyRowsToAdd = isReal ? 5 : 10;
      for (let i = 0; i < emptyRowsToAdd; i++) {
        aoaData.push([nextStart + i, ...item.columns.map(() => '')]);
      }

      const ws = XLSX.utils.aoa_to_sheet(aoaData);
      ws['!cols'] = ['NO', ...item.columns].map((c) => ({ wch: Math.max(c.length + 4, 15) }));
      const cleanSheetName = item.menuName.replace(/[:\\/?*\[\]]/g, '').slice(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
    });

    const filePrefix = isReal ? 'semua-template-dan-data-aktif-sd-balil.xlsx' : 'semua-template-blangko-sd-balil.xlsx';
    XLSX.writeFile(wb, filePrefix);
    showSaveNotification(
      `Seluruh ${TEMPLATES.length} template tabel resmi berhasil diunduh dalam file Excel (.xlsx) (${isReal ? 'Data Riil Sekolah Terhubung' : 'Blangko Kosong'})!`
    );
  };

  /**
   * Menghasilkan file CSV Excel Indonesia (titik koma ';' dengan direktif sep=;)
   * Tidak akan teracak ke dalam Kolom A saat dibuka di Excel Windows versi Indonesia!
   */
  const downloadCsvIndo = (item: TemplateItem, forceActiveData?: boolean) => {
    const isReal = forceActiveData !== undefined ? forceActiveData : useActiveData;
    const effectiveRows = isReal ? getActiveDataRows(item) : item.sampleRows;

    const headerLine = ['No', ...item.columns]
      .map((col) => `"${col.replace(/"/g, '""')}"`)
      .join(';');

    const rowsLines = effectiveRows.map((row, idx) => {
      return [idx + 1, ...row].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';');
    });

    const csvContent = 'sep=;\r\n' + [headerLine, ...rowsLines].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.fileNameCsv.replace('.csv', isReal ? '-data-aktif-excel-indo.csv' : '-excel-indo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSaveNotification(`File CSV Excel ${item.menuName} berhasil diunduh!`);
  };

  /**
   * Unduh CSV Standar (Koma ',')
   */
  const downloadCsvStandard = (item: TemplateItem, forceActiveData?: boolean) => {
    const isReal = forceActiveData !== undefined ? forceActiveData : useActiveData;
    const effectiveRows = isReal ? getActiveDataRows(item) : item.sampleRows;

    const headerLine = ['No', ...item.columns]
      .map((col) => `"${col.replace(/"/g, '""')}"`)
      .join(',');

    const rowsLines = effectiveRows.map((row, idx) => {
      return [idx + 1, ...row].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headerLine, ...rowsLines].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.fileNameCsv.replace('.csv', isReal ? '-data-aktif.csv' : '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSaveNotification(`File CSV ${item.menuName} berhasil diunduh!`);
  };

  /**
   * Menyalin data ke clipboard dalam format Tab-Separated (TSV)
   * Guru bisa langsung membuka Excel dan menekan Ctrl+V (Paste) langsung jadi tabel rapi!
   */
  const copyToClipboard = (item: TemplateItem, forceActiveData?: boolean) => {
    const isReal = forceActiveData !== undefined ? forceActiveData : useActiveData;
    const effectiveRows = isReal ? getActiveDataRows(item) : item.sampleRows;

    const headerLine = ['No', ...item.columns].join('\t');
    const rowsLines = effectiveRows.map((row, idx) => [idx + 1, ...row].join('\t'));
    const tsvContent = [headerLine, ...rowsLines].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedId(item.id);
      showSaveNotification(
        `Tabel ${item.menuName} berhasil disalin! Anda bisa langsung buka Excel dan tekan Ctrl+V.`
      );
      setTimeout(() => setCopiedId(null), 3000);
    });
  };

  /**
   * Generator Khusus: Unduh Template Excel (.xlsx) Resmi untuk Mata Pelajaran Terpilih
   */
  const downloadCustomSubjectExcel = () => {
    const schoolName = db.sekolah.namaSekolah || 'SD NEGERI BALIL';
    const schoolYear = db.sekolah.tahunPelajaran || '2026/2027';
    const pemda = db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG';
    const instansi = db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN';

    const wb = XLSX.utils.book_new();
    let title = '';
    let columns: string[] = [];
    let rows: (string | number)[][] = [];
    let fileName = '';

    const siswaDiKelas = db.siswa.filter((s) => s.kelas === generatorKelas);

    if (generatorType === 'tp') {
      title = `FORMAT TUJUAN PEMBELAJARAN (TP): ${generatorMapel.toUpperCase()}`;
      fileName = `template-tp-${generatorMapel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-kelas-${generatorKelas}.xlsx`;
      columns = [
        'Kode TP',
        'Mata Pelajaran',
        'Fase',
        'Kelas',
        'Rumusan Tujuan Pembelajaran (TP)',
        'Indikator Capaian / Materi Pokok'
      ];

      const existingTps = db.tujuanPembelajaran.filter(
        (t) => t.mataPelajaran === generatorMapel && t.kelas === generatorKelas
      );

      if (existingTps.length > 0) {
        existingTps.forEach((t) => {
          rows.push([t.kodeTp, t.mataPelajaran, t.fase, t.kelas, t.tujuanPembelajaran, 'Materi Inti Semester']);
        });
      } else {
        rows = [
          ['TP001', generatorMapel, 'B', generatorKelas, `Peserta didik mampu memahami konsep inti pembelajaran ${generatorMapel} dengan teliti.`, 'Materi Pokok 1'],
          ['TP002', generatorMapel, 'B', generatorKelas, `Peserta didik mampu mempraktikkan keterampilan dan pemecahan masalah pada materi ${generatorMapel}.`, 'Materi Pokok 2']
        ];
      }
    } else if (generatorType === 'nilai') {
      title = `FORMAT NILAI FORMATIF & SUMATIF: ${generatorMapel.toUpperCase()}`;
      fileName = `template-nilai-${generatorMapel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-kelas-${generatorKelas}.xlsx`;
      columns = [
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Mata Pelajaran',
        'Nilai Formatif (0-100)',
        'Nilai Sumatif (0-100)',
        'Nilai Akhir (0-100)',
        'Capaian Kompetensi',
        'Deskripsi Capaian dari TP'
      ];

      siswaDiKelas.forEach((s) => {
        const descResult = generateReportDescriptionFromTP(generatorMapel, generatorKelas, 82, db.tujuanPembelajaran, s.namaSiswa);
        rows.push([s.nisn, s.namaSiswa, generatorKelas, 'Ganjil', generatorMapel, 82, 84, 83, 'Baik', descResult.deskripsiRapor]);
      });
    } else {
      title = `FORMAT RESMI DESKRIPSI CAPAIAN RAPOR TERHUBUNG TP: ${generatorMapel.toUpperCase()}`;
      fileName = `template-deskripsi-${generatorMapel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-kelas-${generatorKelas}.xlsx`;
      columns = [
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

      siswaDiKelas.forEach((s) => {
        const descResult = generateReportDescriptionFromTP(generatorMapel, generatorKelas, 85, db.tujuanPembelajaran, s.namaSiswa);
        rows.push([
          s.nisn,
          s.namaSiswa,
          generatorKelas,
          'Ganjil',
          generatorMapel,
          85,
          'Sangat Baik',
          descResult.linkedTpKodes.join(', ') || 'TP001',
          descResult.deskripsiTercapai,
          descResult.deskripsiPerluPeningkatan,
          descResult.deskripsiRapor
        ]);
      });
    }

    const aoaData: (string | number)[][] = [
      [pemda],
      [instansi],
      [schoolName],
      [title],
      [`Mata Pelajaran: ${generatorMapel} • Kelas: ${generatorKelas} • Tahun Pelajaran: ${schoolYear}`],
      [],
      ['NO', ...columns],
      ['(1)', ...columns.map((_, i) => `(${i + 2})`)],
      ...rows.map((r, idx) => [idx + 1, ...r])
    ];

    const startIdx = rows.length + 1;
    for (let i = 0; i < 15; i++) {
      aoaData.push([startIdx + i, ...columns.map(() => '')]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    ws['!cols'] = ['NO', ...columns].map((c) => ({ wch: c.length > 25 ? 45 : Math.max(c.length + 4, 15) }));
    XLSX.utils.book_append_sheet(wb, ws, generatorMapel.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 30));
    XLSX.writeFile(wb, fileName);
    showSaveNotification(`Template Excel (.xlsx) untuk ${generatorMapel} berhasil diunduh!`);
  };

  /**
   * Generator Khusus: Unduh CSV Indonesia (.csv) untuk Mata Pelajaran Terpilih
   */
  const downloadCustomSubjectCsv = () => {
    let columns: string[] = [];
    let rows: (string | number)[][] = [];
    let fileName = '';

    const siswaDiKelas = db.siswa.filter((s) => s.kelas === generatorKelas);

    if (generatorType === 'tp') {
      fileName = `template-tp-${generatorMapel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-kelas-${generatorKelas}.csv`;
      columns = [
        'Kode TP',
        'Mata Pelajaran',
        'Fase',
        'Kelas',
        'Rumusan Tujuan Pembelajaran (TP)',
        'Indikator Capaian / Materi Pokok'
      ];
      const existingTps = db.tujuanPembelajaran.filter(
        (t) => t.mataPelajaran === generatorMapel && t.kelas === generatorKelas
      );
      if (existingTps.length > 0) {
        existingTps.forEach((t) => {
          rows.push([t.kodeTp, t.mataPelajaran, t.fase, t.kelas, t.tujuanPembelajaran, 'Materi Inti Semester']);
        });
      } else {
        rows = [
          ['TP001', generatorMapel, 'B', generatorKelas, `Peserta didik mampu memahami konsep inti pembelajaran ${generatorMapel} dengan teliti.`, 'Materi Pokok 1'],
          ['TP002', generatorMapel, 'B', generatorKelas, `Peserta didik mampu mempraktikkan keterampilan dan pemecahan masalah pada materi ${generatorMapel}.`, 'Materi Pokok 2']
        ];
      }
    } else if (generatorType === 'nilai') {
      fileName = `template-nilai-${generatorMapel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-kelas-${generatorKelas}.csv`;
      columns = [
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Semester',
        'Mata Pelajaran',
        'Nilai Formatif (0-100)',
        'Nilai Sumatif (0-100)',
        'Nilai Akhir (0-100)',
        'Capaian Kompetensi',
        'Deskripsi Capaian dari TP'
      ];
      siswaDiKelas.forEach((s) => {
        const descResult = generateReportDescriptionFromTP(generatorMapel, generatorKelas, 82, db.tujuanPembelajaran, s.namaSiswa);
        rows.push([s.nisn, s.namaSiswa, generatorKelas, 'Ganjil', generatorMapel, 82, 84, 83, 'Baik', descResult.deskripsiRapor]);
      });
    } else {
      fileName = `template-deskripsi-${generatorMapel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-kelas-${generatorKelas}.csv`;
      columns = [
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
      siswaDiKelas.forEach((s) => {
        const descResult = generateReportDescriptionFromTP(generatorMapel, generatorKelas, 85, db.tujuanPembelajaran, s.namaSiswa);
        rows.push([
          s.nisn,
          s.namaSiswa,
          generatorKelas,
          'Ganjil',
          generatorMapel,
          85,
          'Sangat Baik',
          descResult.linkedTpKodes.join(', ') || 'TP001',
          descResult.deskripsiTercapai,
          descResult.deskripsiPerluPeningkatan,
          descResult.deskripsiRapor
        ]);
      });
    }

    const headerLine = ['No', ...columns].map((c) => `"${c.replace(/"/g, '""')}"`).join(';');
    const rowsLines = rows.map((r, idx) => [idx + 1, ...r].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'));
    const csvContent = ['sep=;', headerLine, ...rowsLines].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSaveNotification(`File CSV ${fileName} berhasil diunduh!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-800">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              <Sparkles size={14} /> Format Standar Tabel Resmi & Rapi (Siap Cetak & Isi)
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
              useActiveData 
                ? 'bg-blue-500/20 text-blue-200 border-blue-400/40' 
                : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
            }`}>
              <RefreshCw size={12} className={useActiveData ? 'animate-spin' : ''} />
              {useActiveData ? 'Sinkronisasi Data Riil Database Aktif' : 'Format Blangko Kosong Standar'}
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pusat Template Tabel Resmi SD Negeri Balil
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-3xl">
            Tersedia dalam format <strong>Tabel Excel Standar (.xlsx) Bergaris Rapi</strong> yang langsung terbuka teratur di Microsoft Excel & WPS Office di laptop Anda tanpa koneksi internet. Setiap ada penambahan / pembaruan data atau fitur di aplikasi, template otomatis mengikutsertakan data riil yang relevan.
          </p>

          {/* Toggle Pilihan Mode Template */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span>Mode Pengunduhan:</span>
              <button
                type="button"
                onClick={() => setUseActiveData(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  useActiveData
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                ✓ Sinkron Data Riil Sekolah Aktif
              </button>
              <button
                type="button"
                onClick={() => setUseActiveData(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !useActiveData
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                Blangko Kosong (+ Contoh)
              </button>
            </div>
            <div className="text-[11px] text-emerald-300 font-mono">
              {useActiveData ? 'Otomatis mengisi siswa, guru, mapel & TP sekolah' : 'Format formulir kosong siap cetak manual'}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => downloadAllExcel(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              title="Unduh semua template sekaligus dengan data siswa & sekolah saat ini"
            >
              <FileSpreadsheet size={16} /> Unduh Semua Tabel Excel (.xlsx) [Sinkron Data Aktif] ({TEMPLATES.length} File)
            </button>
            <button
              onClick={() => downloadAllExcel(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
              title="Unduh seluruh format blangko kosong standar"
            >
              <FolderDown size={15} /> Unduh Format Blangko Kosong
            </button>
            <div className="text-[11px] text-blue-200 flex items-center gap-1.5 font-medium">
              <Laptop size={14} className="text-emerald-400" /> Standar Excel Laptop Pedalaman Papua • 100% Offline
            </div>
          </div>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP TEMPLATE TABEL DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Pusat Template Data"
        badge={`${TEMPLATES.length} Template`}
        onSave={downloadAllExcel}
        saveLabel="Simpan / Unduh Semua (.xlsx)"
        onUpdate={downloadAllExcel}
        updateLabel="Perbarui Template"
        onEdit={() => {}}
        editLabel="Edit Format"
        onCancel={() => setSelectedCategory('SEMUA')}
        cancelLabel="Batal / Reset Filter"
        onDelete={() => {}}
        deleteLabel="Bersihkan Pilihan"
        onImport={handleImportUniversal}
        importLabel="Impor File Template (.xlsx / .csv)"
        onExport={downloadAllExcel}
        exportLabel="Expor Semua (.xlsx)"
        onUpload={handleImportUniversal}
        uploadLabel="Upload & Masukkan File"
        onClear={() => setSelectedCategory('SEMUA')}
        clearLabel="Bersihkan Filter"
        templateLabel="Format Standar"
      />

      {/* PUSAT UNGGAH & IMPOR FILE TEMPLATE (DETEKSI OTOMATIS) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-blue-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide">
              <FileUp size={14} className="text-emerald-400" />
              <span>Universal Importer & Auto-Detection</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pusat Impor Berkas Template Sekolah
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Unggah file Excel (<strong>.xlsx</strong>) atau <strong>.csv</strong> hasil unduhan template yang telah Anda isi.
              Sistem akan <strong>mendeteksi secara otomatis</strong> jenis template (Siswa, Guru, Mapel, KKM, TP, Nilai, Kehadiran, Catatan, P5, Piagam) dan langsung menyimpannya ke database sekolah tanpa batasan baris.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-blue-200">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Otomatis Hubungkan Relasi Antar Data</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Aman untuk Format Excel & WPS Laptop</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> 100% Offline Tanpa Internet</span>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5">
              <Upload size={18} />
              <span>{isImporting ? 'Memproses Berkas...' : 'Pilih & Impor Berkas Excel (.xlsx / .csv)'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={isImporting}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    handleImportUniversal(f);
                    e.target.value = '';
                  }
                }}
              />
            </label>
            <span className="text-[10px] text-blue-300 font-medium">
              Mendukung semua 18 template resmi Kurikulum Merdeka
            </span>
          </div>
        </div>
      </div>

      {/* GENERATOR TEMPLATE KHUSUS MASING-MASING MATA PELAJARAN (TP, NILAI, & RAPOR) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Fitur Otomatis
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Sesuai Pembaruan TP & Koneksi Rapor
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                Generator Template Khusus Masing-Masing Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-500">
                Unduh template resmi per mapel yang otomatis terisi nama peserta didik, kode TP aktif, dan narasi capaian Kurikulum Merdeka.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadCustomSubjectExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>Unduh Excel (.xlsx) {generatorMapel.slice(0, 15)}</span>
            </button>
            <button
              type="button"
              onClick={downloadCustomSubjectCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* 1. Baris Tombol Pilih Mata Pelajaran Sendiri-Sendiri */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            1. Pilih Mata Pelajaran (Klik tombol mapel di bawah):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {db.mataPelajaran.map((m, idx) => {
              const isSelected = generatorMapel === m.mataPelajaran;
              const shortCode = m.kode || `MP${idx + 1}`;
              return (
                <button
                  key={m.kode || m.mataPelajaran}
                  type="button"
                  onClick={() => setGeneratorMapel(m.mataPelajaran)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {shortCode}
                  </span>
                  <span>{m.mataPelajaran}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Format Template & Kelas Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              2. Jenis Format Template:
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setGeneratorType('tp')}
                className={`px-2.5 py-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  generatorType === 'tp'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                TP Khusus Mapel
              </button>
              <button
                type="button"
                onClick={() => setGeneratorType('nilai')}
                className={`px-2.5 py-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  generatorType === 'nilai'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Nilai Formatif & Sumatif
              </button>
              <button
                type="button"
                onClick={() => setGeneratorType('deskripsi')}
                className={`px-2.5 py-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  generatorType === 'deskripsi'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Deskripsi Capaian Rapor
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              3. Target Jenjang Kelas:
            </label>
            <div className="flex flex-wrap gap-1 text-xs">
              {(['I', 'II', 'III', 'IV', 'V', 'VI'] as ClassLevel[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGeneratorKelas(k)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                    generatorKelas === k
                      ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Kelas {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>
              Target: <strong>{generatorMapel}</strong> • Kelas <strong>{generatorKelas}</strong> • Format:{' '}
              <strong className="text-slate-800">
                {generatorType === 'tp'
                  ? 'Tujuan Pembelajaran (TP) Lengkap'
                  : generatorType === 'nilai'
                  ? 'Nilai Formatif & Sumatif'
                  : 'Deskripsi Capaian Rapor (Terhubung TP)'}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {db.siswa.filter((s) => s.kelas === generatorKelas).length} Siswa Terdaftar di Kelas {generatorKelas}
          </span>
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['SEMUA', 'Buku Rapor', 'Pokok', 'Akademik', 'P5', 'Sekolah'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat === 'SEMUA' ? 'Semua Menu' : `${cat}`}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-semibold px-2">
          Total <strong>{filteredTemplates.length}</strong> template tabel siap pakai
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((item) => {
          const isCopied = copiedId === item.id;
          const activeRowsCount = getActiveDataRows(item).length;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {useActiveData && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        {activeRowsCount} Data Riil
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {item.menuName}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Struktur Kolom */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Kolom Tabel Standar ({item.columns.length} kolom):</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[9px]">Bergaris Rapi</span>
                  </div>
                  <div className="text-[10px] text-slate-700 font-mono truncate" title={item.columns.join(' | ')}>
                    {item.columns.slice(0, 4).join(' • ')}
                    {item.columns.length > 4 ? ` + ${item.columns.length - 4} kolom lainnya` : ''}
                  </div>
                </div>

                {/* Garansi Kerapian & Status Data */}
                <div className="flex items-center gap-2 text-[10px] text-slate-600 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>
                    {useActiveData
                      ? `Terhubung langsung dengan ${activeRowsCount} data di database sekolah.`
                      : 'Langsung terpisah kolom rapi saat dibuka di Microsoft Excel / WPS.'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                {/* 1. Tombol Unduh / Expor Excel .XLSX */}
                <button
                  onClick={() => downloadExcel(item, useActiveData)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  title={useActiveData ? 'Unduh Tabel Excel (.xlsx) dengan data sekolah saat ini' : 'Unduh Tabel Excel (.xlsx) format blangko kosong'}
                >
                  <FileSpreadsheet size={15} />
                  <span>
                    {useActiveData
                      ? `Unduh Excel (.xlsx) [Data Aktif]`
                      : 'Unduh Excel (.xlsx) Blangko'}
                  </span>
                </button>

                {/* 2. Tombol Impor / Upload File Template Ini */}
                <label className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer hover:shadow-md">
                  <Upload size={14} />
                  <span>Impor File Template Ini (.xlsx/.csv)</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleImportSpecificTemplate(item.id, f);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                {/* Opsi Cepat Unduh Alternatif */}
                <div className="flex items-center justify-between text-[10px] px-1">
                  <button
                    type="button"
                    onClick={() => downloadExcel(item, !useActiveData)}
                    className="text-slate-600 hover:text-blue-900 hover:underline font-bold cursor-pointer"
                  >
                    ↳ Unduh {useActiveData ? 'Format Blangko' : 'Dengan Data Riil'}
                  </button>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Siap Impor & Expor
                  </span>
                </div>

                {/* Tombol Sekunder: Lihat Pratinjau, CSV, dan Salin */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewTemplate(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    title="Pratinjau Tabel di Layar"
                  >
                    <Eye size={13} />
                    <span>Lihat Tabel</span>
                  </button>

                  <button
                    onClick={() => downloadCsvIndo(item, useActiveData)}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Unduh format CSV Excel (pemisah titik koma ;)"
                  >
                    <Download size={13} className="inline mr-1" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(item, useActiveData)}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                    title="Salin data tabel ke clipboard (Bisa langsung Paste ke Excel)"
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Petunjuk Penggunaan Standar di Pedalaman */}
      <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 text-amber-950 space-y-3">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900">
          <Info size={16} /> Keunggulan Standar Tabel Resmi (.XLSX) untuk Guru di Pedalaman Papua
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed">
          <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs">
            <strong className="text-amber-900 block mb-1">1. Kolom Tertata Rapi & Tidak Teracak</strong>
            <p className="text-[11px] text-slate-700 leading-normal">
              File <strong>.xlsx</strong> standar resmi otomatis membuka setiap kolom pada selnya masing-masing. Tidak akan menumpuk menjadi satu teks panjang di Kolom A seperti pada CSV biasa.
            </p>
          </div>
          <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs">
            <strong className="text-amber-900 block mb-1">2. Angka NISN & NIP Terjaga</strong>
            <p className="text-[11px] text-slate-700 leading-normal">
              Dilengkapi format sel teks khusus. Angka 0 di awal NISN (contoh: <code>0098765432</code>) tidak hilang dan angka 18 digit NIP tidak berubah menjadi rumus ilmiah.
            </p>
          </div>
          <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs">
            <strong className="text-amber-900 block mb-1">3. Siap Dipakai di Excel & WPS Laptop</strong>
            <p className="text-[11px] text-slate-700 leading-normal">
              Tabel sudah memiliki garis border hitam, judul KOP resmi sekolah, dan nomor urut kolom <code>(1)(2)(3)</code> standar buku administrasi kurikulum merdeka.
            </p>
          </div>
        </div>
      </div>

      {/* PRATINJAU TABEL STANDAR RAPI (MODAL POP-UP) */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden border border-slate-300 flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Table size={20} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                    Pratinjau Format Tabel Standar
                  </span>
                  <h3 className="font-extrabold text-base text-white">
                    {previewTemplate.menuName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-white/70 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup (ESC)
              </button>
            </div>

            {/* Modal Body: Tabel Bergaris Rapi */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {/* Kop Rapor pada Tabel */}
              <div className="bg-white p-4 rounded-xl border border-slate-300 text-center shadow-2xs">
                <div className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">
                  {db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
                </div>
                <div className="text-sm font-black uppercase text-blue-900 tracking-wide mt-0.5">
                  {db.sekolah.namaSekolah || 'SD NEGERI BALIL'}
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  FORMAT TABEL RESMI: {previewTemplate.menuName.toUpperCase()}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Tahun Ajaran {db.sekolah.tahunPelajaran} • Kurikulum Merdeka
                </div>
              </div>

              {/* Keterangan Deskripsi */}
              <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <span>{previewTemplate.description}</span>
                <span className="text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {previewTemplate.columns.length} Kolom Standar
                </span>
              </div>

              {/* TABEL DENGAN GARIS TEGAS DAN KOLOM TERTATA */}
              {(() => {
                const previewRows = useActiveData ? getActiveDataRows(previewTemplate) : previewTemplate.sampleRows;
                return (
                  <div className="border-2 border-slate-400 rounded-xl overflow-x-auto shadow-md bg-white">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        {/* Baris Judul Kolom */}
                        <tr className="bg-blue-900 text-white font-extrabold text-[11px]">
                          <th className="py-3 px-3 text-center border border-slate-700 w-12 bg-blue-950">
                            NO
                          </th>
                          {previewTemplate.columns.map((col, idx) => (
                            <th
                              key={idx}
                              className="py-3 px-3.5 whitespace-nowrap border border-slate-700 text-center tracking-wide"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                        {/* Baris Nomor Urut Kolom (1) (2) (3) Standar Kemdikbud */}
                        <tr className="bg-blue-100 text-blue-950 font-bold text-[9px]">
                          <th className="py-1 px-2 text-center border border-slate-300 bg-blue-200">
                            (1)
                          </th>
                          {previewTemplate.columns.map((_, idx) => (
                            <th
                              key={idx}
                              className="py-1 px-2 text-center border border-slate-300"
                            >
                              ({idx + 2})
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 text-slate-800 font-mono text-[11px]">
                        {previewRows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 0 ? 'bg-white hover:bg-amber-50/50' : 'bg-slate-50/70 hover:bg-amber-50/50'}
                          >
                            <td className="py-2.5 px-3 font-bold text-center border border-slate-300 text-slate-700 bg-slate-100/60">
                              {rIdx + 1}
                            </td>
                            {row.map((val, cIdx) => (
                              <td
                                key={cIdx}
                                className="py-2.5 px-3.5 whitespace-nowrap border border-slate-300"
                              >
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer dengan Pilihan Unduh Lengkap */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-mono flex items-center gap-1.5">
                <FileSpreadsheet size={15} className="text-emerald-600" />
                <span>Nama File: <strong>{previewTemplate.fileNameExcel}</strong></span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => copyToClipboard(previewTemplate)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Copy size={13} className="inline mr-1 text-slate-500" /> Salin Tabel (Paste ke Excel)
                </button>

                <button
                  onClick={() => downloadCsvIndo(previewTemplate)}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Download size={13} className="inline mr-1" /> Unduh CSV (;)
                </button>

                <button
                  onClick={() => downloadExcel(previewTemplate)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={15} />
                  <span>Unduh Tabel Excel (.xlsx) Standar Rapi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HASIL IMPOR FILE TEMPLATE */}
      {importResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-5">
            <div className="text-center space-y-3">
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                  importResultModal.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}
              >
                {importResultModal.success ? <CheckCircle2 size={36} /> : <AlertCircle size={36} />}
              </div>
              <div>
                <span className={`text-[11px] font-black uppercase tracking-wider ${importResultModal.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {importResultModal.success ? 'Impor Berhasil Masuk Database' : 'Gagal Mengimpor File'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {importResultModal.templateName}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {importResultModal.message}
              </p>
              {importResultModal.success && importResultModal.importedCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <span>Total Data Masuk:</span>
                  <span className="font-mono text-sm font-extrabold">{importResultModal.importedCount} Data</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {importResultModal.success && (
                <button
                  onClick={() => {
                    const dest = getDestinationMenuKey(importResultModal.templateId);
                    setImportResultModal(null);
                    setActiveMenu(dest);
                  }}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buka Menu {importResultModal.templateName}</span>
                  <ArrowRight size={14} />
                </button>
              )}
              <button
                onClick={() => setImportResultModal(null)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup & Lanjut Impor/Expor Lainnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
