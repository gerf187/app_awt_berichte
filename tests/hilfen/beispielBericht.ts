import sharp from 'sharp'
import { LEERE_EINSTELLUNGEN, neuerBericht } from '../../src/lib/bericht'
import { klimaBerechnen } from '../../src/lib/taupunkt'
import type { Bericht, Foto } from '../../src/lib/typen'

/**
 * Testdaten für die Ausgabe-Tests: der Bericht aus den Abnahmekriterien –
 * 2 Anwesende, 3 Klimawerte, 4 Aufbauzeilen, 6 Fotos.
 */

/** Ein Foto in der Größe, die die App nach dem Verkleinern erzeugt. */
export async function testFoto(farbe: string, beschreibung = 'Testaufnahme'): Promise<Foto> {
  const bild = await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: farbe },
  })
    .jpeg({ quality: 75 })
    .toBuffer()

  return {
    id: `foto-${farbe.replace('#', '')}`,
    dataUrl: `data:image/jpeg;base64,${bild.toString('base64')}`,
    beschreibung,
    aufgenommenAm: new Date(2026, 7, 25, 10, 0).toISOString(),
  }
}

export async function beispielBericht(): Promise<Bericht> {
  const bericht = neuerBericht('2026-08-25-01', LEERE_EINSTELLUNGEN, new Date(2026, 7, 25))

  bericht.kopf = {
    ...bericht.kopf,
    projekt: 'Neubau Produktionshalle Süd',
    objektStrasse: 'Industriestraße 12',
    objektOrt: '76185 Karlsruhe',
    kunde: 'Muster Bau AG',
    verarbeiter: 'Bodentechnik Meier GmbH',
    verarbeiterStrasse: 'Handwerkerweg 3',
    verarbeiterOrt: '76133 Karlsruhe',
    ansprechpartner: 'Herr Meier',
    telefon: '0721 123456',
    awt: 'Björn Esser',
    vertrieb: 'Frau Schulz',
    zweck: 'Begleitung der Grundierung und Prüfung der Untergrundvorbereitung.',
  }

  bericht.anwesende = [
    { name: 'Björn Esser', firma: 'Sika', funktion: 'AWT' },
    { name: 'Herr Meier', firma: 'Bodentechnik Meier GmbH', funktion: 'Bauleitung' },
  ]

  bericht.untergrund = {
    art: 'Zementestrich',
    vorbereitung: 'Kugelstrahlen',
    bemerkung: '',
    restfeuchteCM: '1,8',
    haftzugfestigkeit: '1,5',
  }

  bericht.klima = [
    { luft: 20, boden: 18, feuchte: 55 },
    { luft: 22, boden: 19, feuchte: 60 },
    // Diese Messung liegt zu dicht am Taupunkt – muss rot erscheinen.
    { luft: 18, boden: 12, feuchte: 75 },
  ].map((messung, nummer) => ({
    uhrzeit: `${String(8 + nummer).padStart(2, '0')}:00`,
    ...messung,
    ...klimaBerechnen(messung),
  }))

  bericht.aufbau = [
    {
      bereich: 'Halle Nord',
      schicht: 'Grundierung',
      produkt: 'Sikafloor-161',
      verbrauch: '0,4',
      charge: 'A12345',
      flaeche: '450',
    },
    {
      bereich: 'Halle Nord',
      schicht: 'Kratzspachtelung',
      produkt: 'Sikafloor-161 + Quarzsand',
      verbrauch: '1,2',
      charge: 'A12345',
      flaeche: '450',
    },
    {
      bereich: 'Halle Nord',
      schicht: 'Verlaufsbeschichtung',
      produkt: 'Sikafloor-264',
      verbrauch: '2,0',
      charge: 'B98765',
      flaeche: '450',
    },
    {
      bereich: 'Nassbereich',
      schicht: 'Hohlkehle',
      produkt: 'Sikadur-31 CF',
      verbrauch: '0,8',
      charge: 'C55512',
      flaeche: '35',
    },
  ]

  bericht.text = {
    ausgefuehrteArbeiten:
      'Der Untergrund wurde kugelgestrahlt und abgesaugt. Anschließend wurde die Grundierung aufgebracht.',
    besprochenes:
      'Mit der Bauleitung wurde vereinbart, dass die Verlaufsbeschichtung erst nach Freigabe der Klimawerte erfolgt.',
    maengel:
      'Im Nassbereich wurden zwei Risse festgestellt, die vor der Beschichtung zu schließen sind.',
    empfehlung:
      'Risse mit Sikadur-31 CF schließen. Vor Beschichtungsbeginn erneut Klimawerte messen; Abstand zum Taupunkt muss über 3 K liegen.',
    offeneFragen: 'Wer stellt die Bauheizung? Freigabe der Randanschlüsse steht noch aus.',
  }

  bericht.absender = {
    name: 'Björn Esser',
    funktion: 'Anwendungstechniker',
    firma: 'Sika Deutschland GmbH',
    strasse: 'Kornwestheimer Str. 103–107',
    ort: '70439 Stuttgart',
    telefon: '0171 9876543',
    email: 'esser.bjoern@example.de',
  }

  bericht.fotos = await Promise.all(
    ['#c0392b', '#27ae60', '#2980b9', '#f1c40f', '#8e44ad', '#7f8c8d'].map((farbe, nummer) =>
      testFoto(farbe, `Übersicht Bereich ${nummer + 1}`),
    ),
  )

  return bericht
}
