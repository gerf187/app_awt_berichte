import { Auswahlfeld, Textbereich } from '../../components/Felder'
import { SONSTIGES, UNTERGRUND_ARTEN, UNTERGRUND_VORBEREITUNGEN } from '../../data/stammdaten'
import type { Untergrund } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

export function UntergrundBlatt({ bericht, aendern, zeigeBlatt }: BlattEigenschaften) {
  function setze(feld: keyof Untergrund, wert: string) {
    aendern((vorher) => ({ ...vorher, untergrund: { ...vorher.untergrund, [feld]: wert } }))
  }

  // Das Bemerkungsfeld erscheint nur, wenn „Sonstiges" gewählt wurde –
  // dann ist es aber nötig, sonst steht im Bericht nichts Verwertbares.
  const brauchtBemerkung =
    bericht.untergrund.art === SONSTIGES || bericht.untergrund.vorbereitung === SONSTIGES

  return (
    <>
      <Auswahlfeld
        beschriftung="Art des Untergrunds"
        optionen={UNTERGRUND_ARTEN}
        value={bericht.untergrund.art}
        onChange={(e) => setze('art', e.target.value)}
      />

      <Auswahlfeld
        beschriftung="Untergrundvorbereitung"
        optionen={UNTERGRUND_VORBEREITUNGEN}
        value={bericht.untergrund.vorbereitung}
        onChange={(e) => setze('vorbereitung', e.target.value)}
      />

      {brauchtBemerkung && (
        <Textbereich
          beschriftung="Bemerkung zum Untergrund"
          hinweis={`Bitte ausfüllen, da „${SONSTIGES}“ gewählt wurde.`}
          rows={3}
          value={bericht.untergrund.bemerkung}
          onChange={(e) => setze('bemerkung', e.target.value)}
        />
      )}

      <button
        type="button"
        onClick={() => zeigeBlatt('pruefungen')}
        className="text-sika-grau tippziel text-left text-sm underline"
      >
        Gemessene Werte – Haftzug, Rauhtiefe, Restfeuchte – stehen im Blatt „Prüfungen" →
      </button>
    </>
  )
}
