# Build-Auftrag: Baustellenbericht-PWA (Sika AWT)

## 1. Ziel in einem Satz

Eine Web-App, die ein Sika-Anwendungstechniker auf dem Handy als Symbol auf dem Startbildschirm hat, die **offline auf der Baustelle** funktioniert, mit der er einen kompletten Baustellenbericht inkl. Fotos erfasst und daraus per Knopfdruck ein fertiges **PDF und Word-Dokument** erzeugt und verschickt.

---

## 2. Harte Rahmenbedingungen (nicht verhandelbar)

| Regel | Grund |
|---|---|
| **Kein Microsoft.** Kein Power Apps, Power Automate, SharePoint, OneDrive, Graph API, kein M365-Login. | Bewusster Bruch mit der alten Architektur. |
| **Kein Backend, kein Server, keine Datenbank.** Reine statische Web-App. | Läuft auf GitHub Pages, keine IT-Freigabe nötig. |
| **Keine Runtime-CDNs.** Alle Bibliotheken werden zur Buildzeit gebündelt. | Muss offline funktionieren. |
| **Alle Daten bleiben auf dem Gerät.** Kein Netzwerk-Request mit Nutzerdaten. Keine Analytics, kein Tracking, kein Sentry. | Datenschutz / Kundendaten. |
| **Vollständig offline lauffähig** nach dem ersten Laden. | Baustellen haben keinen Empfang. |
| **UI komplett auf Deutsch.** | Nutzer sind Kollegen im Außendienst. |
| **Bedienbar mit Handschuhen und einer Hand.** Touch-Ziele ≥ 48 px, große Schrift, ein Thema pro Bildschirm. | Nutzer sind keine Technik-Profis. |

---

## 3. Zielumgebung

- **Entwicklung:** GitHub Codespace (Node 20+ vorhanden).
- **Repository:** `gerf187/app_awt_berichte`
- **Deployment:** GitHub Actions → **GitHub Pages**. Automatisch bei jedem Push auf `main`.
- **Nutzung:** Der Kollege öffnet den Pages-Link am Handy → „Zum Startbildschirm hinzufügen" → App-Symbol. Danach wie eine native App, ohne Browserleiste.
- **Zielgeräte:** iPhone (Safari) und Android (Chrome), Hochformat ist Standard. Desktop-Browser muss auch sauber laufen.

---

## 4. Tech-Stack (verbindlich)

- **Vite + React + TypeScript**
- **Tailwind CSS** für Styling
- **`vite-plugin-pwa`** (Workbox) für Service Worker, Offline-Cache und Web-App-Manifest
- **`idb`** für die Datenhaltung
- **`docx`** (npm) für die Word-Ausgabe
- **`jsPDF` + `jspdf-autotable`** für die PDF-Ausgabe
- **Vitest** für Unit-Tests der Rechen- und Export-Logik
- **ESLint + Prettier**, `npm run build` muss ohne Warnungen durchlaufen

Base-Path in `vite.config.ts`: `base: '/app_awt_berichte/'`

---

## 5. Datenmodell

```ts
type Bericht = {
  id: string;                 // uuid
  status: 'Entwurf' | 'Abgeschlossen';
  erstelltAm: string;         // ISO
  geaendertAm: string;        // ISO

  kopf: {
    berichtsnummer: string;   // automatisch: JJJJ-MM-TT-lfd
    datum: string;            // Standard: heute
    projekt: string;          // Bauvorhaben / Objektbezeichnung
    objektStrasse: string;
    objektOrt: string;
    kunde: string;            // Kunde
    verarbeiter: string;      // ausführende Firma
    verarbeiterStrasse: string;
    verarbeiterOrt: string;
    ansprechpartner: string;
    telefon: string;
    awt: string;              // Sika-Anwendungstechniker (aus Profil vorbelegt)
    vertrieb: string;         // Sika-Vertriebsmitarbeiter
    zweck: string;            // Grund des Besuchs
  };

  anwesende: { name: string; firma: string; funktion: string }[];

  untergrund: {
    art: string;
    vorbereitung: string;
    bemerkung: string;        // Freitext, Pflicht wenn "Sonstiges"
    restfeuchteCM: string;    // CM-%
    haftzugfestigkeit: string;// N/mm²
  };

  klima: {
    uhrzeit: string;          // HH:MM
    luft: number;             // °C
    boden: number;            // °C (Untergrundtemperatur)
    feuchte: number;          // % rF
    taupunkt: number;         // °C – automatisch berechnet
    abstandTaupunkt: number;  // boden - taupunkt, automatisch
    warnung: boolean;         // true wenn abstandTaupunkt < 3
  }[];

  aufbau: {
    bereich: string;
    schicht: string;
    produkt: string;
    verbrauch: string;        // kg/m²
    charge: string;
    flaeche: string;          // m²
  }[];

  text: {
    ausgefuehrteArbeiten: string;
    besprochenes: string;
    maengel: string;
    empfehlung: string;
  };

  fotos: { id: string; dataUrl: string; beschreibung: string; aufgenommenAm: string }[];

  unterschrift?: string;      // dataUrl (PNG) – optional
};
```

