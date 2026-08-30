# Datenschutz – Baustellenbericht-App

Stand: 28.08.2026 · Fassung für den Datenschutzbeauftragten und die IT

In der App werden **personenbezogene Daten** verarbeitet: Kunden und deren
Ansprechpartner, Mitarbeiter der ausführenden Firmen und die eigenen Kollegen.
Dieselben Daten stecken in der **Briefvorlage** (Name, Durchwahl, Anschrift im
Briefkopf) und im **Anforderungsformular**, aus dem der Anwendungstechniker die
Angaben zum Einsatz übernimmt. Dieses Dokument beschreibt, was die App damit
tut, welche Schutzmaßnahmen eingebaut sind und was organisatorisch geregelt
werden muss.

Die Fassung in einfacher Sprache für den Anwender steht in der App unter
**Einstellungen → Datenschutz** und im Kapitel „Datenschutz" der Anleitung. Der
Text dort stammt aus `src/data/datenschutz.ts` – eine Quelle, zwei Ausgaben.

> Dieses Dokument ist eine fachliche Zuarbeit aus der Entwicklung, keine
> Rechtsberatung. Verantwortlicher, Rechtsgrundlagen und Fristen sind vom
> Datenschutzbeauftragten zu bestätigen; die dafür vorgesehenen Stellen sind
> mit `<…>` gekennzeichnet.

---

## 1. Die kurze Antwort

Die App ist eine reine Browser-Anwendung ohne eigenen Server und ohne
Hintergrundverkehr. **Alle Daten bleiben auf dem Gerät des Anwendungstechnikers**,
solange der Anwender sie nicht selbst weitergibt. Die App bildet keine Profile.
Daten verlassen das Gerät auf genau drei Wegen, jeder davon durch einen
Tastendruck ausgelöst:

1. **Der bewusste Versand des fertigen Berichts** durch den Anwender.
2. **Die Diktierfunktion** – dabei überträgt nicht die App, sondern der Browser
   die Sprachaufnahme an seinen Hersteller. Das ist eine Übermittlung an einen
   Dritten, mutmaßlich in ein Drittland, und in Abschnitt 5 gesondert
   beschrieben. Sie ist freiwillig: ohne Tastendruck passiert nichts, und jede
   Eingabe lässt sich auch tippen.
3. **Die Ablage in OneDrive**, sofern der Anwender die App mit seinem
   Microsoft-Konto verbunden hat. Sie ist freiwillig, muss auf jedem Gerät
   einzeln eingerichtet werden und überträgt ausschließlich die eine Datei, die
   der Anwender ablegt (Abschnitt 4a).

---

## 2. Verarbeitungsverzeichnis (Bausteine nach Art. 30 DSGVO)

| Punkt | Angabe |
|---|---|
| **Bezeichnung** | Baustellenbericht-App (PWA) für die Anwendungstechnik |
| **Verantwortlicher** | `<Firma, Anschrift, Vertretungsberechtigter>` |
| **Datenschutzbeauftragter** | `<Name, Kontakt>` |
| **Zweck** | Dokumentation eines Baustellenbesuchs: Feststellungen, Messwerte, verwendete Produkte, Fotos; Erstellung und Versand des Berichts an Kunde und Verarbeiter |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b DSGVO (Vertragsdurchführung/-anbahnung) für Kunden- und Verarbeiterdaten; Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer belastbaren Dokumentation) für Feststellungen, Fotos und Unterschrift; für Beschäftigtendaten `<§ 26 BDSG bzw. Betriebsvereinbarung>` |
| **Betroffene Personen** | Ansprechpartner beim Kunden und beim Verarbeiter, weitere Anwesende, eigene Beschäftigte (Anwendungstechniker, Vertrieb) |
| **Datenkategorien** | Name, Firma, Funktion, dienstliche Anschrift, dienstliche Telefonnummer, E-Mail-Adresse, Unterschrift, Lichtbilder der Baustelle, Freitexte zum Besuch |
| **Empfänger** | Die vom Anwender gewählten Empfänger des fertigen Berichts (Kunde, Verarbeiter, interne Stellen). Kein Dienstleister und kein Cloud-Anbieter für die gespeicherten Daten. Bei Nutzung der **Diktierfunktion** zusätzlich der Browser-Hersteller (Apple bzw. Google) als Empfänger der Sprachaufnahme – siehe Abschnitt 5. |
| **Drittlandübermittlung** | Durch die App keine. Bei Nutzung der Diktierfunktion ist eine Übermittlung in die USA anzunehmen; Rechtsgrundlage, Angemessenheitsbeschluss und etwaige Auftragsverarbeitung sind vom Verantwortlichen zu klären `<offen>`. |
| **Löschfristen** | Auf dem Gerät: sofort nach Versand und Ablage, spätestens `<Frist>`. Im führenden Ablagesystem: `<handels-/steuerrechtliche Aufbewahrung>` |
| **Technisch-organisatorische Maßnahmen** | Siehe Abschnitt 6 |

