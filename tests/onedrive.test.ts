import { describe, expect, it } from 'vitest'
import { einstellungenAuffuellen } from '../src/lib/bericht'
import { STANDARD_ORDNER, ordnerpfad, standardKonfig } from '../src/lib/onedrive'

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
  it('fehlt, solange keine Anwendungs-ID eingetragen ist', () => {
    expect(einstellungenAuffuellen({}).onedrive).toBeUndefined()
    expect(
      einstellungenAuffuellen({ onedrive: { clientId: '  ', ordner: 'X' } }).onedrive,
    ).toBeUndefined()
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
