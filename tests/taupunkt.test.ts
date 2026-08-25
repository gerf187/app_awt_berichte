import { describe, expect, it } from 'vitest'
import {
  abstandZumTaupunkt,
  istKritisch,
  klimaBerechnen,
  taupunkt,
} from '../src/lib/taupunkt'

describe('taupunkt', () => {
  // Bekannte Wertepaare (Magnus-Formel, a = 17.62, b = 243.12),
  // gerundet auf eine Nachkommastelle.
  const bekannteWerte: [luft: number, feuchte: number, erwartet: number][] = [
    [20, 50, 9.3],
    [20, 100, 20],
    [25, 60, 16.7],
    [10, 80, 6.7],
    [30, 30, 10.5],
    [0, 50, -9.2],
    [15, 65, 8.5],
  ]

  it.each(bekannteWerte)('bei %i °C und %i %% rF liegt der Taupunkt bei %f °C', (luft, feuchte, erwartet) => {
    expect(taupunkt(luft, feuchte)).toBe(erwartet)
  })

  it('gibt bei 100 % rF die Lufttemperatur selbst zurück', () => {
    expect(taupunkt(12, 100)).toBe(12)
  })

  it('rechnet auch bei sehr trockener Luft eine Zahl statt NaN', () => {
    expect(Number.isFinite(taupunkt(20, 0))).toBe(true)
  })

  it('liefert 0 statt NaN, wenn ein Feld noch leer ist', () => {
    expect(taupunkt(Number.NaN, 50)).toBe(0)
    expect(taupunkt(20, Number.NaN)).toBe(0)
  })
})

describe('abstandZumTaupunkt', () => {
  it('zieht den Taupunkt von der Untergrundtemperatur ab', () => {
    expect(abstandZumTaupunkt(15, 9.3)).toBe(5.7)
  })

  it('wird negativ, wenn der Untergrund kälter als der Taupunkt ist', () => {
    expect(abstandZumTaupunkt(8, 9.3)).toBe(-1.3)
  })
})

describe('istKritisch', () => {
  it('warnt unterhalb von 3 K', () => {
    expect(istKritisch(2.9)).toBe(true)
    expect(istKritisch(0)).toBe(true)
    expect(istKritisch(-1)).toBe(true)
  })

  it('warnt ab 3 K nicht mehr', () => {
    expect(istKritisch(3)).toBe(false)
    expect(istKritisch(7.5)).toBe(false)
  })
})

describe('klimaBerechnen', () => {
  it('gibt Taupunkt, Abstand und Warnung zusammen zurück', () => {
    expect(klimaBerechnen({ luft: 20, boden: 15, feuchte: 50 })).toEqual({
      taupunkt: 9.3,
      abstandTaupunkt: 5.7,
      warnung: false,
    })
  })

  it('setzt die Warnung, wenn der Untergrund zu dicht am Taupunkt liegt', () => {
    const ergebnis = klimaBerechnen({ luft: 20, boden: 11, feuchte: 70 })
    expect(ergebnis.warnung).toBe(true)
    expect(ergebnis.abstandTaupunkt).toBeLessThan(3)
  })
})
