/**
 * Was an Reiter und Kachel steht: ein Zeichen und ein kurzer Text.
 *
 * Bewusst ohne Oberfläche – so lässt sich die Regel einzeln prüfen. Die
 * Farbsprache ist die der App: Gelb heißt „fehlt noch" und hält niemanden auf,
 * Rot bleibt der Gefahr vorbehalten, heute dem unterschrittenen Taupunkt.
 */

import type { FehlendesPflichtfeld } from './bericht'
import type { Bericht, BlattId, BlattStand } from './typen'

export type Stand = { art: BlattStand; text: string }

/** „1 Foto" statt „1 Fotos". */
function mal(anzahl: number, ein: string, viele: string): string {
  return `${anzahl} ${anzahl === 1 ? ein : viele}`
}

/** Blätter mit Pflichtangaben: gelb, solange eine fehlt. */
function pflicht(id: BlattId, fehlt: FehlendesPflichtfeld[], fertig: () => string): Stand {
  const offen = fehlt.filter((eintrag) => eintrag.blatt === id)
  if (offen.length === 0) return { art: 'fertig', text: fertig() }
  return {
    art: 'fehlt',
    text: offen.length === 1 ? `${offen[0].feld} fehlt` : `${offen.length} Angaben fehlen`,
  }
}

export function blattStand(id: BlattId, bericht: Bericht, fehlt: FehlendesPflichtfeld[]): Stand {
  switch (id) {
    case 'kopf':
      return pflicht('kopf', fehlt, () => 'ausgefüllt')

    case 'thematik': {
      const anzahl = bericht.anwesende.filter((person) => person.name.trim()).length
      return {
        art: 'neutral',
        text: anzahl === 0 ? 'niemand eingetragen' : mal(anzahl, 'Person', 'Personen'),
      }
    }

    case 'untergrund':
      return { art: 'neutral', text: bericht.untergrund.art.trim() || 'noch leer' }

    case 'klima': {
      // Der Taupunkt sticht alles: hier stimmen die Daten, trotzdem ist Gefahr.
      const kritisch = bericht.klima.find((messung) => messung.warnung)
      if (kritisch) return { art: 'warnung', text: `Taupunkt ${kritisch.uhrzeit}` }
      return pflicht('klima', fehlt, () => mal(bericht.klima.length, 'Messung', 'Messungen'))
    }

    case 'aufbau':
      return {
        art: 'neutral',
        text:
          bericht.aufbau.length === 0 ? 'noch leer' : mal(bericht.aufbau.length, 'Zeile', 'Zeilen'),
      }

    case 'text':
      return pflicht('text', fehlt, () => {
        const anzahl = [
          bericht.text.ausgefuehrteArbeiten,
          bericht.text.besprochenes,
          bericht.text.maengel,
          bericht.text.empfehlung,
        ].filter((absatz) => absatz.trim()).length
        return mal(anzahl, 'Abschnitt', 'Abschnitte')
      })

    case 'fragen':
      return {
        art: 'neutral',
        text: bericht.text.offeneFragen.trim() ? 'notiert' : 'nichts offen',
      }

    case 'fotos':
      return {
        art: 'neutral',
        text: bericht.fotos.length === 0 ? 'kein Foto' : mal(bericht.fotos.length, 'Foto', 'Fotos'),
      }

    case 'abschluss':
      return {
        art: 'neutral',
        text: bericht.status === 'Abgeschlossen' ? 'abgeschlossen' : 'Entwurf',
      }
  }
}
