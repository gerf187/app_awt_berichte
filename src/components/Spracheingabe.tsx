import { useEffect, useRef, useState } from 'react'

/**
 * Diktiertaste für die Freitextfelder.
 *
 * Die Spracherkennung ist Sache des Browsers (Web Speech API). Safari und
 * Chrome führen sie unterschiedlich – deshalb nur die Felder beschreiben, die
 * wir wirklich benutzen, statt auf browserweite Typen zu hoffen.
 *
 * Achtung: Die Erkennung läuft je nach Browser über dessen Server. Sie wird
 * ausschließlich auf Knopfdruck gestartet und läuft nie im Hintergrund.
 */
type Erkennung = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((ereignis: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type MitErkennung = {
  SpeechRecognition?: new () => Erkennung
  webkitSpeechRecognition?: new () => Erkennung
}

function erkennungBauen(): Erkennung | null {
  const fenster = window as unknown as MitErkennung
  const Bauplan = fenster.SpeechRecognition ?? fenster.webkitSpeechRecognition
  return Bauplan ? new Bauplan() : null
}

export function Spracheingabe({ anhaengen }: { anhaengen: (text: string) => void }) {
  // Einmal beim ersten Rendern prüfen – der Browser kann es oder eben nicht.
  const [moeglich] = useState(() => erkennungBauen() !== null)
  const [laeuft, setLaeuft] = useState(false)
  const erkennung = useRef<Erkennung | null>(null)

  // Läuft noch eine Aufnahme, wenn der Bildschirm wechselt: abschalten.
  useEffect(() => () => erkennung.current?.stop(), [])

  // Kann der Browser es nicht, verschwindet die Taste – keine toten Knöpfe.
  if (!moeglich) return null

  function umschalten() {
    if (laeuft) {
      erkennung.current?.stop()
      return
    }

    const neu = erkennungBauen()
    if (!neu) return

    neu.lang = 'de-DE'
    neu.continuous = true
    neu.interimResults = false
    neu.onresult = (ereignis) => {
      let text = ''
      for (let i = 0; i < ereignis.results.length; i++) {
        text += ereignis.results[i][0].transcript
      }
      anhaengen(text.trim())
    }
    neu.onend = () => setLaeuft(false)
    neu.onerror = () => setLaeuft(false)

    erkennung.current = neu
    neu.start()
    setLaeuft(true)
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      aria-pressed={laeuft}
      className={`tippziel mb-1 shrink-0 rounded-xl px-4 font-semibold ${
        laeuft ? 'bg-sika-rot text-white' : 'bg-sika-hell border-sika-schwarz/15 border-2'
      }`}
    >
      {laeuft ? '■ Stopp' : '🎤 Diktieren'}
    </button>
  )
}
