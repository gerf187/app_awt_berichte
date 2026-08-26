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
 * Produktgruppen statt Produktliste.
 *
 * Sika führt rund 33.000 Produkte – eine mitgelieferte Liste wäre in dem
 * Moment veraltet, in dem sie gebaut wird. Das Produkt wird deshalb im Bericht
 * getippt; die Gruppe hilft nur beim Filtern der schon einmal benutzten Namen.
 */
export const PRODUKTGRUPPEN = [
  'Sikafloor',
  'Sikagard',
  'Sikalastic',
  'SikaEpoCem',
  'Sikaflex',
  'Sikabond',
  SONSTIGES,
] as const

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