---

## 3. Welche Daten wo liegen

| Datenart | Ort | Verlässt das Gerät? |
|---|---|---|
| Berichte inkl. Kopfdaten, Anwesende, Messwerte, Freitexte | IndexedDB `awt-berichte` im Browser des Geräts | nein |
| Fotos und Unterschrift | als Data-URL im jeweiligen Bericht, dieselbe Datenbank | nein |
| Eigenes Profil (Name, Funktion, Anschrift, Telefon, E-Mail) | dieselbe Datenbank, Objektspeicher `einstellungen` | nein |
| **Briefvorlage** (Briefbogen als PDF/PNG/JPEG) | dieselbe Datenbank, Objektspeicher `einstellungen` | nein |
| Fertige PDF/Word-Datei | vom Anwender ausgelöster Download bzw. Teilen-Dialog | **ja, bewusst** |
| Sicherungsdatei (JSON) | vom Anwender ausgelöster Download | **ja, bewusst** |
| Sprachaufnahme beim Diktieren | Mikrofon → Spracherkennung des Browsers | **ja, an den Browser-Hersteller** (Abschnitt 5) |
| Fertige PDF-Datei bei „PDF in OneDrive ablegen" | OneDrive des angemeldeten Kontos | **ja, bewusst, an Microsoft** (Abschnitt 4a) |
| OneDrive-Zugangs- und Erneuerungstoken | `localStorage` des Browsers, Schlüssel `awt-onedrive-sitzung` | nein – und **nicht** Teil der Sicherungsdatei |

Die ausgelieferte Webseite selbst enthält **keine** dieser Daten. Wer die App
hostet, sieht nur, dass jemand die Seite geladen hat – nie einen Inhalt.

---

## 4. Die Briefvorlage im Besonderen

Die Vorlage wird **in der App hochgeladen** (Einstellungen → Briefvorlage) und
liegt danach in derselben lokalen Datenbank wie die Berichte.

Warum nicht mitgeliefert oder über GitHub verteilt:

1. Das Repository ist öffentlich. Firmenmaterial und die darin stehenden
   Kontaktdaten von Mitarbeitern gehören dort nicht hinein.
2. Ein Austausch der Vorlage – geänderte Firmierung, andere Sparte – darf keine
   neue Programmversion erfordern.
3. Jedes Gerät trägt nur den Briefbogen, den dieser Kollege wirklich braucht.

Umgesetzt ist das so:

- `vorlage/` und `beispiel/` stehen in `.gitignore`; im Repository liegt nur
  ein neutraler **Beispiel-Briefbogen „Musterfirma GmbH"**
  (`dokumentation/beispiel/`), der aus `scripts/beispielBriefbogen.mjs`
  erzeugt wird und keine echten Personendaten enthält.
- Beim Hinterlegen wird ein Bild auf A4-Maß verkleinert und als JPEG abgelegt
  (`src/lib/vorlage.ts`). Dabei fallen die Zusatzdaten der Datei weg.
- „Vorlage entfernen" löscht sie sofort; „Alle Daten auf diesem Gerät löschen"
  ebenfalls.

---

## 4a. Die OneDrive-Ablage im Besonderen

Die App kann fertige Berichte in das OneDrive des Anwenders legen. Der Weg ist
bewusst schmal gehalten:

- **Freiwillig und geräteweise.** Solange sich niemand angemeldet hat,
  erscheint die Taste „PDF in OneDrive ablegen" gar nicht erst. Jedes Gerät
  wird einzeln verbunden; eine zentrale Aktivierung gibt es nicht.
- **Anmeldung ohne Umweg.** Die Anmeldung läuft als OAuth 2.0 mit PKCE
  unmittelbar zwischen Gerät und Microsoft (`login.microsoftonline.com`). Die
  App sieht das Kennwort nie und besitzt kein Client-Geheimnis; es gibt keinen
  Zwischenserver.
- **Sparsamer Berechtigungsumfang.** Erbeten werden `Files.ReadWrite`
  (Dateien ablegen), `offline_access` (Erneuerungstoken) und `User.Read`
  (Anzeige, mit welchem Konto das Gerät verbunden ist). Die App liest keine
  vorhandenen Dateien und durchsucht das Laufwerk nicht.
