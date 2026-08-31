import { describe, expect, it } from 'vitest'
import { LEERE_EINSTELLUNGEN, neuerBericht } from '../../lib/bericht'
import { neuePruefung, neuerMesswert } from '../../lib/pruefungen'
import { pdfMitProtokoll } from '../../lib/pdf'
import { beispielVorlage } from '../../../tests/hilfen/beispielVorlage'
import { CONTENT_BOTTOM, CONTENT_TOP_FIRST, CONTENT_TOP_NEXT } from '../layout'
import type { Bericht } from '../../lib/typen'

/**
 * Die Zonen des Briefbogens sind Sperrgebiet: oben Logo und
 * Gesprächspartner-Block, unten der Rechtsblock. Diese Prüfungen lesen das
 * Protokoll der Ausgabe – jeden Streifen, den der Bericht belegt hat – und
 * halten es gegen die vermessenen Grenzen.
 */

function kurzerBericht(): Bericht {
  const bericht = neuerBericht('2026-08-31-01', LEERE_EINSTELLUNGEN, new Date(2026, 7, 31))
  bericht.kopf = {
    ...bericht.kopf,
    projekt: 'Halle Ost',
    verarbeiter: 'Bodentechnik Meier GmbH',
    awt: 'Björn Esser',
  }
  bericht.anwesende = [
    { name: 'Björn Esser', firma: 'Sika', funktion: 'AWT' },
    { name: 'Herr Meier', firma: 'Bodentechnik Meier GmbH', funktion: 'Bauleitung' },
    { name: 'Frau Schulz', firma: 'Sika', funktion: 'Vertrieb' },
  ]
  bericht.text.besprochenes = 'Grundierung freigegeben.'
  return bericht
}

function langerBericht(): Bericht {
  const bericht = kurzerBericht()
  bericht.aufbau = Array.from({ length: 40 }, (_, nummer) => ({
    bereich: `Bereich ${nummer + 1}`,
    schicht: 'Verlaufsbeschichtung',
    produkt: 'Sikafloor-264',
    verbrauch: '2,0',
    gesamtmenge: '900',
    chargen: ['B98765'],
    flaeche: '450',
  }))
  // 3000 Zeichen Freitext – so lang, wie ein Diktat auf der Baustelle wird.
  bericht.text.ausgefuehrteArbeiten = 'Der Untergrund wurde kugelgestrahlt. '
    .repeat(81)
    .slice(0, 3000)
  return bericht
}

/** Eine Haftzugprüfung mit so vielen Werten, dass die Tabelle umbrechen muss. */
function vieleMesswerte(anzahl: number): Bericht {
  const bericht = kurzerBericht()
  bericht.pruefungen = [
    neuePruefung({
      bezeichnung: 'Haftzugfestigkeit',
      einheit: 'N/mm²',
      messwerte: Array.from({ length: anzahl }, (_, nummer) =>
        neuerMesswert({
          wert: 1 + (nummer % 7) / 10,
          bemerkung: nummer % 3 === 0 ? 'Bruch im Beton' : 'Bruch in der Kleberschicht',
        }),
      ),
      bemerkung: 'Halle Nord, Achse C',
    }),
  ]
  return bericht
}

describe('Satzspiegel der PDF-Ausgabe', () => {
  it('setzt einen kurzen Bericht auf genau eine Seite', async () => {
    const { seiten } = await pdfMitProtokoll(kurzerBericht())
    expect(seiten).toBe(1)
  })

  it('beginnt auf Seite 1 nicht oberhalb des Gesprächspartner-Blocks', async () => {
    const { protokoll } = await pdfMitProtokoll(langerBericht())
    const ersteSeite = protokoll.filter((eintrag) => eintrag.seite === 1)

    expect(ersteSeite.length).toBeGreaterThan(0)
    expect(Math.min(...ersteSeite.map((eintrag) => eintrag.y))).toBeGreaterThanOrEqual(
      CONTENT_TOP_FIRST,
    )
  })

  it('hält 40 Tabellenzeilen und 3000 Zeichen Freitext in den freien Zonen', async () => {
    const { protokoll, seiten } = await pdfMitProtokoll(langerBericht())

    expect(seiten).toBeGreaterThan(1)
    expect(protokoll.length).toBeGreaterThan(40)

    const oberhalb = protokoll.filter((eintrag) => eintrag.y < CONTENT_TOP_NEXT)
    const unterhalb = protokoll.filter((eintrag) => eintrag.y + eintrag.hoehe > CONTENT_BOTTOM)
    expect(oberhalb).toEqual([])
    expect(unterhalb).toEqual([])
  })

  it('bricht 25 Messwerte sauber um, ohne in Kopf- oder Fußzone zu geraten', async () => {
    const { protokoll, seiten } = await pdfMitProtokoll(vieleMesswerte(25))

    expect(seiten).toBeGreaterThan(1)
    // Die Werte laufen über mehrere Seiten, und auf jeder steht die Kopfzeile
    // der Tabelle wieder – ohne sie wüsste niemand, was in welcher Spalte steht.
    const seitenMitWerten = new Set(
      protokoll.filter((eintrag) => eintrag.was === 'tabelle-body').map((e) => e.seite),
    )
    const seitenMitKopf = new Set(
      protokoll.filter((eintrag) => eintrag.was === 'tabelle-head').map((e) => e.seite),
    )
    expect(seitenMitWerten.size).toBeGreaterThan(1)
    for (const seite of seitenMitWerten) expect(seitenMitKopf).toContain(seite)

    const raus = protokoll.filter(
      (eintrag) => eintrag.y < CONTENT_TOP_NEXT || eintrag.y + eintrag.hoehe > CONTENT_BOTTOM,
    )
    expect(raus).toEqual([])
  })

  it('lässt eine großzügig eingestellte Vorlage die Zonen nicht freigeben', async () => {
    // So liegt eine Vorlage in der Datenbank, die vor der Vermessung des
    // Briefbogens hinterlegt wurde: viel zu viel Platz nach oben wie nach unten.
    const vorlage = {
      ...(await beispielVorlage('pdf')),
      randOben: 60,
      randObenFolgeseiten: 40,
      randUnten: 35,
    }
    const { protokoll } = await pdfMitProtokoll(langerBericht(), vorlage)

    const raus = protokoll.filter(
      (eintrag) => eintrag.y < CONTENT_TOP_NEXT || eintrag.y + eintrag.hoehe > CONTENT_BOTTOM,
    )
    expect(raus).toEqual([])
  })

  it('bricht auch nach einem Seitenwechsel wieder unterhalb des Logos um', async () => {
    const { protokoll } = await pdfMitProtokoll(langerBericht())
    const folgeseiten = protokoll.filter((eintrag) => eintrag.seite > 1)

    expect(folgeseiten.length).toBeGreaterThan(0)
    expect(Math.min(...folgeseiten.map((eintrag) => eintrag.y))).toBeGreaterThanOrEqual(
      CONTENT_TOP_NEXT,
    )
  })
})
