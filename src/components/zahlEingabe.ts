import { useState } from 'react'
import { zahlAusEingabe, zeigtWert } from '../lib/zahlfeld'

/**
 * Führt ein Zahlenfeld über den getippten Wortlaut statt über die Zahl.
 *
 * `<input type="number" value={zahl}>` lässt sich nicht leeren: React
 * vergleicht den alten Feldinhalt lose mit der neuen Zahl, und „018" ist für
 * diesen Vergleich dasselbe wie 18 – das Feld wird also nicht aufgeräumt und
 * die führende Null bleibt stehen. Hier merkt sich das Feld deshalb, was
 * dasteht, meldet nach oben nur fertige Zahlen und räumt beim Verlassen auf.
 *
 * Das Ergebnis wird direkt auf das Feld gestreut: `<input {...eingabe} />`.
 */
export function useZahlEingabe(wert: number, aendern: (wert: number) => void) {
  const [text, setText] = useState(() => String(wert))
  const [gezeigt, setGezeigt] = useState(wert)

  // Kommt der Wert von außen (neue Messung, geladener Bericht), holt ihn das
  // Feld nach – aber nicht, während getippt wird.
  if (wert !== gezeigt) {
    setGezeigt(wert)
    if (!zeigtWert(text, wert)) setText(String(wert))
  }

  return {
    value: text,
    onChange(e: React.ChangeEvent<HTMLInputElement>) {
      setText(e.target.value)
      const zahl = zahlAusEingabe(e.target.value)
      if (zahl !== null) aendern(zahl)
    },
    onBlur() {
      // Leer gelassen oder „018" getippt: das Feld zeigt wieder den Wert,
      // der gespeichert ist.
      setText(String(wert))
    },
  }
}
