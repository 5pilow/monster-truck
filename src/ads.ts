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

// Un même bloc d'annonce peut servir à plusieurs emplacements d'une même page.
// Créer un second bloc dans AdSense permettrait de séparer les statistiques des
// deux écrans, sans rien changer d'autre que la valeur ci-dessous.
const UNIT_MONSTER_TRUCK = '5660023345'

const SLOTS = {
	/** Encart de l'écran d'accueil, sous le bouton « Jouer ». */
	home: UNIT_MONSTER_TRUCK,
	/** Encart de l'écran de pause (Échap). */
	pause: UNIT_MONSTER_TRUCK,
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
	// On surveille l'attribut plutôt que d'attendre un délai fixe : sur un réseau lent
	// une annonce peut mettre plusieurs secondes à arriver, et la replier entre-temps
	// ferait perdre l'impression.
	const collapse = () => { container.style.display = 'none' }

	// Un bloqueur de publicité peut masquer l'encart en CSS depuis une feuille de style
	// utilisateur, invisible au JavaScript de la page, tout en laissant AdSense le
	// déclarer rempli. On replie alors le conteneur pour ne pas laisser la mention
	// « Publicité » au-dessus du vide.
	const collapseIfHidden = () => window.setTimeout(() => {
		if (ins.offsetHeight === 0) collapse()
	}, 2000)

	let settled = false
	const observer = new MutationObserver(() => {
		const status = ins.getAttribute('data-ad-status')
		// AdSense passe par « loading » avant de conclure. Ne traiter que les états
		// terminaux : replier dès « loading » masquait l'encart juste avant l'arrivée
		// de l'annonce, et l'observateur se déconnectait sans jamais voir « filled ».
		if (status !== 'filled' && status !== 'unfilled') return
		settled = true
		observer.disconnect()
		if (status === 'filled') collapseIfHidden()
		else collapse()
	})
	observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })

	// Filet de sécurité : sans aucune réponse (script bloqué par un bloqueur de
	// publicité, réseau coupé) l'attribut n'atteint jamais d'état terminal.
	window.setTimeout(() => {
		if (settled) return
		observer.disconnect()
		if (ins.getAttribute('data-ad-status') !== 'filled') collapse()
	}, 12000)
}

export { show, SLOTS }
