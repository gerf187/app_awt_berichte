import { useId, useState } from 'react'
import { Auswahlfeld, Textfeld } from '../../components/Felder'
import { Knopf } from '../../components/Knopf'
import { PRODUKTGRUPPEN, SCHICHTEN, SONSTIGES } from '../../data/stammdaten'
import { LEERE_AUFBAUZEILE } from '../../lib/bericht'
import { useGemerkteProdukte } from '../../lib/useGemerkteProdukte'
import {
  gesamtmengeRechnen,
  mengeAnzeigen,
  verbrauchAnzeigen,
  verbrauchLesen,
  verbrauchRechnen,
  verbrauchszeile,
  zahlLesen,
  zahlSchreiben,
} from '../../lib/verbrauch'
import type { Aufbauzeile } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

/**
 * Was gerade im Dialog steht.
 *
 * Verbrauch, Gesamtmenge und Fläche werden als getippter Text geführt, nicht
 * als Zahl: Wer „1," eingetippt hat, ist mitten im Wort – da darf ihm nichts
 * dazwischenrechnen. Erst beim Übernehmen wird umgerechnet und abgelegt.
 */
type Entwurf = {
  index: number
  zeile: Aufbauzeile
  verbrauch: string
  gesamtmenge: string
  flaeche: string
}

function entwurfAus(index: number, zeile: Aufbauzeile): Entwurf {
  return {
    index,
    zeile,
    verbrauch: zeile.verbrauch,
    gesamtmenge: zeile.gesamtmenge,
    flaeche: zeile.flaeche,
  }
}

