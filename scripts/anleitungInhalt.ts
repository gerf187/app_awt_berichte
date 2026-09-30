/**
 * Der Text der Anleitung. Gesetzt wird er von `scripts/anleitung.ts`.
 *
 * Getrennt gehalten, damit sich am Wortlaut etwas ändern lässt, ohne den
 * Satzcode anzufassen – und damit man beim Lesen sieht, was in der Anleitung
 * steht, ohne durch jsPDF-Aufrufe zu waten.
 *
 * Bewusst kurz: zwei bis drei Seiten, die man auf der Baustelle wirklich
 * liest. Was die Oberfläche selbst erklärt, steht hier nicht noch einmal.
 * Die ausführlichen Datenschutz-Hinweise stehen in der App unter
 * Einstellungen → Datenschutz (`src/data/datenschutz.ts`).
 */

export type Block =
  | { art: 'absatz'; text: string }
  | { art: 'zwischentitel'; text: string }
  | { art: 'punkte'; punkte: string[] }
  | { art: 'schritte'; punkte: string[] }
  | { art: 'hinweis'; text: string }
  | { art: 'warnung'; text: string }
  | { art: 'bild'; datei: string; bildunterschrift: string; breite?: number }
  | { art: 'bildpaar'; dateien: [string, string]; bildunterschrift: string }
  | { art: 'tabelle'; kopf: string[]; zeilen: string[][] }

export type Kapitel = { titel: string; bloecke: Block[] }

const absatz = (text: string): Block => ({ art: 'absatz', text })
const punkte = (...eintraege: string[]): Block => ({ art: 'punkte', punkte: eintraege })
const schritte = (...eintraege: string[]): Block => ({ art: 'schritte', punkte: eintraege })
const hinweis = (text: string): Block => ({ art: 'hinweis', text })
const warnung = (text: string): Block => ({ art: 'warnung', text })

export const TITEL = 'Baustellenbericht'
export const UNTERTITEL = 'Kurzanleitung für die Anwendungstechnik'
export const STAND = '30.09.2026'

