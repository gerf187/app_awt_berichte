import { useId, useState } from 'react'
import { Auswahlfeld, Textfeld } from '../../components/Felder'
import { Knopf } from '../../components/Knopf'
import { SCHICHTEN } from '../../data/stammdaten'
import { chargenText, komponentenName } from '../../lib/aufbau'
import { LEERE_AUFBAUZEILE } from '../../lib/bericht'
import { useGemerkteProdukte } from '../../lib/useGemerkteProdukte'
import {
  gesamtmengeRechnen,
  mengeAnzeigen,
  mischungenSumme,
  verbrauchAnzeigen,
  verbrauchLesen,
  verbrauchRechnen,
  verbrauchszeile,
  zahlLesen,
  zahlSchreiben,
} from '../../lib/verbrauch'
import type { Aufbauzeile, Mischung } from '../../lib/typen'
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
  /** Leer heißt: Verbrauch, Menge und Fläche werden oben direkt getippt. */
  mischungen: Mischung[]
  /** Bereich und Fläche für die nächsten Zeilen feststellen. */
  fest: boolean
}

function entwurfAus(index: number, zeile: Aufbauzeile, fest: boolean): Entwurf {
  return {
    index,
    zeile,
    verbrauch: zeile.verbrauch,
    gesamtmenge: zeile.gesamtmenge,
    flaeche: zeile.flaeche,
    mischungen: zeile.mischungen ?? [],
    fest,
  }
}

/**
 * Fläche, Gesamtmenge und Verbrauch aus den Mischungen.
 *
 * Sind Mischungen erfasst, gelten nur noch sie: sonst stünde oben eine
 * getippte Fläche, die zu den Mischungen darunter nicht passt.
 */
function ausMischungen(entwurf: Entwurf, mischungen: Mischung[]): Entwurf {
  const summe = mischungenSumme(mischungen)
  const flaeche = summe?.flaecheM2 ?? null
  const menge = summe?.mengeKg ?? null
  return {
    ...entwurf,
    mischungen,
    flaeche: flaeche !== null ? zahlSchreiben(flaeche) : '',
    gesamtmenge: menge !== null ? zahlSchreiben(menge) : '',
    verbrauch: menge !== null && flaeche ? zahlSchreiben(verbrauchRechnen(menge, flaeche)!, 3) : '',
  }
}

