# Baustellenbericht

Eine App für den Baustellenbericht – auf dem Handy, ohne Empfang, ohne Anmeldung.
Sie erfassen den Bericht vor Ort und erzeugen daraus mit einem Fingertipp eine
PDF- oder Word-Datei, die Sie direkt weiterschicken können.

## Was die App kann

- Bericht anlegen: Kopfdaten, Anwesende, Untergrund, Klimawerte, Aufbau, Text,
  offene Fragen, Fotos
- **Taupunkt wird mitgerechnet.** Liegt der Untergrund weniger als 3 K über dem
  Taupunkt, erscheint eine rote Warnung.
- Fotos direkt aus der Kamera, automatisch verkleinert
- Freitexte und Bildbeschreibungen können diktiert werden (wenn das Handy es
  unterstützt)
- **Verbrauch rechnet mit.** Verbrauch je m² oder Gesamtmenge eintragen – das
  andere ergibt sich aus der Fläche. Die Einheit springt selbst um: 1,2 kg/m²,
  200 g/m².
- Unterschrift mit dem Finger
- **Bericht auf dem eigenen Briefbogen.** Die Briefvorlage wird in der App
  hinterlegt und bleibt auf dem Gerät.
- Ausgabe als PDF und als Word-Datei, Versand über die Teilen-Funktion des Handys
- **Alles bleibt auf Ihrem Gerät.** Die App schickt keine Daten irgendwohin.

## Auf das Handy holen

1. Den Link der App im Browser öffnen (Safari auf dem iPhone, Chrome auf Android).
2. Auf „Teilen" tippen und **„Zum Startbildschirm hinzufügen"** wählen.
3. Ab jetzt gibt es ein App-Symbol. Beim ersten Öffnen mit Internet warten, bis
   die Startseite da ist – danach läuft die App auch im Flugmodus.

## Bedienung

Ein Bericht besteht aus **Blättern**. Beim Öffnen sehen Sie alle Blätter als
Kacheln; im Blatt selbst können Sie oben über die Reiter direkt zu jedem anderen
springen. So lässt sich über den Tag zu jedem Punkt nachtragen, ohne
zurückzublättern.

Das Zeichen an Reiter und Kachel sagt, wie es um das Blatt steht:

| Zeichen | Bedeutung |
|---------|-----------|
| ✓ grün  | Pflichtangaben sind da |
| ● gelb  | eine Pflichtangabe fehlt noch – hält Sie nicht auf |
| ⚠ rot   | Warnung: der Untergrund liegt zu nah am Taupunkt |

Blätter, auf denen nichts Pflicht ist, tragen kein Zeichen.

- **Einen Speichern-Knopf gibt es nicht.** Alles wird sofort gespeichert.
- Fehlende Pflichtangaben stehen am Ende noch einmal zusammen; ein Tipp darauf
  führt zum richtigen Blatt.
- Über **Einstellungen → Mein Profil** tragen Sie einmal Ihre Daten ein. Sie
  stehen danach in jedem neuen Bericht unter „Anwesende" und in der
  Adresszeile.
- Produkte werden im Bericht von Hand eingetragen. Was Sie einmal eingetragen
  haben, merkt sich die App und bietet es beim nächsten Mal zur Auswahl an.

## Anleitung

Die vollständige Anleitung mit Bildern zu jedem Schritt liegt als PDF bei:
**[dokumentation/Anleitung_Baustellenbericht.pdf](dokumentation/Anleitung_Baustellenbericht.pdf)**.
In der App steht sie unter **Einstellungen → Anleitung** und lässt sich auch
ohne Empfang öffnen – sie wird mit ausgeliefert.

## Briefvorlage

Der Bericht soll auf dem Briefbogen des Hauses stehen. Diesen Briefbogen
hinterlegen Sie selbst: **Einstellungen → Briefvorlage → „Briefvorlage
hochladen"** (PDF, PNG oder JPEG, bis 5 MB).

„Hochladen" heißt hier: Die Datei wandert in den Speicher dieses Geräts. Sie
wird **nicht** an einen Server geschickt und liegt auch nicht im Repository –
ein Briefbogen ist Firmenmaterial und trägt Kontaktdaten von Mitarbeitern
(siehe [DATENSCHUTZ.md](DATENSCHUTZ.md)).

