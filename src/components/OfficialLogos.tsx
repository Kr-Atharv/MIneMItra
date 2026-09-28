import React from 'react';

// Official Coalguard / Minemitra Logo matching image.png (Hardhat with headlamp & crossed pickaxes)
export const CoalguardLogo: React.FC<{ className?: string; size?: number; color?: string }> = ({
  className = '',
  size = 44,
  color = '#004D40'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
    >
      {/* Pickaxe 1: Top-left to bottom-right */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor">
        {/* Handle */}
        <line x1="28" y1="36" x2="72" y2="82" stroke={color} strokeWidth="5.5" />
        <rect x="70" y="80" width="6" height="7" rx="1.5" transform="rotate(46 70 80)" fill={color} />
        {/* Pick head */}
        <path
          d="M 10 60 C 14 38, 30 22, 50 16 C 46 22, 42 28, 40 36 C 28 36, 18 46, 10 60 Z"
          fill={color}
        />
        {/* Handle collar */}
        <rect x="33" y="28" width="10" height="7" rx="2" transform="rotate(45 35 30)" fill="#1B5E20" stroke={color} strokeWidth="1" />
      </g>

      {/* Pickaxe 2: Top-right to bottom-left */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor">
        {/* Handle */}
        <line x1="72" y1="36" x2="28" y2="82" stroke={color} strokeWidth="5.5" />
        <rect x="25" y="84" width="6" height="7" rx="1.5" transform="rotate(-46 25 84)" fill={color} />
        {/* Pick head */}
        <path
          d="M 90 60 C 86 38, 70 22, 50 16 C 54 22, 58 28, 60 36 C 72 36, 82 46, 90 60 Z"
          fill={color}
        />
        {/* Handle collar */}
        <rect x="58" y="28" width="10" height="7" rx="2" transform="rotate(-45 60 30)" fill="#1B5E20" stroke={color} strokeWidth="1" />
      </g>

      {/* Miners Helmet (Centered foreground) */}
      <g>
        {/* Helmet Crown */}
        <path
          d="M 28 65 C 28 43, 38 38, 50 38 C 62 38, 72 43, 72 65 Z"
          fill={color}
        />
        {/* Inner helmet ridge */}
        <path
          d="M 33 63 C 34 48, 42 43, 50 43 C 58 43, 66 48, 67 63 Z"
          fill="#0a3d34"
        />
        {/* Helmet Rim / Brim */}
        <path
          d="M 22 66 C 22 63, 78 63, 78 66 C 78 72, 22 72, 22 66 Z"
          fill={color}
          stroke="#002d25"
          strokeWidth="1.5"
        />
        <rect x="24" y="68" width="52" height="4" rx="2" fill="#00241e" />

        {/* Headlamp Bracket */}
        <rect x="44" y="38" width="12" height="16" rx="2" fill="#2d3748" />
        <line x1="45" y1="42" x2="55" y2="42" stroke="#4a5568" strokeWidth="1.5" />
        
        {/* Mining Headlamp (Circular housing) */}
        <circle cx="50" cy="55" r="9" fill="#1A202C" stroke="#F1F5F9" strokeWidth="2.5" />
        <circle cx="50" cy="55" r="6.5" fill="#E2E8F0" />
        <circle cx="50" cy="55" r="4.5" fill="#FEF08A" />
        {/* Lamp beam reflection */}
        <circle cx="48" cy="53" r="2" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

// National Emblem of India (Ashoka Lion Capital)
export const IndiaEmblem: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
    >
      {/* 3 Lions representation in gold/slate official styling */}
      <g fill="#B45309" stroke="#78350F" strokeWidth="1">
        {/* Center Lion Head */}
        <path d="M 42 16 C 42 10, 58 10, 58 16 C 63 17, 65 24, 60 28 C 62 33, 58 38, 50 39 C 42 38, 38 33, 40 28 C 35 24, 37 17, 42 16 Z" />
        {/* Center Lion Face Details */}
        <circle cx="47" cy="22" r="1.5" fill="#78350F" />
        <circle cx="53" cy="22" r="1.5" fill="#78350F" />
        <path d="M 48 26 L 52 26 L 50 29 Z" fill="#78350F" />

        {/* Left Lion Head */}
        <path d="M 28 20 C 31 16, 38 18, 41 22 C 40 28, 36 34, 30 36 C 26 33, 24 25, 28 20 Z" />
        
        {/* Right Lion Head */}
        <path d="M 72 20 C 69 16, 62 18, 59 22 C 60 28, 64 34, 70 36 C 74 33, 76 25, 72 20 Z" />

        {/* Lion Chests / Mane */}
        <path d="M 33 37 C 35 48, 42 55, 50 56 C 58 55, 65 48, 67 37 C 62 40, 50 42, 33 37 Z" />
        <path d="M 42 42 L 50 54 L 58 42 Z" fill="#92400E" />

        {/* Abacus / Base Platform */}
        <rect x="20" y="58" width="60" height="12" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        
        {/* Ashoka Chakra in Center of Abacus */}
        <circle cx="50" cy="64" r="5" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="50" cy="64" r="1.5" fill="#FFFFFF" />
        
        {/* Bull on Right, Horse on Left */}
        <circle cx="32" cy="64" r="2.5" fill="#78350F" />
        <circle cx="68" cy="64" r="2.5" fill="#78350F" />

        {/* Bell Capital / Lotus Base */}
        <path d="M 24 72 C 28 84, 72 84, 76 72 Z" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
        <path d="M 32 73 C 35 80, 65 80, 68 73 Z" fill="#92400E" />
      </g>

      {/* Motto "सत्यमेव जयते" (Satyameva Jayate) */}
      <text
        x="50"
        y="96"
        fontSize="8"
        fontWeight="bold"
        fill="#1E293B"
        textAnchor="middle"
        fontFamily="serif"
      >
        सत्यमेव जयते
      </text>
      <text
        x="50"
        y="107"
        fontSize="6.5"
        fontWeight="600"
        fill="#475569"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        GOVT. OF INDIA
      </text>
    </svg>
  );
};

// DGMS Official Oversight Seal Badge
export const DGMSBadge: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 38
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
    >
      <circle cx="50" cy="50" r="47" fill="#004D40" stroke="#F59E0B" strokeWidth="3" />
      <circle cx="50" cy="50" r="41" fill="#00382E" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 2" />
      
      {/* Cog wheel outer ring */}
      <circle cx="50" cy="50" r="30" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 4" />
      
      {/* Safety Lamp / Davy Lamp Motif */}
      <path d="M 44 32 L 56 32 L 54 56 L 46 56 Z" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1.5" />
      {/* Flame */}
      <path d="M 50 40 C 48 45, 48 50, 50 53 C 52 50, 52 45, 50 40 Z" fill="#EF4444" />
      <rect x="42" y="56" width="16" height="12" rx="2" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
      <rect x="45" y="27" width="10" height="5" rx="1.5" fill="#E2E8F0" />
      <path d="M 50 22 L 50 27" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

      {/* DGMS lettering in arc */}
      <text x="50" y="80" fill="#FFFFFF" fontSize="9" fontWeight="800" textAnchor="middle" letterSpacing="1">
        DGMS
      </text>
      <text x="50" y="89" fill="#94A3B8" fontSize="5.5" fontWeight="600" textAnchor="middle">
        CMR 2017
      </text>
    </svg>
  );
};
