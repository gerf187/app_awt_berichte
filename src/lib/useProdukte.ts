import { useEffect, useState } from 'react'
import { PRODUKTE } from '../data/stammdaten'
import { einstellungenLaden } from './db'

/**
 * Die Produktliste für die Auswahlfelder: die eigene Liste aus den
 * Einstellungen, sonst die mitgelieferte.
 */
export function useProdukte(): string[] {
  const [produkte, setProdukte] = useState<string[]>(PRODUKTE)

  useEffect(() => {
    let abgebrochen = false
    void einstellungenLaden().then((einstellungen) => {
      if (abgebrochen) return
      if (einstellungen.produkte.length > 0) setProdukte(einstellungen.produkte)
    })
    return () => {
      abgebrochen = true
    }
  }, [])

  return produkte
}
