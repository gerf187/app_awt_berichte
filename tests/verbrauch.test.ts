import { describe, expect, it } from 'vitest'
import {
  gesamtmengeRechnen,
  mengeAnzeigen,
  verbrauchAnzeigen,
  verbrauchLesen,
  verbrauchRechnen,
  verbrauchszeile,
  zahlLesen,
  zahlSchreiben,
} from '../src/lib/verbrauch'

describe('zahlLesen', () => {
  it('nimmt Komma und Punkt', () => {
    expect(zahlLesen('1,2')).toBe(1.2)
    expect(zahlLesen('1.2')).toBe(1.2)
  })

  it('gibt bei Leerem und Unsinn null zurück', () => {
    expect(zahlLesen('')).toBeNull()
    expect(zahlLesen('   ')).toBeNull()
    expect(zahlLesen('abc')).toBeNull()
    expect(zahlLesen('-5')).toBeNull()
  })
})

describe('zahlSchreiben', () => {
  it('schreibt mit Komma und ohne überflüssige Nullen', () => {
    expect(zahlSchreiben(1.2)).toBe('1,2')
    expect(zahlSchreiben(504)).toBe('504')
    expect(zahlSchreiben(0.25)).toBe('0,25')
  })
})

describe('verbrauchLesen', () => {
  it('liest kleine Zahlen als kg/m²', () => {
    expect(verbrauchLesen('1,2')).toBe(1.2)
    expect(verbrauchLesen('0,2')).toBe(0.2)
  })

  it('liest große Zahlen als g/m² – 200 kg/m² gibt es nicht', () => {
    expect(verbrauchLesen('200')).toBe(0.2)
    expect(verbrauchLesen('1500')).toBe(1.5)
  })
})

describe('verbrauchAnzeigen', () => {
  it('folgt der Praxis: unter 1 kg in Gramm, darüber in Kilogramm', () => {
    expect(verbrauchAnzeigen(1.2)).toBe('1,2 kg/m²')
    expect(verbrauchAnzeigen(0.2)).toBe('200 g/m²')
    expect(verbrauchAnzeigen(1)).toBe('1 kg/m²')
  })

  it('macht aus beiden Eingabewegen dieselbe Anzeige', () => {
    expect(verbrauchAnzeigen(verbrauchLesen('200')!)).toBe('200 g/m²')
    expect(verbrauchAnzeigen(verbrauchLesen('0,2')!)).toBe('200 g/m²')
  })
})

describe('Verbrauch und Gesamtmenge', () => {
  it('rechnet die Gesamtmenge aus Verbrauch und Fläche', () => {
    expect(gesamtmengeRechnen(1.2, 420)).toBe(504)
  })

  it('rechnet den Verbrauch aus Gesamtmenge und Fläche', () => {
    expect(verbrauchRechnen(504, 420)).toBe(1.2)
  })

  it('rechnet ohne Fläche nicht', () => {
    expect(verbrauchRechnen(504, 0)).toBeNull()
  })
})

describe('mengeAnzeigen', () => {
  it('zeigt Kilogramm, bei kleinen Mengen Gramm', () => {
    expect(mengeAnzeigen(504)).toBe('504 kg')
    expect(mengeAnzeigen(0.84)).toBe('840 g')
  })
})

describe('verbrauchszeile', () => {
  it('setzt Verbrauch, Fläche und Gesamtmenge zusammen', () => {
    expect(verbrauchszeile({ verbrauch: '1,2', flaeche: '420', gesamtmenge: '504' })).toBe(
      '1,2 kg/m² · 420 m² · gesamt 504 kg',
    )
  })

  it('lässt weg, was nicht eingetragen ist', () => {
    expect(verbrauchszeile({ verbrauch: '0,2', flaeche: '', gesamtmenge: '' })).toBe('200 g/m²')
    expect(verbrauchszeile({ verbrauch: '', flaeche: '', gesamtmenge: '' })).toBe('')
  })
})
