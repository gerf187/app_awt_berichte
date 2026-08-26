/**
 * Anlegen und Prüfen von Berichten – reine Funktionen ohne Datenbank,
 * damit sie sich einzeln testen lassen.
 */

import { EIGENE_FIRMA, EIGENE_FUNKTION } from '../data/stammdaten'
import type { Absender, Bericht, BlattId, Berichtstext, Einstellungen } from './typen'

export const LEERES_PROFIL: Absender = {
  name: '',
  funktion: '',
  firma: '',
  strasse: '',
  ort: '',
  telefon: '',
  email: '',
}

export const LEERER_TEXT: Berichtstext = {
  ausgefuehrteArbeiten: '',
  besprochenes: '',
  maengel: '',
  empfehlung: '',
  offeneFragen: '',
}

export const LEERE_EINSTELLUNGEN: Einstellungen = {
  profil: LEERES_PROFIL,
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
      awt: einstellungen.profil.name,
      vertrieb: einstellungen.standardVertrieb,
      zweck: '',
    },
    anwesende: [
      {
        name: einstellungen.profil.name,
        firma: einstellungen.profil.firma || EIGENE_FIRMA,
        funktion: einstellungen.profil.funktion || EIGENE_FUNKTION,
      },
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
    text: { ...LEERER_TEXT },
    fotos: [],
    absender: { ...einstellungen.profil },
  }
}

/**
 * Ergänzt Felder, die es beim Speichern des Berichts noch nicht gab.
 *
 * Berichte liegen so in der Datenbank, wie sie geschrieben wurden – ein Bericht
 * von vorletzter Woche kennt „Offene Fragen" und die Absenderzeile nicht. Statt
 * die Datenbank umzuschreiben, wird beim Lesen aufgefüllt.
 */
export function berichtAuffuellen(bericht: Bericht): Bericht {
  return {
    ...bericht,
    text: { ...LEERER_TEXT, ...bericht.text },
    absender: { ...LEERES_PROFIL, ...bericht.absender },
  }
}

/** Dasselbe für die Einstellungen: vor dem Profil standen Name und Mail einzeln da. */
export function einstellungenAuffuellen(gespeichert: unknown): Einstellungen {
  const alt = (gespeichert ?? {}) as Partial<Einstellungen> & {
    eigenerName?: string
    eigeneEmail?: string
  }

  return {
    profil: {
      ...LEERES_PROFIL,
      name: alt.eigenerName ?? '',
      email: alt.eigeneEmail ?? '',
      ...alt.profil,
    },
    standardVertrieb: alt.standardVertrieb ?? '',
    standardEmpfaenger: alt.standardEmpfaenger ?? '',
    produkte: Array.isArray(alt.produkte) ? alt.produkte : [],
  }
}

/**
 * Die Absenderzeilen für PDF und Word. Leere Angaben fallen weg, damit keine
 * einsamen Kommas oder Trennpunkte im Bericht stehen.
 */
export function absenderzeilen(absender: Absender): string[] {
  const verbinde = (teile: string[], trenner: string) =>
    teile
      .map((teil) => teil.trim())
      .filter(Boolean)
      .join(trenner)

  return [
    verbinde([absender.name, absender.funktion], ' · '),
    absender.firma.trim(),
    verbinde([absender.strasse, absender.ort], ', '),
    verbinde([absender.telefon, absender.email], ' · '),
  ].filter(Boolean)
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
  /** Blatt, auf dem die Angabe steht – der Abschluss springt direkt dorthin. */
  blatt: BlattId
}

/**
 * Pflichtfelder prüfen. Fehlende Angaben blockieren nichts – sie werden
 * auf dem Abschlussbildschirm gelb angezeigt.
 */
export function fehlendePflichtfelder(bericht: Bericht): FehlendesPflichtfeld[] {
  const fehlt: FehlendesPflichtfeld[] = []
  const leer = (wert: string) => wert.trim().length === 0

  if (leer(bericht.kopf.datum)) fehlt.push({ feld: 'Datum', blatt: 'kopf' })
  if (leer(bericht.kopf.projekt)) fehlt.push({ feld: 'Projekt / Bauvorhaben', blatt: 'kopf' })
  if (leer(bericht.kopf.verarbeiter)) fehlt.push({ feld: 'Verarbeiter', blatt: 'kopf' })
  if (leer(bericht.kopf.awt)) fehlt.push({ feld: 'Anwendungstechniker', blatt: 'kopf' })
  if (bericht.klima.length === 0)
    fehlt.push({ feld: 'Mindestens eine Klimamessung', blatt: 'klima' })

  // „Offene Fragen" zählt hier bewusst nicht mit: das ist ein eigenes Blatt und
  // ersetzt keinen Bericht darüber, was auf der Baustelle passiert ist.
  const hatText = [
    bericht.text.ausgefuehrteArbeiten,
    bericht.text.besprochenes,
    bericht.text.maengel,
    bericht.text.empfehlung,
  ].some((absatz) => absatz.trim().length > 0)
  if (!hatText) fehlt.push({ feld: 'Mindestens ein Textabschnitt', blatt: 'text' })

  return fehlt
}

/** Eindeutige Id. `crypto.randomUUID` gibt es in allen Zielbrowsern. */
export function neueId(): string {
  return crypto.randomUUID()
}
