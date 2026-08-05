#!/usr/bin/env node
/**
 * Écrit dist/en/index.html : la même page, en anglais.
 *
 * Le site est une page unique écrite à la main ; y greffer une bibliothèque
 * d'internationalisation aurait demandé de baliser chaque phrase et de traduire
 * au chargement, alors que la traduction ne bouge qu'avec le texte lui-même. On
 * part donc du HTML construit et on substitue des chaînes exactes.
 *
 * Chaque paire est vérifiée : si une phrase française n'apparaît plus (texte
 * réécrit dans index.html), le build s'arrête au lieu de publier une page à
 * moitié traduite.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const SITE = 'https://monster-truck.pilow.fr'

/** [français, anglais] — l'ordre compte : les plus longues d'abord. */
const STRINGS = [
	// Métadonnées
	['<html lang="fr">', '<html lang="en">'],
	['Monster Truck, mini-jeu 3D dans le navigateur', 'Monster Truck, a 3D mini-game in your browser'],
	[
		'Conduisez un monster truck sur un terrain vallonné, directement dans votre navigateur. Physique Bullet, suspensions réglables, carrosserie personnalisable. Gratuit, sans installation.',
		'Drive a monster truck over rolling hills, right in your browser. Bullet physics, adjustable suspension, custom paint. Free, nothing to install.',
	],
	[
		'Conduisez un monster truck sur un terrain vallonné, directement dans votre navigateur. Physique Bullet, suspensions réglables, carrosserie personnalisable.',
		'Drive a monster truck over rolling hills, right in your browser. Bullet physics, adjustable suspension, custom paint.',
	],
	[
		'Conduisez un monster truck sur un terrain vallonné, directement dans votre navigateur.',
		'Drive a monster truck over rolling hills, right in your browser.',
	],
	[`<link rel="canonical" href="${SITE}/">`, `<link rel="canonical" href="${SITE}/en/">`],
	[`<meta property="og:url" content="${SITE}/">`, `<meta property="og:url" content="${SITE}/en/">`],

	// Chargement
	['Chargement du terrain et des modèles…', 'Loading the terrain and the models…'],

	// Accueil
	['Un bac à sable 3D jouable directement dans le navigateur.', 'A 3D sandbox you can play right in your browser.'],
	['Le monster truck rouge du jeu', 'The red monster truck of the game'],
	['>Jouer<', '>Play<'],
	[
		`Un monster truck, un terrain vallonné, et aucun objectif. Grimpez les
				collines, décollez sur les bosses, allez exploser la pile de caisses.
				Faites n'importe quoi, c'est justement le but.`,
		`One monster truck, rolling hills, and no objective at all. Climb the
				slopes, take off on the bumps, go and blow up the stack of crates.
				Do whatever you want — that is the whole point.`,
	],
	['<h2>Commandes</h2>', '<h2>Controls</h2>'],
	['<span><kbd>Z</kbd> <kbd>S</kbd></span><span>Accélérer, freiner / reculer</span>', '<span><kbd>W</kbd> <kbd>S</kbd></span><span>Accelerate, brake / reverse</span>'],
	['<span><kbd>Q</kbd> <kbd>D</kbd></span><span>Braquer à gauche, à droite</span>', '<span><kbd>A</kbd> <kbd>D</kbd></span><span>Steer left, right</span>'],
	['<span><kbd>Espace</kbd></span><span>Sauter</span>', '<span><kbd>Space</kbd></span><span>Jump</span>'],
	['<span><kbd>R</kbd></span><span>Remettre les caisses</span>', '<span><kbd>R</kbd></span><span>Reset the crates</span>'],
	['<span><kbd>Échap</kbd></span><span>Pause</span>', '<span><kbd>Esc</kbd></span><span>Pause</span>'],
	['<span>Souris</span><span>Glisser pour tourner, molette pour zoomer</span>', '<span>Mouse</span><span>Drag to turn, wheel to zoom</span>'],
	[
		`Les flèches marchent aussi. Sur téléphone, des boutons
				tactiles remplacent le clavier et deux doigts zooment.`,
		`Arrow keys work too. On a phone, touch buttons replace the
				keyboard and two fingers zoom.`,
	],

	// Sous le capot
	['<h2>Sous le capot</h2>', '<h2>Under the hood</h2>'],
	['rendu 3D <a href="https://threejs.org/" target="_blank" rel="noopener">Three.js</a> et WebGL ;', '3D rendering with <a href="https://threejs.org/" target="_blank" rel="noopener">Three.js</a> and WebGL;'],
	[
		'physique <a href="https://pybullet.org/" target="_blank" rel="noopener">Bullet</a> via Ammo.js en WebAssembly : terrain en maillage de collision, roues et suspensions montées à la main sur des liaisons ressort ;',
		'<a href="https://pybullet.org/" target="_blank" rel="noopener">Bullet</a> physics through Ammo.js in WebAssembly: the terrain is a collision mesh, wheels and suspension are hand-built on spring constraints;',
	],
	['ombres douces, reflets par sonde cubique, halo de lentille ;', 'soft shadows, cube-probe reflections, lens flare;'],
	[
		'modèles 3D <a href="https://github.com/5pilow/monster-truck/blob/master/CREDITS.md" target="_blank" rel="noopener">CC0</a> : camion &amp; caisse <a href="https://quaternius.com/" target="_blank" rel="noopener">Quaternius</a>, arbres <a href="https://kenney.nl/" target="_blank" rel="noopener">Kenney</a>, ciel <a href="https://polyhaven.com/" target="_blank" rel="noopener">Poly Haven</a>.',
		'<a href="https://github.com/5pilow/monster-truck/blob/master/CREDITS.md" target="_blank" rel="noopener">CC0</a> 3D models: truck &amp; crate by <a href="https://quaternius.com/" target="_blank" rel="noopener">Quaternius</a>, trees by <a href="https://kenney.nl/" target="_blank" rel="noopener">Kenney</a>, sky by <a href="https://polyhaven.com/" target="_blank" rel="noopener">Poly Haven</a>.',
	],

	// Pieds de page et écran de pause
	['<span>Un jeu de <a href="https://pilow.fr" target="_blank" rel="noopener">Pilow</a></span>', '<span>A game by <a href="https://pilow.fr" target="_blank" rel="noopener">Pilow</a></span>'],
	['<a href="/privacy.html">Confidentialité</a>', '<a href="/privacy.html">Privacy</a>'],
	['<a href="/en/" hreflang="en">English</a>', '<a href="/" hreflang="fr">Français</a>'],
	['<h1>Pause</h1>', '<h1>Paused</h1>'],
	['>Reprendre<', '>Resume<'],
	[">Retour à l'accueil<", '>Back to the menu<'],
	['<span><kbd>Échap</kbd> pour reprendre</span>', '<span><kbd>Esc</kbd> to resume</span>'],

	// Interface du jeu
	['title="Retour à l\'accueil" aria-label="Retour à l\'accueil"', 'title="Back to the menu" aria-label="Back to the menu"'],
	['title="Réglages" aria-label="Réglages"', 'title="Settings" aria-label="Settings"'],
	['<span>Suspension</span>', '<span>Suspension</span>'],
	['<span>Métallique</span>', '<span>Metallic</span>'],
	['<div id="pause-hint">Échap : pause</div>', '<div id="pause-hint">Esc: pause</div>'],
	['aria-label="Gauche"', 'aria-label="Left"'],
	['aria-label="Droite"', 'aria-label="Right"'],
	['aria-label="Sauter"', 'aria-label="Jump"'],
	['aria-label="Freiner"', 'aria-label="Brake"'],
	['aria-label="Accélérer"', 'aria-label="Accelerate"'],
	['<div class="ad-label">Publicité</div>', '<div class="ad-label">Advertisement</div>'],
]

