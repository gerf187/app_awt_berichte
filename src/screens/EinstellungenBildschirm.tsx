import { useEffect, useRef, useState } from 'react'
import type { Ansicht } from '../App'
import { Knopf } from '../components/Knopf'
import { Kopfzeile } from '../components/Kopfzeile'
import { Textbereich, Textfeld } from '../components/Felder'
import { PRODUKTE } from '../data/stammdaten'
import { LEERE_EINSTELLUNGEN, alsDatumstext } from '../lib/bericht'
import {
  alleDatenSichern,
  datenWiederherstellen,
  einstellungenLaden,
  einstellungenSpeichern,
  istSicherung,
} from '../lib/db'
import type { Einstellungen } from '../lib/typen'

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
        <Textfeld
          beschriftung="Ihr Name"
          hinweis="Wird als Anwendungstechniker in neue Berichte übernommen."
          value={werte.eigenerName}
          onChange={(e) => aendern({ eigenerName: e.target.value })}
          autoComplete="name"
        />
        <Textfeld
          beschriftung="Ihre E-Mail-Adresse"
          type="email"
          inputMode="email"
          value={werte.eigeneEmail}
          onChange={(e) => aendern({ eigeneEmail: e.target.value })}
          autoComplete="email"
        />
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
