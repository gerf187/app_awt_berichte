# Dokumentation

| Datei / Ordner | Was drin ist |
|---|---|
| `Anleitung_Baustellenbericht.pdf` | Die Kurzanleitung, drei Seiten. Dieselbe Datei liegt als `public/Anleitung.pdf` in der App. |
| `bilder/` | Bildschirmfotos der App für Schulungen. Erzeugt, nicht von Hand gepflegt; die Kurzanleitung selbst kommt ohne Bilder aus. |
| `beispiel/` | Neutraler Beispiel-Briefbogen „Musterfirma GmbH" als PNG und als zweiseitige PDF. |

## Neu bauen

```bash
npm run briefbogen         # Beispiel-Briefbogen (nur nötig, wenn er fehlt)
npm run anleitung          # setzt die Kurzanleitung neu
npm run build              # nur für die Bildschirmfotos: sie fotografieren die gebaute App
npm run anleitung:bilder   # einmalig vorher: npx playwright install chromium
```

Nach jeder sichtbaren Änderung an der Oberfläche gehört der Text der
Anleitung geprüft – eine Anleitung, die etwas anderes beschreibt als die App,
ist schlimmer als keine.

## Keine echten Daten

Alle Bilder zeigen erfundene Musterdaten („Musterfirma GmbH", „Max Muster",
„Neubau Lagerhalle Ost") und den neutralen Beispiel-Briefbogen. Der echte
Firmenbriefbogen wird in der App hinterlegt und liegt nie im Repository –
siehe [../DATENSCHUTZ.md](../DATENSCHUTZ.md).
