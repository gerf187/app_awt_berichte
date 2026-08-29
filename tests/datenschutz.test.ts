import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DATENSCHUTZ } from '../src/data/datenschutz'

/**
 * Wachhund für die wichtigste Zusage der App: Sie schickt keine Daten weg.
 *
 * In den Berichten stehen Kunden- und Mitarbeiterdaten, und die Briefvorlage
 * wird ausdrücklich nur lokal abgelegt. Wenn jemand später eine Abfrage,
 * eine Statistik oder einen Fehlerdienst einbaut, soll dieser Test fehlschlagen
 * und nicht erst der Datenschutzbeauftragte. Siehe DATENSCHUTZ.md.
 */

const QUELLEN = fileURLToPath(new URL('../src', import.meta.url))

/**
 * Die einzige Datei, die nach draußen sprechen darf: die OneDrive-Anbindung.
 *
 * Sie ist eine bewusste Ausnahme und kein Schlupfloch – sie meldet sich nur bei
 * Microsoft, nur wenn der Nutzer selbst eine Verbindung hergestellt hat, und
 * sie überträgt nur die Datei, die er ausdrücklich hochlädt. Alles Weitere
 * prüft der Test „spricht nur mit Microsoft" unten.
 */
const ONEDRIVE = 'lib/onedrive.ts'

/** Verbotene Wege nach draußen. */
const NETZAUFRUFE = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bsendBeacon\b/,
  /\bnew\s+WebSocket\b/,
  /\bnew\s+EventSource\b/,
  /\bimportScripts\s*\(/,
  /\bnavigator\.geolocation\b/,
]

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((eintrag) => {
    const pfad = join(ordner, eintrag)
    if (statSync(pfad).isDirectory()) return dateien(pfad)
    return ['.ts', '.tsx'].includes(extname(pfad)) ? [pfad] : []
  })
}

/** Kommentare weg – erklärender Text darf über Netzaufrufe sprechen. */
function ohneKommentare(quelltext: string): string {
  return quelltext.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('Die App spricht mit niemandem – außer auf Ansage mit OneDrive', () => {
  const gesamt = dateien(QUELLEN).map((pfad) => ({
    pfad: pfad.slice(QUELLEN.length + 1).replaceAll('\\', '/'),
    quelltext: ohneKommentare(readFileSync(pfad, 'utf8')),
  }))
  const alle = gesamt.filter(({ pfad }) => pfad !== ONEDRIVE)

  it('findet überhaupt Quelltext zum Prüfen', () => {
    expect(alle.length).toBeGreaterThan(20)
  })

  it('hat die Ausnahme wirklich noch', () => {
    expect(gesamt.map((d) => d.pfad)).toContain(ONEDRIVE)
  })

  it('spricht in der Ausnahme nur mit Microsoft', () => {
    const quelltext = gesamt.find((d) => d.pfad === ONEDRIVE)!.quelltext
    const adressen = quelltext.match(/https?:\/\/[^\s'"`]+/g) ?? []
    expect(adressen.length).toBeGreaterThan(0)
    for (const adresse of adressen) {
      expect(adresse).toMatch(/^https:\/\/(login\.microsoftonline\.com|graph\.microsoft\.com)\//)
    }
  })

  it.each(NETZAUFRUFE.map((muster) => [muster.source, muster] as const))(
    'benutzt nirgends %s',
    (_name, muster) => {
      const treffer = alle.filter(({ quelltext }) => muster.test(quelltext)).map((d) => d.pfad)
      expect(treffer).toEqual([])
    },
  )

  it('lädt zur Laufzeit keine fremde Adresse', () => {
    // Erlaubt bleibt `mailto:` – der Versand über das Mailprogramm des Nutzers.
    const treffer = alle
      .filter(({ quelltext }) => /https?:\/\/[^\s'"`]/.test(quelltext))
      .map((d) => d.pfad)
    expect(treffer).toEqual([])
  })
})

describe('Datenschutz-Hinweise', () => {
  it('stehen der App als Text zur Verfügung', () => {
    expect(DATENSCHUTZ.length).toBeGreaterThan(5)
    for (const abschnitt of DATENSCHUTZ) {
      expect(abschnitt.titel.length).toBeGreaterThan(3)
      expect(abschnitt.bloecke.length).toBeGreaterThan(0)
    }
  })

  it('sagen ausdrücklich, dass die Briefvorlage auf dem Gerät bleibt', () => {
    expect(hinweistext()).toContain('Briefvorlage')
    expect(hinweistext()).toMatch(/nicht hochgeladen|verlässt das Gerät nicht/)
  })

  /**
   * Die eine Stelle, an der die App nicht schweigt: Beim Diktieren erkennt der
   * Browser die Sprache und schickt die Aufnahme dafür an seinen Hersteller.
   * Solange es die Taste gibt, muss das im Datenschutz-Text stehen – sonst
   * verspricht die App mehr, als sie hält.
   */
  /**
   * Zweite Stelle, an der die App nicht schweigt: die OneDrive-Ablage. Solange
   * es sie gibt, muss sie im Datenschutz-Text stehen.
   */
  it('erklären die OneDrive-Ablage', () => {
    const alles = hinweistext()
    expect(alles).toContain('OneDrive')
    expect(alles).toMatch(/Microsoft/)
  })

  it('erklären, dass beim Diktieren der Browser die Aufnahme übermittelt', () => {
    const taste = readFileSync(join(QUELLEN, 'components', 'Spracheingabe.tsx'), 'utf8')
    if (!taste.includes('Diktieren')) return

    const alles = hinweistext()
    expect(alles).toMatch(/[Dd]iktier/)
    expect(alles).toMatch(/Apple|Google|Hersteller des Browsers/)
  })
})

/** Alle Sätze der Hinweise als ein Text. */
function hinweistext(): string {
  return DATENSCHUTZ.flatMap((abschnitt) =>
    abschnitt.bloecke.flatMap((block) => (block.art === 'text' ? [block.inhalt] : block.punkte)),
  ).join(' ')
}
