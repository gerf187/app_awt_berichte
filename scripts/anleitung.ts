/**
 * Setzt die Anleitung als PDF.
 *
 *   npm run anleitung
 *
 * Text kommt aus `scripts/anleitungInhalt.ts`, die Bilder aus
 * `dokumentation/bilder/` (dort hinein schreibt `npm run anleitung:bilder`).
 * Die fertige Datei liegt danach zweimal:
 *
 * - `dokumentation/Anleitung_Baustellenbericht.pdf` – zum Verteilen
 * - `public/Anleitung.pdf` – wird mit der App ausgeliefert, damit die
 *   Anleitung auch auf der Baustelle ohne Empfang zur Hand ist.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { KAPITEL, STAND, TITEL, UNTERTITEL, type Block } from './anleitungInhalt'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')
const BILDER = join(WURZEL, 'dokumentation', 'bilder')

const SEITE = { breite: 210, hoehe: 297 }
const RAND = { links: 22, rechts: 20, oben: 30, unten: 20 }
const BREITE = SEITE.breite - RAND.links - RAND.rechts

const GELB: [number, number, number] = [255, 196, 0]
const SCHWARZ: [number, number, number] = [26, 26, 26]
const GRAU: [number, number, number] = [107, 114, 128]
const ROT: [number, number, number] = [208, 2, 27]
const HELL: [number, number, number] = [244, 245, 247]

/**
 * Die Standardschriften einer PDF können nur WinAnsi. Pfeile und Häkchen
 * kämen als Buchstabensalat heraus – deshalb hier ersetzt statt riskiert.
 */
function druckbar(text: string): string {
  return (
    text
      .replace(/→/g, '>')
      .replace(/[✓⚠●]/g, '')
      // Geschütztes Leerzeichen: in WinAnsi vorhanden, aber unnötig – raus damit.
      .replace(/\u00A0/g, ' ')
  )
}

/**
 * Bildschirmfoto als JPEG einbetten: Ein PNG mit Alphakanal legt jsPDF
 * unkomprimiert ab – die Anleitung wäre dann zweistellig megabyteschwer.
 */
async function bildDaten(datei: string): Promise<{ dataUrl: string; verhaeltnis: number }> {
  const roh = readFileSync(join(BILDER, datei))
  const masse = await sharp(roh).metadata()
  const jpeg = await sharp(roh).flatten({ background: '#FFFFFF' }).jpeg({ quality: 82 }).toBuffer()
  return {
    dataUrl: `data:image/jpeg;base64,${jpeg.toString('base64')}`,
    verhaeltnis: (masse.height ?? 1) / (masse.width ?? 1),
  }
}

const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
let y = RAND.oben
let kapitelTitel = ''
/** Auf welcher Seite ein Kapitel anfängt – für das Inhaltsverzeichnis. */
const verzeichnis: { titel: string; seite: number }[] = []

function kopfzeile() {
  if (!kapitelTitel) return
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAU)
  doc.text(druckbar(kapitelTitel), SEITE.breite - RAND.rechts, 15, { align: 'right' })
  doc.setDrawColor(...GELB)
  doc.setLineWidth(0.6)
  doc.line(RAND.links, 18, SEITE.breite - RAND.rechts, 18)
  doc.setTextColor(...SCHWARZ)
}

function neueSeite() {
  doc.addPage()
  kopfzeile()
  y = RAND.oben
}

function platz(hoehe: number) {
  if (y + hoehe > SEITE.hoehe - RAND.unten) neueSeite()
}

function absatz(text: string, groesse = 10.5, farbe: [number, number, number] = SCHWARZ) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(groesse)
  doc.setTextColor(...farbe)
  for (const zeile of doc.splitTextToSize(druckbar(text), BREITE) as string[]) {
    platz(6)
    doc.text(zeile, RAND.links, y)
    y += groesse * 0.52
  }
  y += 3
}

function zwischentitel(text: string) {
  platz(14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...SCHWARZ)
  doc.text(druckbar(text), RAND.links, y)
  y += 6.5
}

/** Aufzählung mit Punkt oder Nummer. */
function liste(punkte: string[], nummeriert: boolean) {
  const einzug = 7
  doc.setFontSize(10.5)
  for (const [nummer, punkt] of punkte.entries()) {
    const zeichen = nummeriert ? `${nummer + 1}.` : '•'
    const zeilen = doc.splitTextToSize(druckbar(punkt), BREITE - einzug) as string[]
    platz(zeilen.length * 5.5 + 2)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SCHWARZ)
    doc.text(zeichen, RAND.links, y)
    doc.setFont('helvetica', 'normal')
    for (const zeile of zeilen) {
      doc.text(zeile, RAND.links + einzug, y)
      y += 5.5
    }
    y += 1.5
  }
  y += 2
}

