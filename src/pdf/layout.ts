/**
 * Der Satzspiegel des Briefbogens – und der Rechenknecht, der ihn einhält.
 *
 * Warum eine eigene Datei: Ein Briefbogen hat Zonen, die dem Bogen gehören und
 * nicht dem Bericht – oben das Logo, rechts der Block „Ihr Gesprächspartner",
 * unten der Rechtsblock. Solange die Maße dafür verstreut im Renderer stehen,
 * rutscht früher oder später wieder Text hinein. Hier stehen sie einmal, in
 * Millimetern, ausgemessen an der Word-Vorlage.
 *
 * Die Datei bringt bewusst **keine** Laufzeit-Abhängigkeit mit: jsPDF wird nur
 * als Typ eingebunden. So kann auch `vorlage.ts` (und über sie der
 * Einstellungsbildschirm) die Maße lesen, ohne die PDF-Bibliothek ins
 * Start-Bündel zu ziehen.
 */

import type { jsPDF } from 'jspdf'
import type { Briefvorlage } from '../lib/typen'

// --- Die vermessenen Maße der Vorlage, alles in Millimetern ---------------

/** A4 hochkant. */
export const PAGE = { width: 210, height: 297 } as const

/**
 * Satzspiegel. Links am eigenen Textrand des Bogens (dessen Absenderzeile und
 * Fußblock beginnen bei 25,7 mm Farbe, abzüglich Vorbreite der Glyphe), rechts
 * an dessen Fußblock, der bei 189,8 mm endet.
 */
export const MARGIN = { left: 25.5, right: 20 } as const

/** 210 − 24,5 − 20 */
export const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right

/** Erste Seite: unterhalb Absenderzeile und Gesprächspartner-Block (bis 74,7). */
export const CONTENT_TOP_FIRST = 80

/**
 * Folgeseiten: unterhalb des Logos (das endet bei 31,7). Gilt nur, wenn die
 * Folgeseite auch wirklich nur das Logo trägt – siehe `zonenFuer`.
 */
export const CONTENT_TOP_NEXT = 45

/** Alle Seiten: oberhalb „INTERNAL" (243,5) mit Sicherheitsabstand. */
export const CONTENT_BOTTOM = 240

/** Sika-Logo mit „BUILDING TRUST", oben rechts. */
export const LOGO = { x: 139.9, y: 13.9, width: 53.6, height: 17.8 } as const

/** „Ihr Gesprächspartner" – rechte Spalte über dem Textbereich. */
export const CONTACT_BLOCK = { x: 139.5, y: 49.8, width: 56.1, bottom: 74.7 } as const

/**
 * „Sika Deutschland CH AG & Co KG, …" – die kleine Zeile über dem Anschriftfeld.
 * `y` ist die Oberkante der Zeile, nicht die Grundlinie.
 */
export const SENDER_LINE = { x: MARGIN.left, y: 49.8 } as const

/** Ab hier gehört die Seite dem Bogen: erst „INTERNAL", darunter der Rechtsblock. */
export const FOOTER_TOP = 243.5

/**
 * Grundlinie der eigenen Fußzeile (Berichtsnummer, „Seite X von Y").
 * Sie sitzt in der Lücke zwischen Inhaltsende und Rechtsblock – der einzige
 * Streifen, der auf jedem Bogen frei ist.
 */
export const FOOTER_BASELINE = FOOTER_TOP - 1

// --- Schrift und Farbe ----------------------------------------------------

const PT_IN_MM = 25.4 / 72

/** Zeilenabstand als Vielfaches der Schriftgröße – so gesetzt wie bisher. */
const ZEILENFAKTOR = 1.42

export const SCHRIFT = {
  titel: 16,
  ueberschrift: 13,
  text: 11,
  tabelle: 10,
  klein: 10,
  fusszeile: 8,
  kopfzeile: 8,
} as const

export type Farbe = [number, number, number]

export const GELB: Farbe = [255, 196, 0]
export const SCHWARZ: Farbe = [26, 26, 26]
export const ROT: Farbe = [208, 2, 27]
export const GRAU: Farbe = [107, 114, 128]

/** Höhe einer Textzeile in Millimetern. */
export function zeilenhoehe(groesse: number): number {
  return groesse * PT_IN_MM * ZEILENFAKTOR
}

/**
 * jsPDF setzt Text auf die Grundlinie, gerechnet wird hier aber mit
 * Streifen-Oberkanten. Die Umrechnung steht deshalb an genau einer Stelle.
 */
