import { Auswahlfeld, Textfeld } from '../../components/Felder'
import { Knopf } from '../../components/Knopf'
import { PRUEFUNGSARTEN, SONSTIGES } from '../../data/stammdaten'
import { LEERE_PRUEFUNG, mittelwertText, standardEinheit } from '../../lib/pruefungen'
import type { Pruefung } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

/**
 * Prüfungen auf der Baustelle.
 *
 * Aufgebaut wie „Anwesende": eine Karte je Prüfung, unten kommt eine dazu.
 * Innerhalb der Karte gilt dasselbe noch einmal für die Messwerte – beim
 * Haftzug sind drei die Regel, bei der Schichtdicke werden es schnell zehn.
 */
export function PruefungenBlatt({ bericht, aendern }: BlattEigenschaften) {
  function aenderePruefung(index: number, teil: Partial<Pruefung>) {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: vorher.pruefungen.map((pruefung, stelle) =>
        stelle === index ? { ...pruefung, ...teil } : pruefung,
      ),
    }))
  }

  /** Die Einheit folgt der gewählten Prüfung – außer sie wurde selbst gesetzt. */
  function setzeArt(index: number, art: string, bisher: Pruefung) {
    const vorschlag = standardEinheit(art)
    const einheitBleibt = bisher.einheit && bisher.einheit !== standardEinheit(bisher.art)
    aenderePruefung(index, { art, einheit: einheitBleibt ? bisher.einheit : vorschlag })
  }

  function setzeWert(index: number, stelle: number, wert: string) {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: vorher.pruefungen.map((pruefung, nummer) =>
        nummer === index
          ? { ...pruefung, werte: pruefung.werte.map((alt, i) => (i === stelle ? wert : alt)) }
          : pruefung,
      ),
    }))
  }

  function wertHinzufuegen(index: number) {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: vorher.pruefungen.map((pruefung, nummer) =>
        nummer === index ? { ...pruefung, werte: [...pruefung.werte, ''] } : pruefung,
      ),
    }))
  }

  function wertEntfernen(index: number, stelle: number) {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: vorher.pruefungen.map((pruefung, nummer) => {
        if (nummer !== index) return pruefung
        const werte = pruefung.werte.filter((_, i) => i !== stelle)
        // Eine Zeile bleibt stehen – ganz ohne Feld wäre die Karte eine Sackgasse.
        return { ...pruefung, werte: werte.length > 0 ? werte : [''] }
      }),
    }))
  }

  function hinzufuegen() {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: [...vorher.pruefungen, { ...LEERE_PRUEFUNG, werte: [''] }],
    }))
  }

  function entfernen(index: number) {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: vorher.pruefungen.filter((_, stelle) => stelle !== index),
    }))
  }

  return (
    <>
      {bericht.pruefungen.length === 0 && (
        <p className="text-sika-grau">
          Noch nichts geprüft. Nicht gemessene Werte tauchen im Bericht gar nicht erst auf.
        </p>
      )}

      {bericht.pruefungen.map((pruefung, index) => {
        const mittel = mittelwertText(pruefung)
        return (
          <div
            key={index}
            className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sika-grau text-sm font-semibold">
                {pruefung.art || `Prüfung ${index + 1}`}
              </span>
              <button
                type="button"
                onClick={() => entfernen(index)}
                aria-label={`Prüfung ${index + 1} entfernen`}
                className="text-sika-grau active:text-sika-rot tippziel w-12 text-2xl"
              >
                🗑
              </button>
            </div>

            <Auswahlfeld
              beschriftung="Prüfung"
              optionen={PRUEFUNGSARTEN}
              value={PRUEFUNGSARTEN.includes(pruefung.art as (typeof PRUEFUNGSARTEN)[number])
                ? pruefung.art
                : pruefung.art
                  ? SONSTIGES
                  : ''}
              onChange={(e) => setzeArt(index, e.target.value, pruefung)}
            />

            {/* Eigene Bezeichnung: alles, was nicht in der Liste steht. */}
            {(pruefung.art === SONSTIGES ||
              (pruefung.art !== '' &&
                !PRUEFUNGSARTEN.includes(pruefung.art as (typeof PRUEFUNGSARTEN)[number]))) && (
              <Textfeld
                beschriftung="Bezeichnung der Prüfung"
                placeholder="z. B. Gitterschnitt"
                value={pruefung.art === SONSTIGES ? '' : pruefung.art}
                onChange={(e) => aenderePruefung(index, { art: e.target.value || SONSTIGES })}
              />
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Messwerte</span>
              {pruefung.werte.map((wert, stelle) => (
                <div key={stelle} className="flex items-center gap-2">
                  <span className="text-sika-grau w-8 shrink-0 text-sm font-semibold">
                    {stelle + 1}.
                  </span>
                  <input
                    inputMode="decimal"
                    aria-label={`Wert ${stelle + 1}`}
                    value={wert}
                    onChange={(e) => setzeWert(index, stelle, e.target.value)}
                    className="border-sika-schwarz/15 focus:border-sika-schwarz tippziel w-full rounded-xl border-2 bg-white px-4 py-3 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => wertEntfernen(index, stelle)}
                    aria-label={`Wert ${stelle + 1} entfernen`}
                    className="text-sika-grau active:text-sika-rot tippziel w-12 shrink-0 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <Knopf art="zweit" onClick={() => wertHinzufuegen(index)} className="self-start">
                + Wert
              </Knopf>
            </div>

            <Textfeld
              beschriftung="Einheit"
              placeholder="z. B. N/mm²"
              value={pruefung.einheit}
              onChange={(e) => aenderePruefung(index, { einheit: e.target.value })}
            />

            {mittel && (
              <p className="text-sika-grau text-sm font-semibold">Mittelwert: {mittel}</p>
            )}

            <Textfeld
              beschriftung="Bemerkung"
              placeholder="z. B. Messstelle Halle 1, Achse C"
              value={pruefung.bemerkung}
              onChange={(e) => aenderePruefung(index, { bemerkung: e.target.value })}
            />
          </div>
        )
      })}

      <Knopf art="zweit" breit onClick={hinzufuegen}>
        + Prüfung
      </Knopf>
    </>
  )
}
