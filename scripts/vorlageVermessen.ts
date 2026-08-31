/**
 * Einen Briefbogen vermessen: wo steht seine eigene Farbe, und welcher Bereich
 * bleibt dem Bericht?
 *
 *   npx vite-node scripts/vorlageVermessen.ts "vorlage/Sika GmbH.pdf"
 *
 * Wozu: Die Maße in `src/pdf/layout.ts` stammen aus einem echten Bogen. Ändert
 * sich die Firmierung – ein neuer Geschäftsführer, eine neue Anschrift –, kommt
 * ein neuer Bogen, und der Fußblock kann höher werden. Statt ihn abzutippen,
 * wird er hier abgetastet: die Seite wird gerastert und Zeile für Zeile
 * gezählt, wo etwas gedruckt ist.
 *
 * Der Bogen selbst gehört nicht ins Repository (siehe vorlage/LIESMICH.txt und
 * DATENSCHUTZ.md). Dieses Skript liest ihn nur; es schreibt nichts zurück.
 *
 * PDF-Vorlagen brauchen `pdftoppm` (Paket poppler-utils). Fehlt es, hilft der
 * Umweg über ein Bild: den Bogen als PNG exportieren und das hier angeben.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import sharp from 'sharp'
import {
  CONTENT_BOTTOM,
  CONTENT_TOP_FIRST,
  CONTENT_TOP_NEXT,
  MARGIN,
  PAGE,
} from '../src/pdf/layout'

/** Auflösung des Abtastens. Feiner bringt nichts – gesucht sind Millimeter. */
const DPI = 150
/** Alles Dunklere gilt als bedruckt; darüber liegt der Papierton eines Scans. */
const SCHWELLE = 235
/** Lücken bis hierhin gehören noch zum selben Block (Zeilenabstand). */
const LUECKE_MM = 4
/** Sicherheitsabstand zwischen dem Inhalt des Bogens und dem des Berichts. */
const ABSTAND_MM = 5

const datei = process.argv[2]
if (!datei) {
  console.error('Aufruf: npx vite-node scripts/vorlageVermessen.ts <Briefbogen.pdf|.png>')
  process.exit(1)
}

const inMillimeter = (bildpunkte: number) => (bildpunkte / DPI) * 25.4
const inBildpunkte = (millimeter: number) => Math.round((millimeter / 25.4) * DPI)

/** PDF-Seiten werden gerastert, Bilder direkt gelesen. */
function seitenBilder(pfad: string): string[] {
  if (!pfad.toLowerCase().endsWith('.pdf')) return [pfad]

  const ordner = mkdtempSync(join(tmpdir(), 'briefbogen-'))
  try {
    execFileSync('pdftoppm', ['-png', '-gray', '-r', String(DPI), pfad, join(ordner, 'seite')])
  } catch {
    throw new Error(
      'Zum Vermessen einer PDF wird `pdftoppm` gebraucht (Paket poppler-utils).\n' +
        'Ohne das Werkzeug: den Briefbogen als PNG exportieren und dieses angeben.',
    )
  }
  return readdirSync(ordner)
    .sort()
    .map((name) => join(ordner, name))
}

/** Zusammenhängende Bänder, in denen etwas gedruckt ist. */
function baender(farbe: number[], luecke: number): [number, number][] {
  const erlaubt = inBildpunkte(luecke)
  const gefunden: [number, number][] = []
  let start: number | null = null
  let leer = 0

  for (let stelle = 0; stelle < farbe.length; stelle++) {
    if (farbe[stelle] > 0) {
      if (start === null) start = stelle
      leer = 0
    } else if (start !== null && ++leer > erlaubt) {
      gefunden.push([start, stelle - leer])
      start = null
    }
  }
  if (start !== null) gefunden.push([start, farbe.length - 1])
  return gefunden
}

/** Linker und rechter Rand der Farbe innerhalb eines Bandes, in Bildpunkten. */
function randDesBandes(
  data: Buffer,
  width: number,
  [oben, unten]: [number, number],
): [number, number] {
  const spalten = new Array<number>(width).fill(0)
  for (let y = oben; y <= unten; y++) {
    for (let x = 0; x < width; x++) if (data[y * width + x] < SCHWELLE) spalten[x]++
  }
  const links = spalten.findIndex((wert) => wert > 0)
  const rechts = width - 1 - [...spalten].reverse().findIndex((wert) => wert > 0)
  return [links, rechts]
}

for (const bild of seitenBilder(datei)) {
  const { data, info } = await sharp(bild).greyscale().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info

  const jeZeile = new Array<number>(height).fill(0)
  const jeSpalte = new Array<number>(width).fill(0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] < SCHWELLE) {
        jeZeile[y]++
        jeSpalte[x]++
      }
    }
  }

  const waagerecht = baender(jeZeile, LUECKE_MM)
  const senkrecht = baender(jeSpalte, 8)

  console.log(
    `\n${basename(bild)} – ${inMillimeter(width).toFixed(1)} × ${inMillimeter(height).toFixed(1)} mm`,
  )
  console.log('\nBedruckte Bänder von oben nach unten:')
  for (const band of waagerecht) {
    const [oben, unten] = band
    const [links, rechts] = randDesBandes(data, width, band)
    console.log(
      `  ${inMillimeter(oben).toFixed(1).padStart(6)} – ${inMillimeter(unten).toFixed(1).padStart(6)} mm` +
        `   waagerecht ${inMillimeter(links).toFixed(1)} – ${inMillimeter(rechts).toFixed(1)} mm`,
    )
  }

  if (waagerecht.length === 0) {
    console.log('  (nichts gefunden – ist die Seite leer?)')
    continue
  }

  // Der freie Bereich: unter dem letzten Band der oberen Hälfte, über dem
  // ersten der unteren.
  const mitte = height / 2
  const oberer = waagerecht.filter(([, unten]) => unten < mitte).at(-1)
  const unterer = waagerecht.find(([oben]) => oben > mitte)
  const freiOben = oberer ? inMillimeter(oberer[1]) + ABSTAND_MM : ABSTAND_MM
  const freiUnten = unterer ? inMillimeter(unterer[0]) - ABSTAND_MM : PAGE.height - ABSTAND_MM
  /**
   * Seitlich zählt der Fußblock, nicht der Kopf: der Gesprächspartner-Block
   * steht weiter rechts als die Textspalte, in der der Bericht steht.
   */
  const fuss = waagerecht.at(-1)
  const seitlich = fuss ? randDesBandes(data, width, fuss) : senkrecht.at(0)

  console.log('\nVorschlag für den Satzspiegel (jeweils 5 mm Abstand gehalten):')
  console.log(`  oben       ${freiOben.toFixed(1)} mm      (in layout.ts: ${CONTENT_TOP_FIRST})`)
  console.log(`  unten      ${freiUnten.toFixed(1)} mm      (in layout.ts: ${CONTENT_BOTTOM})`)
  if (seitlich) {
    console.log(
      `  links      ${inMillimeter(seitlich[0]).toFixed(1)} mm      (in layout.ts: ${MARGIN.left})`,
    )
    console.log(
      `  rechts     ${(PAGE.width - inMillimeter(seitlich[1])).toFixed(1)} mm      (in layout.ts: ${MARGIN.right})`,
    )
  }
  console.log(
    `\nTrägt die Folgeseite nur das Logo, beginnt sie bei ${CONTENT_TOP_NEXT} mm;\n` +
      'wiederholt der Bogen seine erste Seite, gilt der Wert von oben.',
  )
}
