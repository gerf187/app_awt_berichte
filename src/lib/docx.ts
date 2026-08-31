import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  HorizontalPositionRelativeFrom,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  TextWrappingType,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx'
import { chargenText } from './aufbau'
import { absenderzeilen, alsAnzeigedatum, kommazahl } from './bericht'
import { ausgefuellte, hatBruchbild, messwertText, mittelwertText } from './pruefungen'
import { mengeAnzeigen, verbrauchAnzeigen, zahlLesen } from './verbrauch'
import { MINDESTABSTAND_TAUPUNKT } from './taupunkt'
import { A4, satzspiegel } from './vorlage'
import type { Bericht, Briefvorlage, Foto } from './typen'

/**
 * Word-Ausgabe (.docx) mit demselben Inhalt wie die PDF.
 *
 * Word ist der Weg für Kollegen, die den Bericht noch ergänzen wollen –
 * die PDF bleibt das Dokument für den Kunden.
 *
 * **Briefbogen:** Ein als Bild hinterlegter Briefbogen wird als hinterlegte
 * Grafik in die Word-Kopfzeile gelegt. Eine PDF-Vorlage kann Word nicht
 * einbetten – dann bleibt es bei der schlichten eigenen Kopfzeile, die PDF
 * steht trotzdem auf dem Briefbogen.
 */

/** Millimeter in Twips (1 mm = 56,6929 twip) – Word rechnet so. */
function mmInTwips(mm: number): number {
  return Math.round(mm * 56.6929)
}

/** Millimeter in EMU (1 mm = 36.000 EMU) – für frei stehende Grafiken. */
function mmInEmu(mm: number): number {
  return Math.round(mm * 36000)
}

const GELB = 'FFC400'
const ROT = 'D0021B'
const GRAU = '6B7280'

/** Breite des Textbereichs in Bildpunkten (A4 minus Ränder, 96 dpi). */
const TEXTBREITE_PX = 600
/** Höchste Bildhöhe, damit zwei Fotos auf eine Seite passen. */
const MAX_BILDHOEHE_PX = 420

