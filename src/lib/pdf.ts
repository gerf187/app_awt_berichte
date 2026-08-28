import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { absenderzeilen, alsAnzeigedatum, kommazahl } from './bericht'
import { mengeAnzeigen, verbrauchAnzeigen, zahlLesen } from './verbrauch'
import { MINDESTABSTAND_TAUPUNKT } from './taupunkt'
import { A4, bildformat, bytesAusDataUrl, satzspiegel, vorlagenseiteFuer } from './vorlage'
import type { Bericht, Briefvorlage } from './typen'

/**
 * PDF-Ausgabe des Baustellenberichts – der Hauptweg für den Versand.
 *
 * Gebaut wird alles zur Laufzeit im Browser, ohne Netz: jsPDF und die
 * Tabellen-Erweiterung sind fest mitgebündelt.
 *
 * Ist in den Einstellungen ein **Briefbogen** hinterlegt, steht der Bericht
 * darauf: bei einem Bild wird es als Untergrund auf jede Seite gezeichnet,
 * bei einer PDF-Vorlage werden die fertigen Seiten am Ende über den Briefbogen
 * gelegt. Ohne Vorlage druckt die App ihre eigene schlichte Kopfzeile.
 */

const SEITE = A4 // A4 hochkant, in Millimetern

const GELB: [number, number, number] = [255, 196, 0]
const SCHWARZ: [number, number, number] = [26, 26, 26]
const ROT: [number, number, number] = [208, 2, 27]
const GRAU: [number, number, number] = [107, 114, 128]