export function grundlinie(oben: number, groesse: number): number {
  return oben + groesse * PT_IN_MM
}

/** Abstände zwischen den Blöcken. */
export const ABSTAND = {
  nachUeberschrift: 2.5,
  nachAbsatz: 3,
  nachTabelle: 8,
  nachBlock: 5,
} as const

/** Höhe einer Tabellenzeile samt Innenabstand – Grundlage des Witwenschutzes. */
const TABELLENZEILE = SCHRIFT.tabelle * PT_IN_MM * ZEILENFAKTOR + 4

/** Platz, den eine Bildunterschrift unter einem Foto bekommt. */
const BILDTEXT_PLATZ = 18

/** Kleinste sinnvolle Höhe eines Fotokastens. */
const BILD_MINDESTHOEHE = 60

export type Stil = { groesse: number; dick?: boolean; farbe?: Farbe; zentriert?: boolean }

export const TEXT: Stil = { groesse: SCHRIFT.text }
export const UEBERSCHRIFT: Stil = { groesse: SCHRIFT.ueberschrift, dick: true }
export const TITEL: Stil = { groesse: SCHRIFT.titel, dick: true }
/** Überschrift innerhalb eines Abschnitts, z. B. je Prüfung. */
export const ZWISCHENUEBERSCHRIFT: Stil = { groesse: SCHRIFT.text, dick: true }

/**
 * Spaltenbreiten der Messwerttabelle in Millimetern; der Rest bleibt der
 * Bemerkung. Ohne Bruchbildspalte trägt die erste Spalte die Beschriftung
 * „Mittelwert" und braucht dafür etwas mehr als eine laufende Nummer.
 */
export const MESSWERT_SPALTEN = { nummer: 15, wert: 35, nummerAllein: 25 } as const

// --- Zonen ----------------------------------------------------------------

/**
 * Der freie Bereich einer Seite. `unten` ist eine Y-Koordinate (nicht ein Rand
 * von unten), weil im Renderer nur so gerechnet wird: „passt der Block noch
 * über die Grenze?"
 */
export type Zonen = {
  links: number
  rechts: number
  breite: number
  obenErste: number
  obenFolge: number
  unten: number
  /** Grundlinie der eigenen Fußzeile. */
  fusszeile: number
}

/** Die Zonen des Sika-Bogens – der Normalfall. */
export const SIKA_ZONEN: Zonen = {
  links: MARGIN.left,
  rechts: MARGIN.right,
  breite: CONTENT_WIDTH,
  obenErste: CONTENT_TOP_FIRST,
  obenFolge: CONTENT_TOP_NEXT,
  unten: CONTENT_BOTTOM,
  fusszeile: FOOTER_BASELINE,
}

/**
 * Zonen für einen Lauf.
 *
 * Ohne hinterlegte Vorlage gelten die vermessenen Maße. Ein hochgeladener
 * Briefbogen bringt eigene Ränder mit, die in den Einstellungen einstellbar
 * sind – aber nur in eine Richtung: Er darf **mehr** Platz verlangen, keinen
 * freigeben. Sonst hängt es an einer Einstellung, ob der Bericht über die
 * Absenderzeile oder den Rechtsblock läuft, und eine Vorlage aus der Zeit vor
 * dieser Messung würde beides tun.
 *
 * Seitlich gilt das nicht: dort verdeckt ein zu breiter Satz nichts, und ein
 * fremder Bogen hat sein eigenes Maß.
 */
export function zonenFuer(vorlage?: Briefvorlage): Zonen {
  if (!vorlage) return { ...SIKA_ZONEN }

  const unten = Math.min(PAGE.height - vorlage.randUnten, CONTENT_BOTTOM)
  const obenErste = Math.max(vorlage.randOben, CONTENT_TOP_FIRST)
  /**
   * Ein einseitiger Bogen, der auf jeder Seite gedruckt wird, trägt dort auch
   * Absenderzeile und Gesprächspartner – dann gilt auf den Folgeseiten
   * derselbe Abstand wie auf der ersten. Nur ein Bogen mit eigener Folgeseite
   * (oder gar keinem Kopf) gibt den Platz oberhalb frei.
   */
  const wiederholtDenKopf = vorlage.seiten === 1 && vorlage.ersteSeiteWiederholen

  return {
    links: vorlage.randLinks,
    rechts: vorlage.randRechts,
    breite: PAGE.width - vorlage.randLinks - vorlage.randRechts,
    obenErste,
    obenFolge: wiederholtDenKopf
      ? obenErste
      : Math.max(vorlage.randObenFolgeseiten, CONTENT_TOP_NEXT),
    unten,
    // Derselbe Sicherheitsabstand wie beim Sika-Bogen, nur relativ zum
    // Inhaltsende dieses Bogens.
    fusszeile: unten + (FOOTER_BASELINE - CONTENT_BOTTOM),
  }
}

