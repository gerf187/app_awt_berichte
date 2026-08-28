# Dokumentation

| Datei / Ordner | Was drin ist |
|---|---|
| `Anleitung_Baustellenbericht.pdf` | Die vollständige Anleitung mit Bildern. Dieselbe Datei liegt als `public/Anleitung.pdf` in der App. |
| `bilder/` | Die Bildschirmfotos der Anleitung. Erzeugt, nicht von Hand gepflegt. |
| `beispiel/` | Neutraler Beispiel-Briefbogen „Musterfirma GmbH" als PNG und als zweiseitige PDF. |

## Neu bauen

```bash
npm run briefbogen         # Beispiel-Briefbogen (nur nötig, wenn er fehlt)
npm run build              # die Anleitung fotografiert die gebaute App
npm run anleitung:bilder   # einmalig vorher: npx playwright install chromium
npm run anleitung          # setzt die PDF neu
```

Nach jeder sichtbaren Änderung an der Oberfläche gehören die Bilder neu
gemacht – eine Anleitung, die etwas anderes zeigt als die App, ist schlimmer
als keine.

## Keine echten Daten

Alle Bilder zeigen erfundene Musterdaten („Musterfirma GmbH", „Max Muster",
„Neubau Lagerhalle Ost") und den neutralen Beispiel-Briefbogen. Der echte
Firmenbriefbogen wird in der App hinterlegt und liegt nie im Repository –
siehe [../DATENSCHUTZ.md](../DATENSCHUTZ.md).
