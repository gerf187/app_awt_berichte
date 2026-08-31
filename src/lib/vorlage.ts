/**
 * Der eigene Briefbogen („Briefvorlage").
 *
 * Die Vorlage wird **in der App hochgeladen** und bleibt auf dem Gerät. Sie
 * wird bewusst nicht mit der App ausgeliefert:
 *
 * - Das Repository ist öffentlich; Firmenmaterial gehört dort nicht hinein.
 * - Auf dem Briefbogen stehen Name, Telefonnummer und Anschrift von
 *   Mitarbeitern – personenbezogene Daten (Art. 4 Nr. 1 DSGVO).
 * - Ändert sich die Firmierung, tauscht der Kollege die Datei selbst aus;
 *   dafür braucht es keine neue Programmversion.
 *
 * Hier steht alles, was ohne Browser prüfbar ist – Einlesen, Prüfen, Maße.
 * Das Zeichnen macht `pdf.ts` (PDF) beziehungsweise `docx.ts` (Word).
 */

import { CONTENT_BOTTOM, CONTENT_TOP_FIRST, CONTENT_TOP_NEXT, MARGIN, PAGE } from '../pdf/layout'
import type { Briefvorlage, Einstellungen, VorlagenArt } from './typen'

/** A4 hochkant in Millimetern – das Maß, auf dem alles hier rechnet. */
export const A4 = { breite: 210, hoehe: 297 } as const

/**
 * Größte erlaubte Vorlagendatei. Die Vorlage steckt in jeder Sicherungsdatei
 * mit drin und liegt im Speicher des Handys; ein 40-MB-Scan wäre für einen
 * Briefbogen ohnehin die falsche Datei.
 */
export const MAX_VORLAGE_BYTES = 5 * 1024 * 1024

export const ERLAUBTE_TYPEN = ['application/pdf', 'image/png', 'image/jpeg'] as const

/**
 * Längste Kante, auf die ein Briefbogen als Bild gebracht wird – A4 bei rund
 * 170 dpi. Feiner braucht es niemand, und die Datei steckt am Ende in jedem
 * Bericht und in jeder Sicherung.
 */
export const VORLAGE_MAX_KANTE = 2000
/** JPEG-Qualität des aufbereiteten Briefbogens. */
export const VORLAGE_QUALITAET = 0.85

/**
 * Satzspiegel ohne Vorlage: entspricht dem Bericht, wie ihn die App seit
 * jeher druckt (schmale Ränder, eigene gelbe Kopfzeile).
 */
export const SATZSPIEGEL_OHNE_VORLAGE = {
  links: 15,
  rechts: 15,
  obenErste: 30,
  obenFolge: 30,
  unten: 18,
} as const

/**
 * Vorschlagswerte für einen frisch hochgeladenen Briefbogen: oben viel Platz
 * für Logo und Absenderblock, unten Platz für die Fußzeile mit Bankverbindung.
 * Passt nie auf Anhieb zu jedem Bogen – deshalb sind die Werte einstellbar.
 */
export const STANDARD_RAENDER = {
  randOben: 60,
  randObenFolgeseiten: 40,
  randUnten: 35,
  randLinks: 25,
  randRechts: 20,
} as const

/**
 * Satzspiegel der Sika-Briefvorlage.
 *
 * Die Maße stehen in `src/pdf/layout.ts` – dort, wo auch die PDF-Ausgabe sie
 * liest. Hier werden sie nur in die Form gebracht, die eine gespeicherte
 * Briefvorlage hat (Ränder statt Koordinaten), damit die Schaltfläche in den
 * Einstellungen genau den Satzspiegel setzt, mit dem die PDF ohnehin rechnet.
 */
export const SIKA_RAENDER = {
  randOben: CONTENT_TOP_FIRST,
  randObenFolgeseiten: CONTENT_TOP_NEXT,
  // Nicht der Beginn des Rechtsblocks, sondern der Sicherheitsabstand davor.
  randUnten: PAGE.height - CONTENT_BOTTOM,
  randLinks: MARGIN.left,
  randRechts: MARGIN.right,
} as const

export type Satzspiegel = {
  links: number
  rechts: number
  obenErste: number
  obenFolge: number
  unten: number
}

/** Der Satzspiegel, mit dem PDF und Word rechnen. */
export function satzspiegel(vorlage?: Briefvorlage): Satzspiegel {
  if (!vorlage) return { ...SATZSPIEGEL_OHNE_VORLAGE }
  return {
    links: vorlage.randLinks,
    rechts: vorlage.randRechts,
    obenErste: vorlage.randOben,
    obenFolge: vorlage.randObenFolgeseiten,
    unten: vorlage.randUnten,
  }
}

