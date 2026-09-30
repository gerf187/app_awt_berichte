import { useEffect, useRef, useState } from 'react'

/**
 * Diktiertaste für die Freitextfelder.
 *
 * Die Spracherkennung ist Sache des Browsers (Web Speech API). Safari und
 * Chrome führen sie unterschiedlich – deshalb nur die Felder beschreiben, die
 * wir wirklich benutzen, statt auf browserweite Typen zu hoffen.
 *
 * Achtung: Die Erkennung läuft je nach Browser über dessen Server. Sie wird
 * ausschließlich auf Knopfdruck gestartet und läuft nie im Hintergrund – und
 * ohne Empfang läuft sie meistens gar nicht. Dann sagt die Taste das, statt
 * stumm wieder auszugehen.
 */
type Ergebnis = ArrayLike<{ transcript: string }> & { isFinal?: boolean }

type Erkennung = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((ereignis: { resultIndex?: number; results: ArrayLike<Ergebnis> }) => void) | null
  onend: (() => void) | null
  onerror: ((ereignis: { error?: string }) => void) | null
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

const OHNE_EMPFANG = 'Diktieren braucht Empfang – bitte tippen.'

/** Was der Browser meldet, in Worten für die Baustelle. `''` heißt: nichts sagen. */
function diktatFehler(code: string | undefined): string {
  switch (code) {
    case 'network':
      return OHNE_EMPFANG
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Mikrofon nicht freigegeben – in den Einstellungen des Handys erlauben.'
    case 'audio-capture':
      return 'Kein Mikrofon gefunden.'
    case 'no-speech':
      return 'Nichts verstanden – bitte noch einmal.'
    // Selbst gestoppt oder vom Browser beendet: kein Fehler, den jemand lesen muss.
    case 'aborted':
      return ''
    default:
      return 'Diktieren hat nicht geklappt – bitte tippen.'
  }
}

export function Spracheingabe({ anhaengen }: { anhaengen: (text: string) => void }) {
  // Einmal beim ersten Rendern prüfen – der Browser kann es oder eben nicht.
  const [moeglich] = useState(() => erkennungBauen() !== null)
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState('')
  const erkennung = useRef<Erkennung | null>(null)

  // Die Erkennung lebt länger als ein Rendern. Ohne Ref hinge sie an dem
  // `anhaengen` vom Moment des Starts – und schriebe über alles, was seitdem
  // dazugekommen ist.
  const anhaengenAktuell = useRef(anhaengen)
  useEffect(() => {
    anhaengenAktuell.current = anhaengen
  })

  // Läuft noch eine Aufnahme, wenn der Bildschirm wechselt: abschalten.
  useEffect(() => () => erkennung.current?.stop(), [])

  // Die Meldung verschwindet von selbst – sie soll informieren, nicht stehen bleiben.
  useEffect(() => {
    if (!meldung) return
    const uhr = window.setTimeout(() => setMeldung(''), 6000)
    return () => window.clearTimeout(uhr)
  }, [meldung])

  // Kann der Browser es nicht, verschwindet die Taste – keine toten Knöpfe.
  if (!moeglich) return null

  function umschalten() {
    if (laeuft) {
      erkennung.current?.stop()
      return
    }
    setMeldung('')

    // Ohne Netz gar nicht erst anfangen: manche Browser gehen sonst kommentarlos
    // wieder aus, und man diktiert ins Leere.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setMeldung(OHNE_EMPFANG)
      return
    }

    const neu = erkennungBauen()
    if (!neu) return

    neu.lang = 'de-DE'
    neu.continuous = true
    neu.interimResults = false
    neu.onresult = (ereignis) => {
      // `results` enthält alles seit dem Start. Nur das Neue anhängen – sonst
      // stünde jeder Satz so oft im Feld, wie danach noch gesprochen wird.
      let text = ''
      for (let i = ereignis.resultIndex ?? 0; i < ereignis.results.length; i++) {
        const ergebnis = ereignis.results[i]
        if (ergebnis.isFinal === false) continue
        text += ergebnis[0].transcript
      }
      if (text.trim()) anhaengenAktuell.current(text.trim())
    }
    neu.onend = () => setLaeuft(false)
    neu.onerror = (ereignis) => {
      setLaeuft(false)
      setMeldung(diktatFehler(ereignis?.error))
    }

    erkennung.current = neu
    try {
      neu.start()
      setLaeuft(true)
    } catch {
      setMeldung(diktatFehler(undefined))
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end">
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
      {meldung && (
        <span
          role="status"
          className="text-sika-grau mb-1 max-w-56 text-right text-xs font-semibold"
        >
          {meldung}
        </span>
      )}
    </div>
  )
}
