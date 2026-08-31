import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { chargenText } from './aufbau'
import { absenderzeilen, alsAnzeigedatum, kommazahl } from './bericht'
import { ausgefuellte, hatBruchbild, messwertText, mittelwertText } from './pruefungen'
import { mengeAnzeigen, verbrauchAnzeigen, zahlLesen } from './verbrauch'
import { MINDESTABSTAND_TAUPUNKT } from './taupunkt'
import { bildformat, bytesAusDataUrl, vorlagenseiteFuer } from './vorlage'
import {
  ABSTAND,
  UEBERSCHRIFT,
  GELB,
  GRAU,
  PAGE,
  PdfLayout,
  ROT,
  SCHRIFT,
  SCHWARZ,
  TEXT,
  TITEL,
  ZWISCHENUEBERSCHRIFT,
  fussZeichnen,
  kopfZeichnen,
  zonenFuer,
} from '../pdf/layout'
import type { Protokolleintrag } from '../pdf/layout'
import type { Absender, Bericht, Briefvorlage } from './typen'

/**
 * PDF-Ausgabe des Baustellenberichts – der Hauptweg für den Versand.
 *
 * Gebaut wird alles zur Laufzeit im Browser, ohne Netz: jsPDF und die
 * Tabellen-Erweiterung sind fest mitgebündelt.
 *
 * Ist in den Einstellungen ein **Briefbogen** hinterlegt, steht der Bericht
 * darauf: bei einem Bild wird es als Untergrund auf jede Seite gezeichnet,
 * bei einer PDF-Vorlage werden die fertigen Seiten am Ende über den Briefbogen
 * gelegt. Ohne Vorlage druckt die App ihre eigene Kopfzeile – an denselben
 * Stellen, damit der Satzspiegel in beiden Fällen derselbe ist.
 *
 * Wo etwas stehen darf, weiß diese Datei nicht selbst: das steht in
 * `src/pdf/layout.ts`. Hier wird nur gesagt, **was** gedruckt wird, und der
 * Schreibzeiger (`PdfLayout`) sorgt dafür, dass es in den freien Bereich passt.
 */

/** Anteil der Beschriftungsspalte an einer Bezeichnung/Wert-Spalte. */
const BESCHRIFTUNG_ANTEIL = { einspaltig: 0.33 }

/**
 * Beschriftungsspalte der Kopfdaten: so breit wie ihr längster Eintrag, der
 * Rest gehört den Werten. Fest gesetzt bräche autoTable „Verarbeiter-Anschrift"
 * mitten im Wort um.
 */
const BESCHRIFTUNGSSPALTE = { cellWidth: 'wrap' as const, fontStyle: 'bold' as const }

/**
 * Der Zweck des Besuchs steht mittig und fett über dem Bericht – er sagt in
 * einem Satz, warum jemand auf der Baustelle war. Dafür etwas mehr Luft als
 * zwischen den übrigen Abschnitten.
 */
const ZWECK = {
  ueberschrift: { ...UEBERSCHRIFT, zentriert: true },
  text: { ...TEXT, dick: true, zentriert: true },
  luftOben: 4,
  luftUnten: 6,
}

/** Breite des Unterschriftenfeldes. */
const UNTERSCHRIFT = { breite: 70, hoehe: 25 }

/** Zusammen mit dem Bildkasten der Platz, den ein Foto samt Text braucht. */
const BILDTEXT_ABSTAND = 5

export async function pdfErzeugen(bericht: Bericht, vorlage?: Briefvorlage): Promise<Blob> {
  return (await pdfMitProtokoll(bericht, vorlage)).blob
}

/**
 * Wie `pdfErzeugen`, gibt aber zusätzlich zurück, wo jeder Block gelandet ist.
 *
 * Dafür gibt es die Layout-Tests: an einer fertigen PDF lässt sich schlecht
 * ablesen, ob eine Tabellenzeile in den Rechtsblock ragt – am Protokoll schon.
 */
