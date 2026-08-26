import { useId, useState } from 'react'
import { Knopf } from '../../components/Knopf'
import { Auswahlfeld, Textfeld } from '../../components/Felder'
import { SCHICHTEN } from '../../data/stammdaten'
import { useProdukte } from '../../lib/useProdukte'
import type { Aufbauzeile } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

const LEERE_ZEILE: Aufbauzeile = {
  bereich: '',
  schicht: '',
  produkt: '',
  verbrauch: '',
  charge: '',
  flaeche: '',
}

export function AufbauBlatt({ bericht, aendern }: BlattEigenschaften) {
  const produkte = useProdukte()
  const produktListeId = useId()
  // Welche Zeile gerade im Dialog bearbeitet wird; -1 heißt „neue Zeile".
  const [bearbeitet, setBearbeitet] = useState<{ index: number; zeile: Aufbauzeile } | null>(null)

  function speichern() {
    if (!bearbeitet) return
    const { index, zeile } = bearbeitet
    aendern((vorher) => ({
      ...vorher,
      aufbau:
        index < 0
          ? [...vorher.aufbau, zeile]
          : vorher.aufbau.map((alt, stelle) => (stelle === index ? zeile : alt)),
    }))
    setBearbeitet(null)
  }

  function entfernen(index: number) {
    aendern((vorher) => ({
      ...vorher,
      aufbau: vorher.aufbau.filter((_, stelle) => stelle !== index),
    }))
  }

  function feld(name: keyof Aufbauzeile, wert: string) {
    setBearbeitet((vorher) =>
      vorher ? { ...vorher, zeile: { ...vorher.zeile, [name]: wert } } : vorher,
    )
  }

  return (
    <>
      {bericht.aufbau.length === 0 && (
        <p className="text-sika-grau">Noch keine Aufbauzeile erfasst.</p>
      )}

      <ul className="flex flex-col gap-3">
        {bericht.aufbau.map((zeile, index) => (
          <li
            key={index}
            className="border-sika-schwarz/10 flex items-stretch gap-2 overflow-hidden rounded-xl border-2 bg-white"
          >
            <button
              type="button"
              onClick={() => setBearbeitet({ index, zeile })}
              className="active:bg-sika-hell flex-1 p-4 text-left"
            >
              <span className="block text-lg font-semibold">{zeile.produkt || 'Ohne Produkt'}</span>
              <span className="text-sika-grau mt-1 block text-sm">
                {[zeile.bereich, zeile.schicht].filter(Boolean).join(' · ') || 'Ohne Bereich'}
              </span>
              <span className="text-sika-grau mt-1 block text-sm">
                {[
                  zeile.verbrauch && `${zeile.verbrauch} kg/m²`,
                  zeile.flaeche && `${zeile.flaeche} m²`,
                  zeile.charge && `Charge ${zeile.charge}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => entfernen(index)}
              aria-label={`Zeile ${index + 1} entfernen`}
              className="text-sika-grau active:bg-sika-hell active:text-sika-rot w-14 shrink-0 text-2xl"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      <Knopf art="zweit" breit onClick={() => setBearbeitet({ index: -1, zeile: LEERE_ZEILE })}>
        + Aufbauzeile
      </Knopf>

      {bearbeitet && (
        <div
          className="fixed inset-0 z-30 flex items-end overflow-y-auto bg-black/50 p-3"
          role="dialog"
          aria-modal
          aria-label="Aufbauzeile bearbeiten"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-4">
            <h2 className="text-xl font-bold">
              {bearbeitet.index < 0 ? 'Neue Aufbauzeile' : 'Aufbauzeile ändern'}
            </h2>

            <Textfeld
              beschriftung="Bereich"
              placeholder="z. B. Halle 1, Nassbereich"
              value={bearbeitet.zeile.bereich}
              onChange={(e) => feld('bereich', e.target.value)}
            />
            <Auswahlfeld
              beschriftung="Schicht"
              optionen={SCHICHTEN}
              value={bearbeitet.zeile.schicht}
              onChange={(e) => feld('schicht', e.target.value)}
            />
            <Textfeld
              beschriftung="Produkt"
              hinweis="Aus der Liste wählen oder frei eintragen."
              list={produktListeId}
              value={bearbeitet.zeile.produkt}
              onChange={(e) => feld('produkt', e.target.value)}
            />
            <datalist id={produktListeId}>
              {produkte.map((produkt) => (
                <option key={produkt} value={produkt} />
              ))}
            </datalist>

            <div className="flex gap-3">
              <div className="flex-1">
                <Textfeld
                  beschriftung="Verbrauch (kg/m²)"
                  inputMode="decimal"
                  value={bearbeitet.zeile.verbrauch}
                  onChange={(e) => feld('verbrauch', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Textfeld
                  beschriftung="Fläche (m²)"
                  inputMode="decimal"
                  value={bearbeitet.zeile.flaeche}
                  onChange={(e) => feld('flaeche', e.target.value)}
                />
              </div>
            </div>

            <Textfeld
              beschriftung="Charge"
              value={bearbeitet.zeile.charge}
              onChange={(e) => feld('charge', e.target.value)}
            />

            <div className="flex flex-col gap-3 pt-1">
              <Knopf art="haupt" breit onClick={speichern}>
                Übernehmen
              </Knopf>
              <Knopf art="zweit" breit onClick={() => setBearbeitet(null)}>
                Abbrechen
              </Knopf>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
