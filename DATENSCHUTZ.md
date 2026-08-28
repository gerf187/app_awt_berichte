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

Die App ist eine reine Browser-Anwendung ohne Server, ohne Konto und ohne
Netzwerkverkehr. **Alle Daten bleiben auf dem Gerät des Anwendungstechnikers.**
Es gibt keinen Auftragsverarbeiter, keine Übermittlung in ein Drittland und
keine Profilbildung. Der einzige Weg, auf dem Daten das Gerät verlassen, ist
der bewusste Versand des fertigen Berichts durch den Anwender.

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
| **Empfänger** | Nur die vom Anwender gewählten Empfänger des fertigen Berichts (Kunde, Verarbeiter, interne Stellen). Kein Dienstleister, kein Cloud-Anbieter. |
| **Drittlandübermittlung** | Keine |
| **Löschfristen** | Auf dem Gerät: sofort nach Versand und Ablage, spätestens `<Frist>`. Im führenden Ablagesystem: `<handels-/steuerrechtliche Aufbewahrung>` |
| **Technisch-organisatorische Maßnahmen** | Siehe Abschnitt 5 |

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

## 5. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)

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

---

## 6. Restrisiken

| Risiko | Bewertung | Gegenmaßnahme |
|---|---|---|
| Verlust oder Diebstahl des Geräts | Berichte sind ohne Gerätesperre lesbar | Gerätesperre und Verschlüsselung erzwingen (MDM), Berichte zeitnah löschen |
| Sicherungsdatei liegt unverschlüsselt herum | enthält alles inkl. Fotos und Briefbogen | Ablageregel, Hinweis in der App, Datei nach dem Einspielen löschen |
| Versand an den falschen Empfänger | menschlicher Fehler beim Teilen | Schulung, Vier-Augen-Prinzip bei heiklen Berichten |
| Browserdaten werden gelöscht | Datenverlust, kein Datenschutzvorfall | regelmäßige Sicherung |
| Nutzung auf einem privaten Gerät | unkontrollierter Datenbestand | Nutzungsregel, siehe oben |

---

## 7. Geplante Erweiterungen mit Datenschutzbezug

Diese Punkte sind **noch nicht umgesetzt** und brauchen vor der Umsetzung eine
eigene Bewertung:

- **Daten aus dem Anforderungsformular übernehmen** (Technikeranfrage per
  Outlook/Microsoft Graph): würde erstmals eine Verbindung zu einem
  Fremdsystem herstellen. Zweckbindung, Rechtsgrundlage und Berechtigungsumfang
  der App-Registrierung sind vorher zu klären.
- **Ablage der Berichte in OneDrive**: Auftragsverarbeitung und Speicherort
  wären neu zu bewerten.
- **Versand direkt aus der App über das Firmenpostfach**: dito.

Solange diese Punkte offen sind, gilt: Angaben aus dem Anforderungsformular
werden von Hand übernommen, und der Versand läuft über die Teilen-Funktion des
Geräts.