- Die Abstände („Wo darf der Bericht stehen?") sagen der App, wo Kopf und
  Fußzeile des Bogens aufhören. Einmal an einem Probebericht prüfen.
- Zweiseitige PDF-Vorlagen: Seite 1 für das erste Blatt, Seite 2 für alle
  weiteren. Einseitige Vorlagen wiederholen sich auf Wunsch.
- Word kann PDF-Vorlagen nicht einbetten. Wer den Bogen auch in der
  Word-Datei braucht, hinterlegt ihn als PNG.
- Ohne Vorlage druckt die App ihre eigene schlichte Kopfzeile.

## Daten sichern

Die Berichte liegen nur auf diesem einen Gerät. Geht das Handy verloren oder
löschen Sie den Browserspeicher, sind sie weg.

Deshalb regelmäßig: **Einstellungen → „Alle Daten sichern (JSON)"**. Die Datei
lässt sich über **„Daten wiederherstellen"** auf demselben oder einem neuen Gerät
wieder einlesen.

Die Sicherung enthält Berichte samt Fotos, das Profil und die Briefvorlage –
**unverschlüsselt**. Sie gehört auf ein dienstliches Laufwerk, nicht in einen
privaten Cloudordner.

## Datenschutz

In den Berichten stehen Kunden- und Mitarbeiterdaten. Die kurze Fassung für den
Anwender steht in der App unter **Einstellungen → Datenschutz**, die förmliche
Fassung mit Rechtsgrundlagen, Verarbeitungsverzeichnis und technischen
Maßnahmen in **[DATENSCHUTZ.md](DATENSCHUTZ.md)**.

Wer ein Gerät abgibt oder tauscht: **Einstellungen → Datenschutz → „Alle Daten
auf diesem Gerät löschen"** räumt Berichte, Fotos, Profil und Briefvorlage in
einem Schritt weg.

## Für Entwickler

```bash
npm install       # Pakete holen
npm run dev       # Entwicklungsserver
npm test          # Tests (Taupunkt, Nummernvergabe, PDF, Word, Vorlage, Datenschutz)
npm run lint      # Codeprüfung
npm run build     # Fertige Dateien nach dist/
npm run icons     # App-Symbole aus public/favicon.svg neu erzeugen
npm run briefbogen        # neutralen Beispiel-Briefbogen erzeugen
npm run anleitung:bilder  # Bildschirmfotos für die Anleitung (braucht Chromium)
npm run anleitung         # Anleitung als PDF setzen
```

Beispiel-PDFs und -Word-Dateien mit Testdaten zum Ansehen – ohne Briefbogen,
mit Bild-Briefbogen und mit PDF-Briefbogen:

```bash
npx vite-node scripts/beispielPdf.ts beispiel
```

**Die Anleitung neu bauen** (nach Änderungen an der Oberfläche):

```bash
npm run build
npm run anleitung:bilder   # einmalig vorher: npx playwright install chromium
npm run anleitung
```

`anleitung:bilder` startet die gebaute App örtlich, legt erfundene Musterdaten
in die Browser-Datenbank und fotografiert jeden Bildschirm. Für die Bilder des
fertigen Berichts wird `pdftoppm` (poppler-utils) benutzt; fehlt es, bleiben
nur diese zwei Bilder aus.

**Veröffentlichen:** Jeder Push auf `main` baut die App und stellt sie über
GitHub Actions auf GitHub Pages bereit (`.github/workflows/deploy.yml`).
Der Basispfad in `vite.config.ts` muss zum Repository-Namen passen.

**Aufbau des Codes:**

| Ordner | Inhalt |
|---|---|
| `src/screens/` | Die Bildschirme, `blaetter/` sind die Blätter eines Berichts |
| `src/components/` | Wiederverwendete Bausteine (Knöpfe, Felder, Unterschrift) |
| `src/lib/` | Datenhaltung (`db.ts`), Fachlogik (`taupunkt.ts`), Briefbogen (`vorlage.ts`), Ausgabe (`pdf.ts`, `docx.ts`, `teilen.ts`) |
| `src/data/stammdaten.ts` | Alle Auswahllisten – hier ändern, sonst nirgends |
| `src/data/datenschutz.ts` | Die Datenschutz-Sätze für App **und** Anleitung |
| `scripts/` | Werkzeuge: Symbole, Beispieldateien, Anleitung |
| `dokumentation/` | Anleitung als PDF, ihre Bilder, neutraler Beispiel-Briefbogen |
| `tests/` | Tests der Rechen- und Ausgabelogik sowie der Datenschutz-Zusage |

Der vollständige Auftrag steht in [SPEC.md](SPEC.md).
