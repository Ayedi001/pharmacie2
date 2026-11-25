import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { createOrder, validateCoupon } from '../lib/api'
import { GOVERNORATES, STORE } from '../data/seed'

export default function CartCheckoutPage() {
  const {
    cart,
    cartSummary,
    updateCartQty,
    removeFromCart,
    clearCart,
    appliedCoupon,
    setAppliedCoupon,
    user,
    notify,
  } = useStore()
  const navigate = useNavigate()

  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || 'TUNISIE10')
  const [couponMsg, setCouponMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    customer_name: user.full_name || 'Yasmine Dridi',
    customer_phone: (user.phone || '+216 98 456 789').replace(/^\+216\s*/, ''),
    customer_email: user.email || 'yasmine.dridi@gmail.com',
    governorate: 'Tunis',
    city: 'La Marsa',
    postal_code: '2070',
    address_line: '14 Rue Habib Bourguiba, Résidence Les Palmiers',
    delivery_notes: 'Bâtiment B, 2ème étage. En cas d’absence, déposer chez la gardienne Mme Fatma.',
    payment_method: 'cod',
  })

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    const res = await validateCoupon(couponInput, cartSummary.subtotal)
    if (res.valid) {
      setAppliedCoupon(res.coupon)
      setCouponMsg(`Code '${res.coupon.code}' actif (${res.coupon.description})`)
      notify(`Coupon ${res.coupon.code} appliqué !`)
    } else {
      setAppliedCoupon(null)
      setCouponMsg(res.message)
      notify(res.message, 'error')
    }
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.address_line.trim()) {
      notify('Veuillez remplir tous les champs obligatoires.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const order = await createOrder({
        payment_method: form.payment_method,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: `+216 ${form.customer_phone.trim()}`,
        governorate: form.governorate,
        city: form.city.trim(),
        postal_code: form.postal_code.trim(),
        address_line: form.address_line.trim(),
        delivery_notes: form.delivery_notes.trim(),
        subtotal: cartSummary.subtotal,
        discount: cartSummary.discount,
        shipping_fee: cartSummary.shippingFee,
        total: cartSummary.total,
        coupon_code: appliedCoupon?.code || null,
        items: cart.map((item) => ({
          product_slug: item.slug,
          product_name: item.name,
          brand_name: item.brand_name,
          image_url: item.image,
          unit_price: item.price,
          quantity: item.quantity,
        })),
      })
      clearCart()
      notify(`Commande ${order.order_number} confirmée avec succès !`)
      navigate(`/suivi-commande?order=${encodeURIComponent(order.order_number)}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-site mx-auto px-4 lg:px-8 py-20 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-secondary-container text-primary mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">shopping_bag</span>
        </div>
        <h1 className="text-headline-lg text-on-surface">Votre panier est vide</h1>
        <p className="text-body-lg text-on-surface-variant max-w-md mx-auto">
          Découvrez notre sélection de soins dermo-cosmétiques 100% authentiques livrés sous 24-48h partout en Tunisie.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/catalogue/soins-visage" className="btn-primary">
            Découvrir le catalogue
          </Link>
          <Link to="/suivi-commande" className="btn-outline">
            Suivre une commande
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-16">
      {/* Secure Checkout Step Header */}
      <div className="w-full bg-surface-container-low/70 border-b border-outline-variant/30 py-4 px-4 lg:px-8">
        <div className="max-w-site mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <div>
              <h1 className="text-label-lg font-bold text-on-surface">
                Tunnel d'Achat Sécurisé • Grand Tunis &amp; 24 Gouvernorats
              </h1>
              <p className="text-body-sm text-outline">
                Livraison express Aramex / Express Chrono sous 24h à 48h ouvrées
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-label-sm">
            <span className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-bold">
              1 Panier &amp; Expédition
            </span>
            <span className="w-6 h-px bg-outline-variant" />
            <span className="px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">
              2 Paiement TND
            </span>
            <span className="w-6 h-px bg-outline-variant" />
            <span className="px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">
              ✓ Confirmation
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmitOrder}
        className="max-w-site mx-auto px-4 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Column: 3 Checkout Sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Cart Items */}
          <section className="card p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-outline-variant/30">
              <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                1. Vos Soins Sélectionnés ({cart.length} {cart.length > 1 ? 'articles' : 'article'})
              </h2>
              <span className="badge bg-secondary-container text-primary px-3 py-1">
                100% Officinal &amp; Certifié
              </span>
            </div>

            <div className="divide-y divide-outline-variant/30">
              {cart.map((item) => (
                <div
                  key={`${item.slug}-${item.variant || ''}`}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/produit/${item.slug}`}
                      className="w-20 h-20 rounded-xl bg-surface-bright p-2 border border-outline-variant/30 shrink-0 overflow-hidden"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </Link>
                    <div>
                      <span className="text-label-sm uppercase text-outline font-bold">
                        {item.brand_name}
                      </span>
                      <Link
                        to={`/produit/${item.slug}`}
                        className="block text-label-lg font-bold text-on-surface hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="text-body-sm text-primary font-medium mt-0.5">
                        {item.variant ? `${item.variant} • ` : ''}En stock (Tunis)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center rounded-full border border-outline-variant/50 bg-surface p-0.5">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.slug, item.variant, -1)}
                        className="w-8 h-8 rounded-full hover:bg-surface-container-high font-bold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-label-md font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.slug, item.variant, 1)}
                        className="w-8 h-8 rounded-full hover:bg-surface-container-high font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[105px]">
                      <p className="text-label-lg font-extrabold text-on-surface">
                        {(item.price * item.quantity).toFixed(3)}{' '}
                        <span className="text-xs font-semibold">TND</span>
                      </p>
                      <p className="text-body-sm text-outline">
                        {item.price.toFixed(3)} TND / unité
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.slug, item.variant)}
                      aria-label="Retirer"
                      className="text-outline hover:text-error p-1.5 rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Bar */}
            <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary">confirmation_number</span>
                <div>
                  <p className="text-label-md font-bold text-on-surface">
                    Code Avantage ou Bon Parapharmacie
                  </p>
                  <p className="text-body-sm text-primary">
                    {couponMsg || 'Essayez TUNISIE10 (-10%) ou LIVRAISON24 (port offert)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Code promo"
                  className="input h-10 w-40 uppercase font-bold tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="btn-primary h-10 px-5 text-label-md"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </section>

          {/* 2. Delivery Details */}
          <section className="card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-outline-variant/30">
              <div>
                <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  2. Coordonnées &amp; Livraison en Tunisie
                </h2>
                <p className="text-body-sm text-outline">
                  Livraison à domicile ou sur votre lieu de travail partout en Tunisie
                </p>
              </div>
              <span className="badge bg-surface-container-low text-primary px-3 py-1">
                <span className="material-symbols-outlined text-xs">call</span>
                Livreur vous contacte avant passage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom et Prénom *</label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Ex: Yasmine Dridi"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Téléphone Portable Tunisien *</label>
                <div className="flex">
                  <span className="h-12 px-3 rounded-l-xl bg-surface-container-low border border-r-0 border-on-surface/15 flex items-center text-label-md font-bold text-on-surface">
                    🇹🇳 +216
                  </span>
                  <input
                    type="tel"
                    required
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    placeholder="98 456 789"
                    className="input rounded-l-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Adresse E-mail de confirmation *</label>
              <input
                type="email"
                required
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                placeholder="yasmine.dridi@gmail.com"
                className="input"
              />
              <p className="text-body-sm text-outline mt-1">
                Un lien de suivi de colis en direct vous sera envoyé par email.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Gouvernorat *</label>
                <select
                  value={form.governorate}
                  onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                  className="input"
                >
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Ville / Délégation *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="La Marsa"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Code Postal</label>
                <input
                  type="text"
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="2070"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Adresse exacte de réception *</label>
              <input
                type="text"
                required
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                placeholder="14 Rue Habib Bourguiba, Résidence Les Palmiers"
                className="input"
              />
            </div>

            <div>
              <label className="label">Indications &amp; Remarques pour le livreur (Optionnel)</label>
              <textarea
                rows={2}
                value={form.delivery_notes}
                onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
                placeholder="Ex: Étage, interphone, code porte..."
                className="input"
              />
            </div>
          </section>

          {/* 3. Payment Method */}
          <section className="card p-6 space-y-4">
            <div className="pb-3 border-b border-outline-variant/30">
              <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                3. Choisissez votre Mode de Paiement
              </h2>
              <p className="text-body-sm text-outline">
                Modalités fiables, transparentes et adaptées à la Tunisie
              </p>
            </div>

            {[
              {
                id: 'cod',
                title: 'Paiement en espèces à la livraison (Cash on Delivery)',
                badge: 'Le plus populaire',
                desc: 'Payez sereinement au livreur après contrôle de votre colis. Aucune avance bancaire requise.',
                ar: 'الدفع نقداً عند استلام طلبك للموزع',
                icon: 'payments',
              },
              {
                id: 'card',
                title: 'Carte Bancaire Tunisienne (GNT / ClicToPay / Visa / Mastercard)',
                badge: '3D-Secure SMT',
                desc: 'Paiement crypté et instantané via la passerelle monétique officielle tunisienne SMT ClicToPay & cartes e-Dinar de La Poste Tunisienne.',
                icon: 'credit_card',
              },
              {
                id: 'wallet',
                title: 'Portefeuille Digital ou Virement (Flouci / Sobflous / RIB)',
                desc: 'Payez immédiatement par scan QR Code Flouci ou envoyez votre reçu de virement bancaire sur notre ligne WhatsApp.',
                icon: 'qr_code_2',
              },
            ].map((pm) => {
              const selected = form.payment_method === pm.id
              return (
                <label
                  key={pm.id}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selected
                      ? 'border-primary bg-secondary-container/25'
                      : 'border-outline-variant/40 hover:border-primary/40 bg-surface-container-lowest'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={selected}
                    onChange={() => setForm({ ...form, payment_method: pm.id })}
                    className="accent-primary w-5 h-5 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-label-lg font-bold text-on-surface">{pm.title}</span>
                      {pm.badge && (
                        <span className="badge bg-secondary-container text-primary">
                          {pm.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-1">{pm.desc}</p>
                    {pm.ar && (
                      <p className="text-body-sm text-primary font-semibold mt-1">{pm.ar}</p>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">{pm.icon}</span>
                  </div>
                </label>
              )
            })}
          </section>
        </div>

        {/* Right Column: Sticky Summary */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-[170px]">
          <div className="card p-6 space-y-5">
            {/* Free shipping meter */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/80 border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between text-label-sm">
                <span className="flex items-center gap-1.5 text-on-surface font-bold">
                  <span className="material-symbols-outlined text-primary text-base">
                    local_shipping
                  </span>
                  Livraison Gratuite dès {STORE.freeShippingThreshold} TND
                </span>
                <span className="font-bold text-primary">{cartSummary.freeShippingProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${cartSummary.freeShippingProgress}%` }}
                />
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {cartSummary.freeShipping
                  ? 'Bravo ! Vous bénéficiez de la livraison 100% offerte.'
                  : `Ajoutez seulement ${cartSummary.remainingForFreeShipping.toFixed(
                      3
                    )} TND pour profiter des frais de port offerts !`}
              </p>
            </div>

            <h3 className="text-headline-sm text-on-surface">Récapitulatif Financier</h3>

            <div className="space-y-2.5 text-body-md">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Sous-total articles ({cartSummary.itemCount} unités)
                </span>
                <span className="font-bold">{cartSummary.subtotal.toFixed(3)} TND</span>
              </div>
              {cartSummary.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Remise privilège ({appliedCoupon?.code})</span>
                  <span className="font-bold">-{cartSummary.discount.toFixed(3)} TND</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Frais d'expédition Tunisie</span>
                <span className="font-bold text-primary">
                  {cartSummary.shippingFee === 0
                    ? 'OFFERT'
                    : `${cartSummary.shippingFee.toFixed(3)} TND`}
                </span>
              </div>
              <div className="flex justify-between text-body-sm text-outline">
                <span>TVA légale incluse (19%)</span>
                <span>Comprise</span>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/40 flex items-baseline justify-between">
              <div>
                <span className="text-label-sm uppercase text-outline font-bold block">
                  Total à payer
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  {form.payment_method === 'cod'
                    ? 'Paiement à la livraison'
                    : form.payment_method === 'card'
                    ? 'Carte ClicToPay'
                    : 'Flouci / Virement'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-primary">
                  {cartSummary.total.toFixed(3)} <span className="text-sm">TND</span>
                </span>
                <span className="block text-label-sm text-outline">TTC</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-13 text-base"
            >
              <span>{submitting ? 'Validation en cours...' : 'Confirmer la commande'}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <p className="text-body-sm text-outline text-center">
              En validant, vous acceptez nos conditions de vente parapharmaceutiques.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-surface-container-low text-center">
                <span className="text-label-sm font-bold text-on-surface block">Données INPDP</span>
                <span className="text-[11px] text-outline">Loi 2004-63 TN</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low text-center">
                <span className="text-label-sm font-bold text-on-surface block">Retour Sous 7j</span>
                <span className="text-[11px] text-outline">Produit non ouvert</span>
              </div>
            </div>
          </div>

          <div className="card p-4 bg-surface-container-low/60 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
            <div className="text-body-sm">
              <strong className="text-on-surface block">Besoin d'aide pour votre commande ?</strong>
              <span className="text-on-surface-variant">
                Nos pharmaciens sont joignables du lundi au samedi de 8h à 19h au {STORE.phone}.
              </span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}
