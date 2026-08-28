/**
 * Bildschirmfotos für die Anleitung.
 *
 * Baut die App, startet sie örtlich, legt erfundene Beispieldaten in die
 * Datenbank des Browsers und fotografiert jeden Schritt:
 *
 *   npm run anleitung:bilder
 *
 * Die Bilder landen in `dokumentation/bilder/`. `scripts/anleitung.ts` setzt
 * daraus die PDF. Die Daten sind Muster – in einer verteilten Anleitung haben
 * echte Kunden- und Mitarbeiterdaten nichts verloren (siehe DATENSCHUTZ.md).
 */

import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'
import { demoBericht } from './demoBericht'
import { pdfErzeugen } from '../src/lib/pdf'
import { beispielVorlage } from '../tests/hilfen/beispielVorlage'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')
const ZIEL = join(WURZEL, 'dokumentation', 'bilder')
const HAFEN = 4173
const ADRESSE = `http://localhost:${HAFEN}/app_awt_berichte/`

/** Handy im Hochformat – so sehen die Kollegen die App. */
const FENSTER = { width: 390, height: 844 }

async function warteAufServer(): Promise<void> {
  for (let versuch = 0; versuch < 60; versuch++) {
    try {
      const antwort = await fetch(ADRESSE)
      if (antwort.ok) return
    } catch {
      // Server ist noch nicht da.
    }
    await new Promise((weiter) => setTimeout(weiter, 500))
  }
  throw new Error('Der Vorschau-Server ist nicht hochgekommen.')
}

let nummer = 0
async function bild(seite: Page, name: string): Promise<void> {
  nummer++
  const datei = join(ZIEL, `${String(nummer).padStart(2, '0')}-${name}.png`)
  // Kurz warten: Reiterleiste und Kacheln bewegen sich beim Wechsel noch.
  await seite.waitForTimeout(250)
  await seite.screenshot({ path: datei })
  console.log(`  ${datei.slice(WURZEL.length + 1)}`)
}

/** Zum Blatt mit diesem Reiter wechseln. */
async function reiter(seite: Page, kurz: string): Promise<void> {
  await seite.getByRole('tab', { name: kurz, exact: false }).first().click()
}

const vorschau = spawn('npx', ['vite', 'preview', '--port', String(HAFEN), '--strictPort'], {
  cwd: WURZEL,
  stdio: 'ignore',
})

