import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { absenderzeilen, alsAnzeigedatum, kommazahl } from './bericht'
import { MINDESTABSTAND_TAUPUNKT } from './taupunkt'
import type { Bericht } from './typen'

/**
 * PDF-Ausgabe des Baustellenberichts – der Hauptweg für den Versand.
 *
 * Gebaut wird alles zur Laufzeit im Browser, ohne Netz: jsPDF und die
 * Tabellen-Erweiterung sind fest mitgebündelt.
 */

const SEITE = { breite: 210, hoehe: 297 } // A4 hochkant, in Millimetern
const RAND = 15
const OBEN = 30
const UNTEN = 18
const INHALTSBREITE = SEITE.breite - 2 * RAND

const GELB: [number, number, number] = [255, 196, 0]
const SCHWARZ: [number, number, number] = [26, 26, 26]
const ROT: [number, number, number] = [208, 2, 27]
const GRAU: [number, number, number] = [107, 114, 128]

export async function pdfErzeugen(bericht: Bericht): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  let y = OBEN

  /**
   * Kopfzeile: Logo-Platzhalter und Titel. Steht auf jeder Seite.
   *
   * Am Ende wird die Schrifteinstellung wiederhergestellt: Die Kopfzeile wird
   * mitten im Textfluss aufgerufen (beim Seitenumbruch), und der laufende
   * Absatz soll danach nicht plötzlich in Titelgröße weitergehen.
   */
  function kopfzeile() {
    const schrift = doc.getFont()
    const groesse = doc.getFontSize()
    const farbe = doc.getTextColor()

    doc.setFillColor(...GELB)
    doc.rect(RAND, 10, 16, 12, 'F')
    doc.setTextColor(...SCHWARZ)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Sika', RAND + 3, 18)

    doc.setFontSize(16)
    doc.text('Baustellenbericht', RAND + 22, 19)

    doc.setDrawColor(...GELB)
    doc.setLineWidth(0.8)
    doc.line(RAND, 24, SEITE.breite - RAND, 24)

    doc.setFont(schrift.fontName, schrift.fontStyle)
    doc.setFontSize(groesse)
    doc.setTextColor(farbe)
  }

  /** Sorgt dafür, dass `hoehe` Millimeter auf der Seite noch frei sind. */
  function platz(hoehe: number) {
    if (y + hoehe <= SEITE.hoehe - UNTEN) return
    doc.addPage()
    kopfzeile()
    y = OBEN
  }

  function ueberschrift(text: string) {
    platz(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...SCHWARZ)
    doc.text(text, RAND, y)
    y += 7
  }

  function absatz(text: string) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    for (const zeile of doc.splitTextToSize(text, INHALTSBREITE) as string[]) {
      platz(6)
      doc.text(zeile, RAND, y)
      y += 5.5
    }
    y += 3
  }

  /** Tabelle setzen und den Schreibzeiger hinter sie stellen. */
  function tabelle(optionen: Parameters<typeof autoTable>[1]) {
    autoTable(doc, {
      startY: y,
      margin: { left: RAND, right: RAND, top: OBEN, bottom: UNTEN },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 2, textColor: SCHWARZ },
      headStyles: { fillColor: GELB, textColor: SCHWARZ, fontStyle: 'bold' },
      didDrawPage: kopfzeile,
      ...optionen,
    })
    const ende = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    y = (ende?.finalY ?? y) + 8
  }

  kopfzeile()

  // --- Kopfdaten: zwei Spalten, damit alles auf eine Seite passt ---------
  const kopfPaare: [string, string][] = [
    ['Berichtsnummer', bericht.kopf.berichtsnummer],
    ['Datum', alsAnzeigedatum(bericht.kopf.datum)],
    ['Projekt / Bauvorhaben', bericht.kopf.projekt],
    ['Objekt', [bericht.kopf.objektStrasse, bericht.kopf.objektOrt].filter(Boolean).join(', ')],
    ['Auftraggeber', bericht.kopf.kunde],
    ['Verarbeiter', bericht.kopf.verarbeiter],
    [
      'Verarbeiter-Anschrift',
      [bericht.kopf.verarbeiterStrasse, bericht.kopf.verarbeiterOrt].filter(Boolean).join(', '),
    ],
    ['Ansprechpartner', bericht.kopf.ansprechpartner],
    ['Telefon', bericht.kopf.telefon],
    ['Anwendungstechniker', bericht.kopf.awt],
    ['Vertrieb', bericht.kopf.vertrieb],
  ]

  tabelle({
    body: kopfPaare.map(([bezeichnung, wert]) => [bezeichnung, wert || '–']),
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  })

  const absender = absenderzeilen(bericht.absender)
  if (absender.length > 0) {
    ueberschrift('Bericht erstellt von')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...GRAU)
    for (const zeile of absender) {
      platz(6)
      doc.text(zeile, RAND, y)
      y += 5
    }
    doc.setTextColor(...SCHWARZ)
    y += 5
  }

  if (bericht.kopf.zweck.trim()) {
    ueberschrift('Zweck des Besuchs')
    absatz(bericht.kopf.zweck)
  }

  // --- Anwesende --------------------------------------------------------
  const anwesende = bericht.anwesende.filter((person) => person.name.trim())
  if (anwesende.length > 0) {
    ueberschrift('Anwesende')
    tabelle({
      head: [['Name', 'Firma', 'Funktion']],
      body: anwesende.map((person) => [person.name, person.firma, person.funktion]),
    })
  }

  // --- Untergrund -------------------------------------------------------
  const untergrundPaare: [string, string][] = [
    ['Art', bericht.untergrund.art],
    ['Vorbereitung', bericht.untergrund.vorbereitung],
    ['Bemerkung', bericht.untergrund.bemerkung],
    ['Restfeuchte (CM-%)', bericht.untergrund.restfeuchteCM],
    ['Haftzugfestigkeit (N/mm²)', bericht.untergrund.haftzugfestigkeit],
  ].filter(([, wert]) => wert.trim()) as [string, string][]

  if (untergrundPaare.length > 0) {
    ueberschrift('Untergrund')
    tabelle({
      body: untergrundPaare,
      theme: 'grid',
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    })
  }

  // --- Klimawerte -------------------------------------------------------
  if (bericht.klima.length > 0) {
    ueberschrift('Klimawerte')
    tabelle({
      head: [['Uhrzeit', 'Luft °C', 'Untergrund °C', 'rF %', 'Taupunkt °C', 'Abstand K']],
      body: bericht.klima.map((messung) => [
        messung.uhrzeit,
        messung.luft.toString(),
        messung.boden.toString(),
        messung.feuchte.toString(),
        kommazahl(messung.taupunkt),
        kommazahl(messung.abstandTaupunkt),
      ]),
      // Kritische Messungen rot – der wichtigste Blick im ganzen Bericht.
      didParseCell: (daten) => {
        if (daten.section !== 'body') return
        if (bericht.klima[daten.row.index]?.warnung) {
          daten.cell.styles.textColor = ROT
          daten.cell.styles.fontStyle = 'bold'
        }
      },
    })

    if (bericht.klima.some((messung) => messung.warnung)) {
      doc.setTextColor(...ROT)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const warnung = `Achtung: Abstand zum Taupunkt unter ${MINDESTABSTAND_TAUPUNKT} K – Beschichtung nicht freigeben.`
      // Umbrechen, sonst läuft der Satz über den rechten Rand hinaus.
      for (const zeile of doc.splitTextToSize(warnung, INHALTSBREITE) as string[]) {
        platz(6)
        doc.text(zeile, RAND, y)
        y += 5
      }
      y += 5
      doc.setTextColor(...SCHWARZ)
    }
  }

  // --- Aufbau -----------------------------------------------------------
  if (bericht.aufbau.length > 0) {
    ueberschrift('Aufbau')
    tabelle({
      head: [['Bereich', 'Schicht', 'Produkt', 'kg/m²', 'Charge', 'm²']],
      body: bericht.aufbau.map((zeile) => [
        zeile.bereich,
        zeile.schicht,
        zeile.produkt,
        zeile.verbrauch,
        zeile.charge,
        zeile.flaeche,
      ]),
    })
  }

  // --- Freitexte --------------------------------------------------------
  const textbloecke: [string, string][] = [
    ['Ausgeführte Arbeiten', bericht.text.ausgefuehrteArbeiten],
    ['Besprochenes', bericht.text.besprochenes],
    ['Mängel / Auffälligkeiten', bericht.text.maengel],
    ['Empfehlung', bericht.text.empfehlung],
    ['Offene Fragen', bericht.text.offeneFragen],
  ]
  for (const [titel, inhalt] of textbloecke) {
    if (!inhalt.trim()) continue
    ueberschrift(titel)
    absatz(inhalt)
  }

  // --- Unterschrift -----------------------------------------------------
  if (bericht.unterschrift) {
    platz(40)
    ueberschrift('Unterschrift')
    doc.addImage(bericht.unterschrift, 'PNG', RAND, y, 70, 25)
    y += 28
    doc.setDrawColor(...GRAU)
    doc.setLineWidth(0.3)
    doc.line(RAND, y, RAND + 70, y)
    y += 10
  }

  // --- Fotos: zwei je Seite --------------------------------------------
  if (bericht.fotos.length > 0) {
    doc.addPage()
    kopfzeile()
    y = OBEN
    ueberschrift('Fotos')

    const kastenHoehe = 95
    for (const [nummer, foto] of bericht.fotos.entries()) {
      platz(kastenHoehe + 12)
      const { breite, hoehe } = einpassen(doc, foto.dataUrl, INHALTSBREITE, kastenHoehe)
      doc.addImage(foto.dataUrl, 'JPEG', RAND + (INHALTSBREITE - breite) / 2, y, breite, hoehe)
      y += hoehe + 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...GRAU)
      const beschriftung = `Bild ${nummer + 1}${foto.beschreibung ? `: ${foto.beschreibung}` : ''}`
      for (const zeile of doc.splitTextToSize(beschriftung, INHALTSBREITE) as string[]) {
        platz(5)
        doc.text(zeile, RAND, y)
        y += 4.5
      }
      doc.setTextColor(...SCHWARZ)
      y += 6
    }
  }

  fusszeilen(doc, bericht.kopf.berichtsnummer)
  return doc.output('blob')
}

/** Bildmaße so verkleinern, dass sie in den vorgegebenen Kasten passen. */
function einpassen(
  doc: jsPDF,
  dataUrl: string,
  maxBreite: number,
  maxHoehe: number,
): { breite: number; hoehe: number } {
  const eigenschaften = doc.getImageProperties(dataUrl)
  const faktor = Math.min(maxBreite / eigenschaften.width, maxHoehe / eigenschaften.height)
  return { breite: eigenschaften.width * faktor, hoehe: eigenschaften.height * faktor }
}

/**
 * Fußzeile auf jede Seite – erst am Ende, weil die Gesamtseitenzahl
 * vorher nicht feststeht.
 */
function fusszeilen(doc: jsPDF, berichtsnummer: string) {
  const seiten = doc.getNumberOfPages()
  for (let seite = 1; seite <= seiten; seite++) {
    doc.setPage(seite)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAU)
    doc.text(`Bericht ${berichtsnummer}`, RAND, SEITE.hoehe - 10)
    doc.text(`Seite ${seite} von ${seiten}`, SEITE.breite - RAND, SEITE.hoehe - 10, {
      align: 'right',
    })
  }
}
