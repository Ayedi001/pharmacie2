import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { CATEGORIES, STORE } from '../data/seed'
import { isSupabaseConfigured } from '../lib/supabase'

const NAV_LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/catalogue/soins-visage', label: 'Visage' },
  { to: '/catalogue/soins-corps', label: 'Corps' },
  { to: '/catalogue/cheveux', label: 'Cheveux' },
  { to: '/catalogue/hygiene', label: 'Hygiène' },
  { to: '/catalogue/bebe-maman', label: 'Bébé & Maman' },
  { to: '/catalogue/complements-alimentaires', label: 'Compléments alimentaires' },
  { to: '/catalogue/sante-bien-etre', label: 'Santé & Bien-être' },
  { to: '/catalogue/protection-solaire', label: 'Solaires' },
  { to: '/catalogue/maquillage', label: 'Maquillage' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/nouveautes', label: 'Nouveautés' },
  { to: '/suivi-commande', label: 'Suivi de Commande' },
]

export default function Header() {
  const { cartSummary, wishlist, lang, setLang, user } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    const base = searchCategory ? `/catalogue/${searchCategory}` : '/catalogue'
    navigate(`${base}${params.toString() ? `?${params.toString()}` : ''}`)
    setMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
      {/* Top Emerald Utility Bar */}
      <div className="bg-primary text-on-primary py-1.5 px-4 lg:px-8">
        <div className="max-w-site mx-auto flex flex-col md:flex-row items-center justify-between gap-1 text-label-sm">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
            <span className="material-symbols-outlined text-sm shrink-0">local_shipping</span>
            <span className="truncate">
              Livraison express sur toute la Tunisie sous 24-48h | Paiement à la livraison disponible (الدفع عند الاستلام)
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 divide-x divide-on-primary/20 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">support_agent</span>
              <span>Conseil &amp; WhatsApp: {STORE.phone}</span>
            </div>
            <div className="pl-3 flex items-center gap-1.5">
              <span className="font-bold">TND (DT)</span>
              {!isSupabaseConfigured && (
                <span className="px-1.5 py-0.5 rounded bg-on-primary/15 text-[9px] font-bold">
                  MODE DÉMO
                </span>
              )}
            </div>
            <div className="pl-3 flex items-center gap-1">
              {['FR', 'AR', 'EN'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    lang === code
                      ? 'bg-surface-container-lowest text-primary font-bold'
                      : 'hover:bg-white/10 text-on-primary'
                  }`}
                >
                  {code === 'AR' ? 'العربية' : code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="bg-surface-container-lowest border-b border-on-surface/5 px-4 lg:px-8">
        <div className="max-w-site mx-auto h-20 flex items-center justify-between gap-4 lg:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-2xl">local_pharmacy</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm text-primary leading-tight tracking-tight font-bold uppercase">
                Para Tunisie
              </span>
              <span className="text-label-sm text-outline tracking-wider uppercase">
                Parapharmacie Certifiée
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-2">
            <div className="w-full flex items-center bg-surface-bright rounded-full border border-on-surface/10 p-1 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                aria-label="Catégorie"
                className="bg-transparent text-label-md text-on-surface-variant border-r border-on-surface/10 pl-3 pr-2 py-2 outline-none cursor-pointer rounded-l-full max-w-[175px]"
              >
                <option value="">Toutes nos catégories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un soin, marque (La Roche-Posay, CeraVe, Vichy)..."
                className="w-full bg-transparent px-4 py-2 text-body-md text-on-surface placeholder:text-outline outline-none"
              />
              <button
                type="submit"
                aria-label="Rechercher"
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">search</span>
              </button>
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-md hover:bg-secondary-fixed transition-colors"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>Aide WhatsApp</span>
            </a>

            <Link
              to="/mon-compte?tab=wishlist"
              aria-label="Mes Favoris"
              className="relative p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-2xl">favorite</span>
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              to="/panier"
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <div className="relative">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                  shopping_bag
                </span>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {cartSummary.itemCount}
                </span>
              </div>
              <div className="hidden sm:flex flex-col text-left pr-1">
                <span className="text-label-sm text-outline uppercase">Panier</span>
                <span className="text-label-md text-primary font-bold">
                  {cartSummary.subtotal.toFixed(3)} TND
                </span>
              </div>
            </Link>

            <Link
              to="/mon-compte"
              className="flex items-center gap-2 pl-2 border-l border-on-surface/10 group"
            >
              <img
                src={user.avatar}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-secondary-container"
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-label-sm text-outline">Bienvenue</span>
                <span className="text-label-md text-on-surface group-hover:text-primary transition-colors font-semibold">
                  {user.isDemo ? 'Mon Compte' : user.full_name}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden p-2 rounded-full hover:bg-surface-container-high text-on-surface"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <nav className="bg-surface-container-lowest/95 backdrop-blur-md border-b border-on-surface/5 px-4 lg:px-8">
        <div className="max-w-site mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-label-md whitespace-nowrap transition-colors rounded-full ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `px-3 py-1.5 text-label-md whitespace-nowrap transition-colors rounded-full ml-auto ${
                isActive
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Espace Admin
          </NavLink>
        </div>
      </nav>

      {/* Mobile Search Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-b border-outline-variant/40 px-4 py-4 shadow-lg animate-fade-in">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit, marque..."
              className="input h-11 flex-1"
            />
            <button type="submit" className="btn-primary h-11 px-4">
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
