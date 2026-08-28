/**
 * Die Datenschutz-Hinweise der App – an einer Stelle, weil sie an zwei Orten
 * gebraucht werden: auf dem Bildschirm „Datenschutz" und in der Anleitung, die
 * `scripts/anleitung.ts` als PDF setzt.
 *
 * Bewusst in einfacher Sprache. Die förmliche Fassung mit Rechtsgrundlagen,
 * Verarbeitungsverzeichnis und technischen Maßnahmen steht in DATENSCHUTZ.md.
 */

export type Block = { art: 'text'; inhalt: string } | { art: 'liste'; punkte: string[] }

export type Abschnitt = {
  titel: string
  bloecke: Block[]
}

const text = (inhalt: string): Block => ({ art: 'text', inhalt })
const liste = (...punkte: string[]): Block => ({ art: 'liste', punkte })

export const DATENSCHUTZ_STAND = 'August 2026'

export const DATENSCHUTZ: Abschnitt[] = [
  {
    titel: 'Worum es geht',
    bloecke: [
      text(
        'In einem Baustellenbericht stehen Namen, Telefonnummern und Anschriften – von Kunden, von Verarbeitern und von Kollegen. Dasselbe gilt für die Briefvorlage und für das Anforderungsformular, aus dem die Angaben zum Einsatz kommen. Das sind personenbezogene Daten im Sinne der DSGVO. Diese Seite sagt, was die App damit macht.',
      ),
    ],
  },
  {
    titel: 'Welche Daten die App speichert',
    bloecke: [
      liste(
        'Kopfdaten des Berichts: Projekt, Objektanschrift, Kunde, Verarbeiter samt Anschrift, Ansprechpartner, Telefonnummer',
        'Anwesende Personen mit Name, Firma und Funktion',
        'Ihr eigenes Profil: Name, Funktion, Firma, Anschrift, Telefon, E-Mail',
        'Messwerte, Aufbau, Freitexte und offene Fragen',
        'Fotos von der Baustelle und die Unterschrift auf dem Bildschirm',
        'Die hinterlegte Briefvorlage – auf ihr stehen in der Regel ebenfalls Namen und Kontaktdaten',
      ),
    ],
  },
  {
    titel: 'Wo die Daten liegen',
    bloecke: [
      text(
        'Alles bleibt in der Datenbank des Browsers auf diesem einen Gerät. Es gibt keinen Server, kein Konto und keine Anmeldung. Auch die Briefvorlage wird nicht hochgeladen: „Vorlage hochladen" heißt, dass die Datei in diese lokale Datenbank gelegt wird – sie verlässt das Gerät nicht.',
      ),
      text(
        'Die App selbst ist eine reine Webseite ohne Datenbank dahinter. Wer sie ausliefert, sieht deshalb nur, dass die Seite geladen wurde – niemals einen Berichtsinhalt.',
      ),
    ],
  },
  {
    titel: 'Was die App nicht tut',
    bloecke: [
      liste(
        'Sie sendet keine Berichte, keine Fotos und keine Vorlage an einen Server.',
        'Sie zählt niemanden mit: kein Tracking, keine Statistik, keine Fehlerberichte.',
        'Sie lädt zur Laufzeit nichts nach – keine Schriften, keine Bibliotheken von fremden Adressen.',
        'Sie fragt den Standort nicht ab. Beim Verkleinern der Fotos werden die Zusatzdaten der Kamera – auch GPS-Koordinaten – entfernt.',
      ),
    ],
  },
  {
    titel: 'Beim Versenden',
    bloecke: [
      text(
        'Sobald Sie den Bericht über „Teilen" oder per Mail weitergeben, übernimmt das gewählte Programm. Ab da gelten dessen Regeln, nicht mehr die der App. Schicken Sie den Bericht nur an Empfänger, die ihn bekommen dürfen, und prüfen Sie die Adresse, bevor Sie senden.',
      ),
    ],
  },
  {
    titel: 'Die Sicherungsdatei',
    bloecke: [
      text(
        'Die Sicherung (JSON) enthält alle Berichte mit Fotos, Ihr Profil und die Briefvorlage – unverschlüsselt. Behandeln Sie die Datei wie den Bericht selbst: auf ein dienstliches Laufwerk legen, nicht in einen privaten Cloudordner, und löschen, sobald sie nicht mehr gebraucht wird.',
      ),
    ],
  },
  {
    titel: 'Daten löschen',
    bloecke: [
      liste(
        'Einzelner Bericht: „Meine Berichte" → Papierkorb-Symbol.',
        'Alles auf einmal: Einstellungen → Datenschutz → „Alle Daten auf diesem Gerät löschen". Das löscht Berichte, Fotos, Profil und Briefvorlage.',
        'Wird der Browserspeicher gelöscht oder die App vom Startbildschirm entfernt, sind die Daten ebenfalls weg – auch die, die Sie noch gebraucht hätten.',
      ),
      text(
        'Löschen Sie Berichte, sobald sie verschickt und abgelegt sind. Die App ist ein Werkzeug für die Baustelle, kein Archiv.',
      ),
    ],
  },
  {
    titel: 'Was Sie selbst tun müssen',
    bloecke: [
      liste(
        'Das Gerät mit Code, Fingerabdruck oder Gesicht sperren – das ist der einzige Schutz vor fremdem Zugriff auf die Berichte.',
        'Die App nur auf einem dienstlichen oder dafür freigegebenen Gerät benutzen.',
        'Fotos nur von dem machen, worum es im Bericht geht. Personen möglichst nicht ablichten.',
        'Regelmäßig sichern und die Sicherung sicher ablegen.',
      ),
    ],
  },
  {
    titel: 'Rechte der betroffenen Personen',
    bloecke: [
      text(
        'Kunden, Ansprechpartner und Kollegen können Auskunft, Berichtigung oder Löschung ihrer Daten verlangen (Art. 15 bis 18 DSGVO). Diese Anfragen beantwortet nicht die App und nicht der einzelne Anwendungstechniker, sondern die zuständige Stelle im Unternehmen. Geben Sie eine solche Anfrage an Ihren Datenschutzbeauftragten weiter und löschen Sie in der Zwischenzeit nichts.',
      ),
    ],
  },
]
