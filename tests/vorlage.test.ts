import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { beispielBericht } from './hilfen/beispielBericht'
import { beispielVorlage } from './hilfen/beispielVorlage'
import { docxErzeugen } from '../src/lib/docx'
import { pdfErzeugen } from '../src/lib/pdf'
import {
  MAX_VORLAGE_BYTES,
  STANDARD_RAENDER,
  SATZSPIEGEL_OHNE_VORLAGE,
  VorlagenFehler,
  datenGroesse,
  groesseAnzeigen,
  satzspiegel,
  vorlageArtPruefen,
  vorlageAuffuellen,
  vorlagenseiteFuer,
} from '../src/lib/vorlage'

async function seitenzahl(blob: Blob): Promise<number> {
  return (await PDFDocument.load(await blob.arrayBuffer())).getPageCount()
}

describe('vorlageArtPruefen', () => {
  it('erkennt PDF und Bilder am Typ', () => {
    expect(vorlageArtPruefen('application/pdf', 'bogen.pdf')).toBe('pdf')
    expect(vorlageArtPruefen('image/png', 'bogen.png')).toBe('bild')
    expect(vorlageArtPruefen('image/jpeg', 'bogen.jpg')).toBe('bild')
  })

  it('erkennt sie notfalls an der Endung – manche Handys liefern keinen Typ', () => {
    expect(vorlageArtPruefen('', 'Briefbogen.PDF')).toBe('pdf')
    expect(vorlageArtPruefen('application/octet-stream', 'Briefbogen.JPEG')).toBe('bild')
  })

  it('weist alles andere mit einer verständlichen Meldung ab', () => {
    expect(() => vorlageArtPruefen('application/msword', 'bogen.docx')).toThrow(VorlagenFehler)
  })
})

describe('satzspiegel', () => {
  it('bleibt ohne Vorlage bei den bisherigen Rändern', () => {
    expect(satzspiegel()).toEqual(SATZSPIEGEL_OHNE_VORLAGE)
  })

  it('übernimmt die Ränder der Vorlage', async () => {
    const vorlage = await beispielVorlage('bild')
    expect(satzspiegel(vorlage)).toEqual({
      links: vorlage.randLinks,
      rechts: vorlage.randRechts,
      obenErste: vorlage.randOben,
      obenFolge: vorlage.randObenFolgeseiten,
      unten: vorlage.randUnten,
    })
  })
})

describe('vorlagenseiteFuer', () => {
  it('nimmt bei zweiseitigen Vorlagen ab Seite 2 den Folgebogen', async () => {
    const vorlage = await beispielVorlage('pdf')
    expect(vorlagenseiteFuer(vorlage, 0)).toBe(0)
    expect(vorlagenseiteFuer(vorlage, 1)).toBe(1)
    expect(vorlagenseiteFuer(vorlage, 7)).toBe(1)
  })

  it('wiederholt einseitige Vorlagen nur, wenn es so eingestellt ist', async () => {
    const vorlage = { ...(await beispielVorlage('bild')), ersteSeiteWiederholen: true }
    expect(vorlagenseiteFuer(vorlage, 3)).toBe(0)
    expect(vorlagenseiteFuer({ ...vorlage, ersteSeiteWiederholen: false }, 3)).toBeNull()
  })
})

describe('vorlageAuffuellen', () => {
  it('macht aus einer fremden Sicherung eine brauchbare Vorlage', () => {
    const vorlage = vorlageAuffuellen({ daten: 'data:image/jpeg;base64,AAAA' })
    expect(vorlage).toBeDefined()
    expect(vorlage?.randOben).toBe(STANDARD_RAENDER.randOben)
    expect(vorlage?.seiten).toBe(1)
  })

  it('ersetzt unsinnige Ränder durch die Vorschlagswerte', () => {
    const vorlage = vorlageAuffuellen({
      daten: 'data:image/jpeg;base64,AAAA',
      randLinks: -20,
      randUnten: 999,
    })
    expect(vorlage?.randLinks).toBe(STANDARD_RAENDER.randLinks)
    expect(vorlage?.randUnten).toBe(STANDARD_RAENDER.randUnten)
  })

  it('verwirft alles, was keine Datei enthält', () => {
    expect(vorlageAuffuellen(undefined)).toBeUndefined()
    expect(vorlageAuffuellen({ dateiname: 'bogen.png' })).toBeUndefined()
  })
})

describe('groesseAnzeigen', () => {
  it('schreibt Größen so, wie man sie liest', () => {
    expect(groesseAnzeigen(512)).toBe('512 B')
    expect(groesseAnzeigen(2048)).toBe('2 KB')
    expect(groesseAnzeigen(MAX_VORLAGE_BYTES)).toBe('5,0 MB')
  })

  it('rechnet die Größe aus einer Data-URL zurück', () => {
    // 8 Base64-Zeichen stehen für 6 Bytes.
    expect(datenGroesse('data:image/jpeg;base64,AAAAAAAA')).toBe(6)
  })
})

describe('Bericht auf dem Briefbogen', () => {
  it('legt eine Bild-Vorlage in die Datei, aber nur einmal', async () => {
    const bericht = await beispielBericht()
    const vorlage = await beispielVorlage('bild')
    const ohne = await pdfErzeugen(bericht)
    const mit = await pdfErzeugen(bericht, vorlage)

    // Der breitere Satzspiegel darf Seiten hinzufügen, aber keine wegnehmen.
    expect(await seitenzahl(mit)).toBeGreaterThanOrEqual(await seitenzahl(ohne))
    expect(mit.size).toBeGreaterThan(ohne.size)
    // Der Briefbogen steckt einmal in der Datei, nicht je Seite – sonst wäre
    // die Datei um ein Vielfaches seiner Größe gewachsen.
    expect(mit.size).toBeLessThan(ohne.size + 3 * vorlage.groesse)
  })

  it('legt eine PDF-Vorlage unter den fertigen Bericht', async () => {
    const bericht = await beispielBericht()
    const ohne = await pdfErzeugen(bericht)
    const mit = await pdfErzeugen(bericht, await beispielVorlage('pdf'))

    expect(await seitenzahl(mit)).toBeGreaterThanOrEqual(await seitenzahl(ohne))
    expect(new TextDecoder().decode((await mit.arrayBuffer()).slice(0, 5))).toBe('%PDF-')
  })

  it('bleibt auch mit Briefbogen unter 5 MB', async () => {
    const mit = await pdfErzeugen(await beispielBericht(), await beispielVorlage('bild'))
    expect(mit.size).toBeLessThan(5 * 1024 * 1024)
  })

  it('nimmt den Briefbogen als Bild in die Word-Kopfzeile', async () => {
    const daten = new Uint8Array(
      await (
        await docxErzeugen(await beispielBericht(), await beispielVorlage('bild'))
      ).arrayBuffer(),
    )
    const roh = new TextDecoder('latin1').decode(daten)
    expect(roh).toContain('word/header1.xml')
    expect(roh).toContain('word/media/')
  })

  it('lässt Word mit einer PDF-Vorlage bei der eigenen Kopfzeile', async () => {
    const bericht = await beispielBericht()
    const ohne = await docxErzeugen(bericht)
    const mit = await docxErzeugen(bericht, await beispielVorlage('pdf'))
    // Word kann eine PDF nicht einbetten – die Datei bleibt deshalb gleich groß.
    expect(Math.abs(mit.size - ohne.size)).toBeLessThan(2048)
  })
})
