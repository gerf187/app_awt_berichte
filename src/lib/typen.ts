/**
 * Das Datenmodell der App. Eine einzige Quelle der Wahrheit – alle anderen
 * Dateien leiten ihre Typen von hier ab.
 *
 * Zahlenfelder, die der Nutzer tippt (CM-Wert, Verbrauch, Fläche), sind bewusst
 * Text: auf dem Handy wird gerne mal ein Komma statt eines Punktes eingegeben,
 * und der Bericht soll genau das wiedergeben, was der Kollege notiert hat.
 */

export type Status = 'Entwurf' | 'Abgeschlossen'

/**
 * Die Blätter, aus denen ein Bericht besteht. Reihenfolge und Inhalt stehen in
 * `src/screens/schritte/liste.tsx`; hier steht nur, welche es gibt – damit auch
 * die Prüffunktionen im lib-Verzeichnis auf ein Blatt zeigen können.
 */
export type BlattId =
  | 'kopf'
  | 'thematik'
  | 'untergrund'
  | 'klima'
  | 'aufbau'
  | 'text'
  | 'fragen'
  | 'fotos'
  | 'abschluss'

/**
 * Zustand eines Blattes für Reiter und Kacheln.
 * `fehlt` ist gelb und hält niemanden auf, `warnung` ist rot und meint Gefahr –
 * heute nur der unterschrittene Taupunkt.
 */
export type BlattStand = 'fertig' | 'fehlt' | 'warnung' | 'neutral'

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
  rauhtiefe: string
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
  /** Verbrauch je Quadratmeter, immer in kg/m² – die Anzeige rechnet in g/m² um. */
  verbrauch: string
  /** Gesamtmenge in kg. Wird aus Verbrauch und Fläche berechnet oder umgekehrt. */
  gesamtmenge: string
  charge: string
  flaeche: string
}

export type Berichtstext = {
  ausgefuehrteArbeiten: string
  besprochenes: string
  maengel: string
  empfehlung: string
  /** Was am Besuchstag nicht geklärt werden konnte. */
  offeneFragen: string
}

/**
 * Wer den Bericht geschrieben hat. Wird beim Anlegen aus dem Profil in den
 * Bericht kopiert – ändert der Kollege später sein Profil, bleiben alte
 * Berichte so, wie sie verschickt wurden.
 */
export type Absender = {
  name: string
  funktion: string
  firma: string
  strasse: string
  ort: string
  telefon: string
  email: string
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
  /** Absenderzeile des Berichts, aus dem Profil übernommen. */
  absender: Absender
  /** PNG als Data-URL. Fehlt, wenn nicht unterschrieben wurde. */
  unterschrift?: string
}

/**
 * Alles, was der Nutzer einmal einstellt und die App danach vorbelegt.
 * Liegt in derselben Datenbank wie die Berichte, damit die Sicherung
 * alles in einem Rutsch mitnimmt.
 */
export type Einstellungen = {
  /** Das eigene Profil: füllt Anwesende und die Absenderzeile im Bericht. */
  profil: Absender
  /**
   * Produkte, die im Bericht schon einmal eingetragen wurden. Die App merkt sie
   * sich von selbst und bietet sie beim nächsten Mal an – gepflegt wird hier
   * nichts von Hand.
   */
  gemerkteProdukte: string[]
}

/** Struktur der Sicherungsdatei (Einstellungen → „Alle Daten sichern"). */
export type Sicherung = {
  art: 'awt-berichte-sicherung'
  version: 1
  erstelltAm: string
  berichte: Bericht[]
  einstellungen: Einstellungen
}
