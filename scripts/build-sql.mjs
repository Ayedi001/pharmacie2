import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { BRANDS, CATEGORIES, COUPONS, IMG, PRODUCTS } from '../src/data/seed.js'

const esc = (v) => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return `'${String(v).replace(/'/g, "''")}'`
}

const escJson = (v) => `'${JSON.stringify(v ?? []).replace(/'/g, "''")}'::jsonb`
const escTextArr = (arr) => {
  if (!arr || !arr.length) return `'{}'::text[]`
  return `ARRAY[${arr.map((x) => esc(x)).join(', ')}]::text[]`
}

const lines = []

lines.push(`-- ============================================================================
-- PARA TUNISIE — Parapharmacie E-Commerce Platform
-- Complete Supabase PostgreSQL Schema, RLS Policies & Seed Data
-- Run this entire file in Supabase Dashboard > SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  name_ar TEXT,
  icon TEXT,
  image_url TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand_slug TEXT NOT NULL REFERENCES public.brands(slug) ON UPDATE CASCADE,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  subcategory TEXT,
  price NUMERIC(10, 3) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 3),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.8,
  review_count INTEGER NOT NULL DEFAULT 0,
  volume TEXT,
  badge TEXT,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  short_description TEXT,
  usage TEXT,
  ingredients TEXT,
  benefits TEXT[] NOT NULL DEFAULT '{}'::text[],
  skin_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  images TEXT[] NOT NULL DEFAULT '{}'::text[],
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT DEFAULT 'Tunis',
  skin_profile TEXT DEFAULT 'Peau Mixte & Sensible',
  tier TEXT DEFAULT 'CLIENT PRIVILÈGE OR',
  loyalty_points INTEGER NOT NULL DEFAULT 100,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'pharmacist', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  address_line TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'shipping')),
  value NUMERIC(10, 3) NOT NULL DEFAULT 0,
  min_order NUMERIC(10, 3) NOT NULL DEFAULT 0,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'card', 'wallet')),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  address_line TEXT NOT NULL,
  delivery_notes TEXT,
  subtotal NUMERIC(10, 3) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 3) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(10, 3) NOT NULL DEFAULT 7.000,
  total NUMERIC(10, 3) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  courier_name TEXT DEFAULT 'Bilel Trabelsi',
  courier_phone TEXT DEFAULT '+216 55 123 456',
  tracking_code TEXT,
  estimated_slot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand_name TEXT,
  image_url TEXT,
  unit_price NUMERIC(10, 3) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  city TEXT DEFAULT 'Tunisie',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_slug);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(is_bestseller) WHERE is_bestseller = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_slug);

-- ----------------------------------------------------------------------------
-- 3. AUTOMATIC PROFILE CREATION ON SIGNUP
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public catalog read policies
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read brands" ON public.brands;
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated manage products" ON public.products;
CREATE POLICY "Authenticated manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (active = TRUE);

-- Reviews: anyone can read & post verified customer reviews
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Anyone insert reviews" ON public.reviews;
CREATE POLICY "Anyone insert reviews" ON public.reviews FOR INSERT WITH CHECK (TRUE);

-- Profiles & Addresses & Wishlists (user-scoped)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own wishlists" ON public.wishlists;
CREATE POLICY "Users manage own wishlists" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- Orders & Order Items (guest checkout + live order tracking supported)
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
CREATE POLICY "Public create orders" ON public.orders FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public track orders" ON public.orders;
CREATE POLICY "Public track orders" ON public.orders FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public update order delivery notes or status" ON public.orders;
CREATE POLICY "Public update order delivery notes or status" ON public.orders FOR UPDATE USING (TRUE);

DROP POLICY IF EXISTS "Public create order items" ON public.order_items;
CREATE POLICY "Public create order items" ON public.order_items FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public read order items" ON public.order_items;
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (TRUE);

-- Newsletter
DROP POLICY IF EXISTS "Public subscribe newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public subscribe newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- 5. SEED DATA — CATEGORIES
-- ----------------------------------------------------------------------------
`)

for (const c of CATEGORIES) {
  lines.push(
    `INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES (${esc(c.slug)}, ${esc(c.name)}, ${esc(c.title)}, ${esc(c.name_ar)}, ${esc(c.icon)}, ${esc(c.image_url)}, ${esc(c.description)}, ${esc(c.sort_order)}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;`
  )
}

lines.push(`\n-- ----------------------------------------------------------------------------
-- 6. SEED DATA — BRANDS
-- ----------------------------------------------------------------------------`)
for (const b of BRANDS) {
  lines.push(
    `INSERT INTO public.brands (slug, name) VALUES (${esc(b.slug)}, ${esc(b.name)}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;`
  )
}