// --- Der Schreibzeiger ----------------------------------------------------

/** Ein gezeichneter Block – Grundlage der Layout-Tests. */
export type Protokolleintrag = { seite: number; y: number; hoehe: number; was: string }

/** Wird nach jedem Seitenwechsel gerufen: Briefbogen beziehungsweise Kopfzeile. */
export type Seitenanfang = (seite: number) => void

/**
 * Hält die Schreibposition und sorgt dafür, dass kein Block über
 * `zonen.unten` hinausläuft. Der Renderer zählt `y` nirgends selbst hoch –
 * er fragt nach Platz und bekommt die Oberkante zurück.
 */
export class PdfLayout {
  /** Jeder reservierte Streifen, in der Reihenfolge des Zeichnens. */
  readonly protokoll: Protokolleintrag[] = []

  readonly zonen: Zonen

  private readonly doc: jsPDF
  private readonly seitenanfang: Seitenanfang
  private oben: number

  constructor(doc: jsPDF, zonen: Zonen, seitenanfang: Seitenanfang) {
    this.doc = doc
    this.zonen = zonen
    this.seitenanfang = seitenanfang
    this.oben = zonen.obenErste
    this.seitenanfang(this.seite)
  }

  /** Aktuelle Schreibposition (Oberkante des nächsten Blocks). */
  get y(): number {
    return this.oben
  }

  get seite(): number {
    return this.doc.getCurrentPageInfo().pageNumber
  }

  /**
   * Sorgt dafür, dass `hoehe` Millimeter frei sind, und gibt die Oberkante
   * zurück – ohne sie schon zu belegen. Für Blöcke, die selbst wissen, wie
   * viel sie am Ende brauchen (Tabellen), und als Witwenschutz.
   */
  ensureSpace(hoehe: number): number {
    if (this.oben + hoehe > this.zonen.unten) this.neueSeite()
    return this.oben
  }

  /**
   * Wie `ensureSpace`, belegt den Streifen aber und schreibt ihn ins
   * Protokoll. Rückgabe ist die Oberkante, an der gezeichnet werden darf.
   */
  platz(hoehe: number, was = 'block'): number {
    const oben = this.ensureSpace(hoehe)
    this.notieren(oben, hoehe, was)
    this.oben = oben + hoehe
    return oben
  }

  /**
   * Luft zwischen zwei Blöcken. Bricht bewusst nie um: ein Abstand am
   * Seitenfuß ist keiner mehr, und eine leere Folgeseite wäre der schlechtere
   * Tausch.
   */
  abstand(millimeter: number): void {
    this.oben = Math.min(this.oben + millimeter, this.zonen.unten)
  }

  neueSeite(): void {
    this.doc.addPage()
    this.seitenanfang(this.seite)
    this.oben = this.zonen.obenFolge
  }

  notieren(y: number, hoehe: number, was: string): void {
    this.protokoll.push({ seite: this.seite, y, hoehe, was })
  }

  /** Eine Textzeile, umbruchsicher. Wahlweise mittig über die Inhaltsbreite. */
  zeile(text: string, stil: Stil = TEXT, was = 'zeile'): void {
    const oben = this.platz(zeilenhoehe(stil.groesse), was)
    this.stift(stil)
    const x = stil.zentriert ? this.zonen.links + this.zonen.breite / 2 : this.zonen.links
    this.doc.text(
      text,
      x,
      grundlinie(oben, stil.groesse),
      stil.zentriert ? { align: 'center' } : undefined,
    )
  }

  /** Text auf die Inhaltsbreite umbrechen. */
  umbrechen(text: string, stil: Stil = TEXT): string[] {
    this.stift(stil)
    return this.doc.splitTextToSize(text, this.zonen.breite) as string[]
  }

  /** Mehrzeiliger Absatz – läuft zeilenweise über so viele Seiten wie nötig. */
  absatz(text: string, stil: Stil = TEXT, was = 'absatz'): void {
    for (const zeile of this.umbrechen(text, stil)) this.zeile(zeile, stil, was)
    this.abstand(ABSTAND.nachAbsatz)
  }

