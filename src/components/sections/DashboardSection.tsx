import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Printer,
  Sparkles,
  School,
  Database,
  ArrowRight,
  TrendingUp,
  MapPin,
  Compass,
  Laptop,
  Wifi,
  WifiOff,
  Download,
  ShieldCheck,
  UserCheck,
  Heart,
  Sun,
  MoonStar,
  Church,
  Flame,
  Award,
  Save,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePWA } from '../../hooks/usePWA';
import { InstallPcModal } from '../modals/InstallPcModal';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';

export const DashboardSection: React.FC = () => {
  const {
    db,
    selectedKelas,
    selectedSemester,
    selectedFase,
    setActiveMenu,
    setPrintTargetStudentId,
    syncAllData,
    saveAllData,
    globalSaveStatus,
    lastSavedTime
  } = useApp();
  const { isOnline, isInstallable, isInstalled, triggerInstall } = usePWA();
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Tab filter for demographic statistics: 'kelas' vs 'sekolah'
  const [demografiScope, setDemografiScope] = useState<'kelas' | 'sekolah'>('kelas');

  // Active dataset based on scope
  const siswaData = demografiScope === 'kelas'
    ? db.siswa.filter((s) => s.kelas === selectedKelas)
    : db.siswa;

  const totalSiswaScope = siswaData.length;

  // Gender counts
  const totalLaki = siswaData.filter((s) => s.jenisKelamin === 'L').length;
  const totalPerempuan = siswaData.filter((s) => s.jenisKelamin === 'P').length;
  const persenLaki = totalSiswaScope > 0 ? Math.round((totalLaki / totalSiswaScope) * 100) : 0;
  const persenPerempuan = totalSiswaScope > 0 ? Math.round((totalPerempuan / totalSiswaScope) * 100) : 0;

  // 6 Religions breakdown
  const religionsList = [
    {
      key: 'Islam',
      label: 'Islam',
      alias: 'Islam',
      color: 'emerald',
      bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      barColor: 'bg-emerald-500',
      icon: <MoonStar size={16} className="text-emerald-600" />
    },
    {
      key: 'Katolik',
      label: 'Katolik',
      alias: 'Katolik',
      color: 'amber',
      bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeColor: 'bg-amber-600 text-white',
      barColor: 'bg-amber-500',
      icon: <Church size={16} className="text-amber-600" />
    },
    {
      key: 'Kristen',
      label: 'Kristen',
      alias: 'Kristen (Protestan)',
      color: 'blue',
      bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
      badgeColor: 'bg-blue-600 text-white',
      barColor: 'bg-blue-500',
      icon: <Church size={16} className="text-blue-600" />
    },
    {
      key: 'Hindu',
      label: 'Hindu',
      alias: 'Hindu (Indhu)',
      color: 'orange',
      bgColor: 'bg-orange-50 text-orange-800 border-orange-200',
      badgeColor: 'bg-orange-600 text-white',
      barColor: 'bg-orange-500',
      icon: <Flame size={16} className="text-orange-600" />
    },
    {
      key: 'Buddha',
      label: 'Buddha',
      alias: 'Buddha (Budah)',
      color: 'teal',
      bgColor: 'bg-teal-50 text-teal-800 border-teal-200',
      badgeColor: 'bg-teal-600 text-white',
      barColor: 'bg-teal-500',
      icon: <Sun size={16} className="text-teal-600" />
    },
    {
      key: 'Konghucu',
      label: 'Konghucu',
      alias: 'Konghucu (Kongucu)',
      color: 'rose',
      bgColor: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeColor: 'bg-rose-600 text-white',
      barColor: 'bg-rose-500',
      icon: <Award size={16} className="text-rose-600" />
    }
  ] as const;

  const religionStats = religionsList.map((rel) => {
    const studentsWithRel = siswaData.filter((s) => s.agama === rel.key);
    const count = studentsWithRel.length;
    const lCount = studentsWithRel.filter((s) => s.jenisKelamin === 'L').length;
    const pCount = studentsWithRel.filter((s) => s.jenisKelamin === 'P').length;
    const percent = totalSiswaScope > 0 ? Math.round((count / totalSiswaScope) * 100) : 0;
    return {
      ...rel,
      count,
      lCount,
      pCount,
      percent
    };
  });

  // Calculate completion percentage for academic scores
  const siswaKelas = db.siswa.filter((s) => s.kelas === selectedKelas);
  const totalSiswaKelas = siswaKelas.length;
  const totalMapel = db.mataPelajaran.length;
  const targetScores = totalSiswaKelas * totalMapel;
  const currentScores = db.nilaiAkademik.filter((n) => n.kelas === selectedKelas && n.semester === selectedSemester).length;
  const scorePercent = targetScores > 0 ? Math.min(100, Math.round((currentScores / targetScores) * 100)) : 0;

  // Calculate P5 project status
  const p5ProjekKelas = db.p5Projek.filter((p) => p.kelas === selectedKelas);
  const p5ScoresCount = db.p5Nilai.filter((p) => p.kelas === selectedKelas && p.semester === selectedSemester).length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <GraduationCap size={240} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/30">
            <School size={14} /> {db.sekolah.namaSekolah} • NPSN {db.sekolah.npsn}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Aplikasi Rapor Kurikulum Merdeka
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed mb-4">
            Tahun Pelajaran <strong>{db.sekolah.tahunPelajaran}</strong> ({selectedSemester}). Selamat datang di sistem penilaian dan pengolahan rapor terpadu untuk Kelas <strong>{selectedKelas}</strong> (Fase {selectedFase}) SD Negeri Balil, Oksibil, Kabupaten Pegunungan Bintang.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => setActiveMenu('input_nilai')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Input Nilai Akademik
            </button>
            <button
              onClick={() => setActiveMenu('rapor_akademik')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all border border-white/20 cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Lihat Rapor Siswa
            </button>
            <button
              onClick={() => setActiveMenu('cetak_rapor')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Printer size={15} /> Cetak Rapor
            </button>
            <button
              onClick={() => syncAllData()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer border border-amber-300"
              title="Hubungkan semua data: Sekolah, Siswa, Agama, Nilai, Rapor, Kepala Sekolah, Wali Kelas"
            >
              <Zap size={15} className="text-slate-950" /> Hubungkan Semua Data
            </button>
            <div className="inline-flex items-center gap-2">
              <button
                onClick={saveAllData}
                disabled={globalSaveStatus === 'saving'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer border border-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Simpan seluruh data ke database lokal"
              >
                <Save size={15} /> Simpan Semua Data
              </button>
              <SaveStatusIndicator
                status={globalSaveStatus}
                lastSavedText={lastSavedTime}
              />
            </div>
            <button
              onClick={() => setActiveMenu('buku_panduan')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer ring-2 ring-indigo-400/30"
            >
              <BookOpen size={15} /> Buku Panduan Lengkap
            </button>
            <button
              onClick={() => setShowInstallModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Laptop size={15} /> Pasang di Laptop (Offline)
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Offline & Online Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-indigo-800/50 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shrink-0">
              <Laptop size={26} className="text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                  Aplikasi Rapor Siap Digunakan Tanpa Internet (Mode Offline di Laptop)
                </span>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <Wifi size={11} /> Jaringan: ONLINE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                    <WifiOff size={11} /> Jaringan: OFFLINE (Aktif Siap Pakai)
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-300">
                  <ShieldCheck size={11} className="text-sky-300" /> Data Tersimpan di Laptop
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                Bapak/Ibu Guru dapat memasang (menginstal) aplikasi rapor ini langsung ke komputer atau laptop. Setelah terpasang, aplikasi dapat dibuka dari ikon desktop kapan saja, <strong>sepenuhnya tanpa kuota atau sinyal internet</strong> di ruang kelas SD Negeri Balil.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowInstallModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md hover:scale-105 cursor-pointer"
            >
              <Download size={15} />
              <span>PASANG / INSTAL DI LAPTOP</span>
            </button>
            <button
              onClick={() => setShowInstallModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              <WifiOff size={14} className="text-amber-400" />
              <span>Panduan Offline</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Siswa Kelas {selectedKelas}</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{totalSiswaKelas}</span>
            <span className="text-xs text-slate-500">dari total {db.siswa.length} siswa</span>
          </div>
          <div className="mt-3 text-[11px] text-blue-600 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Fase {selectedFase}</span>
            <button onClick={() => setActiveMenu('data_siswa')} className="hover:underline flex items-center gap-1 cursor-pointer">
              Kelola Siswa <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mata Pelajaran</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{totalMapel}</span>
            <span className="text-xs text-slate-500">Mapel Aktif</span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-600 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
            <span>{db.tujuanPembelajaran.length} Tujuan Belajar (TP)</span>
            <button onClick={() => setActiveMenu('mata_pelajaran')} className="hover:underline flex items-center gap-1 cursor-pointer">
              Lihat Mapel <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Projek P5 Aktif</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Compass size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{p5ProjekKelas.length}</span>
            <span className="text-xs text-slate-500">Tema Projek</span>
          </div>
          <div className="mt-3 text-[11px] text-amber-600 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
            <span>{p5ScoresCount} Penilaian Masuk</span>
            <button onClick={() => setActiveMenu('p5_projek')} className="hover:underline flex items-center gap-1 cursor-pointer">
              Kelola P5 <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tenaga Pendidik</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{db.guru.length}</span>
            <span className="text-xs text-slate-500">Guru & Staf</span>
          </div>
          <div className="mt-3 text-[11px] text-purple-600 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
            <span>PNS, PPPK & Honorer</span>
            <button onClick={() => setActiveMenu('data_guru')} className="hover:underline flex items-center gap-1 cursor-pointer">
              Daftar Guru <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* REKAPITULASI DEMOGRAFI SISWA: LAKI-LAKI, PEREMPUAN & 6 AGAMA */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Users size={20} />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                  Rekapitulasi Demografi Siswa: Jenis Kelamin & 6 Agama
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rincian jumlah siswa Laki-laki, Perempuan serta Agama (Islam, Katolik, Kristen, Hindu, Buddha, Konghucu).
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Scope: Kelas Terpilih vs Seluruh Sekolah */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setDemografiScope('kelas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                demografiScope === 'kelas'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelas {selectedKelas} ({siswaKelas.length} Siswa)
            </button>
            <button
              onClick={() => setDemografiScope('sekolah')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                demografiScope === 'sekolah'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seluruh Sekolah ({db.siswa.length} Siswa)
            </button>
          </div>
        </div>

        {/* 1. BAGIAN JENIS KELAMIN: LAKI-LAKI & PEREMPUAN */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <UserCheck size={15} className="text-blue-600" />
              1. Jumlah Siswa Berdasarkan Jenis Kelamin ({demografiScope === 'kelas' ? `Kelas ${selectedKelas}` : 'Semua Kelas'})
            </h4>
            <span className="text-xs font-bold text-slate-700">
              Total: {totalSiswaScope} Siswa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Laki-laki Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Laki-laki (L)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-blue-900">{totalLaki}</span>
                  <span className="text-xs font-bold text-blue-700">Siswa ({persenLaki}%)</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {totalLaki} dari {totalSiswaScope} total peserta didik
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                👨‍🎓
              </div>
            </div>

            {/* Perempuan Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50/50 border border-pink-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                  Perempuan (P)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-rose-900">{totalPerempuan}</span>
                  <span className="text-xs font-bold text-rose-700">Siswa ({persenPerempuan}%)</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {totalPerempuan} dari {totalSiswaScope} total peserta didik
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                👩‍🎓
              </div>
            </div>

            {/* Total & Rasio Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Rasio Perbandingan L / P
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-800">{totalLaki} L : {totalPerempuan} P</span>
                </div>
              </div>
              {/* Ratio Bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                  <div
                    style={{ width: `${persenLaki}%` }}
                    className="bg-blue-600 h-full transition-all duration-500"
                    title={`Laki-laki: ${totalLaki} (${persenLaki}%)`}
                  ></div>
                  <div
                    style={{ width: `${persenPerempuan}%` }}
                    className="bg-pink-500 h-full transition-all duration-500"
                    title={`Perempuan: ${totalPerempuan} (${persenPerempuan}%)`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-1">
                  <span className="text-blue-700">L: {persenLaki}%</span>
                  <span className="text-pink-600">P: {persenPerempuan}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BAGIAN JUMLAH 6 AGAMA: ISLAM, KATOLIK, KRISTEN, HINDU, BUDDHA, KONGHUCU */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              2. Jumlah Siswa Berdasarkan Agama (6 Agama Resmi)
            </h4>
            <span className="text-[11px] text-slate-500">
              Cakupan: {demografiScope === 'kelas' ? `Kelas ${selectedKelas}` : 'Semua Kelas (I - VI)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {religionStats.map((item) => (
              <div
                key={item.key}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md ${item.bgColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      {item.icon} {item.label}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor}`}>
                      {item.percent}%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-2xl font-black">{item.count}</span>
                    <span className="text-xs font-semibold opacity-90">Siswa</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-black/10 text-[10px] font-medium flex justify-between">
                  <span>L: <strong>{item.lCount}</strong></span>
                  <span>P: <strong>{item.pCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. TABEL MATRIKS SILANG (JENIS KELAMIN X AGAMA) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Database size={14} className="text-indigo-600" />
              Tabel Matriks Silang: Jenis Kelamin x Agama Siswa
            </h4>
            <button
              onClick={() => setActiveMenu('data_siswa')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
            >
              Kelola & Tambah Siswa &rarr;
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-bold">No</th>
                  <th className="py-2.5 px-3 font-bold">Agama</th>
                  <th className="py-2.5 px-3 font-bold text-center text-blue-700 bg-blue-50/50">Laki-laki (L)</th>
                  <th className="py-2.5 px-3 font-bold text-center text-pink-700 bg-pink-50/50">Perempuan (P)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Jumlah Total</th>
                  <th className="py-2.5 px-3 font-bold text-center">Persentase</th>
                  <th className="py-2.5 px-3 font-bold">Visual Proporsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {religionStats.map((item, idx) => (
                  <tr key={item.key} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                      {item.icon}
                      <span>{item.alias}</span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-blue-800 bg-blue-50/30">
                      {item.lCount}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-pink-800 bg-pink-50/30">
                      {item.pCount}
                    </td>
                    <td className="py-2 px-3 text-center font-black text-slate-800">
                      {item.count} siswa
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-600">
                      {item.percent}%
                    </td>
                    <td className="py-2 px-3 w-40">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${item.barColor}`}
                          style={{ width: `${item.percent}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-800">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 uppercase text-slate-700">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-900 bg-blue-100/50">
                    {totalLaki}
                  </td>
                  <td className="py-2.5 px-3 text-center text-pink-900 bg-pink-100/50">
                    {totalPerempuan}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-indigo-900">
                    {totalSiswaScope} siswa
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    100%
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500 font-normal">
                    {demografiScope === 'kelas' ? `Kelas ${selectedKelas}` : 'Semua Kelas'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Progress & Quick Student Action Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress Pengisian Nilai & Profil Sekolah */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                  Status Kelengkapan Nilai Akademik Kelas {selectedKelas}
                </h3>
                <p className="text-xs text-slate-500">
                  Semester {selectedSemester} • Tahun Ajaran {db.sekolah.tahunPelajaran}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {scorePercent}% Lengkap
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${scorePercent}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2 border-t border-slate-100">
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tercatat</span>
                <span className="font-bold text-slate-700 text-sm">{currentScores}</span>
                <span className="text-[10px] text-slate-500 block">data nilai</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target</span>
                <span className="font-bold text-slate-700 text-sm">{targetScores}</span>
                <span className="text-[10px] text-slate-500 block">siswa x mapel</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kurang</span>
                <span className="font-bold text-amber-600 text-sm">{Math.max(0, targetScores - currentScores)}</span>
                <span className="text-[10px] text-slate-500 block">data belum diisi</span>
              </div>
            </div>
          </div>

          {/* Quick List Siswa Kelas Ini */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Daftar Siswa Kelas {selectedKelas} (Fase {selectedFase})
              </h3>
              <button
                onClick={() => setActiveMenu('data_siswa')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                Lihat Semua ({siswaKelas.length} Siswa) &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                  <tr>
                    <th className="py-2 px-3">NISN</th>
                    <th className="py-2 px-3">Nama Siswa</th>
                    <th className="py-2 px-3">L/P</th>
                    <th className="py-2 px-3">Agama</th>
                    <th className="py-2 px-3">Status Rapor</th>
                    <th className="py-2 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {siswaKelas.slice(0, 8).map((s) => {
                    const studentScores = db.nilaiAkademik.filter((n) => n.nisn === s.nisn && n.semester === selectedSemester);
                    const isComplete = studentScores.length >= totalMapel;
                    return (
                      <tr key={s.idSiswa} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {(s.nisn && !s.nisn.startsWith('BLM_') && s.nisn !== '-') ? s.nisn : '-'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{s.namaSiswa}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {s.jenisKelamin}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                            {s.agama}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {isComplete ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <CheckCircle size={13} className="text-emerald-600" /> Nilai Siap
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                              <Clock size={13} className="text-amber-500" /> {studentScores.length}/{totalMapel} mapel
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setPrintTargetStudentId(s.idSiswa);
                              setActiveMenu('rapor_akademik');
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Buka Rapor
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Profil Satuan Pendidikan & Alur */}
        <div className="space-y-6">
          {/* Identity Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <MapPin size={15} /> Lokasi Satuan Pendidikan
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white">{db.sekolah.namaSekolah}</h4>
              <p className="text-xs text-slate-300 mt-0.5">{db.sekolah.alamat}</p>
            </div>
            <div className="text-xs space-y-1 text-slate-300 pt-1 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Distrik:</span>
                <span className="font-medium text-white">{db.sekolah.distrikKecamatan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kabupaten:</span>
                <span className="font-medium text-white">{db.sekolah.kabupaten}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Provinsi:</span>
                <span className="font-medium text-white">{db.sekolah.provinsi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kepala Sekolah:</span>
                <span className="font-medium text-white">{db.sekolah.namaKepalaSekolah}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveMenu('identitas_sekolah')}
              className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Ubah Data Identitas Sekolah
            </button>
          </div>

          {/* Flow Alur Penggunaan Aplikasi */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" /> Alur Kerja Pengisian Rapor
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Template Data Semua Menu (Excel/CSV)', menu: 'template_data' as const },
                { label: 'Identitas Sekolah & Guru', menu: 'identitas_sekolah' as const },
                { label: 'Data Siswa & Kelas', menu: 'data_siswa' as const },
                { label: 'Tujuan Pembelajaran (TP)', menu: 'tujuan_pembelajaran' as const },
                { label: 'Input Nilai Akademik Siswa', menu: 'input_nilai' as const },
                { label: 'Rapor PTS (Tengah Semester)', menu: 'rapor_pts' as const },
                { label: 'Kehadiran, Ekskul & Catatan', menu: 'kehadiran' as const },
                { label: 'Penilaian Projek P5', menu: 'p5_nilai' as const },
                { label: 'Piagam Penghargaan Juara', menu: 'piagam' as const },
                { label: 'Cetak & Ekspor Rapor (PDF)', menu: 'cetak_rapor' as const },
                { label: 'Cadangkan (Backup) Database', menu: 'backup_restore' as const }
              ].map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMenu(step.menu)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                    <span className="font-medium">{step.label}</span>
                  </div>
                  <ArrowRight size={12} className="text-slate-400 group-hover:text-emerald-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Instal PC */}
      <InstallPcModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
};
