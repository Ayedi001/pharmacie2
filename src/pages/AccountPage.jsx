import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { fetchAddresses, fetchOrders, fetchProducts, saveAddresses } from '../lib/api'
import { GOVERNORATES, IMG, ORDER_STATUSES, STORE } from '../data/seed'
import { formatDateFr } from '../lib/format'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

const SIDEBAR_TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { id: 'orders', label: 'Commandes & Factures', icon: 'receipt_long' },
  { id: 'tracking', label: 'Suivi en direct', icon: 'local_shipping', to: '/suivi-commande' },
  { id: 'addresses', label: 'Adresses enregistrées', icon: 'location_on' },
  { id: 'wishlist', label: 'Mes Favoris & Wishlist', icon: 'favorite' },
  { id: 'security', label: 'Sécurité & Profil', icon: 'manage_accounts' },
]

export default function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, setUser, wishlist, reorderItems, notify } = useStore()

  const activeTab = searchParams.get('tab') || 'dashboard'
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [addresses, setAddresses] = useState(() => fetchAddresses())
  const [addingAddr, setAddingAddr] = useState(false)
  const [newAddr, setNewAddr] = useState({
    label: '',
    governorate: 'Tunis',
    city: '',
    postal_code: '',
    address_line: '',
    phone: '+216 ',
    notes: '',
  })

  // Auth form for real Supabase login/signup
  const [authMode, setAuthMode] = useState('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')

  useEffect(() => {
    fetchOrders().then(setOrders)
    fetchProducts().then(setProducts)
  }, [])

  const setTab = (tab) => setSearchParams({ tab })
  const activeOrder = orders.find((o) => o.status !== 'delivered' && o.status !== 'cancelled') || orders[0]
  const wishlistProducts = products.filter((p) => wishlist.includes(p.slug))

  const handleConvertPoints = () => {
    navigator.clipboard?.writeText('TUNISIE10').catch(() => {})
    notify('Bon de réduction généré ! Utilisez le code TUNISIE10 (-10%) au panier.')
  }

  const handleAddAddress = (e) => {
    e.preventDefault()
    if (!newAddr.label.trim() || !newAddr.address_line.trim()) return
    const next = [
      ...addresses,
      { id: `addr-${Date.now()}`, is_default: false, ...newAddr },
    ]
    setAddresses(saveAddresses(next))
    setAddingAddr(false)
    setNewAddr({
      label: '',
      governorate: 'Tunis',
      city: '',
      postal_code: '',
      address_line: '',
      phone: '+216 ',
      notes: '',
    })
    notify('Nouvelle adresse enregistrée.')
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured || !supabase) {
      setUser({
        ...user,
        full_name: authName || authEmail.split('@')[0] || user.full_name,
        email: authEmail || user.email,
      })
      notify('Connecté en mode démo local.')
      return
    }
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { full_name: authName } },
      })
      if (error) notify(error.message, 'error')
      else notify('Compte créé ! Vérifiez votre boîte mail.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      })
      if (error) notify(error.message, 'error')
      else notify('Connexion réussie !')
    }
  }

  const statusMeta = (status) =>
    ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0]

  return (
    <div className="max-w-site mx-auto px-4 lg:px-8 py-6 pb-16 space-y-6">
      {/* Breadcrumb & Verified badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
        <nav className="flex items-center gap-2 text-outline">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">Mon Compte</span>
        </nav>
        <span className="text-label-sm text-primary font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Compte Vérifié • Tél : {user.phone}
        </span>
      </div>

      {/* Top Profile Banner */}
      <div className="card p-5 lg:p-6 bg-gradient-to-r from-tertiary-fixed/30 via-surface-container-lowest to-secondary-container/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.full_name}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-surface-container-lowest shadow"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-headline-md text-on-surface">{user.full_name}</h1>
              <span className="badge bg-tertiary-fixed text-on-tertiary-fixed px-2.5 py-0.5">
                {user.tier}
              </span>
              <span className="text-body-sm text-outline">
                Membre depuis {user.member_since}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              {user.city} • Profil Soin {user.skin_profile}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-surface-container-lowest/90 p-3.5 rounded-2xl border border-outline-variant/30 w-full lg:w-auto justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined icon-fill">stars</span>
            </div>
            <div>
              <span className="text-label-sm uppercase text-outline block">
                Programme Beauté &amp; Santé
              </span>
              <p className="text-label-lg font-bold text-on-surface">
                {user.loyalty_points} points cumulés
              </p>
              <span className="text-body-sm text-primary font-semibold">
                ≈ {(user.loyalty_points * 0.05).toFixed(3)} TND déductibles
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConvertPoints}
            className="btn-primary btn-sm"
          >
            Convertir en bon
          </button>
        </div>
      </div>

      {/* Main Split: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="card p-4 space-y-1">
            <p className="px-3 pt-1 pb-2 text-label-sm uppercase text-outline font-bold">
              Espace Client Personnel
            </p>
            {SIDEBAR_TABS.map((t) =>
              t.to ? (
                <Link
                  key={t.id}
                  to={t.to}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-lg">{t.icon}</span>
                    {t.label}
                  </span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Link>
              ) : (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-label-md transition-colors ${
                    activeTab === t.id
                      ? 'bg-secondary-container text-primary font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-lg">{t.icon}</span>
                    {t.label}
                  </span>
                  {t.id === 'wishlist' && (
                    <span className="badge bg-surface-container-lowest text-primary">
                      {wishlist.length}
                    </span>
                  )}
                  {t.id === 'orders' && (
                    <span className="badge bg-primary text-on-primary">{orders.length}</span>
                  )}
                </button>
              )
            )}
          </div>

          <div className="card p-4 bg-secondary-container/40 border-primary/15 space-y-2.5">
            <div className="flex items-center gap-2 text-primary font-bold text-label-lg">
              <span className="material-symbols-outlined">support_agent</span>
              <span>Conseillère Dermo</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Une hésitation sur votre posologie ou routine solaire ?
            </p>
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm w-full"
            >
              Assistance Rapide
            </a>
          </div>
        </aside>

        {/* Right Panel */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === 'dashboard' && (
            <>
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setTab('orders')}
                  className="card p-4 text-left hover:border-primary/40 transition-colors"
                >
                  <span className="text-label-sm uppercase text-outline">Historique</span>
                  <p className="text-headline-md text-on-surface mt-1">
                    {orders.length} Commandes
                  </p>
                  <span className="text-body-sm text-primary font-semibold mt-1 block">
                    Voir l'archive →
                  </span>
                </button>
                <Link
                  to="/suivi-commande"
                  className="card p-4 text-left hover:border-primary/40 transition-colors"
                >
                  <span className="text-label-sm uppercase text-outline">En cours</span>
                  <p className="text-headline-md text-primary mt-1">
                    {activeOrder ? statusMeta(activeOrder.status).short : 'Aucune'}
                  </p>
                  <span className="text-body-sm text-outline mt-1 block">
                    {activeOrder?.city || 'Tunis'}
                  </span>
                </Link>
                <div className="card p-4">
                  <span className="text-label-sm uppercase text-outline">Cagnotte</span>
                  <p className="text-headline-md text-on-surface mt-1">
                    {(user.loyalty_points * 0.05).toFixed(3)} <span className="text-xs">TND</span>
                  </p>
                  <span className="text-body-sm text-outline mt-1 block">Solde prêt à déduire</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('wishlist')}
                  className="card p-4 text-left hover:border-primary/40 transition-colors"
                >
                  <span className="text-label-sm uppercase text-outline">Favoris</span>
                  <p className="text-headline-md text-on-surface mt-1">
                    {wishlist.length} Produits
                  </p>
                  <span className="text-body-sm text-primary font-semibold mt-1 block">
                    Voir ma wishlist →
                  </span>
                </button>
              </div>

              {/* Active Order Highlight Card */}
              {activeOrder && (
                <div className="card p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-headline-sm text-on-surface">
                          Commande {activeOrder.order_number}
                        </h2>
                        <span className="badge bg-secondary-container text-primary px-2.5 py-1">
                          • {statusMeta(activeOrder.status).label}
                        </span>
                      </div>
                      <p className="text-body-sm text-outline mt-1">
                        Expédiée le {formatDateFr(activeOrder.created_at)} • Coursier :{' '}
                        {activeOrder.courier_name} ({activeOrder.courier_phone})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-label-sm uppercase text-outline block">
                        Montant à régler
                      </span>
                      <p className="text-headline-sm text-primary font-extrabold">
                        {Number(activeOrder.total).toFixed(3)} TND
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/30">
                    <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">
                        verified_user
                      </span>
                      Colis vérifié &amp; scellé sous contrôle officinal
                    </span>
                    <Link
                      to={`/suivi-commande?order=${encodeURIComponent(activeOrder.order_number)}`}
                      className="btn-primary btn-sm"
                    >
                      <span className="material-symbols-outlined text-base">my_location</span>
                      Suivre le colis en direct
                    </Link>
                  </div>
                </div>
              )}

              {/* Order History Preview */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-headline-sm text-on-surface">
                      Historique de vos commandes
                    </h2>
                    <p className="text-body-sm text-outline">
                      Consultez l'historique complet et recommandez vos soins habituels en 1 clic.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('orders')}
                    className="text-label-md text-primary font-semibold hover:underline"
                  >
                    Voir tout ({orders.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 3).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-label-lg text-on-surface">
                            {ord.order_number}
                          </span>
                          <span className="badge bg-secondary-container text-primary">
                            {statusMeta(ord.status).short}
                          </span>
                        </div>
                        <p className="text-body-sm text-outline mt-0.5">
                          {formatDateFr(ord.created_at)} • {ord.items?.length || 1} article(s) •{' '}
                          {ord.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-label-lg text-on-surface">
                          {Number(ord.total).toFixed(3)} TND
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            reorderItems(ord.items || [])
                            navigate('/panier')
                          }}
                          className="btn-secondary btn-sm"
                        >
                          Recommander
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Grid: Addresses + Pharmacist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-headline-sm text-on-surface">Adresses de livraison</h3>
                    <button
                      type="button"
                      onClick={() => setTab('addresses')}
                      className="text-label-md text-primary hover:underline"
                    >
                      Gérer
                    </button>
                  </div>
                  {addresses.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 text-body-sm"
                    >
                      <div className="flex items-center gap-2">
                        <strong className="text-on-surface">{a.label}</strong>
                        {a.is_default && (
                          <span className="badge bg-primary text-on-primary">Par défaut</span>
                        )}
                      </div>
                      <p className="text-on-surface-variant mt-1">
                        {a.address_line}, {a.postal_code} {a.city}, {a.governorate}
                      </p>
                      <p className="text-outline mt-0.5">{a.phone}</p>
                    </div>
                  ))}
                </div>

                {/* Dedicated Pharmacist Card */}
                <div className="card p-6 space-y-4">
                  <span className="text-label-sm uppercase text-primary font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Service Pharmaceutique Dédié
                  </span>
                  <div className="flex items-center gap-3">
                    <img
                      src={IMG.pharmacist}
                      alt="Dr. Amine Khemir"
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                    <div>
                      <h3 className="text-label-lg font-bold text-on-surface">
                        Dr. Amine Khemir
                      </h3>
                      <p className="text-body-sm text-on-surface-variant">
                        Docteur en Pharmacie &amp; Conseiller Dermo-Cosmétique
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low/70 text-body-sm italic text-on-surface-variant">
                    « Yasmine, pour l'arrivée des fortes chaleurs à Tunis, pensez à renouveler votre fluide SPF50+ toutes les 2 heures et associez-le le soir à un sérum apaisant à l'eau thermale. »
                  </div>
                  <a
                    href={`https://wa.me/${STORE.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full btn-sm"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    Poser une question via WhatsApp
                  </a>
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-headline-sm text-on-surface">
                Toutes vos commandes ({orders.length})
              </h2>
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-label-lg">{ord.order_number}</span>
                        <span className="badge bg-secondary-container text-primary">
                          {statusMeta(ord.status).label}
                        </span>
                      </div>
                      <p className="text-body-sm text-outline mt-1">
                        {formatDateFr(ord.created_at)} • {ord.address_line}, {ord.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-primary mr-2">
                        {Number(ord.total).toFixed(3)} TND
                      </span>
                      <Link
                        to={`/suivi-commande?order=${encodeURIComponent(ord.order_number)}`}
                        className="btn-primary btn-sm"
                      >
                        Suivre
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          reorderItems(ord.items || [])
                          navigate('/panier')
                        }}
                        className="btn-secondary btn-sm"
                      >
                        Recommander
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm text-on-surface">
                  Adresses enregistrées ({addresses.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setAddingAddr((v) => !v)}
                  className="btn-primary btn-sm"
                >
                  {addingAddr ? 'Annuler' : '+ Ajouter une adresse'}
                </button>
              </div>

              {addingAddr && (
                <form
                  onSubmit={handleAddAddress}
                  className="p-5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="Nom de l'adresse (Ex: Domicile Sousse)"
                      value={newAddr.label}
                      onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                      className="input"
                    />
                    <select
                      value={newAddr.governorate}
                      onChange={(e) => setNewAddr({ ...newAddr, governorate: e.target.value })}
                      className="input"
                    >
                      {GOVERNORATES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <input
                      required
                      placeholder="Ville / Délégation"
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="input"
                    />
                    <input
                      placeholder="Téléphone (+216 ...)"
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                  <input
                    required
                    placeholder="Adresse complète"
                    value={newAddr.address_line}
                    onChange={(e) => setNewAddr({ ...newAddr, address_line: e.target.value })}
                    className="input"
                  />
                  <button type="submit" className="btn-primary btn-sm">
                    Enregistrer l'adresse
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-label-lg text-on-surface">{a.label}</strong>
                      {a.is_default && (
                        <span className="badge bg-primary text-on-primary">Par défaut</span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant">
                      {a.address_line}, {a.postal_code} {a.city}, {a.governorate}
                    </p>
                    <p className="text-body-sm text-outline">{a.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h2 className="text-headline-sm text-on-surface">
                Mes Favoris &amp; Wishlist ({wishlistProducts.length})
              </h2>
              {wishlistProducts.length === 0 ? (
                <div className="card p-10 text-center space-y-3">
                  <p className="text-body-md text-outline">Vous n'avez aucun produit en favori.</p>
                  <Link to="/catalogue" className="btn-primary">
                    Explorer le catalogue
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistProducts.map((p) => (
                    <ProductCard key={p.slug} product={p} compact />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6 max-w-xl space-y-5">
              <div>
                <h2 className="text-headline-sm text-on-surface">
                  Connexion / Inscription Supabase Auth
                </h2>
                <p className="text-body-sm text-outline mt-1">
                  {isSupabaseConfigured
                    ? 'Connecté à votre projet Supabase.'
                    : 'Mode démo actif (ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env pour activer Supabase Auth).'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`chip ${authMode === 'signin' ? 'chip-active' : ''}`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`chip ${authMode === 'signup' ? 'chip-active' : ''}`}
                >
                  Créer un compte
                </button>
              </div>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="label">Nom complet</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Yasmine Dridi"
                      className="input"
                    />
                  </div>
                )}
                <div>
                  <label className="label">Adresse e-mail</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="client@paratunisie.tn"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  {authMode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
