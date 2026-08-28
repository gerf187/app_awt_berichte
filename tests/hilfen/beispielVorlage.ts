import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { STANDARD_RAENDER, datenGroesse } from '../../src/lib/vorlage'
import type { Briefvorlage, VorlagenArt } from '../../src/lib/typen'

/**
 * Der neutrale Beispiel-Briefbogen als Briefvorlage.
 *
 * Die Dateien entstehen mit `npm run briefbogen` und zeigen bewusst eine
 * „Musterfirma": echtes Firmenmaterial gehört nicht in ein öffentliches
 * Repository (siehe DATENSCHUTZ.md).
 */
export async function beispielVorlage(art: VorlagenArt = 'bild'): Promise<Briefvorlage> {
  const endung = art === 'pdf' ? 'pdf' : 'png'
  const pfad = fileURLToPath(
    new URL(`../../dokumentation/beispiel/Briefbogen_Musterfirma.${endung}`, import.meta.url),
  )
  const roh = await readFile(pfad)
  // Die App legt Bild-Vorlagen als JPEG ab (siehe `vorlageEinlesen`);
  // der Test soll mit demselben Material rechnen.
  const daten =
    art === 'pdf'
      ? roh
      : await sharp(roh).flatten({ background: '#FFFFFF' }).jpeg({ quality: 85 }).toBuffer()
  const typ = art === 'pdf' ? 'application/pdf' : 'image/jpeg'
  const dataUrl = `data:${typ};base64,${daten.toString('base64')}`

  return {
    dateiname: `Briefbogen_Musterfirma.${endung}`,
    art,
    daten: dataUrl,
    groesse: datenGroesse(dataUrl),
    seiten: art === 'pdf' ? 2 : 1,
    hinzugefuegtAm: new Date(2026, 7, 26).toISOString(),
    ...STANDARD_RAENDER,
    randObenFolgeseiten:
      art === 'pdf' ? STANDARD_RAENDER.randObenFolgeseiten : STANDARD_RAENDER.randOben,
    ersteSeiteWiederholen: art !== 'pdf',
  }
}
