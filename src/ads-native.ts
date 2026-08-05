import {
	AdMob,
	BannerAdPluginEvents,
	BannerAdPosition,
	BannerAdSize,
} from '@capacitor-community/admob'
import { isNative } from './native'

// AdMob remplace AdSense dans l'app native. Une seule bannière adaptative est
// ancrée en bas de l'écran, affichée uniquement sur les écrans de menu (accueil,
// pause) et jamais pendant une partie — même comportement que les encarts web.
//
// Identifiant de bloc bannière AdMob RÉEL (prod) de l'app « Monster Truck ».
// L'App ID AdMob, lui, vit dans strings.xml
// (android/app/src/main/res/values/strings.xml -> admob_app_id).
// S'il était vide, on servirait TOUJOURS des pubs de test (filet de sécurité).
const BANNER_UNIT = 'ca-app-pub-1293426764542886/5900550126'
// Unité de test officielle de Google : se remplit toujours, ne compte jamais
// comme une vraie impression. Cliquer une VRAIE pub en développement peut faire
// signaler le compte AdMob, d'où le recours aux pubs de test.
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111'

// Pubs de test tant qu'aucune unité réelle n'est renseignée, en dev, ou sur
// demande explicite (`VITE_ADS_TEST=true npm run build`). Un build de prod avec
// BANNER_UNIT renseigné sert les vraies pubs sans variable à oublier.
const USE_TEST_ADS =
	!BANNER_UNIT ||
	import.meta.env.DEV ||
	import.meta.env.VITE_ADS_TEST === 'true'

// Interrupteur : `VITE_ADS=off npm run build` produit un binaire sans pub —
// pratique pour des captures d'écran propres et une version de revue sans pub.
const ADS_OFF = import.meta.env.VITE_ADS === 'off'
const BANNER_AD_ID = USE_TEST_ADS ? TEST_BANNER : BANNER_UNIT

let initialized = false
let visible = false

async function ensureInit() {
	if (initialized) return
	// En mode test, on enregistre l'appareil pour que même l'unité réelle serve
	// des créations de test — filet de sécurité en plus de l'unité de test.
	await AdMob.initialize({ initializeForTesting: USE_TEST_ADS })
	// La bannière flotte au-dessus de la WebView (elle ne la redimensionne pas) :
	// sans ça, sa hauteur recouvrirait le bas de la page (p. ex. le bouton Jouer).
	// On réserve exactement sa hauteur en marge basse tant qu'elle est affichée.
	AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
		const px = info.height > 0 ? `${info.height}px` : '0px'
		document.documentElement.style.setProperty('--ad-banner-height', px)
	})
	initialized = true
}

/** Affiche la bannière basse. Sans effet hors natif ou si les pubs sont coupées. */
export async function showBanner() {
	if (!isNative || ADS_OFF || visible) return
	visible = true
	try {
		await ensureInit()
		await AdMob.showBanner({
			adId: BANNER_AD_ID,
			adSize: BannerAdSize.ADAPTIVE_BANNER,
			position: BannerAdPosition.BOTTOM_CENTER,
			isTesting: USE_TEST_ADS,
		})
	} catch {
		// Hors-ligne ou hoquet du SDK : pas de pub vaut mieux qu'un plantage.
		visible = false
	}
}

/** Masque la bannière basse et rend sa hauteur à la page. */
export async function hideBanner() {
	if (!isNative || ADS_OFF || !visible) return
	visible = false
	await AdMob.hideBanner().catch(() => {})
	document.documentElement.style.setProperty('--ad-banner-height', '0px')
}