- **Tokens bleiben lokal.** Zugriffs- und Erneuerungstoken liegen im
  `localStorage` des Browsers, nicht in der Datenbank und deshalb auch **nicht**
  in der Sicherungsdatei. „Verbindung trennen" löscht sie vom Gerät.
- **Übertragen wird nur der eine Bericht.** Kein Abgleich, keine Synchronisation
  im Hintergrund, keine Fotos außerhalb des erzeugten PDFs.

Datenschutzrechtlich gilt: Mit dem Hochladen wandert der Bericht in den
Verantwortungsbereich des jeweiligen Microsoft-Kontos. Bei einem Firmenkonto
greift der bestehende Auftragsverarbeitungsvertrag des Unternehmens mit
Microsoft; bei einem privaten Konto besteht keiner. **Berichte mit Kunden- und
Beschäftigtendaten dürfen deshalb nur in ein dienstliches OneDrive.** Ein
privates Konto ist allenfalls für Testberichte ohne echte Personendaten
zulässig.

Die App wird mit einer eigenen Microsoft-App-Registrierung ausgeliefert; ihre
Anwendungs-ID steht offen im Quelltext, was bei einer Browser-Anwendung ohne
Client-Geheimnis vorgesehen und unbedenklich ist. Sie legt lediglich fest, als
welche Anwendung sich das Gerät bei Microsoft ausweist – Zugriff erhält immer
nur das Konto, das sich selbst anmeldet. Wird die App später in der
Unternehmensumgebung registriert, wird deren Anwendungs-ID in den Einstellungen
unter „Erweitert" eingetragen; der beschriebene Ablauf bleibt gleich.

---

## 5. Diktieren: die Spracherkennung des Browsers

Die Freitextfelder und die Bildbeschreibungen haben eine Taste „Diktieren".
Dahinter steht die **Web Speech API des Browsers**, nicht eigener Code
(`src/components/Spracheingabe.tsx`). Die Erkennung selbst findet je nach Gerät
und Browser **nicht auf dem Gerät statt**: Safari übermittelt die Aufnahme an
Apple, Chrome an Google. Das ist eine Übermittlung personenbezogener Daten an
einen Dritten, sobald etwas Personenbezogenes gesprochen wird – Serverstandort
und Verarbeitungsbedingungen bestimmt der Browser-Hersteller, nicht diese App.

Was daraus folgt:

| Punkt | Stand |
|---|---|
| Auslösung | **ausschließlich auf Tastendruck**; keine Daueraufnahme, kein Hintergrundbetrieb, kein Signalwort |
| Vermeidbarkeit | vollständig – jede Eingabe lässt sich tippen; die Taste erscheint gar nicht, wenn der Browser die Schnittstelle nicht anbietet |
| Umfang | nur das Gesprochene, keine Berichtsdaten, keine Fotos, keine Vorlage |
| Rechtsgrundlage der Übermittlung | `<vom Verantwortlichen zu bestimmen>` – bis dahin gilt die Anwenderregel unten |
| Auftragsverarbeitung / Drittland | `<zu prüfen: Verhältnis zu Apple bzw. Google, ggf. über die bestehende Geräte- und Browsernutzung im Unternehmen geregelt>` |

**Anwenderregel, solange das offen ist:** Namen, Telefonnummern und Anschriften
werden **getippt**, nicht diktiert. Diktiert werden Feststellungen, Messungen
und Beschreibungen – Sachverhalte also, keine Personendaten. Dieser Hinweis
steht so auch in der App (Einstellungen → Datenschutz) und in der Anleitung.

Nicht zu verwechseln damit ist **„Text glätten"** (`src/utils/cleanDictation.ts`):
Das bereinigt den bereits erfassten Text – gesprochene Satzzeichen, Füllwörter,
Satzanfänge – als reine Funktion **auf dem Gerät, ohne jeden Netzaufruf**, und
funktioniert auch offline.

---

## 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)

**In der App umgesetzt**