  /**
   * Überschrift. Verlangt zusätzlich Platz für die erste Folgezeile: eine
   * Überschrift allein am Seitenfuß ist eine verlorene Zeile.
   */
  ueberschrift(text: string, stil: Stil = UEBERSCHRIFT): void {
    this.ensureSpace(zeilenhoehe(stil.groesse) + zeilenhoehe(SCHRIFT.text))
    this.zeile(text, stil, 'ueberschrift')
    this.abstand(ABSTAND.nachUeberschrift)
  }

  /**
   * Überschrift, die zu einer Tabelle gehört.
   *
   * Beide gehen zusammen auf die nächste Seite oder gar nicht: eine Überschrift
   * mit gelber Kopfzeile darunter und der ersten Wertzeile auf der Folgeseite
   * sagt niemandem etwas.
   */
  ueberschriftVorTabelle(text: string, stil: Stil = UEBERSCHRIFT): void {
    this.ensureSpace(
      zeilenhoehe(stil.groesse) + ABSTAND.nachUeberschrift + this.tabellenMindesthoehe(),
    )
    this.zeile(text, stil, 'ueberschrift')
    this.abstand(ABSTAND.nachUeberschrift)
  }

  /** Kopfzeile plus erste Wertzeile – weniger lohnt am Seitenfuß nicht. */
  tabellenMindesthoehe(zeilen = 2): number {
    return zeilen * TABELLENZEILE
  }

  /** Bild mit fester Größe, wahlweise mittig im Satzspiegel. */
  bild(
    dataUrl: string,
    format: 'JPEG' | 'PNG',
    breite: number,
    hoehe: number,
    mittig = false,
  ): void {
    const oben = this.platz(hoehe, 'bild')
    const x = mittig ? this.zonen.links + (this.zonen.breite - breite) / 2 : this.zonen.links
    this.doc.addImage(dataUrl, format, x, oben, breite, hoehe)
  }

  /** Waagerechte Linie über eine Teilbreite – für die Unterschrift. */
  linie(breite: number, farbe: Farbe = GRAU): void {
    const oben = this.platz(0.5, 'linie')
    this.doc.setDrawColor(...farbe)
    this.doc.setLineWidth(0.3)
    this.doc.line(this.zonen.links, oben, this.zonen.links + breite, oben)
  }

  /**
   * Ränder und Startpunkt für autoTable. `bottom` ist der Abstand zur
   * Blattunterkante – so rechnet autoTable – und hält die Tabelle damit
   * genauso über `zonen.unten` wie alles andere.
   */
  tabellenRahmen(): {
    startY: number
    margin: { left: number; right: number; top: number; bottom: number }
  } {
    this.ensureSpace(this.tabellenMindesthoehe())
    return {
      startY: this.oben,
      margin: {
        left: this.zonen.links,
        right: this.zonen.rechts,
        top: this.zonen.obenFolge,
        bottom: PAGE.height - this.zonen.unten,
      },
    }
  }

  /**
   * Spaltenbreiten für eine Tabelle aus Bezeichnung/Wert-Paaren:
   * `paare` Paare nebeneinander, die Beschriftung bekommt `anteil` davon.
   * Ergibt [Bezeichnung, Wert, Bezeichnung, Wert, …] über die volle Breite.
   */
  paarSpalten(paare = 1, anteil = 0.33): number[] {
    const paarBreite = this.zonen.breite / paare
    const bezeichnung = paarBreite * anteil
    return Array.from({ length: paare }, () => [bezeichnung, paarBreite - bezeichnung]).flat()
  }

  /**
   * Spaltenbreiten der Messwerttabelle: Nr., Wert, Bruchbild. Die Bemerkung
   * bekommt, was übrig bleibt – auf dem Sika-Bogen also 115,5 mm. Ohne
   * Bruchbild bleiben zwei schmale Spalten; die Tabelle wird dann nicht auf
   * volle Breite gezogen.
   */
  messwertSpalten(mitBruchbild = true): number[] {
    const { nummer, wert, nummerAllein } = MESSWERT_SPALTEN
    if (!mitBruchbild) return [nummerAllein, wert]
    return [nummer, wert, this.zonen.breite - nummer - wert]
  }

