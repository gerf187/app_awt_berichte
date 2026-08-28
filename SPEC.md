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
| **Alle Daten bleiben auf dem Gerät.** Kein Netzwerk-Request mit Nutzerdaten. Keine Analytics, kein Tracking, kein Sentry. | Datenschutz / Kundendaten. Geprüft in `tests/datenschutz.test.ts`. |
| **Die Briefvorlage wird in der App hinterlegt, nicht mitgeliefert.** Kein Firmenmaterial im (öffentlichen) Repository, kein Upload zu einem Dienst. | Auf dem Briefbogen stehen Kontaktdaten von Mitarbeitern; außerdem soll eine geänderte Firmierung ohne neuen Deploy wirken. |
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

  pruefungen: {
    art: string;              // aus der Liste oder selbst geschrieben
    einheit: string;          // vorbelegt aus der Liste, überschreibbar
    werte: string[];          // Einzelwerte, beliebig viele
    bemerkung: string;        // Messstelle o. Ä.
  }[];

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

**Keine Produktliste.** Sika führt rund 33.000 Produkte – jede mitgelieferte Auswahl wäre die falsche. Das Produkt wird im Bericht getippt; die App merkt sich, was schon einmal eingetragen wurde, und bietet es beim nächsten Mal an (`Einstellungen.gemerkteProdukte`).

**Auswahlliste Prüfungen** (mit vorbelegter Einheit): Haftzugfestigkeit (N/mm²), Rauhtiefe (mm), Restfeuchte (CM) (CM-%), LP-Gehalt (%), Ausbreitmaß (Hägemanntisch) (mm), Schichtdicke (mm), Sonstiges.

---

## 6. Bildschirme und Ablauf

Blätter statt Schritte: Ein **neuer** Bericht öffnet direkt in den Kopfdaten – dort ist ohnehin nichts ausgefüllt. Aus der Liste geöffnet, beginnt ein Bericht mit der **Kachelübersicht** aller Blätter, jede Kachel mit Zeichen und Kurztext (siehe unten). Im Blatt steht oben eine waagerecht scrollbare **Reiterleiste**, deren letzter Reiter **„Übersicht"** in die Kacheln zurückführt; unten bleiben **Zurück / Weiter**. Auf der Baustelle wird über den Tag zu einzelnen Punkten nachgetragen – ein Tipp führt ins Blatt, ohne Zurückblättern. **Kein Speichern-Knopf** – nach jeder Eingabe wird automatisch gespeichert (debounced).

Zeichen an Reiter und Kachel (`src/lib/blattstand.ts`): **✓ grün** Pflichtangaben vollständig · **● gelb** Pflichtangabe fehlt noch (hält nicht auf) · **⚠ rot** Warnung, heute nur der unterschrittene Taupunkt. Blätter ohne Pflichtangaben bekommen kein Zeichen.

1. **Start** – Sika-Logo, zwei große Schaltflächen: „Neuer Bericht", „Meine Berichte". Unten klein: „Einstellungen".
2. **Meine Berichte** – Liste aller Berichte: Objekt, Datum, Status-Punkt (grau = Entwurf, grün = abgeschlossen). Suchfeld. Papierkorb-Symbol zum Löschen (mit Rückfrage). Tippen öffnet den Bericht.
3. **Kopfdaten** – Felder aus `kopf`. Telefonfeld mit `inputMode="tel"`. Nur der **Verarbeiter** steht hier, mit eigener Anschrift; ein Feld „Kunde" gibt es nicht – im Bodenbau ist der Verarbeiter der Ansprechpartner.
4. **Thematik & Anwesende** – Zweck-Feld (mit Spracheingabe) + beliebig viele Anwesende. Erste Zeile aus dem Profil (Name, Firma, Funktion); ohne Profil greifen die Stammdaten „Sika" / „AWT".
5. **Untergrund** – zwei Auswahllisten, Bemerkungsfeld erscheint automatisch bei „Sonstiges". Gemessen wird auf dem nächsten Blatt.
5a. **Prüfungen** – Liste von Karten wie bei „Anwesende": Prüfung aus der Auswahlliste (oder selbst geschrieben), vorbelegte Einheit, **beliebig viele Einzelwerte** je Prüfung, Bemerkung. Ab zwei Werten zeigt die App den **Mittelwert**; er steht auch im Bericht. Nicht Gemessenes taucht im Dokument gar nicht erst auf – ein „k.A." bei einer Prüfung, die niemand vorhatte, sagt nichts.
6. **Klimawerte** – Liste + „+ Messung". Uhrzeit vorbelegt. **Taupunkt und Abstand live berechnet.** Abstand < 3 K → rote Warnung: „Achtung: Abstand zum Taupunkt unter 3 K – Beschichtung nicht freigeben."
7. **Aufbau** – Liste + Dialog für Bereich, Schicht, Produkt, Fläche, Verbrauch, Gesamtmenge, Chargen.
   - **Bereich**: Beispiele als Platzhalter; ab der zweiten Zeile eine Schaltfläche **„wie Vorposition"**, damit „Halle 1" nicht jedes Mal neu getippt wird.
   - **Bereich und Fläche feststellen**: ein Haken im Dialog. Danach beginnt jede neue Zeile mit demselben Bereich und derselben Fläche (`Bericht.aufbauFest`); oben auf dem Blatt steht, was festgestellt ist, und lässt sich aufheben. Grundierung, Kratzspachtelung und Beschichtung liegen auf derselben Fläche.
   - **Produkt**: Freitext mit Vorschlägen aus den gemerkten Produkten.
   - **Chargen**: eine Nummer je Komponente (`Komp. A`, `Komp. B`, …), „+ Komponente" legt eine weitere an. Zwei- bis vierkomponentige Gebinde sind der Normalfall; im Schadensfall wird nach genau diesen Nummern gefragt.
   - **Verbrauch und Gesamtmenge** (`src/lib/verbrauch.ts`): Eingetragen wird das eine oder das andere, die App rechnet über die Fläche um. Gespeichert wird immer in kg/m². Die Einheit springt automatisch: Eingaben ab 10 sind g/m² gemeint (200 → 0,2 kg/m²), darunter kg/m². Angezeigt wird nach Praxis – unter 1,00 kg in g/m², darüber in kg/m².
