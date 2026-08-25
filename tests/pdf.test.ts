import { describe, expect, it } from 'vitest'
import { beispielBericht, testFoto } from './hilfen/beispielBericht'
import { pdfErzeugen } from '../src/lib/pdf'

/** Ein PDF beginnt immer mit dieser Kennung. */
async function kennung(blob: Blob): Promise<string> {
  return new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5))
}

describe('pdfErzeugen', () => {
  it('erzeugt eine gültige PDF-Datei', async () => {
    const blob = await pdfErzeugen(await beispielBericht())
    expect(await kennung(blob)).toBe('%PDF-')
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('bleibt mit dem Testbericht (6 Fotos) unter 5 MB', async () => {
    const blob = await pdfErzeugen(await beispielBericht())
    expect(blob.size).toBeLessThan(5 * 1024 * 1024)
  })

  it('kommt auch mit einem fast leeren Bericht zurecht', async () => {
    const bericht = await beispielBericht()
    const leer = {
      ...bericht,
      anwesende: [],
      klima: [],
      aufbau: [],
      fotos: [],
      unterschrift: undefined,
      text: { ausgefuehrteArbeiten: '', besprochenes: '', maengel: '', empfehlung: '' },
    }
    const blob = await pdfErzeugen(leer)
    expect(await kennung(blob)).toBe('%PDF-')
  })

  it('verkraftet sehr lange Freitexte ohne Absturz', async () => {
    const bericht = await beispielBericht()
    bericht.text.besprochenes = 'Sehr langer Absatz. '.repeat(500)
    bericht.fotos = [await testFoto('#888888')]
    const blob = await pdfErzeugen(bericht)
    expect(await kennung(blob)).toBe('%PDF-')
  })
})
