import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { IMG, PRODUCTS, STORE } from '../data/seed'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const StoreContext = createContext(null)

const INITIAL_CART = [
  {
    slug: 'serum-hydratant-booster-eclat',
    name: 'Sérum Booster Hydratant 30ml',
    brand_name: 'BIODERMA',
    price: 78.5,
    compare_at_price: 95,
    image: IMG.cartSerum,
    variant: 'Flacon 30 ml',
    quantity: 1,
  },
  {
    slug: 'creme-solaire-spf50-invisible-50ml',
    name: 'Crème Solaire SPF 50+ Invisible 50ml',
    brand_name: 'HELIOPROTECT TUNISIE',
    price: 35.0,
    compare_at_price: 42,
    image: IMG.cartSpf,
    variant: '50 ml',
    quantity: 2,
  },
]

const INITIAL_WISHLIST = [
  'serum-hyalu-b5-anti-rides',
  'photoderm-aquafluide-spf50',
  'serum-hydratant-booster-eclat',
]

const DEMO_USER = {
  id: 'demo-yasmine',
  email: 'yasmine.dridi@gmail.com',
  full_name: 'Yasmine Dridi',
  phone: '+216 98 456 789',
  city: 'La Marsa, Tunis',
  skin_profile: 'Peau Mixte & Sensible',
  tier: 'CLIENT PRIVILÈGE OR',
  member_since: 'Septembre 2023',
  loyalty_points: 420,
  avatar: IMG.yasmine,
  isDemo: true,
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('para_cart_v1')
      return saved ? JSON.parse(saved) : INITIAL_CART
    } catch {
      return INITIAL_CART
    }
  })

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('para_wishlist_v1')
      return saved ? JSON.parse(saved) : INITIAL_WISHLIST
    } catch {
      return INITIAL_WISHLIST
    }
  })

  const [lang, setLang] = useState('FR')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [toasts, setToasts] = useState([])
  const [user, setUser] = useState(DEMO_USER)

  useEffect(() => {
    localStorage.setItem('para_cart_v1', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('para_wishlist_v1', JSON.stringify(wishlist))
  }, [wishlist])

  useEffect(() => {
    document.documentElement.dir = lang === 'AR' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang === 'AR' ? 'ar' : lang === 'EN' ? 'en' : 'fr'
  }, [lang])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const u = data.session.user
        setUser({
          ...DEMO_USER,
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || u.email.split('@')[0],
          phone: u.user_metadata?.phone || '+216 98 456 789',
          isDemo: false,
        })
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        setUser({
          ...DEMO_USER,
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || u.email.split('@')[0],
          phone: u.user_metadata?.phone || '+216 98 456 789',
          isDemo: false,
        })
      } else {
        setUser(DEMO_USER)
      }
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  const notify = (message, tone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3400)
  }

  const addToCart = (product, quantity = 1, variant = null) => {
    const price = variant?.price ?? product.price
    const compare = variant?.compare_at_price ?? product.compare_at_price
    const variantLabel = variant?.name || product.volume || null
    const image = product.images?.[0] || product.image || IMG.eclatMain
    const brandName = product.brand_name || product.brand_slug?.toUpperCase() || 'PARA TUNISIE'

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.slug === product.slug && (item.variant || '') === (variantLabel || '')
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          brand_name: brandName,
          price,
          compare_at_price: compare,
          image,
          variant: variantLabel,
          quantity,
        },
      ]
    })
    notify(`« ${product.name.slice(0, 38)}… » ajouté au panier`)
  }

  const updateCartQty = (slug, variant, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.slug === slug && (item.variant || '') === (variant || '')) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (slug, variant) => {
    setCart((prev) =>
      prev.filter((item) => !(item.slug === slug && (item.variant || '') === (variant || '')))
    )
  }

  const clearCart = () => {
    setCart([])
    setAppliedCoupon(null)
  }

  const toggleWishlist = (slug) => {
    setWishlist((prev) => {
      const exists = prev.includes(slug)
      notify(exists ? 'Retiré des favoris' : 'Ajouté à vos favoris', exists ? 'info' : 'success')
      return exists ? prev.filter((s) => s !== slug) : [...prev, slug]
    })
  }

  const reorderItems = (items) => {
    items.forEach((it) => {
      const found = PRODUCTS.find((p) => p.slug === it.product_slug)
      addToCart(
        found || {
          slug: it.product_slug,
          name: it.product_name,
          brand_name: it.brand_name,
          price: it.unit_price,
          images: [it.image_url],
        },
        it.quantity || 1
      )
    })
  }

  const cartSummary = useMemo(() => {
    const itemCount = cart.reduce((acc, it) => acc + it.quantity, 0)
    const subtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0)
    let discount = 0
    let freeShipping = subtotal >= STORE.freeShippingThreshold
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percent') {
        discount = +(subtotal * (appliedCoupon.value / 100)).toFixed(3)
      } else if (appliedCoupon.discount_type === 'fixed') {
        discount = Math.min(subtotal, appliedCoupon.value)
      } else if (appliedCoupon.discount_type === 'shipping') {
        freeShipping = true
      }
    }
    const shippingFee = itemCount === 0 ? 0 : freeShipping ? 0 : STORE.shippingFee
    const total = Math.max(0, +(subtotal - discount + shippingFee).toFixed(3))
    const remainingForFreeShipping = Math.max(0, +(STORE.freeShippingThreshold - subtotal).toFixed(3))
    const freeShippingProgress = Math.min(100, Math.round((subtotal / STORE.freeShippingThreshold) * 100))

    return {
      itemCount,
      subtotal,
      discount,
      shippingFee,
      total,
      freeShipping,
      remainingForFreeShipping,
      freeShippingProgress,
    }
  }, [cart, appliedCoupon])

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartSummary,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        reorderItems,
        wishlist,
        toggleWishlist,
        lang,
        setLang,
        appliedCoupon,
        setAppliedCoupon,
        user,
        setUser,
        notify,
        toasts,
      }}
    >
      {children}
      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fade-in flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-label-md ${
              t.tone === 'error'
                ? 'bg-error text-on-error border-error'
                : t.tone === 'info'
                ? 'bg-inverse-surface text-inverse-on-surface border-inverse-surface'
                : 'bg-primary text-on-primary border-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {t.tone === 'error' ? 'error' : t.tone === 'info' ? 'info' : 'check_circle'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
