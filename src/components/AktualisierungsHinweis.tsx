import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Meldet dezent, wenn im Hintergrund eine neue Version geladen wurde.
 * Der Service Worker aktualisiert sich selbst (registerType: 'autoUpdate') –
 * der Hinweis sorgt nur dafür, dass der Nutzer die neue Version auch sieht.
 */
export function AktualisierungsHinweis() {
  const [neueVersion, setNeueVersion] = useState(false)
  // Die Neuladen-Funktion ist kein Anzeigezustand, sondern ein Griff auf den
  // Service Worker – sie gehört in eine Ref, nicht in den State.
  const neuLaden = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Im Entwicklungsmodus ist kein Service Worker registriert.
    if (!('serviceWorker' in navigator)) return

    const aktualisieren = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeueVersion(true)
      },
    })
    neuLaden.current = () => aktualisieren(true)
  }, [])

  if (!neueVersion) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3" role="status">
      <div className="bg-sika-schwarz mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-xl p-3 text-white shadow-lg">
        <span className="text-sm">Neue Version verfügbar.</span>
        <button
          type="button"
          onClick={() => neuLaden.current?.()}
          className="bg-sika-gelb text-sika-schwarz tippziel rounded-lg px-4 font-semibold"
        >
          Neu laden
        </button>
      </div>
    </div>
  )
}
