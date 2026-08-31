import { useId } from 'react'
import { Auswahlfeld, Textfeld } from '../../components/Felder'
import { Knopf } from '../../components/Knopf'
import { BRUCHBILDER, PRUEFUNGSARTEN, SONSTIGES } from '../../data/stammdaten'
import {
  messwertEingabe,
  mittelwertText,
  neuePruefung,
  neuerMesswert,
  standardEinheit,
  zahlAusEingabe,
} from '../../lib/pruefungen'
import type { Messwert, Pruefung } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

/**
 * Prüfungen auf der Baustelle.
 *
 * Aufgebaut wie „Anwesende": eine Karte je Prüfung, unten kommt eine dazu.
 * Innerhalb der Karte gilt dasselbe noch einmal für die Messwerte – beim
 * Haftzug sind drei die Regel, bei der Schichtdicke werden es schnell zehn.
 *
 * Jeder Messwert hat sein eigenes Bemerkungsfeld: 1,2 N/mm² mit Bruch im Beton
 * ist ein gutes Ergebnis, derselbe Wert mit Bruch im Prüfkleber ist gar keines.
 */
export function PruefungenBlatt({ bericht, aendern }: BlattEigenschaften) {
  // Eine Vorschlagsliste für alle Bemerkungsfelder des Blattes.
  const bruchbilder = useId()

  function aenderePruefung(id: string, teil: Partial<Pruefung>) {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: vorher.pruefungen.map((pruefung) =>
        pruefung.id === id ? { ...pruefung, ...teil } : pruefung,
      ),
    }))
  }

  /** Die Einheit folgt der gewählten Prüfung – außer sie wurde selbst gesetzt. */
  function setzeBezeichnung(bezeichnung: string, bisher: Pruefung) {
    const vorschlag = standardEinheit(bezeichnung)
    const einheitBleibt = bisher.einheit && bisher.einheit !== standardEinheit(bisher.bezeichnung)
    aenderePruefung(bisher.id, {
      bezeichnung,
      einheit: einheitBleibt ? bisher.einheit : vorschlag,
    })
  }

  function aendereMesswert(pruefung: Pruefung, messwertId: string, teil: Partial<Messwert>) {
    aenderePruefung(pruefung.id, {
      messwerte: pruefung.messwerte.map((messwert) =>
        messwert.id === messwertId ? { ...messwert, ...teil } : messwert,
      ),
    })
  }

  function messwertHinzufuegen(pruefung: Pruefung) {
    aenderePruefung(pruefung.id, { messwerte: [...pruefung.messwerte, neuerMesswert()] })
  }

  function messwertEntfernen(pruefung: Pruefung, messwertId: string) {
    const uebrig = pruefung.messwerte.filter((messwert) => messwert.id !== messwertId)
    // Eine Zeile bleibt stehen – ganz ohne Feld wäre die Karte eine Sackgasse.
    aenderePruefung(pruefung.id, { messwerte: uebrig.length > 0 ? uebrig : [neuerMesswert()] })
  }

  function hinzufuegen() {
    aendern((vorher) => ({ ...vorher, pruefungen: [...vorher.pruefungen, neuePruefung()] }))
  }

  function entfernen(id: string) {
    aendern((vorher) => ({
      ...vorher,
      pruefungen: vorher.pruefungen.filter((pruefung) => pruefung.id !== id),
    }))
  }

  return (
    <>
      {bericht.pruefungen.length === 0 && (
        <p className="text-sika-grau">
          Noch nichts geprüft. Nicht gemessene Werte tauchen im Bericht gar nicht erst auf.
        </p>
      )}

      {/* Freie Eingabe bleibt möglich – die Liste nimmt nur das Tippen ab. */}
      <datalist id={bruchbilder}>
        {BRUCHBILDER.map((bruchbild) => (
          <option key={bruchbild} value={bruchbild} />
        ))}
      </datalist>

      {bericht.pruefungen.map((pruefung, index) => {
        const mittel = mittelwertText(pruefung)
        const eigeneBezeichnung =
          pruefung.bezeichnung === SONSTIGES ||
          (pruefung.bezeichnung !== '' &&
            !PRUEFUNGSARTEN.includes(pruefung.bezeichnung as (typeof PRUEFUNGSARTEN)[number]))

        return (
          <div
            key={pruefung.id}
            className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sika-grau text-sm font-semibold">
                {pruefung.bezeichnung || `Prüfung ${index + 1}`}
              </span>
              <button
                type="button"
                onClick={() => entfernen(pruefung.id)}
                aria-label={`Prüfung ${index + 1} entfernen`}
                className="text-sika-grau active:text-sika-rot tippziel w-12 text-2xl"
              >
                🗑
              </button>
            </div>

            <Auswahlfeld
              beschriftung="Prüfung"
              optionen={PRUEFUNGSARTEN}
              value={
                PRUEFUNGSARTEN.includes(pruefung.bezeichnung as (typeof PRUEFUNGSARTEN)[number])
                  ? pruefung.bezeichnung
                  : pruefung.bezeichnung
                    ? SONSTIGES
                    : ''
              }
              onChange={(e) => setzeBezeichnung(e.target.value, pruefung)}
            />

            {/* Eigene Bezeichnung: alles, was nicht in der Liste steht. */}
            {eigeneBezeichnung && (
              <Textfeld
                beschriftung="Bezeichnung der Prüfung"
                placeholder="z. B. Gitterschnitt"
                value={pruefung.bezeichnung === SONSTIGES ? '' : pruefung.bezeichnung}
                onChange={(e) =>
                  aenderePruefung(pruefung.id, { bezeichnung: e.target.value || SONSTIGES })
                }
              />
            )}

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold">Messwerte</span>
              {pruefung.messwerte.map((messwert, stelle) => (
                <Messwertzeile
                  key={messwert.id}
                  nummer={stelle + 1}
                  messwert={messwert}
                  einheit={pruefung.einheit}
                  vorschlaege={bruchbilder}
                  aendere={(teil) => aendereMesswert(pruefung, messwert.id, teil)}
                  entferne={() => messwertEntfernen(pruefung, messwert.id)}
                />
              ))}
              <Knopf
                art="zweit"
                onClick={() => messwertHinzufuegen(pruefung)}
                className="self-start"
              >
                + Messwert
              </Knopf>

              {/* Wird gerechnet, nicht gespeichert – deshalb nur zum Lesen. */}
              <p className="text-sika-grau text-sm font-semibold">Mittelwert: {mittel || '–'}</p>
            </div>

            <Textfeld
              beschriftung="Einheit"
              placeholder="z. B. N/mm²"
              value={pruefung.einheit}
              onChange={(e) => aenderePruefung(pruefung.id, { einheit: e.target.value })}
            />

            <Textfeld
              beschriftung="Bemerkung zur Prüfung"
              placeholder="z. B. Messstelle Halle 1, Achse C"
              value={pruefung.bemerkung ?? ''}
              onChange={(e) => aenderePruefung(pruefung.id, { bemerkung: e.target.value })}
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

const FELD =
  'border-sika-schwarz/15 focus:border-sika-schwarz tippziel w-full rounded-xl border-2 bg-white px-4 py-3 text-lg'

type ZeilenEigenschaften = {
  nummer: number
  messwert: Messwert
  einheit: string
  /** Id der Vorschlagsliste für das Bruchbild. */
  vorschlaege: string
  aendere: (teil: Partial<Messwert>) => void
  entferne: () => void
}

/**
 * Eine Messwertzeile: Zahl und Bruchbild.
 *
 * Das Zahlenfeld zeigt den Wortlaut der Eingabe und meldet nach oben die
 * gelesene Zahl. Wer „1," getippt hat, soll das auch stehen sehen – und wer
 * „1.045" tippt, meint dieselbe Zahl wie mit Komma.
 */
function Messwertzeile({
  nummer,
  messwert,
  einheit,
  vorschlaege,
  aendere,
  entferne,
}: ZeilenEigenschaften) {
  return (
    <div className="bg-sika-schwarz/3 flex flex-col gap-2 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <span className="text-sika-grau w-6 shrink-0 text-sm font-semibold">{nummer}.</span>
        <input
          inputMode="decimal"
          aria-label={`Wert ${nummer}${einheit ? ` in ${einheit}` : ''}`}
          placeholder={einheit || 'Wert'}
          defaultValue={messwertEingabe(messwert.wert)}
          onChange={(e) => aendere({ wert: zahlAusEingabe(e.target.value) })}
          className={FELD}
        />
        <button
          type="button"
          onClick={entferne}
          aria-label={`Wert ${nummer} entfernen`}
          className="text-sika-grau active:text-sika-rot tippziel w-12 shrink-0 text-2xl"
        >
          ✕
        </button>
      </div>
      <input
        list={vorschlaege}
        aria-label={`Bruchbild zu Wert ${nummer}`}
        placeholder="Bruchbild / Bemerkung"
        value={messwert.bemerkung}
        onChange={(e) => aendere({ bemerkung: e.target.value })}
        className={FELD}
      />
    </div>
  )
}
