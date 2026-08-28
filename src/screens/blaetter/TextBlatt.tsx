import { Textbereich } from '../../components/Felder'
import { Spracheingabe } from '../../components/Spracheingabe'
import type { Berichtstext } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

const FELDER: { name: keyof Berichtstext; beschriftung: string; hinweis: string }[] = [
  {
    name: 'ausgefuehrteArbeiten',
    beschriftung: 'Ausgeführte Arbeiten',
    hinweis: 'Was wurde auf der Baustelle gemacht?',
  },
  {
    name: 'besprochenes',
    beschriftung: 'Besprochenes',
    hinweis: 'Was wurde mit wem vereinbart?',
  },
  {
    name: 'maengel',
    beschriftung: 'Mängel / Auffälligkeiten',
    hinweis: 'Was ist nicht in Ordnung?',
  },
  { name: 'empfehlung', beschriftung: 'Empfehlung', hinweis: 'Wie geht es weiter?' },
  {
    name: 'offeneFragen',
    beschriftung: 'Offene Fragen',
    hinweis: 'Was muss noch geklärt werden – und von wem?',
  },
]

export function TextBlatt({ bericht, aendern }: BlattEigenschaften) {
  function setze(name: keyof Berichtstext, wert: string) {
    aendern((vorher) => ({ ...vorher, text: { ...vorher.text, [name]: wert } }))
  }

  return (
    <>
      {FELDER.map((feld) => (
        <Textbereich
          key={feld.name}
          beschriftung={feld.beschriftung}
          hinweis={feld.hinweis}
          rows={5}
          value={bericht.text[feld.name]}
          onChange={(e) => setze(feld.name, e.target.value)}
          nebenBeschriftung={
            <Spracheingabe
              anhaengen={(gesprochen) => {
                const bisher = bericht.text[feld.name]
                setze(feld.name, bisher ? `${bisher.trimEnd()} ${gesprochen}` : gesprochen)
              }}
            />
          }
        />
      ))}
    </>
  )
}
