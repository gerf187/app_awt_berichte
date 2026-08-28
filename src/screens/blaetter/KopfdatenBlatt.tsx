import { Textfeld } from '../../components/Felder'
import type { Kopf } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

export function KopfdatenBlatt({ bericht, aendern }: BlattEigenschaften) {
  function setze(feld: keyof Kopf) {
    return (wert: string) =>
      aendern((vorher) => ({ ...vorher, kopf: { ...vorher.kopf, [feld]: wert } }))
  }

  return (
    <>
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
