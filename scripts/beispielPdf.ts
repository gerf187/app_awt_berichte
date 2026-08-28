/**
 * Erzeugt Beispiel-PDFs und -Word-Dateien mit Testdaten, damit man die Ausgabe
 * von Hand ansehen kann – einmal ohne Briefbogen, einmal auf dem neutralen
 * Beispiel-Briefbogen aus `dokumentation/beispiel/`:
 *
 *   npx vite-node scripts/beispielPdf.ts [Zielordner]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { beispielBericht } from '../tests/hilfen/beispielBericht'
import { dateiname } from '../src/lib/dateiname'
import { docxErzeugen } from '../src/lib/docx'
import { pdfErzeugen } from '../src/lib/pdf'
import { beispielVorlage } from '../tests/hilfen/beispielVorlage'

const ordner = process.argv[2] ?? '.'
const bericht = await beispielBericht()

const vorlagen = [
  ['', undefined],
  ['_Briefbogen-Bild', await beispielVorlage('bild')],
  ['_Briefbogen-PDF', await beispielVorlage('pdf')],
] as const

for (const [zusatz, vorlage] of vorlagen) {
  for (const [endung, erzeugen] of [
    ['pdf', pdfErzeugen],
    ['docx', docxErzeugen],
  ] as const) {
    const daten = Buffer.from(await (await erzeugen(bericht, vorlage)).arrayBuffer())
    const name = dateiname(bericht, endung).replace(`.${endung}`, `${zusatz}.${endung}`)
    const pfad = join(ordner, name)
    await writeFile(pfad, daten)
    console.log(`${pfad} – ${(daten.length / 1024).toFixed(0)} kB`)
  }
}

// `readFile` wird nur über beispielVorlage gebraucht – hier nur als Hinweis,
// dass die Beispieldateien vorher mit `npm run briefbogen` entstehen müssen.
void readFile
