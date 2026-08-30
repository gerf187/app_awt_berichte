import { describe, expect, it } from 'vitest'
import { einstellungenAuffuellen } from '../src/lib/bericht'
import { STANDARD_ORDNER, clientIdVon, ordnerpfad, standardKonfig } from '../src/lib/onedrive'

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
