import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders, fetchProducts, saveAdminProduct, updateOrderStatus } from '../lib/api'
import { BRANDS, CATEGORIES, IMG, ORDER_STATUSES } from '../data/seed'
import { isSupabaseConfigured } from '../lib/supabase'
import { formatDateFr } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function AdminPage() {
  const { notify } = useStore()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [newProd, setNewProd] = useState({
    name: '',
    brand_slug: 'la-roche-posay',
    category_slug: 'soins-visage',
    price: 55,
    compare_at_price: 68,
    stock: 25,
    short_description: '',
  })

  useEffect(() => {
    fetchOrders().then(setOrders)
    fetchProducts().then(setProducts)
  }, [])

  const handleStatusChange = async (orderNumber, status) => {
    const updated = await updateOrderStatus(orderNumber, status)
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.order_number === orderNumber ? updated : o)))
      notify(`Statut de ${orderNumber} mis à jour.`)
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!newProd.name.trim()) return
    const slug =
      newProd.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString().slice(-4)

    const brand = BRANDS.find((b) => b.slug === newProd.brand_slug)
    const entry = {
      slug,
      name: newProd.name.trim(),
      brand_slug: newProd.brand_slug,
      brand_name: brand?.name || newProd.brand_slug,
      category_slug: newProd.category_slug,
      price: Number(newProd.price),
      compare_at_price: Number(newProd.compare_at_price) || null,
      stock: Number(newProd.stock) || 20,
      rating: 4.8,
      review_count: 1,
      images: [IMG.eclatMain],
      is_new: true,
      is_bestseller: false,
      skin_types: ['sensible'],
      tags: ['hydratation'],
      short_description: newProd.short_description.trim() || 'Soin dermo-cosmétique certifié.',
    }
    await saveAdminProduct(entry)
    setProducts((prev) => [entry, ...prev])
    setNewProd({
      name: '',
      brand_slug: 'la-roche-posay',
      category_slug: 'soins-visage',
      price: 55,
      compare_at_price: 68,
      stock: 25,
      short_description: '',
    })
    notify('Produit ajouté au catalogue !')
  }

  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total || 0), 0)

  return (
    <div className="max-w-site mx-auto px-4 lg:px-8 py-8 pb-16 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow">Back-Office Officinal</span>
          <h1 className="text-headline-lg text-on-surface">Espace Admin — Para Tunisie</h1>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-label-md border ${
            isSupabaseConfigured
              ? 'bg-secondary-container text-primary border-primary/20'
              : 'bg-tertiary-fixed/40 text-on-tertiary-fixed border-tertiary/20'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isSupabaseConfigured ? 'bg-primary' : 'bg-tertiary'
            }`}
          />
          {isSupabaseConfigured
            ? 'Connecté à Supabase PostgreSQL'
            : 'Mode Démo Local (connectez .env pour Supabase)'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <span className="text-label-sm uppercase text-outline">Commandes</span>
          <p className="text-headline-lg text-on-surface mt-1">{orders.length}</p>
        </div>
        <div className="card p-5">
          <span className="text-label-sm uppercase text-outline">Chiffre d'affaires</span>
          <p className="text-headline-lg text-primary mt-1">{totalRevenue.toFixed(3)} TND</p>
        </div>
        <div className="card p-5">
          <span className="text-label-sm uppercase text-outline">Produits actifs</span>
          <p className="text-headline-lg text-on-surface mt-1">{products.length}</p>
        </div>
        <div className="card p-5">
          <span className="text-label-sm uppercase text-outline">Gouvernorats couverts</span>
          <p className="text-headline-lg text-on-surface mt-1">24 / 24</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`chip ${tab === 'orders' ? 'chip-active' : ''}`}
        >
          Gestion des Commandes ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`chip ${tab === 'products' ? 'chip-active' : ''}`}
        >
          Catalogue Produits ({products.length})
        </button>
      </div>

      {tab === 'orders' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 text-label-sm uppercase text-outline bg-surface-container-low/50">
                <th className="p-4">Référence</th>
                <th className="p-4">Client</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Total</th>
                <th className="p-4">Statut Livraison</th>
                <th className="p-4">Suivi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-body-md">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-container-low/30">
                  <td className="p-4 font-bold">
                    {o.order_number}
                    <span className="block text-body-sm text-outline font-normal">
                      {formatDateFr(o.created_at)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold block">{o.customer_name}</span>
                    <span className="text-body-sm text-outline">{o.customer_phone}</span>
                  </td>
                  <td className="p-4">
                    {o.city}, {o.governorate}
                  </td>
                  <td className="p-4 font-bold text-primary">
                    {Number(o.total).toFixed(3)} TND
                  </td>
                  <td className="p-4">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.order_number, e.target.value)}
                      className="h-9 px-3 rounded-full bg-surface border border-outline-variant/60 text-label-md font-semibold outline-none focus:border-primary"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/suivi-commande?order=${encodeURIComponent(o.order_number)}`}
                      className="text-label-md text-primary font-semibold hover:underline"
                    >
                      Voir GPS →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreateProduct} className="lg:col-span-4 card p-6 space-y-4">
            <h2 className="text-headline-sm text-on-surface">Ajouter un produit</h2>
            <div>
              <label className="label">Nom du soin *</label>
              <input
                required
                value={newProd.name}
                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                placeholder="Ex: Sérum Vitamine C10 30ml"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Marque</label>
                <select
                  value={newProd.brand_slug}
                  onChange={(e) => setNewProd({ ...newProd, brand_slug: e.target.value })}
                  className="input"
                >
                  {BRANDS.map((b) => (
                    <option key={b.slug} value={b.slug}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select
                  value={newProd.category_slug}
                  onChange={(e) => setNewProd({ ...newProd, category_slug: e.target.value })}
                  className="input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Prix (TND)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newProd.price}
                  onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Ancien prix</label>
                <input
                  type="number"
                  step="0.1"
                  value={newProd.compare_at_price}
                  onChange={(e) => setNewProd({ ...newProd, compare_at_price: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Stock</label>
                <input
                  type="number"
                  value={newProd.stock}
                  onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Description courte</label>
              <textarea
                rows={2}
                value={newProd.short_description}
                onChange={(e) => setNewProd({ ...newProd, short_description: e.target.value })}
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Enregistrer le produit
            </button>
          </form>

          <div className="lg:col-span-8 card overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 text-label-sm uppercase text-outline bg-surface-container-low/50">
                  <th className="p-3.5">Produit</th>
                  <th className="p-3.5">Marque</th>
                  <th className="p-3.5">Prix</th>
                  <th className="p-3.5">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-body-sm">
                {products.slice(0, 15).map((p) => (
                  <tr key={p.slug}>
                    <td className="p-3.5 font-semibold">
                      <Link to={`/produit/${p.slug}`} className="hover:text-primary">
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3.5 text-outline">{p.brand_name || p.brand_slug}</td>
                    <td className="p-3.5 font-bold text-primary">{Number(p.price).toFixed(3)} TND</td>
                    <td className="p-3.5">{p.stock ?? 30}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