const source = await readFile(join(DIST, 'index.html'), 'utf8')

let html = source
const missing = []
for (const [fr, en] of STRINGS) {
	if (!html.includes(fr)) {
		// Une chaîne déjà identique dans les deux langues n'est pas un problème.
		if (fr !== en) missing.push(fr)
		continue
	}
	html = html.replaceAll(fr, en)
}

if (missing.length) {
	console.error('traduction anglaise : phrases introuvables dans dist/index.html')
	for (const string of missing) console.error(`  - ${string.slice(0, 90)}`)
	process.exit(1)
}

// Le manifeste anglais ne diffère que par la langue et le texte : un second
// fichier évite d'installer l'application avec un descriptif français.
const manifest = {
	name: 'Monster Truck',
	short_name: 'Monster Truck',
	description: 'Drive a monster truck over rolling hills, right in your browser.',
	start_url: '/en/',
	scope: '/',
	display: 'fullscreen',
	orientation: 'landscape',
	background_color: '#0a0d14',
	theme_color: '#7fb2d9',
	lang: 'en',
	icons: [
		{ src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
		{ src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
		{ src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
	],
}
html = html.replace('<link rel="manifest" href="/manifest.webmanifest">', '<link rel="manifest" href="/en/manifest.webmanifest">')

await mkdir(join(DIST, 'en'), { recursive: true })
await writeFile(join(DIST, 'en', 'index.html'), html)
await writeFile(join(DIST, 'en', 'manifest.webmanifest'), JSON.stringify(manifest, null, '\t') + '\n')

console.log(`dist/en/index.html : ${STRINGS.length} chaînes traduites`)
