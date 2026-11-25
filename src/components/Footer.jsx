import { useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeNewsletter } from '../lib/api'
import { useStore } from '../context/StoreContext'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useStore()

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await subscribeNewsletter(email)
    setSubmitting(false)
    notify(res.message, res.ok ? 'success' : 'error')
    if (res.ok) setEmail('')
  }

  return (
    <footer className="w-full bg-surface-container-low pt-12 pb-8 border-t border-on-surface/5 mt-auto">
      <div className="max-w-site mx-auto px-4 lg:px-8">
        {/* Newsletter Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 mb-12 shadow-card border border-on-surface/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <span className="text-label-sm text-primary uppercase font-bold tracking-wider">
              Offre Privilège Tunisie
            </span>
            <h3 className="text-headline-sm text-on-surface">
              Recevez 10% sur votre première commande
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Inscrivez-vous pour découvrir les avant-premières dermatologiques, conseils officinaux et réductions exclusives.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse e-mail..."
              required
              className="w-full md:w-72 h-12 px-4 rounded-full bg-surface border border-outline-variant text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-12 px-6 rounded-full bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors shrink-0"
            >
              {submitting ? '...' : "S'inscrire"}
            </button>
          </form>
        </div>

        {/* 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-outline-variant/30">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-headline-sm text-primary font-bold uppercase tracking-tight">
                Para Tunisie
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Votre parapharmacie de référence en Tunisie. Sélection rigoureuse de produits 100% authentiques contrôlés par nos experts dermatologiques et docteurs en pharmacie.
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/40">
              <span className="material-symbols-outlined text-primary text-xl">verified</span>
              <div className="text-label-sm text-on-surface">
                <span className="font-bold block">100% Authenticité Garantie</span>
                Direct laboratoires officiels
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-label-lg text-on-surface font-bold uppercase tracking-wide">
              Catégories Phares
            </h4>
            <ul className="space-y-2 text-body-sm text-on-surface-variant">
              <li><Link className="hover:text-primary transition-colors" to="/catalogue/soins-visage">Soins Dermo-cosmétiques</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/catalogue/soins-visage?tag=anti-age">Anti-âge &amp; Régénération</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/catalogue/protection-solaire">Protections Solaires Haute Efficacité</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/catalogue/cheveux">Traitements Capillaires Anti-chute</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/catalogue/hygiene">Hygiène Bio &amp; Famille</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/catalogue/bebe-maman">Laits &amp; Soins Bébé</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-label-lg text-on-surface font-bold uppercase tracking-wide">
              Service Client &amp; Aide
            </h4>
            <ul className="space-y-2 text-body-sm text-on-surface-variant">
              <li><Link className="hover:text-primary transition-colors" to="/suivi-commande">Suivi de commande en direct</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/mon-compte">Mon Compte / Espace Client</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/panier">Panier &amp; Validation</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/promotions">Promotions &amp; Codes Avantage</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/nouveautes">Nouveautés &amp; Soins Bio</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-label-lg text-on-surface font-bold uppercase tracking-wide">
              Informations Légales
            </h4>
            <ul className="space-y-2 text-body-sm text-on-surface-variant">
              <li><span className="text-on-surface-variant">Conditions Générales de Vente</span></li>
              <li><span className="text-on-surface-variant">Mentions Légales</span></li>
              <li><span className="text-on-surface-variant">Politique de Confidentialité</span></li>
              <li><span className="text-on-surface-variant">Protection des données (INPDP Tunisie)</span></li>
              <li><Link className="hover:text-primary transition-colors font-semibold text-primary" to="/admin">Administration &amp; Gestionnaires</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Payment Badges & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label-sm font-semibold uppercase text-outline">
              Modes de règlement sécurisés :
            </span>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest text-xs font-semibold text-primary border border-primary/20">
              Paiement à la livraison (Espèces)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest text-xs font-semibold text-on-surface border border-outline-variant/40">
              Cartes bancaires (ClicToPay)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest text-xs font-semibold text-on-surface border border-outline-variant/40">
              Virement bancaire
            </span>
          </div>
          <div className="text-center md:text-right">
            © 2025 Parapharmacie Tunisie. Tous droits réservés. Plateforme déposée.
          </div>
        </div>
      </div>
    </footer>
  )
}
