import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { findOrderByNumber, updateOrderStatus } from '../lib/api'
import { ORDER_STATUSES, STORE } from '../data/seed'
import { formatDateFr } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function OrderTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { notify } = useStore()

  const initialNum = searchParams.get('order') || '#TN-84920'
  const [orderInput, setOrderInput] = useState(initialNum)
  const [phoneInput, setPhoneInput] = useState('+216 98 456 789')
  const [order, setOrder] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')

  const loadOrder = async (num, phone = '') => {
    const found = await findOrderByNumber(num, phone)
    if (found) {
      setOrder(found)
      setNotesDraft(found.delivery_notes || '')
      setNotFound(false)
    } else {
      setOrder(null)
      setNotFound(true)
    }
  }

  useEffect(() => {
    const q = searchParams.get('order') || '#TN-84920'
    setOrderInput(q)
    loadOrder(q)
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams({ order: orderInput.trim() })
    loadOrder(orderInput, phoneInput)
  }

  const handleSaveNotes = async (e) => {
    e.preventDefault()
    if (!order) return
    const updated = await updateOrderStatus(order.order_number, order.status, notesDraft)
    if (updated) setOrder(updated)
    setEditingNotes(false)
    notify('Instructions de livraison mises à jour et transmises au livreur.')
  }

  const currentStepIdx = order
    ? Math.max(0, ORDER_STATUSES.findIndex((s) => s.value === order.status))
    : 0

  return (
    <div className="max-w-site mx-auto px-4 lg:px-8 py-6 pb-16 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-body-sm text-outline">
        <Link to="/" className="hover:text-primary">Accueil</Link>
        <span>/</span>
        <Link to="/mon-compte" className="hover:text-primary">Mon Compte</Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">Suivi de Commande en Direct</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="badge bg-secondary-container text-primary px-3 py-1 mb-2">
            • LOGISTIQUE EXPRESS TUNISIE • TEMPS RÉEL
          </span>
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Suivi de votre Commande en Temps Réel
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container-low text-label-sm text-on-surface-variant border border-outline-variant/30">
          <span className="material-symbols-outlined text-sm text-primary">sync</span>
          Synchronisé avec Aramex / Express Chrono Tunisie
        </span>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="card p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="label text-label-sm uppercase text-outline">Numéro de commande</label>
          <input
            type="text"
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            placeholder="#TN-84920"
            className="input font-bold"
          />
        </div>
        <div className="md:col-span-4">
          <label className="label text-label-sm uppercase text-outline">Numéro de téléphone affilié</label>
          <input
            type="text"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="+216 98 456 789"
            className="input"
          />
        </div>
        <div className="md:col-span-3">
          <button type="submit" className="btn-primary w-full">
            <span className="material-symbols-outlined text-lg">refresh</span>
            Actualiser le suivi
          </button>
        </div>
      </form>

      {notFound && (
        <div className="card p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-outline">package_2</span>
          <h2 className="text-headline-sm text-on-surface">Commande introuvable</h2>
          <p className="text-body-md text-on-surface-variant">
            Vérifiez le numéro saisi (exemple de démonstration : <strong>#TN-84920</strong>).
          </p>
          <button
            type="button"
            onClick={() => {
              setOrderInput('#TN-84920')
              setSearchParams({ order: '#TN-84920' })
            }}
            className="btn-primary btn-sm"
          >
            Charger la commande #TN-84920
          </button>
        </div>
      )}

      {order && (
        <>
          {/* Summary 4-Tile Strip */}
          <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3">
              <span className="text-label-sm uppercase text-outline">Référence &amp; Date</span>
              <p className="text-headline-sm text-on-surface mt-1">{order.order_number}</p>
              <p className="text-body-sm text-outline mt-0.5">{formatDateFr(order.created_at)}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low/60">
              <span className="text-label-sm uppercase text-primary font-bold">Créneau estimé</span>
              <p className="text-label-lg font-bold text-on-surface mt-1">{order.estimated_slot}</p>
              <p className="text-body-sm text-outline mt-0.5">
                Livraison Express à Domicile ({order.governorate})
              </p>
            </div>
            <div className="p-3">
              <span className="text-label-sm uppercase text-outline">Adresse de livraison</span>
              <p className="text-label-md font-bold text-on-surface mt-1">{order.address_line}</p>
              <p className="text-body-sm text-outline mt-0.5">
                {order.city}, {order.postal_code} {order.governorate}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-secondary-container/50 border border-primary/15">
              <span className="text-label-sm uppercase text-primary font-bold">
                {order.payment_method === 'cod'
                  ? 'Paiement à la livraison (COD)'
                  : 'Montant réglé'}
              </span>
              <p className="text-headline-md text-primary font-extrabold mt-1">
                {Number(order.total).toFixed(3)} TND
              </p>
              <p className="text-body-sm text-on-secondary-fixed-variant mt-0.5">
                {order.payment_method === 'cod'
                  ? 'Espèces exactes recommandées pour le livreur.'
                  : 'Paiement confirmé.'}
              </p>
            </div>
          </div>

          {/* 5-Step Progress Tracker */}
          <div className="card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-label-sm uppercase text-outline font-bold">
                  Étape {currentStepIdx + 1} sur {ORDER_STATUSES.length}
                </span>
                <h2 className="text-headline-sm text-on-surface">
                  Progression de l'Acheminement Dermo-Sécurisé
                </h2>
              </div>
              <span className="badge bg-primary text-on-primary px-3 py-1">
                • {ORDER_STATUSES[currentStepIdx]?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
              {ORDER_STATUSES.map((step, idx) => {
                const done = idx < currentStepIdx
                const active = idx === currentStepIdx
                return (
                  <div
                    key={step.value}
                    className={`flex sm:flex-col items-center sm:text-center gap-3 p-3 rounded-2xl transition-colors ${
                      active ? 'bg-secondary-container/40 border border-primary/25' : ''
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                        done || active
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'bg-surface-container-high text-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{step.icon}</span>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase block ${
                          done || active ? 'text-primary' : 'text-outline'
                        }`}
                      >
                        {done ? 'Complété' : active ? 'Étape active' : 'En attente'}
                      </span>
                      <p className="text-label-md font-bold text-on-surface">{step.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2-Column Details: Courier & Map + Package Contents */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Courier + GPS Map */}
            <div className="lg:col-span-7 space-y-6">
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    Livreur Affecté pour Votre Secteur
                  </h3>
                  <span className="badge bg-secondary-container text-primary px-2.5 py-1">
                    ✓ Vérifié Express Chrono
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">person</span>
                    </div>
                    <div>
                      <p className="text-label-lg font-bold text-on-surface">
                        {order.courier_name}
                      </p>
                      <p className="text-body-sm text-outline">
                        Livreur certifié Express Chrono Tunisie
                      </p>
                      <p className="text-body-sm text-primary font-semibold">
                        ❄️ Fourgonnette réfrigérée dermo-soins
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <a
                      href={`tel:${order.courier_phone}`}
                      className="btn-primary btn-sm flex-1 justify-center"
                    >
                      <span className="material-symbols-outlined text-base">call</span>
                      {order.courier_phone}
                    </a>
                    <a
                      href={`https://wa.me/${STORE.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-sm flex-1 justify-center"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      Message WhatsApp
                    </a>
                  </div>
                </div>

                <p className="text-body-sm text-on-surface-variant flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-outline">notifications</span>
                  <span>
                    <strong>Consigne :</strong> Le livreur vous contactera obligatoirement par téléphone 15 minutes avant son arrivée.
                    {order.delivery_notes ? ` Notes : « ${order.delivery_notes} »` : ''}
                  </span>
                </p>
              </div>

              {/* Interactive Stylized Tunisia Live GPS Map */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-label-sm uppercase text-primary font-bold">
                      Localisation Live GPS
                    </span>
                    <h3 className="text-headline-sm text-on-surface">
                      Trajet en Direct : Hub Central Ariana → {order.city}
                    </h3>
                  </div>
                  <span className="badge bg-surface-container-low text-primary px-3 py-1">
                    4.2 km restants (~20 min)
                  </span>
                </div>

                <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#d9eef7] via-[#e4f3ea] to-[#cde7f5] border border-outline-variant/40">
                  {/* Stylized Route SVG */}
                  <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                    <path
                      d="M 60 170 Q 220 90 360 120 T 530 70"
                      fill="none"
                      stroke="#00694e"
                      strokeWidth="4"
                      strokeDasharray="8 6"
                    />
                    <circle cx="60" cy="170" r="8" fill="#4e635b" />
                    <circle cx="355" cy="118" r="10" fill="#00694e" />
                    <circle cx="355" cy="118" r="20" fill="#00694e" opacity="0.2" />
                    <circle cx="530" cy="70" r="9" fill="#ba1a1a" />
                  </svg>

                  <div className="absolute top-3 left-3 bg-surface-container-lowest/95 px-3 py-2 rounded-xl shadow text-body-sm">
                    <span className="text-[10px] uppercase text-outline block">Point de départ</span>
                    <strong>Hub Central Ariana • 10:15</strong>
                  </div>
                  <div className="absolute top-3 right-3 bg-surface-container-lowest/95 px-3 py-2 rounded-xl shadow text-body-sm text-right">
                    <span className="text-[10px] uppercase text-primary font-bold block">Destination</span>
                    <strong>{order.city} • {order.governorate}</strong>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-surface-container-lowest/95 backdrop-blur px-4 py-2.5 rounded-xl shadow flex items-center justify-between gap-2 text-body-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">near_me</span>
                      </span>
                      <div>
                        <strong className="text-on-surface block">
                          Position actuelle : Avenue Habib Bourguiba (Carthage / {order.city})
                        </strong>
                        <span className="text-outline text-xs">
                          Vitesse moyenne : 42 km/h • Conditions de circulation fluides
                        </span>
                      </div>
                    </div>
                    <span className="badge bg-secondary-container text-primary shrink-0">
                      GPS Haute Précision
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Package Contents & Actions */}
            <div className="lg:col-span-5 space-y-6">
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-sm text-on-surface">Contenu du Colis Sécurisé</h3>
                  <span className="badge bg-surface-container-low text-on-surface">
                    {order.items?.length || 0} articles
                  </span>
                </div>

                <div className="space-y-3">
                  {(order.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low/40"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={it.image_url}
                          alt={it.product_name}
                          className="w-12 h-12 rounded-lg object-contain bg-surface-container-lowest p-1"
                        />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-outline block">
                            {it.brand_name}
                          </span>
                          <p className="text-label-md font-bold text-on-surface">
                            {it.product_name}
                          </p>
                          <span className="text-body-sm text-outline">Quantité : {it.quantity}</span>
                        </div>
                      </div>
                      <span className="font-bold text-label-md text-on-surface shrink-0">
                        {(Number(it.unit_price) * Number(it.quantity)).toFixed(3)} TND
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-primary/15 text-body-sm flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary">ac_unit</span>
                  <div>
                    <strong className="text-on-secondary-fixed block">
                      Emballage isotherme certifié dermo-cosmétique
                    </strong>
                    <span className="text-on-secondary-fixed-variant">
                      Préservation de la chaîne de fraîcheur thermo-sensible assurée jusqu'au client final.
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/30 space-y-1.5 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-outline">Sous-total articles :</span>
                    <span>{Number(order.subtotal).toFixed(3)} TND</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Remise panier privilège :</span>
                      <span>-{Number(order.discount).toFixed(3)} TND</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-outline">Frais de livraison express :</span>
                    <span>
                      {Number(order.shipping_fee) === 0
                        ? 'OFFERT'
                        : `${Number(order.shipping_fee).toFixed(3)} TND`}
                    </span>
                  </div>
                  <div className="flex justify-between text-label-lg font-extrabold text-on-surface pt-2 border-t border-outline-variant/30">
                    <span>Total à régler au livreur :</span>
                    <span className="text-primary">{Number(order.total).toFixed(3)} TND</span>
                  </div>
                </div>
              </div>

              {/* Instructions & Management */}
              <div className="card p-6 space-y-3">
                <h3 className="text-headline-sm text-on-surface">Instructions &amp; Gestion</h3>
                <button
                  type="button"
                  onClick={() => setEditingNotes((v) => !v)}
                  className="w-full p-3.5 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low flex items-center justify-between text-label-md text-on-surface transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    Modifier les instructions de livraison
                  </span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>

                {editingNotes && (
                  <form onSubmit={handleSaveNotes} className="space-y-2.5 animate-fade-in">
                    <textarea
                      rows={2}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      className="input"
                    />
                    <button type="submit" className="btn-primary btn-sm w-full">
                      Enregistrer les consignes
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => notify('Demande de report enregistrée pour demain matin.')}
                  className="w-full p-3.5 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low flex items-center justify-between text-label-md text-on-surface transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">event</span>
                    Reporter la livraison à demain
                  </span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>

                <a
                  href={`https://wa.me/${STORE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full"
                >
                  <span className="material-symbols-outlined">support_agent</span>
                  Besoin d'aide ? Contacter le support pharmacie
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