| Maßnahme | Wo |
|---|---|
| Keine Netzwerkverbindung zur Laufzeit – kein `fetch`, kein Beacon, kein Socket, keine fremden Adressen; alle Bibliotheken sind zur Buildzeit gebündelt | `tests/datenschutz.test.ts` prüft das bei jedem Testlauf |
| Kein Tracking, keine Statistik, kein Fehlerdienst, keine Werbe-Kennungen | – |
| Kein Zugriff auf den Standort | dito, `navigator.geolocation` ist verboten |
| Metadaten der Kamera (auch GPS) fallen beim Verkleinern der Fotos weg, weil das Bild über ein Canvas neu erzeugt wird | `src/lib/bilder.ts` |
| Datensparsamkeit: keine Produktdatenbank, keine Kundenliste, keine Historie über den Bericht hinaus | `src/data/stammdaten.ts` |
| Löschung einzelner Berichte und Löschung aller Daten in einem Schritt | `src/lib/db.ts` (`berichtLoeschen`, `allesLoeschen`) |
| Vorlage und Profil werden mit gelöscht | `allesLoeschen` leert beide Objektspeicher |
| Warnhinweis, dass die Sicherungsdatei unverschlüsselt ist | Einstellungen → Datensicherung |
| Auslieferung nur über HTTPS (Voraussetzung für die Installation als PWA) | Betrieb |
| Die Spracherkennung läuft nur auf Tastendruck und wird beim Verlassen des Bildschirms beendet; ohne Unterstützung im Browser erscheint die Taste gar nicht | `src/components/Spracheingabe.tsx`, Abschnitt 5 |
| Das Nachbearbeiten diktierter Texte („Text glätten") rechnet ohne Netz auf dem Gerät | `src/utils/cleanDictation.ts` |

**Organisatorisch zu regeln (nicht durch Software lösbar)**

- Gerätesperre (PIN/Biometrie) und Geräteverschlüsselung verpflichtend – das
  ist der eigentliche Schutz der lokalen Datenbank.
- Nutzung nur auf dienstlichen oder freigegebenen Geräten.
- Ablage der Sicherungsdateien auf einem dienstlichen Laufwerk, nicht in
  privaten Cloud-Ordnern.
- Löschroutine: Bericht nach Versand und Ablage vom Gerät entfernen.
- Verfahren für Betroffenenanfragen (Art. 15–18): laufen über den
  Datenschutzbeauftragten, nicht über den einzelnen Anwendungstechniker.
- Hinweis an die Anwender, Personen möglichst nicht abzulichten; wo es sich
  nicht vermeiden lässt, ist die Rechtsgrundlage vorher zu klären.
- **Diktierfunktion:** Entscheidung des Verantwortlichen, ob sie benutzt werden
  darf; bis dahin gilt die Regel aus Abschnitt 5 (keine Personendaten
  diktieren). Ein Verbot ließe sich technisch durchsetzen, indem die Taste
  entfernt wird – heute ist sie eine freiwillige Hilfe.

---

## 7. Restrisiken

| Risiko | Bewertung | Gegenmaßnahme |
|---|---|---|
| Verlust oder Diebstahl des Geräts | Berichte sind ohne Gerätesperre lesbar | Gerätesperre und Verschlüsselung erzwingen (MDM), Berichte zeitnah löschen |
| Sicherungsdatei liegt unverschlüsselt herum | enthält alles inkl. Fotos und Briefbogen | Ablageregel, Hinweis in der App, Datei nach dem Einspielen löschen |
| Versand an den falschen Empfänger | menschlicher Fehler beim Teilen | Schulung, Vier-Augen-Prinzip bei heiklen Berichten |
| Browserdaten werden gelöscht | Datenverlust, kein Datenschutzvorfall | regelmäßige Sicherung |
| Nutzung auf einem privaten Gerät | unkontrollierter Datenbestand | Nutzungsregel, siehe oben |
| Diktat mit Personenbezug | Übermittlung an Apple bzw. Google, Drittlandbezug ungeklärt | Anwenderregel „keine Personendaten diktieren", Entscheidung des Verantwortlichen, notfalls Entfernen der Taste |

---

## 8. Geplante Erweiterungen mit Datenschutzbezug

Diese Punkte sind **noch nicht umgesetzt** und brauchen vor der Umsetzung eine
eigene Bewertung:

- **Daten aus dem Anforderungsformular übernehmen** (Technikeranfrage per
  Outlook/Microsoft Graph): würde erstmals eine Verbindung zu einem
  Fremdsystem herstellen. Zweckbindung, Rechtsgrundlage und Berechtigungsumfang
  der App-Registrierung sind vorher zu klären.
- ~~**Ablage der Berichte in OneDrive**~~: umgesetzt, siehe Abschnitt 4a. Offen
  bleibt die Registrierung der App in der Unternehmensumgebung; bis dahin ist
  jede Verbindung eine Einzelentscheidung des Anwenders.
- **Versand direkt aus der App über das Firmenpostfach**: dito.

Solange diese Punkte offen sind, gilt: Angaben aus dem Anforderungsformular
werden von Hand übernommen, und der Versand läuft über die Teilen-Funktion des
Geräts.
