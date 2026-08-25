/**
 * Anlegen und Prüfen von Berichten – reine Funktionen ohne Datenbank,
 * damit sie sich einzeln testen lassen.
 */

import { EIGENE_FIRMA, EIGENE_FUNKTION } from '../data/stammdaten'
import type { Bericht, Einstellungen } from './typen'

export const LEERE_EINSTELLUNGEN: Einstellungen = {
  eigenerName: '',
  eigeneEmail: '',
  standardVertrieb: '',
  standardEmpfaenger: '',
  produkte: [],
}

/** Datum als `JJJJ-MM-TT` in Ortszeit – nicht über toISOString(), das rechnet auf UTC um. */
export function alsDatumstext(datum: Date = new Date()): string {
  const jahr = datum.getFullYear()
  const monat = String(datum.getMonth() + 1).padStart(2, '0')
  const tag = String(datum.getDate()).padStart(2, '0')
  return `${jahr}-${monat}-${tag}`
}

/** `JJJJ-MM-TT` als `TT.MM.JJJJ` für die Anzeige. Unbekanntes bleibt unverändert. */
export function alsAnzeigedatum(datumstext: string): string {
  const teile = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datumstext)
  if (!teile) return datumstext
  return `${teile[3]}.${teile[2]}.${teile[1]}`
}

/** Zahl mit Komma statt Punkt – so schreibt man sie hierzulande. */
export function kommazahl(wert: number, stellen = 1): string {
  return wert.toFixed(stellen).replace('.', ',')
}

/** Uhrzeit als `HH:MM` in Ortszeit. */
export function alsUhrzeit(datum: Date = new Date()): string {
  const stunde = String(datum.getHours()).padStart(2, '0')
  const minute = String(datum.getMinutes()).padStart(2, '0')
  return `${stunde}:${minute}`
}

/**
 * Nächste Berichtsnummer für einen Tag: `JJJJ-MM-TT-NN`.
 * `NN` zählt die Berichte desselben Tages hoch – ermittelt aus den Nummern,
 * die schon auf dem Gerät liegen. Ohne Server, also ohne Kollisionsgefahr:
 * jedes Gerät vergibt seine eigenen Nummern.
 */
export function naechsteBerichtsnummer(vorhandene: string[], datum: Date = new Date()): string {
  const tag = alsDatumstext(datum)
  const hoechste = vorhandene
    .filter((nummer) => nummer.startsWith(`${tag}-`))
    .map((nummer) => Number.parseInt(nummer.slice(tag.length + 1), 10))
    .filter((zahl) => Number.isFinite(zahl))
    .reduce((groesste, zahl) => Math.max(groesste, zahl), 0)

  return `${tag}-${String(hoechste + 1).padStart(2, '0')}`
}

/**
 * Ein frischer Bericht, so weit wie möglich aus den Einstellungen vorbelegt.
 */
export function neuerBericht(
  berichtsnummer: string,
  einstellungen: Einstellungen = LEERE_EINSTELLUNGEN,
  jetzt: Date = new Date(),
): Bericht {
  const zeitstempel = jetzt.toISOString()

  return {
    id: neueId(),
    status: 'Entwurf',
    erstelltAm: zeitstempel,
    geaendertAm: zeitstempel,
    kopf: {
      berichtsnummer,
      datum: alsDatumstext(jetzt),
      projekt: '',
      objektStrasse: '',
      objektOrt: '',
      kunde: '',
      verarbeiter: '',
      verarbeiterStrasse: '',
      verarbeiterOrt: '',
      ansprechpartner: '',
      telefon: '',
      awt: einstellungen.eigenerName,
      vertrieb: einstellungen.standardVertrieb,
      zweck: '',
    },
    anwesende: [
      { name: einstellungen.eigenerName, firma: EIGENE_FIRMA, funktion: EIGENE_FUNKTION },
    ],
    untergrund: {
      art: '',
      vorbereitung: '',
      bemerkung: '',
      restfeuchteCM: '',
      haftzugfestigkeit: '',
    },
    klima: [],
    aufbau: [],
    text: {
      ausgefuehrteArbeiten: '',
      besprochenes: '',
      maengel: '',
      empfehlung: '',
    },
    fotos: [],
  }
}

/**
 * Übernimmt die wiederkehrenden Kopfdaten aus einem älteren Bericht.
 * Berichtsnummer und Datum bleiben beim neuen Bericht – alles andere
 * spart dem Kollegen das Abtippen beim zweiten Besuch derselben Baustelle.
 */
export function kopfUebernehmen(ziel: Bericht, vorlage: Bericht): Bericht {
  return {
    ...ziel,
    kopf: {
      ...vorlage.kopf,
      berichtsnummer: ziel.kopf.berichtsnummer,
      datum: ziel.kopf.datum,
      zweck: ziel.kopf.zweck,
    },
  }
}

export type FehlendesPflichtfeld = {
  feld: string
  /** Bildschirmnummer aus der Spezifikation, damit der Abschluss dorthin springen kann. */
  schritt: number
}

/**
 * Pflichtfelder prüfen. Fehlende Angaben blockieren nichts – sie werden
 * auf dem Abschlussbildschirm gelb angezeigt.
 */
export function fehlendePflichtfelder(bericht: Bericht): FehlendesPflichtfeld[] {
  const fehlt: FehlendesPflichtfeld[] = []
  const leer = (wert: string) => wert.trim().length === 0

  if (leer(bericht.kopf.datum)) fehlt.push({ feld: 'Datum', schritt: 3 })
  if (leer(bericht.kopf.projekt)) fehlt.push({ feld: 'Projekt / Bauvorhaben', schritt: 3 })
  if (leer(bericht.kopf.verarbeiter)) fehlt.push({ feld: 'Verarbeiter', schritt: 3 })
  if (leer(bericht.kopf.awt)) fehlt.push({ feld: 'Anwendungstechniker', schritt: 3 })
  if (bericht.klima.length === 0) fehlt.push({ feld: 'Mindestens eine Klimamessung', schritt: 6 })

  const hatText = Object.values(bericht.text).some((absatz) => absatz.trim().length > 0)
  if (!hatText) fehlt.push({ feld: 'Mindestens ein Textabschnitt', schritt: 8 })

  return fehlt
}

/** Eindeutige Id. `crypto.randomUUID` gibt es in allen Zielbrowsern. */
export function neueId(): string {
  return crypto.randomUUID()
}
