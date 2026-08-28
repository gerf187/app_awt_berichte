/**
 * Erzeugt einen neutralen Beispiel-Briefbogen („Musterfirma GmbH") als PNG
 * und als zweiseitige PDF.
 *
 * Wozu: Anleitung und Tests brauchen einen Briefbogen zum Vorzeigen. Der echte
 * Firmenbriefbogen darf dafür nicht ins Repository – er ist Firmenmaterial und
 * trägt Namen und Durchwahlen von Mitarbeitern (siehe DATENSCHUTZ.md).
 *
 *   node scripts/beispielBriefbogen.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { jsPDF } from 'jspdf'

const HIER = dirname(fileURLToPath(import.meta.url))
const ZIEL = join(HIER, '..', 'dokumentation', 'beispiel')

/** A4 bei 150 dpi. */
const BREITE = 1240
const HOEHE = 1754

const GELB = '#FFC400'
const SCHWARZ = '#1A1A1A'
const GRAU = '#6B7280'

function briefbogenSvg({ mitKopf }) {
  const kopf = mitKopf
    ? `
    <rect x="120" y="110" width="150" height="110" fill="${GELB}"/>
    <text x="140" y="185" font-family="Helvetica, Arial" font-size="46" font-weight="bold" fill="${SCHWARZ}">MF</text>
    <text x="300" y="165" font-family="Helvetica, Arial" font-size="40" font-weight="bold" fill="${SCHWARZ}">Musterfirma GmbH</text>
    <text x="300" y="205" font-family="Helvetica, Arial" font-size="24" fill="${GRAU}">Bautechnik und Anwendungstechnik</text>

    <text x="1120" y="140" text-anchor="end" font-family="Helvetica, Arial" font-size="22" fill="${GRAU}">Musterstraße 1</text>
    <text x="1120" y="172" text-anchor="end" font-family="Helvetica, Arial" font-size="22" fill="${GRAU}">12345 Musterstadt</text>
    <text x="1120" y="204" text-anchor="end" font-family="Helvetica, Arial" font-size="22" fill="${GRAU}">Telefon 01234 567-0</text>
    <rect x="120" y="255" width="1000" height="6" fill="${GELB}"/>`
    : `
    <rect x="120" y="120" width="70" height="52" fill="${GELB}"/>
    <text x="130" y="157" font-family="Helvetica, Arial" font-size="24" font-weight="bold" fill="${SCHWARZ}">MF</text>
    <text x="1120" y="158" text-anchor="end" font-family="Helvetica, Arial" font-size="22" fill="${GRAU}">Musterfirma GmbH</text>
    <rect x="120" y="192" width="1000" height="4" fill="${GELB}"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BREITE}" height="${HOEHE}" viewBox="0 0 ${BREITE} ${HOEHE}">
    <rect width="${BREITE}" height="${HOEHE}" fill="#FFFFFF"/>
    ${kopf}
    <rect x="120" y="1600" width="1000" height="3" fill="${GELB}"/>
    <text x="120" y="1645" font-family="Helvetica, Arial" font-size="20" fill="${GRAU}">Musterfirma GmbH · Musterstraße 1 · 12345 Musterstadt · www.musterfirma.example</text>
    <text x="120" y="1675" font-family="Helvetica, Arial" font-size="20" fill="${GRAU}">Amtsgericht Musterstadt HRB 00000 · Geschäftsführung: A. Muster</text>
    <text x="120" y="1705" font-family="Helvetica, Arial" font-size="20" fill="${GRAU}">Bankverbindung: Musterbank · IBAN DE00 0000 0000 0000 0000 00</text>
  </svg>`
}

async function alsPng(mitKopf) {
  return sharp(Buffer.from(briefbogenSvg({ mitKopf }))).png({ compressionLevel: 9 }).toBuffer()
}

mkdirSync(ZIEL, { recursive: true })

const seiteEins = await alsPng(true)
const folgeseite = await alsPng(false)

writeFileSync(join(ZIEL, 'Briefbogen_Musterfirma.png'), seiteEins)

// Zweiseitige PDF-Vorlage: Seite 1 mit großem Kopf, Seite 2 mit kleinem.
const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
pdf.addImage(`data:image/png;base64,${seiteEins.toString('base64')}`, 'PNG', 0, 0, 210, 297)
pdf.addPage()
pdf.addImage(`data:image/png;base64,${folgeseite.toString('base64')}`, 'PNG', 0, 0, 210, 297)
writeFileSync(join(ZIEL, 'Briefbogen_Musterfirma.pdf'), Buffer.from(pdf.output('arraybuffer')))

console.log('Beispiel-Briefbogen geschrieben nach dokumentation/beispiel/')
