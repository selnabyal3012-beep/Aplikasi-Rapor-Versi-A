import React from 'react';

interface LogoProps {
  url?: string;
  className?: string;
  size?: number;
  label?: string;
}

/**
 * Komponen Lambang / Logo Kabupaten (Logo Kiri Pemda)
 * Jika pengguna mengunggah foto logoKiriUrl, maka gambar tersebut yang ditampilkan.
 * Jika belum, ditampilkan emblem resmi Pemda Kabupaten Pegunungan Bintang / Papua berbentuk SVG elegan.
 */
export const LogoKabupaten: React.FC<LogoProps> = ({
  url,
  className = 'w-16 h-16 sm:w-20 sm:h-20',
  size = 72,
  label = 'PEMKAB PEGUNUNGAN BINTANG'
}) => {
  if (url && url.trim().length > 0) {
    return (
      <img
        src={url}
        alt={label}
        className={`${className} object-contain mx-auto block`}
        style={{ maxHeight: size, maxWidth: size }}
      />
    );
  }

  // Emblem Vektor Elegan Pemda Kabupaten
  return (
    <div
      className={`${className} mx-auto flex items-center justify-center shrink-0 text-center`}
      title={label}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs mx-auto block"
      >
        {/* Perisai Luar Emas & Navy */}
        <path
          d="M50 5 L88 20 C88 58 72 82 50 95 C28 82 12 58 12 20 Z"
          fill="#1E3A8A"
          stroke="#D97706"
          strokeWidth="3.5"
        />
        {/* Perisai Dalam */}
        <path
          d="M50 11 L82 24 C82 55 68 76 50 88 C32 76 18 55 18 24 Z"
          fill="#1E40AF"
          stroke="#FDE68A"
          strokeWidth="1.5"
        />
        {/* Pegunungan Bintang (Gunung Salju & Puncak Papua) */}
        <path
          d="M26 62 L42 42 L52 54 L62 38 L74 62 Z"
          fill="#059669"
          stroke="#10B981"
          strokeWidth="1"
        />
        <path
          d="M42 42 L47 48 L37 48 Z"
          fill="#FFFFFF"
        />
        <path
          d="M62 38 L67 45 L57 45 Z"
          fill="#FFFFFF"
        />
        {/* Bintang Emas Bersegi Lima */}
        <polygon
          points="50,18 53,27 62,27 55,32 58,41 50,36 42,41 45,32 38,27 47,27"
          fill="#FBBF24"
          stroke="#B45309"
          strokeWidth="0.8"
        />
        {/* Padi dan Kapas Lingkar Bawah */}
        <path
          d="M30 68 C40 76 60 76 70 68"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Pita Bawah */}
        <path
          d="M24 78 Q50 85 76 78 L72 83 Q50 90 28 83 Z"
          fill="#DC2626"
          stroke="#FEF08A"
          strokeWidth="0.8"
        />
        <text
          x="50"
          y="82"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="4"
          fontWeight="900"
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          KAB. PEG. BINTANG
        </text>
      </svg>
    </div>
  );
};

/**
 * Komponen Lambang / Logo Tut Wuri Handayani (Logo Kanan Kementerian / Sekolah)
 * Jika pengguna mengunggah foto logoKananUrl, maka gambar tersebut yang ditampilkan.
 * Jika belum, ditampilkan lambang resmi Tut Wuri Handayani Kementerian Pendidikan berbentuk SVG asli.
 */
export const LogoTutWuriHandayani: React.FC<LogoProps> = ({
  url,
  className = 'w-16 h-16 sm:w-20 sm:h-20',
  size = 72,
  label = 'TUT WURI HANDAYANI'
}) => {
  if (url && url.trim().length > 0) {
    return (
      <img
        src={url}
        alt={label}
        className={`${className} object-contain mx-auto block`}
        style={{ maxHeight: size, maxWidth: size }}
      />
    );
  }

  // Lambang Resmi Tut Wuri Handayani (Segi Lima, Belencong/Api, Sayap Garuda, Buku Terbuka)
  return (
    <div
      className={`${className} mx-auto flex items-center justify-center shrink-0 text-center`}
      title={label}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs mx-auto block"
      >
        {/* Segi Lima Biru Khas Tut Wuri Handayani */}
        <polygon
          points="50,6 92,36 76,88 24,88 8,36"
          fill="#0284C7"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <polygon
          points="50,9 89,37 74,85 26,85 11,37"
          fill="#0369A1"
          stroke="#FDE047"
          strokeWidth="1.5"
        />
        {/* Sayap Garuda / Sayap Pendidikan Emas */}
        <path
          d="M50 38 C38 34 26 44 24 58 C32 60 42 56 48 50 Z"
          fill="#F59E0B"
          stroke="#B45309"
          strokeWidth="0.8"
        />
        <path
          d="M50 38 C62 34 74 44 76 58 C68 60 58 56 52 50 Z"
          fill="#F59E0B"
          stroke="#B45309"
          strokeWidth="0.8"
        />
        {/* Buku Terbuka (Sumber Ilmu Pengetahuan) Putih */}
        <path
          d="M26 62 Q50 67 50 74 Q50 67 74 62 L74 72 Q50 77 50 82 Q50 77 26 72 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="1"
        />
        {/* Belencong / Api Menyala Merah-Oranye (Penerang Belajar) */}
        <path
          d="M50 20 C46 27 44 32 46 38 C48 42 52 42 54 38 C56 32 54 27 50 20 Z"
          fill="#EF4444"
          stroke="#FEF08A"
          strokeWidth="0.8"
        />
        <circle cx="50" cy="34" r="3.5" fill="#FBBF24" />
        {/* Pita & Teks Tut Wuri Handayani */}
        <path
          d="M22 84 Q50 91 78 84 L76 90 Q50 96 24 90 Z"
          fill="#FFFFFF"
          stroke="#0284C7"
          strokeWidth="0.8"
        />
        <text
          x="50"
          y="88.5"
          textAnchor="middle"
          fill="#0369A1"
          fontSize="4.2"
          fontWeight="900"
          fontFamily="sans-serif"
          letterSpacing="0.4"
        >
          TUT WURI HANDAYANI
        </text>
      </svg>
    </div>
  );
};