lines.push(`\n-- ----------------------------------------------------------------------------
-- 7. SEED DATA — COUPONS
-- ----------------------------------------------------------------------------`)
for (const cp of COUPONS) {
  lines.push(
    `INSERT INTO public.coupons (code, discount_type, value, min_order, description, active) VALUES (${esc(cp.code)}, ${esc(cp.discount_type)}, ${esc(cp.value)}, ${esc(cp.min_order)}, ${esc(cp.description)}, TRUE) ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;`
  )
}

lines.push(`\n-- ----------------------------------------------------------------------------
-- 8. SEED DATA — PRODUCTS (${PRODUCTS.length} items)
-- ----------------------------------------------------------------------------`)
for (const p of PRODUCTS) {
  lines.push(
    `INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES (${esc(p.slug)}, ${esc(p.name)}, ${esc(p.brand_slug)}, ${esc(p.category_slug)}, ${esc(p.subcategory)}, ${esc(p.price)}, ${esc(p.compare_at_price)}, ${esc(p.stock)}, ${esc(p.rating)}, ${esc(p.review_count)}, ${esc(p.volume)}, ${esc(p.badge)}, ${esc(p.is_new)}, ${esc(p.is_bestseller)}, ${esc(p.is_featured)}, ${esc(p.short_description)}, ${esc(p.usage)}, ${esc(p.ingredients)}, ${escTextArr(p.benefits)}, ${escTextArr(p.skin_types)}, ${escTextArr(p.tags)}, ${escTextArr(p.images)}, ${escJson(p.variants)}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;`
  )
}

lines.push(`\n-- ----------------------------------------------------------------------------
-- 9. SEED DATA — SAMPLE ORDER (#TN-84920) & VERIFIED REVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO public.orders (
  order_number, status, payment_method, customer_name, customer_email, customer_phone,
  governorate, city, postal_code, address_line, delivery_notes,
  subtotal, discount, shipping_fee, total, coupon_code,
  courier_name, courier_phone, tracking_code, estimated_slot
) VALUES (
  '#TN-84920', 'out_for_delivery', 'cod', 'Yasmine Dridi', 'yasmine.dridi@gmail.com', '+216 98 456 789',
  'Tunis', 'La Marsa', '2070', '14 Rue Habib Bourguiba, Résidence Les Palmiers, Apt B4',
  'Bâtiment B, 2ème étage. En cas d''absence, déposer chez la gardienne Mme Fatma.',
  148.500, 10.000, 7.000, 145.500, 'TUNISIE10',
  'Bilel Trabelsi', '+216 55 123 456', 'EXP-TN-9928104', 'Aujourd''hui, 14h00 – 17h30'
) ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.order_items (order_id, product_slug, product_name, brand_name, image_url, unit_price, quantity)
SELECT id, 'serum-hydratant-booster-eclat', 'Sérum Booster Hydratant 30ml', 'BIODERMA', ${esc(IMG.trackSerum)}, 78.500, 1
FROM public.orders WHERE order_number = '#TN-84920'
AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.product_slug = 'serum-hydratant-booster-eclat');

INSERT INTO public.order_items (order_id, product_slug, product_name, brand_name, image_url, unit_price, quantity)
SELECT id, 'creme-solaire-spf50-invisible-50ml', 'Crème Solaire SPF 50+ Invisible 50ml', 'HELIOPROTECT TUNISIE', ${esc(IMG.trackSpf)}, 35.000, 2
FROM public.orders WHERE order_number = '#TN-84920'
AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.product_slug = 'creme-solaire-spf50-invisible-50ml');

INSERT INTO public.reviews (product_slug, author_name, city, rating, comment, verified)
VALUES
  ('serum-hydratant-booster-eclat', 'Syrine Y.', 'Tunis (La Marsa)', 5, 'Texture ultra légère qui pénètre immédiatement sans effet collant. Ma peau est visiblement plus lumineuse dès la 2ème semaine !', TRUE),
  ('serum-hydratant-booster-eclat', 'Mariem K.', 'Sousse (Kantaoui)', 5, 'Conseillé par le pharmacien sur WhatsApp pour ma peau sensible déshydratée. Livré en 24h avec échantillons offerts.', TRUE),
  ('serum-hyalu-b5-anti-rides', 'Amel B.', 'Sfax Ville', 5, 'Produit 100% original avec code lot vérifiable. Prix très compétitif par rapport aux parapharmacies physiques.', TRUE);
`)

mkdirSync(resolve('supabase'), { recursive: true })
const outPath = resolve('supabase/schema.sql')
writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log(`Generated ${outPath} (${lines.length} lines)`)