export async function docxErzeugen(bericht: Bericht, vorlage?: Briefvorlage): Promise<Blob> {
  // Nur ein Bild lässt sich in Word hinterlegen; eine PDF-Vorlage nicht.
  const briefbogen = vorlage?.art === 'bild' ? vorlage : undefined
  const rand = satzspiegel(briefbogen)

  const inhalt: (Paragraph | Table)[] = [
    ...(briefbogen
      ? [new Paragraph({ text: 'Baustellenbericht', heading: HeadingLevel.HEADING_1 })]
      : []),
    ...kopfdaten(bericht),
    ...anwesende(bericht),
    ...untergrund(bericht),
    ...pruefungen(bericht),
    ...klima(bericht),
    ...aufbau(bericht),
    ...freitexte(bericht),
    ...unterschrift(bericht),
    ...fotos(bericht),
  ]

  const dokument = new Document({
    creator: 'Baustellenbericht',
    title: `Baustellenbericht ${bericht.kopf.berichtsnummer}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              // Word kennt nur einen oberen Rand je Abschnitt. Genommen wird
              // der größere der beiden – lieber etwas Luft auf Seite 2 als
              // Text im Briefkopf.
              top: mmInTwips(rand.obenErste),
              right: mmInTwips(rand.rechts),
              bottom: mmInTwips(rand.unten),
              left: mmInTwips(rand.links),
            },
          },
          // Getrennte Kopfzeile für Seite 1, damit ein einseitiger Briefbogen
          // nicht auf jeder Folgeseite wieder auftaucht.
          titlePage: briefbogen !== undefined,
        },
        headers: briefbogen
          ? {
              first: new Header({ children: [briefbogenAbsatz(briefbogen)] }),
              default: new Header({
                children: [
                  briefbogen.ersteSeiteWiederholen
                    ? briefbogenAbsatz(briefbogen)
                    : new Paragraph({ text: '' }),
                ],
              }),
            }
          : {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Sika', bold: true, highlight: 'yellow' }),
                      new TextRun({ text: '   Baustellenbericht', bold: true, size: 32 }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GELB } },
                  }),
                ],
              }),
            },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `Bericht ${bericht.kopf.berichtsnummer}`, color: GRAU }),
                  new TextRun({ text: '\tSeite ', color: GRAU }),
                  new TextRun({ children: [PageNumber.CURRENT], color: GRAU }),
                  new TextRun({ text: ' von ', color: GRAU }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GRAU }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        children: inhalt,
      },
    ],
  })

  return Packer.toBlob(dokument)
}

/**
 * Der Briefbogen als frei stehende Grafik hinter dem Text.
 *
 * Er hängt an der Kopfzeile und an der Seite (nicht am Textrahmen), liegt
 * hinter dem Dokument und umfließt nichts – so verschiebt er keine Zeile.
 */
function briefbogenAbsatz(vorlage: Briefvorlage): Paragraph {
  const daten = ausDataUrl(vorlage.daten)
  const istPng = vorlage.daten.startsWith('data:image/png')
  const masse = (istPng ? pngMasse(daten) : jpegMasse(daten)) ?? { breite: 210, hoehe: 297 }

  // Seitenverhältnis erhalten und mittig auf die A4-Seite setzen.
  const faktor = Math.min(A4.breite / masse.breite, A4.hoehe / masse.hoehe)
  const breite = masse.breite * faktor
  const hoehe = masse.hoehe * faktor

  return new Paragraph({
    children: [
      new ImageRun({
        type: istPng ? 'png' : 'jpg',
        data: daten,
        // Word rechnet die Anzeigegröße in Bildpunkten zu 96 dpi.
        transformation: {
          width: Math.round((breite / 25.4) * 96),
          height: Math.round((hoehe / 25.4) * 96),
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            offset: mmInEmu((A4.breite - breite) / 2),
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            offset: mmInEmu((A4.hoehe - hoehe) / 2),
          },
          behindDocument: true,
          allowOverlap: true,
          wrap: { type: TextWrappingType.NONE },
        },
      }),
    ],
  })
}

/** Maße aus dem IHDR-Block einer PNG-Datei. */
function pngMasse(daten: Uint8Array): { breite: number; hoehe: number } | null {
  if (daten.length < 24 || daten[0] !== 0x89 || daten[1] !== 0x50) return null
  const zahl = (start: number) =>
    (daten[start] << 24) + (daten[start + 1] << 16) + (daten[start + 2] << 8) + daten[start + 3]
  return { breite: zahl(16), hoehe: zahl(20) }
}

/**
 * Luft um den Zweck des Besuchs, in Millimetern – dieselben Maße wie in der
 * PDF-Ausgabe.
 */
const ZWECK_LUFT = { oben: 4, unten: 6 }

function ueberschrift(text: string, zentriert = false, luftOben?: number): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    alignment: zentriert ? AlignmentType.CENTER : undefined,
    spacing: { before: luftOben === undefined ? 300 : mmInTwips(luftOben), after: 120 },
  })
}

function absatz(text: string): Paragraph[] {
  // Zeilenumbrüche des Nutzers erhalten – er hat sie bewusst gesetzt.
  return text
    .split('\n')
    .map((zeile) => new Paragraph({ children: [new TextRun(zeile)], spacing: { after: 80 } }))
}

/** Tabelle über die volle Breite; die erste Zeile ist wahlweise Kopfzeile. */
function tabelle(
  zeilen: string[][],
  mitKopfzeile: boolean,
  rotesZeilen: number[] = [],
  fetteZeilen: number[] = [],
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: zeilen.map((zelleninhalt, index) => {
      const istKopf = mitKopfzeile && index === 0
      const istRot = rotesZeilen.includes(index)
      const istFett = fetteZeilen.includes(index)
      return new TableRow({
        tableHeader: istKopf,
        children: zelleninhalt.map(
          (text) =>
            new TableCell({
              shading: istKopf ? { fill: GELB } : undefined,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      bold: istKopf || istRot || istFett,
                      color: istRot ? ROT : undefined,
                    }),
                  ],
                }),
              ],
            }),
        ),
      })
    }),
  })
}

function kopfdaten(bericht: Bericht): (Paragraph | Table)[] {
  const paare: [string, string][] = [
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

  const teile: (Paragraph | Table)[] = [
    tabelle(
      paare.map(([bezeichnung, wert]) => [bezeichnung, wert.trim() || 'k.A.']),
      false,
    ),
  ]

  const absender = absenderzeilen(bericht.absender)
  if (absender.length > 0) {
    teile.push(
      ueberschrift('Bericht erstellt von'),
      ...absender.map(
        (zeile) =>
          new Paragraph({
            children: [new TextRun({ text: zeile, size: 20, color: GRAU })],
            spacing: { after: 40 },
          }),
      ),
    )
  }

  if (bericht.kopf.zweck.trim()) {
    // Mittig und fett wie in der PDF – der Zweck ist die Überschrift über
    // allem, was danach kommt.
    const zeilen = bericht.kopf.zweck.split('\n')
    teile.push(
      ueberschrift('Zweck des Besuchs', true, ZWECK_LUFT.oben),
      ...zeilen.map(
        (zeile, index) =>
          new Paragraph({
            children: [new TextRun({ text: zeile, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: index === zeilen.length - 1 ? mmInTwips(ZWECK_LUFT.unten) : 80 },
          }),
      ),
    )
  }
  return teile
}

function anwesende(bericht: Bericht): (Paragraph | Table)[] {
  const personen = bericht.anwesende.filter((person) => person.name.trim())
  if (personen.length === 0) return []
  return [
    ueberschrift('Anwesende'),
    tabelle(
      [
        ['Name', 'Firma', 'Funktion'],
        ...personen.map((person) => [person.name, person.firma, person.funktion]),
      ],
      true,
    ),
  ]
}

function untergrund(bericht: Bericht): (Paragraph | Table)[] {
  const beschreibung = (
    [
      ['Art', bericht.untergrund.art],
      ['Vorbereitung', bericht.untergrund.vorbereitung],
      ['Bemerkung', bericht.untergrund.bemerkung],
    ] as [string, string][]
  ).filter(([, wert]) => wert.trim())

  if (beschreibung.length === 0) return []
  return [ueberschrift('Untergrund'), tabelle(beschreibung, false)]
}

/**
 * Gemessene Werte – ungemessene Prüfungen stehen gar nicht erst im Bericht.
 *
 * Ein Block je Prüfung, wie in der PDF: zu jedem Wert gehört sein Bruchbild.
 */
function pruefungen(bericht: Bericht): (Paragraph | Table)[] {
  const gemessen = ausgefuellte(bericht.pruefungen)
  if (gemessen.length === 0) return []

  const teile: (Paragraph | Table)[] = [ueberschrift('Prüfungen')]
  for (const pruefung of gemessen) {
    const werte = pruefung.messwerte.filter((messwert) => messwert.wert !== null)
    const einheit = pruefung.einheit.trim()
    // Wie in der PDF: die Spalte gibt es nur, wo etwas brechen kann.
    const mitBruchbild = hatBruchbild(pruefung)
    const wertKopf = einheit ? `Wert [${einheit}]` : 'Wert'
    const spalte = (inhalt: string[]) => (mitBruchbild ? inhalt : inhalt.slice(0, 2))

    teile.push(
      new Paragraph({
        children: [new TextRun({ text: pruefung.bezeichnung, bold: true })],
        spacing: { before: 200, after: 80 },
      }),
      tabelle(
        [
          spalte(['Nr.', wertKopf, 'Bruchbild / Bemerkung']),
          ...werte.map((messwert, nummer) =>
            spalte([`${nummer + 1}`, messwertText(messwert.wert), messwert.bemerkung.trim()]),
          ),
          spalte(['Mittelwert', mittelwertText(pruefung), '']),
        ],
        true,
        [],
        // Die Mittelwertzeile schließt die Tabelle ab und steht fett.
        [werte.length + 1],
      ),
    )

    if (pruefung.bemerkung?.trim()) teile.push(...absatz(pruefung.bemerkung.trim()))
  }
  return teile
}

function klima(bericht: Bericht): (Paragraph | Table)[] {
  if (bericht.klima.length === 0) return []

  const zeilen = [
    ['Uhrzeit', 'Luft °C', 'Untergrund °C', 'rF %', 'Taupunkt °C', 'Abstand K'],
    ...bericht.klima.map((messung) => [
      messung.uhrzeit,
      messung.luft.toString(),
      messung.boden.toString(),
      messung.feuchte.toString(),
      kommazahl(messung.taupunkt),
      kommazahl(messung.abstandTaupunkt),
    ]),
  ]

  // +1, weil die Kopfzeile die erste Zeile der Tabelle ist.
  const rot = bericht.klima
    .map((messung, index) => (messung.warnung ? index + 1 : -1))
    .filter((index) => index > 0)

  const teile: (Paragraph | Table)[] = [ueberschrift('Klimawerte'), tabelle(zeilen, true, rot)]

  if (rot.length > 0) {
    teile.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: `Achtung: Abstand zum Taupunkt unter ${MINDESTABSTAND_TAUPUNKT} K – Beschichtung nicht freigeben.`,
            bold: true,
            color: ROT,
          }),
        ],
      }),
    )
  }
  return teile
}

function aufbau(bericht: Bericht): (Paragraph | Table)[] {
  if (bericht.aufbau.length === 0) return []
  return [
    ueberschrift('Aufbau'),
    tabelle(
      [
        ['Bereich', 'Schicht', 'Produkt', 'Verbrauch', 'Fläche', 'Gesamt', 'Chargen'],
        ...bericht.aufbau.map((zeile) => [
          zeile.bereich,
          zeile.schicht,
          zeile.produkt,
          verbrauchText(zeile.verbrauch),
          zeile.flaeche ? `${zeile.flaeche} m²` : '',
          mengeText(zeile.gesamtmenge),
          chargenText(zeile.chargen),
        ]),
      ],
      true,
    ),
  ]
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

function freitexte(bericht: Bericht): Paragraph[] {
  const bloecke: [string, string][] = [
    ['Ausgeführte Arbeiten', bericht.text.ausgefuehrteArbeiten],
    ['Besprochenes', bericht.text.besprochenes],
    ['Mängel / Auffälligkeiten', bericht.text.maengel],
    ['Empfehlung', bericht.text.empfehlung],
    ['Offene Fragen', bericht.text.offeneFragen],
  ]
  return bloecke
    .filter(([, text]) => text.trim())
    .flatMap(([titel, text]) => [ueberschrift(titel), ...absatz(text)])
}

function unterschrift(bericht: Bericht): Paragraph[] {
  if (!bericht.unterschrift) return []
  return [
    ueberschrift('Unterschrift'),
    new Paragraph({
      children: [
        new ImageRun({
          type: 'png',
          data: ausDataUrl(bericht.unterschrift),
          transformation: { width: 280, height: 100 },
        }),
      ],
    }),
  ]
}

function fotos(bericht: Bericht): Paragraph[] {
  if (bericht.fotos.length === 0) return []

  return [
    ueberschrift('Fotos'),
    ...bericht.fotos.flatMap((foto, nummer) => bildAbsatz(foto, nummer)),
  ]
}

function bildAbsatz(foto: Foto, nummer: number): Paragraph[] {
  const daten = ausDataUrl(foto.dataUrl)
  // Ohne lesbaren JPEG-Kopf das übliche Kameraformat annehmen.
  const masse = jpegMasse(daten) ?? { breite: 4, hoehe: 3 }
  // In den Kasten aus Textbreite und halber Seitenhöhe einpassen,
  // damit zwei Fotos je Seite Platz haben.
  const faktor = Math.min(TEXTBREITE_PX / masse.breite, MAX_BILDHOEHE_PX / masse.hoehe)
  const breite = Math.round(masse.breite * faktor)
  const hoehe = Math.round(masse.hoehe * faktor)

  return [
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new ImageRun({
          type: 'jpg',
          data: daten,
          transformation: { width: breite, height: hoehe },
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Bild ${nummer + 1}${foto.beschreibung ? `: ${foto.beschreibung}` : ''}`,
          color: GRAU,
          size: 18,
        }),
      ],
    }),
  ]
}

/** JPEG-Kopf nach den Bildmaßen durchsuchen (SOF0…SOF15, ohne SOF4/8/12). */
function jpegMasse(daten: Uint8Array): { breite: number; hoehe: number } | null {
  let stelle = 2
  while (stelle + 9 < daten.length) {
    if (daten[stelle] !== 0xff) {
      stelle++
      continue
    }
    const kennung = daten[stelle + 1]
    const laenge = (daten[stelle + 2] << 8) + daten[stelle + 3]
    const istSOF = kennung >= 0xc0 && kennung <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(kennung)
    if (istSOF) {
      return {
        hoehe: (daten[stelle + 5] << 8) + daten[stelle + 6],
        breite: (daten[stelle + 7] << 8) + daten[stelle + 8],
      }
    }
    stelle += 2 + laenge
  }
  return null
}

/** Data-URL in Bytes umwandeln – ohne Netzwerk, ohne fetch. */
function ausDataUrl(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const roh = atob(base64)
  const bytes = new Uint8Array(roh.length)
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i)
  return bytes
}
