import { useState } from 'react'
import { cleanDictation } from '../utils/cleanDictation'

/**
 * „Text glätten" unter einem Freitextfeld.
 *
 * Macht aus dem Wortstrom der Spracherkennung lesbaren Text: gesprochene
 * Satzzeichen, Absätze, Füllwörter, Satzanfänge. Das passiert **nie von
 * selbst** – auf der Baustelle diktierte Sätze sind manchmal genau so gemeint,
 * wie sie dastehen. Solange der geglättete Text unverändert im Feld steht,
 * führt derselbe Knopf zurück zum Original.
 *
 * Gerechnet wird im Gerät (`src/utils/cleanDictation.ts`), ohne Netzaufruf.
 */
export function TextGlaetten({
  wert,
  setzen,
}: {
  wert: string
  setzen: (text: string) => void
}) {
  const [gemerkt, setGemerkt] = useState<{ vorher: string; nachher: string } | null>(null)
  // Wer nach dem Glätten weiterschreibt, meint kein „Rückgängig" mehr.
  const geglaettet = gemerkt !== null && gemerkt.nachher === wert

  function glaetten() {
    const neu = cleanDictation(wert)
    setGemerkt({ vorher: wert, nachher: neu })
    setzen(neu)
  }

  function zurueck() {
    if (!gemerkt) return
    setzen(gemerkt.vorher)
    setGemerkt(null)
  }

  return (
    <button
      type="button"
      onClick={geglaettet ? zurueck : glaetten}
      disabled={!wert.trim()}
      className="text-sika-grau active:text-sika-schwarz tippziel self-start text-sm font-semibold underline disabled:opacity-40"
    >
      {geglaettet ? '↩ Rückgängig' : '✨ Text glätten'}
    </button>
  )
}
