import { describe, expect, it } from 'vitest'
import { chargenText, komponentenName, mischungenText } from '../src/lib/aufbau'

describe('komponentenName', () => {
  it('zählt die Komponenten wie auf den Gebinden', () => {
    expect(komponentenName(0)).toBe('Komp. A')
    expect(komponentenName(2)).toBe('Komp. C')
  })
})

describe('chargenText', () => {
  it('lässt die einzelne Charge ohne Buchstaben stehen', () => {
    expect(chargenText(['A12345'])).toBe('A12345')
  })

  it('stellt bei mehreren Komponenten den Buchstaben davor', () => {
    expect(chargenText(['12345', '67890'])).toBe('Komp. A 12345 · Komp. B 67890')
  })

  it('übergeht Komponenten ohne Nummer, behält aber die Zuordnung', () => {
    expect(chargenText(['', '67890'])).toBe('Komp. B 67890')
  })

  it('ist leer, wenn keine Nummer eingetragen wurde', () => {
    expect(chargenText(['', ' '])).toBe('')
  })
})

describe('mischungenText', () => {
  const zeile = {
    bereich: 'Halle 1',
    schicht: 'Verlaufsbeschichtung',
    produkt: 'Sikafloor-264',
    verbrauch: '',
    gesamtmenge: '',
    chargen: [''],
    flaeche: '',
  }

  it('ist leer ohne Mischungen', () => {
    expect(mischungenText(zeile)).toBe('')
    expect(mischungenText({ ...zeile, mischungen: [] })).toBe('')
  })

  it('zählt die Mischungen mit Menge und Fläche auf', () => {
    expect(
      mischungenText({
        ...zeile,
        mischungen: [
          { menge: '25', flaeche: '60' },
          { menge: '25', flaeche: '55,5' },
        ],
      }),
    ).toBe(
      'Sikafloor-264 (Verlaufsbeschichtung) – Mischung 1: 25 kg auf 60 m² · Mischung 2: 25 kg auf 55,5 m²',
    )
  })

  it('lässt weg, was nicht eingetragen ist', () => {
    expect(
      mischungenText({ ...zeile, schicht: '', mischungen: [{ menge: '', flaeche: '60' }] }),
    ).toBe('Sikafloor-264 – Mischung 1: 60 m²')
  })
})
