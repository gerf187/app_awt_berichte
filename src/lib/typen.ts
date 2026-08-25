/**
 * Das Datenmodell der App. Eine einzige Quelle der Wahrheit – alle anderen
 * Dateien leiten ihre Typen von hier ab.
 *
 * Zahlenfelder, die der Nutzer tippt (CM-Wert, Verbrauch, Fläche), sind bewusst
 * Text: auf dem Handy wird gerne mal ein Komma statt eines Punktes eingegeben,
 * und der Bericht soll genau das wiedergeben, was der Kollege notiert hat.
 */

export type Status = 'Entwurf' | 'Abgeschlossen'

export type Kopf = {
  berichtsnummer: string
  datum: string
  projekt: string
  objektStrasse: string
  objektOrt: string
  kunde: string
  verarbeiter: string
  verarbeiterStrasse: string
  verarbeiterOrt: string
  ansprechpartner: string
  telefon: string
  awt: string
  vertrieb: string
  zweck: string
}

export type Anwesender = {
  name: string
  firma: string
  funktion: string
}

export type Untergrund = {
  art: string
  vorbereitung: string
  bemerkung: string
  restfeuchteCM: string
  haftzugfestigkeit: string
}

export type Klimawert = {
  uhrzeit: string
  luft: number
  boden: number
  feuchte: number
  /** Aus Luft und Feuchte berechnet – nie von Hand gesetzt. */
  taupunkt: number
  /** boden - taupunkt, ebenfalls berechnet. */
  abstandTaupunkt: number
  /** true, wenn der Abstand unter 3 K liegt. */
  warnung: boolean
}

export type Aufbauzeile = {
  bereich: string
  schicht: string
  produkt: string
  verbrauch: string
  charge: string
  flaeche: string
}

export type Berichtstext = {
  ausgefuehrteArbeiten: string
  besprochenes: string
  maengel: string
  empfehlung: string
}

export type Foto = {
  id: string
  /** Verkleinertes JPEG als Data-URL. */
  dataUrl: string
  beschreibung: string
  aufgenommenAm: string
}

export type Bericht = {
  id: string
  status: Status
  erstelltAm: string
  geaendertAm: string
  kopf: Kopf
  anwesende: Anwesender[]
  untergrund: Untergrund
  klima: Klimawert[]
  aufbau: Aufbauzeile[]
  text: Berichtstext
  fotos: Foto[]
  /** PNG als Data-URL. Fehlt, wenn nicht unterschrieben wurde. */
  unterschrift?: string
}

/**
 * Alles, was der Nutzer einmal einstellt und die App danach vorbelegt.
 * Liegt in derselben Datenbank wie die Berichte, damit die Sicherung
 * alles in einem Rutsch mitnimmt.
 */
export type Einstellungen = {
  eigenerName: string
  eigeneEmail: string
  standardVertrieb: string
  standardEmpfaenger: string
  /** Vom Nutzer gepflegte Produktliste; überschreibt die Stammdaten, wenn gefüllt. */
  produkte: string[]
}

/** Struktur der Sicherungsdatei (Einstellungen → „Alle Daten sichern"). */
export type Sicherung = {
  art: 'awt-berichte-sicherung'
  version: 1
  erstelltAm: string
  berichte: Bericht[]
  einstellungen: Einstellungen
}
