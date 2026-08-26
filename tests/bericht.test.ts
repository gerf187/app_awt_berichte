import { describe, expect, it } from 'vitest'
import {
  absenderzeilen,
  alsDatumstext,
  alsUhrzeit,
  berichtAuffuellen,
  einstellungenAuffuellen,
  fehlendePflichtfelder,
  naechsteBerichtsnummer,
  neuerBericht,
  produktMerken,
} from '../src/lib/bericht'
import type { Bericht, Einstellungen } from '../src/lib/typen'

const EIN_TAG = new Date(2026, 7, 25, 9, 5) // 25.08.2026, 09:05 Ortszeit

const einstellungen: Einstellungen = {
  profil: {
    name: 'Björn Esser',
    funktion: 'Anwendungstechniker',
    firma: 'Sika Deutschland GmbH',
    strasse: 'Kornwestheimer Str. 103',
    ort: '70439 Stuttgart',
    telefon: '0171 9876543',
    email: 'b.esser@example.de',
  },
  gemerkteProdukte: [],
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
  it('belegt Datum und Techniker aus dem Profil vor', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    expect(bericht.kopf.datum).toBe('2026-08-25')
    expect(bericht.kopf.awt).toBe('Björn Esser')
    expect(bericht.status).toBe('Entwurf')
  })

  it('setzt die erste Zeile der Anwesenden aus dem Profil', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    expect(bericht.anwesende).toEqual([
      { name: 'Björn Esser', firma: 'Sika Deutschland GmbH', funktion: 'Anwendungstechniker' },
    ])
  })

  it('fällt bei leerem Profil auf die Stammdaten zurück', () => {
    const ohneProfil: Einstellungen = {
      ...einstellungen,
      profil: { ...einstellungen.profil, firma: '', funktion: '' },
    }
    const bericht = neuerBericht('2026-08-25-01', ohneProfil, EIN_TAG)
    expect(bericht.anwesende[0]).toEqual({
      name: 'Björn Esser',
      firma: 'Sika',
      funktion: 'AWT',
    })
  })

  it('kopiert das Profil als Absender in den Bericht', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    expect(bericht.absender).toEqual(einstellungen.profil)

    // Ändert sich das Profil später, bleibt der Bericht wie verschickt.
    einstellungen.profil.telefon = '0000'
    expect(bericht.absender.telefon).toBe('0171 9876543')
    einstellungen.profil.telefon = '0171 9876543'
  })

  it('vergibt eindeutige Ids', () => {
    const a = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    const b = neuerBericht('2026-08-25-02', einstellungen, EIN_TAG)
    expect(a.id).not.toBe(b.id)
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

  it('nennt zu jeder fehlenden Angabe das Blatt, auf dem sie steht', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    const nach = Object.fromEntries(
      fehlendePflichtfelder(bericht).map((eintrag) => [eintrag.feld, eintrag.blatt]),
    )

    expect(nach['Projekt / Bauvorhaben']).toBe('kopf')
    expect(nach['Mindestens eine Klimamessung']).toBe('klima')
    expect(nach['Mindestens ein Textabschnitt']).toBe('text')
  })

  it('lässt „Offene Fragen" allein nicht als Bericht durchgehen', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    bericht.text.offeneFragen = 'Wer stellt die Bauheizung?'
    expect(fehlendePflichtfelder(bericht).map((e) => e.feld)).toContain(
      'Mindestens ein Textabschnitt',
    )
  })

  it('ist leer, wenn alles ausgefüllt ist', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    bericht.kopf.projekt = 'Halle 3'
    bericht.kopf.verarbeiter = 'Boden Meier GmbH'
    bericht.klima = [
      {
        uhrzeit: '09:00',
        luft: 20,
        boden: 15,
        feuchte: 50,
        taupunkt: 9.3,
        abstandTaupunkt: 5.7,
        warnung: false,
      },
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

describe('absenderzeilen', () => {
  it('setzt Name, Funktion, Firma, Anschrift und Kontakt zusammen', () => {
    expect(absenderzeilen(einstellungen.profil)).toEqual([
      'Björn Esser · Anwendungstechniker',
      'Sika Deutschland GmbH',
      'Kornwestheimer Str. 103, 70439 Stuttgart',
      '0171 9876543 · b.esser@example.de',
    ])
  })

  it('lässt leere Angaben weg, statt einsame Trennzeichen zu setzen', () => {
    expect(
      absenderzeilen({
        name: 'B. Esser',
        funktion: '',
        firma: '',
        strasse: '',
        ort: '70439 Stuttgart',
        telefon: '',
        email: 'b@example.de',
      }),
    ).toEqual(['B. Esser', '70439 Stuttgart', 'b@example.de'])
  })

  it('gibt bei leerem Profil eine leere Liste zurück', () => {
    expect(
      absenderzeilen({
        name: '',
        funktion: '',
        firma: '',
        strasse: '',
        ort: '',
        telefon: '',
        email: '',
      }),
    ).toEqual([])
  })
})

describe('berichtAuffuellen', () => {
  it('ergänzt Felder, die es beim Speichern noch nicht gab', () => {
    const alt = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    // So liegt ein Bericht aus der Zeit vor „Offene Fragen" in der Datenbank.
    delete (alt.text as Partial<Bericht['text']>).offeneFragen
    delete (alt as Partial<Bericht>).absender
    delete (alt.untergrund as Partial<Bericht['untergrund']>).rauhtiefe

    const aufgefuellt = berichtAuffuellen(alt)
    expect(aufgefuellt.text.offeneFragen).toBe('')
    expect(aufgefuellt.absender.name).toBe('')
    expect(aufgefuellt.untergrund.rauhtiefe).toBe('')
    // Vorhandenes bleibt unangetastet.
    expect(aufgefuellt.kopf.berichtsnummer).toBe('2026-08-25-01')
  })

  it('lässt einen vollständigen Bericht inhaltlich unverändert', () => {
    const bericht = neuerBericht('2026-08-25-01', einstellungen, EIN_TAG)
    bericht.text.offeneFragen = 'Wer stellt die Bauheizung?'
    expect(berichtAuffuellen(bericht)).toEqual(bericht)
  })
})

describe('einstellungenAuffuellen', () => {
  it('macht aus dem alten Namensfeld ein Profil', () => {
    const alt = {
      eigenerName: 'B. Esser',
      eigeneEmail: 'b@example.de',
      produkte: ['Sikafloor-161'],
    }
    const neu = einstellungenAuffuellen(alt)

    expect(neu.profil.name).toBe('B. Esser')
    expect(neu.profil.email).toBe('b@example.de')
    expect(neu.profil.firma).toBe('')
    // Aus der früher von Hand gepflegten Liste werden gemerkte Produkte.
    expect(neu.gemerkteProdukte).toEqual(['Sikafloor-161'])
  })

  it('lässt ein vorhandenes Profil stehen', () => {
    expect(einstellungenAuffuellen(einstellungen)).toEqual(einstellungen)
  })

  it('verkraftet eine leere Datenbank', () => {
    expect(einstellungenAuffuellen(undefined).profil.name).toBe('')
  })
})

describe('produktMerken', () => {
  it('nimmt ein neues Produkt auf und sortiert die Liste', () => {
    expect(produktMerken(['Sikafloor-264'], 'Sikagard-720')).toEqual([
      'Sikafloor-264',
      'Sikagard-720',
    ])
  })

  it('merkt dasselbe Produkt nicht zweimal, auch nicht anders geschrieben', () => {
    const liste = ['Sikafloor-264']
    expect(produktMerken(liste, 'sikafloor-264')).toBe(liste)
    expect(produktMerken(liste, '  Sikafloor-264  ')).toBe(liste)
  })

  it('ignoriert leere Eingaben', () => {
    const liste = ['Sikafloor-264']
    expect(produktMerken(liste, '   ')).toBe(liste)
  })
})