  /**
   * Schreibzeiger hinter eine fertig gesetzte Tabelle stellen.
   *
   * Es zählt allein, wo die Tabelle aufgehört hat: hat sie umgebrochen, steht
   * ihr Ende auf einer neuen Seite und damit weiter oben als der Zeiger vorher.
   */
  nachTabelle(endeY: number): void {
    this.oben = endeY
    this.abstand(ABSTAND.nachTabelle)
  }

  /**
   * Höhe eines Fotokastens, wenn zwei Bilder samt Beschriftung auf eine Seite
   * sollen.
   */
  bildkastenHoehe(): number {
    const halbeSeite = (this.zonen.unten - this.zonen.obenFolge) / 2 - BILDTEXT_PLATZ
    return Math.max(BILD_MINDESTHOEHE, halbeSeite)
  }

  private stift(stil: Stil): void {
    this.doc.setFont('helvetica', stil.dick ? 'bold' : 'normal')
    this.doc.setFontSize(stil.groesse)
    this.doc.setTextColor(...(stil.farbe ?? SCHWARZ))
  }
}

// --- Kopf und Fuß ---------------------------------------------------------

export type Kopfangaben = {
  /** Kürzel im Logofeld. */
  marke: string
  /** Kleine Absenderzeile über dem Anschriftfeld. */
  absenderzeile: string
  /** „Ihr Gesprächspartner": Name, Funktion, Telefon, E-Mail. */
  gespraechspartner: string[]
}

/** Maße des Markenfeldes im Logobereich – unten rechts, wie auf dem Bogen. */
const MARKE = { breite: 28, hoehe: 13 }

/**
 * Die eigene Kopfzeile – nur nötig, wenn kein Briefbogen hinterlegt ist.
 * Der Bericht soll trotzdem so aussehen, als läge einer darunter: dieselben
 * Zonen, dieselben Positionen.
 *
 * Logo auf jeder Seite, Absenderzeile und Gesprächspartner nur auf Seite 1 –
 * genau wie auf dem gedruckten Bogen.
 */
export function kopfZeichnen(doc: jsPDF, seite: number, angaben: Kopfangaben): void {
  doc.setFillColor(...GELB)
  doc.rect(
    LOGO.x + LOGO.width - MARKE.breite,
    LOGO.y + LOGO.height - MARKE.hoehe,
    MARKE.breite,
    MARKE.hoehe,
    'F',
  )
  doc.setTextColor(...SCHWARZ)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(SCHRIFT.titel)
  doc.text(
    angaben.marke,
    LOGO.x + LOGO.width - MARKE.breite + 3,
    LOGO.y + LOGO.height - MARKE.hoehe / 2 + 2,
  )

  if (seite !== 1) return

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(SCHRIFT.kopfzeile)
  doc.setTextColor(...GRAU)
  if (angaben.absenderzeile) {
    doc.text(angaben.absenderzeile, SENDER_LINE.x, grundlinie(SENDER_LINE.y, SCHRIFT.kopfzeile))
  }

  if (angaben.gespraechspartner.length === 0) return

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SCHWARZ)
  let y = grundlinie(CONTACT_BLOCK.y, SCHRIFT.kopfzeile)
  doc.text('Ihr Gesprächspartner', CONTACT_BLOCK.x, y)
  y += zeilenhoehe(SCHRIFT.kopfzeile)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAU)
  for (const eintrag of angaben.gespraechspartner) {
    for (const zeile of doc.splitTextToSize(eintrag, CONTACT_BLOCK.width) as string[]) {
      // Der Block hat ein festes Ende; was nicht hineinpasst, bleibt lieber
      // weg, als in den Satzspiegel zu rutschen.
      if (y > CONTACT_BLOCK.bottom) return
      doc.text(zeile, CONTACT_BLOCK.x, y)
      y += zeilenhoehe(SCHRIFT.kopfzeile)
    }
  }
}

/**
 * Fußzeile: Berichtsnummer und Seitenzahl. Wird erst am Ende gezeichnet, weil
 * die Gesamtseitenzahl vorher nicht feststeht.
 */
export function fussZeichnen(
  doc: jsPDF,
  seite: number,
  gesamt: number,
  zonen: Zonen,
  berichtsnummer: string,
): void {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(SCHRIFT.fusszeile)
  doc.setTextColor(...GRAU)
  if (berichtsnummer) doc.text(`Bericht ${berichtsnummer}`, zonen.links, zonen.fusszeile)
  doc.text(`Seite ${seite} von ${gesamt}`, PAGE.width - zonen.rechts, zonen.fusszeile, {
    align: 'right',
  })
}
