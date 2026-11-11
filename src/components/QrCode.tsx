import { useMemo } from 'react';
import { qrPfad } from '../lib/qr';

/** QR-Code auf weißem Grund mit Ruhezone – so lesen ihn auch ältere Handy-Kameras. */
export default function QrCode({ text, className = '' }: { text: string; className?: string }) {
  const { groesse, pfad } = useMemo(() => qrPfad(text), [text]);
  const rand = 3;
  return (
    <svg
      role="img" aria-label={`QR-Code: ${text}`} shapeRendering="crispEdges"
      viewBox={`${-rand} ${-rand} ${groesse + 2 * rand} ${groesse + 2 * rand}`}
      className={`bg-white rounded-lg ${className}`}
    >
      <rect x={-rand} y={-rand} width={groesse + 2 * rand} height={groesse + 2 * rand} fill="#fff" />
      <path d={pfad} fill="#0b0f17" />
    </svg>
  );
}
