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
- Unterschrift mit dem Finger
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

## Daten sichern

Die Berichte liegen nur auf diesem einen Gerät. Geht das Handy verloren oder
löschen Sie den Browserspeicher, sind sie weg.

Deshalb regelmäßig: **Einstellungen → „Alle Daten sichern (JSON)"**. Die Datei
lässt sich über **„Daten wiederherstellen"** auf demselben oder einem neuen Gerät
wieder einlesen.

## Für Entwickler

```bash
npm install       # Pakete holen
npm run dev       # Entwicklungsserver
npm test          # Tests (Taupunkt, Nummernvergabe, PDF, Word, Versand)
npm run lint      # Codeprüfung
npm run build     # Fertige Dateien nach dist/
npm run icons     # App-Symbole aus public/favicon.svg neu erzeugen
```

Eine Beispiel-PDF und -Word-Datei mit Testdaten zum Ansehen:

```bash
npx vite-node scripts/beispielPdf.ts .
```

**Veröffentlichen:** Jeder Push auf `main` baut die App und stellt sie über
GitHub Actions auf GitHub Pages bereit (`.github/workflows/deploy.yml`).
Der Basispfad in `vite.config.ts` muss zum Repository-Namen passen.

**Aufbau des Codes:**

| Ordner | Inhalt |
|---|---|
| `src/screens/` | Die Bildschirme, `schritte/` sind die Schritte des Assistenten |
| `src/components/` | Wiederverwendete Bausteine (Knöpfe, Felder, Unterschrift) |
| `src/lib/` | Datenhaltung (`db.ts`), Fachlogik (`taupunkt.ts`), Ausgabe (`pdf.ts`, `docx.ts`, `teilen.ts`) |
| `src/data/stammdaten.ts` | Alle Auswahllisten – hier ändern, sonst nirgends |
| `tests/` | Tests der Rechen- und Ausgabelogik |

Der vollständige Auftrag steht in [SPEC.md](SPEC.md).
