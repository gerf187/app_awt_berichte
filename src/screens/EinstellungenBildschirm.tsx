import { useEffect, useRef, useState } from 'react'
import type { Ansicht } from '../App'
import { Knopf } from '../components/Knopf'
import { Kopfzeile } from '../components/Kopfzeile'
import { Textbereich, Textfeld } from '../components/Felder'
import { EIGENE_FIRMA, EIGENE_FUNKTION, PRODUKTE } from '../data/stammdaten'
import { LEERE_EINSTELLUNGEN, alsDatumstext } from '../lib/bericht'
import {
  alleDatenSichern,
  datenWiederherstellen,
  einstellungenLaden,
  einstellungenSpeichern,
  istSicherung,
} from '../lib/db'
import type { Absender, Einstellungen } from '../lib/typen'

export function EinstellungenBildschirm({ zeige }: { zeige: (ansicht: Ansicht) => void }) {
  const [werte, setWerte] = useState<Einstellungen>(LEERE_EINSTELLUNGEN)
  const [geladen, setGeladen] = useState(false)
  const [meldung, setMeldung] = useState('')
  const dateiFeld = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void einstellungenLaden().then((gespeichert) => {
      setWerte(gespeichert)
      setGeladen(true)
    })
  }, [])

  function aendern(teil: Partial<Einstellungen>) {
    setWerte((vorher) => {
      const nachher = { ...vorher, ...teil }
      void einstellungenSpeichern(nachher)
      return nachher
    })
  }

  /** Einzelne Profilangabe ändern – der Rest des Profils bleibt stehen. */
  function aendernProfil(teil: Partial<Absender>) {
    setWerte((vorher) => {
      const nachher = { ...vorher, profil: { ...vorher.profil, ...teil } }
      void einstellungenSpeichern(nachher)
      return nachher
    })
  }

  async function sichern() {
    const sicherung = await alleDatenSichern()
    const datei = new Blob([JSON.stringify(sicherung)], { type: 'application/json' })
    const adresse = URL.createObjectURL(datei)
    const verweis = document.createElement('a')
    verweis.href = adresse
    verweis.download = `Baustellenberichte_Sicherung_${alsDatumstext()}.json`
    verweis.click()
    URL.revokeObjectURL(adresse)
    setMeldung(`${sicherung.berichte.length} Bericht(e) gesichert.`)
  }

  async function wiederherstellen(datei: File) {
    try {
      const inhalt: unknown = JSON.parse(await datei.text())
      if (!istSicherung(inhalt)) {
        setMeldung('Das ist keine Sicherungsdatei dieser App.')
        return
      }
      const anzahl = await datenWiederherstellen(inhalt)
      setWerte(await einstellungenLaden())
      setMeldung(`${anzahl} Bericht(e) wiederhergestellt.`)
    } catch {
      setMeldung('Die Datei konnte nicht gelesen werden.')
    }
  }

  if (!geladen) {
    return (
      <div className="flex flex-1 flex-col">
        <Kopfzeile titel="Einstellungen" zurueck={() => zeige({ name: 'start' })} />
        <p className="text-sika-grau p-4">Wird geladen …</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Kopfzeile titel="Einstellungen" zurueck={() => zeige({ name: 'start' })} />

      <main className="flex flex-1 flex-col gap-5 p-4">
        <section className="border-sika-schwarz/10 flex flex-col gap-4 rounded-xl border-2 bg-white p-4">
          <div>
            <h2 className="text-lg font-bold">Mein Profil</h2>
            <p className="text-sika-grau mt-1 text-sm">
              Steht in jedem neuen Bericht: als erste Zeile unter „Anwesende" und in der Adresszeile
              des Berichts. Ältere Berichte bleiben unverändert.
            </p>
          </div>

          <Textfeld
            beschriftung="Name"
            value={werte.profil.name}
            onChange={(e) => aendernProfil({ name: e.target.value })}
            autoComplete="name"
          />
          <Textfeld
            beschriftung="Funktion"
            placeholder={EIGENE_FUNKTION}
            value={werte.profil.funktion}
            onChange={(e) => aendernProfil({ funktion: e.target.value })}
          />
          <Textfeld
            beschriftung="Firma"
            placeholder={EIGENE_FIRMA}
            value={werte.profil.firma}
            onChange={(e) => aendernProfil({ firma: e.target.value })}
            autoComplete="organization"
          />
          <Textfeld
            beschriftung="Straße"
            value={werte.profil.strasse}
            onChange={(e) => aendernProfil({ strasse: e.target.value })}
            autoComplete="street-address"
          />
          <Textfeld
            beschriftung="PLZ und Ort"
            value={werte.profil.ort}
            onChange={(e) => aendernProfil({ ort: e.target.value })}
          />
          <Textfeld
            beschriftung="Telefon"
            type="tel"
            inputMode="tel"
            value={werte.profil.telefon}
            onChange={(e) => aendernProfil({ telefon: e.target.value })}
            autoComplete="tel"
          />
          <Textfeld
            beschriftung="E-Mail-Adresse"
            type="email"
            inputMode="email"
            value={werte.profil.email}
            onChange={(e) => aendernProfil({ email: e.target.value })}
            autoComplete="email"
          />
        </section>

        <Textfeld
          beschriftung="Standard-Vertriebskontakt"
          value={werte.standardVertrieb}
          onChange={(e) => aendern({ standardVertrieb: e.target.value })}
        />
        <Textfeld
          beschriftung="Standard-Empfänger für den Versand"
          type="email"
          inputMode="email"
          value={werte.standardEmpfaenger}
          onChange={(e) => aendern({ standardEmpfaenger: e.target.value })}
        />

        <Textbereich
          beschriftung="Eigene Produktliste"
          hinweis="Ein Produkt pro Zeile. Leer lassen, um die mitgelieferte Liste zu verwenden."
          rows={6}
          value={werte.produkte.join('\n')}
          onChange={(e) =>
            aendern({
              produkte: e.target.value
                .split('\n')
                .map((zeile) => zeile.trim())
                .filter(Boolean),
            })
          }
        />
        <p className="text-sika-grau -mt-3 text-sm">
          Mitgeliefert sind {PRODUKTE.length} Produkte.
        </p>

        <section className="border-sika-schwarz/10 mt-2 flex flex-col gap-3 rounded-xl border-2 bg-white p-4">
          <h2 className="text-lg font-bold">Datensicherung</h2>
          <p className="text-sika-grau text-sm">
            Alle Berichte liegen nur auf diesem Gerät. Sichern Sie sie regelmäßig.
          </p>
          <Knopf art="zweit" breit onClick={() => void sichern()}>
            Alle Daten sichern (JSON)
          </Knopf>
          <Knopf art="zweit" breit onClick={() => dateiFeld.current?.click()}>
            Daten wiederherstellen
          </Knopf>
          <input
            ref={dateiFeld}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const datei = e.target.files?.[0]
              e.target.value = ''
              if (datei) void wiederherstellen(datei)
            }}
          />
          {meldung && (
            <p role="status" className="font-semibold">
              {meldung}
            </p>
          )}
        </section>

        <p className="text-sika-grau pb-4 text-center text-sm">
          Die App sendet keine Daten. Alles bleibt auf dem Gerät.
        </p>
      </main>
    </div>
  )
}
