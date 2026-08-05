import type { CapacitorConfig } from '@capacitor/cli'

// Coquille native Android autour du jeu Three.js/Ammo.js. Le build web (dist/)
// est embarqué dans l'APK : le jeu marche 100 % hors-ligne, sans dépendre de
// monster-truck.pilow.fr. Les pubs dans l'app passent par AdMob (voir
// src/ads-native.ts), jamais par l'AdSense du web — celui-ci est neutralisé en
// natif (cf. src/native.ts).
const config: CapacitorConfig = {
	appId: 'fr.pilow.monstertruck',
	appName: 'Monster Truck',
	webDir: 'dist',
	backgroundColor: '#0a0d14',
	android: {
		// Fond de la WebView calé sur le thème du jeu : pas de flash blanc entre
		// l'écran de démarrage et le premier rendu.
		backgroundColor: '#0a0d14',
	},
}

export default config
