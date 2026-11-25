import { supabase, isSupabaseConfigured } from './supabase'
import { PRODUCTS, CATEGORIES, BRANDS, COUPONS, IMG, STORE } from '../data/seed'
import { generateOrderNumber } from './format'

const STORAGE_KEYS = {
  orders: 'para_tunisie_orders_v1',
  reviews: 'para_tunisie_reviews_v1',
  addresses: 'para_tunisie_addresses_v1',
  newsletter: 'para_tunisie_newsletter_v1',
  products: 'para_tunisie_products_v1',
}

const DEFAULT_ORDERS = [
  {
    id: 'ord-84920',
    order_number: '#TN-84920',
    status: 'out_for_delivery',
    payment_method: 'cod',
    customer_name: 'Yasmine Dridi',
    customer_email: 'yasmine.dridi@gmail.com',
    customer_phone: '+216 98 456 789',
    governorate: 'Tunis',
    city: 'La Marsa',
    postal_code: '2070',
    address_line: '14 Rue Habib Bourguiba, Résidence Les Palmiers, Apt B4',
    delivery_notes: 'Bâtiment B, 2ème étage. En cas d’absence, déposer chez la gardienne Mme Fatma.',
    subtotal: 148.5,
    discount: 10.0,
    shipping_fee: 7.0,
    total: 145.5,
    coupon_code: 'TUNISIE10',
    courier_name: 'Bilel Trabelsi',
    courier_phone: '+216 55 123 456',
    tracking_code: 'EXP-TN-9928104',
    estimated_slot: "Aujourd'hui, 14h00 – 17h30",
    created_at: '2025-05-24T09:30:00Z',
    items: [
      {
        product_slug: 'serum-hydratant-booster-eclat',
        product_name: 'Sérum Booster Hydratant 30ml',
        brand_name: 'LABORATOIRE DERMO-EXPERT',
        image_url: IMG.trackSerum,
        unit_price: 78.5,
        quantity: 1,
      },
      {
        product_slug: 'creme-solaire-spf50-invisible-50ml',
        product_name: 'Crème Solaire SPF 50+ Invisible 50ml',
        brand_name: 'HELIOPROTECT TUNISIE',
        image_url: IMG.trackSpf,
        unit_price: 35.0,
        quantity: 2,
      },
    ],
  },
  {
    id: 'ord-79104',
    order_number: '#TN-79104',
    status: 'delivered',
    payment_method: 'cod',
    customer_name: 'Yasmine Dridi',
    customer_email: 'yasmine.dridi@gmail.com',
    customer_phone: '+216 98 456 789',
    governorate: 'Tunis',
    city: 'La Marsa',
    postal_code: '2070',
    address_line: '14 Rue Habib Bourguiba, Résidence Les Palmiers',
    delivery_notes: '',
    subtotal: 218.0,
    discount: 0,
    shipping_fee: 0,
    total: 218.0,
    coupon_code: null,
    courier_name: 'Walid Ben Ali',
    courier_phone: '+216 55 987 654',
    tracking_code: 'EXP-TN-9811203',
    estimated_slot: 'Livré le 12 Avril 2025',
    created_at: '2025-04-12T11:15:00Z',
    items: [
      {
        product_slug: 'sensibio-h2o-micellaire-500ml',
        product_name: 'Sensibio H2O Solution Micellaire 500ml',
        brand_name: 'BIODERMA',
        image_url: IMG.sensibio,
        unit_price: 54.2,
        quantity: 2,
      },
      {
        product_slug: 'cerave-baume-hydratant-454g',
        product_name: 'Baume Hydratant Visage & Corps 454g',
        brand_name: 'CERAVE',
        image_url: IMG.ceraveBaume,
        unit_price: 54.8,
        quantity: 2,
      },
    ],
  },
  {
    id: 'ord-65230',
    order_number: '#TN-65230',
    status: 'delivered',
    payment_method: 'card',
    customer_name: 'Yasmine Dridi',
    customer_email: 'yasmine.dridi@gmail.com',
    customer_phone: '+216 98 456 789',
    governorate: 'Tunis',
    city: 'Les Berges du Lac 2',
    postal_code: '1053',
    address_line: 'Immeuble Le Phénix, 3ème étage',
    delivery_notes: 'Horaire 09h - 18h',
    subtotal: 68.0,
    discount: 0,
    shipping_fee: 0,
    total: 68.0,
    coupon_code: 'LIVRAISON24',
    courier_name: 'Bilel Trabelsi',
    courier_phone: '+216 55 123 456',
    tracking_code: 'EXP-TN-9410299',
    estimated_slot: 'Livré le 28 Janvier 2025',
    created_at: '2025-01-28T14:20:00Z',
    items: [
      {
        product_slug: 'emulsion-reparatrice-nuit-centella',
        product_name: 'Émulsion Réparatrice Nuit Centella 50ml',
        brand_name: 'BIONERA LAB',
        image_url: IMG.botanical,
        unit_price: 68.0,
        quantity: 1,
      },
    ],
  },
]

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    product_slug: 'serum-hydratant-booster-eclat',
    author_name: 'Syrine Y.',
    city: 'Tunis (La Marsa)',
    rating: 5,
    comment: 'Texture ultra légère qui pénètre immédiatement sans effet collant. Ma peau est visiblement plus lumineuse dès la 2ème semaine !',
    verified: true,
    created_at: '2025-05-10T10:00:00Z',
  },
  {
    id: 'rev-2',
    product_slug: 'serum-hydratant-booster-eclat',
    author_name: 'Mariem K.',
    city: 'Sousse (Kantaoui)',
    rating: 5,
    comment: 'Conseillé par le pharmacien sur WhatsApp pour ma peau sensible déshydratée. Livré en 24h avec échantillons offerts.',
    verified: true,
    created_at: '2025-04-28T15:30:00Z',
  },
  {
    id: 'rev-3',
    product_slug: 'serum-hyalu-b5-anti-rides',
    author_name: 'Amel B.',
    city: 'Sfax Ville',
    rating: 5,
    comment: 'Produit 100% original avec code lot vérifiable. Prix très compétitif par rapport aux parapharmacies physiques.',
    verified: true,
    created_at: '2025-05-02T09:15:00Z',
  },
]

