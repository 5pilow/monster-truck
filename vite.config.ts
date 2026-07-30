import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		rollupOptions: {
			output: {
				// Three.js et Ammo.js dans leurs propres morceaux, séparés du code du jeu.
				// Tout était réuni dans un seul fichier de 2,4 Mo : la moindre correction
				// d'une ligne de jeu changeait son empreinte, et les visiteurs devaient
				// retélécharger les bibliothèques entières à chaque déploiement. Séparées,
				// elles restent en cache tant que leur version ne change pas.
				manualChunks(id) {
					if (id.includes('node_modules/three')) return 'three'
					if (id.includes('ammojs-typed') || id.includes('node_modules/ammo.js')) return 'ammo'
					return undefined
				},
			},
		},
		// Le morceau d'Ammo dépasse la limite d'avertissement par défaut et le dépassera
		// toujours : c'est un moteur physique C++ compilé en WebAssembly, il n'y a rien à
		// y découper. La limite est relevée pour que l'avertissement redevienne utile.
		chunkSizeWarningLimit: 1900,
	},
})