**Auswahlliste Untergrund:** Zementestrich, Calciumsulfatestrich (Anhydrit), Beton, Gussasphalt, Altbeschichtung, Fliesen, Holz, Stahl, Sonstiges

**Auswahlliste Untergrundvorbereitung:** Kugelstrahlen, Schleifen/Diamantschleifen, Fräsen, Absaugen, Grundierung vorhanden, Keine Vorbereitung, Sonstiges

Alle Auswahllisten liegen zentral in **einer** Datei `src/data/stammdaten.ts`.

**Keine Produktliste.** Sika führt rund 33.000 Produkte – jede mitgelieferte Auswahl wäre die falsche. Das Produkt wird im Bericht getippt; die App merkt sich, was schon einmal eingetragen wurde, und bietet es beim nächsten Mal an (`Einstellungen.gemerkteProdukte`). Zum Filtern dieser Vorschläge gibt es die Produktgruppen Sikafloor, Sikagard, Sikalastic, SikaEpoCem, Sikaflex, Sikabond.

---

## 6. Bildschirme und Ablauf

Blätter statt Schritte: Ein Bericht öffnet mit einer **Kachelübersicht** aller Blätter, jede Kachel mit Zeichen und Kurztext (siehe unten). Im Blatt steht oben eine waagerecht scrollbare **Reiterleiste**, unten bleiben **Zurück / Weiter**. Auf der Baustelle wird über den Tag zu einzelnen Punkten nachgetragen – ein Tipp führt ins Blatt, ohne Zurückblättern. **Kein Speichern-Knopf** – nach jeder Eingabe wird automatisch gespeichert (debounced).

Zeichen an Reiter und Kachel (`src/lib/blattstand.ts`): **✓ grün** Pflichtangaben vollständig · **● gelb** Pflichtangabe fehlt noch (hält nicht auf) · **⚠ rot** Warnung, heute nur der unterschrittene Taupunkt. Blätter ohne Pflichtangaben bekommen kein Zeichen.

