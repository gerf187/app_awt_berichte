import { Knopf } from '../../components/Knopf'
import { Textbereich, Textfeld } from '../../components/Felder'
import { Spracheingabe } from '../../components/Spracheingabe'
import type { BlattEigenschaften } from './liste'

export function ThematikBlatt({ bericht, aendern }: BlattEigenschaften) {
  function setzeZweck(wert: string) {
    aendern((vorher) => ({ ...vorher, kopf: { ...vorher.kopf, zweck: wert } }))
  }

  function setzeAnwesenden(index: number, feld: 'name' | 'firma' | 'funktion', wert: string) {
    aendern((vorher) => ({
      ...vorher,
      anwesende: vorher.anwesende.map((person, stelle) =>
        stelle === index ? { ...person, [feld]: wert } : person,
      ),
    }))
  }

  function hinzufuegen() {
    aendern((vorher) => ({
      ...vorher,
      anwesende: [...vorher.anwesende, { name: '', firma: '', funktion: '' }],
    }))
  }

  function entfernen(index: number) {
    aendern((vorher) => ({
      ...vorher,
      anwesende: vorher.anwesende.filter((_, stelle) => stelle !== index),
    }))
  }

  return (
    <>
      <Textbereich
        beschriftung="Zweck des Besuchs"
        hinweis="Warum waren Sie auf der Baustelle?"
        rows={4}
        value={bericht.kopf.zweck}
        onChange={(e) => setzeZweck(e.target.value)}
        nebenBeschriftung={
          <Spracheingabe
            anhaengen={(gesprochen) => {
              const bisher = bericht.kopf.zweck
              setzeZweck(bisher ? `${bisher.trimEnd()} ${gesprochen}` : gesprochen)
            }}
          />
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Anwesende</h2>

        {bericht.anwesende.length === 0 && (
          <p className="text-sika-grau">Noch niemand eingetragen.</p>
        )}

        {bericht.anwesende.map((person, index) => (
          <div
            key={index}
            className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sika-grau text-sm font-semibold">
                {index === 0 && person.name.trim() && person.name === bericht.absender.name
                  ? '👤 Aus deinem Profil'
                  : `Person ${index + 1}`}
              </span>
              <button
                type="button"
                onClick={() => entfernen(index)}
                aria-label={`Person ${index + 1} entfernen`}
                className="text-sika-grau active:text-sika-rot tippziel w-12 text-2xl"
              >
                🗑
              </button>
            </div>
            <Textfeld
              beschriftung="Name"
              value={person.name}
              onChange={(e) => setzeAnwesenden(index, 'name', e.target.value)}
            />
            <Textfeld
              beschriftung="Firma"
              value={person.firma}
              onChange={(e) => setzeAnwesenden(index, 'firma', e.target.value)}
            />
            <Textfeld
              beschriftung="Funktion"
              value={person.funktion}
              onChange={(e) => setzeAnwesenden(index, 'funktion', e.target.value)}
            />
          </div>
        ))}

        <Knopf art="zweit" breit onClick={hinzufuegen}>
          + Person
        </Knopf>
      </section>
    </>
  )
}
