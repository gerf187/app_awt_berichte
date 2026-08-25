/**
 * Erzeugt eine Beispiel-PDF und eine Beispiel-Word-Datei mit Testdaten,
 * damit man die Ausgabe von Hand ansehen kann:
 *
 *   npx vite-node scripts/beispielPdf.ts [Zielordner]
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { beispielBericht } from '../tests/hilfen/beispielBericht'
import { dateiname } from '../src/lib/dateiname'
import { docxErzeugen } from '../src/lib/docx'
import { pdfErzeugen } from '../src/lib/pdf'

const ordner = process.argv[2] ?? '.'
const bericht = await beispielBericht()

for (const [endung, erzeugen] of [
  ['pdf', pdfErzeugen],
  ['docx', docxErzeugen],
] as const) {
  const daten = Buffer.from(await (await erzeugen(bericht)).arrayBuffer())
  const pfad = join(ordner, dateiname(bericht, endung))
  await writeFile(pfad, daten)
  console.log(`${pfad} – ${(daten.length / 1024).toFixed(0)} kB`)
}