1. **Start** – Sika-Logo, zwei große Schaltflächen: „Neuer Bericht", „Meine Berichte". Unten klein: „Einstellungen".
2. **Meine Berichte** – Liste aller Berichte: Objekt, Datum, Status-Punkt (grau = Entwurf, grün = abgeschlossen). Suchfeld. Papierkorb-Symbol zum Löschen (mit Rückfrage). Tippen öffnet den Bericht.
3. **Kopfdaten** – Felder aus `kopf`. Telefonfeld mit `inputMode="tel"`. Kunde und Verarbeiter sind zwei Angaben, nicht drei – „Auftraggeber" gibt es nicht mehr.
4. **Thematik & Anwesende** – Zweck-Feld (mit Spracheingabe) + beliebig viele Anwesende. Erste Zeile aus dem Profil (Name, Firma, Funktion); ohne Profil greifen die Stammdaten „Sika" / „AWT".
5. **Untergrund** – zwei Auswahllisten, Bemerkungsfeld erscheint automatisch bei „Sonstiges", dazu die Messwerte **Restfeuchte, Haftzugfestigkeit und Rauhtiefe**. Nicht gemessene Werte stehen im Bericht als **k.A.** – eine fehlende Zeile lässt den Leser rätseln.
6. **Klimawerte** – Liste + „+ Messung". Uhrzeit vorbelegt. **Taupunkt und Abstand live berechnet.** Abstand < 3 K → rote Warnung: „Achtung: Abstand zum Taupunkt unter 3 K – Beschichtung nicht freigeben."
7. **Aufbau** – Liste + Dialog für Bereich, Schicht, Produkt, Fläche, Verbrauch, Gesamtmenge, Charge.
   - **Bereich**: Beispiele als Platzhalter; ab der zweiten Zeile eine Schaltfläche **„wie Vorposition"**, damit „Halle 1" nicht jedes Mal neu getippt wird.
   - **Produkt**: Freitext mit Vorschlägen aus den gemerkten Produkten, gefiltert über die Produktgruppe.
   - **Verbrauch und Gesamtmenge** (`src/lib/verbrauch.ts`): Eingetragen wird das eine oder das andere, die App rechnet über die Fläche um. Gespeichert wird immer in kg/m². Die Einheit springt automatisch: Eingaben ab 10 sind g/m² gemeint (200 → 0,2 kg/m²), darunter kg/m². Angezeigt wird nach Praxis – unter 1,00 kg in g/m², darüber in kg/m².
8. **Bericht & Feststellungen** – vier Freitextfelder. Jedes mit **Spracheingabe-Taste** (Web Speech API, `de-DE`; wenn nicht unterstützt, Taste ausblenden).
9. **Offene Fragen** – ein Freitextfeld mit Spracheingabe: was am Besuchstag nicht geklärt wurde. Leer = im Dokument nicht vorhanden.
10. **Fotos** – „Foto aufnehmen" (`capture="environment"`) und „Aus Galerie wählen". Beschreibungsfeld je Foto, ebenfalls mit Spracheingabe. Downscaling auf **max. 1600 px lange Kante, JPEG-Qualität 0,75**. Reihenfolge per Pfeiltasten, Löschen möglich.
11. **Abschluss** – Zusammenfassung, fehlende Pflichtfelder (antippbar, führen ins zuständige Blatt), Absenderzeile aus dem Profil, Unterschrift, dann **„PDF erzeugen"**, **„Word erzeugen"**, **„Bericht versenden"**.

**Einstellungen:** nur noch zwei Dinge – das **Profil** (Name, Funktion, Firma, Straße, PLZ/Ort, Telefon, E-Mail), das „Anwesende" vorfüllt und die Absenderzeile im Bericht liefert, und die **Datensicherung** („Alle Daten sichern (JSON)" / „Daten wiederherstellen").

Das Profil wird beim Anlegen in den Bericht kopiert (`bericht.absender`). Ändert sich das Profil später, bleiben alte Berichte so, wie sie verschickt wurden.

---

## 7. Fachlogik

**Taupunkt (Magnus-Formel), `src/lib/taupunkt.ts`:**

```
a = 17.62, b = 243.12
alpha = (a * T) / (b + T) + ln(RH / 100)
Taupunkt = (b * alpha) / (a - alpha)
```
Ergebnis auf eine Nachkommastelle runden. Unit-Tests mit mindestens fünf bekannten Wertepaaren.

**Berichtsnummer:** `JJJJ-MM-TT-NN`, `NN` = laufende Nummer des Tages, lokal ermittelt.

**Pflichtfelder:** Datum, Projekt, Verarbeiter, AWT, mindestens ein Klimawert, mindestens ein Absatz Freitext. Fehlende Pflichtfelder blockieren das Weiterklicken **nicht** – sie werden auf dem Abschlussbildschirm gelb markiert.

**Unterschrift (optional):** Canvas-Feld mit Finger-Eingabe und „Löschen"-Taste. Als PNG im Bericht, im PDF unter dem Text. Wenn leer, im PDF weglassen.

---

## 8. Ausgabe und Versand