8. **Bericht & Feststellungen** – fünf Freitextfelder: ausgeführte Arbeiten, Besprochenes, Mängel, Empfehlung und **offene Fragen**. Jedes mit **Spracheingabe-Taste** (Web Speech API, `de-DE`; wenn nicht unterstützt, Taste ausblenden). Leere Felder erscheinen im Dokument nicht. Pflicht ist einer der ersten vier Abschnitte – eine offene Frage allein ersetzt keinen Bericht.
   - **„Text glätten"** unter jedem mehrzeiligen Feld (`src/utils/cleanDictation.ts`, `src/components/TextGlaetten.tsx`): gesprochene Satzzeichen („Komma", „neuer Absatz"), Dezimalzahlen („3 Komma 5" → 3,5), Füllwörter (`FILLER_WORDS`), Abstände und Satzanfänge. **Reine Funktion, kein Netz, keine Bibliothek** – Berichtstexte enthalten Kundendaten. Messwerte, Einheiten, Produktnamen und Großbuchstaben bleiben unverändert; zweimal angewendet ändert sich nichts mehr. Ausgelöst wird nur auf Knopfdruck, danach wird derselbe Knopf zu **„Rückgängig"** (solange der geglättete Text unverändert im Feld steht).
10. **Fotos** – „Foto aufnehmen" (`capture="environment"`) und „Aus Galerie wählen". Beschreibungsfeld je Foto, ebenfalls mit Spracheingabe. Downscaling auf **max. 1600 px lange Kante, JPEG-Qualität 0,75**. Reihenfolge per Pfeiltasten, Löschen möglich.
11. **Abschluss** – Zusammenfassung, fehlende Pflichtfelder (antippbar, führen ins zuständige Blatt), Absenderzeile aus dem Profil, Unterschrift, dann **„PDF erzeugen"**, **„Word erzeugen"**, **„Bericht versenden"**. Eine erfolgreiche Ausgabe setzt den Bericht **selbst auf „Abgeschlossen"** (abgebrochenes Teilen nicht); von Hand umstellen geht weiterhin. Ganz unten führen zwei Schaltflächen zu „Meine Berichte" und zur Startseite.

**Einstellungen:** vier Abschnitte.

