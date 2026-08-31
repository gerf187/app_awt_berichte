/**
 * Prüfungen auf der Baustelle: Haftzug, Rauhtiefe, Restfeuchte und was sonst
 * gemessen wird.
 *
 * Hier steht das Rechnen und das Formulieren – ohne Oberfläche, damit sich
 * beides einzeln prüfen lässt. Das Blatt zeigt nur an, was hier entsteht.
 */

import { PRUEFUNGEN } from '../data/stammdaten'
import { neueId } from './bericht'
import type { Messwert, Pruefung } from './typen'
import { zahlLesen, zahlSchreiben } from './verbrauch'

/** Nachkommastellen: Einzelwerte werden genau abgelesen, der Mittelwert gerundet. */
export const MESSWERT_STELLEN = 3
export const MITTELWERT_STELLEN = 2

/** Eine leere Messwertzeile. */
export function neuerMesswert(teil: Partial<Messwert> = {}): Messwert {
  return { id: neueId(), wert: null, bemerkung: '', ...teil }
}

/** Eine frische Prüfung: eine Zeile für den ersten Wert steht schon bereit. */
export function neuePruefung(teil: Partial<Pruefung> = {}): Pruefung {
  return {
    id: neueId(),
    bezeichnung: '',
    einheit: '',
    messwerte: [neuerMesswert()],
    bemerkung: '',
    ...teil,
  }
}

/** Die übliche Einheit einer Prüfung; für Unbekanntes bleibt sie leer. */
export function standardEinheit(bezeichnung: string): string {
  return PRUEFUNGEN.find((eintrag) => eintrag.art === bezeichnung)?.einheit ?? ''
}

/**
 * Eine getippte Zahl lesen – Komma und Punkt gelten gleichermaßen.
 * Auf dem Handy wird beides getippt, gemeint ist dasselbe.
 */
export function zahlAusEingabe(eingabe: string): number | null {
  return zahlLesen(eingabe)
}

/** Die Werte, die wirklich gemessen wurden – leere Zeilen zählen nicht mit. */
export function gemesseneWerte(pruefung: Pruefung): number[] {
  return pruefung.messwerte
    .map((messwert) => messwert.wert)
    .filter((wert): wert is number => wert !== null)
}

/** Mittelwert über alle abgelesenen Werte. `null`, solange keiner darunter ist. */
export function mittelwert(pruefung: Pruefung): number | null {
  const zahlen = gemesseneWerte(pruefung)
  if (zahlen.length === 0) return null
  return zahlen.reduce((summe, wert) => summe + wert, 0) / zahlen.length
}

/** Zahl mit deutschem Komma und fester Stellenzahl: 1.045 → „1,045". */
export function mitKomma(wert: number, stellen: number): string {
  return wert.toFixed(stellen).replace('.', ',')
}

/**
 * Ein Wert, wie er im Eingabefeld stehen soll: mit Komma, ohne angehängte
 * Nullen. Für die Ausgabe im Bericht gilt `messwertText` mit fester Stellenzahl.
 */
export function messwertEingabe(wert: number | null): string {
  return wert === null ? '' : zahlSchreiben(wert, MESSWERT_STELLEN)
}

/** Ein Einzelwert für die Ausgabe. Leer, wenn die Zeile leer ist. */
export function messwertText(wert: number | null): string {
  return wert === null ? '' : mitKomma(wert, MESSWERT_STELLEN)
}

/** Der Mittelwert als Text, mit Einheit. Leer, wenn es keinen gibt. */
export function mittelwertText(pruefung: Pruefung): string {
  const wert = mittelwert(pruefung)
  if (wert === null) return ''
  const zahl = mitKomma(wert, MITTELWERT_STELLEN)
  const einheit = pruefung.einheit.trim()
  return einheit ? `${zahl} ${einheit}` : zahl
}

