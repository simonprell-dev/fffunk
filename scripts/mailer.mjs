// E-Mail-Versand für die Anmeldung (SMTP, z. B. IONOS). Ohne Zugangsdaten wird nichts verschickt.
//   SMTP_HOST (Standard smtp.ionos.de), SMTP_PORT (Standard 587; 465 = TLS von Anfang an),
//   SMTP_USER, SMTP_PASS, MAIL_FROM (Standard: SMTP_USER)
import nodemailer from 'nodemailer';

let transport = null;

export function istMailEingerichtet() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ionos.de',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

export function logMailConfig() {
  console.log(`E-Mail (Anmeldung): ${istMailEingerichtet()
    ? `${process.env.SMTP_HOST || 'smtp.ionos.de'} als ${process.env.MAIL_FROM || process.env.SMTP_USER}`
    : 'nicht eingerichtet – Anmeldecodes stehen nur im Server-Log (SMTP_USER/SMTP_PASS setzen)'}`);
}

/** Verschickt den Anmeldecode. Liefert false, wenn kein Versand eingerichtet ist. */
export async function sendeLoginCode(email, code, link) {
  if (!istMailEingerichtet()) {
    console.log(`[Anmeldung] Code für ${email}: ${code}`);
    return false;
  }
  await getTransport().sendMail({
    from: `FFFunk <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `${code} ist dein FFFunk-Anmeldecode`,
    text: [
      `Dein Anmeldecode für FFFunk: ${code}`,
      '',
      'Gib ihn in der App ein oder öffne diesen Link auf dem Gerät, auf dem du dich anmelden willst:',
      link,
      '',
      'Der Code gilt 15 Minuten. Hast du keine Anmeldung angefordert, kannst du diese E-Mail ignorieren.',
    ].join('\n'),
  });
  return true;
}
