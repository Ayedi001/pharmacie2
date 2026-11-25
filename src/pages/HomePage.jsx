import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProducts } from '../lib/api'
import { IMG, STORE } from '../data/seed'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import Stars from '../components/Stars'

const POPULAR_CATEGORIES = [
  { slug: 'soins-visage', name: 'Visage & Anti-Âge', count: '+450 références', img: IMG.catVisage },
  { slug: 'soins-corps', name: 'Corps & Hydratation', count: '+280 références', img: IMG.catCorps },
  { slug: 'complements-alimentaires', name: 'Santé & Vitamines', count: '+190 références', img: IMG.catSante },
  { slug: 'bebe-maman', name: 'Bébé & Maman', count: '+310 références', img: IMG.catBebe },
  { slug: 'protection-solaire', name: 'Protection Solaire', count: '+165 références', img: IMG.catSolaire },
  { slug: 'cheveux', name: 'Cheveux & Cuir Chevelu', count: '+220 références', img: IMG.catCheveux },
]

const PARTNER_BRANDS = [
  { slug: 'la-roche-posay', label: 'LA ROCHE-POSAY' },
  { slug: 'vichy', label: 'VICHY' },
  { slug: 'cerave', label: 'CeraVe' },
  { slug: 'bioderma', label: 'BIODERMA' },
  { slug: 'avene', label: 'AVÈNE' },
  { slug: 'svr', label: 'SVR' },
  { slug: 'filorga', label: 'FILORGA' },
]

const BESTSELLER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'anti-taches', label: 'Anti-Taches' },
  { key: 'anti-age', label: 'Anti-Âge' },
  { key: 'hydratation', label: 'Hydratation' },
]

