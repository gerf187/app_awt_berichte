/**
 * Der Schichtaufbau – so weit er ohne Oberfläche zu beschreiben ist.
 *
 * Verbrauch und Gesamtmenge rechnet `verbrauch.ts`; hier stehen die
 * Komponenten und ihre Chargennummern.
 */

import type { Aufbauzeile } from './typen'
import { mengeAnzeigen, zahlLesen, zahlSchreiben } from './verbrauch'

/**
 * Name der Komponente an dieser Stelle: A, B, C, D …
 *
 * Reaktionsharze kommen als zwei- bis vierkomponentiges Gebinde auf die
 * Baustelle, und jede Komponente hat ihre eigene Chargennummer. Die Buchstaben
 * stehen so auf den Gebinden.
 */
export function komponentenName(index: number): string {
  return `Komp. ${String.fromCharCode(65 + index)}`
}

/**
 * Chargen für Bericht und Liste.
 * Eine Komponente steht ohne Buchstaben da – „Charge A" wäre dort albern.
 */
export function chargenText(chargen: string[]): string {
  const eingetragen = chargen.map((charge) => charge.trim())
  const gefuellt = eingetragen.filter(Boolean)
  if (gefuellt.length === 0) return ''
  if (gefuellt.length === 1 && eingetragen.length === 1) return gefuellt[0]
  return eingetragen
    .map((charge, index) => (charge ? `${komponentenName(index)} ${charge}` : ''))
    .filter(Boolean)
    .join(' · ')
}

/**
 * Die Mischungen einer Zeile für den Bericht:
 * „Sikafloor-264 (Verlaufsbeschichtung) – Mischung 1: 25 kg auf 60 m² · …".
 * Leer, wenn die Zeile keine hat.
 */
export function mischungenText(zeile: Aufbauzeile): string {
  const mischungen = zeile.mischungen ?? []
  if (mischungen.length === 0) return ''
  const einzeln = mischungen
    .map((mischung, stelle) => {
      const menge = zahlLesen(mischung.menge)
      const flaeche = zahlLesen(mischung.flaeche)
      const teile = [
        menge !== null ? mengeAnzeigen(menge) : '',
        flaeche !== null ? `${zahlSchreiben(flaeche)} m²` : '',
      ].filter(Boolean)
      return teile.length > 0 ? `Mischung ${stelle + 1}: ${teile.join(' auf ')}` : ''
    })
    .filter(Boolean)
  if (einzeln.length === 0) return ''

  const name = zeile.produkt.trim() || 'Ohne Produkt'
  const titel = zeile.schicht.trim() ? `${name} (${zeile.schicht.trim()})` : name
  return `${titel} – ${einzeln.join(' · ')}`
}
