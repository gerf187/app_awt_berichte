import { Textbereich } from '../../components/Felder'
import { Spracheingabe } from '../../components/Spracheingabe'
import type { BlattEigenschaften } from './liste'

/**
 * Was am Besuchstag nicht geklärt werden konnte.
 *
 * Bewusst ein eigenes Blatt: Auf der Baustelle fällt das über den Tag verteilt
 * an, und beim Diktieren soll niemand erst an vier anderen Feldern vorbei.
 */
export function OffeneFragenBlatt({ bericht, aendern }: BlattEigenschaften) {
  const wert = bericht.text.offeneFragen

  function setze(text: string) {
    aendern((vorher) => ({ ...vorher, text: { ...vorher.text, offeneFragen: text } }))
  }

  return (
    <>
      <Textbereich
        beschriftung="Offene Fragen"
        hinweis="Was muss noch geklärt werden – und von wem?"
        rows={8}
        value={wert}
        onChange={(e) => setze(e.target.value)}
        nebenBeschriftung={
          <Spracheingabe
            anhaengen={(gesprochen) => setze(wert ? `${wert.trimEnd()} ${gesprochen}` : gesprochen)}
          />
        }
      />
      <p className="text-sika-grau text-sm">
        Steht im fertigen Bericht als eigener Abschnitt. Bleibt das Feld leer, taucht der Abschnitt
        gar nicht erst auf.
      </p>
    </>
  )
}
