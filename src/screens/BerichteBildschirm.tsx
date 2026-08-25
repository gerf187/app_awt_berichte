import { useEffect, useMemo, useState } from 'react'
import type { Ansicht } from '../App'
import { Kopfzeile } from '../components/Kopfzeile'
import { Knopf } from '../components/Knopf'
import { alsAnzeigedatum } from '../lib/bericht'
import { alleBerichte, berichtLoeschen } from '../lib/db'
import type { Bericht } from '../lib/typen'

export function BerichteBildschirm({ zeige }: { zeige: (ansicht: Ansicht) => void }) {
  const [berichte, setBerichte] = useState<Bericht[]>([])
  const [geladen, setGeladen] = useState(false)
  const [suche, setSuche] = useState('')
  const [loeschKandidat, setLoeschKandidat] = useState<Bericht | null>(null)

  useEffect(() => {
    void alleBerichte().then((gefunden) => {
      setBerichte(gefunden)
      setGeladen(true)
    })
  }, [])

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase()
    if (!begriff) return berichte
    return berichte.filter((bericht) =>
      [
        bericht.kopf.projekt,
        bericht.kopf.objektOrt,
        bericht.kopf.kunde,
        bericht.kopf.verarbeiter,
        bericht.kopf.berichtsnummer,
      ]
        .join(' ')
        .toLowerCase()
        .includes(begriff),
    )
  }, [berichte, suche])

  async function loeschenBestaetigt(bericht: Bericht) {
    await berichtLoeschen(bericht.id)
    setBerichte((vorher) => vorher.filter((eintrag) => eintrag.id !== bericht.id))
    setLoeschKandidat(null)
  }

  return (
    <div className="flex flex-1 flex-col">
      <Kopfzeile titel="Meine Berichte" zurueck={() => zeige({ name: 'start' })} />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <input
          type="search"
          value={suche}
          onChange={(ereignis) => setSuche(ereignis.target.value)}
          placeholder="Suchen"
          aria-label="Berichte durchsuchen"
          className="border-sika-schwarz/15 tippziel focus:border-sika-schwarz w-full rounded-xl border-2 bg-white px-4 py-3 text-lg"
        />

        {!geladen && <p className="text-sika-grau">Wird geladen …</p>}

        {geladen && gefiltert.length === 0 && (
          <p className="text-sika-grau py-8 text-center">
            {berichte.length === 0
              ? 'Noch kein Bericht vorhanden.'
              : 'Kein Bericht passt zur Suche.'}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {gefiltert.map((bericht) => (
            <li
              key={bericht.id}
              className="border-sika-schwarz/10 flex items-stretch gap-2 overflow-hidden rounded-xl border-2 bg-white"
            >
              <button
                type="button"
                onClick={() => zeige({ name: 'bericht', id: bericht.id, schritt: 1 })}
                className="active:bg-sika-hell flex-1 p-4 text-left"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-3 w-3 shrink-0 rounded-full ${
                      bericht.status === 'Abgeschlossen' ? 'bg-sika-gruen' : 'bg-sika-grau'
                    }`}
                  />
                  <span className="truncate text-lg font-semibold">
                    {bericht.kopf.projekt || 'Ohne Bezeichnung'}
                  </span>
                </span>
                <span className="text-sika-grau mt-1 block text-sm">
                  {alsAnzeigedatum(bericht.kopf.datum)} · {bericht.kopf.berichtsnummer}
                  <span className="sr-only"> · Status: {bericht.status}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLoeschKandidat(bericht)}
                aria-label={`Bericht ${bericht.kopf.berichtsnummer} löschen`}
                className="text-sika-grau active:bg-sika-hell active:text-sika-rot w-14 shrink-0 text-2xl"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      </main>

      {loeschKandidat && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50 p-4" role="dialog" aria-modal>
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-5">
            <h2 className="text-xl font-bold">Bericht löschen?</h2>
            <p className="text-sika-grau mt-2">
              „{loeschKandidat.kopf.projekt || 'Ohne Bezeichnung'}" wird mit allen Fotos
              entfernt. Das lässt sich nicht rückgängig machen.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Knopf art="gefahr" breit onClick={() => void loeschenBestaetigt(loeschKandidat)}>
                Endgültig löschen
              </Knopf>
              <Knopf art="zweit" breit onClick={() => setLoeschKandidat(null)}>
                Abbrechen
              </Knopf>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