/**
 * Was vom Briefbogen auf Blatt `nummer` (ab 0) gehört.
 *
 * Die erste Seite bekommt den ganzen Bogen. Auf den Folgeseiten hat der große
 * Kopf nichts mehr zu suchen: Ein zweites „Ihr Gesprächspartner" und ein
 * zweiter Rechtsblock sagen nichts Neues, kosten aber 80 mm Papier. Bleiben
 * soll das Logo – daran erkennt man den Absender auf jedem Blatt.
 *
 * Eine zweiseitige Vorlage bringt ihren eigenen Folgebogen mit; der ist genau
 * dafür gemacht und wird unverändert genommen.
 */
export type Bogenteil = {
  /** Seitenindex in der Vorlage. */
  seite: number
  /** Nur der Logobereich statt der ganzen Seite. */
  nurLogo: boolean
}

export function bogenteilFuer(vorlage: Briefvorlage, nummer: number): Bogenteil | null {
  if (nummer === 0) return { seite: 0, nurLogo: false }
  if (vorlage.seiten > 1) return { seite: 1, nurLogo: false }
  return vorlage.ersteSeiteWiederholen ? { seite: 0, nurLogo: true } : null
}

/** Bildformat für jsPDF und docx aus der Data-URL. */
export function bildformat(daten: string): 'PNG' | 'JPEG' {
  return daten.startsWith('data:image/png') ? 'PNG' : 'JPEG'
}

export class VorlagenFehler extends Error {}

/**
 * Prüft eine Datei, bevor sie in den Einstellungen landet. Lieber hier eine
 * klare Meldung als später eine kaputte PDF beim Kunden.
 */
export function vorlageArtPruefen(typ: string, name: string): VorlagenArt {
  const endung = name.toLowerCase().slice(name.lastIndexOf('.'))
  if (typ === 'application/pdf' || endung === '.pdf') return 'pdf'
  // Word-Vorlagen sind der Normalfall im Unternehmen – deshalb keine pauschale
  // Absage, sondern der Weg dorthin. Ein Browser kann .docx nicht setzen.
  if (['.docx', '.doc', '.dotx'].includes(endung)) {
    throw new VorlagenFehler(
      'Eine Word-Vorlage kann die App nicht lesen. In Word über „Speichern unter" als PDF ablegen und die PDF hier hinterlegen.',
    )
  }
  if (typ === 'image/png' || typ === 'image/jpeg' || ['.png', '.jpg', '.jpeg'].includes(endung)) {
    return 'bild'
  }
  throw new VorlagenFehler('Bitte eine PDF-, PNG- oder JPEG-Datei wählen.')
}

/** Data-URL in Bytes umwandeln – ohne Netz, ohne fetch. */
export function bytesAusDataUrl(dataUrl: string): Uint8Array {
  const roh = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const bytes = new Uint8Array(roh.length)
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i)
  return bytes
}

/**
 * Fehlende oder unsinnige Angaben einer gespeicherten Vorlage geradeziehen.
 * Nötig, weil eine Sicherungsdatei von einem anderen Gerät kommen kann.
 */
export function vorlageAuffuellen(gespeichert: unknown): Briefvorlage | undefined {
  if (typeof gespeichert !== 'object' || gespeichert === null) return undefined
  const alt = gespeichert as Partial<Briefvorlage>
  if (typeof alt.daten !== 'string' || !alt.daten.startsWith('data:')) return undefined

  const zahl = (wert: unknown, ersatz: number) =>
    typeof wert === 'number' && Number.isFinite(wert) && wert >= 0 && wert < 140 ? wert : ersatz

  return {
    dateiname: typeof alt.dateiname === 'string' ? alt.dateiname : 'Briefvorlage',
    art: alt.art === 'pdf' ? 'pdf' : 'bild',
    daten: alt.daten,
    groesse: typeof alt.groesse === 'number' ? alt.groesse : 0,
    seiten: typeof alt.seiten === 'number' && alt.seiten > 0 ? alt.seiten : 1,
    hinzugefuegtAm:
      typeof alt.hinzugefuegtAm === 'string' ? alt.hinzugefuegtAm : new Date().toISOString(),
    randOben: zahl(alt.randOben, STANDARD_RAENDER.randOben),
    randObenFolgeseiten: zahl(alt.randObenFolgeseiten, STANDARD_RAENDER.randObenFolgeseiten),
    randUnten: zahl(alt.randUnten, STANDARD_RAENDER.randUnten),
    randLinks: zahl(alt.randLinks, STANDARD_RAENDER.randLinks),
    randRechts: zahl(alt.randRechts, STANDARD_RAENDER.randRechts),
    ersteSeiteWiederholen: alt.ersteSeiteWiederholen !== false,
  }
}

/** Bequemer Zugriff für PDF und Word: die Vorlage oder nichts. */
export function vorlageAus(einstellungen?: Einstellungen): Briefvorlage | undefined {
  return einstellungen?.briefvorlage
}

