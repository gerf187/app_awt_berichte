/**
 * Der Text der Anleitung. Gesetzt wird er von `scripts/anleitung.ts`.
 *
 * Getrennt gehalten, damit sich am Wortlaut etwas ändern lässt, ohne den
 * Satzcode anzufassen – und damit man beim Lesen sieht, was in der Anleitung
 * steht, ohne durch jsPDF-Aufrufe zu waten.
 *
 * Die Datenschutz-Sätze kommen aus `src/data/datenschutz.ts`; App und
 * Anleitung sollen dasselbe sagen.
 */

import { DATENSCHUTZ } from '../src/data/datenschutz'

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
const zwischentitel = (text: string): Block => ({ art: 'zwischentitel', text })
const punkte = (...eintraege: string[]): Block => ({ art: 'punkte', punkte: eintraege })
const schritte = (...eintraege: string[]): Block => ({ art: 'schritte', punkte: eintraege })
const hinweis = (text: string): Block => ({ art: 'hinweis', text })
const warnung = (text: string): Block => ({ art: 'warnung', text })
const bild = (datei: string, bildunterschrift: string, breite?: number): Block => ({
  art: 'bild',
  datei,
  bildunterschrift,
  breite,
})

export const TITEL = 'Baustellenbericht'
export const UNTERTITEL = 'Anleitung für die Anwendungstechnik'
export const STAND = '29.08.2026'

/** Die Datenschutz-Sätze aus der App, hier als Blöcke der Anleitung. */
const datenschutzBloecke: Block[] = DATENSCHUTZ.flatMap((abschnitt) => [
  zwischentitel(abschnitt.titel),
  ...abschnitt.bloecke.map((block) =>
    block.art === 'text' ? absatz(block.inhalt) : punkte(...block.punkte),
  ),
])

