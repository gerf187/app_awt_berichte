import { describe, expect, it } from 'vitest'
import {
  LEERE_AUFBAUZEILE,
  LEERE_EINSTELLUNGEN,
  fehlendePflichtfelder,
  neuerBericht,
} from '../src/lib/bericht'
import { blattStand } from '../src/lib/blattstand'
import { klimaBerechnen } from '../src/lib/taupunkt'
import type { Bericht, BlattId } from '../src/lib/typen'

const EIN_TAG = new Date(2026, 7, 25, 9, 5)

function frisch(): Bericht {
  return neuerBericht('2026-08-25-01', LEERE_EINSTELLUNGEN, EIN_TAG)
}

function stand(bericht: Bericht, blatt: BlattId) {
  return blattStand(blatt, bericht, fehlendePflichtfelder(bericht))
}

function messung(uhrzeit: string, luft: number, boden: number, feuchte: number) {
  return { uhrzeit, luft, boden, feuchte, ...klimaBerechnen({ luft, boden, feuchte }) }
}

describe('blattStand', () => {
  it('meldet fehlende Pflichtangaben gelb, mit Namen der Angabe', () => {
    const bericht = frisch()
    bericht.kopf.projekt = 'Halle 3'
    bericht.kopf.awt = 'B. Esser'
    bericht.kopf.verarbeiter = ''

    expect(stand(bericht, 'kopf')).toEqual({ art: 'fehlt', text: 'Verarbeiter fehlt' })
  })

  it('zählt zusammen, wenn mehrere Angaben fehlen', () => {
    expect(stand(frisch(), 'kopf')).toEqual({ art: 'fehlt', text: '3 Angaben fehlen' })
  })

  it('wird grün, sobald die Pflichtangaben stehen', () => {
    const bericht = frisch()
    bericht.kopf.projekt = 'Halle 3'
    bericht.kopf.verarbeiter = 'Boden Meier GmbH'
    bericht.kopf.awt = 'B. Esser'

    expect(stand(bericht, 'kopf')).toEqual({ art: 'fertig', text: 'ausgefüllt' })
  })

  it('macht aus dem unterschrittenen Taupunkt eine rote Warnung', () => {
    const bericht = frisch()
    // Boden 14 °C bei 21 °C Luft und 72 % – der Taupunkt liegt darüber.
    bericht.klima = [messung('08:15', 18, 16.5, 55), messung('11:40', 21, 14, 72)]

    expect(bericht.klima[1].warnung).toBe(true)
    expect(stand(bericht, 'klima')).toEqual({ art: 'warnung', text: 'Taupunkt 11:40' })
  })

  it('meldet Klima grün, solange keine Messung kritisch ist', () => {
    const bericht = frisch()
    bericht.klima = [messung('08:15', 18, 16.5, 55)]

    expect(stand(bericht, 'klima')).toEqual({ art: 'fertig', text: '1 Messung' })
  })

  it('führt Blätter ohne Pflichtangaben grau, egal ob voll oder leer', () => {
    const bericht = frisch()
    expect(stand(bericht, 'fotos')).toEqual({ art: 'neutral', text: 'kein Foto' })
    expect(stand(bericht, 'pruefungen')).toEqual({ art: 'neutral', text: 'nichts geprüft' })

    bericht.aufbau = [{ ...LEERE_AUFBAUZEILE, bereich: 'EG', schicht: 'Grundierung' }]
    bericht.pruefungen = [
      { art: 'Rauhtiefe', einheit: 'mm', werte: ['0,6'], bemerkung: '' },
      // Ohne Messwert ist es keine Prüfung, sondern eine angefangene Zeile.
      { art: 'Haftzugfestigkeit', einheit: 'N/mm²', werte: [''], bemerkung: '' },
    ]

    expect(stand(bericht, 'pruefungen')).toEqual({ art: 'neutral', text: '1 Prüfung' })
    expect(stand(bericht, 'aufbau')).toEqual({ art: 'neutral', text: '1 Zeile' })
  })

  it('zählt nur Anwesende mit Namen', () => {
    const bericht = frisch()
    bericht.anwesende = [
      { name: 'B. Esser', firma: 'Sika', funktion: 'AWT' },
      { name: '  ', firma: '', funktion: '' },
    ]

    expect(stand(bericht, 'thematik')).toEqual({ art: 'neutral', text: '1 Person' })
  })
})