/** Dateigröße für die Anzeige in den Einstellungen. */
export function groesseAnzeigen(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

/**
 * Eine gewählte Datei zur Briefvorlage machen.
 *
 * Läuft vollständig im Browser: die Datei wird gelesen, geprüft und in die
 * lokale Datenbank gelegt. Es gibt keinen Upload im Sinne von „irgendwohin
 * schicken" – die Datei verlässt das Gerät nicht.
 */
export async function vorlageEinlesen(datei: File): Promise<Briefvorlage> {
  const art = vorlageArtPruefen(datei.type, datei.name)

  if (datei.size > MAX_VORLAGE_BYTES) {
    throw new VorlagenFehler(
      `Die Datei ist mit ${groesseAnzeigen(datei.size)} zu groß. Erlaubt sind ${groesseAnzeigen(MAX_VORLAGE_BYTES)}.`,
    )
  }

  // Bilder werden auf A4-Maß gebracht und als JPEG abgelegt: das hält die
  // Datenbank, die Sicherungsdatei und vor allem die fertige PDF klein. Ein
  // PNG mit Transparenz landet sonst unkomprimiert in jeder Berichts-PDF.
  const daten = art === 'bild' ? await bildAufbereiten(datei) : await alsDataUrl(datei)
  // Seitenzahl nur bei PDF: sie entscheidet, ob es einen eigenen Folgebogen gibt.
  const seiten = art === 'pdf' ? await pdfSeitenZaehlen(daten) : 1

  return {
    dateiname: datei.name,
    art,
    daten,
    // Was wirklich auf dem Gerät liegt – nach dem Aufbereiten also weniger.
    groesse: datenGroesse(daten),
    seiten,
    hinzugefuegtAm: new Date().toISOString(),
    ...STANDARD_RAENDER,
    // Von einem einseitigen Bogen steht auf den Folgeseiten nur noch das Logo
    // (siehe `bogenteilFuer`), deshalb darf der Text dort höher anfangen.
    ersteSeiteWiederholen: seiten === 1,
  }
}

/** Ungefähre Größe der Daten hinter einer Data-URL (Base64 trägt ein Drittel auf). */
export function datenGroesse(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.round((base64.length * 3) / 4)
}

/**
 * Briefbogen als Bild auf A4-Maß bringen und als JPEG ablegen.
 *
 * Nebenwirkung mit Absicht: Transparenz wird auf Weiß gelegt und die
 * Zusatzdaten der Datei fallen weg – im Bericht steht nur noch das Bild.
 */
async function bildAufbereiten(datei: File): Promise<string> {
  const adresse = URL.createObjectURL(datei)
  try {
    const bild = new Image()
    bild.src = adresse
    await bild.decode()

    const laengste = Math.max(bild.naturalWidth, bild.naturalHeight)
    const faktor = laengste > VORLAGE_MAX_KANTE ? VORLAGE_MAX_KANTE / laengste : 1
    const flaeche = document.createElement('canvas')
    flaeche.width = Math.max(1, Math.round(bild.naturalWidth * faktor))
    flaeche.height = Math.max(1, Math.round(bild.naturalHeight * faktor))

    const stift = flaeche.getContext('2d')
    if (!stift) throw new VorlagenFehler('Der Browser kann das Bild nicht verarbeiten.')
    // Weißer Grund: ein Briefbogen wird auf Papier gedruckt, nicht auf Glas.
    stift.fillStyle = '#FFFFFF'
    stift.fillRect(0, 0, flaeche.width, flaeche.height)
    stift.drawImage(bild, 0, 0, flaeche.width, flaeche.height)

    return flaeche.toDataURL('image/jpeg', VORLAGE_QUALITAET)
  } catch (fehler) {
    if (fehler instanceof VorlagenFehler) throw fehler
    throw new VorlagenFehler('Das Bild konnte nicht gelesen werden.')
  } finally {
    URL.revokeObjectURL(adresse)
  }
}

function alsDataUrl(datei: File): Promise<string> {
  return new Promise((fertig, fehler) => {
    const leser = new FileReader()
    leser.onload = () => fertig(String(leser.result))
    leser.onerror = () => fehler(new VorlagenFehler('Die Datei konnte nicht gelesen werden.'))
    leser.readAsDataURL(datei)
  })
}

/**
 * PDF öffnen, um die Seitenzahl zu erfahren – und um früh zu merken, dass eine
 * verschlüsselte oder beschädigte Datei später nicht zu gebrauchen wäre.
 *
 * `pdf-lib` wird erst hier geladen; die App startet ohne sie.
 */
async function pdfSeitenZaehlen(dataUrl: string): Promise<number> {
  try {
    const { PDFDocument } = await import('pdf-lib')
    const dokument = await PDFDocument.load(bytesAusDataUrl(dataUrl))
    const seiten = dokument.getPageCount()
    if (seiten < 1) throw new Error('leer')
    return seiten
  } catch {
    throw new VorlagenFehler(
      'Diese PDF lässt sich nicht als Briefbogen verwenden (beschädigt oder kennwortgeschützt). Am besten den Briefbogen als PNG speichern.',
    )
  }
}