export async function pdfErzeugen(bericht: Bericht, vorlage?: Briefvorlage): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const rand = satzspiegel(vorlage)
  const INHALTSBREITE = SEITE.breite - rand.links - rand.rechts
  /** Ein Briefbogen als Bild wird direkt mitgedruckt, eine PDF erst am Ende. */
  const bildVorlage = vorlage?.art === 'bild' ? vorlage : undefined

  let y = rand.obenErste
  /**
   * Welche Seiten ihren Kopf schon haben.
   *
   * autoTable ruft `willDrawPage` auch für die Seite auf, auf der eine Tabelle
   * einfach weiterläuft. Ohne dieses Gedächtnis würde der Briefbogen dort noch
   * einmal gezeichnet – und alles übermalen, was schon auf der Seite steht.
   */
  const bekopft = new Set<number>()

  /**
   * Alles, was zu Beginn einer Seite passiert: Briefbogen als Untergrund oder,
   * ohne Vorlage, die eigene Kopfzeile.
   *
   * Am Ende wird die Schrifteinstellung wiederhergestellt: Die Funktion wird
   * mitten im Textfluss aufgerufen (beim Seitenumbruch), und der laufende
   * Absatz soll danach nicht plötzlich in Titelgröße weitergehen.
   */
  function seitenanfang() {
    const seite = doc.getCurrentPageInfo().pageNumber
    if (bekopft.has(seite)) return
    bekopft.add(seite)

    const schrift = doc.getFont()
    const groesse = doc.getFontSize()
    const farbe = doc.getTextColor()

    if (bildVorlage) briefbogenZeichnen(doc, bildVorlage)
    // Eine PDF-Vorlage kommt erst ganz am Ende darunter – dann aber ohne die
    // eigene Kopfzeile, sonst stünden zwei Briefköpfe übereinander.
    else if (!vorlage) eigeneKopfzeile(doc, rand.links)

    doc.setFont(schrift.fontName, schrift.fontStyle)
    doc.setFontSize(groesse)
    doc.setTextColor(farbe)
  }

  /** Sorgt dafür, dass `hoehe` Millimeter auf der Seite noch frei sind. */
  function platz(hoehe: number) {
    if (y + hoehe <= SEITE.hoehe - rand.unten) return
    doc.addPage()
    seitenanfang()
    // Ab Seite 2 ist der Briefkopf meist kleiner – dort beginnt der Text höher.
    y = rand.obenFolge
  }

  function ueberschrift(text: string) {
    platz(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...SCHWARZ)
    doc.text(text, rand.links, y)
    y += 7
  }

  function absatz(text: string) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    for (const zeile of doc.splitTextToSize(text, INHALTSBREITE) as string[]) {
      platz(6)
      doc.text(zeile, rand.links, y)
      y += 5.5
    }
    y += 3
  }

  /** Tabelle setzen und den Schreibzeiger hinter sie stellen. */
  function tabelle(optionen: Parameters<typeof autoTable>[1]) {
    autoTable(doc, {
      startY: y,
      margin: {
        left: rand.links,
        right: rand.rechts,
        top: rand.obenFolge,
        bottom: rand.unten,
      },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 2, textColor: SCHWARZ },
      headStyles: { fillColor: GELB, textColor: SCHWARZ, fontStyle: 'bold' },
      // `willDrawPage`, nicht `didDrawPage`: der Briefbogen muss unter der
      // Tabelle liegen, nicht über ihr.
      willDrawPage: seitenanfang,
      ...optionen,
    })
    const ende = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    y = (ende?.finalY ?? y) + 8
  }

  seitenanfang()

  // --- Kopfdaten: zwei Spalten, damit alles auf eine Seite passt ---------
  const kopfPaare: [string, string][] = [
    ['Berichtsnummer', bericht.kopf.berichtsnummer],
    ['Datum', alsAnzeigedatum(bericht.kopf.datum)],
    ['Projekt / Bauvorhaben', bericht.kopf.projekt],
    ['Objekt', [bericht.kopf.objektStrasse, bericht.kopf.objektOrt].filter(Boolean).join(', ')],
    ['Kunde', bericht.kopf.kunde],
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

  // Steht ein Briefbogen dahinter, fehlt sonst der Titel – der Bogen kennt
  // den Bericht ja nicht.
  if (vorlage) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...SCHWARZ)
    doc.text('Baustellenbericht', rand.links, y)
    y += 9
  }

  tabelle({
    body: kopfPaare.map(([bezeichnung, wert]) => [bezeichnung, wert.trim() || 'k.A.']),
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
      doc.text(zeile, rand.links, y)
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
  // Messwerte stehen auch dann im Bericht, wenn nicht gemessen wurde: „k.A." ist
  // eine Aussage, eine fehlende Zeile lässt den Leser rätseln.
  const untergrundPaare: [string, string][] = [
    ['Art', bericht.untergrund.art],
    ['Vorbereitung', bericht.untergrund.vorbereitung],
    ['Bemerkung', bericht.untergrund.bemerkung],
  ].filter(([, wert]) => wert.trim()) as [string, string][]

  const messwerte: [string, string][] = [
    ['Restfeuchte (CM-%)', bericht.untergrund.restfeuchteCM],
    ['Haftzugfestigkeit (N/mm²)', bericht.untergrund.haftzugfestigkeit],
    ['Rauhtiefe (mm)', bericht.untergrund.rauhtiefe],
  ].map(([bezeichnung, wert]) => [bezeichnung, wert.trim() || 'k.A.']) as [string, string][]

  ueberschrift('Untergrund')
  tabelle({
    body: [...untergrundPaare, ...messwerte],
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  })

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
        doc.text(zeile, rand.links, y)
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
      head: [['Bereich', 'Schicht', 'Produkt', 'Verbrauch', 'Fläche', 'Gesamt', 'Charge']],
      body: bericht.aufbau.map((zeile) => [
        zeile.bereich,
        zeile.schicht,
        zeile.produkt,
        verbrauchText(zeile.verbrauch),
        zeile.flaeche && `${zeile.flaeche} m²`,
        mengeText(zeile.gesamtmenge),
        zeile.charge,
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
    doc.addImage(bericht.unterschrift, 'PNG', rand.links, y, 70, 25)
    y += 28
    doc.setDrawColor(...GRAU)
    doc.setLineWidth(0.3)
    doc.line(rand.links, y, rand.links + 70, y)
    y += 10
  }

  // --- Fotos: zwei je Seite --------------------------------------------
  if (bericht.fotos.length > 0) {
    doc.addPage()
    seitenanfang()
    y = rand.obenFolge
    ueberschrift('Fotos')

    // Halbe freie Seitenhöhe, damit zwei Bilder samt Beschriftung Platz haben.
    const kastenHoehe = Math.max(60, (SEITE.hoehe - rand.obenFolge - rand.unten) / 2 - 18)
    for (const [nummer, foto] of bericht.fotos.entries()) {
      platz(kastenHoehe + 12)
      const { breite, hoehe } = einpassen(doc, foto.dataUrl, INHALTSBREITE, kastenHoehe)
      doc.addImage(
        foto.dataUrl,
        'JPEG',
        rand.links + (INHALTSBREITE - breite) / 2,
        y,
        breite,
        hoehe,
      )
      y += hoehe + 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...GRAU)
      const beschriftung = `Bild ${nummer + 1}${foto.beschreibung ? `: ${foto.beschreibung}` : ''}`
      for (const zeile of doc.splitTextToSize(beschriftung, INHALTSBREITE) as string[]) {
        platz(5)
        doc.text(zeile, rand.links, y)
        y += 4.5
      }
      doc.setTextColor(...SCHWARZ)
      y += 6
    }
  }

  fusszeilen(doc, bericht.kopf.berichtsnummer, rand.links, rand.rechts, rand.unten)

  const fertig = doc.output('blob')
  if (vorlage?.art === 'pdf') return briefbogenUnterlegen(fertig, vorlage)
  return fertig
}

/** Die eigene Kopfzeile – nur, wenn kein Briefbogen hinterlegt ist. */
function eigeneKopfzeile(doc: jsPDF, links: number) {
  doc.setFillColor(...GELB)
  doc.rect(links, 10, 16, 12, 'F')
  doc.setTextColor(...SCHWARZ)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Sika', links + 3, 18)

  doc.setFontSize(16)
  doc.text('Baustellenbericht', links + 22, 19)

  doc.setDrawColor(...GELB)
  doc.setLineWidth(0.8)
  doc.line(links, 24, SEITE.breite - links, 24)
}

/**
 * Briefbogen als Bild über die ganze Seite. Das Seitenverhältnis bleibt
 * erhalten und das Bild wird mittig gesetzt – ein Bogen, der nicht genau A4
 * ist, wird also nicht verzerrt.
 *
 * Der Aliasname sorgt dafür, dass jsPDF das Bild nur einmal in die Datei legt,
 * auch wenn es auf zehn Seiten steht.
 */
function briefbogenZeichnen(doc: jsPDF, vorlage: Briefvorlage) {
  const seite = doc.getCurrentPageInfo().pageNumber - 1
  if (vorlagenseiteFuer(vorlage, seite) === null) return

  const masse = doc.getImageProperties(vorlage.daten)
  const faktor = Math.min(SEITE.breite / masse.width, SEITE.hoehe / masse.height)
  const breite = masse.width * faktor
  const hoehe = masse.height * faktor
  doc.addImage(
    vorlage.daten,
    bildformat(vorlage.daten),
    (SEITE.breite - breite) / 2,
    (SEITE.hoehe - hoehe) / 2,
    breite,
    hoehe,
    'briefbogen',
    'NONE',
  )
}

/**
 * Fertigen Bericht auf eine PDF-Vorlage legen.
 *
 * jsPDF-Seiten sind durchsichtig – deshalb wird für jede Seite erst der
 * Briefbogen und darüber die Berichtsseite gezeichnet. `pdf-lib` wird erst
 * hier geladen, damit die App ohne Vorlage nichts davon mitschleppt.
 */
async function briefbogenUnterlegen(bericht: Blob, vorlage: Briefvorlage): Promise<Blob> {
  try {
    const { PDFDocument } = await import('pdf-lib')
    const inhalt = await PDFDocument.load(await bericht.arrayBuffer())
    const bogen = await PDFDocument.load(bytesAusDataUrl(vorlage.daten))

    const ziel = await PDFDocument.create()
    const bogenSeiten = await ziel.embedPdf(bogen, bogen.getPageIndices())
    const inhaltSeiten = await ziel.embedPages(inhalt.getPages())

    for (const [nummer, inhaltSeite] of inhaltSeiten.entries()) {
      const seite = ziel.addPage([inhaltSeite.width, inhaltSeite.height])
      const index = vorlagenseiteFuer(vorlage, nummer)
      const gewaehlt = index === null ? undefined : (bogenSeiten[index] ?? bogenSeiten[0])
      if (gewaehlt) {
        seite.drawPage(gewaehlt, {
          x: 0,
          y: 0,
          width: seite.getWidth(),
          height: seite.getHeight(),
        })
      }
      seite.drawPage(inhaltSeite, { x: 0, y: 0 })
    }

    const bytes = await ziel.save()
    // TypeScript hält den Puffer eines Uint8Array für einen möglichen
    // SharedArrayBuffer; hier kommt er nachweislich aus pdf-lib.
    return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
  } catch {
    // Lieber ein Bericht ohne Briefbogen als gar keiner auf der Baustelle.
    return bericht
  }
}

/** Verbrauch für die Tabelle – die Einheit richtet sich nach der Größe. */
function verbrauchText(gespeichert: string): string {
  const wert = zahlLesen(gespeichert)
  return wert === null ? '' : verbrauchAnzeigen(wert)
}

/** Gesamtmenge für die Tabelle. */
function mengeText(gespeichert: string): string {
  const wert = zahlLesen(gespeichert)
  return wert === null ? '' : mengeAnzeigen(wert)
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
 * vorher nicht feststeht. Sie sitzt im unteren Rand, also über einer
 * eventuellen Fußzeile des Briefbogens.
 */
function fusszeilen(
  doc: jsPDF,
  berichtsnummer: string,
  links: number,
  rechts: number,
  unten: number,
) {
  const seiten = doc.getNumberOfPages()
  const zeile = Math.min(SEITE.hoehe - 8, SEITE.hoehe - unten + 8)
  for (let seite = 1; seite <= seiten; seite++) {
    doc.setPage(seite)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAU)
    doc.text(`Bericht ${berichtsnummer}`, links, zeile)
    doc.text(`Seite ${seite} von ${seiten}`, SEITE.breite - rechts, zeile, {
      align: 'right',
    })
  }
}
