/**
 * Erfundene Beispieldaten für die Anleitung.
 *
 * Bewusst **keine** echten Namen, Firmen oder Rufnummern: Die Anleitung wird
 * verteilt, und ein Handbuch ist kein Ort für Kundendaten (siehe
 * DATENSCHUTZ.md). Alles hier ist Muster.
 */

import sharp from 'sharp'
import { LEERE_EINSTELLUNGEN, neuerBericht } from '../src/lib/bericht'
import { klimaBerechnen } from '../src/lib/taupunkt'
import type { Bericht, Foto } from '../src/lib/typen'

const TAG = new Date(2026, 7, 26, 11, 30)

/** Ein Bild, das wie ein Baustellenfoto aussieht, ohne eines zu sein. */
async function musterFoto(id: string, beschreibung: string, ton: string): Promise<Foto> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <rect width="1600" height="1200" fill="${ton}"/>
    <rect y="820" width="1600" height="380" fill="#00000018"/>
    <rect x="0" y="815" width="1600" height="8" fill="#00000030"/>
    <circle cx="1180" cy="380" r="150" fill="#FFFFFF14"/>
    <text x="60" y="1130" font-family="Helvetica, Arial" font-size="56" fill="#FFFFFFCC">${beschreibung}</text>
  </svg>`
  const bild = await sharp(Buffer.from(svg)).jpeg({ quality: 75 }).toBuffer()

  return {
    id,
    dataUrl: `data:image/jpeg;base64,${bild.toString('base64')}`,
    beschreibung,
    aufgenommenAm: TAG.toISOString(),
  }
}

export async function demoBericht(): Promise<Bericht> {
  const bericht = neuerBericht('2026-08-26-01', LEERE_EINSTELLUNGEN, TAG)

  bericht.kopf = {
    ...bericht.kopf,
    projekt: 'Neubau Lagerhalle Ost',
    objektStrasse: 'Musterweg 8',
    objektOrt: '12345 Musterstadt',
    verarbeiter: 'Beispiel Bodenbau GmbH',
    verarbeiterStrasse: 'Handwerkerstraße 2',
    verarbeiterOrt: '12345 Musterstadt',
    ansprechpartner: 'Frau Beispiel',
    telefon: '01234 567890',
    awt: 'Max Muster',
    vertrieb: 'Erika Beispiel',
    zweck: 'Begleitung der Grundierung und Prüfung der Untergrundvorbereitung.',
  }

  bericht.anwesende = [
    { name: 'Max Muster', firma: 'Musterfirma GmbH', funktion: 'AWT' },
    { name: 'Frau Beispiel', firma: 'Beispiel Bodenbau GmbH', funktion: 'Bauleitung' },
  ]

  bericht.untergrund = {
    art: 'Zementestrich',
    vorbereitung: 'Kugelstrahlen',
    bemerkung: '',
  }

  bericht.pruefungen = [
    {
      art: 'Haftzugfestigkeit',
      einheit: 'N/mm²',
      werte: ['1,5', '1,7', '1,4'],
      bemerkung: 'Halle Nord, drei Messstellen',
    },
    { art: 'Rauhtiefe', einheit: 'mm', werte: ['0,6'], bemerkung: '' },
    { art: 'Restfeuchte (CM)', einheit: 'CM-%', werte: ['1,8', '2,1'], bemerkung: 'Torbereich' },
  ]

  // Die dritte Messung unterschreitet den Mindestabstand – so zeigt die
  // Anleitung die rote Warnung an einem echten Fall.
  bericht.klima = (
    [
      ['08:00', { luft: 20, boden: 18, feuchte: 55 }],
      ['09:30', { luft: 22, boden: 19, feuchte: 60 }],
      ['11:00', { luft: 18, boden: 12, feuchte: 75 }],
    ] as const
  ).map(([uhrzeit, messung]) => ({ uhrzeit, ...messung, ...klimaBerechnen(messung) }))

  bericht.aufbau = [
    {
      bereich: 'Halle Nord',
      schicht: 'Grundierung',
      produkt: 'Sikafloor-161',
      verbrauch: '0.4',
      gesamtmenge: '180',
      chargen: ['A12345', 'B67890'],
      flaeche: '450',
    },
    {
      bereich: 'Halle Nord',
      schicht: 'Verlaufsbeschichtung',
      produkt: 'Sikafloor-264',
      verbrauch: '2',
      gesamtmenge: '900',
      chargen: ['C24680'],
      flaeche: '450',
    },
  ]

  bericht.text = {
    ausgefuehrteArbeiten:
      'Der Untergrund wurde kugelgestrahlt und abgesaugt. Anschließend wurde die Grundierung aufgebracht.',
    besprochenes:
      'Mit der Bauleitung wurde vereinbart, dass die Verlaufsbeschichtung erst nach Freigabe der Klimawerte erfolgt.',
    maengel: 'Im Bereich der Hallentore stehen noch Restfeuchtewerte über 2,0 CM-% aus.',
    empfehlung: 'Vor der Deckschicht eine weitere CM-Messung am Tor durchführen.',
    offeneFragen: 'Wer stellt die Bautrockner für den Torbereich? Rückmeldung bis Freitag.',
  }

  bericht.fotos = [
    await musterFoto('foto-1', 'Beispielfoto: Halle Nord nach dem Kugelstrahlen', '#6E7B8B'),
    await musterFoto('foto-2', 'Beispielfoto: Torbereich mit Restfeuchte', '#8A7F6E'),
  ]

  bericht.absender = {
    name: 'Max Muster',
    funktion: 'Anwendungstechniker',
    firma: 'Musterfirma GmbH',
    strasse: 'Musterstraße 1',
    ort: '12345 Musterstadt',
    telefon: '01234 567-0',
    email: 'max.muster@musterfirma.example',
  }

  return bericht
}
