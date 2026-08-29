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
  | 'pruefungen'
  | 'klima'
  | 'aufbau'
  | 'text'
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
}

/**
 * Eine Prüfung auf der Baustelle: Haftzug, Rauhtiefe, Restfeuchte, LP-Gehalt,
 * Ausbreitmaß, Schichtdicke – oder etwas, das in keiner Liste steht.
 *
 * Gemessen wird selten nur einmal: beim Haftzug sind drei Werte die Regel, bei
 * der Schichtdicke gern ein Dutzend. Deshalb steht hier eine Liste von Werten
 * und keine einzelne Zahl. Bezeichnung und Einheit sind freier Text, damit
 * niemand auf eine mitgelieferte Liste warten muss.
 */
export type Pruefung = {
  art: string
  einheit: string
  /** Die Einzelwerte, so getippt wie abgelesen. */
  werte: string[]
  /** Wo gemessen wurde, oder was sonst dazugehört. */
  bemerkung: string
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
  /**
   * Chargennummern, eine je Komponente. Reaktionsharze kommen in zwei bis vier
   * Komponenten auf die Baustelle – eine einzige Nummer je Zeile wäre gelogen.
   */
  chargen: string[]
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

/**
 * Art der hinterlegten Briefvorlage.
 * `bild` ist ein eingescannter oder exportierter Briefbogen (PNG/JPEG),
 * `pdf` der Briefbogen als PDF – dann können erste Seite und Folgeseiten
 * unterschiedlich aussehen.
 */
export type VorlagenArt = 'bild' | 'pdf'

/**
 * Der Briefbogen, auf dem der Bericht steht.
 *
 * Er wird **in der App hochgeladen** und liegt danach nur in der Datenbank
 * dieses Geräts – nicht im Repository, nicht auf einem Server. Grund: der
 * Briefbogen ist Firmenmaterial und trägt Namen, Telefonnummer und Anschrift
 * von Mitarbeitern; beides gehört weder auf eine öffentliche Seite noch zu
 * einem fremden Dienst. Siehe DATENSCHUTZ.md.
 */
export type Briefvorlage = {
  /** Name der hochgeladenen Datei – nur zur Wiedererkennung in den Einstellungen. */
  dateiname: string
  art: VorlagenArt
  /** Die Datei selbst als Data-URL. */
  daten: string
  /** Größe der Originaldatei in Bytes. */
  groesse: number
  /** Seitenzahl bei PDF-Vorlagen; Bilder haben immer eine. */
  seiten: number
  hinzugefuegtAm: string
  /** Satzspiegel: wo der Bericht auf dem Briefbogen stehen darf, in Millimetern. */
  randOben: number
  /** Oberer Rand ab Seite 2 – dort ist der Briefkopf meist kleiner. */
  randObenFolgeseiten: number
  randUnten: number
  randLinks: number
  randRechts: number
  /**
   * Einseitige Vorlagen auch auf den Folgeseiten wiederholen.
   * Aus für Briefbögen, deren Kopf nur auf Seite 1 gehört.
   */
  ersteSeiteWiederholen: boolean
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
  pruefungen: Pruefung[]
  klima: Klimawert[]
  aufbau: Aufbauzeile[]
  /**
   * Festgestellter Bereich samt Fläche: neue Aufbauzeilen fangen damit an.
   * Grundierung, Kratzspachtelung und Beschichtung liegen auf derselben Fläche
   * – die tippt niemand dreimal ab.
   */
  aufbauFest?: { bereich: string; flaeche: string }
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
  /**
   * Der eigene Briefbogen. Fehlt er, druckt die App ihre schlichte eigene
   * Kopfzeile – der Bericht ist also nie blockiert.
   */
  briefvorlage?: Briefvorlage
  /**
   * Zugang zu OneDrive. Hier steht nur, *womit* sich die App anmeldet und
   * *wohin* sie ablegt – die Anmeldung selbst (Tokens) bleibt außerhalb der
   * Einstellungen und damit außerhalb der Sicherungsdatei.
   */
  onedrive?: OneDriveZugang
}

/** Siehe src/lib/onedrive.ts – dort steht, wie die Anmeldung abläuft. */
export type OneDriveZugang = {
  /** Anwendungs-ID (Client-ID) der App-Registrierung in Azure/Entra. */
  clientId: string
  /** Zielordner in OneDrive, z. B. `Baustellenberichte`. */
  ordner: string
}

/** Struktur der Sicherungsdatei (Einstellungen → „Alle Daten sichern"). */
export type Sicherung = {
  art: 'awt-berichte-sicherung'
  version: 1
  erstelltAm: string
  berichte: Bericht[]
  einstellungen: Einstellungen
}
