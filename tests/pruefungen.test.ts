import { describe, expect, it } from 'vitest'
import {
  ausgefuellte,
  gemesseneWerte,
  messwertText,
  mittelwert,
  mittelwertText,
  neuePruefung,
  neuerMesswert,
  pruefungAuffuellen,
  standardEinheit,
  zahlAusEingabe,
} from '../src/lib/pruefungen'
import type { Pruefung } from '../src/lib/typen'

function pruefung(teil: Partial<Pruefung> = {}): Pruefung {
  return neuePruefung({ bezeichnung: 'Haftzugfestigkeit', einheit: 'N/mm²', ...teil })
}

/** Kurzschreibweise: aus Zahlen werden Messwerte ohne Bruchbild. */
function werte(...zahlen: (number | null)[]) {
  return zahlen.map((wert) => neuerMesswert({ wert }))
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

describe('zahlAusEingabe', () => {
  it('nimmt Komma und Punkt für dieselbe Zahl', () => {
    expect(zahlAusEingabe('1,045')).toBe(1.045)
    expect(zahlAusEingabe('1.045')).toBe(1.045)
    expect(zahlAusEingabe('1,045')).toBe(zahlAusEingabe('1.045'))
  })

  it('lässt eine leere oder unlesbare Eingabe offen', () => {
    expect(zahlAusEingabe('')).toBeNull()
    expect(zahlAusEingabe('  ')).toBeNull()
    expect(zahlAusEingabe('Bruch im Beton')).toBeNull()
  })
})

describe('mittelwert', () => {
  it('rechnet nur über abgelesene Werte und übergeht leere Zeilen', () => {
    const messung = pruefung({ messwerte: werte(1.5, null, 1.7, null) })
    expect(gemesseneWerte(messung)).toEqual([1.5, 1.7])
    expect(mittelwert(messung)).toBeCloseTo(1.6)
  })

  it('gibt es nicht, solange nichts gemessen wurde', () => {
    expect(mittelwert(pruefung({ messwerte: werte(null) }))).toBeNull()
    expect(mittelwertText(pruefung({ messwerte: werte(null) }))).toBe('')
  })

  it('schreibt ihn mit zwei Nachkommastellen, Komma und Einheit', () => {
    const messung = pruefung({ messwerte: werte(1.045, 1.1) })
    expect(mittelwertText(messung)).toBe('1,07 N/mm²')
  })

  it('kommt ohne Einheit aus', () => {
    expect(mittelwertText(pruefung({ einheit: '', messwerte: werte(3) }))).toBe('3,00')
  })
})

describe('messwertText', () => {
  it('schreibt Einzelwerte mit drei Nachkommastellen', () => {
    expect(messwertText(1.045)).toBe('1,045')
    expect(messwertText(0.5)).toBe('0,500')
  })

  it('bleibt bei einer leeren Zeile leer', () => {
    expect(messwertText(null)).toBe('')
  })
})

describe('ausgefuellte', () => {
  it('lässt angefangene Zeilen aus dem Bericht heraus', () => {
    const liste = [
      pruefung({ messwerte: werte(1.5, 1.7) }),
      // Bezeichnung, aber nichts gemessen.
      pruefung({ bezeichnung: 'Rauhtiefe', messwerte: werte(null) }),
      // Gemessen, aber ohne Bezeichnung – niemand weiß, was 0,6 bedeutet.
      pruefung({ bezeichnung: '', messwerte: werte(0.6) }),
    ]
    expect(ausgefuellte(liste)).toHaveLength(1)
  })
})

describe('pruefungAuffuellen', () => {
  it('übersetzt den alten Stand: art und getippte Werte', () => {
    const alt = {
      art: 'Haftzugfestigkeit',
      einheit: 'N/mm²',
      werte: ['1,5', '1,7'],
      bemerkung: 'Achse C',
    }
    const neu = pruefungAuffuellen(alt)

    expect(neu.bezeichnung).toBe('Haftzugfestigkeit')
    expect(neu.bemerkung).toBe('Achse C')
    expect(neu.messwerte.map((messwert) => messwert.wert)).toEqual([1.5, 1.7])
    // Ein alter Wert kennt kein Bruchbild – das Feld ist da und ist leer.
    expect(neu.messwerte.every((messwert) => messwert.bemerkung === '')).toBe(true)
    expect(neu.messwerte.every((messwert) => messwert.id.length > 0)).toBe(true)
  })

  it('zerlegt mehrere Werte aus einem einzigen Feld', () => {
    expect(
      pruefungAuffuellen({ art: 'Schichtdicke', werte: ['1,5; 1,7'] }).messwerte.map((m) => m.wert),
    ).toEqual([1.5, 1.7])
    // So hat die frühere Ausgabe die Werte aufgereiht.
    expect(
      pruefungAuffuellen({ art: 'Schichtdicke', werte: '1,5 · 1,7 · 1,6' }).messwerte.map(
        (m) => m.wert,
      ),
    ).toEqual([1.5, 1.7, 1.6])
  })

  it('lässt eine leere Prüfung mit einer leeren Zeile stehen', () => {
    const neu = pruefungAuffuellen({ art: '', einheit: '', werte: [''], bemerkung: '' })
    expect(neu.messwerte).toHaveLength(1)
    expect(neu.messwerte[0].wert).toBeNull()
  })

  it('ändert einen schon übersetzten Stand nicht mehr', () => {
    const einmal = pruefungAuffuellen({
      art: 'Haftzugfestigkeit',
      einheit: 'N/mm²',
      werte: ['1,5', '1,7'],
      bemerkung: '',
    })
    einmal.messwerte[0].bemerkung = 'Bruch im Beton'

    expect(pruefungAuffuellen(einmal)).toEqual(einmal)
    expect(pruefungAuffuellen(pruefungAuffuellen(einmal))).toEqual(einmal)
  })

  it('macht aus Unbrauchbarem eine leere Prüfung statt eines Absturzes', () => {
    const leer = pruefungAuffuellen(undefined)
    expect(leer.bezeichnung).toBe('')
    expect(leer.messwerte).toHaveLength(1)
  })
})
