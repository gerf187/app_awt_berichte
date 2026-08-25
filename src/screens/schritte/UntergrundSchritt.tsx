import { Auswahlfeld, Textbereich, Textfeld } from '../../components/Felder'
import { SONSTIGES, UNTERGRUND_ARTEN, UNTERGRUND_VORBEREITUNGEN } from '../../data/stammdaten'
import type { Untergrund } from '../../lib/typen'
import type { SchrittEigenschaften } from './liste'

export function UntergrundSchritt({ bericht, aendern }: SchrittEigenschaften) {
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

      <Textfeld
        beschriftung="Restfeuchte (CM-%)"
        inputMode="decimal"
        placeholder="z. B. 1,8"
        value={bericht.untergrund.restfeuchteCM}
        onChange={(e) => setze('restfeuchteCM', e.target.value)}
      />

      <Textfeld
        beschriftung="Haftzugfestigkeit (N/mm²)"
        inputMode="decimal"
        placeholder="z. B. 1,5"
        value={bericht.untergrund.haftzugfestigkeit}
        onChange={(e) => setze('haftzugfestigkeit', e.target.value)}
      />
    </>
  )
}