const TESTIMONIALS = [
  {
    initials: 'SY',
    name: 'Syrine Y.',
    location: 'Tunis (La Marsa) • Achat vérifié',
    text: '"Commande passée mardi matin reçue mercredi midi à La Marsa ! Les produits sont impeccablement emballés avec des échantillons offerts. Très rassurée de payer à la livraison."',
  },
  {
    initials: 'MK',
    name: 'Mariem K.',
    location: 'Sousse (Kantaoui) • Achat vérifié',
    text: '"J\'avais une hésitation sur le choix de mon sérum anti-taches. La pharmacienne sur WhatsApp m\'a guidée avec beaucoup de patience et de professionnalisme. Je recommande à 100% !"',
  },
  {
    initials: 'AB',
    name: 'Amel B.',
    location: 'Sfax Ville • Achat vérifié',
    text: '"Des prix souvent plus avantageux qu\'en parapharmacie physique avec des promotions régulières sur La Roche-Posay et CeraVe. Livraison rapide jusqu\'à Sfax sans aucun souci."',
  },
]

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [bestsellerTab, setBestsellerTab] = useState('all')
  const { notify } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts().then(setProducts)
  }, [])

  const bestsellers = useMemo(() => {
    const base = products.filter((p) => p.is_bestseller)
    const filtered =
      bestsellerTab === 'all'
        ? base
        : products.filter((p) => p.tags?.includes(bestsellerTab))
    return (filtered.length ? filtered : base).slice(0, 4)
  }, [products, bestsellerTab])

  const naturalProducts = useMemo(() => {
    const bio = products.filter((p) => p.tags?.includes('naturel'))
    return (bio.length ? bio : products.slice(10, 14)).slice(0, 4)
  }, [products])

  const copyPromo = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    notify(`Code promo ${code} copié ! Appliquez-le au panier.`)
  }

  return (
    <div className="flex flex-col w-full">
      {/* Top Notification Flash Banner */}
      <div className="w-full bg-secondary-container text-on-secondary-container px-4 py-2 text-center text-label-md flex flex-wrap items-center justify-center gap-2">
        <span className="material-symbols-outlined text-sm text-primary">local_shipping</span>
        <span>
          Livraison OFFERTE à partir de 99 TND d'achat dans toute la Tunisie (Grand Tunis, Sousse, Sfax &amp; régions)
        </span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mx-1" />
        <button
          type="button"
          onClick={() => copyPromo('LIVRAISON24')}
          className="font-bold underline cursor-pointer hover:text-primary"
        >
          Code: LIVRAISON24
        </button>
      </div>

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low/60 via-surface to-surface-bright py-12 lg:py-20 px-4 lg:px-8">
        <div className="max-w-site mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 self-start bg-surface-container-lowest px-4 py-1.5 rounded-full shadow-sm border border-outline-variant/30">
              <Stars rating={5} size="text-sm" />
              <span className="text-label-md text-on-surface font-semibold">4.9/5 Avis vérifiés</span>
              <span className="text-outline text-label-sm">(+12 800 clientes satisfaites)</span>
            </div>

            <h1 className="text-headline-xl-mobile md:text-headline-xl text-on-surface tracking-tight leading-[1.12]">
              Votre beauté et votre bien-être,{' '}
              <span className="text-primary italic font-serif">notre priorité.</span>
            </h1>

            <p className="text-body-lg text-on-surface-variant max-w-xl">
              Découvrez une sélection exclusive de soins dermo-cosmétiques certifiés 100% authentiques, validés par des docteurs en pharmacie et livrés avec soin sur toute la Tunisie.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/catalogue/soins-visage" className="btn-primary h-13 px-8">
                <span>Découvrir nos produits</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link
                to="/promotions"
                className="h-13 px-7 rounded-full bg-surface-container-lowest text-primary hover:bg-secondary-container/50 text-label-lg font-semibold border border-primary/20 inline-flex items-center gap-2 shadow-sm transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg text-tertiary">local_offer</span>
                <span>Voir les promotions (-30%)</span>
              </Link>
            </div>

            {/* Trust Mini Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-outline-variant/30">
              {[
                { icon: 'verified_user', title: '100% Authentique', sub: 'Circuits certifiés officiels' },
                { icon: 'rocket_launch', title: 'Livraison 24-48h', sub: '24 Gouvernorats' },
                { icon: 'payments', title: 'Paiement à la livraison', sub: 'الدفع عند الاستلام' },
              ].map((b) => (
                <div
                  key={b.title}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest/80 shadow-sm border border-outline-variant/20"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary-container text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">{b.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-sm font-bold text-on-surface">{b.title}</span>
                    <span className="text-body-sm text-on-surface-variant">{b.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Showcase Card */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl -z-10" />
            <Link
              to="/produit/coffret-mosselixir-intense"
              className="group relative w-full max-w-[480px] bg-surface-container-lowest rounded-3xl p-6 shadow-xl border border-outline-variant/30 flex flex-col items-center hover:shadow-2xl transition-shadow"
            >
              <div className="w-full flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-secondary-container text-primary font-bold rounded-full text-label-sm">
                  SÉLECTION DERMO ÉTÉ 2025
                </span>
                <span className="text-body-sm text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">eco</span>
                  Naturel &amp; Sûr
                </span>
              </div>
              <div className="relative w-full h-[300px] sm:h-[320px] rounded-2xl overflow-hidden bg-surface-bright flex items-center justify-center">
                <img
                  src={IMG.hero}
                  alt="Coffret MossElixir Intense"
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm text-label-sm text-on-surface font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Soin Anti-Âge Végétal Certifié
                </div>
              </div>
              <div className="w-full mt-4 flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <div>
                  <p className="text-label-sm uppercase tracking-wide text-primary font-bold">
                    Rituel Teint Radieux
                  </p>
                  <h4 className="text-label-lg text-on-surface font-bold">
                    Coffret MossElixir™ Intense
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-label-sm line-through text-outline">145.000 DT</span>
                  <p className="text-price-display text-primary">
                    119.500 <span className="text-label-sm font-bold">TND</span>
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* OFFICIAL PARTNER BRANDS STRIP */}
      <section className="w-full bg-surface-container-lowest border-y border-outline-variant/30 py-8 px-4 lg:px-8">
        <div className="max-w-site mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="shrink-0 text-center md:text-left">
            <p className="text-label-sm uppercase tracking-wider text-outline font-bold">
              Partenaires Agréés
            </p>
            <h3 className="text-headline-sm text-on-surface">Laboratoires Officiels</h3>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 lg:gap-10">
            {PARTNER_BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                to={`/catalogue?brand=${brand.slug}`}
                className="font-bold text-headline-sm tracking-tight text-on-surface-variant/80 hover:text-primary transition-colors"
              >
                {brand.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES (6 Cards) */}
      <section className="w-full py-16 px-4 lg:px-8 bg-surface">
        <div className="max-w-site mx-auto">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-10 gap-4">
            <div>
              <span className="section-eyebrow">Rayons Phares</span>
              <h2 className="section-title mt-1">Explorez par Besoins &amp; Soins</h2>
            </div>
            <Link
              to="/catalogue"
              className="text-label-lg text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Toutes les catégories</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/catalogue/${cat.slug}`}
                className="group flex flex-col card p-4 hover:shadow-card-hover hover:border-primary/40 transition-all duration-300 text-center items-center"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 bg-surface-bright p-1 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-body-sm text-outline mt-1">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS SECTION */}
      <section className="w-full py-16 px-4 lg:px-8 bg-surface-container-low/40" id="bestsellers">
        <div className="max-w-site mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-bold mb-2">
                <span className="material-symbols-outlined text-sm text-primary">
                  local_fire_department
                </span>
                Plébiscités par nos clientes tunisiennes
              </div>
              <h2 className="section-title">Meilleures Ventes de la Semaine</h2>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto">
              {BESTSELLER_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setBestsellerTab(t.key)}
                  className={`chip ${bestsellerTab === t.key ? 'chip-active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((prod) => (
              <ProductCard key={prod.slug} product={prod} compact />
            ))}
          </div>

          {/* Governorate Delivery Reassurance Strip */}
          <div className="mt-10 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">pin_drop</span>
              <span className="text-label-md text-on-surface">
                Expédition journalière depuis notre dépôt central à Tunis vers :{' '}
                <strong className="text-primary">
                  Tunis, Ariana, Sousse, Sfax, Nabeul, Bizerte, Monastir
                </strong>{' '}
                et l'ensemble des 24 gouvernorats.
              </span>
            </div>
            <span className="text-label-sm font-bold bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">
              Délai moyen constaté : 24h
            </span>
          </div>
        </div>
      </section>

      {/* PROMOTIONAL HERO BANNER */}
      <section className="w-full py-16 px-4 lg:px-8 bg-surface" id="promotions">
        <div className="max-w-site mx-auto">
          <div className="relative w-full rounded-3xl overflow-hidden bg-primary text-on-primary shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-container to-primary/80 opacity-95" />
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary-fixed-dim/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 lg:p-14">
              <div className="lg:col-span-7 flex flex-col space-y-4">
                <span className="inline-flex items-center gap-2 self-start bg-on-primary/10 backdrop-blur-md px-3.5 py-1 rounded-full text-label-sm font-bold tracking-wider uppercase text-primary-fixed">
                  <span className="material-symbols-outlined text-sm">wb_sunny</span>
                  Offre Spéciale Saison Solaire &amp; Dermo
                </span>
                <h2 className="text-headline-lg md:text-headline-xl tracking-tight leading-tight">
                  Jusqu'à -30% sur votre routine d'été + Cadeau Offert
                </h2>
                <p className="text-body-lg text-on-primary/90 max-w-xl">
                  Protégez votre capital jeunesse contre le soleil tunisien. Bénéficiez d'une trousse dermo découverte offerte dès 120 TND d'achat avec le coupon privilège.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => copyPromo('TUNISIEBEAUTE')}
                    className="flex items-center bg-surface-container-lowest/15 backdrop-blur-md rounded-full px-4 py-2 border border-on-primary/20 hover:bg-surface-container-lowest/25 transition-colors"
                  >
                    <span className="text-label-sm uppercase text-on-primary/70 mr-2">
                      Code Promo :
                    </span>
                    <span className="text-label-lg font-bold tracking-widest text-primary-fixed">
                      TUNISIEBEAUTE
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      copyPromo('TUNISIEBEAUTE')
                      navigate('/promotions')
                    }}
                    className="h-12 px-7 rounded-full bg-surface-container-lowest hover:bg-surface-container text-primary text-label-lg font-bold shadow-md transition-all"
                  >
                    Activer l'offre maintenant
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[360px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-on-primary/20 bg-surface-bright">
                  <img
                    src={IMG.giftPack}
                    alt="Trousse Solaire Été Offerte"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-tertiary text-on-tertiary font-bold text-label-sm px-2.5 py-1 rounded-full shadow">
                    Cadeau 100% Offert
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NATURAL & BIO DERMO SECTION */}
      <section className="w-full py-16 px-4 lg:px-8 bg-surface-container-low/20">
        <div className="max-w-site mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-primary text-label-sm font-bold mb-2">
                <span className="material-symbols-outlined text-sm">eco</span>
                Cosmétique Propre &amp; Éco-responsable
              </div>
              <h2 className="section-title">Nouveautés &amp; Soins Naturels Certifiés</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                Formulations végétales haute tolérance pour peaux exigeantes et réactives.
              </p>
            </div>
            <Link
              to="/nouveautes"
              className="text-label-lg text-primary font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Découvrir l'univers Green</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {naturalProducts.map((prod) => (
              <ProductCard key={prod.slug} product={prod} compact />
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US (4 Pillars) */}
      <section className="w-full py-16 px-4 lg:px-8 bg-surface-container-lowest border-y border-outline-variant/30">
        <div className="max-w-site mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-eyebrow">Nos Engagements</span>
            <h2 className="section-title mt-1">Pourquoi choisir Para Tunisie ?</h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              La sérénité d'une vraie officine avec le confort et la rapidité du commerce moderne.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: 'verified',
                title: '100% Authentique',
                desc: 'Approvisionnement direct auprès des laboratoires officiels agréés et distributeurs exclusifs en Tunisie. Zéro contrefaçon, traçabilité garantie.',
              },
              {
                icon: 'local_shipping',
                title: 'Livraison Express 24-48h',
                desc: "Expédition soignée et rapide sur toute la République tunisienne, du Grand Tunis jusqu'au Sud (Médenine, Tataouine, Tozeur). Emballage isotherme adapté.",
              },
              {
                icon: 'payments',
                title: 'Paiement à la Livraison',
                desc: 'Payez en espèces en toute confiance dès réception de votre colis auprès de notre transporteur (الدفع عند الاستلام), ou réglez par carte bancaire ClicToPay.',
              },
              {
                icon: 'support_agent',
                title: 'Conseil Pharmaceutique',
                desc: 'Une équipe de préparateurs et docteurs en pharmacie joignable 7j/7 sur WhatsApp pour adapter votre routine beauté à votre typologie de peau.',
              },
            ].map((pillar) => (
              <div
                key={pillar.title}
                className="flex flex-col items-start p-6 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-5 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">{pillar.icon}</span>
                </div>
                <h3 className="text-headline-sm text-on-surface mb-2">{pillar.title}</h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="w-full py-16 px-4 lg:px-8 bg-surface">
        <div className="max-w-site mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="section-eyebrow">Témoignages Réels</span>
              <h2 className="section-title mt-1">Ce que disent nos clientes</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-on-surface-variant">Note globale :</span>
              <Stars rating={5} size="text-base" />
              <span className="text-label-md font-bold text-on-surface">
                4.9 / 5 sur Google Avis
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <Stars rating={5} />
                  <p className="text-body-md text-on-surface italic">{t.text}</p>
                </div>
                <div className="flex items-center gap-3 pt-4 mt-4 border-t border-outline-variant/30">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-primary font-bold flex items-center justify-center text-label-md">
                    {t.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-md font-bold text-on-surface">{t.name}</span>
                    <span className="text-body-sm text-outline">{t.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP PHARMACIST BANNER */}
      <section className="w-full pb-12 px-4 lg:px-8 bg-surface">
        <div className="max-w-site mx-auto">
          <div className="bg-secondary-container rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-3xl">chat</span>
              </div>
              <div>
                <h3 className="text-headline-sm text-on-secondary-fixed">
                  Besoin d'un diagnostic peau personnalisé ?
                </h3>
                <p className="text-body-md text-on-secondary-fixed-variant">
                  Échangez en direct avec nos docteurs en pharmacie via WhatsApp. Réponse garantie sous 15 minutes.
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary shrink-0"
            >
              <span className="material-symbols-outlined text-xl">send</span>
              <span>Démarrer la discussion WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
