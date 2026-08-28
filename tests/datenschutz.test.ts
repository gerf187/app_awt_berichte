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

describe('Die App spricht mit niemandem', () => {
  const alle = dateien(QUELLEN).map((pfad) => ({
    pfad: pfad.slice(QUELLEN.length + 1),
    quelltext: ohneKommentare(readFileSync(pfad, 'utf8')),
  }))

  it('findet überhaupt Quelltext zum Prüfen', () => {
    expect(alle.length).toBeGreaterThan(20)
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
    const alles = DATENSCHUTZ.flatMap((abschnitt) =>
      abschnitt.bloecke.flatMap((block) => (block.art === 'text' ? [block.inhalt] : block.punkte)),
    ).join(' ')
    expect(alles).toContain('Briefvorlage')
    expect(alles).toMatch(/nicht hochgeladen|verlässt das Gerät nicht/)
  })
})