export const KAPITEL: Kapitel[] = [
  {
    titel: 'Wofür diese App da ist',
    bloecke: [
      absatz(
        'Mit dieser App schreiben Sie den Baustellenbericht dort, wo er entsteht: auf der Baustelle, am Handy, ohne Empfang. Am Ende steht ein fertiges PDF auf Ihrem Briefbogen, das Sie sofort verschicken können.',
      ),
      zwischentitel('Was die App kann'),
      punkte(
        'Bericht erfassen: Kopfdaten, Anwesende, Untergrund, Prüfungen, Klimawerte, Aufbau, Freitexte, Fotos',
        'Taupunkt wird mitgerechnet und warnt, bevor Sie eine Beschichtung freigeben',
        'Verbrauch und Gesamtmenge rechnen über die Fläche ineinander um',
        'Fotos direkt aus der Kamera, automatisch verkleinert',
        'Freitexte und Bildbeschreibungen lassen sich diktieren',
        'Unterschrift mit dem Finger',
        'Ausgabe als PDF und als Word-Datei – auf Ihrem eigenen Briefbogen',
        'Versand über die Teilen-Funktion des Handys',
      ),
      hinweis(
        'Alles bleibt auf Ihrem Gerät. Die App schickt nichts an einen Server – auch nicht die Briefvorlage. Warum das wichtig ist, steht im Kapitel „Datenschutz".',
      ),
      absatz(
        'Alle Bilder in dieser Anleitung zeigen erfundene Musterdaten: „Musterfirma GmbH", „Max Muster", „Neubau Lagerhalle Ost". Echte Kunden- und Mitarbeiterdaten kommen in einer Anleitung nicht vor.',
      ),
    ],
  },
  {
    titel: 'Die App auf das Handy holen',
    bloecke: [
      absatz(
        'Die App wird nicht aus einem App-Store installiert. Sie öffnen sie einmal im Browser und legen sie auf den Startbildschirm. Danach hat sie ein eigenes Symbol und startet ohne Browserleiste.',
      ),
      zwischentitel('iPhone (Safari)'),
      schritte(
        'Den Link der App in Safari öffnen.',
        'Unten auf das Teilen-Symbol tippen (Kästchen mit Pfeil nach oben).',
        '„Zum Home-Bildschirm" wählen und mit „Hinzufügen" bestätigen.',
      ),
      zwischentitel('Android (Chrome)'),
      schritte(
        'Den Link der App in Chrome öffnen.',
        'Oben rechts auf die drei Punkte tippen.',
        '„Zum Startbildschirm hinzufügen" wählen und bestätigen.',
      ),
      warnung(
        'Beim ersten Öffnen brauchen Sie einmal Internet. Warten Sie, bis die Startseite vollständig da ist – erst danach läuft die App auch im Flugmodus.',
      ),
      bild('01-start.png', 'Der Startbildschirm: mehr Auswahl gibt es hier nicht.'),
    ],
  },
  {
    titel: 'Einmalig einrichten: Mein Profil',
    bloecke: [
      absatz(
        'Das Profil tragen Sie einmal ein. Die App setzt Ihren Namen danach in jeden neuen Bericht – als erste Zeile unter „Anwesende" und in die Absenderzeile des Berichts.',
      ),
      schritte(
        'Auf dem Startbildschirm unten auf „Einstellungen" tippen.',
        'Unter „Mein Profil" Name, Funktion, Firma, Anschrift, Telefon und E-Mail eintragen.',
        'Fertig. Einen Speichern-Knopf gibt es nicht – die App speichert nach jeder Eingabe von selbst.',
      ),
      hinweis(
        'Ändern Sie das Profil später, bleiben bereits geschriebene Berichte so, wie Sie sie verschickt haben.',
      ),
      bild('02-einstellungen-profil.png', 'Einstellungen → Mein Profil.'),
    ],
  },
  {
    titel: 'Die Briefvorlage hinterlegen',
    bloecke: [
      absatz(
        'Der Bericht soll auf dem Briefbogen Ihres Hauses stehen. Diesen Briefbogen hinterlegen Sie selbst in der App. Er wird dabei nicht hochgeladen: Die Datei wandert in den Speicher dieses Geräts und bleibt dort.',
      ),
      zwischentitel('So geht es'),
      schritte(
        'Den Briefbogen als PDF, PNG oder JPEG auf das Gerät legen – zum Beispiel als Anhang aus einer Mail speichern.',
        'Einstellungen öffnen und zum Abschnitt „Briefvorlage" blättern.',
        'Auf „Briefvorlage hochladen" tippen und die Datei auswählen.',
        'Die Vorschau prüfen: Steht dort der richtige Bogen?',
      ),
      bild(
        '03-einstellungen-briefvorlage.png',
        'Der hinterlegte Briefbogen mit Vorschau, Dateiname und Datum.',
      ),
      zwischentitel('Wo darf der Bericht stehen?'),
      absatz(
        'Der Briefbogen hat oben einen Kopf und unten eine Fußzeile. Damit der Bericht nicht hineinläuft, geben Sie die Abstände in Millimetern an. Die Vorschlagswerte passen für die meisten Bögen; prüfen Sie sie einmal an einem Probebericht.',
      ),
      {
        art: 'tabelle',
        kopf: ['Feld', 'Bedeutung'],
        zeilen: [
          ['Oben, Seite 1', 'Abstand vom oberen Blattrand bis zur ersten Zeile des Berichts'],
          ['Oben, ab Seite 2', 'Dasselbe für alle weiteren Seiten – dort ist der Kopf oft kleiner'],
          ['Unten', 'Platz für die Fußzeile des Briefbogens'],
          ['Links / Rechts', 'Seitenränder des Textes'],
        ],
      },
      bild('04-einstellungen-satzspiegel.png', 'Die Abstände lassen sich jederzeit nachjustieren.'),
      zwischentitel('Ein- oder zweiseitige Vorlage'),
      punkte(
        'Hat Ihre PDF-Vorlage zwei Seiten, nimmt die App Seite 1 für das erste Blatt und Seite 2 für alle weiteren.',
        'Hat die Vorlage nur eine Seite, entscheiden Sie mit dem Häkchen „Briefbogen auch auf den Folgeseiten drucken", ob sich der Kopf wiederholt.',
      ),
      warnung(
        'Word kann eine PDF-Vorlage nicht einbetten. Wenn Sie den Briefbogen auch in der Word-Datei brauchen, hinterlegen Sie ihn als PNG oder JPEG. Die PDF steht in beiden Fällen auf dem Bogen.',
      ),
      hinweis(
        'Ohne hinterlegte Vorlage ist nichts kaputt: Die App druckt dann ihre eigene schlichte Kopfzeile.',
      ),
    ],
  },
  {
    titel: 'Ein Bericht besteht aus Blättern',
    bloecke: [
      absatz(
        'Tippen Sie auf dem Startbildschirm auf „Neuer Bericht". Sie landen sofort in den Kopfdaten. Oben führt eine Reiterleiste ohne Umweg zu jedem anderen Blatt; der letzte Reiter „Übersicht" zeigt alle Blätter als Kacheln.',
      ),
      absatz(
        'Das ist Absicht: Auf der Baustelle wird über den Tag zu einzelnen Punkten nachgetragen. Sie sollen dafür nicht durch acht Bildschirme zurückblättern müssen.',
      ),
      zwischentitel('Was die Zeichen bedeuten'),
      {
        art: 'tabelle',
        kopf: ['Zeichen', 'Bedeutung'],
        zeilen: [
          ['grüner Haken', 'Alle Pflichtangaben dieses Blattes sind da.'],
          ['gelber Punkt', 'Eine Pflichtangabe fehlt noch. Das hält Sie nicht auf.'],
          ['rotes Warndreieck', 'Achtung, Gefahr: Der Untergrund liegt zu nah am Taupunkt.'],
          ['kein Zeichen', 'Auf diesem Blatt ist nichts Pflicht.'],
        ],
      },
      bild('08-kacheln.png', 'Die Übersicht zeigt auf einen Blick, wo noch etwas fehlt.'),
      hinweis(
        'Einen Speichern-Knopf gibt es nirgends. Jede Eingabe ist sofort gesichert – auch wenn das Handy abstürzt oder der Akku leer wird.',
      ),
    ],
  },
  {
    titel: 'Blatt „Kopfdaten"',
    bloecke: [
      absatz(
        'Hier steht, um welche Baustelle es geht. Die Berichtsnummer vergibt die App selbst (Datum und laufende Nummer des Tages), das Datum steht auf heute.',
      ),
      punkte(
        'Projekt / Bauvorhaben und Objektanschrift beschreiben die Baustelle.',
        'Verarbeiter ist die ausführende Firma, mit eigener Anschrift.',
        'Ansprechpartner und Telefon gehören zum Verarbeiter.',
        'Anwendungstechniker ist aus Ihrem Profil vorbelegt.',
      ),
      bild('09-blatt-kopfdaten.png', 'Kopfdaten. Pflicht sind Datum, Projekt, Verarbeiter und AWT.'),
    ],
  },
  {
    titel: 'Blatt „Thematik & Anwesende"',
    bloecke: [
      absatz(
        'Oben tragen Sie den Zweck des Besuchs ein – mit der Taste neben dem Feld können Sie ihn auch diktieren. Darunter stehen die Anwesenden; die erste Zeile ist schon mit Ihrem Profil gefüllt.',
      ),
      punkte(
        'Mit „+ Person" kommt eine Zeile dazu.',
        'Die Funktion wählen Sie aus der Liste; „Sonstiges" öffnet ein Textfeld.',
      ),
      bild('10-blatt-thematik.png', 'Zweck des Besuchs und die Anwesenden.'),
    ],
  },
  {
    titel: 'Blatt „Untergrund"',
    bloecke: [
      absatz(
        'Art und Vorbereitung wählen Sie aus den Listen. Steht dort „Sonstiges", klappt ein Bemerkungsfeld auf. Gemessene Werte gehören nicht hierher, sondern auf das nächste Blatt.',
      ),
      bild('11-blatt-untergrund.png', 'Untergrund: Art, Vorbereitung, Bemerkung.'),
    ],
  },
  {
    titel: 'Blatt „Prüfungen"',
    bloecke: [
      absatz(
        'Alles, was Sie gemessen haben. Mit „+ Prüfung" kommt eine Karte dazu: oben wählen Sie die Prüfung aus der Liste, darunter tragen Sie die Einzelwerte ein.',
      ),
      punkte(
        'Zur Auswahl stehen Haftzugfestigkeit, Rauhtiefe, Restfeuchte (CM), LP-Gehalt, Ausbreitmaß (Hägemanntisch) und Schichtdicke. „Sonstiges" öffnet ein Feld für alles andere.',
        'Die Einheit ist vorbelegt und lässt sich überschreiben.',
        '„+ Wert" legt eine weitere Messstelle an – beim Haftzug sind drei üblich, bei der Schichtdicke werden es schnell mehr.',
        'Ab zwei Werten zeigt die App den Mittelwert; er steht auch im fertigen Bericht.',
        'Die Bemerkung sagt, wo gemessen wurde.',
      ),
      bild('12-blatt-pruefungen.png', 'Eine Prüfung mit mehreren Messwerten.'),
      hinweis(
        'Nicht Gemessenes taucht im Bericht gar nicht erst auf. Eine angefangene Karte ohne Wert wird übergangen.',
      ),
    ],
  },
  {
    titel: 'Blatt „Klimawerte" – der Taupunkt',
    bloecke: [
      absatz(
        'Mit „+ Messung" legen Sie eine Messung an; die Uhrzeit ist vorbelegt. Sie tragen Lufttemperatur, Untergrundtemperatur und relative Luftfeuchte ein – Taupunkt und Abstand rechnet die App sofort mit.',
      ),
      warnung(
        'Liegt der Untergrund weniger als 3 K über dem Taupunkt, wird die Messung rot und die App warnt: „Beschichtung nicht freigeben." Diese Warnung steht auch im fertigen Bericht und im Reiter.',
      ),
      bild('13-blatt-klima.png', 'Jede Messung rechnet den Taupunkt selbst mit.'),
      hinweis('Mindestens eine Messung gehört in jeden Bericht.'),
    ],
  },
  {
    titel: 'Blatt „Aufbau"',
    bloecke: [
      absatz(
        'Hier steht, was auf den Boden kam. Jede Zeile ist eine Schicht in einem Bereich. Tippen Sie eine vorhandene Zeile an, um sie zu ändern, oder legen Sie mit „+ Zeile" eine neue an.',
      ),
      bild('14-blatt-aufbau.png', 'Der Aufbau als Liste.'),
      zwischentitel('Die Eingabemaske'),
      punkte(
        'Bereich: ab der zweiten Zeile gibt es „wie Vorposition" – so tippen Sie „Halle Nord" nicht dreimal.',
        '„Bereich und Fläche feststellen": Setzen Sie den Haken, fängt jede weitere Zeile mit demselben Bereich und derselben Fläche an. Grundierung, Kratzspachtelung, Beschichtung – dieselbe Fläche, einmal getippt. Oben auf dem Blatt steht, was festgestellt ist; dort heben Sie es auch wieder auf.',
        'Produkt: einfach tippen. Was Sie einmal eingetragen haben, schlägt die App beim nächsten Mal vor.',
        'Verbrauch und Gesamtmenge: Sie tragen das eine ein, die App rechnet über die Fläche das andere aus.',
        'Die Einheit springt von selbst um: Eingaben ab 10 versteht die App als g/m² (200 wird zu 0,2 kg/m²), darunter als kg/m².',
        'Charge: „+ Komponente" legt eine weitere Nummer an. Ein zweikomponentiges Harz hat zwei Chargen, ein Estrichmörtel mit Zusatz auch mal vier – im Schadensfall wird nach genau diesen gefragt.',
      ),
      bild('17-aufbau-eingabe.png', 'Die Eingabemaske einer Aufbauzeile.'),
    ],
  },
  {
    titel: 'Blatt „Bericht & Feststellungen"',
    bloecke: [
      absatz(
        'Fünf Freitextfelder: ausgeführte Arbeiten, Besprochenes, Mängel, Empfehlung und offene Fragen. Jedes hat eine Taste zum Diktieren – wenn Ihr Handy das unterstützt, erscheint sie neben der Beschriftung.',
      ),
      absatz(
        'Unter „Offene Fragen" steht, was am Besuchstag nicht geklärt wurde: wer liefert, wer entscheidet, worauf gewartet wird. Bleibt ein Feld leer, taucht der Abschnitt im Dokument gar nicht erst auf.',
      ),
      zwischentitel('Text glätten'),
      absatz(
        'Unter jedem Feld steht „✨ Text glätten". Ein Tipp darauf macht aus dem Diktat lesbaren Text: Aus „Komma" wird ein Komma, aus „neuer Absatz" ein Absatz, aus „3 Komma 5" wird 3,5. Füllwörter wie „ähm" fallen weg, Satzanfänge werden großgeschrieben.',
      ),
      punkte(
        'Messwerte, Einheiten und Produktnamen bleiben unangetastet – „1,8 N/mm²" und „Sikafloor-264" gehen nicht verloren.',
        'Der Knopf wechselt danach auf „↩ Rückgängig" und stellt Ihren Text wieder her, solange Sie nichts weitergeschrieben haben.',
        'Von selbst passiert das nie. Sie entscheiden, ob der Text angefasst wird.',
      ),
      hinweis(
        'Das Glätten rechnet im Handy, ohne Internet. Beim Diktieren selbst ist das anders: Die Spracherkennung ist Sache des Browsers und läuft je nach Gerät über dessen Server.',
      ),
      hinweis(
        'Mindestens einer der ersten vier Abschnitte muss ausgefüllt sein, sonst fehlt dem Bericht die Aussage. Eine offene Frage allein genügt dafür nicht.',
      ),
      bild('15-blatt-text.png', 'Die Textfelder, jeweils mit Spracheingabe.'),
    ],
  },
  {
    titel: 'Blatt „Fotos"',
    bloecke: [
      absatz(
        '„Foto aufnehmen" öffnet direkt die Kamera, „Aus Galerie wählen" nimmt vorhandene Bilder. Jedes Foto bekommt eine Beschreibung – die steht später unter dem Bild im Bericht und lässt sich diktieren.',
      ),
      punkte(
        'Mit den Pfeilen ändern Sie die Reihenfolge.',
        'Fotos werden beim Speichern automatisch verkleinert, damit die PDF versendbar bleibt.',
      ),
      hinweis(
        'Beim Verkleinern fallen die Zusatzdaten der Kamera weg – auch der Aufnahmeort. Fotografieren Sie trotzdem die Baustelle und nicht die Leute.',
      ),
      bild('16-blatt-fotos.png', 'Fotos mit Beschreibung und Reihenfolge.'),
    ],
  },
  {
    titel: 'Blatt „Abschluss": prüfen, unterschreiben, ausgeben',
    bloecke: [
      absatz(
        'Das letzte Blatt fasst den Bericht zusammen. Fehlende Pflichtangaben stehen gelb hervorgehoben da – ein Tipp darauf bringt Sie zum richtigen Blatt.',
      ),
      bild('18-blatt-abschluss.png', 'Zusammenfassung und fehlende Angaben.'),
      zwischentitel('Unterschrift'),
      absatz(
        'Im Unterschriftenfeld unterschreibt der Kunde mit dem Finger. „Löschen" setzt das Feld zurück. Ohne Unterschrift fehlt der Abschnitt im Bericht einfach.',
      ),
      zwischentitel('Ausgeben und versenden'),
      schritte(
        '„PDF erzeugen" legt die Datei im Download-Ordner ab.',
        '„Word erzeugen" macht dasselbe als .docx – für Kollegen, die noch etwas ergänzen wollen.',
        '„Bericht versenden" öffnet die Teilen-Funktion des Handys: Mail, Teams, was Sie dort eingerichtet haben.',
      ),
      absatz(
        'Unter den Knöpfen steht, welche Briefvorlage die App gerade benutzt. Steht dort nichts, ist keine hinterlegt.',
      ),
      absatz(
        'Sobald Sie den Bericht erzeugt oder versendet haben, gilt er als abgeschlossen und bekommt in „Meine Berichte" den grünen Punkt. Sie müssen dafür nichts extra antippen – und können ihn unten jederzeit wieder als Entwurf führen. Ganz unten führen zwei Knöpfe zurück zu „Meine Berichte" oder zur Startseite.',
      ),
      bild('19-abschluss-ausgabe.png', 'Ausgabe und Versand.'),
      warnung(
        'Prüfen Sie vor dem Senden die Empfängeradresse. Ab dem Moment, in dem Sie teilen, gelten die Regeln Ihres Mailprogramms – nicht mehr die der App.',
      ),
    ],
  },
  {
    titel: 'So sieht der fertige Bericht aus',
    bloecke: [
      absatz(
        'Der Bericht steht auf dem hinterlegten Briefbogen. Kopfdaten, Anwesende, Untergrund, Klimawerte und Aufbau erscheinen als Tabellen, die Freitexte darunter, Fotos zu zweit auf einer Seite.',
      ),
      {
        art: 'bildpaar',
        dateien: ['20-fertiger-bericht-1.png', '20-fertiger-bericht-2.png'],
        bildunterschrift:
          'Seite 1 und 2 des erzeugten Berichts – hier auf dem Beispiel-Briefbogen „Musterfirma GmbH".',
      },
      absatz(
        'Der Dateiname enthält Nummer und Projekt, zum Beispiel: Baustellenbericht_2026-08-26-01_Neubau_Lagerhalle_Ost.pdf',
      ),
    ],
  },
  {
    titel: 'Meine Berichte',
    bloecke: [
      absatz(
        'Über „Meine Berichte" kommen Sie an alles zurück, was auf dem Gerät liegt. Der Punkt vor dem Eintrag zeigt den Stand: grau ist ein Entwurf, grün ein abgeschlossener Bericht.',
      ),
      punkte(
        'Das Suchfeld findet Berichte nach Projekt oder Nummer.',
        'Das Papierkorb-Symbol löscht einen Bericht – nach einer Rückfrage.',
        'Ein abgeschlossener Bericht lässt sich weiter ändern; er wird nur anders angezeigt.',
      ),
      bild('07-meine-berichte.png', 'Alle Berichte dieses Geräts.'),
    ],
  },
  {
    titel: 'Bericht in OneDrive ablegen (freiwillig)',
    bloecke: [
      absatz(
        'Die App kann fertige Berichte in Ihr OneDrive legen. Das müssen Sie nicht einrichten – ohne Verbindung funktioniert alles wie bisher. Wer es einmal einrichtet, spart sich danach den Umweg über den Download-Ordner.',
      ),
      absatz(
        'Einmalig braucht Microsoft eine sogenannte App-Registrierung. Das klingt größer, als es ist: Sie legen im Portal einen Eintrag an und tragen die angezeigte Nummer in die App ein.',
      ),
      schritte(
        'Am Rechner entra.microsoft.com öffnen und anmelden. Dann „App-Registrierungen" → „Neue Registrierung".',
        'Namen vergeben, z. B. „Baustellenbericht". Bei den Kontotypen die Zeile mit „… und persönliche Microsoft-Konten" wählen.',
        'Als Plattform „Einzelseitenanwendung (SPA)" wählen und die Adresse eintragen, die in der App unter Einstellungen → OneDrive steht (dort gibt es „Adresse kopieren").',
        'Registrieren. Auf der Übersichtsseite steht die „Anwendungs-ID (Client)" – diese Nummer in der App unter Einstellungen → OneDrive eintragen.',
        'Ordner eintragen (Vorschlag: Baustellenberichte) und „Mit OneDrive verbinden" antippen. Es erscheint die gewohnte Microsoft-Anmeldung.',
      ),
      absatz(
        'Danach steht auf dem letzten Blatt eines Berichts die Taste „PDF in OneDrive ablegen". Der Bericht landet im gewählten Ordner; „In OneDrive öffnen" führt direkt hin.',
      ),
      warnung(
        'In Berichten stehen Kunden- und Mitarbeiterdaten. Verbinden Sie deshalb ein dienstliches Konto. Ein privates Microsoft-Konto ist nur zum Ausprobieren mit erfundenen Daten gedacht.',
      ),
      hinweis(
        '„Verbindung trennen" löscht den Zugang wieder vom Gerät. Und ohne Internet klappt das Ablegen nicht – der Bericht bleibt dann in der App und lässt sich später hochladen.',
      ),
    ],
  },
  {
    titel: 'Daten sichern',
    bloecke: [
      warnung(
        'Die Berichte liegen nur auf diesem einen Gerät. Geht das Handy verloren oder wird der Browserspeicher gelöscht, sind sie weg. Es gibt keinen Server, von dem sie zurückkämen.',
      ),
      schritte(
        'Einstellungen → „Alle Daten sichern (JSON)" antippen.',
        'Die Datei landet im Download-Ordner. Legen Sie sie auf ein dienstliches Laufwerk.',
        'Auf einem neuen Gerät: Einstellungen → „Daten wiederherstellen" und die Datei auswählen.',
      ),
      absatz(
        'Die Sicherung enthält alles: Berichte mit Fotos, Ihr Profil und die Briefvorlage. Wiederherstellen überschreibt Berichte mit gleicher Nummer und lässt alles andere stehen – es löscht also nichts.',
      ),
      warnung(
        'Die Sicherungsdatei ist nicht verschlüsselt und enthält Kunden- und Personendaten. Behandeln Sie sie wie den Bericht selbst und löschen Sie sie, wenn Sie sie nicht mehr brauchen.',
      ),
      bild('05-einstellungen-datensicherung.png', 'Sichern und Wiederherstellen.'),
    ],
  },
  {
    titel: 'Datenschutz',
    bloecke: [
      absatz(
        'In Ihren Berichten stehen Kunden- und Mitarbeiterdaten. Dieselben Sätze finden Sie jederzeit in der App unter Einstellungen → Datenschutz.',
      ),
      bild('06-datenschutz.png', 'Die Datenschutz-Hinweise in der App.'),
      ...datenschutzBloecke,
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
            'Die App startet nicht ohne Empfang.',
            'Beim ersten Öffnen war noch nicht alles geladen. Einmal mit Internet öffnen und warten, bis die Startseite steht.',
          ],
          [
            'Die Diktiertaste fehlt.',
            'Dieses Handy unterstützt die Spracheingabe nicht. Tippen geht immer.',
          ],
          [
            'Die Briefvorlage lässt sich nicht hinterlegen.',
            'Erlaubt sind PDF, PNG und JPEG bis 5 MB. Eine kennwortgeschützte PDF geht nicht – dann den Bogen als PNG speichern.',
          ],
          [
            'Der Text läuft in den Briefkopf.',
            'Die Abstände in den Einstellungen erhöhen: „Oben, Seite 1" und „Oben, ab Seite 2".',
          ],
          [
            'Der Briefbogen fehlt in der Word-Datei.',
            'Word kann PDF-Vorlagen nicht einbetten. Den Bogen als PNG hinterlegen.',
          ],
          [
            '„Bericht versenden" lädt nur herunter.',
            'Dieses Gerät kann Dateien nicht direkt teilen. Die Datei von Hand an die vorbereitete Mail anhängen.',
          ],
          [
            'Ein Bericht ist verschwunden.',
            'Der Browserspeicher wurde gelöscht. Nur eine Sicherung bringt ihn zurück – deshalb regelmäßig sichern.',
          ],
        ],
      },
      hinweis(
        'Bleibt eine Frage offen: An die Kolleginnen und Kollegen wenden, die die App betreuen. Fehler in der App gehören dorthin gemeldet, nicht an den Kunden.',
      ),
    ],
  },
]
