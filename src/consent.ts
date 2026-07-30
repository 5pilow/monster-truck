// Bandeau de consentement Google (CMP « Funding Choices »).
//
// Le CMP ajoute de lui-même un widget flottant « Paramètres concernant la
// confidentialité » dans un coin de l'écran : un bouton bouclier et une bulle
// qui se déplie toute seule. Il n'est pas personnalisable, aucun réglage du
// tableau de bord AdSense ne permet de le désactiver, et la documentation de
// Google précise qu'un éditeur peut seulement *ajouter* un second lien de
// révocation, jamais remplacer celui-ci.
//
// On le masque donc, mais on garde un contrôle équivalent : un lien « Cookies »
// dans les pieds de page des écrans d'accueil et de pause, qui appelle la même
// API que le bouton de Google. Le visiteur peut toujours revenir sur son
// consentement, ce qu'exige le TCF.
//
// Règle de sûreté : le widget de Google n'est masqué QUE si notre lien a pu être
// posé. Si le script CMP ne se charge pas, on ne touche à rien — mieux vaut un
// widget disgracieux que plus aucun moyen de retirer son consentement.

interface GoogleFc {
	callbackQueue?: { push: (cb: unknown) => void }
	showRevocationMessage?: () => void
}

const fc = () => (window as unknown as { googlefc?: GoogleFc }).googlefc

/** Rouvre la fenêtre de consentement. */
function openConsent() {
	const g = fc()
	if (!g?.callbackQueue) return
	g.callbackQueue.push({ CONSENT_DATA_READY: () => g.showRevocationMessage?.() })
}

/** Pose le lien dans chaque pied de page. Renvoie false si rien n'a pu être posé. */
function mountLinks(): boolean {
	const foots = document.querySelectorAll<HTMLElement>('.foot')
	if (!foots.length) return false
	let mounted = 0
	foots.forEach((foot) => {
		if (foot.querySelector('.consent-link')) { mounted++; return }
		const a = document.createElement('a')
		a.className = 'consent-link'
		a.href = '#'
		a.textContent = '🍪 Cookies'
		a.addEventListener('click', (e) => { e.preventDefault(); openConsent() })
		foot.appendChild(a)
		mounted++
	})
	return mounted > 0
}

// ---- Masquage du widget de Google ----------------------------------------
//
// Structure relevée dans la page (shadow root ouvert, en fin de <body>) :
//   <toolbar id="ft-floating-toolbar">
//     <div class="ft-menu">…bouton bouclier…</div>
//     <div id="ft-reg-bubble">…« Paramètres concernant la confidentialité »…</div>
//   </toolbar>
// La fenêtre de consentement n'est pas un descendant de cette barre : la masquer
// ne peut donc pas masquer la fenêtre.

const MARK = 'data-mt-cmp'
const TOOLBAR = '#ft-floating-toolbar'

function hideIn(host: Element): boolean {
	const root = (host as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot
	if (!root || !root.querySelector(TOOLBAR)) return false
	if (root.querySelector(`style[${MARK}]`)) return true
	// Une feuille de style plutôt qu'une suppression de nœud : le script de
	// Google garde son DOM intact et le flux de consentement continue de marcher.
	const style = document.createElement('style')
	style.setAttribute(MARK, '')
	style.textContent = `${TOOLBAR}{display:none!important}`
	root.appendChild(style)
	return true
}

function sweep(): boolean {
	let done = false
	for (const el of Array.from(document.body.children)) {
		if (el.tagName === 'DIV' && hideIn(el)) done = true
	}
	return done
}

/**
 * Le widget arrive bien après le chargement (script CMP, puis contenu du shadow
 * root) : il faut l'attendre. En deux temps :
 *  - à chaque frame pendant les premières secondes, moment où il est attendu.
 *    Un sondage à 500 ms lui laissait le temps d'être peint une fois avant
 *    d'être masqué, soit une demi-seconde d'apparition visible ;
 *  - puis un sondage lent, simple filet de sécurité si le CMP arrive très tard.
 */
export function setupConsent() {
	const tick = () => {
		// Pas de lien posé ou CMP absent : on laisse le widget de Google en place.
		if (!fc()?.callbackQueue) return false
		if (!mountLinks()) return false
		return sweep()
	}
	if (tick()) return

	const started = performance.now()
	const frame = () => {
		if (tick()) return
		if (performance.now() - started < 6_000) {
			requestAnimationFrame(frame)
			return
		}
		const timer = window.setInterval(() => {
			if (tick() || performance.now() - started > 30_000) window.clearInterval(timer)
		}, 500)
	}
	requestAnimationFrame(frame)
}
