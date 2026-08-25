import { describe, expect, it } from 'vitest'
import { beispielBericht } from './hilfen/beispielBericht'
import { docxErzeugen } from '../src/lib/docx'

async function bytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

describe('docxErzeugen', () => {
  it('erzeugt eine gültige Word-Datei (ZIP mit document.xml)', async () => {
    const daten = await bytes(await docxErzeugen(await beispielBericht()))

    // Jede .docx ist ein ZIP – es beginnt mit „PK".
    expect(daten[0]).toBe(0x50)
    expect(daten[1]).toBe(0x4b)

    const roh = new TextDecoder('latin1').decode(daten)
    expect(roh).toContain('word/document.xml')
    expect(daten.length).toBeGreaterThan(1000)
  })

  it('bleibt mit dem Testbericht (6 Fotos) unter 5 MB', async () => {
    const daten = await bytes(await docxErzeugen(await beispielBericht()))
    expect(daten.length).toBeLessThan(5 * 1024 * 1024)
  })

  it('kommt auch mit einem fast leeren Bericht zurecht', async () => {
    const bericht = await beispielBericht()
    const daten = await bytes(
      await docxErzeugen({
        ...bericht,
        anwesende: [],
        klima: [],
        aufbau: [],
        fotos: [],
        unterschrift: undefined,
        text: { ausgefuehrteArbeiten: '', besprochenes: '', maengel: '', empfehlung: '' },
      }),
    )
    expect(daten[0]).toBe(0x50)
  })
})