export function AufbauBlatt({ bericht, aendern }: BlattEigenschaften) {
  const { produkte, merken } = useGemerkteProdukte()
  const produktListeId = useId()
  // Welche Zeile gerade bearbeitet wird; -1 heißt „neue Zeile".
  const [bearbeitet, setBearbeitet] = useState<Entwurf | null>(null)

  const fest = bericht.aufbauFest

  /** Eine neue Zeile beginnt auf der festgestellten Fläche. */
  function neueZeile() {
    setBearbeitet(
      entwurfAus(
        -1,
        {
          ...LEERE_AUFBAUZEILE,
          bereich: fest?.bereich ?? '',
          flaeche: fest?.flaeche ?? '',
        },
        Boolean(fest),
      ),
    )
  }

  /** Der Bereich der Zeile davor – auf einer Baustelle meist derselbe. */
  const vorposition =
    bearbeitet &&
    (bearbeitet.index < 0
      ? bericht.aufbau[bericht.aufbau.length - 1]?.bereich
      : bericht.aufbau[bearbeitet.index - 1]?.bereich)

  const kgProM2 = bearbeitet ? verbrauchLesen(bearbeitet.verbrauch) : null
  const mitMischungen = Boolean(bearbeitet && bearbeitet.mischungen.length > 0)
  const gesamtKg = bearbeitet ? zahlLesen(bearbeitet.gesamtmenge) : null

  /** Den Entwurf in den Bericht schreiben und die abgelegte Zeile zurückgeben. */
  function uebernehmen(): Aufbauzeile | null {
    if (!bearbeitet) return null
    const { index } = bearbeitet
    const zeile: Aufbauzeile = {
      ...bearbeitet.zeile,
      flaeche: bearbeitet.flaeche.trim(),
      verbrauch: kgProM2 !== null ? zahlSchreiben(kgProM2, 3) : '',
      gesamtmenge: gesamtKg !== null ? zahlSchreiben(gesamtKg) : '',
      chargen: bearbeitet.zeile.chargen.map((charge) => charge.trim()),
    }
    // Leere Mischungszeilen fallen weg; ganz ohne bleibt das Feld weg.
    const mischungen = bearbeitet.mischungen
      .map((mischung) => ({ menge: mischung.menge.trim(), flaeche: mischung.flaeche.trim() }))
      .filter((mischung) => mischung.menge || mischung.flaeche)
    if (mischungen.length > 0) zeile.mischungen = mischungen
    else delete zeile.mischungen

    aendern((vorher) => ({
      ...vorher,
      aufbau:
        index < 0
          ? [...vorher.aufbau, zeile]
          : vorher.aufbau.map((alt, stelle) => (stelle === index ? zeile : alt)),
      // Festgestellt heißt: Bereich und Fläche dieser Zeile stehen auch in der
      // nächsten schon drin. Grundierung, Kratzspachtelung, Beschichtung –
      // dieselbe Fläche, dreimal getippt wäre einmal zu viel.
      aufbauFest: bearbeitet.fest ? { bereich: zeile.bereich, flaeche: zeile.flaeche } : undefined,
    }))
    merken(zeile.produkt)
    return zeile
  }

  function speichern() {
    if (uebernehmen()) setBearbeitet(null)
  }

  /**
   * Weiterschreiben, ohne den Dialog zu verlassen.
   *
   * Ein Bodenaufbau wird am Stück diktiert – Grundierung, Kratzspachtelung,
   * Verlaufsbeschichtung. Wer dafür jedes Mal übernehmen, schließen und neu
   * öffnen muss, tippt Bereich und Fläche dreimal. Hier bleiben beide stehen
   * und nur die Schicht fängt von vorn an.
   */
  function naechsteSchicht() {
    const zeile = uebernehmen()
    if (!zeile) return
    setBearbeitet(
      entwurfAus(
        -1,
        { ...LEERE_AUFBAUZEILE, bereich: zeile.bereich, flaeche: zeile.flaeche },
        bearbeitet?.fest ?? false,
      ),
    )
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

  function setzeCharge(stelle: number, wert: string) {
    setBearbeitet((vorher) =>
      vorher
        ? {
            ...vorher,
            zeile: {
              ...vorher.zeile,
              chargen: vorher.zeile.chargen.map((alt, i) => (i === stelle ? wert : alt)),
            },
          }
        : vorher,
    )
  }

  function komponenteHinzufuegen() {
    setBearbeitet((vorher) =>
      vorher
        ? { ...vorher, zeile: { ...vorher.zeile, chargen: [...vorher.zeile.chargen, ''] } }
        : vorher,
    )
  }

  function komponenteEntfernen(stelle: number) {
    setBearbeitet((vorher) => {
      if (!vorher) return vorher
      const chargen = vorher.zeile.chargen.filter((_, i) => i !== stelle)
      return {
        ...vorher,
        zeile: { ...vorher.zeile, chargen: chargen.length > 0 ? chargen : [''] },
      }
    })
  }

  /**
   * Eine weitere Mischung. Meist wird dasselbe Gebinde angerührt – die Menge
   * der vorigen steht deshalb schon drin, nur die Fläche ist neu.
   */
  function mischungHinzufuegen() {
    setBearbeitet((vorher) => {
      if (!vorher) return vorher
      const letzte = vorher.mischungen[vorher.mischungen.length - 1]
      return ausMischungen(vorher, [
        ...vorher.mischungen,
        { menge: letzte?.menge ?? '', flaeche: '' },
      ])
    })
  }

  function setzeMischung(stelle: number, teil: Partial<Mischung>) {
    setBearbeitet((vorher) =>
      vorher
        ? ausMischungen(
            vorher,
            vorher.mischungen.map((alt, i) => (i === stelle ? { ...alt, ...teil } : alt)),
          )
        : vorher,
    )
  }

  function mischungEntfernen(stelle: number) {
    setBearbeitet((vorher) =>
      vorher
        ? ausMischungen(
            vorher,
            vorher.mischungen.filter((_, i) => i !== stelle),
          )
        : vorher,
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

  return (
    <>
      {/* Was festgestellt ist, steht oben – sonst wundert sich niemand mehr,
          warum in jeder neuen Zeile schon etwas drinsteht. */}
      {fest && (
        <div className="border-sika-gelb bg-sika-gelb/10 flex items-center gap-3 rounded-xl border-2 p-3">
          <span className="flex-1 text-sm font-semibold">
            Festgestellt:{' '}
            {[fest.bereich, fest.flaeche && `${fest.flaeche} m²`].filter(Boolean).join(' · ') ||
              'leer'}
          </span>
          <button
            type="button"
            onClick={() => aendern((vorher) => ({ ...vorher, aufbauFest: undefined }))}
            className="tippziel text-sm font-semibold underline"
          >
            aufheben
          </button>
        </div>
      )}

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
              onClick={() => setBearbeitet(entwurfAus(index, zeile, Boolean(fest)))}
              className="active:bg-sika-hell min-w-0 flex-1 p-4 text-left break-words"
            >
              <span className="block text-lg font-semibold">{zeile.produkt || 'Ohne Produkt'}</span>
              <span className="text-sika-grau mt-1 block text-sm">
                {[zeile.bereich, zeile.schicht].filter(Boolean).join(' · ') || 'Ohne Bereich'}
              </span>
              <span className="text-sika-grau mt-1 block text-sm">
                {[
                  verbrauchszeile(zeile),
                  zeile.mischungen?.length &&
                    (zeile.mischungen.length === 1
                      ? '1 Mischung'
                      : `${zeile.mischungen.length} Mischungen`),
                  chargenText(zeile.chargen) && `Charge ${chargenText(zeile.chargen)}`,
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

      <Knopf art="zweit" breit onClick={neueZeile}>
        + Aufbauzeile
      </Knopf>

      {bearbeitet && (
        <div
          className="unten-frei fixed inset-0 z-30 flex flex-col overflow-y-auto overscroll-contain bg-black/50 px-3 pt-3"
          role="dialog"
          aria-modal
          aria-label="Aufbauzeile bearbeiten"
        >
          {/* `mt-auto` statt `items-end`: hält den Dialog unten am Daumen und
              lässt ihn trotzdem ganz nach oben scrollen, wenn er höher ist als
              das Handy. */}
          <div className="mx-auto mt-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-4">
            <h2 className="text-xl font-bold">
              {bearbeitet.index < 0 ? 'Neue Aufbauzeile' : 'Aufbauzeile ändern'}
            </h2>
            {/* Nach „Nächste Schicht" steht der Dialog wieder leer da – ohne
                diese Zeile wüsste niemand, ob die vorige angekommen ist. */}
            {bearbeitet.index < 0 && bericht.aufbau.length > 0 && (
              <p className="text-sika-grau -mt-2 text-sm font-semibold">
                {bericht.aufbau.length === 1
                  ? '1 Zeile erfasst'
                  : `${bericht.aufbau.length} Zeilen erfasst`}
              </p>
            )}

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

            <Textfeld
              beschriftung="Produkt"
              hinweis={
                produkte.length > 0
                  ? 'Eintragen oder aus den zuletzt benutzten wählen.'
                  : 'Eintragen – beim nächsten Mal steht das Produkt zur Auswahl.'
              }
              list={produktListeId}
              value={bearbeitet.zeile.produkt}
              onChange={(e) => feld('produkt', e.target.value)}
            />
            <datalist id={produktListeId}>
              {produkte.map((produkt) => (
                <option key={produkt} value={produkt} />
              ))}
            </datalist>

            <Textfeld
              beschriftung="Fläche (m²)"
              hinweis={mitMischungen ? 'Summe der Mischungen' : undefined}
              inputMode="decimal"
              readOnly={mitMischungen}
              className={mitMischungen ? 'bg-sika-hell' : ''}
              value={bearbeitet.flaeche}
              onChange={(e) => setzeFlaeche(e.target.value)}
            />

            <label className="tippziel flex items-center gap-3">
              <input
                type="checkbox"
                className="h-6 w-6"
                checked={bearbeitet.fest}
                onChange={(e) =>
                  setBearbeitet((vorher) =>
                    vorher ? { ...vorher, fest: e.target.checked } : vorher,
                  )
                }
              />
              <span className="text-sm font-semibold">
                Bereich und Fläche feststellen – die nächste Zeile fängt damit an
              </span>
            </label>

            <div className="flex gap-3">
              <div className="flex-1">
                <Textfeld
                  beschriftung="Verbrauch"
                  hinweis={mitMischungen ? 'aus den Mischungen' : 'kg/m² oder g/m²'}
                  inputMode="decimal"
                  readOnly={mitMischungen}
                  className={mitMischungen ? 'bg-sika-hell' : ''}
                  value={bearbeitet.verbrauch}
                  onChange={(e) => setzeVerbrauch(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Textfeld
                  beschriftung="Gesamtmenge"
                  hinweis={mitMischungen ? 'Summe in kg' : 'kg'}
                  inputMode="decimal"
                  readOnly={mitMischungen}
                  className={mitMischungen ? 'bg-sika-hell' : ''}
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

            {/* Mischungen: wer Gebinde für Gebinde mitschreibt, bekommt am Ende
                den Verbrauch über alle ausgerechnet. */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Mischungen</span>
              {!mitMischungen && (
                <span className="text-sika-grau -mt-1 text-sm">
                  Freiwillig: je Mischung Menge und Fläche – Verbrauch und Gesamtmenge rechnet die
                  App dann über alle zusammen.
                </span>
              )}
              {bearbeitet.mischungen.map((mischung, stelle) => (
                <div key={stelle} className="flex items-end gap-2">
                  <span className="text-sika-grau w-8 shrink-0 pb-4 text-sm font-semibold">
                    {stelle + 1}.
                  </span>
                  <label className="flex-1">
                    <span className="text-sika-grau mb-1 block text-xs font-semibold">kg</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Menge Mischung ${stelle + 1} in kg`}
                      value={mischung.menge}
                      onChange={(e) => setzeMischung(stelle, { menge: e.target.value })}
                      className="border-sika-schwarz/15 focus:border-sika-schwarz tippziel w-full rounded-xl border-2 bg-white px-4 py-3 text-lg"
                    />
                  </label>
                  <label className="flex-1">
                    <span className="text-sika-grau mb-1 block text-xs font-semibold">m²</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Fläche Mischung ${stelle + 1} in m²`}
                      value={mischung.flaeche}
                      onChange={(e) => setzeMischung(stelle, { flaeche: e.target.value })}
                      className="border-sika-schwarz/15 focus:border-sika-schwarz tippziel w-full rounded-xl border-2 bg-white px-4 py-3 text-lg"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => mischungEntfernen(stelle)}
                    aria-label={`Mischung ${stelle + 1} entfernen`}
                    className="text-sika-grau active:text-sika-rot tippziel w-12 shrink-0 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Die Summe steht auch hier: die Felder oben sind beim Tippen
                  meist schon aus dem Bild gescrollt. */}
              {mitMischungen && (
                <p className="text-sika-grau text-sm font-semibold">
                  Gesamt:{' '}
                  {[
                    gesamtKg !== null ? mengeAnzeigen(gesamtKg) : 'Menge offen',
                    bearbeitet.flaeche && `${bearbeitet.flaeche} m²`,
                    kgProM2 !== null ? verbrauchAnzeigen(kgProM2) : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <Knopf art="zweit" onClick={mischungHinzufuegen} className="self-start">
                + Mischung
              </Knopf>
            </div>

            {/* Chargen: ein Feld je Komponente. Ein 3-K-Produkt hat drei Nummern,
                und im Schadensfall wird nach genau diesen gefragt. */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">
                {bearbeitet.zeile.chargen.length > 1 ? 'Chargen je Komponente' : 'Charge'}
              </span>
              {bearbeitet.zeile.chargen.map((charge, stelle) => (
                <div key={stelle} className="flex items-center gap-2">
                  {bearbeitet.zeile.chargen.length > 1 && (
                    <span className="text-sika-grau w-20 shrink-0 text-sm font-semibold">
                      {komponentenName(stelle)}
                    </span>
                  )}
                  <input
                    aria-label={
                      bearbeitet.zeile.chargen.length > 1
                        ? `Charge ${komponentenName(stelle)}`
                        : 'Charge'
                    }
                    value={charge}
                    onChange={(e) => setzeCharge(stelle, e.target.value)}
                    className="border-sika-schwarz/15 focus:border-sika-schwarz tippziel w-full rounded-xl border-2 bg-white px-4 py-3 text-lg"
                  />
                  {bearbeitet.zeile.chargen.length > 1 && (
                    <button
                      type="button"
                      onClick={() => komponenteEntfernen(stelle)}
                      aria-label={`${komponentenName(stelle)} entfernen`}
                      className="text-sika-grau active:text-sika-rot tippziel w-12 shrink-0 text-2xl"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <Knopf art="zweit" onClick={komponenteHinzufuegen} className="self-start">
                + Komponente
              </Knopf>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <Knopf art="haupt" breit onClick={speichern}>
                Übernehmen
              </Knopf>
              {/* Der zweite Weg: dieselbe Fläche, die nächste Schicht. */}
              <Knopf art="zweit" breit onClick={naechsteSchicht}>
                Nächste Schicht
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
