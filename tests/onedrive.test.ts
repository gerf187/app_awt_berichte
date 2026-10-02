import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { einstellungenAuffuellen } from '../src/lib/bericht'
import {
  STANDARD_ORDNER,
  clientIdVon,
  hochladen,
  ordnerAnlegen,
  ordnerAuflisten,
  ordnerpfad,
  standardKonfig,
} from '../src/lib/onedrive'

describe('Ordnerpfad in OneDrive', () => {
  it('lässt einen normalen Ordner in Ruhe', () => {
    expect(ordnerpfad('Baustellenberichte')).toBe('Baustellenberichte')
  })

  it('erlaubt Unterordner', () => {
    expect(ordnerpfad('Berichte/2026')).toBe('Berichte/2026')
  })

  it('wirft Zeichen weg, die OneDrive nicht mag', () => {
    expect(ordnerpfad('Be:ri*chte?')).toBe('Berichte')
  })

  it('räumt Leerzeichen und leere Stufen auf', () => {
    expect(ordnerpfad('  Berichte // 2026  ')).toBe('Berichte/2026')
  })

  it('verträgt einen leeren Ordner – dann liegt der Bericht ganz oben', () => {
    expect(ordnerpfad('   ')).toBe('')
  })
})

describe('OneDrive-Zugang in den Einstellungen', () => {
  it('fehlt nur, wenn gar nichts gespeichert ist', () => {
    expect(einstellungenAuffuellen({}).onedrive).toBeUndefined()
  })

  // Ohne eigene ID gilt die eingebaute – der Ordner muss trotzdem erhalten
  // bleiben, sonst stünde er nach dem nächsten Laden wieder auf dem Standard.
  it('behält den Ordner, auch wenn keine eigene Anwendungs-ID eingetragen ist', () => {
    const zugang = einstellungenAuffuellen({
      onedrive: { clientId: '  ', ordner: 'Berichte/2026' },
    }).onedrive
    expect(zugang).toEqual({ clientId: '', ordner: 'Berichte/2026' })
  })

  it('füllt einen fehlenden Ordner mit dem Standard', () => {
    const zugang = einstellungenAuffuellen({ onedrive: { clientId: 'abc-123' } }).onedrive
    expect(zugang).toEqual({ clientId: 'abc-123', ordner: STANDARD_ORDNER })
  })

  it('übernimmt einen eigenen Ordner', () => {
    const zugang = einstellungenAuffuellen({
      onedrive: { clientId: ' abc-123 ', ordner: ' Berichte/2026 ' },
    }).onedrive
    expect(zugang).toEqual({ clientId: 'abc-123', ordner: 'Berichte/2026' })
  })

  it('startet leer, aber mit Standardordner', () => {
    expect(standardKonfig()).toEqual({ clientId: '', ordner: STANDARD_ORDNER })
  })
})

describe('Welche Anwendungs-ID benutzt wird', () => {
  it('nimmt die eingebaute, solange keine eigene eingetragen ist', () => {
    // Der Normalfall: der Anwender sieht das Feld nie und drückt nur den Knopf.
    expect(clientIdVon(standardKonfig())).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('lässt eine eigene ID vorgehen – etwa die der Firmen-IT', () => {
    expect(clientIdVon({ clientId: ' eigene-id ', ordner: 'X' })).toBe('eigene-id')
  })
})

/** Ein Gerät, das mit OneDrive verbunden ist, und ein Graph, der mitschreibt. */
function verbunden(antworten: unknown[]) {
  const speicher = new Map<string, string>([
    [
      'awt-onedrive-sitzung',
      JSON.stringify({
        zugriffsToken: 'token',
        gueltigBis: Date.now() + 60_000,
        clientId: 'id',
        konto: 'max@example.com',
      }),
    ],
  ])
  vi.stubGlobal('localStorage', {
    getItem: (schluessel: string) => speicher.get(schluessel) ?? null,
    setItem: (schluessel: string, wert: string) => speicher.set(schluessel, wert),
    removeItem: (schluessel: string) => speicher.delete(schluessel),
  })
  const anfragen: { adresse: string; methode: string; inhalt?: string }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (adresse: string, optionen: RequestInit = {}) => {
      anfragen.push({
        adresse,
        methode: optionen.method ?? 'GET',
        inhalt: typeof optionen.body === 'string' ? optionen.body : undefined,
      })
      return new Response(JSON.stringify(antworten.shift() ?? {}), { status: 200 })
    }),
  )
  return anfragen
}

describe('Ordner in OneDrive', () => {
  beforeEach(() => vi.unstubAllGlobals())
  afterEach(() => vi.unstubAllGlobals())

  it('listet nur Ordner, alphabetisch', async () => {
    const anfragen = verbunden([
      {
        value: [
          { name: 'Zeugnisse', folder: { childCount: 0 } },
          { name: 'notiz.txt' },
          { name: 'Baustellenberichte', folder: { childCount: 3 } },
        ],
      },
    ])

    expect(await ordnerAuflisten('')).toEqual([
      { name: 'Baustellenberichte', unterordner: 3 },
      { name: 'Zeugnisse', unterordner: 0 },
    ])
    expect(anfragen[0].adresse).toContain('/me/drive/root/children')
  })

  it('blättert durch mehrere Seiten und fragt Unterordner über den Pfad ab', async () => {
    const anfragen = verbunden([
      {
        value: [{ name: 'A', folder: {} }],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/weiter',
      },
      { value: [{ name: 'B', folder: {} }] },
    ])

    const liste = await ordnerAuflisten('Berichte/2026 Süd')
    expect(liste.map((ordner) => ordner.name)).toEqual(['A', 'B'])
    expect(anfragen[0].adresse).toContain('/root:/Berichte/2026%20S%C3%BCd:/children')
    expect(anfragen[1].adresse).toBe('https://graph.microsoft.com/v1.0/weiter')
  })

  it('legt einen Ordner an und gibt den ganzen Pfad zurück', async () => {
    const anfragen = verbunden([{}])

    expect(await ordnerAnlegen('Berichte', ' 2026 ')).toBe('Berichte/2026')
    expect(anfragen[0].methode).toBe('POST')
    expect(JSON.parse(anfragen[0].inhalt!)).toMatchObject({ name: '2026', folder: {} })
  })

  it('ersetzt beim Hochladen eine ältere Fassung, statt eine „(1)" daneben zu legen', async () => {
    const anfragen = verbunden([{ webUrl: 'https://onedrive.example/bericht.pdf' }])
    const datei = new File(['%PDF'], 'Bericht.pdf', { type: 'application/pdf' })

    expect(await hochladen(datei, 'Berichte')).toBe('https://onedrive.example/bericht.pdf')
    expect(anfragen[0].adresse).toContain('conflictBehavior=replace')
  })
})
