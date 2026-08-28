import { useEffect, useState } from 'react'
import { Knopf } from '../../components/Knopf'
import { Unterschrift } from '../../components/Unterschrift'
import { absenderzeilen, fehlendePflichtfelder } from '../../lib/bericht'
import { dateiname } from '../../lib/dateiname'
import { einstellungenLaden } from '../../lib/db'
import {
  betreff,
  dateiTeilen,
  herunterladen,
  kannDateiTeilen,
  mailtoAdresse,
  mailtext,
} from '../../lib/teilen'
import type { Bericht, Briefvorlage } from '../../lib/typen'
import type { BlattEigenschaften } from './liste'

type Format = 'pdf' | 'docx'

/**
 * PDF- und Word-Erzeugung werden erst beim Antippen geladen. Beide Bibliotheken
 * sind groß; die App soll trotzdem schnell starten. Der Service Worker legt die
 * Teile beim ersten Besuch mit in den Cache – offline funktionieren sie also.
 */
async function datei(bericht: Bericht, format: Format): Promise<File> {
  // Der Briefbogen kommt frisch aus den Einstellungen: Wer ihn während der
  // Erfassung austauscht, soll ihn ohne Neustart im Dokument sehen.
  const { briefvorlage } = await einstellungenLaden()
  const blob =
    format === 'pdf'
      ? await (await import('../../lib/pdf')).pdfErzeugen(bericht, briefvorlage)
      : await (await import('../../lib/docx')).docxErzeugen(bericht, briefvorlage)
  return new File([blob], dateiname(bericht, format), { type: blob.type })
}

