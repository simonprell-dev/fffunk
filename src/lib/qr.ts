// QR-Code als SVG-Pfad (für Beitritts-Links der Gruppenübung).
import qrcode from 'qrcode-generator';

export function qrPfad(text: string): { groesse: number; pfad: string } {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let pfad = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!qr.isDark(y, x)) continue;
      let breite = 1;
      while (x + breite < n && qr.isDark(y, x + breite)) breite++;
      pfad += `M${x} ${y}h${breite}v1h-${breite}z`;
      x += breite - 1;
    }
  }
  return { groesse: n, pfad };
}
