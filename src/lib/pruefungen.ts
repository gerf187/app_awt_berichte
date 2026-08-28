/**
 * Prüfungen auf der Baustelle: Haftzug, Rauhtiefe, Restfeuchte und was sonst
 * gemessen wird.
 *
 * Hier steht das Rechnen und das Formulieren – ohne Oberfläche, damit sich
 * beides einzeln prüfen lässt. Das Blatt zeigt nur an, was hier entsteht.
 */

import { PRUEFUNGEN } from '../data/stammdaten'
import type { Pruefung } from './typen'
import { zahlLesen, zahlSchreiben } from './verbrauch'

/** Eine frische Prüfung: eine Zeile für den ersten Wert steht schon bereit. */
export const LEERE_PRUEFUNG: Pruefung = { art: '', einheit: '', werte: [''], bemerkung: '' }

/** Die übliche Einheit einer Prüfung; für Unbekanntes bleibt sie leer. */
export function standardEinheit(art: string): string {
  return PRUEFUNGEN.find((eintrag) => eintrag.art === art)?.einheit ?? ''
}

/** Die Einzelwerte, soweit sie sich als Zahl lesen lassen. */
export function messwerte(pruefung: Pruefung): number[] {
  return pruefung.werte
    .map((wert) => zahlLesen(wert))
    .filter((wert): wert is number => wert !== null)
}

/**
 * Mittelwert der Messung. Erst ab zwei Werten – bei einem einzigen wäre er
 * nur eine Wiederholung, und beim Haftzug zählt genau dieser Durchschnitt.
 */
export function mittelwert(pruefung: Pruefung): number | null {
  const zahlen = messwerte(pruefung)
  if (zahlen.length < 2) return null
  return zahlen.reduce((summe, wert) => summe + wert, 0) / zahlen.length
}

/** Die Einzelwerte für Bericht und Liste: „1,5 · 1,7 · 1,6 N/mm²". */
export function werteText(pruefung: Pruefung): string {
  const werte = pruefung.werte.map((wert) => wert.trim()).filter(Boolean)
  if (werte.length === 0) return ''
  const einheit = pruefung.einheit.trim()
  return einheit ? `${werte.join(' · ')} ${einheit}` : werte.join(' · ')
}

/** Der Mittelwert als Text, mit Einheit. Leer, wenn es keinen gibt. */
export function mittelwertText(pruefung: Pruefung): string {
  const wert = mittelwert(pruefung)
  if (wert === null) return ''
  const einheit = pruefung.einheit.trim()
  return einheit ? `${zahlSchreiben(wert)} ${einheit}` : zahlSchreiben(wert)
}

/** Prüfungen, in denen wirklich etwas steht – leere Zeilen gehören in keinen Bericht. */
export function ausgefuellte(pruefungen: Pruefung[]): Pruefung[] {
  return pruefungen.filter((pruefung) => pruefung.art.trim() && werteText(pruefung))
}

/** Eine Prüfung aus fremder Quelle geradeziehen (Sicherungsdatei, alter Stand). */
export function pruefungAuffuellen(gespeichert: unknown): Pruefung {
  const alt = (gespeichert ?? {}) as Partial<Pruefung>
  const werte = Array.isArray(alt.werte) ? alt.werte.map((wert) => String(wert)) : []
  return {
    art: typeof alt.art === 'string' ? alt.art : '',
    einheit: typeof alt.einheit === 'string' ? alt.einheit : '',
    werte: werte.length > 0 ? werte : [''],
    bemerkung: typeof alt.bemerkung === 'string' ? alt.bemerkung : '',
  }
}
