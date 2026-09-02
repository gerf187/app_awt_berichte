/**
 * Was in einem Zahlenfeld getippt wurde – als Zahl oder als „noch nichts".
 *
 * Ein Feld, das immer eine Zahl zeigen muss, lässt sich nicht leeren: Wer die
 * 20 löscht, steht sofort wieder vor einer 0, tippt seine 18 dahinter und hat
 * „018". Deshalb darf die Eingabe zwischendurch leer sein – dann liefert diese
 * Funktion null, und der gespeicherte Wert bleibt, bis wieder eine Zahl da ist.
 *
 * Komma und Punkt gelten gleichermaßen: auf der Baustelle wird „18,5" getippt.
 */
export function zahlAusEingabe(roh: string): number | null {
  const text = roh.trim().replace(',', '.')
  if (text === '') return null
  const zahl = Number(text)
  return Number.isFinite(zahl) ? zahl : null
}

/**
 * Zeigt die Eingabe schon denselben Wert? Dann darf der Wortlaut stehen
 * bleiben – „18," ist auf dem Weg zu 18,5, und „018" korrigiert erst das
 * Verlassen des Feldes.
 */
export function zeigtWert(roh: string, wert: number): boolean {
  return zahlAusEingabe(roh) === wert
}