/** Kasten für Hinweise (gelb) und Warnungen (rot). */
function kasten(text: string, warnend: boolean) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const zeilen = doc.splitTextToSize(druckbar(text), BREITE - 12) as string[]
  const hoehe = zeilen.length * 5 + 8
  platz(hoehe + 4)

  doc.setFillColor(...(warnend ? [253, 240, 241] : HELL))
  doc.setDrawColor(...(warnend ? ROT : GELB))
  doc.setLineWidth(0.8)
  doc.rect(RAND.links, y - 4.5, BREITE, hoehe, 'FD')
  // Farbiger Balken links – der Kasten soll auch im Schwarzweißdruck auffallen.
  doc.setFillColor(...(warnend ? ROT : GELB))
  doc.rect(RAND.links, y - 4.5, 2.5, hoehe, 'F')

  doc.setTextColor(...SCHWARZ)
  let zeilenY = y + 1
  for (const zeile of zeilen) {
    doc.text(zeile, RAND.links + 7, zeilenY)
    zeilenY += 5
  }
  y += hoehe + 4
}

async function bildBlock(datei: string, unterschrift: string, breiteMM?: number) {
  const { dataUrl, verhaeltnis } = await bildDaten(datei)
  // Hochkant-Bildschirmfotos schmal setzen, Seitenabbildungen breiter.
  const wunschbreite = breiteMM ?? (verhaeltnis > 1.3 ? 62 : 115)

  const beschriftung = doc.splitTextToSize(druckbar(unterschrift), BREITE) as string[]
  const zubehoer = beschriftung.length * 4.5 + 8
  const restHoehe = SEITE.hoehe - RAND.unten - y - zubehoer

  // Passt das Bild knapp nicht mehr, wird es lieber etwas kleiner, als eine
  // halbe Seite leer zu lassen. Unter 45 mm wäre es nicht mehr zu lesen –
  // dann doch eine neue Seite.
  let breite = wunschbreite
  if (wunschbreite * verhaeltnis > restHoehe) {
    const angepasst = restHoehe / verhaeltnis
    if (angepasst >= 45) breite = angepasst
  }
  const hoehe = breite * verhaeltnis
  platz(hoehe + zubehoer)

  const x = RAND.links + (BREITE - breite) / 2
  doc.addImage(dataUrl, 'JPEG', x, y, breite, hoehe)
  doc.setDrawColor(220, 222, 226)
  doc.setLineWidth(0.3)
  doc.rect(x, y, breite, hoehe)
  y += hoehe + 4.5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...GRAU)
  for (const zeile of beschriftung) {
    doc.text(zeile, RAND.links + BREITE / 2, y, { align: 'center' })
    y += 4.5
  }
  doc.setTextColor(...SCHWARZ)
  y += 4
}

async function bildpaar(dateien: [string, string], unterschrift: string) {
  const bilder = await Promise.all(dateien.map(bildDaten))
  const breite = (BREITE - 6) / 2
  const hoehe = Math.max(...bilder.map((bild) => bild.verhaeltnis)) * breite

  const beschriftung = doc.splitTextToSize(druckbar(unterschrift), BREITE) as string[]
  platz(hoehe + beschriftung.length * 4.5 + 8)

  for (const [nummer, bild] of bilder.entries()) {
    const x = RAND.links + nummer * (breite + 6)
    doc.addImage(bild.dataUrl, 'JPEG', x, y, breite, bild.verhaeltnis * breite)
    doc.setDrawColor(220, 222, 226)
    doc.setLineWidth(0.3)
    doc.rect(x, y, breite, bild.verhaeltnis * breite)
  }
  y += hoehe + 4.5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...GRAU)
  for (const zeile of beschriftung) {
    doc.text(zeile, RAND.links + BREITE / 2, y, { align: 'center' })
    y += 4.5
  }
  doc.setTextColor(...SCHWARZ)
  y += 4
}

function tabelle(kopf: string[], zeilen: string[][]) {
  autoTable(doc, {
    startY: y,
    head: [kopf.map(druckbar)],
    body: zeilen.map((zeile) => zeile.map(druckbar)),
    margin: { left: RAND.links, right: RAND.rechts, top: RAND.oben, bottom: RAND.unten },
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.2, textColor: SCHWARZ },
    headStyles: { fillColor: GELB, textColor: SCHWARZ, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: HELL },
    willDrawPage: kopfzeile,
  })
  const ende = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
  y = (ende?.finalY ?? y) + 6
}