export function AufbauBlatt({ bericht, aendern }: BlattEigenschaften) {
  const { produkte, merken } = useGemerkteProdukte()
  const produktListeId = useId()
  // Nur ein Filter für die Vorschlagsliste – gespeichert wird die Gruppe nicht.
  const [gruppe, setGruppe] = useState('')
  // Welche Zeile gerade bearbeitet wird; -1 heißt „neue Zeile".
  const [bearbeitet, setBearbeitet] = useState<Entwurf | null>(null)

  /** Der Bereich der Zeile davor – auf einer Baustelle meist derselbe. */
  const vorposition =
    bearbeitet &&
    (bearbeitet.index < 0
      ? bericht.aufbau[bericht.aufbau.length - 1]?.bereich
      : bericht.aufbau[bearbeitet.index - 1]?.bereich)

  const kgProM2 = bearbeitet ? verbrauchLesen(bearbeitet.verbrauch) : null
  const gesamtKg = bearbeitet ? zahlLesen(bearbeitet.gesamtmenge) : null

  function speichern() {
    if (!bearbeitet) return
    const { index } = bearbeitet
    const zeile: Aufbauzeile = {
      ...bearbeitet.zeile,
      flaeche: bearbeitet.flaeche.trim(),
      verbrauch: kgProM2 !== null ? zahlSchreiben(kgProM2, 3) : '',
      gesamtmenge: gesamtKg !== null ? zahlSchreiben(gesamtKg) : '',
    }

    aendern((vorher) => ({
      ...vorher,
      aufbau:
        index < 0
          ? [...vorher.aufbau, zeile]
          : vorher.aufbau.map((alt, stelle) => (stelle === index ? zeile : alt)),
    }))
    merken(zeile.produkt)
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

  /** Verbrauch getippt: die Gesamtmenge zieht nach, sobald die Fläche steht. */
  function setzeVerbrauch(text: string) {
    setBearbeitet((vorher) => {
      if (!vorher) return vorher
      const kg = verbrauchLesen(text)
      const flaeche = zahlLesen(vorher.flaeche)
      return {
        ...vorher,
        verbrauch: text,
        gesamtmenge:
          kg !== null && flaeche
            ? zahlSchreiben(gesamtmengeRechnen(kg, flaeche))
            : vorher.gesamtmenge,
      }
    })
  }

  /** Gesamtmenge getippt: der Verbrauch je m² wird daraus errechnet. */
  function setzeGesamtmenge(text: string) {
    setBearbeitet((vorher) => {
      if (!vorher) return vorher
      const gesamt = zahlLesen(text)
      const flaeche = zahlLesen(vorher.flaeche)
      const kg = gesamt !== null && flaeche ? verbrauchRechnen(gesamt, flaeche) : null
      return {
        ...vorher,
        gesamtmenge: text,
        verbrauch: kg !== null ? zahlSchreiben(kg, 3) : vorher.verbrauch,
      }
    })
  }

  /** Fläche geändert: der Verbrauch bleibt, die Gesamtmenge wird neu gerechnet. */
  function setzeFlaeche(text: string) {
    setBearbeitet((vorher) => {
      if (!vorher) return vorher
      const kg = verbrauchLesen(vorher.verbrauch)
      const flaeche = zahlLesen(text)
      return {
        ...vorher,
        flaeche: text,
        gesamtmenge:
          kg !== null && flaeche
            ? zahlSchreiben(gesamtmengeRechnen(kg, flaeche))
            : vorher.gesamtmenge,
      }
    })
  }

  const vorschlaege = produkte.filter((produkt) => {
    if (!gruppe) return true
    if (gruppe === SONSTIGES) {
      return !PRODUKTGRUPPEN.some(
        (name) => name !== SONSTIGES && produkt.toLowerCase().startsWith(name.toLowerCase()),
      )
    }
    return produkt.toLowerCase().startsWith(gruppe.toLowerCase())
  })

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
              onClick={() => setBearbeitet(entwurfAus(index, zeile))}
              className="active:bg-sika-hell flex-1 p-4 text-left"
            >
              <span className="block text-lg font-semibold">{zeile.produkt || 'Ohne Produkt'}</span>
              <span className="text-sika-grau mt-1 block text-sm">
                {[zeile.bereich, zeile.schicht].filter(Boolean).join(' · ') || 'Ohne Bereich'}
              </span>
              <span className="text-sika-grau mt-1 block text-sm">
                {[verbrauchszeile(zeile), zeile.charge && `Charge ${zeile.charge}`]
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

      <Knopf
        art="zweit"
        breit
        onClick={() => setBearbeitet(entwurfAus(-1, { ...LEERE_AUFBAUZEILE }))}
      >
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

            <div>
              <Textfeld
                beschriftung="Bereich"
                placeholder="z. B. Halle 1, gesamtes Bauvorhaben"
                value={bearbeitet.zeile.bereich}
                onChange={(e) => feld('bereich', e.target.value)}
              />
              {vorposition && vorposition !== bearbeitet.zeile.bereich && (
                <button
                  type="button"
                  onClick={() => feld('bereich', vorposition)}
                  className="border-sika-schwarz/15 active:bg-sika-hell mt-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold"
                >
                  wie Vorposition: {vorposition}
                </button>
              )}
            </div>

            <Auswahlfeld
              beschriftung="Schicht"
              optionen={SCHICHTEN}
              value={bearbeitet.zeile.schicht}
              onChange={(e) => feld('schicht', e.target.value)}
            />

            <Auswahlfeld
              beschriftung="Produktgruppe"
              hinweis="Grenzt nur die Vorschläge ein."
              optionen={PRODUKTGRUPPEN}
              platzhalter="Alle"
              value={gruppe}
              onChange={(e) => setGruppe(e.target.value)}
            />
            <Textfeld
              beschriftung="Produkt"
              hinweis={
                vorschlaege.length > 0
                  ? 'Eintragen oder aus den zuletzt benutzten wählen.'
                  : 'Eintragen – beim nächsten Mal steht das Produkt zur Auswahl.'
              }
              list={produktListeId}
              value={bearbeitet.zeile.produkt}
              onChange={(e) => feld('produkt', e.target.value)}
            />
            <datalist id={produktListeId}>
              {vorschlaege.map((produkt) => (
                <option key={produkt} value={produkt} />
              ))}
            </datalist>

            <Textfeld
              beschriftung="Fläche (m²)"
              inputMode="decimal"
              value={bearbeitet.flaeche}
              onChange={(e) => setzeFlaeche(e.target.value)}
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <Textfeld
                  beschriftung="Verbrauch"
                  hinweis="kg/m² oder g/m²"
                  inputMode="decimal"
                  value={bearbeitet.verbrauch}
                  onChange={(e) => setzeVerbrauch(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Textfeld
                  beschriftung="Gesamtmenge"
                  hinweis="kg"
                  inputMode="decimal"
                  value={bearbeitet.gesamtmenge}
                  onChange={(e) => setzeGesamtmenge(e.target.value)}
                />
              </div>
            </div>

            {/* Zeigt, wie die Eingabe verstanden wurde – die Einheit springt selbst um. */}
            {(kgProM2 !== null || gesamtKg !== null) && (
              <p className="text-sika-grau -mt-2 text-sm font-semibold">
                Im Bericht:{' '}
                {[
                  kgProM2 !== null ? verbrauchAnzeigen(kgProM2) : '',
                  gesamtKg !== null ? `gesamt ${mengeAnzeigen(gesamtKg)}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}

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
