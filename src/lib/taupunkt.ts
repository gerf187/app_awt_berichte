/**
 * Taupunktberechnung nach der Magnus-Formel.
 *
 * Der Taupunkt entscheidet auf der Baustelle darüber, ob beschichtet werden
 * darf: Liegt die Untergrundtemperatur zu dicht am Taupunkt, schlägt sich
 * Feuchtigkeit nieder und die Beschichtung haftet nicht.
 */

const A = 17.62
const B = 243.12

/** Ab diesem Abstand (in Kelvin) gilt die Messung als unbedenklich. */
export const MINDESTABSTAND_TAUPUNKT = 3

/**
 * Taupunkt aus Lufttemperatur (°C) und relativer Luftfeuchte (%).
 * Ergebnis auf eine Nachkommastelle gerundet.
 */
export function taupunkt(luftTemperatur: number, relativeFeuchte: number): number {
  if (!Number.isFinite(luftTemperatur) || !Number.isFinite(relativeFeuchte)) return 0
  // Bei 0 % rF ist der Logarithmus nicht definiert; die Formel wird knapp
  // darüber abgeschnitten, statt NaN durch die halbe App zu reichen.
  const feuchte = Math.min(Math.max(relativeFeuchte, 0.01), 100)

  const alpha = (A * luftTemperatur) / (B + luftTemperatur) + Math.log(feuchte / 100)
  return runden((B * alpha) / (A - alpha))
}

/**
 * Abstand der Untergrundtemperatur zum Taupunkt in Kelvin.
 * Negativ heißt: der Untergrund ist kälter als der Taupunkt – es kondensiert.
 */
export function abstandZumTaupunkt(bodenTemperatur: number, taupunktWert: number): number {
  return runden(bodenTemperatur - taupunktWert)
}

/** true, wenn der Abstand den Mindestwert unterschreitet. */
export function istKritisch(abstand: number): boolean {
  return abstand < MINDESTABSTAND_TAUPUNKT
}

/**
 * Berechnet alle abgeleiteten Werte einer Klimamessung in einem Schritt.
 * Die Bildschirme rufen nur diese Funktion auf, damit Taupunkt, Abstand und
 * Warnung nie auseinanderlaufen können.
 */
export function klimaBerechnen(messung: { luft: number; boden: number; feuchte: number }): {
  taupunkt: number
  abstandTaupunkt: number
  warnung: boolean
} {
  const tp = taupunkt(messung.luft, messung.feuchte)
  const abstand = abstandZumTaupunkt(messung.boden, tp)
  return { taupunkt: tp, abstandTaupunkt: abstand, warnung: istKritisch(abstand) }
}

/** Auf eine Nachkommastelle runden, ohne -0 zurückzugeben. */
function runden(wert: number): number {
  const gerundet = Math.round(wert * 10) / 10
  return gerundet === 0 ? 0 : gerundet
}
