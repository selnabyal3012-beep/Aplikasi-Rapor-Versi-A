import React, { useState } from 'react';
import { Lock, User, UserPlus, LogIn, X, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAccount } from '../../types';

interface LoginRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const LoginRegisterModal: React.FC<LoginRegisterModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login'
}) => {
  const { login, registerUser, currentUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form states
  const [username, setUsername] = useState('SelNab');
  const [password, setPassword] = useState('1230');

  // Register form states
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNama, setRegNama] = useState('');
  const [regRole, setRegRole] = useState<'Administrator' | 'Wali Kelas' | 'Guru Mapel' | 'Kepala Sekolah'>('Wali Kelas');
  const [regNip, setRegNip] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = login(username, password);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!regUsername.trim() || !regPassword.trim() || !regNama.trim()) {
      setMessage({ text: 'Mohon lengkapi username, password, dan nama lengkap!', type: 'error' });
      return;
    }

    const newUser: UserAccount = {
      username: regUsername.trim(),
      password: regPassword,
      namaLengkap: regNama.trim(),
      role: regRole,
      nip: regNip.trim() || '-',
      createdAt: new Date().toISOString().slice(0, 10)
    };

    const res = registerUser(newUser);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setUsername(newUser.username);
      setPassword(newUser.password);
      setTimeout(() => {
        setMode('login');
        setMessage(null);
      }, 1000);
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Shield size={24} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === 'login' ? 'Masuk ke Aplikasi Rapor' : 'Daftar Akun Guru Baru'}
              </h2>
              <p className="text-xs text-emerald-200">SD NEGERI BALIL - KAB. PEGUNUNGAN BINTANG</p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setMode('login');
              setMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn size={15} /> Masuk Akun
          </button>
          <button
            onClick={() => {
              setMode('register');
              setMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus size={15} /> Daftar Akun Baru
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle size={16} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Akun Akses Default:</strong>
                <br />
                Username : <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">SelNab</code>
                <br />
                Password : <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">1230</code>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Username :</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: SelNab"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password :</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                <LogIn size={15} /> Masuk Sekarang
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={regNama}
                  onChange={(e) => setRegNama(e.target.value)}
                  placeholder="Contoh: Simon Kalakmabin, S.Pd."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Username :</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Username baru"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password :</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password baru"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Peran / Jabatan:</label>
                  <select
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Guru Mapel">Guru Mapel</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">NIP (Opsional):</label>
                  <input
                    type="text"
                    value={regNip}
                    onChange={(e) => setRegNip(e.target.value)}
                    placeholder="19XXXXXXXXXX atau -"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus size={15} /> Daftarkan Akun Baru
              </button>
            </form>
          )}

          {currentUser && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Sedang aktif: <strong>{currentUser.namaLengkap}</strong></span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-medium">{currentUser.role}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
