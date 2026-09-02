import { useId } from 'react'
import { useZahlEingabe } from './zahlEingabe'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const RAHMEN =
  'w-full rounded-xl border-2 border-sika-schwarz/15 bg-white px-4 py-3 text-lg tippziel focus:border-sika-schwarz'

function Beschriftung({ id, kind, hinweis }: { id: string; kind: ReactNode; hinweis?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-sm font-semibold">{kind}</span>
      {hinweis && <span className="text-sika-grau mb-1 block text-sm">{hinweis}</span>}
    </label>
  )
}

type TextfeldEigenschaften = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  beschriftung: string
  hinweis?: string
}

export function Textfeld({
  beschriftung,
  hinweis,
  className = '',
  ...rest
}: TextfeldEigenschaften) {
  const id = useId()
  return (
    <div>
      <Beschriftung id={id} kind={beschriftung} hinweis={hinweis} />
      <input id={id} {...rest} className={`${RAHMEN} ${className}`} />
    </div>
  )
}

type TextbereichEigenschaften = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  beschriftung: string
  hinweis?: string
  /** Wird rechts neben der Beschriftung gezeigt – z. B. die Spracheingabe-Taste. */
  nebenBeschriftung?: ReactNode
}

export function Textbereich({
  beschriftung,
  hinweis,
  nebenBeschriftung,
  className = '',
  rows = 5,
  ...rest
}: TextbereichEigenschaften) {
  const id = useId()
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <Beschriftung id={id} kind={beschriftung} hinweis={hinweis} />
        {nebenBeschriftung}
      </div>
      <textarea id={id} rows={rows} {...rest} className={`${RAHMEN} ${className}`} />
    </div>
  )
}

type AuswahlfeldEigenschaften = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  beschriftung: string
  hinweis?: string
  optionen: readonly string[]
  /** Text des leeren ersten Eintrags. */
  platzhalter?: string
}

export function Auswahlfeld({
  beschriftung,
  hinweis,
  optionen,
  platzhalter = 'Bitte wählen',
  className = '',
  ...rest
}: AuswahlfeldEigenschaften) {
  const id = useId()
  return (
    <div>
      <Beschriftung id={id} kind={beschriftung} hinweis={hinweis} />
      <select id={id} {...rest} className={`${RAHMEN} ${className}`}>
        <option value="">{platzhalter}</option>
        {optionen.map((eintrag) => (
          <option key={eintrag} value={eintrag}>
            {eintrag}
          </option>
        ))}
      </select>
    </div>
  )
}

type ZahlfeldEigenschaften = Omit<TextfeldEigenschaften, 'value' | 'onChange' | 'onBlur'> & {
  wert: number
  aendern: (wert: number) => void
}

/**
 * Textfeld für eine Zahl. Anders als ein Feld mit `value={zahl}` lässt es sich
 * zwischendurch leeren – sonst steht nach dem Löschen sofort wieder eine 0 im
 * Weg und die getippte 18 wird zu „018".
 */
export function Zahlfeld({ wert, aendern, ...rest }: ZahlfeldEigenschaften) {
  const eingabe = useZahlEingabe(wert, aendern)
  return <Textfeld type="number" inputMode="decimal" {...rest} {...eingabe} />
}
