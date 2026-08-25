/**
 * Erzeugt die PWA-Icons aus einem SVG-Platzhalter (Sika-gelbes Quadrat mit Klemmbrett).
 * Aufruf:  npm run icons
 * Die erzeugten PNGs liegen in /public und werden mit eingecheckt.
 */
import sharp from 'sharp'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

const GELB = '#FFC400'
const DUNKEL = '#1A1A1A'

/** Klemmbrett-Symbol, zentriert in einer 512er-Fläche. `pad` steuert den Sicherheitsrand. */
function klemmbrett(size, pad, radius, hintergrund) {
  // Zeichenfläche des Symbols innerhalb der Icon-Fläche
  const inner = size - pad * 2
  const s = inner / 100 // Skalierungsfaktor: Symbol ist in 100x100 gedacht
  const x = (n) => (pad + n * s).toFixed(2)
  const y = (n) => (pad + n * s).toFixed(2)
  const w = (n) => (n * s).toFixed(2)

  const linien = [30, 45, 60, 75]
    .map(
      (ly) =>
        `<rect x="${x(24)}" y="${y(ly)}" width="${w(52)}" height="${w(5)}" rx="${w(2.5)}" fill="${DUNKEL}" opacity="0.85"/>`,
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${hintergrund}"/>
  <rect x="${x(14)}" y="${y(10)}" width="${w(72)}" height="${w(82)}" rx="${w(8)}" fill="#FFFFFF"/>
  <rect x="${x(14)}" y="${y(10)}" width="${w(72)}" height="${w(82)}" rx="${w(8)}" fill="none" stroke="${DUNKEL}" stroke-width="${w(4)}"/>
  <rect x="${x(34)}" y="${y(4)}" width="${w(32)}" height="${w(14)}" rx="${w(5)}" fill="${DUNKEL}"/>
  ${linien}
</svg>`
}

async function main() {
  await mkdir(PUBLIC, { recursive: true })

  // favicon.svg – scharf in jeder Größe
  const favicon = klemmbrett(512, 40, 96, GELB)
  await writeFile(join(PUBLIC, 'favicon.svg'), favicon, 'utf8')

  const varianten = [
    // [Dateiname, Kantenlänge, Rand, Eckenradius]
    ['icon-192.png', 192, 15, 36],
    ['icon-512.png', 512, 40, 96],
    ['apple-touch-icon.png', 180, 14, 0], // iOS rundet selbst ab
  ]

  for (const [name, size, pad, radius] of varianten) {
    const svg = klemmbrett(size, pad, radius, GELB)
    await sharp(Buffer.from(svg)).png().toFile(join(PUBLIC, name))
    console.log('erzeugt:', name)
  }

  // Maskable: Symbol deutlich kleiner, damit beim Zuschneiden nichts abgeschnitten wird
  // (sichere Zone = mittlere 80 % der Fläche).
  const maskable = klemmbrett(512, 128, 0, GELB)
  await sharp(Buffer.from(maskable)).png().toFile(join(PUBLIC, 'icon-maskable-512.png'))
  console.log('erzeugt: icon-maskable-512.png')
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