1. **Profil** (Name, Funktion, Firma, Straße, PLZ/Ort, Telefon, E-Mail), füllt „Anwesende" vor und liefert die Absenderzeile im Bericht.
2. **Briefvorlage** – siehe Abschnitt 6a.
3. **Datensicherung** („Alle Daten sichern (JSON)" / „Daten wiederherstellen"), mit dem Hinweis, dass die Datei unverschlüsselt ist.
4. **Anleitung** (Verweis auf die mitgelieferte PDF) und **Datenschutz** (eigener Bildschirm, dazu „Alle Daten auf diesem Gerät löschen").

---

## 6a. Briefvorlage (Briefbogen)

Der Bericht steht auf dem Briefbogen des Hauses. Der Bogen wird **in der App hochgeladen** (`Einstellungen → Briefvorlage`) und liegt danach ausschließlich in der lokalen Datenbank dieses Geräts.

- **Formate:** PDF, PNG, JPEG, höchstens 5 MB. Andere Dateien werden mit einer verständlichen Meldung abgewiesen (`src/lib/vorlage.ts`).
- **Bilder** werden beim Hinterlegen auf A4-Maß (längste Kante 2000 px) verkleinert, auf Weiß gelegt und als JPEG gespeichert. Sonst landet ein PNG mit Alphakanal unkomprimiert in jeder Berichts-PDF; nebenbei fallen die Zusatzdaten der Datei weg.
- **Satzspiegel** in Millimetern, einstellbar: oben Seite 1, oben ab Seite 2, unten, links, rechts. Vorschlagswerte 60/60/35/25/20; bei zweiseitigen Vorlagen 60/40/35/25/20.
- **Seitenwahl:** Zweiseitige PDF-Vorlagen liefern Seite 1 für das erste Blatt und Seite 2 für alle weiteren. Einseitige Vorlagen wiederholen sich nur, wenn „Briefbogen auch auf den Folgeseiten drucken" angehakt ist.
- **PDF-Ausgabe:** Bild-Vorlagen werden als Untergrund auf jede Seite gezeichnet (einmal eingebettet, per Alias), PDF-Vorlagen am Ende mit `pdf-lib` untergelegt. Mit Vorlage entfällt die eigene gelbe Kopfzeile; stattdessen steht „Baustellenbericht" als Überschrift über den Kopfdaten.
- **Word-Ausgabe:** Bild-Vorlagen wandern als frei stehende Grafik hinter den Text in die Kopfzeile (`titlePage` trennt Seite 1 von den Folgeseiten). Eine PDF-Vorlage kann Word nicht einbetten – dann bleibt es bei der eigenen Kopfzeile. Das steht so in der Oberfläche und in der Anleitung.
- **Ohne Vorlage** bleibt alles wie bisher: eigene Kopfzeile, schmale Ränder.

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

## 8a. Datenschutz

In Berichten, Briefvorlage und Anforderungsformular stehen Kunden- und Mitarbeiterdaten. Verbindlich:

- Kein Netzwerkaufruf zur Laufzeit – `tests/datenschutz.test.ts` prüft den Quelltext auf `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `importScripts`, `navigator.geolocation` und fremde Adressen.
- Fotos werden über ein Canvas neu erzeugt; die Zusatzdaten der Kamera (auch GPS) fallen dabei weg.
- **Löschen in einem Schritt:** `Einstellungen → Datenschutz → „Alle Daten auf diesem Gerät löschen"` leert Berichte *und* Einstellungen inklusive Briefvorlage.
- **Datenschutz-Bildschirm** in einfacher Sprache. Der Text steht in `src/data/datenschutz.ts` und wird von der App **und** der Anleitung benutzt – eine Quelle, zwei Ausgaben.
- Die förmliche Fassung (Verarbeitungsverzeichnis nach Art. 30, technische und organisatorische Maßnahmen nach Art. 32, Restrisiken) steht in `DATENSCHUTZ.md`.

## 8b. Anleitung

Eine vollständige Anleitung mit Bildern zu jedem Schritt, die **als PDF bereitsteht**:

- `npm run anleitung:bilder` baut die App, startet sie örtlich, legt erfundene Musterdaten in die Browser-Datenbank und fotografiert mit Playwright jeden Bildschirm nach `dokumentation/bilder/`. Dazu zwei Seiten des erzeugten Berichts über `pdftoppm`.
- `npm run anleitung` setzt daraus `dokumentation/Anleitung_Baustellenbericht.pdf` und legt dieselbe Datei als `public/Anleitung.pdf` ab – damit wird sie mit der App ausgeliefert und ist unter `Einstellungen → Anleitung` auch offline zu öffnen.
- Text in `scripts/anleitungInhalt.ts`, Satz in `scripts/anleitung.ts`: Titelseite, Inhaltsverzeichnis mit Seitenzahlen, ein Kapitel je Blatt, Hinweis- und Warnkästen, Bildunterschriften.
- **Keine echten Daten in der Anleitung.** Alle Bilder zeigen „Musterfirma GmbH" / „Max Muster"; der Beispiel-Briefbogen entsteht aus `scripts/beispielBriefbogen.mjs`.

## 9. PWA-Anforderungen

- `manifest.webmanifest`: Name „Baustellenbericht", Kurzname „Bericht", `display: standalone`, `orientation: portrait`, Sika-Farben.
- Precache schließt `*.pdf` ein, damit die Anleitung ohne Empfang aufgeht.
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
- [ ] Briefvorlage lässt sich als PDF, PNG und JPEG hinterlegen, entfernen und austauschen
- [ ] Bericht steht auf der Vorlage, ohne in Kopf oder Fußzeile zu laufen – PDF geprüft
- [ ] Vorlage taucht in keinem Commit auf; im Repository liegt nur der Beispiel-Briefbogen „Musterfirma"
- [ ] „Alle Daten auf diesem Gerät löschen" entfernt Berichte, Profil und Vorlage
- [ ] `DATENSCHUTZ.md` und der Datenschutz-Bildschirm sagen dasselbe
- [ ] Anleitung als PDF vorhanden, jeder Schritt mit Bild, in der App offline zu öffnen
