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
 * Platzhalter-Produktliste. Der Nutzer kann sie in den Einstellungen
 * überschreiben; dann gilt seine Liste.
 */
export const PRODUKTE: string[] = [
  'Sikafloor-150',
  'Sikafloor-151',
  'Sikafloor-156',
  'Sikafloor-161',
  'Sikafloor-263 SL',
  'Sikafloor-264',
  'Sikafloor-266 CR',
  'Sikafloor-269 CR',
  'Sikafloor-315',
  'Sikafloor-316',
  'Sikafloor-325',
  'Sikafloor-330',
  'Sikafloor-390',
  'Sikafloor-2530 W',
  'Sikafloor-2540 W',
  'Sikagard-720 EpoCem',
  'Sika Level-30',
  'SikaCor-277',
  'Sikaflex-11 FC+',
  'Sikadur-31 CF',
]

/** Übliche Schichtbezeichnungen im Bodenaufbau – als Vorschlag, nicht als Zwang. */
export const SCHICHTEN = [
  'Grundierung',
  'Kratzspachtelung',
  'Ausgleichsschicht',
  'Verlaufsbeschichtung',
  'Deckversiegelung',
  'Einstreuung',
  'Hohlkehle',
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
