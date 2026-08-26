import { useEffect, useState } from 'react'
import { Knopf } from '../../components/Knopf'
import { Textfeld } from '../../components/Felder'
import { alsAnzeigedatum, kopfUebernehmen } from '../../lib/bericht'
import { letzterBericht } from '../../lib/db'
import type { Bericht, Kopf } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

export function KopfdatenBlatt({ bericht, aendern }: BlattEigenschaften) {
  const [vorlage, setVorlage] = useState<Bericht | null>(null)
  const [uebernommen, setUebernommen] = useState(false)

  useEffect(() => {
    void letzterBericht(bericht.id).then((gefunden) => setVorlage(gefunden ?? null))
  }, [bericht.id])

  function setze(feld: keyof Kopf) {
    return (wert: string) =>
      aendern((vorher) => ({ ...vorher, kopf: { ...vorher.kopf, [feld]: wert } }))
  }

  return (
    <>
      {vorlage && (
        <div className="border-sika-schwarz/10 flex flex-col gap-2 rounded-xl border-2 bg-white p-4">
          <p className="text-sika-grau text-sm">
            Letzter Bericht: {vorlage.kopf.projekt || 'Ohne Bezeichnung'} vom{' '}
            {alsAnzeigedatum(vorlage.kopf.datum)}
          </p>
          <Knopf
            art="zweit"
            breit
            onClick={() => {
              aendern((vorher) => kopfUebernehmen(vorher, vorlage))
              setUebernommen(true)
            }}
          >
            Aus letztem Bericht übernehmen
          </Knopf>
          {uebernommen && (
            <p role="status" className="text-sika-gruen text-sm font-semibold">
              Daten übernommen. Bitte prüfen.
            </p>
          )}
        </div>
      )}

      <Textfeld
        beschriftung="Datum"
        type="date"
        value={bericht.kopf.datum}
        onChange={(e) => setze('datum')(e.target.value)}
      />
      <Textfeld
        beschriftung="Projekt / Bauvorhaben"
        value={bericht.kopf.projekt}
        onChange={(e) => setze('projekt')(e.target.value)}
      />
      <Textfeld
        beschriftung="Objekt: Straße und Nummer"
        value={bericht.kopf.objektStrasse}
        onChange={(e) => setze('objektStrasse')(e.target.value)}
        autoComplete="street-address"
      />
      <Textfeld
        beschriftung="Objekt: PLZ und Ort"
        value={bericht.kopf.objektOrt}
        onChange={(e) => setze('objektOrt')(e.target.value)}
      />
      <Textfeld
        beschriftung="Auftraggeber / Kunde"
        value={bericht.kopf.kunde}
        onChange={(e) => setze('kunde')(e.target.value)}
      />
      <Textfeld
        beschriftung="Verarbeiter (ausführende Firma)"
        value={bericht.kopf.verarbeiter}
        onChange={(e) => setze('verarbeiter')(e.target.value)}
      />
      <Textfeld
        beschriftung="Verarbeiter: Straße und Nummer"
        value={bericht.kopf.verarbeiterStrasse}
        onChange={(e) => setze('verarbeiterStrasse')(e.target.value)}
      />
      <Textfeld
        beschriftung="Verarbeiter: PLZ und Ort"
        value={bericht.kopf.verarbeiterOrt}
        onChange={(e) => setze('verarbeiterOrt')(e.target.value)}
      />
      <Textfeld
        beschriftung="Ansprechpartner vor Ort"
        value={bericht.kopf.ansprechpartner}
        onChange={(e) => setze('ansprechpartner')(e.target.value)}
      />
      <Textfeld
        beschriftung="Telefon"
        type="tel"
        inputMode="tel"
        value={bericht.kopf.telefon}
        onChange={(e) => setze('telefon')(e.target.value)}
        autoComplete="tel"
      />
      <Textfeld
        beschriftung="Anwendungstechniker (Sika)"
        value={bericht.kopf.awt}
        onChange={(e) => setze('awt')(e.target.value)}
      />
      <Textfeld
        beschriftung="Vertriebsmitarbeiter (Sika)"
        value={bericht.kopf.vertrieb}
        onChange={(e) => setze('vertrieb')(e.target.value)}
      />
    </>
  )
}
