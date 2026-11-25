import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../lib/api'
import { BRANDS, CATEGORIES, SKIN_TYPES, STORE, SUBCATEGORIES } from '../data/seed'
import ProductCard from '../components/ProductCard'

const PAGE_SIZE = 9

export default function CatalogPage({ mode = 'all' }) {
  const { categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [showFilters, setShowFilters] = useState(true)
  const [listView, setListView] = useState(false)
  const [sortBy, setSortBy] = useState('popular')
  const [page, setPage] = useState(1)

  const [selectedSub, setSelectedSub] = useState('')
  const [selectedBrands, setSelectedBrands] = useState(() => {
    const b = searchParams.get('brand')
    return b ? [b] : []
  })
  const [selectedSkins, setSelectedSkins] = useState([])
  const [maxPrice, setMaxPrice] = useState(200)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [promoOnly, setPromoOnly] = useState(mode === 'promotions')

  const query = (searchParams.get('q') || '').trim().toLowerCase()
  const tagParam = searchParams.get('tag') || ''

  useEffect(() => {
    fetchProducts().then(setProducts)
  }, [])

  useEffect(() => {
    const b = searchParams.get('brand')
    if (b && !selectedBrands.includes(b)) setSelectedBrands([b])
    setPromoOnly(mode === 'promotions')
    setPage(1)
  }, [categorySlug, mode, searchParams])

  const category = CATEGORIES.find((c) => c.slug === categorySlug)
  const subcategories = SUBCATEGORIES[categorySlug] || []

  const toggleBrand = (slug) => {
    setPage(1)
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((b) => b !== slug) : [...prev, slug]
    )
  }

  const toggleSkin = (val) => {
    setPage(1)
    setSelectedSkins((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    )
  }

  const clearAllFilters = () => {
    setSelectedSub('')
    setSelectedBrands([])
    setSelectedSkins([])
    setMaxPrice(200)
    setInStockOnly(false)
    setPromoOnly(mode === 'promotions')
    if (searchParams.toString()) setSearchParams({})
    setPage(1)
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (categorySlug) list = list.filter((p) => p.category_slug === categorySlug)
    if (mode === 'new') list = list.filter((p) => p.is_new)
    if (promoOnly || mode === 'promotions') {
      list = list.filter((p) => p.compare_at_price && p.compare_at_price > p.price)
    }
    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.brand_name || '').toLowerCase().includes(query) ||
          (p.short_description || '').toLowerCase().includes(query)
      )
    }
    if (tagParam) {
      list = list.filter((p) => p.tags?.includes(tagParam))
    }
    if (selectedSub) {
      list = list.filter((p) => p.subcategory === selectedSub)
    }
    if (selectedBrands.length) {
      list = list.filter((p) => selectedBrands.includes(p.brand_slug))
    }
    if (selectedSkins.length) {
      list = list.filter((p) => p.skin_types?.some((s) => selectedSkins.includes(s)))
    }
    if (maxPrice < 200) {
      list = list.filter((p) => p.price <= maxPrice)
    }
    if (inStockOnly) {
      list = list.filter((p) => (p.stock ?? 1) > 0)
    }

    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        list.sort((a, b) => Number(b.is_new) - Number(a.is_new))
        break
      default:
        list.sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    }
    return list
  }, [
    products,
    categorySlug,
    mode,
    promoOnly,
    query,
    tagParam,
    selectedSub,
    selectedBrands,
    selectedSkins,
    maxPrice,
    inStockOnly,
    sortBy,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageTitle =
    mode === 'promotions'
      ? 'Promotions & Offres Privilège'
      : mode === 'new'
      ? 'Nouveautés & Soins Naturels'
      : category?.title || 'Catalogue Parapharmacie Tunisie'

  const pageDesc =
    category?.description ||
    "Découvrez l'ensemble de nos soins dermo-cosmétiques 100% authentiques, validés par nos docteurs en pharmacie et livrés partout en Tunisie."

  const activeFilterCount =
    selectedBrands.length +
    selectedSkins.length +
    (selectedSub ? 1 : 0) +
    (maxPrice < 200 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (promoOnly && mode !== 'promotions' ? 1 : 0) +
    (query ? 1 : 0)

  return (
    <div className="w-full pb-16">
      {/* Trust Strip */}
      <div className="w-full bg-secondary-container/70 border-b border-primary/10 py-2 px-4 lg:px-8">
        <div className="max-w-site mx-auto flex flex-wrap items-center justify-between gap-2 text-label-sm text-on-secondary-fixed">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-sm text-primary">verified</span>
            100% Produits Pharmaceutiques Certifiés • Importation Officielle &amp; Traçabilité
          </span>
          <div className="hidden sm:flex items-center gap-4">
            <span>• Expédition Express Grand Tunis 24h</span>
            <span>• Paiement sécurisé à la livraison (الدفع عند الاستلام)</span>
          </div>
        </div>
      </div>

      <div className="max-w-site mx-auto px-4 lg:px-8 pt-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-body-sm text-outline mb-5">
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">home</span>
            Accueil
          </Link>
          <span>/</span>
          <Link to="/catalogue" className="hover:text-primary">
            Catalogue
          </Link>
          {category && (
            <>
              <span>/</span>
              <span className="text-on-surface font-semibold">{category.title}</span>
            </>
          )}
        </nav>

        {/* Category Hero Header */}
        <div className="card p-6 lg:p-8 mb-6 bg-gradient-to-r from-surface-container-lowest to-surface-container-low/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="badge bg-secondary-container text-primary">
                  DERMO-COSMÉTIQUE OFFICINALE
                </span>
                <span className="badge bg-surface-container text-on-surface-variant">
                  Conseillé par les dermatologues
                </span>
              </div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface">
                {pageTitle}
              </h1>
              <p className="text-body-md text-on-surface-variant mt-2">{pageDesc}</p>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-lowest px-5 py-3.5 rounded-2xl border border-outline-variant/30 shrink-0 self-start lg:self-center">
              <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <p className="text-headline-md text-on-surface leading-none">{filtered.length}</p>
                <p className="text-label-sm text-outline uppercase mt-0.5">Produits disponibles</p>
              </div>
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-5 mt-5 border-t border-outline-variant/30">
            <span className="text-label-sm text-outline uppercase shrink-0 mr-1">
              Filtres rapides :
            </span>
            <Link
              to="/catalogue"
              className={`chip ${!categorySlug && mode === 'all' ? 'chip-active' : ''}`}
            >
              Tous ({products.length})
            </Link>
            {CATEGORIES.slice(0, 6).map((c) => (
              <Link
                key={c.slug}
                to={`/catalogue/${c.slug}`}
                className={`chip ${categorySlug === c.slug ? 'chip-active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="chip font-semibold"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>{showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}</span>
            </button>
            <span className="text-body-sm text-on-surface-variant">
              Affichage de <strong>{paginated.length}</strong> sur{' '}
              <strong>{filtered.length}</strong> résultats
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-outline hidden sm:inline">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 rounded-full bg-surface-container-lowest border border-outline-variant/50 text-label-md text-on-surface outline-none focus:border-primary"
              >
                <option value="popular">Plus populaires (Recommandés)</option>
                <option value="price_asc">Prix croissant (TND)</option>
                <option value="price_desc">Prix décroissant (TND)</option>
                <option value="rating">Meilleures notes</option>
                <option value="newest">Nouveautés</option>
              </select>
            </div>
            <div className="hidden sm:flex items-center bg-surface-container-lowest rounded-full border border-outline-variant/40 p-0.5">
              <button
                type="button"
                onClick={() => setListView(false)}
                aria-label="Vue grille"
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  !listView ? 'bg-primary text-on-primary' : 'text-outline'
                }`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setListView(true)}
                aria-label="Vue liste"
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  listView ? 'bg-primary text-on-primary' : 'text-outline'
                }`}
              >
                <span className="material-symbols-outlined text-lg">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-label-sm text-outline uppercase">Filtres actifs :</span>
            {query && (
              <span className="chip bg-secondary-container/70 border-primary/20 text-primary">
                Recherche : « {query} »
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.delete('q')
                    setSearchParams(next)
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {selectedBrands.map((b) => (
              <span
                key={b}
                className="chip bg-secondary-container/70 border-primary/20 text-primary"
              >
                Marque : {BRANDS.find((x) => x.slug === b)?.name || b}
                <button type="button" onClick={() => toggleBrand(b)}>
                  ×
                </button>
              </span>
            ))}
            {selectedSkins.map((s) => (
              <span
                key={s}
                className="chip bg-secondary-container/70 border-primary/20 text-primary"
              >
                Peau : {SKIN_TYPES.find((x) => x.value === s)?.label || s}
                <button type="button" onClick={() => toggleSkin(s)}>
                  ×
                </button>
              </span>
            ))}
            {maxPrice < 200 && (
              <span className="chip bg-secondary-container/70 border-primary/20 text-primary">
                Max {maxPrice} TND
                <button type="button" onClick={() => setMaxPrice(200)}>
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-label-md text-primary hover:underline ml-1"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Main Grid: Sidebar + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar */}
          {showFilters && (
            <aside className="lg:col-span-3 card p-5 space-y-6 lg:sticky lg:top-[170px]">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">filter_list</span>
                  Filtres Détaillés
                </h2>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-label-sm text-primary hover:underline"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Subcategories */}
              {subcategories.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-label-lg text-on-surface">Sous-Catégorie</h3>
                  <label className="flex items-center gap-2.5 text-body-md cursor-pointer">
                    <input
                      type="radio"
                      name="subcat"
                      checked={selectedSub === ''}
                      onChange={() => {
                        setSelectedSub('')
                        setPage(1)
                      }}
                      className="accent-primary w-4 h-4"
                    />
                    <span>Toutes les crèmes &amp; soins</span>
                  </label>
                  {subcategories.map((sub) => (
                    <label
                      key={sub.value}
                      className="flex items-center gap-2.5 text-body-md cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="subcat"
                        checked={selectedSub === sub.value}
                        onChange={() => {
                          setSelectedSub(sub.value)
                          setPage(1)
                        }}
                        className="accent-primary w-4 h-4"
                      />
                      <span>{sub.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Price Range */}
              <div className="space-y-2.5 pt-4 border-t border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-label-lg text-on-surface">Prix en Dinars (TND)</h3>
                  <span className="text-label-md text-primary font-bold">
                    ≤ {maxPrice} TND
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={5}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value))
                    setPage(1)
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-body-sm text-outline">
                  <span>20 TND</span>
                  <span>200 TND</span>
                </div>
              </div>

              {/* Brands */}
              <div className="space-y-2 pt-4 border-t border-outline-variant/30">
                <h3 className="text-label-lg text-on-surface">Laboratoires &amp; Marques</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {BRANDS.slice(0, 10).map((b) => (
                    <label
                      key={b.slug}
                      className="flex items-center justify-between text-body-md cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(b.slug)}
                          onChange={() => toggleBrand(b.slug)}
                          className="accent-primary w-4 h-4 rounded"
                        />
                        <span>{b.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Skin Type */}
              <div className="space-y-2.5 pt-4 border-t border-outline-variant/30">
                <h3 className="text-label-lg text-on-surface">Type de Peau</h3>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map((st) => {
                    const active = selectedSkins.includes(st.value)
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => toggleSkin(st.value)}
                        className={`px-3 py-1.5 rounded-full text-label-md border transition-colors ${
                          active
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-primary'
                        }`}
                      >
                        {st.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Availability & Promos */}
              <div className="space-y-2 pt-4 border-t border-outline-variant/30">
                <h3 className="text-label-lg text-on-surface">Disponibilité &amp; Promos</h3>
                <label className="flex items-center gap-2 text-body-md cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked)
                      setPage(1)
                    }}
                    className="accent-primary w-4 h-4"
                  />
                  <span>En stock immédiat (Dispo Tunis)</span>
                </label>
                <label className="flex items-center gap-2 text-body-md cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoOnly}
                    onChange={(e) => {
                      setPromoOnly(e.target.checked)
                      setPage(1)
                    }}
                    className="accent-primary w-4 h-4"
                  />
                  <span>En promotion active</span>
                </label>
              </div>

              {/* Pharmacist Help Box */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/15 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-label-lg">
                  <span className="material-symbols-outlined">support_agent</span>
                  <span>Besoin d'un conseil ?</span>
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  Nos pharmaciens diplômés répondent à vos interrogations dermato en direct sur WhatsApp.
                </p>
                <a
                  href={`https://wa.me/${STORE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-label-md text-primary font-bold hover:underline"
                >
                  Discuter avec l'officine
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </aside>
          )}

          {/* Product Grid */}
          <div className={showFilters ? 'lg:col-span-9' : 'lg:col-span-12'}>
            {paginated.length === 0 ? (
              <div className="card p-12 text-center space-y-4">
                <span className="material-symbols-outlined text-5xl text-outline">
                  search_off
                </span>
                <h3 className="text-headline-sm text-on-surface">
                  Aucun produit ne correspond à vos filtres
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Essayez d'élargir votre budget ou de réinitialiser les filtres actifs.
                </p>
                <button type="button" onClick={clearAllFilters} className="btn-primary">
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div
                className={
                  listView
                    ? 'flex flex-col gap-4'
                    : showFilters
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
                }
              >
                {paginated.map((prod) => (
                  <ProductCard key={prod.slug} product={prod} listView={listView} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between flex-wrap gap-4">
                <span className="text-body-sm text-outline">
                  Page {page} sur {totalPages} ({filtered.length} produits)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="w-9 h-9 rounded-full border border-outline-variant/50 flex items-center justify-center disabled:opacity-40 hover:border-primary"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-full text-label-md font-bold transition-colors ${
                        n === page
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface hover:border-primary'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="w-9 h-9 rounded-full border border-outline-variant/50 flex items-center justify-center disabled:opacity-40 hover:border-primary"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>
            )}

            {/* Express Delivery Banner */}
            <div className="mt-10 card p-5 bg-secondary-container/40 border-primary/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                  <h4 className="text-label-lg font-bold text-on-surface">
                    Livraison express dans toute la Tunisie
                  </h4>
                  <p className="text-body-sm text-on-surface-variant">
                    Grand Tunis (Tunis, Ariana, Ben Arous, Manouba) en 24h • Sousse, Sfax, Bizerte, Nabeul et tous les gouvernorats sous 24-48h avec contrôle du colis à l'arrivée.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-label-md font-bold text-on-surface border border-outline-variant/40">
                  Frais fixes : 7.000 DT
                </span>
                <span className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-label-md font-bold">
                  Gratuit dès 99 DT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
