import { describe, expect, it } from 'vitest'
import {
  alsDatumstext,
  alsUhrzeit,
  fehlendePflichtfelder,
  kopfUebernehmen,
  naechsteBerichtsnummer,
  neuerBericht,
} from '../src/lib/bericht'
import type { Einstellungen } from '../src/lib/typen'

const EIN_TAG = new Date(2026, 7, 25, 9, 5) // 25.08.2026, 09:05 Ortszeit

const einstellungen: Einstellungen = {
  eigenerName: 'Björn Esser',
  eigeneEmail: 'b.esser@example.de',
  standardVertrieb: 'M. Vertrieb',
  standardEmpfaenger: 'buero@example.de',
  produkte: [],
}

describe('alsDatumstext', () => {
  it('nimmt die Ortszeit, nicht UTC', () => {
    expect(alsDatumstext(EIN_TAG)).toBe('2026-08-25')
  })

  it('füllt einstellige Monate und Tage auf', () => {
    expect(alsDatumstext(new Date(2026, 0, 3))).toBe('2026-01-03')
  })
})

describe('alsUhrzeit', () => {
  it('gibt HH:MM zurück', () => {
    expect(alsUhrzeit(EIN_TAG)).toBe('09:05')
  })
})

describe('naechsteBerichtsnummer', () => {
  it('beginnt am Tag mit 01', () => {
    expect(naechsteBerichtsnummer([], EIN_TAG)).toBe('2026-08-25-01')
  })

  it('zählt innerhalb desselben Tages hoch', () => {
    expect(naechsteBerichtsnummer(['2026-08-25-01', '2026-08-25-02'], EIN_TAG)).toBe(
      '2026-08-25-03',
    )
  })

  it('ignoriert Nummern anderer Tage', () => {
    expect(naechsteBerichtsnummer(['2026-08-24-07', '2025-08-25-09'], EIN_TAG)).toBe(
      '2026-08-25-01',
    )
  })

  it('zählt ab der höchsten Nummer, auch wenn dazwischen gelöscht wurde', () => {
    expect(naechsteBerichtsnummer(['2026-08-25-05', '2026-08-25-02'], EIN_TAG)).toBe(
      '2026-08-25-06',
    )
  })

  it('läuft über 09 hinaus sauber weiter', () => {
    expect(naechsteBerichtsnummer(['2026-08-25-09'], EIN_TAG)).toBe('2026-08-25-10')
  })
})

describe('neuerBericht', () => {
  it('belegt Datum, Techniker und Vertrieb aus den Einstellungen vor', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    expect(bericht.kopf.datum).toBe('2026-08-25')
    expect(bericht.kopf.awt).toBe('Björn Esser')
    expect(bericht.kopf.vertrieb).toBe('M. Vertrieb')
    expect(bericht.status).toBe('Entwurf')
  })

  it('setzt die erste Zeile der Anwesenden auf den eigenen Namen', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    expect(bericht.anwesende).toEqual([
      { name: 'Björn Esser', firma: 'Sika', funktion: 'AWT' },
    ])
  })

  it('vergibt eindeutige Ids', () => {
    const a = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    const b = neuerBericht('2026-08-25-02', einstellungen, EIN_TAG)
    expect(a.id).not.toBe(b.id)
  })
})

describe('kopfUebernehmen', () => {
  it('übernimmt die Baustellendaten, behält aber Nummer und Datum des neuen Berichts', () => {
    const vorlage = neuerBericht('2026-08-24-01', einstellungen, new Date(2026, 7, 24))
    vorlage.kopf.projekt = 'Halle 3'
    vorlage.kopf.verarbeiter = 'Boden Meier GmbH'
    vorlage.kopf.zweck = 'Erstbesuch'

    const neu = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    const ergebnis = kopfUebernehmen(neu, vorlage)

    expect(ergebnis.kopf.projekt).toBe('Halle 3')
    expect(ergebnis.kopf.verarbeiter).toBe('Boden Meier GmbH')
    expect(ergebnis.kopf.berichtsnummer).toBe('2026-08-25-01')
    expect(ergebnis.kopf.datum).toBe('2026-08-25')
    // Der Grund des Besuchs ist jedes Mal ein anderer.
    expect(ergebnis.kopf.zweck).toBe('')
  })
})

describe('fehlendePflichtfelder', () => {
  it('meldet bei einem frischen Bericht Projekt, Verarbeiter, Klima und Text', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    const felder = fehlendePflichtfelder(bericht).map((eintrag) => eintrag.feld)

    expect(felder).toContain('Projekt / Bauvorhaben')
    expect(felder).toContain('Verarbeiter')
    expect(felder).toContain('Mindestens eine Klimamessung')
    expect(felder).toContain('Mindestens ein Textabschnitt')
    // Datum und Techniker sind vorbelegt.
    expect(felder).not.toContain('Datum')
    expect(felder).not.toContain('Anwendungstechniker')
  })

  it('ist leer, wenn alles ausgefüllt ist', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    bericht.kopf.projekt = 'Halle 3'
    bericht.kopf.verarbeiter = 'Boden Meier GmbH'
    bericht.klima = [
      { uhrzeit: '09:00', luft: 20, boden: 15, feuchte: 50, taupunkt: 9.3, abstandTaupunkt: 5.7, warnung: false },
    ]
    bericht.text.ausgefuehrteArbeiten = 'Grundierung aufgebracht.'

    expect(fehlendePflichtfelder(bericht)).toEqual([])
  })

  it('lässt reine Leerzeichen nicht als Eingabe durchgehen', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    bericht.kopf.projekt = '   '
    expect(fehlendePflichtfelder(bericht).map((e) => e.feld)).toContain('Projekt / Bauvorhaben')
  })
})
