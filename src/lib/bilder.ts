/**
 * Fotos für den Bericht aufbereiten.
 *
 * Handykameras liefern 4000 px breite Bilder mit mehreren Megabyte. Sechs
 * davon würden die PDF unbrauchbar groß machen und den Speicher des Geräts
 * belasten. Deshalb wird jedes Foto vor dem Speichern verkleinert.
 */

/** Längste Kante nach dem Verkleinern. */
export const MAX_KANTE = 1600
/** JPEG-Qualität: sichtbar sauber, aber deutlich kleiner als das Original. */
export const QUALITAET = 0.75

/**
 * Zielmaße für ein Bild, das in ein Quadrat der Kantenlänge `maxKante` passen
 * soll. Kleinere Bilder bleiben unverändert – Hochrechnen bringt nichts.
 */
export function zielGroesse(
  breite: number,
  hoehe: number,
  maxKante: number = MAX_KANTE,
): { breite: number; hoehe: number } {
  const laengsteKante = Math.max(breite, hoehe)
  if (laengsteKante <= maxKante || laengsteKante === 0) {
    return { breite: Math.round(breite), hoehe: Math.round(hoehe) }
  }
  const faktor = maxKante / laengsteKante
  return {
    breite: Math.max(1, Math.round(breite * faktor)),
    hoehe: Math.max(1, Math.round(hoehe * faktor)),
  }
}

/**
 * Liest eine Bilddatei ein, verkleinert sie und gibt sie als JPEG-Data-URL
 * zurück. Data-URL statt Blob, damit ein Bericht in einem Stück gespeichert
 * und gesichert werden kann.
 */
export async function fotoAufbereiten(datei: File, maxKante: number = MAX_KANTE): Promise<string> {
  const bild = await bildLaden(datei)
  const { breite, hoehe } = zielGroesse(bild.width, bild.height, maxKante)

  const flaeche = document.createElement('canvas')
  flaeche.width = breite
  flaeche.height = hoehe

  const stift = flaeche.getContext('2d')
  if (!stift) throw new Error('Der Browser kann das Bild nicht verarbeiten.')
  stift.drawImage(bild, 0, 0, breite, hoehe)

  if ('close' in bild) bild.close()
  return flaeche.toDataURL('image/jpeg', QUALITAET)
}

/**
 * Bild dekodieren. `createImageBitmap` dreht das Foto anhand der EXIF-Daten
 * richtig herum – sonst liegen Hochkantfotos im Bericht quer.
 */
async function bildLaden(datei: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(datei, { imageOrientation: 'from-image' })
    } catch {
      // Ältere Browser kennen die Option nicht – dann eben der Umweg unten.
    }
  }

  const adresse = URL.createObjectURL(datei)
  try {
    const bild = new Image()
    bild.src = adresse
    await bild.decode()
    return bild
  } finally {
    URL.revokeObjectURL(adresse)
  }
}