export const KAPITEL: Kapitel[] = [
  {
    titel: 'Einmal einrichten',
    bloecke: [
      schritte(
        'App-Link öffnen und auf den Startbildschirm legen – iPhone: Teilen → „Zum Home-Bildschirm", Android: Menü (drei Punkte) → „Zum Startbildschirm hinzufügen". Beim ersten Mal mit Internet öffnen und warten, bis die Startseite steht; danach läuft die App auch ohne Empfang.',
        'Einstellungen → „Mein Profil": Name, Funktion, Firma, Anschrift, Telefon, E-Mail. Jeder neue Bericht übernimmt das.',
        'Einstellungen → „Briefvorlage": Briefbogen als PDF, PNG oder JPEG hochladen und die Abstände an einem Probebericht prüfen. Für die Word-Datei muss der Bogen ein PNG oder JPEG sein.',
        'Freiwillig: Einstellungen → „OneDrive" mit dem dienstlichen Microsoft-Konto verbinden.',
      ),
      hinweis(
        'Einen Speichern-Knopf gibt es nirgends. Jede Eingabe ist sofort auf dem Gerät gesichert.',
      ),
    ],
  },
  {
    titel: 'Einen Bericht erfassen',
    bloecke: [
      absatz(
        '„Neuer Bericht" öffnet die Kopfdaten. Die Reiter oben führen direkt zu jedem Blatt, „Übersicht" zeigt alle als Kacheln. Sie können in beliebiger Reihenfolge und über den Tag verteilt nachtragen.',
      ),
      {
        art: 'tabelle',
        kopf: ['Zeichen', 'Bedeutung'],
        zeilen: [
          ['grüner Haken', 'Auf dem Blatt ist etwas eingetragen, Pflichtangaben sind vollständig.'],
          ['gelber Punkt', 'Eine Pflichtangabe fehlt noch – das hält Sie nicht auf.'],
          ['rotes Dreieck', 'Gefahr: der Untergrund liegt zu nah am Taupunkt.'],
          ['kein Zeichen', 'Das Blatt ist noch leer.'],
        ],
      },
      {
        art: 'tabelle',
        kopf: ['Blatt', 'Was hineingehört'],
        zeilen: [
          [
            'Kopfdaten',
            'Projekt, Objekt, Verarbeiter, Ansprechpartner. Pflicht: Datum, Projekt, Verarbeiter, AWT.',
          ],
          ['Thematik', 'Zweck des Besuchs und die Anwesenden.'],
          ['Untergrund', 'Art und Vorbereitung aus der Liste, „Sonstiges" öffnet ein Textfeld.'],
          [
            'Prüfungen',
            'Oben die Sichtprüfung: Untergrund frei von Schmutz, Staub und Verunreinigungen – „i. O." oder „nicht i. O.". Darunter je Prüfung die Messwerte; der Mittelwert rechnet sich selbst, beim Haftzug gehört zu jedem Wert das Bruchbild.',
          ],
          [
            'Klima',
            'Luft, Untergrund, rel. Feuchte. Der Taupunkt rechnet mit; unter 3 K Abstand warnt die App rot. Pflicht: eine Messung.',
          ],
          [
            'Aufbau',
            'Je Schicht Bereich, Produkt, Fläche und Verbrauch oder Gesamtmenge – das andere rechnet die App. Chargen je Komponente.',
          ],
          ['Bericht', 'Freitexte. Pflicht: mindestens einer der ersten vier Abschnitte.'],
          ['Fotos', 'Nach der Aufnahme fragt die App gleich nach der Beschreibung.'],
          ['Abschluss', 'Fehlende Angaben, Unterschrift, Ausgabe.'],
        ],
      },
      absatz('Nützlich im Aufbau:'),
      punkte(
        '„Nächste Schicht" speichert und öffnet sofort die nächste Zeile auf derselben Fläche. Mit „Bereich und Fläche feststellen" beginnt jede neue Zeile damit.',
        'Verbrauch ab 10 versteht die App als g/m² (200 → 0,2 kg/m²), darunter als kg/m².',
        '„+ Mischung" erfasst Mischung für Mischung Menge und Fläche (z. B. 25 kg auf 60 m²). Fläche, Gesamtmenge und Verbrauch rechnet die App dann über alle Mischungen zusammen.',
      ),
      absatz('Diktieren:'),
      punkte(
        '„Diktieren" neben Textfeldern und Fotobeschreibungen. Die Spracherkennung läuft über den Browser und braucht Empfang – ohne Netz sagt die Taste das und Sie tippen.',
        '„Text glätten" unter den Feldern macht aus dem Diktat lesbaren Text („Komma" → „,"), ohne Internet. „Rückgängig" holt den alten Text zurück.',
      ),
    ],
  },
  {
    titel: 'Abschließen und versenden',
    bloecke: [
      schritte(
        'Blatt „Abschluss": gelb aufgeführte Angaben antippen und nachtragen.',
        'Den Kunden mit dem Finger unterschreiben lassen.',
        '„PDF erzeugen", „Word erzeugen", „Bericht versenden" (Teilen-Funktion des Handys) oder „PDF in OneDrive ablegen".',
      ),
      absatz(
        'Danach gilt der Bericht als abgeschlossen (grüner Punkt in „Meine Berichte"). Ändern lässt er sich weiterhin.',
      ),
      warnung('Vor dem Senden die Empfängeradresse prüfen.'),
    ],
  },
  {
    titel: 'Daten sichern und Datenschutz',
    bloecke: [
      warnung(
        'Berichte liegen nur auf diesem Gerät – es gibt keinen Server. Sichern Sie regelmäßig: Einstellungen → „Alle Daten sichern", die Datei auf ein dienstliches Laufwerk legen. Wiederherstellen geht auf jedem Gerät unter „Daten wiederherstellen".',
      ),
      punkte(
        'Die Sicherungsdatei ist nicht verschlüsselt und enthält Kunden- und Personendaten – behandeln Sie sie wie den Bericht selbst.',
        'Fotografieren Sie die Baustelle, nicht die Leute. Beim Verkleinern fallen die Zusatzdaten der Kamera (auch der Ort) weg.',
        'Die vollständigen Hinweise stehen in der App unter Einstellungen → Datenschutz.',
      ),
    ],
  },
  {
    titel: 'Wenn etwas nicht klappt',
    bloecke: [
      {
        art: 'tabelle',
        kopf: ['Das sehen Sie', 'Das hilft'],
        zeilen: [
          [
            'Die App startet ohne Empfang nicht.',
            'Einmal mit Internet öffnen und warten, bis die Startseite steht.',
          ],
          [
            'Diktieren geht nicht.',
            'Ohne Empfang geht es nicht; fehlt die Taste ganz, kann das Handy es nicht. Tippen geht immer.',
          ],
          [
            'Der Text läuft in den Briefkopf.',
            'Einstellungen → Briefvorlage: „Oben, Seite 1" und „Oben, ab Seite 2" erhöhen.',
          ],
          [
            '„Bericht versenden" lädt nur herunter.',
            'Das Gerät kann nicht direkt teilen: die Datei an die vorbereitete Mail anhängen.',
          ],
          [
            'Ein Bericht ist verschwunden.',
            'Der Browserspeicher wurde gelöscht. Nur eine Sicherung bringt ihn zurück.',
          ],
        ],
      },
    ],
  },
]