const DEFAULT_ADDRESSES = [
  {
    id: 'addr-1',
    label: 'Domicile (La Marsa)',
    is_default: true,
    governorate: 'Tunis',
    city: 'La Marsa',
    postal_code: '2070',
    address_line: 'Résidence Les Palmiers, Rue Habib Bourguiba',
    phone: '+216 98 456 789',
    notes: 'Sonner au 2ème étage',
  },
  {
    id: 'addr-2',
    label: 'Bureau / Travail (Berges du Lac 2)',
    is_default: false,
    governorate: 'Tunis',
    city: 'Les Berges du Lac 2',
    postal_code: '1053',
    address_line: 'Immeuble Le Phénix, 3ème étage',
    phone: '+216 71 888 999',
    notes: 'Horaire : 09h - 18h',
  },
]

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    // ignore quota errors
  }
}

export async function fetchProducts() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .select('*, brands(slug, name), categories(slug, name)')
      .order('created_at', { ascending: false })
    if (!error && data?.length) {
      return data.map((row) => ({
        ...row,
        brand_slug: row.brands?.slug || row.brand_slug,
        brand_name: row.brands?.name || row.brand_slug,
        category_slug: row.categories?.slug || row.category_slug,
      }))
    }
  }
  const custom = readLocal(STORAGE_KEYS.products, null)
  const list = custom || PRODUCTS
  const brandMap = Object.fromEntries(BRANDS.map((b) => [b.slug, b.name]))
  return list.map((item) => ({
    ...item,
    brand_name: item.brand_name || brandMap[item.brand_slug] || item.brand_slug,
  }))
}

export async function fetchCategories() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order')
    if (!error && data?.length) return data
  }
  return CATEGORIES
}

export async function fetchBrands() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('brands').select('*').order('name')
    if (!error && data?.length) return data
  }
  return BRANDS
}

export async function validateCoupon(code, subtotal) {
  const clean = (code || '').trim().toUpperCase()
  if (!clean) return { valid: false, message: 'Veuillez saisir un code promo.' }

  let coupon = null
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', clean)
      .eq('active', true)
      .maybeSingle()
    coupon = data
  }
  if (!coupon) {
    coupon = COUPONS.find((c) => c.code === clean)
  }
  if (!coupon) {
    return { valid: false, message: `Code « ${clean} » invalide ou expiré.` }
  }
  if (coupon.min_order && subtotal < coupon.min_order) {
    return {
      valid: false,
      message: `Ce code s'applique dès ${coupon.min_order.toFixed(3)} TND d'achat.`,
    }
  }
  return { valid: true, coupon }
}

export async function fetchOrders() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (!error && data) {
      return data.map((o) => ({ ...o, items: o.order_items || [] }))
    }
  }
  return readLocal(STORAGE_KEYS.orders, DEFAULT_ORDERS)
}

export async function findOrderByNumber(orderNumber, phone = '') {
  const cleanNum = (orderNumber || '').trim().toUpperCase().replace(/^#?/, '#')
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('order_number', cleanNum)
      .maybeSingle()
    if (data) return { ...data, items: data.order_items || [] }
  }
  const orders = readLocal(STORAGE_KEYS.orders, DEFAULT_ORDERS)
  return (
    orders.find((o) => o.order_number.toUpperCase() === cleanNum) ||
    (phone
      ? orders.find((o) => o.customer_phone.replace(/\s+/g, '').includes(phone.replace(/\s+/g, '')))
      : null) ||
    null
  )
}