### PDF (Hauptweg)
- Kopfzeile mit Sika-Logo und „Baustellenbericht", Fußzeile mit Berichtsnummer und „Seite x von y"
- Kopfdaten als zweispaltige Tabelle
- Anwesende, Klimawerte, Aufbau als Tabellen; Klimawert-Zeilen mit Taupunkt-Warnung rot markiert
- Freitextblöcke mit Überschriften
- Fotos: zwei pro Seite, Beschriftung darunter
- Unterschriftenfeld, falls vorhanden
- Dateiname: `Baustellenbericht_<Berichtsnummer>_<Projekt>.pdf`, Umlaute sauber ersetzt

### Word (.docx)
Gleicher Inhalt, gleiches Namensschema.

### Versand
1. **Web Share API** (`navigator.share` mit `files`) – Standardweg auf iPhone und Android.
2. **Fallback:** Download der Datei + `mailto:`-Schaltfläche (Empfänger aus Einstellungen, Betreff `Baustellenbericht <Nummer> – <Projekt>`, Textkörper mit Kurzzusammenfassung). Hinweistext, dass der Anhang selbst angehängt werden muss.

Zur Laufzeit `navigator.canShare({files})` prüfen. Keine toten Knöpfe.

### Datensicherung
„Alle Daten sichern" schreibt eine JSON-Datei mit allen Berichten inkl. Fotos zum Download. „Wiederherstellen" liest sie zurück.

---

## 9. PWA-Anforderungen

- `manifest.webmanifest`: Name „Baustellenbericht", Kurzname „Bericht", `display: standalone`, `orientation: portrait`, Sika-Farben.
- Icons: 192, 512 und maskable 512 (Sika-gelbes Quadrat mit Klemmbrett-Symbol, Platzhalter).
- Apple-spezifisch: `apple-touch-icon`, `apple-mobile-web-app-capable`, Splash-Meta-Tags.
- Service Worker: App-Shell komplett precachen, `registerType: 'autoUpdate'`. Bei neuer Version dezenter Hinweis „Neue Version verfügbar – neu laden".
- Die App muss im Flugmodus vollständig bedienbar sein.

---

## 10. Repo-Struktur

```
/
├─ .github/workflows/deploy.yml
├─ public/
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ screens/
│  ├─ components/
│  ├─ lib/
│  │  ├─ db.ts
│  │  ├─ taupunkt.ts
│  │  ├─ bilder.ts
│  │  ├─ pdf.ts
│  │  ├─ docx.ts
│  │  └─ teilen.ts
│  ├─ data/stammdaten.ts
│  └─ styles/
├─ tests/
├─ SPEC.md
└─ README.md
```

---

## 11. Meilensteine

1. **Gerüst** – Vite/React/TS/Tailwind/PWA, `npm run build` läuft, GitHub-Actions-Workflow, App unter Pages-URL erreichbar.
2. **Datenschicht** – IndexedDB, Bericht anlegen/laden/löschen, Autosave, Einstellungen.
3. **Navigation & Bildschirme 1–5.**
4. **Klimawerte inkl. Taupunkt-Logik + Tests.**
5. **Aufbau, Freitexte, Spracheingabe.**
6. **Fotos** inkl. Downscaling und Reihenfolge.
7. **PDF-Export** – Beispiel-PDF mit Testdaten selbst prüfen.
8. **Word-Export** – Datei erzeugen und validieren.
9. **Versand, Backup/Restore, Unterschrift.**
10. **Feinschliff** – Offline-Test, Ladezeiten, Fehlerbehandlung, README.

---

## 12. Abnahmekriterien

- [ ] `npm run build` läuft fehlerfrei, keine ESLint-Fehler
- [ ] Pages-Link funktioniert, App installiert sich auf iPhone und Android
- [ ] Im Flugmodus: App startet, Bericht komplett erfassbar, PDF wird erzeugt
- [ ] Testbericht mit 2 Anwesenden, 3 Klimawerten, 4 Aufbauzeilen, 6 Fotos → korrekte PDF **und** gültige .docx
- [ ] Taupunkt-Tests grün
- [ ] Fotos verkleinert – 6 Fotos ergeben eine PDF unter ca. 5 MB
- [ ] App-Neustart verliert keine Daten
- [ ] Backup-JSON exportier- und einspielbar
- [ ] Keine Netzwerkanfrage mit Nutzerdaten
- [ ] README auf Deutsch ohne Fachjargon
