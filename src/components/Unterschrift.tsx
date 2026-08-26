import { useEffect, useRef, useState } from 'react'
import { Knopf } from './Knopf'

/**
 * Unterschriftenfeld für den Finger.
 *
 * Gezeichnet wird direkt auf ein Canvas; beim Loslassen wird der Stand als
 * PNG gespeichert. Optional – wer nicht unterschreiben lässt, klickt weiter.
 */
export function Unterschrift({
  vorhanden,
  setzen,
  loeschen,
}: {
  vorhanden?: string
  setzen: (dataUrl: string) => void
  loeschen: () => void
}) {
  const flaeche = useRef<HTMLCanvasElement>(null)
  const zeichnet = useRef(false)
  const [leer, setLeer] = useState(!vorhanden)

  // Vorhandene Unterschrift beim Öffnen wieder anzeigen.
  useEffect(() => {
    const canvas = flaeche.current
    if (!canvas) return

    // Auflösung an das Gerät anpassen, sonst wird der Strich kantig.
    const dichte = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * dichte
    canvas.height = canvas.clientHeight * dichte

    const stift = canvas.getContext('2d')
    if (!stift) return
    stift.scale(dichte, dichte)
    stift.lineWidth = 2.5
    stift.lineCap = 'round'
    stift.lineJoin = 'round'
    stift.strokeStyle = '#1a1a1a'

    if (vorhanden) {
      const bild = new Image()
      bild.onload = () => stift.drawImage(bild, 0, 0, canvas.clientWidth, canvas.clientHeight)
      bild.src = vorhanden
    }
  }, [vorhanden])

  function punkt(ereignis: React.PointerEvent<HTMLCanvasElement>) {
    const kasten = ereignis.currentTarget.getBoundingClientRect()
    return { x: ereignis.clientX - kasten.left, y: ereignis.clientY - kasten.top }
  }

  function beginnen(ereignis: React.PointerEvent<HTMLCanvasElement>) {
    const stift = flaeche.current?.getContext('2d')
    if (!stift) return
    ereignis.currentTarget.setPointerCapture(ereignis.pointerId)
    zeichnet.current = true
    const { x, y } = punkt(ereignis)
    stift.beginPath()
    stift.moveTo(x, y)
  }

  function ziehen(ereignis: React.PointerEvent<HTMLCanvasElement>) {
    if (!zeichnet.current) return
    const stift = flaeche.current?.getContext('2d')
    if (!stift) return
    const { x, y } = punkt(ereignis)
    stift.lineTo(x, y)
    stift.stroke()
    setLeer(false)
  }

  function beenden() {
    if (!zeichnet.current) return
    zeichnet.current = false
    const canvas = flaeche.current
    if (canvas && !leer) setzen(canvas.toDataURL('image/png'))
  }

  function leeren() {
    const canvas = flaeche.current
    const stift = canvas?.getContext('2d')
    if (canvas && stift) stift.clearRect(0, 0, canvas.width, canvas.height)
    setLeer(true)
    loeschen()
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={flaeche}
        onPointerDown={beginnen}
        onPointerMove={ziehen}
        onPointerUp={beenden}
        onPointerLeave={beenden}
        aria-label="Feld zum Unterschreiben"
        // touch-none: sonst scrollt die Seite beim Unterschreiben weg.
        className="border-sika-schwarz/20 h-28 w-full touch-none rounded-xl border-2 border-dashed bg-white"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sika-grau text-sm">
          {leer ? 'Mit dem Finger unterschreiben (optional).' : 'Unterschrift gespeichert.'}
        </span>
        <Knopf art="zweit" onClick={leeren} disabled={leer}>
          Löschen
        </Knopf>
      </div>
    </div>
  )
}
