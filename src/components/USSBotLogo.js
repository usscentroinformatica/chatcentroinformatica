import React from "react";

// SVG de un robot simple con las iniciales USS en el pecho
export default function USSBotLogo({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cabeza */}
      <rect x="18" y="8" width="28" height="20" rx="8" fill="#00c2cb" stroke="#0057b8" strokeWidth="2" />
      {/* Antenas */}
      <rect x="30" y="2" width="4" height="8" rx="2" fill="#0057b8" />
      <circle cx="32" cy="2" r="2" fill="#eebbc3" />
      {/* Ojos */}
      <circle cx="26" cy="18" r="2.5" fill="#232946" />
      <circle cx="38" cy="18" r="2.5" fill="#232946" />
      {/* Cuerpo */}
      <rect x="14" y="28" width="36" height="22" rx="10" fill="#eebbc3" stroke="#0057b8" strokeWidth="2" />
      {/* Letras USS */}
      <text x="32" y="44" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontWeight="bold" fontSize="12" fill="#0057b8">USS</text>
      {/* Brazos */}
      <rect x="6" y="32" width="8" height="16" rx="4" fill="#00c2cb" stroke="#0057b8" strokeWidth="1.5" />
      <rect x="50" y="32" width="8" height="16" rx="4" fill="#00c2cb" stroke="#0057b8" strokeWidth="1.5" />
      {/* Piernas */}
      <rect x="22" y="50" width="6" height="10" rx="3" fill="#0057b8" />
      <rect x="36" y="50" width="6" height="10" rx="3" fill="#0057b8" />
    </svg>
  );
}