export async function pdfMitProtokoll(
  bericht: Bericht,
  vorlage?: Briefvorlage,
): Promise<{ blob: Blob; protokoll: Protokolleintrag[]; seiten: number }> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const zonen = zonenFuer(vorlage)
  /** Ein Briefbogen als Bild wird direkt mitgedruckt, eine PDF erst am Ende. */
  const bildVorlage = vorlage?.art === 'bild' ? vorlage : undefined
  /**
   * Ohne Briefbogen zeichnet die App den Gesprächspartner selbst in den dafür
   * reservierten Block. Mit Bogen bleibt der Block dem Bogen überlassen – die
   * Angaben stehen dann im Text („Bericht erstellt von").
   */
  const kopfTraegtAbsender = !vorlage

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
  function seitenanfang(seite: number) {
    if (bekopft.has(seite)) return
    bekopft.add(seite)

    const schrift = doc.getFont()
    const groesse = doc.getFontSize()
    const farbe = doc.getTextColor()

    if (bildVorlage) briefbogenZeichnen(doc, bildVorlage)
    // Eine PDF-Vorlage kommt erst ganz am Ende darunter – dann aber ohne die
    // eigene Kopfzeile, sonst stünden zwei Briefköpfe übereinander.
    else if (!vorlage) kopfZeichnen(doc, seite, kopfangaben(bericht.absender))

    doc.setFont(schrift.fontName, schrift.fontStyle)
    doc.setFontSize(groesse)
    doc.setTextColor(farbe)
  }

  const layout = new PdfLayout(doc, zonen, seitenanfang)

  /** Tabelle setzen und den Schreibzeiger hinter sie stellen. */
  function tabelle(optionen: Parameters<typeof autoTable>[1]) {
    autoTable(doc, {
      ...layout.tabellenRahmen(),
      styles: { font: 'helvetica', fontSize: SCHRIFT.tabelle, cellPadding: 2, textColor: SCHWARZ },
      headStyles: { fillColor: GELB, textColor: SCHWARZ, fontStyle: 'bold' },
      // Kopfzeile auf jeder Seite wiederholen, und lieber eine hohe Zeile
      // umbrechen als sie am Seitenfuß abschneiden.
      showHead: 'everyPage',
      rowPageBreak: 'auto',
      // `willDrawPage`, nicht `didDrawPage`: der Briefbogen muss unter der
      // Tabelle liegen, nicht über ihr.
      willDrawPage: () => seitenanfang(doc.getCurrentPageInfo().pageNumber),
      didDrawCell: (daten) =>
        layout.notieren(daten.cell.y, daten.cell.height, `tabelle-${daten.section}`),
      ...optionen,
    })
    const ende = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    layout.nachTabelle(ende?.finalY ?? layout.y)
  }

  // --- Titel ------------------------------------------------------------
  // Der Briefbogen kennt den Bericht nicht; ohne diese Zeile hätte die Seite
  // keine Überschrift.
  layout.zeile('Baustellenbericht', TITEL, 'titel')
  layout.abstand(ABSTAND.nachBlock)

  // --- Kopfdaten: zwei Spalten, damit alles auf eine Seite passt ---------
  const kopfPaare: [string, string][] = [
    ['Berichtsnummer', bericht.kopf.berichtsnummer],
    ['Datum', alsAnzeigedatum(bericht.kopf.datum)],
    ['Projekt / Bauvorhaben', bericht.kopf.projekt],
    ['Objekt', [bericht.kopf.objektStrasse, bericht.kopf.objektOrt].filter(Boolean).join(', ')],
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

  // Je Zeile zwei Paare nebeneinander – zehn Einzelzeilen würden die halbe
  // erste Seite fressen, und die ist unter dem Briefkopf ohnehin knapp.
  const kopfZeilen: string[][] = []
  for (let stelle = 0; stelle < kopfPaare.length; stelle += 2) {
    const zeile = kopfPaare
      .slice(stelle, stelle + 2)
      .flatMap(([bezeichnung, wert]) => [bezeichnung, wert.trim() || 'k.A.'])
    while (zeile.length < 4) zeile.push('')
    kopfZeilen.push(zeile)
  }

  tabelle({
    body: kopfZeilen,
    theme: 'grid',
    columnStyles: { 0: BESCHRIFTUNGSSPALTE, 2: BESCHRIFTUNGSSPALTE },
  })

  const absender = absenderzeilen(bericht.absender)
  if (absender.length > 0 && !kopfTraegtAbsender) {
    layout.ueberschrift('Bericht erstellt von')
    for (const zeile of absender) {
      layout.zeile(zeile, { groesse: SCHRIFT.klein, farbe: GRAU }, 'absender')
    }
    layout.abstand(ABSTAND.nachBlock)
  }

  if (bericht.kopf.zweck.trim()) {
    layout.abstand(ZWECK.luftOben)
    layout.ueberschrift('Zweck des Besuchs', ZWECK.ueberschrift)
    for (const zeile of layout.umbrechen(bericht.kopf.zweck, ZWECK.text)) {
      layout.zeile(zeile, ZWECK.text, 'zweck')
    }
    layout.abstand(ZWECK.luftUnten)
  }

  // --- Anwesende --------------------------------------------------------
  const anwesende = bericht.anwesende.filter((person) => person.name.trim())
  if (anwesende.length > 0) {
    layout.ueberschriftVorTabelle('Anwesende')
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
  ].filter(([, wert]) => wert.trim()) as [string, string][]

  if (untergrundPaare.length > 0) {
    layout.ueberschriftVorTabelle('Untergrund')
    tabelle({
      body: untergrundPaare,
      theme: 'grid',
      columnStyles: spaltenbreiten(layout.paarSpalten(1, BESCHRIFTUNG_ANTEIL.einspaltig), true),
    })
  }

  // --- Prüfungen --------------------------------------------------------
  // Nur, was wirklich gemessen wurde. Eine Zeile „k.A." hilft niemandem; dass
  // etwas nicht geprüft wurde, sagt das Fehlen der Zeile deutlich genug.
  const pruefungen = ausgefuellte(bericht.pruefungen)
  if (pruefungen.length > 0) {
    layout.ueberschriftVorTabelle('Prüfungen')

    // Ein Block je Prüfung statt einer Zeile mit allen Werten nebeneinander:
    // beim Haftzug gehört zu jedem Wert sein Bruchbild, und das ist die
    // eigentliche Aussage der Messung.
    for (const pruefung of pruefungen) {
      layout.ueberschriftVorTabelle(pruefung.bezeichnung, ZWISCHENUEBERSCHRIFT)
      const einheit = pruefung.einheit.trim()
      const gemessen = pruefung.messwerte.filter((messwert) => messwert.wert !== null)
      // Nur wo etwas brechen kann: bei Rauhtiefe oder Restfeuchte stünde sonst
      // eine leere Spalte „Bruchbild" im Bericht.
      const mitBruchbild = hatBruchbild(pruefung)
      const wertKopf = einheit ? `Wert [${einheit}]` : 'Wert'

      tabelle({
        head: [mitBruchbild ? ['Nr.', wertKopf, 'Bruchbild / Bemerkung'] : ['Nr.', wertKopf]],
        body: gemessen.map((messwert, nummer) => {
          const zeile = [`${nummer + 1}`, messwertText(messwert.wert)]
          // Leere Bemerkung bleibt leer – ein Strich behauptet, hier fehle etwas.
          return mitBruchbild ? [...zeile, messwert.bemerkung.trim()] : zeile
        }),
        // Der Mittelwert schließt den Block ab; auf Folgeseiten wäre er nur
        // ein Zwischenstand, den es nicht gibt.
        foot: [
          mitBruchbild
            ? [{ content: 'Mittelwert', colSpan: 2 }, mittelwertText(pruefung)]
            : ['Mittelwert', mittelwertText(pruefung)],
        ],
        // Ohne Bruchbild bleibt die Tabelle so schmal wie ihre zwei Spalten.
        tableWidth: mitBruchbild ? 'auto' : 'wrap',
        showFoot: 'lastPage',
        footStyles: {
          fontStyle: 'bold',
          fillColor: false,
          textColor: SCHWARZ,
          // Dünne Linie darüber, sonst liest sich der Mittelwert wie ein
          // weiterer Messwert.
          lineWidth: { top: 0.3, right: 0, bottom: 0, left: 0 },
        },
        columnStyles: spaltenbreiten(layout.messwertSpalten(mitBruchbild)),
      })

      // Mit Beschriftung, sonst steht unter der Tabelle ein Wort ohne Bezug.
      if (pruefung.bemerkung?.trim()) {
        layout.absatz(
          `Bemerkung: ${pruefung.bemerkung.trim()}`,
          { groesse: SCHRIFT.klein, farbe: GRAU },
          'pruefungsbemerkung',
        )
      }
    }
  }

  // --- Klimawerte -------------------------------------------------------
  if (bericht.klima.length > 0) {
    layout.ueberschriftVorTabelle('Klimawerte')
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
      const warnung = `Achtung: Abstand zum Taupunkt unter ${MINDESTABSTAND_TAUPUNKT} K – Beschichtung nicht freigeben.`
      layout.absatz(warnung, { groesse: SCHRIFT.klein, dick: true, farbe: ROT }, 'warnung')
      layout.abstand(ABSTAND.nachBlock)
    }
  }

  // --- Aufbau -----------------------------------------------------------
  if (bericht.aufbau.length > 0) {
    layout.ueberschriftVorTabelle('Aufbau')
    tabelle({
      head: [['Bereich', 'Schicht', 'Produkt', 'Verbrauch', 'Fläche', 'Gesamt', 'Chargen']],
      body: bericht.aufbau.map((zeile) => [
        zeile.bereich,
        zeile.schicht,
        zeile.produkt,
        verbrauchText(zeile.verbrauch),
        zeile.flaeche && `${zeile.flaeche} m²`,
        mengeText(zeile.gesamtmenge),
        chargenText(zeile.chargen),
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
    layout.ueberschrift(titel)
    layout.absatz(inhalt)
  }

  // --- Unterschrift -----------------------------------------------------
  if (bericht.unterschrift) {
    // Bild, Linie und Überschrift gehören zusammen auf eine Seite.
    layout.ensureSpace(UNTERSCHRIFT.hoehe + 20)
    layout.ueberschrift('Unterschrift')
    layout.bild(bericht.unterschrift, 'PNG', UNTERSCHRIFT.breite, UNTERSCHRIFT.hoehe)
    layout.abstand(ABSTAND.nachBlock / 2)
    layout.linie(UNTERSCHRIFT.breite)
    layout.abstand(ABSTAND.nachBlock)
  }

  // --- Fotos: zwei je Seite --------------------------------------------
  if (bericht.fotos.length > 0) {
    layout.neueSeite()
    layout.ueberschrift('Fotos')

    const kastenHoehe = layout.bildkastenHoehe()
    for (const [nummer, foto] of bericht.fotos.entries()) {
      const { breite, hoehe } = einpassen(doc, foto.dataUrl, zonen.breite, kastenHoehe)
      // Bild und Beschriftung nicht trennen.
      layout.ensureSpace(hoehe + BILDTEXT_ABSTAND + 12)
      layout.bild(foto.dataUrl, 'JPEG', breite, hoehe, true)
      layout.abstand(BILDTEXT_ABSTAND)

      const beschriftung = `Bild ${nummer + 1}${foto.beschreibung ? `: ${foto.beschreibung}` : ''}`
      layout.absatz(beschriftung, { groesse: SCHRIFT.klein, farbe: GRAU }, 'bildtext')
      layout.abstand(ABSTAND.nachBlock)
    }
  }

  const seiten = doc.getNumberOfPages()
  for (let seite = 1; seite <= seiten; seite++) {
    doc.setPage(seite)
    fussZeichnen(doc, seite, seiten, zonen, bericht.kopf.berichtsnummer)
  }

  const fertig = doc.output('blob')
  const blob = vorlage?.art === 'pdf' ? await briefbogenUnterlegen(fertig, vorlage) : fertig
  return { blob, protokoll: layout.protokoll, seiten }
}

/**
 * Spaltenbreiten in die Form bringen, die autoTable erwartet. `fett` macht
 * jede zweite Spalte zur Beschriftung.
 */
function spaltenbreiten(breiten: number[], fett = false) {
  return Object.fromEntries(
    breiten.map((cellWidth, spalte) => [
      spalte,
      fett && spalte % 2 === 0 ? { cellWidth, fontStyle: 'bold' as const } : { cellWidth },
    ]),
  )
}

/** Die Angaben, die ohne Briefbogen in den Kopf gehören. */
function kopfangaben(absender: Absender) {
  const teile = (werte: string[], trenner: string) =>
    werte
      .map((wert) => wert.trim())
      .filter(Boolean)
      .join(trenner)

  return {
    marke: 'Sika',
    absenderzeile: teile([absender.firma, absender.strasse, absender.ort], ' · '),
    gespraechspartner: [
      absender.name,
      absender.funktion,
      absender.telefon && `Telefon ${absender.telefon}`,
      absender.email,
    ]
      .map((zeile) => zeile.trim())
      .filter(Boolean),
  }
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
  const faktor = Math.min(PAGE.width / masse.width, PAGE.height / masse.height)
  const breite = masse.width * faktor
  const hoehe = masse.height * faktor
  doc.addImage(
    vorlage.daten,
    bildformat(vorlage.daten),
    (PAGE.width - breite) / 2,
    (PAGE.height - hoehe) / 2,
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