export async function createOrder(payload) {
  const orderNumber = generateOrderNumber()
  const now = new Date().toISOString()
  const newOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    status: 'pending',
    courier_name: 'Bilel Trabelsi',
    courier_phone: '+216 55 123 456',
    tracking_code: `EXP-TN-${Math.floor(1000000 + Math.random() * 8999999)}`,
    estimated_slot: payload.governorate === 'Tunis' || payload.governorate === 'Ariana'
      ? 'Demain, 10h00 – 14h00 (Express 24h)'
      : 'Sous 24h à 48h ouvrées',
    created_at: now,
    ...payload,
  }

  if (isSupabaseConfigured) {
    const { items, id: _ignore, ...orderRow } = newOrder
    const { data: inserted, error } = await supabase
      .from('orders')
      .insert(orderRow)
      .select()
      .single()
    if (!error && inserted) {
      const itemRows = items.map((it) => ({
        order_id: inserted.id,
        product_slug: it.product_slug,
        product_name: it.product_name,
        brand_name: it.brand_name,
        image_url: it.image_url,
        unit_price: it.unit_price,
        quantity: it.quantity,
      }))
      await supabase.from('order_items').insert(itemRows)
      return { ...inserted, items }
    }
  }

  const orders = readLocal(STORAGE_KEYS.orders, DEFAULT_ORDERS)
  writeLocal(STORAGE_KEYS.orders, [newOrder, ...orders])
  return newOrder
}

export async function updateOrderStatus(orderNumber, status, deliveryNotes = null) {
  if (isSupabaseConfigured) {
    const patch = { status }
    if (deliveryNotes !== null) patch.delivery_notes = deliveryNotes
    await supabase.from('orders').update(patch).eq('order_number', orderNumber)
  }
  const orders = readLocal(STORAGE_KEYS.orders, DEFAULT_ORDERS)
  const updated = orders.map((o) =>
    o.order_number === orderNumber
      ? { ...o, status, ...(deliveryNotes !== null ? { delivery_notes: deliveryNotes } : {}) }
      : o
  )
  writeLocal(STORAGE_KEYS.orders, updated)
  return updated.find((o) => o.order_number === orderNumber)
}

export async function fetchReviews(productSlug) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_slug', productSlug)
      .order('created_at', { ascending: false })
    if (!error && data) return data
  }
  const all = readLocal(STORAGE_KEYS.reviews, DEFAULT_REVIEWS)
  return all.filter((r) => r.product_slug === productSlug)
}

export async function createReview(review) {
  const entry = {
    id: `rev-${Date.now()}`,
    verified: true,
    created_at: new Date().toISOString(),
    ...review,
  }
  if (isSupabaseConfigured) {
    const { id: _ignore, ...row } = entry
    const { data, error } = await supabase.from('reviews').insert(row).select().single()
    if (!error && data) return data
  }
  const all = readLocal(STORAGE_KEYS.reviews, DEFAULT_REVIEWS)
  writeLocal(STORAGE_KEYS.reviews, [entry, ...all])
  return entry
}

export async function subscribeNewsletter(email) {
  const clean = (email || '').trim().toLowerCase()
  if (!clean || !clean.includes('@')) {
    return { ok: false, message: 'Veuillez entrer une adresse e-mail valide.' }
  }
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email: clean }, { onConflict: 'email' })
    if (!error) {
      return { ok: true, message: 'Inscription confirmée ! Utilisez le code BIENVENUE10 (-10%).' }
    }
  }
  const list = readLocal(STORAGE_KEYS.newsletter, [])
  if (!list.includes(clean)) writeLocal(STORAGE_KEYS.newsletter, [...list, clean])
  return { ok: true, message: 'Inscription confirmée ! Utilisez le code BIENVENUE10 (-10%).' }
}

export function fetchAddresses() {
  return readLocal(STORAGE_KEYS.addresses, DEFAULT_ADDRESSES)
}

export function saveAddresses(list) {
  writeLocal(STORAGE_KEYS.addresses, list)
  return list
}

export async function saveAdminProduct(product) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('products').upsert(product, { onConflict: 'slug' }).select().single()
    if (!error && data) return data
  }
  const current = readLocal(STORAGE_KEYS.products, PRODUCTS)
  const exists = current.some((p) => p.slug === product.slug)
  const next = exists
    ? current.map((p) => (p.slug === product.slug ? { ...p, ...product } : p))
    : [product, ...current]
  writeLocal(STORAGE_KEYS.products, next)
  return product
}

export function getStoreConfig() {
  return STORE
}
