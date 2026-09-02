import { describe, expect, it } from 'vitest'
import { zahlAusEingabe, zeigtWert } from '../src/lib/zahlfeld'

describe('zahlAusEingabe', () => {
  it('liest ganze und gebrochene Zahlen', () => {
    expect(zahlAusEingabe('18')).toBe(18)
    expect(zahlAusEingabe('18.5')).toBe(18.5)
    expect(zahlAusEingabe('-3')).toBe(-3)
  })

  it('nimmt das Komma wie den Punkt – so wird auf der Baustelle getippt', () => {
    expect(zahlAusEingabe('18,5')).toBe(18.5)
  })

  it('lässt das Feld leer sein, statt daraus eine 0 zu machen', () => {
    expect(zahlAusEingabe('')).toBeNull()
    expect(zahlAusEingabe('   ')).toBeNull()
    expect(zahlAusEingabe('-')).toBeNull()
  })

  it('nimmt ein angefangenes Komma schon als Zahl – getippt wird weiter', () => {
    // Der Wortlaut „18," bleibt im Feld stehen, gespeichert ist so lange 18.
    expect(zahlAusEingabe('18,')).toBe(18)
    expect(zeigtWert('18,', 18)).toBe(true)
  })

  it('meldet Unsinn als „noch keine Zahl"', () => {
    expect(zahlAusEingabe('abc')).toBeNull()
  })
})

describe('zeigtWert', () => {
  it('lässt den Wortlaut stehen, solange er denselben Wert meint', () => {
    expect(zeigtWert('18', 18)).toBe(true)
    expect(zeigtWert('018', 18)).toBe(true)
    expect(zeigtWert('18,0', 18)).toBe(true)
  })

  it('erkennt einen von außen gesetzten Wert', () => {
    expect(zeigtWert('18', 20)).toBe(false)
    expect(zeigtWert('', 20)).toBe(false)
  })
})