try {
  await warteAufServer()

  rmSync(ZIEL, { recursive: true, force: true })
  mkdirSync(ZIEL, { recursive: true })

  // `--lang`: sonst beschriftet Chromium Datums- und Zeitfelder englisch
  // („08:00 AM") – in einer deutschen Anleitung sähe das falsch aus.
  const browser = await chromium.launch({ args: ['--lang=de-DE'] })
  const kontext = await browser.newContext({
    // Ohne Service Worker: er aktualisiert sich selbst und lädt die Seite dabei
    // neu – mitten in einem Klick wären die Bilder unbrauchbar.
    serviceWorkers: 'block',
    viewport: FENSTER,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-DE',
    colorScheme: 'light',
  })
  // `registerSW` startet nur, wenn der Browser Service Worker kennt.
  await kontext.addInitScript(() => {
    delete (Navigator.prototype as unknown as Record<string, unknown>).serviceWorker
  })

  const seite = await kontext.newPage()

  // --- Daten einlegen ----------------------------------------------------
  await seite.goto(ADRESSE)
  await seite.getByRole('button', { name: 'Neuer Bericht' }).waitFor()

  const daten = {
    bericht: await demoBericht(),
    einstellungen: {
      profil: {
        name: 'Max Muster',
        funktion: 'Anwendungstechniker',
        firma: 'Musterfirma GmbH',
        strasse: 'Musterstraße 1',
        ort: '12345 Musterstadt',
        telefon: '01234 567-0',
        email: 'max.muster@musterfirma.example',
      },
      gemerkteProdukte: ['Sikafloor-161', 'Sikafloor-264', 'Sikagard-720 EpoCem'],
      briefvorlage: await beispielVorlage('bild'),
    },
  }

  await seite.evaluate(async (inhalt) => {
    await new Promise<void>((fertig, fehler) => {
      const anfrage = indexedDB.open('awt-berichte', 1)
      anfrage.onerror = () => fehler(anfrage.error)
      // Beim ersten Aufruf steht die Datenbank noch nicht – die App legt sie
      // erst an, wenn ein Bericht geladen wird. Also dieselbe Struktur wie in
      // `src/lib/db.ts` aufbauen.
      anfrage.onupgradeneeded = () => {
        const datenbank = anfrage.result
        if (!datenbank.objectStoreNames.contains('berichte')) {
          datenbank
            .createObjectStore('berichte', { keyPath: 'id' })
            .createIndex('geaendertAm', 'geaendertAm')
        }
        if (!datenbank.objectStoreNames.contains('einstellungen')) {
          datenbank.createObjectStore('einstellungen')
        }
      }
      anfrage.onsuccess = () => {
        try {
          const datenbank = anfrage.result
          const schreiben = datenbank.transaction(['berichte', 'einstellungen'], 'readwrite')
          schreiben.objectStore('berichte').put(inhalt.bericht)
          schreiben.objectStore('einstellungen').put(inhalt.einstellungen, 'app')
          schreiben.oncomplete = () => fertig()
          schreiben.onerror = () => fehler(schreiben.error)
        } catch (fehlgeschlagen) {
          fehler(fehlgeschlagen)
        }
      }
    })
  }, daten)

  await seite.reload()
  await seite.getByRole('button', { name: 'Neuer Bericht' }).waitFor()

  // --- Startbildschirm ----------------------------------------------------
  await bild(seite, 'start')

  // --- Einstellungen ------------------------------------------------------
  await seite.getByRole('button', { name: 'Einstellungen' }).click()
  await seite.getByText('Mein Profil').waitFor()
  await bild(seite, 'einstellungen-profil')

  await seite.getByText('Briefvorlage', { exact: true }).scrollIntoViewIfNeeded()
  await bild(seite, 'einstellungen-briefvorlage')

  await seite.getByText('Wo darf der Bericht stehen?').scrollIntoViewIfNeeded()
  await bild(seite, 'einstellungen-satzspiegel')

  await seite.getByText('Datensicherung').scrollIntoViewIfNeeded()
  await bild(seite, 'einstellungen-datensicherung')

  await seite.getByRole('button', { name: 'Datenschutz-Hinweise lesen' }).click()
  await seite.getByText('Worum es geht').waitFor()
  await bild(seite, 'datenschutz')
  await seite.getByRole('button', { name: 'Zurück' }).click()

  // --- Berichtsliste ------------------------------------------------------
  await seite.getByRole('button', { name: 'Zurück' }).click()
  await seite.getByRole('button', { name: 'Meine Berichte' }).click()
  await seite.getByText('Neubau Lagerhalle Ost').first().waitFor()
  await bild(seite, 'meine-berichte')

  // --- Der Bericht --------------------------------------------------------
  await seite.getByText('Neubau Lagerhalle Ost').first().click()
  await seite.getByRole('button', { name: 'Bericht ausgeben' }).waitFor()
  await bild(seite, 'kacheln')

  await seite
    .getByRole('button', { name: /Kopfdaten/ })
    .first()
    .click()
  await seite.getByRole('tablist').waitFor()
  await bild(seite, 'blatt-kopfdaten')

  for (const [kurz, name] of [
    ['Thematik', 'blatt-thematik'],
    ['Untergrund', 'blatt-untergrund'],
    ['Klima', 'blatt-klima'],
    ['Aufbau', 'blatt-aufbau'],
    ['Bericht', 'blatt-text'],
    ['Offene Fragen', 'blatt-offene-fragen'],
    ['Fotos', 'blatt-fotos'],
  ] as const) {
    await reiter(seite, kurz)
    await bild(seite, name)
  }

  // Der Aufbau-Dialog ist der einzige Ort mit einer eigenen Eingabemaske.
  await reiter(seite, 'Aufbau')
  const zeile = seite.getByText('Halle Nord').first()
  await zeile.click()
  await seite.waitForTimeout(300)
  await bild(seite, 'aufbau-eingabe')
  // Der Dialog ist höher als das Handy – „Abbrechen" liegt unter dem Rand.
  await seite.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click({ force: true })
  await seite.getByRole('dialog').waitFor({ state: 'detached' })

  // --- Abschluss ----------------------------------------------------------
  await reiter(seite, 'Abschluss')
  await bild(seite, 'blatt-abschluss')
  await seite.getByText('Bericht ausgeben').scrollIntoViewIfNeeded()
  await bild(seite, 'abschluss-ausgabe')

  await browser.close()

  // --- Der fertige Bericht ------------------------------------------------
  // Zwei Seiten der erzeugten PDF, damit die Anleitung zeigt, was am Ende
  // beim Kunden ankommt. Braucht `pdftoppm` (Paket poppler-utils); fehlt es,
  // bleiben die Bilder eben weg, statt den ganzen Lauf zu verlieren.
  const pdf = Buffer.from(
    await (await pdfErzeugen(await demoBericht(), await beispielVorlage('bild'))).arrayBuffer(),
  )
  const pdfPfad = join(ZIEL, 'bericht.pdf')
  writeFileSync(pdfPfad, pdf)

  const gerendert = spawnSync(
    'pdftoppm',
    ['-r', '110', '-png', '-f', '1', '-l', '2', pdfPfad, join(ZIEL, '20-fertiger-bericht')],
    { stdio: 'ignore' },
  )
  rmSync(pdfPfad, { force: true })
  if (gerendert.status === 0) {
    nummer += 2
    console.log('  dokumentation/bilder/20-fertiger-bericht-1.png (+ -2)')
  } else {
    console.warn('  pdftoppm fehlt – die Bilder des fertigen Berichts bleiben aus.')
  }

  console.log(`\n${nummer} Bilder in dokumentation/bilder/`)
} finally {
  vorschau.kill()
}
