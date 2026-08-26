import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { absenderzeilen, alsAnzeigedatum, kommazahl } from './bericht'
import { MINDESTABSTAND_TAUPUNKT } from './taupunkt'
import type { Bericht, Foto } from './typen'

/**
 * Word-Ausgabe (.docx) mit demselben Inhalt wie die PDF.
 *
 * Word ist der Weg für Kollegen, die den Bericht noch ergänzen wollen –
 * die PDF bleibt das Dokument für den Kunden.
 */

const GELB = 'FFC400'
const ROT = 'D0021B'
const GRAU = '6B7280'

/** Breite des Textbereichs in Bildpunkten (A4 minus Ränder, 96 dpi). */
const TEXTBREITE_PX = 600
/** Höchste Bildhöhe, damit zwei Fotos auf eine Seite passen. */
const MAX_BILDHOEHE_PX = 420

export async function docxErzeugen(bericht: Bericht): Promise<Blob> {
  const inhalt: (Paragraph | Table)[] = [
    ...kopfdaten(bericht),
    ...anwesende(bericht),
    ...untergrund(bericht),
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
        properties: {},
        headers: {
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

function ueberschrift(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
  })
}

function absatz(text: string): Paragraph[] {
  // Zeilenumbrüche des Nutzers erhalten – er hat sie bewusst gesetzt.
  return text
    .split('\n')
    .map((zeile) => new Paragraph({ children: [new TextRun(zeile)], spacing: { after: 80 } }))
}

/** Tabelle über die volle Breite; die erste Zeile ist wahlweise Kopfzeile. */
function tabelle(zeilen: string[][], mitKopfzeile: boolean, rotesZeilen: number[] = []): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: zeilen.map((zelleninhalt, index) => {
      const istKopf = mitKopfzeile && index === 0
      const istRot = rotesZeilen.includes(index)
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
                      bold: istKopf || istRot,
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

  const teile: (Paragraph | Table)[] = [
    tabelle(
      paare.map(([bezeichnung, wert]) => [bezeichnung, wert || '–']),
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
    teile.push(ueberschrift('Zweck des Besuchs'), ...absatz(bericht.kopf.zweck))
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
  const paare = (
    [
      ['Art', bericht.untergrund.art],
      ['Vorbereitung', bericht.untergrund.vorbereitung],
      ['Bemerkung', bericht.untergrund.bemerkung],
      ['Restfeuchte (CM-%)', bericht.untergrund.restfeuchteCM],
      ['Haftzugfestigkeit (N/mm²)', bericht.untergrund.haftzugfestigkeit],
    ] as [string, string][]
  ).filter(([, wert]) => wert.trim())

  if (paare.length === 0) return []
  return [ueberschrift('Untergrund'), tabelle(paare, false)]
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
        ['Bereich', 'Schicht', 'Produkt', 'kg/m²', 'Charge', 'm²'],
        ...bericht.aufbau.map((zeile) => [
          zeile.bereich,
          zeile.schicht,
          zeile.produkt,
          zeile.verbrauch,
          zeile.charge,
          zeile.flaeche,
        ]),
      ],
      true,
    ),
  ]
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
