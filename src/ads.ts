// Publicité Google AdSense.
//
// AdSense est validé au niveau du domaine racine pilow.fr (meta de vérification
// + ads.txt servis par le portfolio) : le sous-domaine monster-truck.pilow.fr est
// donc couvert, il n'y a rien à déclarer en plus côté Google.
//
// Pour activer les encarts, coller les identifiants de bloc créés dans le tableau
// de bord AdSense (Annonces > Par unité d'annonce) dans SLOTS ci-dessous. Tant
// qu'un identifiant est vide, l'encart correspondant n'est tout simplement pas
// inséré : le jeu reste parfaitement fonctionnel et aucune requête publicitaire
// n'est faite.

const CLIENT = 'ca-pub-1293426764542886'

const SLOTS = {
	/** Encart de l'écran d'accueil, sous le bouton « Jouer ». */
	home: '',
	/** Encart de l'écran de pause (Échap). */
	pause: '',
}

type SlotName = keyof typeof SLOTS

/**
 * Insère un encart dans le conteneur donné. Ne fait rien si l'identifiant de bloc
 * n'est pas renseigné, si l'encart a déjà été inséré, ou si le script AdSense a
 * été bloqué (bloqueur de publicité) : dans ce cas le conteneur est replié pour ne
 * pas laisser un trou dans la mise en page.
 */
function show(name: SlotName, container: HTMLElement | null) {

	if (!container) return
	const slot = SLOTS[name]
	if (!slot) {
		// Pas encore d'identifiant de bloc : on masque le conteneur, sinon la mention
		// « Publicité » reste affichée au-dessus du vide.
		container.style.display = 'none'
		return
	}
	if (container.dataset.adFilled) return
	container.dataset.adFilled = '1'
	container.style.display = ''

	const ins = document.createElement('ins')
	ins.className = 'adsbygoogle'
	ins.style.display = 'block'
	ins.setAttribute('data-ad-client', CLIENT)
	ins.setAttribute('data-ad-slot', slot)
	ins.setAttribute('data-ad-format', 'auto')
	ins.setAttribute('data-full-width-responsive', 'true')
	container.appendChild(ins)

	try {
		const w = window as any
		;(w.adsbygoogle = w.adsbygoogle || []).push({})
	} catch (e) {
		container.style.display = 'none'
		return
	}

	// AdSense pose data-ad-status="filled" / "unfilled" une fois la réponse reçue.
	// Sans réponse (script bloqué) l'attribut reste absent : on replie.
	window.setTimeout(() => {
		if (ins.getAttribute('data-ad-status') !== 'filled') {
			container.style.display = 'none'
		}
	}, 3000)
}

export { show, SLOTS }
