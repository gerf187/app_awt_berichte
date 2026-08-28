import { describe, expect, it } from 'vitest'
import {
  ausgefuellte,
  messwerte,
  mittelwert,
  mittelwertText,
  standardEinheit,
  werteText,
} from '../src/lib/pruefungen'
import type { Pruefung } from '../src/lib/typen'

function pruefung(teil: Partial<Pruefung> = {}): Pruefung {
  return { art: 'Haftzugfestigkeit', einheit: 'N/mm²', werte: [], bemerkung: '', ...teil }
}

describe('standardEinheit', () => {
  it('kennt die Einheit der bekannten Prüfungen', () => {
    expect(standardEinheit('Haftzugfestigkeit')).toBe('N/mm²')
    expect(standardEinheit('Ausbreitmaß (Hägemanntisch)')).toBe('mm')
  })

  it('lässt Selbstgeschriebenes ohne Einheit', () => {
    expect(standardEinheit('Gitterschnitt')).toBe('')
  })
})

describe('messwerte', () => {
  it('liest Kommazahlen und übergeht leere Zeilen', () => {
    expect(messwerte(pruefung({ werte: ['1,5', '', '1,7', 'abc'] }))).toEqual([1.5, 1.7])
  })
})

describe('mittelwert', () => {
  it('rechnet über alle Einzelwerte', () => {
    expect(mittelwert(pruefung({ werte: ['1,5', '1,7', '1,6'] }))).toBeCloseTo(1.6)
  })

  it('gibt es bei einem einzigen Wert nicht – er wäre nur eine Wiederholung', () => {
    expect(mittelwert(pruefung({ werte: ['1,5'] }))).toBeNull()
    expect(mittelwertText(pruefung({ werte: ['1,5'] }))).toBe('')
  })

  it('schreibt ihn mit Komma und Einheit', () => {
    expect(mittelwertText(pruefung({ werte: ['1,5', '1,7'] }))).toBe('1,6 N/mm²')
  })
})

describe('werteText', () => {
  it('reiht die Einzelwerte mit Einheit auf', () => {
    expect(werteText(pruefung({ werte: ['1,5', '1,7'] }))).toBe('1,5 · 1,7 N/mm²')
  })

  it('kommt ohne Einheit aus', () => {
    expect(werteText(pruefung({ einheit: '', werte: ['3'] }))).toBe('3')
  })

  it('ist leer, solange nichts gemessen wurde', () => {
    expect(werteText(pruefung({ werte: ['', '  '] }))).toBe('')
  })
})

describe('ausgefuellte', () => {
  it('lässt angefangene Zeilen aus dem Bericht heraus', () => {
    const liste = [
      pruefung({ werte: ['1,5', '1,7'] }),
      // Bezeichnung, aber nichts gemessen.
      pruefung({ art: 'Rauhtiefe', werte: [''] }),
      // Gemessen, aber ohne Bezeichnung – niemand weiß, was 0,6 bedeutet.
      pruefung({ art: '', werte: ['0,6'] }),
    ]
    expect(ausgefuellte(liste)).toHaveLength(1)
  })
})
