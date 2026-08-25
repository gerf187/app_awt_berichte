import { describe, expect, it } from 'vitest'
import { dateiname, entschaerfen } from '../src/lib/dateiname'
import { neuerBericht } from '../src/lib/bericht'
import { LEERE_EINSTELLUNGEN } from '../src/lib/bericht'

function berichtMit(projekt: string, nummer = '2026-08-25-01') {
  const bericht = neuerBericht(nummer, LEERE_EINSTELLUNGEN, new Date(2026, 7, 25))
  bericht.kopf.projekt = projekt
  return bericht
}

describe('entschaerfen', () => {
  it('ersetzt Umlaute und Eszett', () => {
    expect(entschaerfen('Müller Straße Öl Ähre')).toBe('Mueller_Strasse_Oel_Aehre')
  })

  it('wirft Schrägstriche und Doppelpunkte hinaus', () => {
    expect(entschaerfen('Halle 3/4: Nord')).toBe('Halle_3_4_Nord')
  })

  it('lässt keine führenden oder abschließenden Unterstriche stehen', () => {
    expect(entschaerfen('  Halle 3  ')).toBe('Halle_3')
  })

  it('behält Punkte und Bindestriche', () => {
    expect(entschaerfen('2026-08-25-01')).toBe('2026-08-25-01')
  })
})

describe('dateiname', () => {
  it('setzt Nummer und Projekt zusammen', () => {
    expect(dateiname(berichtMit('Halle 3'), 'pdf')).toBe(
      'Baustellenbericht_2026-08-25-01_Halle_3.pdf',
    )
  })

  it('nutzt für Word dasselbe Schema', () => {
    expect(dateiname(berichtMit('Halle 3'), 'docx')).toBe(
      'Baustellenbericht_2026-08-25-01_Halle_3.docx',
    )
  })

  it('kommt ohne Projektnamen aus', () => {
    expect(dateiname(berichtMit(''), 'pdf')).toBe('Baustellenbericht_2026-08-25-01.pdf')
  })

  it('macht auch aus einem wilden Projektnamen einen brauchbaren Dateinamen', () => {
    expect(dateiname(berichtMit('Bäckerei Süß & Co. / Neubau'), 'pdf')).toBe(
      'Baustellenbericht_2026-08-25-01_Baeckerei_Suess_Co._Neubau.pdf',
    )
  })
})