/** Prüfungen, in denen wirklich etwas steht – leere Zeilen gehören in keinen Bericht. */
export function ausgefuellte(pruefungen: Pruefung[]): Pruefung[] {
  return pruefungen.filter(
    (pruefung) => pruefung.bezeichnung.trim() && gemesseneWerte(pruefung).length > 0,
  )
}

/**
 * Trennzeichen zwischen mehreren Werten in einem Feld – Semikolon und der
 * Mittelpunkt, mit dem frühere Berichte ihre Werte aufgereiht haben
 * („1,5 · 1,7"). Der Punkt fehlt hier mit Absicht: er trennt keine Werte,
 * sondern steht in ihnen.
 */
const TRENNER = /[;·|\n]/

/**
 * Eine Prüfung aus fremder Quelle geradeziehen (Sicherungsdatei, alter Stand).
 *
 * Berichte liegen so in der Datenbank, wie sie geschrieben wurden. Ältere
 * kennen weder Messwert-Bemerkungen noch Ids: dort stand `art` statt
 * `bezeichnung` und eine Liste getippter Zahlen statt der Messwerte. Beides
 * wird hier übersetzt – mehrfach angewendet kommt dasselbe heraus.
 */
export function pruefungAuffuellen(gespeichert: unknown): Pruefung {
  const alt = (gespeichert ?? {}) as Partial<Pruefung> & { art?: unknown; werte?: unknown }

  const bezeichnung =
    typeof alt.bezeichnung === 'string'
      ? alt.bezeichnung
      : typeof alt.art === 'string'
        ? alt.art
        : ''

  const messwerte = messwerteAuffuellen(alt.messwerte ?? alt.werte)

  return {
    id: typeof alt.id === 'string' && alt.id ? alt.id : neueId(),
    bezeichnung,
    einheit: typeof alt.einheit === 'string' ? alt.einheit : '',
    // Ohne Zeile wäre die Karte in der Eingabemaske eine Sackgasse.
    messwerte: messwerte.length > 0 ? messwerte : [neuerMesswert()],
    bemerkung: typeof alt.bemerkung === 'string' ? alt.bemerkung : '',
  }
}

/** Messwerte aus jedem Format, das je in der Datenbank stand. */
function messwerteAuffuellen(gespeichert: unknown): Messwert[] {
  // Ein einzelnes Feld mit mehreren Werten darin: „1,5; 1,7" oder „1,5 · 1,7".
  if (typeof gespeichert === 'string') return ausText(gespeichert)
  if (!Array.isArray(gespeichert)) return []

  return gespeichert.flatMap((eintrag): Messwert[] => {
    // Schon das neue Format – Id und Bemerkung bleiben erhalten.
    if (typeof eintrag === 'object' && eintrag !== null && 'wert' in eintrag) {
      const messwert = eintrag as Partial<Messwert>
      const gelesen = neuerMesswert({
        wert:
          typeof messwert.wert === 'number' && Number.isFinite(messwert.wert)
            ? messwert.wert
            : typeof messwert.wert === 'string'
              ? zahlAusEingabe(messwert.wert)
              : null,
        bemerkung: typeof messwert.bemerkung === 'string' ? messwert.bemerkung : '',
      })
      // Vorhandene Id behalten – nur so bleibt die Migration wiederholbar.
      if (typeof messwert.id === 'string' && messwert.id) gelesen.id = messwert.id
      return [gelesen]
    }
    if (typeof eintrag === 'number') {
      return [neuerMesswert({ wert: Number.isFinite(eintrag) ? eintrag : null })]
    }
    if (typeof eintrag === 'string') return ausText(eintrag)
    return []
  })
}

/** Ein getipptes Feld in Messwerte zerlegen. */
function ausText(text: string): Messwert[] {
  const teile = text
    .split(TRENNER)
    .map((teil) => teil.trim())
    .filter(Boolean)
  // Ein leeres Feld war eine leere Zeile und bleibt eine.
  if (teile.length === 0) return text.trim() ? [] : [neuerMesswert()]
  return teile.map((teil) => neuerMesswert({ wert: zahlAusEingabe(teil) }))
}
