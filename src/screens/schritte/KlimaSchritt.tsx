import { Knopf } from '../../components/Knopf'
import { alsUhrzeit, kommazahl } from '../../lib/bericht'
import { MINDESTABSTAND_TAUPUNKT, klimaBerechnen } from '../../lib/taupunkt'
import type { Klimawert } from '../../lib/typen'
import type { SchrittEigenschaften } from './liste'

/** Startwerte einer neuen Messung – realistische Baustellenwerte, nicht null. */
const VORGABE = { luft: 20, boden: 18, feuchte: 55 }

/** Zahlenfeld für eine Messgröße. Getrennt gehalten, weil dreimal gebraucht. */
function Messfeld({
  beschriftung,
  einheit,
  wert,
  schritt = 0.5,
  aendern,
}: {
  beschriftung: string
  einheit: string
  wert: number
  schritt?: number
  aendern: (wert: number) => void
}) {
  return (
    <label className="flex flex-1 flex-col">
      <span className="mb-1 text-sm font-semibold">
        {beschriftung} <span className="text-sika-grau">({einheit})</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={schritt}
        value={wert}
        onChange={(e) => aendern(Number(e.target.value))}
        className="border-sika-schwarz/15 tippziel focus:border-sika-schwarz w-full rounded-xl border-2 bg-white px-3 py-3 text-lg"
      />
    </label>
  )
}

export function KlimaSchritt({ bericht, aendern }: SchrittEigenschaften) {
  function messungAendern(index: number, teil: Partial<Klimawert>) {
    aendern((vorher) => ({
      ...vorher,
      klima: vorher.klima.map((messung, stelle) => {
        if (stelle !== index) return messung
        const roh = { ...messung, ...teil }
        // Taupunkt, Abstand und Warnung immer neu rechnen – nie von Hand setzen.
        return { ...roh, ...klimaBerechnen(roh) }
      }),
    }))
  }

  function hinzufuegen() {
    aendern((vorher) => ({
      ...vorher,
      klima: [
        ...vorher.klima,
        { uhrzeit: alsUhrzeit(), ...VORGABE, ...klimaBerechnen(VORGABE) },
      ],
    }))
  }

  function entfernen(index: number) {
    aendern((vorher) => ({
      ...vorher,
      klima: vorher.klima.filter((_, stelle) => stelle !== index),
    }))
  }

  return (
    <>
      {bericht.klima.length === 0 && (
        <p className="text-sika-grau">
          Noch keine Messung. Mindestens eine Messung gehört in jeden Bericht.
        </p>
      )}

      {bericht.klima.map((messung, index) => (
        <section
          key={index}
          className={`flex flex-col gap-3 rounded-xl border-2 bg-white p-4 ${
            messung.warnung ? 'border-sika-rot' : 'border-sika-schwarz/10'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2">
              <span className="text-sm font-semibold">Uhrzeit</span>
              <input
                type="time"
                value={messung.uhrzeit}
                onChange={(e) => messungAendern(index, { uhrzeit: e.target.value })}
                className="border-sika-schwarz/15 tippziel focus:border-sika-schwarz rounded-xl border-2 px-3 py-2 text-lg"
              />
            </label>
            <button
              type="button"
              onClick={() => entfernen(index)}
              aria-label={`Messung ${index + 1} entfernen`}
              className="text-sika-grau active:text-sika-rot tippziel w-12 text-2xl"
            >
              🗑
            </button>
          </div>

          <div className="flex gap-3">
            <Messfeld
              beschriftung="Luft"
              einheit="°C"
              wert={messung.luft}
              aendern={(wert) => messungAendern(index, { luft: wert })}
            />
            <Messfeld
              beschriftung="Untergrund"
              einheit="°C"
              wert={messung.boden}
              aendern={(wert) => messungAendern(index, { boden: wert })}
            />
          </div>

          <Messfeld
            beschriftung="Relative Luftfeuchte"
            einheit="%"
            schritt={1}
            wert={messung.feuchte}
            aendern={(wert) => messungAendern(index, { feuchte: wert })}
          />

          <div className="bg-sika-hell flex justify-between rounded-xl p-3 text-lg">
            <span>
              Taupunkt: <strong>{kommazahl(messung.taupunkt)} °C</strong>
            </span>
            <span>
              Abstand: <strong>{kommazahl(messung.abstandTaupunkt)} K</strong>
            </span>
          </div>

          {messung.warnung && (
            <p role="alert" className="bg-sika-rot rounded-xl p-3 font-semibold text-white">
              Achtung: Abstand zum Taupunkt unter {MINDESTABSTAND_TAUPUNKT} K – Beschichtung
              nicht freigeben.
            </p>
          )}
        </section>
      ))}

      <Knopf art="zweit" breit onClick={hinzufuegen}>
        + Messung
      </Knopf>
    </>
  )
}
