/**
 * Was an Reiter und Kachel steht: ein Zeichen und ein kurzer Text.
 *
 * Bewusst ohne Oberfläche – so lässt sich die Regel einzeln prüfen. Die
 * Farbsprache ist die der App: Gelb heißt „fehlt noch" und hält niemanden auf,
 * Rot bleibt der Gefahr vorbehalten, heute dem unterschrittenen Taupunkt.
 *
 * Grün heißt „hier steht etwas": Blätter ohne Pflichtangaben bekommen ihren
 * Haken, sobald etwas eingetragen ist. Wer auf den Abschluss schaut, sieht so
 * auf einen Blick, wo er schon war – und wo nicht.
 */

import type { FehlendesPflichtfeld } from './bericht'
import { ausgefuellte } from './pruefungen'
import type { Bericht, BlattId, BlattStand } from './typen'

export type Stand = { art: BlattStand; text: string }

/** „1 Foto" statt „1 Fotos". */
function mal(anzahl: number, ein: string, viele: string): string {
  return `${anzahl} ${anzahl === 1 ? ein : viele}`
}

/** Blätter ohne Pflichtangaben: Haken, sobald etwas drinsteht, sonst kein Zeichen. */
function frei(eingetragen: boolean, text: string): Stand {
  return { art: eingetragen ? 'fertig' : 'neutral', text }
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
      // Die erste Person setzt die App selbst aus dem Profil – das allein ist
      // noch kein ausgefülltes Blatt. Erst der Zweck oder ein Zweiter zählt.
      return frei(
        Boolean(bericht.kopf.zweck.trim()) || anzahl > 1,
        anzahl === 0 ? 'niemand eingetragen' : mal(anzahl, 'Person', 'Personen'),
      )
    }

    case 'untergrund':
      return frei(
        Boolean(bericht.untergrund.art.trim()),
        bericht.untergrund.art.trim() || 'noch leer',
      )

    case 'pruefungen': {
      const anzahl = ausgefuellte(bericht.pruefungen).length
      const sicht = bericht.sichtpruefung.ergebnis !== ''
      const teile = [
        sicht ? 'Sichtprüfung' : '',
        anzahl > 0 ? mal(anzahl, 'Prüfung', 'Prüfungen') : '',
      ].filter(Boolean)
      return frei(sicht || anzahl > 0, teile.join(' + ') || 'nichts geprüft')
    }

    case 'klima': {
      // Der Taupunkt sticht alles: hier stimmen die Daten, trotzdem ist Gefahr.
      const kritisch = bericht.klima.find((messung) => messung.warnung)
      if (kritisch) return { art: 'warnung', text: `Taupunkt ${kritisch.uhrzeit}` }
      return pflicht('klima', fehlt, () => mal(bericht.klima.length, 'Messung', 'Messungen'))
    }

    case 'aufbau':
      return frei(
        bericht.aufbau.length > 0,
        bericht.aufbau.length === 0 ? 'noch leer' : mal(bericht.aufbau.length, 'Zeile', 'Zeilen'),
      )

    case 'text':
      return pflicht('text', fehlt, () => {
        const anzahl = [
          bericht.text.ausgefuehrteArbeiten,
          bericht.text.besprochenes,
          bericht.text.maengel,
          bericht.text.empfehlung,
          bericht.text.offeneFragen,
        ].filter((absatz) => absatz.trim()).length
        return mal(anzahl, 'Abschnitt', 'Abschnitte')
      })

    case 'fotos':
      return frei(
        bericht.fotos.length > 0,
        bericht.fotos.length === 0 ? 'kein Foto' : mal(bericht.fotos.length, 'Foto', 'Fotos'),
      )

    case 'abschluss':
      return bericht.status === 'Abgeschlossen'
        ? { art: 'fertig', text: 'abgeschlossen' }
        : { art: 'neutral', text: 'Entwurf' }
  }
}
