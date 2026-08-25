import { describe, expect, it } from 'vitest'
import { MAX_KANTE, zielGroesse } from '../src/lib/bilder'

describe('zielGroesse', () => {
  it('lässt kleine Bilder unverändert', () => {
    expect(zielGroesse(800, 600)).toEqual({ breite: 800, hoehe: 600 })
  })

  it('verkleinert Querformat auf die lange Kante', () => {
    expect(zielGroesse(4000, 3000)).toEqual({ breite: MAX_KANTE, hoehe: 1200 })
  })

  it('verkleinert Hochformat auf die lange Kante', () => {
    expect(zielGroesse(3000, 4000)).toEqual({ breite: 1200, hoehe: MAX_KANTE })
  })

  it('behält das Seitenverhältnis bei extremen Formaten', () => {
    const { breite, hoehe } = zielGroesse(6000, 1000)
    expect(breite).toBe(MAX_KANTE)
    expect(hoehe).toBe(267)
  })

  it('lässt eine Kante nie auf 0 schrumpfen', () => {
    expect(zielGroesse(10000, 3).hoehe).toBeGreaterThanOrEqual(1)
  })

  it('rührt ein Bild genau auf der Grenze nicht an', () => {
    expect(zielGroesse(MAX_KANTE, 900)).toEqual({ breite: MAX_KANTE, hoehe: 900 })
  })

  it('kommt mit einer anderen Vorgabe für die Kante zurecht', () => {
    expect(zielGroesse(2000, 1000, 500)).toEqual({ breite: 500, hoehe: 250 })
  })
})
