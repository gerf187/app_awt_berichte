import { useCallback, useEffect, useRef, useState } from 'react'
import { berichtLaden, berichtSpeichern } from './db'
import type { Bericht } from './typen'

/** So lange wird nach der letzten Eingabe gewartet, bevor geschrieben wird. */
const WARTEZEIT_MS = 600

/** Bericht samt der Id, zu der er geladen wurde – so ist ein alter Stand erkennbar. */
type Stand = { id: string; bericht: Bericht | null }

/**
 * Lädt einen Bericht und speichert jede Änderung automatisch.
 *
 * Es gibt bewusst keinen Speichern-Knopf: auf der Baustelle geht die App
 * jederzeit in den Hintergrund. Deshalb wird zusätzlich sofort geschrieben,
 * wenn die Seite ausgeblendet oder der Bildschirm gewechselt wird.
 *
 * Der Name beginnt englisch mit „use", weil React eigene Haken (Hooks) an
 * diesem Vorsatz erkennt – alles andere in der App bleibt deutsch.
 */
export function useBericht(id: string) {
  const [stand, setStand] = useState<Stand | null>(null)

  // Der jeweils neueste, noch nicht geschriebene Stand.
  const offen = useRef<Bericht | null>(null)
  const uhr = useRef<ReturnType<typeof setTimeout> | null>(null)

  const jetztSchreiben = useCallback(() => {
    if (uhr.current) {
      clearTimeout(uhr.current)
      uhr.current = null
    }
    const zuSchreiben = offen.current
    offen.current = null
    if (zuSchreiben) void berichtSpeichern(zuSchreiben)
  }, [])

  useEffect(() => {
    let abgebrochen = false
    void berichtLaden(id).then((gefunden) => {
      if (!abgebrochen) setStand({ id, bericht: gefunden ?? null })
    })
    return () => {
      abgebrochen = true
    }
  }, [id])

  // Beim Verlassen der Seite (App in den Hintergrund, Tab schließen) sofort sichern.
  useEffect(() => {
    const beiWechsel = () => {
      if (document.visibilityState === 'hidden') jetztSchreiben()
    }
    document.addEventListener('visibilitychange', beiWechsel)
    window.addEventListener('pagehide', jetztSchreiben)
    return () => {
      document.removeEventListener('visibilitychange', beiWechsel)
      window.removeEventListener('pagehide', jetztSchreiben)
      jetztSchreiben()
    }
  }, [jetztSchreiben])

  /** Ändert den Bericht und stößt das verzögerte Speichern an. */
  const aendern = useCallback((veraenderung: (vorher: Bericht) => Bericht) => {
    setStand((vorher) => {
      if (!vorher?.bericht) return vorher
      const nachher = veraenderung(vorher.bericht)
      offen.current = nachher
      if (uhr.current) clearTimeout(uhr.current)
      uhr.current = setTimeout(() => {
        uhr.current = null
        const zuSchreiben = offen.current
        offen.current = null
        if (zuSchreiben) void berichtSpeichern(zuSchreiben)
      }, WARTEZEIT_MS)
      return { id: vorher.id, bericht: nachher }
    })
  }, [])

  // Solange der Stand zu einer anderen Id gehört, gilt der Bericht als nicht geladen.
  const geladen = stand?.id === id
  return { bericht: geladen ? stand.bericht : null, geladen, aendern, jetztSchreiben }
}
