/**
 * Alle Auswahllisten der App an einem Ort. Wer eine Liste ergänzen will,
 * ändert nur diese Datei – sonst nichts.
 */

/** Wert, der ein zusätzliches Bemerkungsfeld aufklappen lässt. */
export const SONSTIGES = 'Sonstiges'

export const UNTERGRUND_ARTEN = [
  'Zementestrich',
  'Calciumsulfatestrich (Anhydrit)',
  'Beton',
  'Gussasphalt',
  'Altbeschichtung',
  'Fliesen',
  'Holz',
  'Stahl',
  SONSTIGES,
] as const

export const UNTERGRUND_VORBEREITUNGEN = [
  'Kugelstrahlen',
  'Schleifen/Diamantschleifen',
  'Fräsen',
  'Absaugen',
  'Grundierung vorhanden',
  'Keine Vorbereitung',
  SONSTIGES,
] as const

/**
 * Prüfungen mit ihrer üblichen Einheit.
 *
 * Ein Vorschlag, keine Vorschrift: Wer etwas misst, das hier fehlt, wählt
 * „Sonstiges" und schreibt Bezeichnung und Einheit selbst. Die Liste steht in
 * der Reihenfolge, in der auf der Baustelle geprüft wird.
 */
export const PRUEFUNGEN = [
  { art: 'Haftzugfestigkeit', einheit: 'N/mm²' },
  { art: 'Rauhtiefe', einheit: 'mm' },
  { art: 'Restfeuchte (CM)', einheit: 'CM-%' },
  { art: 'LP-Gehalt', einheit: '%' },
  { art: 'Ausbreitmaß (Hägermanntisch)', einheit: 'mm' },
  { art: 'Schichtdicke', einheit: 'mm' },
] as const

/** Dieselben Prüfungen als reine Auswahlliste, mit „Sonstiges" am Ende. */
export const PRUEFUNGSARTEN = [...PRUEFUNGEN.map((eintrag) => eintrag.art), SONSTIGES] as const

/** Übliche Schichtbezeichnungen im Bodenaufbau – als Vorschlag, nicht als Zwang. */
export const SCHICHTEN = [
  'Grundierung',
  'Kratzspachtelung',
  'Ausgleichsschicht',
  'Verlaufsbeschichtung',
  'Deckversiegelung',
  'Einstreuung',
  'Hohlkehle',
  'Fugendichtstoff',
  SONSTIGES,
] as const

/** Funktionen der anwesenden Personen. */
export const FUNKTIONEN = [
  'AWT',
  'Vertrieb',
  'Bauleitung',
  'Verarbeiter',
  'Bauherr',
  'Architekt',
  SONSTIGES,
] as const

/** Vorbelegung der ersten Zeile in „Anwesende". */
export const EIGENE_FIRMA = 'Sika'
export const EIGENE_FUNKTION = 'AWT'
