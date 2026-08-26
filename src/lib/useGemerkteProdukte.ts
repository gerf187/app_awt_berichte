import { useCallback, useEffect, useState } from 'react'
import { produktMerken } from './bericht'
import { einstellungenLaden, produktSpeichern } from './db'

/**
 * Die Produkte, die auf diesem Gerät schon einmal eingetragen wurden.
 *
 * Es gibt bewusst keine mitgelieferte Liste: Sika führt rund 33.000 Produkte,
 * eine Auswahl davon wäre immer die falsche. Stattdessen wächst die Liste mit
 * dem, was der Kollege tatsächlich verarbeitet.
 */
export function useGemerkteProdukte(): { produkte: string[]; merken: (produkt: string) => void } {
  const [produkte, setProdukte] = useState<string[]>([])

  useEffect(() => {
    let abgebrochen = false
    void einstellungenLaden().then((einstellungen) => {
      if (!abgebrochen) setProdukte(einstellungen.gemerkteProdukte)
    })
    return () => {
      abgebrochen = true
    }
  }, [])

  const merken = useCallback((produkt: string) => {
    setProdukte((vorher) => produktMerken(vorher, produkt))
    void produktSpeichern(produkt)
  }, [])

  return { produkte, merken }
}