export function AbschlussBlatt({ bericht, aendern, zeigeBlatt }: BlattEigenschaften) {
  const [laeuft, setLaeuft] = useState<'' | Format | 'versand'>('')
  const [meldung, setMeldung] = useState('')
  const [mailAdresse, setMailAdresse] = useState('')
  const [vorlage, setVorlage] = useState<Briefvorlage | undefined>(undefined)

  // Nur für den Hinweis unten: welcher Briefbogen steht hinter dem Bericht?
  useEffect(() => {
    void einstellungenLaden().then((einstellungen) => setVorlage(einstellungen.briefvorlage))
  }, [])

  const fehlt = fehlendePflichtfelder(bericht)
  const zeilen = absenderzeilen(bericht.absender)

  async function erzeugen(format: Format) {
    setLaeuft(format)
    setMeldung('')
    try {
      const fertig = await datei(bericht, format)
      herunterladen(fertig, fertig.name)
      setMeldung(`${fertig.name} wurde erzeugt.`)
    } catch {
      setMeldung('Die Datei konnte nicht erzeugt werden.')
    } finally {
      setLaeuft('')
    }
  }

  async function versenden() {
    setLaeuft('versand')
    setMeldung('')
    setMailAdresse('')
    try {
      const fertig = await datei(bericht, 'pdf')

      // Erster Weg: das Handy teilt die Datei direkt.
      if (kannDateiTeilen(fertig)) {
        const geteilt = await dateiTeilen(fertig, betreff(bericht), mailtext(bericht, false))
        setMeldung(geteilt ? 'Bericht wurde geteilt.' : 'Teilen wurde abgebrochen.')
        return
      }

      // Zweiter Weg: herunterladen und eine vorbereitete Mail anbieten.
      herunterladen(fertig, fertig.name)
      setMailAdresse(mailtoAdresse(bericht))
      setMeldung(
        `${fertig.name} wurde heruntergeladen. Dieses Gerät kann Dateien nicht direkt teilen – bitte die Datei von Hand an die Mail anhängen.`,
      )
    } catch {
      setMeldung('Der Versand hat nicht geklappt.')
    } finally {
      setLaeuft('')
    }
  }

  return (
    <>
      {/* --- Zusammenfassung ------------------------------------------- */}
      <section className="border-sika-schwarz/10 rounded-xl border-2 bg-white p-4">
        <h2 className="text-lg font-bold">{bericht.kopf.projekt || 'Ohne Bezeichnung'}</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-sika-grau">Bericht</dt>
          <dd>{bericht.kopf.berichtsnummer}</dd>
          <dt className="text-sika-grau">Anwesende</dt>
          <dd>{bericht.anwesende.filter((person) => person.name.trim()).length}</dd>
          <dt className="text-sika-grau">Klimamessungen</dt>
          <dd>{bericht.klima.length}</dd>
          <dt className="text-sika-grau">Aufbauzeilen</dt>
          <dd>{bericht.aufbau.length}</dd>
          <dt className="text-sika-grau">Fotos</dt>
          <dd>{bericht.fotos.length}</dd>
        </dl>
      </section>

      {/* --- Fehlende Pflichtfelder: gelb, aber nicht blockierend -------- */}
      {fehlt.length > 0 && (
        <section className="border-sika-gelb bg-sika-gelb/15 rounded-xl border-2 p-4">
          <h2 className="font-bold">Diese Angaben fehlen noch</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {fehlt.map((eintrag) => (
              <li key={eintrag.feld}>
                <button
                  type="button"
                  onClick={() => zeigeBlatt(eintrag.blatt)}
                  className="tippziel w-full text-left font-semibold underline"
                >
                  {eintrag.feld} →
                </button>
              </li>
            ))}
          </ul>
          <p className="text-sika-grau mt-2 text-sm">
            Antippen führt zum richtigen Blatt. Der Bericht lässt sich trotzdem erzeugen – die
            Angaben fehlen dann aber im Dokument.
          </p>
        </section>
      )}

      {/* --- Absender ----------------------------------------------------- */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Absender im Bericht</h2>
        {zeilen.length > 0 ? (
          <div className="border-sika-schwarz/10 rounded-xl border-2 bg-white p-4 text-sm leading-relaxed">
            {zeilen.map((zeile) => (
              <p key={zeile}>{zeile}</p>
            ))}
          </div>
        ) : (
          <p className="text-sika-grau text-sm">
            Noch kein Profil hinterlegt. Unter Einstellungen → „Mein Profil" eintragen; neue
            Berichte übernehmen es dann automatisch.
          </p>
        )}
      </section>

      {/* --- Unterschrift ------------------------------------------------ */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Unterschrift</h2>
        <Unterschrift
          vorhanden={bericht.unterschrift}
          setzen={(dataUrl) => aendern((vorher) => ({ ...vorher, unterschrift: dataUrl }))}
          loeschen={() => aendern((vorher) => ({ ...vorher, unterschrift: undefined }))}
        />
      </section>

      {/* --- Ausgabe ----------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Bericht ausgeben</h2>
        <Knopf art="haupt" breit disabled={laeuft !== ''} onClick={() => void erzeugen('pdf')}>
          {laeuft === 'pdf' ? 'PDF wird erzeugt …' : 'PDF erzeugen'}
        </Knopf>
        <Knopf art="zweit" breit disabled={laeuft !== ''} onClick={() => void erzeugen('docx')}>
          {laeuft === 'docx' ? 'Word wird erzeugt …' : 'Word erzeugen'}
        </Knopf>
        <Knopf art="zweit" breit disabled={laeuft !== ''} onClick={() => void versenden()}>
          {laeuft === 'versand' ? 'Wird vorbereitet …' : 'Bericht versenden'}
        </Knopf>

        <p className="text-sika-grau text-sm">
          {vorlage
            ? `Der Bericht steht auf der Briefvorlage „${vorlage.dateiname}".`
            : 'Ohne hinterlegte Briefvorlage druckt die App ihre eigene Kopfzeile. Vorlage hinterlegen: Einstellungen → Briefvorlage.'}
        </p>

        {meldung && (
          <p role="status" className="font-semibold">
            {meldung}
          </p>
        )}

        {mailAdresse && (
          <a
            href={mailAdresse}
            className="bg-sika-gelb text-sika-schwarz tippziel flex items-center justify-center rounded-xl px-5 py-3 text-lg font-semibold"
          >
            Mail öffnen
          </a>
        )}
      </section>

      {/* --- Status ------------------------------------------------------ */}
      <section className="flex flex-col gap-3 pt-2">
        <h2 className="text-lg font-bold">Status</h2>
        <p className="text-sika-grau text-sm">
          Ein abgeschlossener Bericht erscheint in der Liste mit grünem Punkt. Ändern lässt er sich
          weiterhin.
        </p>
        <Knopf
          art={bericht.status === 'Abgeschlossen' ? 'zweit' : 'haupt'}
          breit
          onClick={() =>
            aendern((vorher) => ({
              ...vorher,
              status: vorher.status === 'Abgeschlossen' ? 'Entwurf' : 'Abgeschlossen',
            }))
          }
        >
          {bericht.status === 'Abgeschlossen' ? 'Wieder als Entwurf führen' : 'Bericht abschließen'}
        </Knopf>
      </section>
    </>
  )
}
