import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createReview, fetchProducts, fetchReviews } from '../lib/api'
import { CATEGORIES, IMG, STORE } from '../data/seed'
import { useStore } from '../context/StoreContext'
import { formatDateFr, formatTND, getDiscountPercent } from '../lib/format'
import Stars from '../components/Stars'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, wishlist, toggleWishlist, notify } = useStore()

  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [zoomed, setZoomed] = useState(false)

  // Review form state
  const [revAuthor, setRevAuthor] = useState('')
  const [revCity, setRevCity] = useState('Tunis')
  const [revRating, setRevRating] = useState(5)
  const [revComment, setRevComment] = useState('')

  useEffect(() => {
    fetchProducts().then(setProducts)
  }, [])

  useEffect(() => {
    setActiveImage(0)
    setSelectedVariantIdx(0)
    setQty(1)
    setActiveTab('description')
    if (slug) fetchReviews(slug).then(setReviews)
  }, [slug])

  const product = useMemo(
    () => products.find((p) => p.slug === slug) || products[0],
    [products, slug]
  )

  const routineProducts = useMemo(() => {
    if (!products.length || !product) return []
    const others = products.filter((p) => p.slug !== product.slug)
    const preferred = [
      'bioderma-gel-moussant-apaisant',
      'bioderma-creme-hydratante-legere',
      'fluide-invisible-spf50-40ml',
      'bioderma-gel-contour-yeux',
    ]
    const matched = preferred
      .map((s) => others.find((p) => p.slug === s))
      .filter(Boolean)
    return matched.length === 4 ? matched : others.slice(0, 4)
  }, [products, product])

  if (!product) {
    return (
      <div className="max-w-site mx-auto px-4 py-24 text-center text-outline">
        Chargement du soin...
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.slug === product.category_slug)
  const variant = product.variants?.length ? product.variants[selectedVariantIdx] : null
  const activePrice = variant?.price ?? product.price
  const activeCompare = variant?.compare_at_price ?? product.compare_at_price
  const discount = getDiscountPercent(activePrice, activeCompare)
  const savings = activeCompare && activeCompare > activePrice ? activeCompare - activePrice : 0
  const isFav = wishlist.includes(product.slug)
  const images = product.images?.length ? product.images : [IMG.eclatMain]

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!revAuthor.trim() || !revComment.trim()) return
    const created = await createReview({
      product_slug: product.slug,
      author_name: revAuthor.trim(),
      city: revCity.trim() || 'Tunisie',
      rating: revRating,
      comment: revComment.trim(),
    })
    setReviews((prev) => [created, ...prev])
    setRevAuthor('')
    setRevComment('')
    notify('Merci ! Votre avis vérifié a été publié.')
  }

  const handleQuickBuy = () => {
    addToCart(product, qty, variant)
    navigate('/panier')
  }

  return (
    <div className="w-full pb-16">
      <div className="max-w-site mx-auto px-4 lg:px-8 pt-6">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-2 text-body-sm text-outline mb-6">
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">home</span>
            Accueil
          </Link>
          <span>/</span>
          {category && (
            <>
              <Link to={`/catalogue/${category.slug}`} className="hover:text-primary">
                {category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-on-surface font-semibold truncate">{product.name}</span>
        </nav>

        {/* Main 2-Column Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Gallery + Clinical Reassurance */}
          <div className="lg:col-span-7 space-y-5">
            <div className="card p-4 sm:p-6 relative">
              <div className="flex items-start justify-between absolute top-5 left-5 right-5 z-10 pointer-events-none">
                <div className="flex flex-col gap-1.5 pointer-events-auto">
                  <span className="badge bg-primary text-on-primary px-3 py-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    AUTHENTICITÉ LABORATOIRE
                  </span>
                  {discount > 0 && (
                    <span className="badge bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 w-fit">
                      -{discount}% REMISE
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.slug)}
                  aria-label="Ajouter aux favoris"
                  className={`pointer-events-auto w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors ${
                    isFav
                      ? 'bg-error-container text-error'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:text-error'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isFav ? 'icon-fill' : ''}`}>
                    favorite
                  </span>
                </button>
              </div>

              <div className="relative w-full aspect-[4/3] rounded-2xl bg-surface-bright overflow-hidden flex items-center justify-center p-4">
                <img
                  src={images[activeImage] || images[0]}
                  alt={product.name}
                  className={`w-full h-full object-contain transition-transform duration-300 ${
                    zoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onClick={() => setZoomed((z) => !z)}
                />
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur text-label-sm text-on-surface shadow border border-outline-variant/30 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {zoomed ? 'zoom_out' : 'zoom_in'}
                  </span>
                  {zoomed ? 'Réduire' : 'Zoom texture'}
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                  {images.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveImage(idx)
                        setZoomed(false)
                      }}
                      className={`aspect-square rounded-xl overflow-hidden bg-surface-bright p-1.5 border-2 transition-all ${
                        activeImage === idx
                          ? 'border-primary shadow-sm'
                          : 'border-transparent hover:border-outline-variant'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3 Clinical Reassurance Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: 'science',
                  title: 'Testé Cliniquement',
                  sub: 'Hypoallergénique, non comédogène',
                },
                {
                  icon: 'spa',
                  title: 'Haute Tolérance',
                  sub: 'Peaux sensibles & déshydratées',
                },
                {
                  icon: 'verified_user',
                  title: 'Garantie Traçabilité',
                  sub: 'Importation officielle certifiée',
                },
              ].map((tile) => (
                <div key={tile.title} className="card p-4 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2">
                    {tile.icon}
                  </span>
                  <h4 className="text-label-md font-bold text-on-surface">{tile.title}</h4>
                  <p className="text-body-sm text-outline mt-0.5">{tile.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Purchase Panel */}
          <div className="lg:col-span-5 card p-6 lg:p-7 space-y-5 lg:sticky lg:top-[170px]">
            <div className="flex items-center justify-between gap-2">
              <span className="badge bg-secondary-container text-primary px-3 py-1">
                LABORATOIRE {product.brand_name || product.brand_slug}
              </span>
              <span className="text-label-sm font-bold text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                En stock à Tunis
              </span>
            </div>

            <div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface leading-tight">
                {product.name}
              </h1>
              <p className="text-body-md text-on-surface-variant mt-2">
                {product.short_description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Stars rating={product.rating} size="text-base" />
              <span className="text-label-md font-bold text-on-surface">
                {product.rating.toFixed(1)}/5
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="text-body-sm text-primary underline"
              >
                {product.review_count + reviews.length} avis vérifiés
              </button>
            </div>

            {/* Price Block */}
            <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold text-primary tracking-tight">
                  {activePrice.toFixed(3)}{' '}
                  <span className="text-base font-bold">TND</span>
                </span>
                {activeCompare && (
                  <span className="text-body-lg text-outline line-through">
                    {formatTND(activeCompare)}
                  </span>
                )}
                {savings > 0 && (
                  <span className="badge bg-error-container text-on-error-container px-2.5 py-1">
                    Économisez {savings.toFixed(3)} DT
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-body-sm text-outline mt-2">
                <span>Prix public TTC conseillé</span>
                <span>TVA incluse (19%)</span>
              </div>
            </div>

            {/* Format Variants */}
            {product.variants?.length > 0 && (
              <div className="space-y-2">
                <span className="text-label-sm uppercase text-outline font-bold">
                  Contenance / Format :
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setSelectedVariantIdx(i)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedVariantIdx === i
                          ? 'border-primary bg-secondary-container/30'
                          : 'border-outline-variant/40 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-label-lg font-bold text-on-surface">{v.name}</span>
                        {selectedVariantIdx === i && (
                          <span className="material-symbols-outlined text-primary text-base icon-fill">
                            check_circle
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-outline mt-0.5">
                        {v.price.toFixed(3)} TND • {v.note}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Subtotal */}
            <div className="flex items-center justify-between pt-2">
              <div className="inline-flex items-center rounded-full border border-outline-variant/60 bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center font-bold"
                >
                  −
                </button>
                <span className="w-10 text-center text-label-lg font-bold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <span className="text-label-sm text-outline block">Sous-total panier</span>
                <span className="text-headline-sm text-on-surface font-bold">
                  {(activePrice * qty).toFixed(3)} TND
                </span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addToCart(product, qty, variant)}
                className="btn-primary w-full"
              >
                <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                <span>Ajouter au panier</span>
              </button>
              <button
                type="button"
                onClick={handleQuickBuy}
                className="btn-secondary w-full"
              >
                <span>Commander vite</span>
                <span className="material-symbols-outlined text-lg">bolt</span>
              </button>
            </div>

            {/* Tunisia Delivery & COD Info Box */}
            <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 space-y-3 text-body-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">local_shipping</span>
                <div>
                  <strong className="text-on-surface block">Livraison Express 24h à 48h</strong>
                  <span className="text-on-surface-variant">
                    Grand Tunis (Tunis, Ariana, Ben Arous, Manouba) &amp; les 24 gouvernorats tunisiens.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">payments</span>
                <div>
                  <strong className="text-on-surface block">
                    Paiement à la livraison <span className="text-primary">(الدفع عند الاستلام)</span>
                  </strong>
                  <span className="text-on-surface-variant">
                    Réglez en espèces à réception de votre colis auprès du livreur ou par carte ClicToPay.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">support_agent</span>
                <div>
                  <strong className="text-on-surface block">Conseil d'Officine Direct</strong>
                  <span className="text-on-surface-variant">
                    Une question dermatologique ? Contactez nos pharmaciens sur WhatsApp au {STORE.phone}.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Detail Tabs */}
        <section className="mt-14">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-outline-variant/30">
            {[
              { id: 'description', label: 'Description & Bénéfices' },
              { id: 'usage', label: "Conseils d'application & Rituel" },
              { id: 'ingredients', label: 'Formule & Ingrédients Clés' },
              { id: 'reviews', label: `Avis Clients (${product.review_count + reviews.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`chip ${activeTab === t.id ? 'chip-active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="card p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <span className="section-eyebrow">INNOVATION DERMO-COSMÉTIQUE</span>
                  <h2 className="text-headline-md text-on-surface">
                    Efficacité prouvée sous contrôle dermatologique
                  </h2>
                  <p className="text-body-lg text-on-surface-variant leading-relaxed">
                    {product.short_description} Formulé pour résister aux exigences du climat méditerranéen tunisien tout en respectant la barrière cutanée des peaux les plus exigeantes.
                  </p>
                  {product.benefits?.length > 0 && (
                    <ul className="space-y-2">
                      {product.benefits.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-body-md text-on-surface">
                          <span className="material-symbols-outlined text-primary text-lg icon-fill">
                            check_circle
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-3">
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                      <p className="text-headline-lg text-primary font-extrabold">+84%</p>
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        d'hydratation immédiate mesurée cliniquement dès la 1ère heure.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                      <p className="text-headline-lg text-primary font-extrabold">96%</p>
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        des testeuses constatent un teint repulpé et plus lumineux après 14 jours.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
                    <img
                      src={IMG.resultWoman}
                      alt="Résultats visibles"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-inverse-surface/80 text-inverse-on-surface text-label-sm">
                      Résultats observés sur 45 femmes pendant 28 jours
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="card p-6 lg:p-8 space-y-4">
                <h3 className="text-headline-md text-on-surface">
                  Protocole d'application officinal
                </h3>
                <p className="text-body-lg text-on-surface-variant leading-relaxed">
                  {product.usage ||
                    'Appliquer matin et soir sur une peau propre et sèche par mouvements circulaires doux.'}
                </p>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="card p-6 lg:p-8 space-y-4">
                <h3 className="text-headline-md text-on-surface">
                  Composition &amp; Actifs Dermatologiques
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {product.ingredients || 'Formule haute tolérance sans parabènes, testée sous contrôle dermatologique.'}
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-4">
                  {reviews.length === 0 ? (
                    <div className="card p-6 text-body-md text-outline">
                      Soyez la première à partager votre avis sur ce soin !
                    </div>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="card p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-label-lg text-on-surface">
                              {r.author_name}
                            </span>
                            <span className="text-body-sm text-outline">• {r.city}</span>
                            {r.verified && (
                              <span className="badge bg-secondary-container text-primary">
                                Achat vérifié
                              </span>
                            )}
                          </div>
                          <span className="text-body-sm text-outline">
                            {formatDateFr(r.created_at)}
                          </span>
                        </div>
                        <Stars rating={r.rating} />
                        <p className="text-body-md text-on-surface-variant">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleReviewSubmit} className="lg:col-span-5 card p-6 space-y-4">
                  <h3 className="text-headline-sm text-on-surface">Donner votre avis</h3>
                  <div>
                    <label className="label">Votre nom *</label>
                    <input
                      type="text"
                      required
                      value={revAuthor}
                      onChange={(e) => setRevAuthor(e.target.value)}
                      placeholder="Ex: Ines M."
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Ville</label>
                      <input
                        type="text"
                        value={revCity}
                        onChange={(e) => setRevCity(e.target.value)}
                        placeholder="Tunis, Sousse..."
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Note</label>
                      <select
                        value={revRating}
                        onChange={(e) => setRevRating(Number(e.target.value))}
                        className="input"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} / 5 étoiles
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Votre commentaire *</label>
                    <textarea
                      required
                      rows={3}
                      value={revComment}
                      onChange={(e) => setRevComment(e.target.value)}
                      placeholder="Partagez votre expérience avec ce produit..."
                      className="input"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    Publier mon avis
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Complementary Routine */}
        <section className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="section-eyebrow">RITUEL RECOMMANDÉ</span>
              <h2 className="section-title mt-1">Complétez votre routine éclat</h2>
              <p className="text-body-md text-on-surface-variant">
                Combinez ces soins essentiels pour maximiser l'efficacité de votre routine.
              </p>
            </div>
            <Link
              to="/catalogue/soins-visage"
              className="text-label-lg text-primary font-semibold hover:underline hidden sm:inline-flex items-center gap-1"
            >
              Voir toute la gamme
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {routineProducts.map((rp, idx) => (
              <div key={rp.slug} className="card p-4 flex flex-col justify-between">
                <div>
                  <span className="badge bg-secondary-container text-primary mb-2">
                    {idx === 0 ? 'Étape 1' : idx === 1 ? 'Étape 3' : idx === 2 ? 'Étape 4' : 'Ciblage'}
                  </span>
                  <Link
                    to={`/produit/${rp.slug}`}
                    className="block aspect-square rounded-xl bg-surface-bright p-3 mb-3 overflow-hidden"
                  >
                    <img
                      src={rp.images?.[0]}
                      alt={rp.name}
                      className="w-full h-full object-contain hover:scale-105 transition-transform"
                    />
                  </Link>
                  <span className="text-label-sm uppercase text-outline font-bold">
                    {rp.brand_name || rp.brand_slug}
                  </span>
                  <Link
                    to={`/produit/${rp.slug}`}
                    className="block text-label-lg font-semibold text-on-surface line-clamp-1 hover:text-primary mt-0.5"
                  >
                    {rp.name}
                  </Link>
                  <div className="mt-1">
                    <Stars rating={rp.rating} count={rp.review_count} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/30">
                  <div>
                    <span className="text-label-lg font-bold text-primary block">
                      {rp.price.toFixed(3)} DT
                    </span>
                    {rp.compare_at_price && (
                      <span className="text-body-sm text-outline line-through">
                        {rp.compare_at_price.toFixed(3)} DT
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(rp, 1)}
                    aria-label="Ajouter au panier"
                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
