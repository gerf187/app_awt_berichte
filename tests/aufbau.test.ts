import { describe, expect, it } from 'vitest'
import { chargenText, komponentenName } from '../src/lib/aufbau'

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