async function block(inhalt: Block) {
  switch (inhalt.art) {
    case 'absatz':
      absatz(inhalt.text)
      break
    case 'zwischentitel':
      zwischentitel(inhalt.text)
      break
    case 'punkte':
      liste(inhalt.punkte, false)
      break
    case 'schritte':
      liste(inhalt.punkte, true)
      break
    case 'hinweis':
      kasten(inhalt.text, false)
      break
    case 'warnung':
      kasten(inhalt.text, true)
      break
    case 'bild':
      await bildBlock(inhalt.datei, inhalt.bildunterschrift, inhalt.breite)
      break
    case 'bildpaar':
      await bildpaar(inhalt.dateien, inhalt.bildunterschrift)
      break
    case 'tabelle':
      tabelle(inhalt.kopf, inhalt.zeilen)
      break
  }
}

// --- Titelseite -------------------------------------------------------------
doc.setFillColor(...GELB)
doc.rect(0, 0, SEITE.breite, 78, 'F')
doc.setTextColor(...SCHWARZ)
doc.setFont('helvetica', 'bold')
doc.setFontSize(34)
doc.text(TITEL, RAND.links, 45)
doc.setFont('helvetica', 'normal')
doc.setFontSize(15)
doc.text(UNTERTITEL, RAND.links, 58)

doc.setFontSize(11)
doc.setTextColor(...GRAU)
doc.text(`Stand: ${STAND}`, RAND.links, 95)
doc.setTextColor(...SCHWARZ)
doc.setFontSize(11)
for (const [nummer, zeile] of [
  'Diese Anleitung führt durch jeden Schritt der App – vom Einrichten des',
  'Profils über die Briefvorlage bis zum fertigen Bericht beim Kunden.',
  '',
  'Alle Bildschirmfotos zeigen erfundene Musterdaten.',
].entries()) {
  doc.text(zeile, RAND.links, 110 + nummer * 6)
}

// --- Kapitel ----------------------------------------------------------------
for (const [nummer, kapitel] of KAPITEL.entries()) {
  kapitelTitel = kapitel.titel
  doc.addPage()
  kopfzeile()
  y = RAND.oben + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GRAU)
  doc.text(`Kapitel ${nummer + 1}`, RAND.links, y)
  y += 8
  doc.setFontSize(19)
  doc.setTextColor(...SCHWARZ)
  for (const zeile of doc.splitTextToSize(druckbar(kapitel.titel), BREITE) as string[]) {
    doc.text(zeile, RAND.links, y)
    y += 9
  }
  y += 3

  verzeichnis.push({ titel: kapitel.titel, seite: doc.getCurrentPageInfo().pageNumber })

  for (const inhalt of kapitel.bloecke) await block(inhalt)
}

// --- Inhaltsverzeichnis: eingeschoben, wenn die Seitenzahlen feststehen ------
kapitelTitel = ''
doc.insertPage(2)
doc.setPage(2)
doc.setFont('helvetica', 'bold')
doc.setFontSize(19)
doc.setTextColor(...SCHWARZ)
doc.text('Inhalt', RAND.links, RAND.oben)
let verzeichnisY = RAND.oben + 12
for (const [nummer, eintrag] of verzeichnis.entries()) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  const text = `${nummer + 1}.  ${druckbar(eintrag.titel)}`
  doc.text(text, RAND.links, verzeichnisY)
  // +1, weil das Verzeichnis selbst alle Kapitel um eine Seite verschiebt.
  doc.text(String(eintrag.seite + 1), SEITE.breite - RAND.rechts, verzeichnisY, { align: 'right' })
  doc.setDrawColor(225, 227, 231)
  doc.setLineWidth(0.2)
  doc.line(RAND.links, verzeichnisY + 1.6, SEITE.breite - RAND.rechts, verzeichnisY + 1.6)
  verzeichnisY += 8
}

// --- Fußzeilen --------------------------------------------------------------
const seiten = doc.getNumberOfPages()
for (let seite = 2; seite <= seiten; seite++) {
  doc.setPage(seite)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAU)
  doc.text(`${TITEL} – ${UNTERTITEL}`, RAND.links, SEITE.hoehe - 12)
  doc.text(`Seite ${seite} von ${seiten}`, SEITE.breite - RAND.rechts, SEITE.hoehe - 12, {
    align: 'right',
  })
}

const daten = Buffer.from(doc.output('arraybuffer'))
const ziel = join(WURZEL, 'dokumentation', 'Anleitung_Baustellenbericht.pdf')
writeFileSync(ziel, daten)
mkdirSync(join(WURZEL, 'public'), { recursive: true })
copyFileSync(ziel, join(WURZEL, 'public', 'Anleitung.pdf'))

console.log(
  `dokumentation/Anleitung_Baustellenbericht.pdf – ${seiten} Seiten, ${(daten.length / 1024).toFixed(0)} kB`,
)
console.log('public/Anleitung.pdf – dieselbe Datei, wird mit der App ausgeliefert')
