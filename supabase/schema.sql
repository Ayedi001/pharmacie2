-- ============================================================================
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

INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('soins-visage', 'Visage', 'Soins Visage & Dermo-Cosmétique', 'العناية بالوجه', 'face', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBDpx_4TQS86ebZIQzJvJO3oKUqzE-OHWCgKQTEuHQ3IcYPei9sUDss_McrTGqOzOxoOUaoeo8atjy8PMRmxkBnu2XFJKacqJBD7MAlYcCYFppTzRx7A_NcHahMKAAHcBIfZYVxpTIO1bOzSDbdlAzUdmQtiWDtVvWg1VztVjoIhbefBzNMjSKb1OK3fw7zJtZib7L86IEEWENA8ceNGHFYO5MVsURGSE6m7ja0xnx', 'Découvrez notre sélection experte formulée pour répondre aux exigences des peaux sensibles, déshydratées ou sujettes aux imperfections. Formules testées sous contrôle dermatologique, répondant aux normes européennes et tunisiennes les plus strictes.', 1) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('soins-corps', 'Corps', 'Corps & Hydratation', 'العناية بالجسم', 'spa', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA9R4zace48hpvCuYAZpTfJmjpQQkGe_IdUoyROX7iI2hQ00EymOSelNO-ZOxaYx26yn4lyxrkiLy3bcYjG54oWG9SO6RXVGWSZB3RCPa5YRPGBLNIBcU2d3owsQlRvtdomYePj872S9npowahf2VCEnZ4xHE2-J_OV8zpk-PXbsiXLQkhMQKgbvC7_XDvsrWUmsMUw_7H6ZgJn3e6sqT93QM13Eex3OJya6FX9Bwp', 'Laits, baumes et huiles relipidantes pour nourrir, apaiser et protéger la peau du corps au quotidien, même face au climat méditerranéen.', 2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('cheveux', 'Cheveux', 'Cheveux & Cuir Chevelu', 'العناية بالشعر', 'content_cut', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCO5Wp-N76bSezUt2e2tyJplGpxsgvWZFhbON2os7WqmWK1eF1Bkg5abrAvfSwKgV-YGW62dC6iMwBB73IIYRSkTZ7L-cin9HwARHLHONYx_b7tz68XxroVA6daD_weYLcuXht9tE3o_nVmRL-Mn8nIgYWdKj1AEPXpOONKDg01aUnsqTZOq91C_5BbKdZmlW65YpCmt0byIqZfy0Y94hslTEKOTfaq-WeUJ8GBgY-R', 'Shampooings traitants, sérums anti-chute et soins fortifiants recommandés par les dermatologues.', 3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('hygiene', 'Hygiène', 'Hygiène Bio & Famille', 'النظافة', 'soap', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA9R4zace48hpvCuYAZpTfJmjpQQkGe_IdUoyROX7iI2hQ00EymOSelNO-ZOxaYx26yn4lyxrkiLy3bcYjG54oWG9SO6RXVGWSZB3RCPa5YRPGBLNIBcU2d3owsQlRvtdomYePj872S9npowahf2VCEnZ4xHE2-J_OV8zpk-PXbsiXLQkhMQKgbvC7_XDvsrWUmsMUw_7H6ZgJn3e6sqT93QM13Eex3OJya6FX9Bwp', 'Gels lavants surgras, syndets et soins d''hygiène doux pour toute la famille.', 4) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('bebe-maman', 'Bébé & Maman', 'Bébé & Maman', 'الأم والطفل', 'child_care', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmJDBhEqHA6Arig0lc6g9sRmdknceEJM5tzdWxC0bS1WRKEczj22Mv20MQXDXJtoUL_0lIcZluoL7ElyJ9GUmsvdHe3fgplMyHA029xRqlQ168Y1LSMbaRDvwkO6jz4VJzQZyRGpOEr-DBFMwVLflDw_o_dAqVgg2jsyd34gnbGqpZ1MTQTv5JQT7cQS-LfqQFI3dRRri8H_3jo2dV7Mf5MNEelmWynTFWuwclscDQ', 'Soins haute tolérance pour la peau fragile des nouveau-nés et des futures mamans.', 5) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('complements-alimentaires', 'Compléments alimentaires', 'Compléments Alimentaires', 'المكملات الغذائية', 'pill', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXht36nddP3LPVfpeBKltXJJu_oVl5TnDU4fbQPLOpF6h3-bJdcUFbFkaBknMPIhs0_BVQhdYhZYdfOn2QeCcboO4GA3gpXRZ34iGILS1ihCb-2gIjVtD3537X3Osz_kOr1VHjMOot5zw5NnPMU5NMfMxzuPadQwKzbItswo3o5ztYInpyoBPOtUIZGa3XB0eyD9HjE7jSVnmQl-l1udBpj0enrGGVmSqOjSfwaAtW', 'Vitamines, minéraux et compléments sélectionnés par nos pharmaciens pour votre vitalité.', 6) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('sante-bien-etre', 'Santé & Bien-être', 'Santé & Bien-être', 'الصحة والعافية', 'favorite', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXht36nddP3LPVfpeBKltXJJu_oVl5TnDU4fbQPLOpF6h3-bJdcUFbFkaBknMPIhs0_BVQhdYhZYdfOn2QeCcboO4GA3gpXRZ34iGILS1ihCb-2gIjVtD3537X3Osz_kOr1VHjMOot5zw5NnPMU5NMfMxzuPadQwKzbItswo3o5ztYInpyoBPOtUIZGa3XB0eyD9HjE7jSVnmQl-l1udBpj0enrGGVmSqOjSfwaAtW', 'Eaux thermales, soins apaisants et essentiels santé du quotidien.', 7) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('protection-solaire', 'Solaires', 'Protection Solaire', 'الحماية من الشمس', 'wb_sunny', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKYzKZVL3H16B0xcC1DMtAiZYThqdue7Q4edUNACh_PhT5u3tPlu8J78D7l15XtwhgJ214VmhJChVsvQiLcOY9FplvtMjzZ_IwbkVb8SJrAHGcStv5GVkvhb2rN8AAZ7WL0gLx22NUxYR-mBmLMlD1eTkMMDSVEdPktJusw6G4l9LTvtokStXlOnCLkx0pXcdfHrqZkhKg5is5glclcZ_6xQABnBIkmNmUPKuOi2ok', 'Protections très haute efficacité SPF50+ adaptées au soleil tunisien, pour le visage, le corps et les enfants.', 8) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;
INSERT INTO public.categories (slug, name, title, name_ar, icon, image_url, description, sort_order) VALUES ('maquillage', 'Maquillage', 'Maquillage Dermo', 'المكياج', 'brush', 'https://lh3.googleusercontent.com/aida-public/AB6AXuASMnod9BcOT0fLTmVANHvCkHA8Zb0-Y3Sp7qnzqlUkDMXH35_S5uUw1P5dCpdl75Aj6ckAEk4rCRJI1gLAvX2mwkVmc1U6XhJ9OFEEB1AxNxIvT5re-Mwxkt1xavtIRtoAVxyyIDFaT3E6ZX_ZM-4LP1pTqvJ2tBiZfHLyDwxOikRz5SfcRZle-GfgetXk8b23ECG8eVMLRRlXwfiOugNKvAQLvqnpxgPcjAg7Knog', 'Maquillage correcteur et soin, formulé pour les peaux sensibles et intolérantes.', 9) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, image_url = EXCLUDED.image_url, description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 6. SEED DATA — BRANDS
-- ----------------------------------------------------------------------------
INSERT INTO public.brands (slug, name) VALUES ('la-roche-posay', 'La Roche-Posay') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('vichy', 'Vichy') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('cerave', 'CeraVe') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('bioderma', 'Bioderma') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('avene', 'Avène') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('svr', 'SVR Laboratoire') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('filorga', 'Filorga') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('nuxe', 'Nuxe Bio') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('eucerin', 'Eucerin') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('ducray', 'Ducray') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('klorane', 'Klorane') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('mustela', 'Mustela') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('arkopharma', 'Arkopharma') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('bionera-lab', 'Bionera Lab') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('argania-terra', 'Argania Terra') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('dermopure-lab', 'Dermopure Lab') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.brands (slug, name) VALUES ('helioprotect', 'Helioprotect Tunisie') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- ----------------------------------------------------------------------------
-- 7. SEED DATA — COUPONS
-- ----------------------------------------------------------------------------
INSERT INTO public.coupons (code, discount_type, value, min_order, description, active) VALUES ('TUNISIE10', 'percent', 10, 0, 'Remise privilège -10%', TRUE) ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
INSERT INTO public.coupons (code, discount_type, value, min_order, description, active) VALUES ('BIENVENUE10', 'percent', 10, 0, 'Bienvenue -10% première commande', TRUE) ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
INSERT INTO public.coupons (code, discount_type, value, min_order, description, active) VALUES ('TUNISIEBEAUTE', 'percent', 15, 120, 'Offre été -15% dès 120 TND', TRUE) ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
INSERT INTO public.coupons (code, discount_type, value, min_order, description, active) VALUES ('LIVRAISON24', 'shipping', 0, 0, 'Livraison offerte', TRUE) ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 8. SEED DATA — PRODUCTS (36 items)
-- ----------------------------------------------------------------------------
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('serum-hyalu-b5-anti-rides', 'Sérum Hyalu B5 Concentré Anti-Rides Réparateur 30ml', 'la-roche-posay', 'soins-visage', 'serums', 89.6, 112, 32, 4.8, 142, '30ml', 'Bestseller', FALSE, TRUE, TRUE, 'Sérum anti-rides à l''acide hyaluronique pur et vitamine B5 qui repulpe et répare les peaux sensibles.', 'Matin et soir sur peau propre, avant votre crème hydratante.', 'Acide hyaluronique pur (2 types), Vitamine B5, Madécassoside, Eau thermale de La Roche-Posay.', ARRAY['Comble les rides et ridules', 'Repulpe intensément', 'Répare la barrière cutanée']::text[], ARRAY['sensible', 'seche', 'normale']::text[], ARRAY['anti-age', 'hydratation']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuB3Kv-5pr3C1WU8-WUMg3r-4W8fcAlXIiOKVuWOt8sb8vxwew74V_74HruCtOH4odfPqZ3gP5IVJyyPCW0fZA9tMHcDnCTpNunvNbDuakmwNNUAa0JDp4KlEBc0reS-JjRLDNYTBb65FVVJ4U2JJrxZWbeEqMTxNs6qKXgtNFrkqSIF2QeJz2X06mlUiTaD5U9ZI8GKXEE_6zBsDhfWkKHP2JdfMiOy5OqmpVe_h0gt', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv-qLsooXG5p6g3KRSoHrIlVWu5QU_ZN_8wEbBATrE_8x9lSdYvEpfxdSqbvoIHg_86ur9AIZ-A5wHbEmzvfFOPFoXKKH5xvv9aGY2knMT6vcjHReVmjTEVpBvji_9rj-gNbcURcTKfoD3cCjvFcy2K6y8XiaOsjuBrCu3xKzQth0O4iXvMey6IxjUKBI3kqEQ-J408TZExAr7xC4KVRgG56JEhFj6mky6deuhINVE']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('cerave-baume-hydratant-454g', 'Baume Hydratant Visage & Corps aux 3 Céramides Essentiels 454g', 'cerave', 'soins-visage', 'baumes', 54.8, 64.5, 60, 4.9, 208, '454g', 'Top Soin', FALSE, TRUE, FALSE, 'Baume riche non gras aux 3 céramides essentiels et acide hyaluronique pour les peaux sèches à très sèches.', 'Appliquer généreusement sur le visage et le corps aussi souvent que nécessaire.', 'Céramides 1, 3, 6-II, Acide hyaluronique, Technologie MVE.', ARRAY['Hydratation 24h', 'Restaure la barrière cutanée', 'Texture non grasse']::text[], ARRAY['seche', 'atopique', 'sensible']::text[], ARRAY['hydratation']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDER5Vp4MoSa9J2bfC-uYvKzM7YoBa_WFGWZXeYfWShKnBaHQ-qTISnbvZggjlBcqmndhec56_6fCv5cKPFmN6nF236_ccbRr7urEG0xSoOwhdWjkhDo7eLRsZUiLmRENSXoikJ1v-q--z3uWAZqXI86kTHH-TCRP0T7bmq-kSmO4nFH8Hqlwlo3dIu24W9LrDWh-wIDgmJlM0VSR8hPg_r8QWwu0H5TmmdL4JAS1v1', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaU2On9DKghUqzj5s-G_PERdOC1K5ykvFq450y6jrWQ91NmTuHLd0QD9XhKu10rUD2d-19DRKX5yy0Gt6DUq96oFnWc8Nk9Aqd9UfDMbuf3BC1u-3QkS6oiMgZzdvHZ5_RAV-WNN-JAUl7UwxdRjsqDrruuviqsUu_5pD9KVCNbWGJZbIKZUhnrM28WZCQlQrumPm9nbK2EaVYRtXU1Zo5ikIbeOheIZ_K8uEKvEQb']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('sensibio-h2o-micellaire-500ml', 'Sensibio H2O Solution Micellaire Démaquillante Peaux Sensibles 500ml', 'bioderma', 'soins-visage', 'nettoyants', 54.2, 65, 80, 4.9, 289, '500ml', 'Bestseller', FALSE, TRUE, FALSE, 'La micellaire culte qui nettoie, démaquille et apaise les peaux sensibles sans rinçage.', 'Imbiber un coton et nettoyer le visage et les yeux. Renouveler jusqu’à ce que le coton soit propre.', 'Micelles d’esters d’acides gras, Extrait de concombre, Complexe D.A.F.', ARRAY['Démaquille visage et yeux', 'Respecte la peau sensible', 'Sans rinçage']::text[], ARRAY['sensible', 'normale', 'seche']::text[], ARRAY['demaquillant']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuB-8TNL1iybhbBv2A_NuxG-iYjYhDD0Q6GHC4HonfCJpMtPbH3hM9ICP-WtSKfVYLZtowjAUNvPvLpcLqEdbIziMu9uTlgzgxduY6LNhGjxLE7fUVDS0w1yY-zz5u-3skjiWEMx4lLFp2CRoZpZ3OfwjfIzDkD3sVKGtoRSr_54N1oSpF4vBmzPmFZksdTXv8uwXL0z8ov4G3y8XuzCieQ126AnH5zg9Inh6j3p1-bh']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('svr-clairial-serum-anti-taches', 'Clairial Sérum Correcteur Intégral Anti-Taches Éclat 30ml', 'svr', 'soins-visage', 'serums', 73.5, 98, 25, 4.7, 96, '30ml', NULL, FALSE, TRUE, FALSE, 'Sérum correcteur concentré qui atténue les taches pigmentaires et unifie le teint.', 'Le soir sur peau propre, éviter le contour des yeux. Protection solaire SPF50+ obligatoire le jour.', 'Niacinamide, Acide tranexamique, Vitamine C stabilisée.', ARRAY['Réduit les taches brunes', 'Unifie le teint', 'Éclat immédiat']::text[], ARRAY['normale', 'mixte', 'sensible']::text[], ARRAY['anti-taches', 'eclat']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuCyX1PPE7cDVfDQbE14O8VP1d7eRQFf34dRMMTmpS9JtGduixeIe-bsekSMXCxft-Q4CtfrsjWPs6LnvNm8j5qtfB0u54ylX0qXW5jxHhwYBnruYALOT5fNz_xoa_i99FF-oqxFoYCdT9hKPvuZriUO4Md2tSgqdzQ2wUPlV4ovortiC4gB2Ufw3xZtTWPgQn51nxeCcipSiD73Kz2nrvEGCZhHgb-HpeiNpwifrgLB']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('svr-sebiaclear-active-gel', 'Sebiaclear Active Gel Correcteur Boutons & Points Noirs 40ml', 'svr', 'soins-visage', 'cremes', 48.9, 55, 30, 4.6, 110, '40ml', 'Formule Forte', FALSE, FALSE, FALSE, 'Gel correcteur anti-imperfections à la gluconolactone 14% pour réduire boutons et points noirs.', 'Matin et/ou soir sur peau propre.', 'Gluconolactone 14%, Niacinamide 4%, Teprenone.', ARRAY['Réduit les boutons', 'Désincruste les points noirs', 'Non desséchant']::text[], ARRAY['acneique', 'mixte']::text[], ARRAY['anti-imperfections']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuCQvqDSeLDerD1RdhGSU8WERlQQNMcep9tswxD1SROFnqvi4RS4SqyaDku5W8yobRzG2T7MV42-qWLWxiu0pUlBWhhhYHLdrVBGruY7IAj8IWVAuh_mqusz8Aq8zCZB9t_EZICjpZoOf1kANFJo-jyYUg0fGjDepHEVMPqQ_P8zHgNGgn0kkmvraPDZ_oPfdCif6jaOgef7XaIq5vV7wMGJe3WzephuqY1rPQfgrrRQ']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('effaclar-duo-plus-m', 'Effaclar Duo+M Soin Triple Correction Anti-Imperfections 40ml', 'la-roche-posay', 'soins-visage', 'cremes', 59.9, 79.9, 45, 4.8, 312, '40ml', NULL, TRUE, FALSE, FALSE, 'Soin triple correction qui cible imperfections, marques post-imperfections et récidives.', 'Matin et soir sur l’ensemble du visage.', 'Phylobiome, Niacinamide, Acide salicylique, Procérad.', ARRAY['Corrige les imperfections', 'Atténue les marques', 'Prévient les récidives']::text[], ARRAY['acneique', 'mixte']::text[], ARRAY['anti-imperfections']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDpPGIjykysxSxFaz-JhMSpl59FRKBcL60jKd6jGmkauBVQuqtbAxZrMv6ymzgENMIYI-2E0MRJd5B31DnnNTDQh8hpu6x6jRZVswlR2hQdDOTqnjbL-IvjEhw0888O6hF6WDiJMRXwcUjwHgNAbM6aoBxzhNp-H2TcdmXUaZqBGNyGz6MLpaToRP7NeiWkcJPfGSiNjWSgrOtGstnCNzdLTIFpTS7l51RzKHag2l-i']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('vichy-mineral-89-booster', 'Minéral 89 Booster Quotidien Fortifiant et Repulpant 50ml', 'vichy', 'soins-visage', 'serums', 82.5, 95, 38, 4.8, 164, '50ml', 'Coup de cœur', FALSE, FALSE, TRUE, 'Booster quotidien à 89% d''eau volcanique de Vichy et acide hyaluronique pour une peau plus forte.', 'Matin et soir, avant votre soin habituel.', 'Eau volcanique minéralisante de Vichy 89%, Acide hyaluronique naturel.', ARRAY['Fortifie la barrière', 'Repulpe', 'Hydrate 24h']::text[], ARRAY['sensible', 'seche', 'normale', 'mixte']::text[], ARRAY['hydratation']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBWIaWAKjCPgjbbw12i48z1nTyNTnzUug_tisJt2cOZJnklWUtfLhsyxSpMz2ZriXUIGhKu5qLAsNpuSHWSK058M6hXR_8M3-JFOzw0HF7-qwG2GYiDg3evPqLSlkT-g10gL90YpqosL-GoOXs40qfxoOQWbBedw6OGOLOK7l7ZizQBd1qwvY7YdOH9LHcni8O1Lzyaw4KKdgR5MaCTFUY6bPXUIxOu5yOEyy3ZQSme']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('bioderma-sebium-gel-moussant', 'Sébium Gel Moussant Actif Nettoyant Purifiant 500ml', 'bioderma', 'soins-visage', 'nettoyants', 52.9, 58.8, 50, 4.7, 186, '500ml', NULL, FALSE, FALSE, FALSE, 'Gel nettoyant purifiant qui élimine l’excès de sébum sans dessécher.', 'Faire mousser sur peau humide, rincer abondamment.', 'Sulfate de zinc, Sulfate de cuivre, Complexe Fluidactiv.', ARRAY['Purifie en profondeur', 'Limite l’excès de sébum', 'Respecte la peau']::text[], ARRAY['acneique', 'mixte']::text[], ARRAY['nettoyant', 'anti-imperfections']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDjQqIm34X2AaL7IGC_AQ3Jg1bVaAQL8bSXeslUjIXJx1-7oOBJGwg_lPhIMtaqV1_kl55BW4y0Qv9lsZfsPzwHF6_LH9-zPKRShhdvZQRR-NhPl__ssm-Kydg1gFKrYy07YDyXksf4w19u2LmgU2_viqxLGN6ErJ3s2liV7lxbmoQP2sW4biY23Jhxx4zv_7JoLIQYFMNZ8xngKjlxuJ2opR1eRjawUKj-9Vx3n4wb']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('cicaplast-baume-b5-plus', 'Cicaplast Baume B5+ Ultra-Réparateur Apaisant Multi-Usages 40ml', 'la-roche-posay', 'soins-visage', 'baumes', 47.8, 55, 70, 4.9, 420, '40ml', 'Indispensable', FALSE, TRUE, FALSE, 'Baume réparateur apaisant pour bébés, enfants et adultes. Visage, corps et zones irritées.', '2 fois par jour sur peau propre et sèche.', 'Panthénol 5%, Madécassoside, Tribioma, Cuivre-Zinc-Manganèse.', ARRAY['Répare la peau abîmée', 'Apaise immédiatement', 'Convient dès la naissance']::text[], ARRAY['sensible', 'atopique', 'seche', 'normale']::text[], ARRAY['reparateur']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDSJgTy2L0Ah_jUdZVaYjX8ZEyBf667pxxNjOujJQFQ0ZfurSdVwI80R9ULIkig-qZypaJs8m7-8D2CGnx9y7M9kqOfCyO_3S4wW2GnJBkKidkqMlOCfmdhWoTwXhEoCIMWrpc28isuEfutapI_RY0H7D2EPlpenIJk-6i0g-GdqjFRs7CNy65c68BIQlELeCWkWhq_egnqAJrWlZi1jtWhWbk5VxtXuCW0e5LnEm-8']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('avene-cleanance-comedomed', 'Cleanance Comedomed Concentré Anti-Imperfections 30ml', 'avene', 'soins-visage', 'serums', 57.6, 72, 22, 4.6, 64, '30ml', NULL, FALSE, FALSE, FALSE, 'Concentré qui réduit les boutons dès 7 jours et prévient leur réapparition.', 'Matin et soir sur le visage nettoyé.', 'Comedoclastin, Eau thermale d’Avène, Acide salicylique.', ARRAY['Réduit les boutons dès 7 jours', 'Peau nette', 'Haute tolérance']::text[], ARRAY['acneique', 'mixte']::text[], ARRAY['anti-imperfections']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuCAie1Zq_TeFYLHuSe8ur8Y5FPOxlhqrH6cimG68oMRPaSVEPZYPueITMBxlu4WEMhRliXZ9At3JiJ7WoeiWGlI3Ahe9pErweuu2G1iNwP5mfMHf0T9ZA9UTBGxgHMinc7VTLDWoomkofYsfCe2uhu-GxRQvpgNN3sp8vePXl_c3TJpLv3C9a-sQ9GM1mrk58NPUW_zbjcQv6TP1LjcjQdS9BjI42yECNJuZ1US7eln']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('serum-hydratant-booster-eclat', 'Sérum Hydratant & Booster d''Éclat 30ml', 'bioderma', 'soins-visage', 'serums', 78.5, 95, 18, 4.9, 184, '30ml', 'Authenticité Laboratoire', FALSE, TRUE, TRUE, 'Formule concentrée à l''Acide Hyaluronique Pur & Vitamine B5 pour un repulpage immédiat de l''épiderme.', 'Appliquer 3 à 4 gouttes matin et soir sur le visage et le cou parfaitement nettoyés. Masser du centre vers l''extérieur, puis appliquer votre crème hydratante. Le matin, terminer par une protection SPF50+.', 'Aqua, Glycerin, Sodium Hyaluronate (bas & haut poids moléculaire), Panthenol (Vitamine B5), Niacinamide, Allantoin, Aloe Barbadensis Leaf Juice, Tocopherol.', ARRAY['+84% d''hydratation immédiate mesurée cliniquement', '96% des testeuses constatent un teint repulpé et plus lumineux après 14 jours', 'Haute tolérance — peaux sensibles & déshydratées']::text[], ARRAY['sensible', 'seche', 'normale', 'mixte']::text[], ARRAY['hydratation', 'eclat']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuB8g_mv5GeJ-mzxqQ3kPu6NlFeiDeXk14qAs6RgcElSxR8H-HB_QGt2e7VYaXOkQP7ZRDQw7u8PLMia8nhEww9yEnxeGIJrwSRX043-8EwbtaZ_U5wKeCIQMmspATe3S0XYfOn2KQOcWXIVkgA_PLpiGc7Fl7Sv3j-GrUoi7VeXEriAfxrw4BYo6M9iR-7OCcur5VeVvBKnRwgvJwo8aaMMyjFN963_etxG4cf7JY4B', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA75jV45y7M7sm2NbX-jC9GyfjUGysfN3s_DO3o7P9iCR0nXbHWyYI-D4VAP5QawoMdeyxyRpRkRpmaiRMmdwq-qsjzb0GYBlDVPF2VoTzZ9_2watiyhKyOeZCT0WukRKyoqKgvOMcg5R6NQcOh-4mfeO1DBHxz8ScvzX4uhJXm29KMmgvFd9kr4eq2NJDCprp8CGhz7RBQplW_rhOMDsdW0cAJZHWF2S4AHczBQK_X', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOUW3TK8A__fr6Nx6bRabZhsTPMIFfgyFfHj5yzTNVgICwGIZTDlbwYrwEkOAJO_5yNKpypBxniA8zNFIBKLMHWOvTPbEa0ZqulJLc_TxpaHsZCKSOgjc49tmXaKe4JehX0eGMvehz9NZIBwMmbm00UMzu7981HEXuxPA6KSJ9cuW32-z4qgVeYLdwy_ADa6CcChFAMlwodyu2RW3e54yiwErhARN9MhKhGDxuSIGG', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAukHem9Nsp6oouqakZuj7fwFBhyWleO9Jb6OPR6pAVeLbDnK-yGVMkGN9MVC-GTP-f6blrTrf_IyMSqSHZodqja6tGWFzsFL7_tbsWyhly4KLIDnVcgu90ATCpxmJs1PpXITnlLRJ-Lfe4QnpvBGvEqbfYkajUVih0-PEbc0OZgIzeiExg7pZIJWGc6cYdXMdKv2RfNSXqOdOvhTXCSB1zrEuv8Ro4ULrtbwHcnjsX', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1cYFuv0PO-BU7Ivj0uD5jjGRihNoYWkuSmIrAWba2-K2uWbARtVJrgbRdUuPG46TCtrs_ZsR7UBLvt7Nj2-Ov2AgnJIoAQTr7wVOPtTJGetwnC-Qxtx53m2JTZkIVbfmkbpiwnVL6apnXb2wQ7VTPqwKt4GBf4ffD7Y1dFP0DdlTKT35NHZyaqfAPRg-hVtVRjit05fZVCTtVTC2Ix2z8XaJeR3E8PvTZ7rUGblZF']::text[], '[{"name":"Flacon 30 ml","note":"Format cure 1 mois","price":78.5,"compare_at_price":95},{"name":"Flacon 50 ml","note":"Format éco 2 mois","price":118,"compare_at_price":140}]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('bioderma-gel-moussant-apaisant', 'Gel Moussant Apaisant Peaux Sensibles 200ml', 'bioderma', 'soins-visage', 'nettoyants', 39.9, 46, 40, 4.8, 92, '200ml', NULL, FALSE, FALSE, FALSE, 'Gel nettoyant doux qui élimine impuretés et pollution sans tiraillements.', 'Matin et soir sur peau humide, rincer.', 'Complexe D.A.F., Glycérine, Extrait de concombre.', ARRAY['Nettoie en douceur', 'Apaise', 'Sans savon']::text[], ARRAY['sensible', 'normale']::text[], ARRAY['nettoyant']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuCVaLy94kRLSlHNXYGJ-s8wyxGx5KowOVWOtyb8zNcDhe-bFb9WfY9IM-le_gjfmQhwbTnOXgYCwulOj0UiKcjER6IZHi7dpWkp95mbCqJGB6BI8OCJp8mLST8WuPByNsILeyrocX70CyfoxXn-bgVWxFb0jtRxQdRxphZLg_MI1fK_5QhrmgFd06GX1LGs1KytMm9ZIqp92_RDN6lqvqD8ScaTNqO_4jIpFTGDR6Ek']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('bioderma-creme-hydratante-legere', 'Crème Hydratante Légère Peaux Sensibles 50ml', 'bioderma', 'soins-visage', 'cremes-jour', 62, 74, 35, 4.9, 110, '50ml', NULL, FALSE, FALSE, FALSE, 'Crème de jour à la texture légère qui hydrate et apaise durablement.', 'Le matin sur le visage et le cou.', 'Glycérine, Acide hyaluronique, Complexe D.A.F.', ARRAY['Hydratation longue durée', 'Texture fondante', 'Base de maquillage idéale']::text[], ARRAY['sensible', 'normale', 'mixte']::text[], ARRAY['hydratation']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDH2ocPm25yl2yN65EFsMZvGOe5GfXJMn0JOdGtMF_BGxWeMrqngFEDclTURRttj2nq4bbEUut-EY97xc0I7FOfO2QUn6lS4MtV-73AE4I758HvLvEh7754eqzgAwZ2R7hMtZLaOkfUyuB7Nr7kf_Xc5kxbWufYdlTlT5LBgrATzZxun-W6H_uqSyopndarpnyGhgv6NCk8U4xZQwIEFIovC2lrSa6IXR-cJbS0w7JH']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('bioderma-gel-contour-yeux', 'Gel Contour Yeux Défatigant Anti-Poches 15ml', 'bioderma', 'soins-visage', 'contour-yeux', 48, 58, 28, 4.7, 64, '15ml', NULL, FALSE, FALSE, FALSE, 'Gel frais qui défatigue le regard, atténue poches et cernes.', 'Matin et soir en tapotant sur le contour de l’œil.', 'Caféine, Escine, Extrait de bleuet.', ARRAY['Décongestionne', 'Atténue les cernes', 'Effet frais immédiat']::text[], ARRAY['sensible', 'normale']::text[], ARRAY['contour-yeux']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBhaqaANIDu7mQvEQGOHwWFTay-kJorlLPS_4Pwr5El0QNXxBTLzNQ8tTAxKA71kC0a4YhH5MrIJeerBsTe6NNh7UuiJpeAD2EOAcvEwA8ocgje6_-kLHxyoLCnjajGqnNZWE-ywiYx-YcOz3W8jcR--03_gW_wj34m1-fJhmhNS3k823LlLI1EZ3TDDGJp5VDiVgyOdK6RaQOeKIjhSDvoDUsCeZNHFjGQMk1XOcDg']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('emulsion-reparatrice-nuit-centella', 'Émulsion Réparatrice Nuit à la Mousse Alpine & Centella 50ml', 'bionera-lab', 'soins-visage', 'cremes', 68, NULL, 20, 5, 47, '50ml', '98% Naturel', TRUE, FALSE, FALSE, 'Émulsion de nuit végétale qui régénère la peau pendant le sommeil.', 'Le soir sur peau propre.', 'Extrait de mousse alpine, Centella asiatica, Squalane végétal.', ARRAY['Régénère la nuit', '98% d’ingrédients naturels', 'Haute tolérance']::text[], ARRAY['sensible', 'seche']::text[], ARRAY['naturel', 'anti-age']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuCOxmqiLqmWyD3Q2OvVA4365WcXf5MkegJl18mchm82RLTf4ULbF-XjllY1jmLpf6iYpcI_b6AKWMHXptRKyaufGYcUsOPF-HWzt3gZmz8oMtX-f9nzEOhQj-ZHS8HGFTqNMnOE-VSXX1-OgDdFyijKI4N9CbFhPQelgUgA1uASolLdRtz8cLbxon7_FygtpgTzrEpXhCflSksZJ61dGVEvhQcVlnkKELpHDxLn4qVM']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('fluide-hydratant-algues-marines', 'Fluide Hydratant Correcteur de Teint aux Algues Marines 50ml', 'nuxe', 'soins-visage', 'cremes-jour', 76.4, NULL, 24, 4.8, 83, '50ml', 'Bio Vegan', TRUE, FALSE, FALSE, 'Fluide bio teinté qui hydrate et unifie le teint naturellement.', 'Le matin sur l’ensemble du visage.', 'Extrait d’algues marines, Aloe vera bio, Pigments minéraux.', ARRAY['Teint unifié', 'Certifié bio', 'Vegan']::text[], ARRAY['normale', 'mixte']::text[], ARRAY['naturel', 'hydratation']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuA98X6f0kutFzAOpizSOBMXVqMQUyH8QxfDXjPlCKdyJQZbJmjvnbCdFdZFMPBurxXHm4CreCcquwS8YqyFf0kmjvF7e03QfZ_QX5HpYjp5STmQq_RqAa9ojnmWmvs4S6Zb5gA8KT6cDVYsshzQZcpHRh4NJmA5FXRN9fNr_IK07ivpaJz34TddxZ-Mh6SWvpc7uksmMLpKhwYEcMODY-eKI4v2KIoO7M48ZmNgVeFL']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('mousse-nettoyante-bleuet-aloe', 'Mousse Nettoyante Apaisante au Bleuet & Aloé Vera 200ml', 'dermopure-lab', 'soins-visage', 'nettoyants', 32.5, NULL, 55, 4.7, 65, '200ml', 'Sans Parfum', TRUE, FALSE, FALSE, 'Mousse aérienne sans parfum pour peaux sensibles et allergiques.', 'Matin et soir, rincer à l’eau claire.', 'Eau florale de bleuet, Aloe vera, Glycérine végétale.', ARRAY['Sans parfum', 'Apaise les rougeurs', 'Texture aérienne']::text[], ARRAY['sensible', 'atopique']::text[], ARRAY['naturel', 'nettoyant']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDAOXLDGoSAU4b-2jxoZ7QHmVGVpCg4ScUjFggfoq4bh9sBF-TFMRRRKT2H3nFaeSuWwGvbItRcTXysiDuQ7gaSbg9ixzjbh0Q6g2qR63e4aNFa5G8uXKN7OvD4yB8LdsXnVPtKacdAe4vbnPRr0hkvKbOP8FCUQ4c5x7dyZ4VN6Fs-7TpqfxfIQRXLlEf_FKhpYWKThWKRiEbCYSMk2SHRkOAJ7K26VCegSNkDi1m_']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('filorga-ncef-reverse', 'NCEF-Reverse Crème Multi-Correctrice Suprême 50ml', 'filorga', 'soins-visage', 'cremes-jour', 165, 189, 15, 4.8, 76, '50ml', NULL, FALSE, FALSE, FALSE, 'Crème anti-âge régénérante inspirée des cocktails de médecine esthétique.', 'Matin et/ou soir sur le visage et le cou.', 'Complexe NCEF, Acide hyaluronique, Collagène.', ARRAY['Lisse les rides', 'Redensifie', 'Éclat']::text[], ARRAY['normale', 'seche']::text[], ARRAY['anti-age']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuASMnod9BcOT0fLTmVANHvCkHA8Zb0-Y3Sp7qnzqlUkDMXH35_S5uUw1P5dCpdl75Aj6ckAEk4rCRJI1gLAvX2mwkVmc1U6XhJ9OFEEB1AxNxIvT5re-Mwxkt1xavtIRtoAVxyyIDFaT3E6ZX_ZM-4LP1pTqvJ2tBiZfHLyDwxOikRz5SfcRZle-GfgetXk8b23ECG8eVMLRRlXwfiOugNKvAQLvqnpxgPcjAg7Knog']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('coffret-mosselixir-intense', 'Coffret MossElixir™ Intense Rituel Teint Radieux', 'bionera-lab', 'soins-visage', 'cremes', 119.5, 145, 12, 4.9, 38, NULL, 'Sélection Été', TRUE, FALSE, TRUE, 'Coffret rituel anti-âge végétal certifié : sérum, émulsion et huile précieuse.', 'Sérum puis émulsion matin et soir, huile en soin nuit 2 fois par semaine.', 'Mousse alpine, Centella, Huile de figue de Barbarie.', ARRAY['Rituel complet 3 étapes', 'Anti-âge végétal certifié', 'Idée cadeau']::text[], ARRAY['normale', 'sensible', 'seche']::text[], ARRAY['anti-age', 'eclat', 'coffret']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBkZdMtrpK3R7cic_JOWaJjxs0SBmIX85nE6CYbZ27LWbr_Cvt1uoTjRwub_t7yjzyMtL1kEAnJfYj9UZRxtU8OlJiPIu9VZsCWnN6kdbrjqlYOY8rdmkiDWEQYVOe4zL1naFcsPiBccwIeyhhAPTaRkNiY2LjK-glV-uBYbMqV-sd-_KJn5cfahRUBB3vQ-n-r3Mzw5ioAjjwFmppptQRCsAtzHtAIChHdNhyDQpT5']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('photoderm-aquafluide-spf50', 'Photoderm Aquafluide Invisible SPF50+ Fini Toucher Sec 40ml', 'bioderma', 'protection-solaire', NULL, 48.2, NULL, 90, 4.9, 319, '40ml', 'Coup de cœur', FALSE, TRUE, FALSE, 'Fluide solaire invisible très haute protection, fini sec, ultra-léger.', 'Appliquer avant l’exposition, renouveler toutes les 2 heures.', 'Filtres UVA/UVB photostables, Complexe Cellular Bioprotection.', ARRAY['SPF50+ très haute protection', 'Fini invisible', 'Résistant à l’eau']::text[], ARRAY['sensible', 'mixte', 'normale']::text[], ARRAY['solaire']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuARPc-QK2eforxEcrfYRdlbowg1Z5EqIFkcRoP7Wyswm-UYxGiJtU9nGucZn8QspL5ifhfvY4w-E6HKj3MrKpyhqA1qZ3FpGmt9RfCQjGSwwrdC1wSshO0XuNQ0LpYRV9KBDP7E4dS4gMXouPuPlft1NOND4Yc7RNXd3vRNxK3UcLOLPGFGxfJqxk00UgegOJ1qvd21qt7JpC3-PENcW_-Q3koLNnv-FbNITRA0fC5n']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('fluide-invisible-spf50-40ml', 'Photoderm Fluide Invisible SPF 50+ 40ml', 'bioderma', 'protection-solaire', NULL, 54.5, 65, 60, 5, 245, '40ml', NULL, FALSE, FALSE, FALSE, 'Protection solaire fluide invisible pour peaux sensibles.', 'Avant exposition, renouveler fréquemment.', 'Filtres UVA/UVB, Ectoïne.', ARRAY['Invisible', 'Haute tolérance']::text[], ARRAY['sensible', 'normale']::text[], ARRAY['solaire']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuAaurzyxDZhf8XEMYiwQgJbeKlyHcLp7SSb-43zaLbJnnaUMVbMMrQek8-xHnp0LrXqddm-XF85Jr_g-wThUWQ_ZabCWp8mNQWquhcotYLU86CoL2JVUvCwJtL0fZ1z4CR-RXUAroFN_qKoVJOmfPVsPo93S_s8lD1bfGnfZVjuJfldKqwmMNzOyNUaHp7bNGpVXFz85CP0sJLRarSFLKIh3efG2HR1HS8C3GVC0Pf3']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('creme-solaire-spf50-invisible-50ml', 'Crème Solaire SPF 50+ Invisible 50ml', 'helioprotect', 'protection-solaire', NULL, 35, 42, 100, 4.6, 88, '50ml', 'Pack Duo', FALSE, FALSE, FALSE, 'Très haute protection pour peaux tunisiennes exposées, texture invisible.', 'Avant exposition.', 'Filtres UVA/UVB, Vitamine E.', ARRAY['SPF50+', 'Non collant', 'Prix doux']::text[], ARRAY['normale', 'mixte', 'sensible']::text[], ARRAY['solaire']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuB-AG1uGT7D0uBC9W4GaLVXDKmaeqXXP4nObz88A3esQkNWovjKh3TtPWETnF4H182kCSEJvBpb26z6pcJrFBt6_fRVwnamQ9I-WrepNkAcZ6jfQpShB2F1QIuhe7Gs6aeiBAr4DD4IhEuSgoh_ZRSBbTbbsD12vDF3CC4uQSJzuoiGePXHjzxGvlqbYgOjhaPg7zvSAfdN_a_wqj6-2_5a_LJ59nrtsJ4L8UQjM7Zf', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsdRpnTPcoLcxH__prXp3buv3ItU9t7pq79EYKcvjPQ2Jza5NrEL1UJrFZ4awt5pQN4bxqJjqDE1Dd2n3-5Q11yhUu23cF5UsWhsQxf2gNPYhSa9HSWzEEtnOWng5KCLymkIRnUh-4jPucF1dcFkj3E-1IXuiWWGOz1UxRrurxNk93XzUL3RssMIvWQytS1oZ3AybEqFTuaG_Aq3G-6iN_LZ4325JKyNAVlcu9YwHx']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('anthelios-uvmune-400-fluide', 'Anthelios UVMune 400 Fluide Invisible SPF50+ 50ml', 'la-roche-posay', 'protection-solaire', NULL, 69.9, 82, 50, 4.8, 201, '50ml', NULL, TRUE, FALSE, FALSE, 'Protection ultra-large spectre contre les UVA ultra-longs.', 'Avant exposition.', 'Mexoryl 400, Eau thermale.', ARRAY['Protection UVA ultra-longs', 'Invisible', 'Résiste à l’eau et à la transpiration']::text[], ARRAY['sensible', 'normale', 'mixte']::text[], ARRAY['solaire']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBz-Lf6tNJ-leRFwko_mHRXW3z8IwQbGBgHEIFG4BELYFJ9BB1x-ySWQBLUbqMwHntHOoWGyUwZni14Sn6IUoRvkETZK2QELYElXHdAkkIb1J15eOwhYqIJdof2xlNmweycu_4YS-g_a8irNGrco7_kSXmlYAp5qj60JyH4_hlhr3odlXz9g4uA9ShNDafCPDmpva95VgbsmactPIcIV_oUJ2dyWubIdTVXJ0_043f_']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('avene-trousse-solaire-ete', 'Trousse Solaire Été + Eau Thermale Offerte', 'avene', 'protection-solaire', NULL, 89, 119, 14, 4.9, 57, NULL, 'Cadeau Offert', FALSE, FALSE, TRUE, 'Trousse dermo découverte : crème SPF50+ et brumisateur d’eau thermale.', 'Avant exposition.', 'Eau thermale d’Avène, Filtres UVA/UVB.', ARRAY['Kit complet été', 'Eau thermale offerte']::text[], '{}'::text[], ARRAY['solaire', 'coffret']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDIRWnDq1iOys0Zco1IGYUSWFZiSXpARGmIeznpFSvXc_sGQIU2M8fvkH0erSR_yKtLZOJfei0xzjtCO5Lswo09HeDnCrM4EPAND-Wwxvcrq64Wo_vMNKyzhzcP4BSfBA5dqL7oy_1R3nsQfXb19WUINE6RKZrBy1qMXdCZf7I0FiQiLvr1jrGLfQtDbYARxQavKVvjruVMFD-hNDO1CnskPY15rifiyijnXWUyObsO']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('lipikar-baume-ap-plus-m', 'Lipikar Baume AP+M Relipidant Anti-Grattage 400ml', 'la-roche-posay', 'soins-corps', NULL, 79, 92, 40, 4.9, 254, '400ml', NULL, FALSE, TRUE, FALSE, 'Baume relipidant triple action pour peaux très sèches à tendance atopique.', '1 à 2 fois par jour sur tout le corps.', 'Beurre de karité, Niacinamide, Aqua Posae Filiformis.', ARRAY['Apaise les démangeaisons', 'Relipide', 'Dès la naissance']::text[], ARRAY['atopique', 'seche']::text[], ARRAY['hydratation']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuAA9R4zace48hpvCuYAZpTfJmjpQQkGe_IdUoyROX7iI2hQ00EymOSelNO-ZOxaYx26yn4lyxrkiLy3bcYjG54oWG9SO6RXVGWSZB3RCPa5YRPGBLNIBcU2d3owsQlRvtdomYePj872S9npowahf2VCEnZ4xHE2-J_OV8zpk-PXbsiXLQkhMQKgbvC7_XDvsrWUmsMUw_7H6ZgJn3e6sqT93QM13Eex3OJya6FX9Bwp']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('huile-precieuse-argan-100ml', 'Huile Précieuse Pure Pressée à Froid Visage & Cheveux 100ml', 'argania-terra', 'soins-corps', NULL, 39.9, NULL, 45, 4.9, 112, '100ml', '100% Pure', TRUE, FALSE, FALSE, 'Huile d’argan pure pressée à froid, nourrissante pour visage, corps et cheveux.', 'Quelques gouttes sur peau ou cheveux.', 'Argania Spinosa Kernel Oil 100%.', ARRAY['100% pure', 'Nourrit intensément', 'Multi-usage']::text[], '{}'::text[], ARRAY['naturel']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBMABd_I2BlxgJi_YfSf1byszAX-dn0c0Woj18oqIokNAyZxMcxwEg7INjuE04FgNi6g3X3x3d28PMJzmW6CB58jx_LjVnZIJqJ87M6RdCfuZsXsqWRh3ZHyR3TxadiAuEj4zPzQiOAgRn9xWTEeBK0MXDimvXJCIZX8MZB8PXQ51a-gYGzuYdB3RwMrgQ8PoPHKLOGCTzn5kQ0fXU8vBqArwM-UzxE_SVmsEFXIWsA']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('eucerin-urearepair-plus-10', 'UreaRepair Plus Lotion 10% Urée 250ml', 'eucerin', 'soins-corps', NULL, 45.5, 52, 33, 4.7, 73, '250ml', NULL, FALSE, FALSE, FALSE, 'Lotion pour peaux très sèches et rugueuses à 10% d’urée.', 'Matin et soir sur le corps.', 'Urée 10%, Céramides, Lactate.', ARRAY['Hydrate 48h', 'Lisse les rugosités']::text[], ARRAY['seche']::text[], ARRAY['hydratation']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuA98X6f0kutFzAOpizSOBMXVqMQUyH8QxfDXjPlCKdyJQZbJmjvnbCdFdZFMPBurxXHm4CreCcquwS8YqyFf0kmjvF7e03QfZ_QX5HpYjp5STmQq_RqAa9ojnmWmvs4S6Zb5gA8KT6cDVYsshzQZcpHRh4NJmA5FXRN9fNr_IK07ivpaJz34TddxZ-Mh6SWvpc7uksmMLpKhwYEcMODY-eKI4v2KIoO7M48ZmNgVeFL']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('ducray-anaphase-shampooing', 'Anaphase+ Shampooing Complément Anti-Chute 400ml', 'ducray', 'cheveux', NULL, 42.9, 49, 38, 4.6, 98, '400ml', NULL, FALSE, FALSE, FALSE, 'Shampooing stimulant qui complète les traitements anti-chute.', 'Appliquer, laisser poser 2 minutes, rincer.', 'Ruscus, Vitamines B, Tocophérol nicotinate.', ARRAY['Fortifie', 'Volume', 'Cheveux brillants']::text[], '{}'::text[], ARRAY['anti-chute']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuCO5Wp-N76bSezUt2e2tyJplGpxsgvWZFhbON2os7WqmWK1eF1Bkg5abrAvfSwKgV-YGW62dC6iMwBB73IIYRSkTZ7L-cin9HwARHLHONYx_b7tz68XxroVA6daD_weYLcuXht9tE3o_nVmRL-Mn8nIgYWdKj1AEPXpOONKDg01aUnsqTZOq91C_5BbKdZmlW65YpCmt0byIqZfy0Y94hslTEKOTfaq-WeUJ8GBgY-R']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('klorane-serum-quinine-edelweiss', 'Sérum Anti-Chute Quinine & Edelweiss Bio 100ml', 'klorane', 'cheveux', NULL, 64, 72, 20, 4.5, 41, '100ml', NULL, FALSE, FALSE, FALSE, 'Sérum fortifiant sans rinçage pour cheveux fatigués.', 'Chaque jour sur cuir chevelu sec.', 'Quinine, Edelweiss bio, Caféine.', ARRAY['Réduit la chute', 'Densifie']::text[], '{}'::text[], ARRAY['anti-chute']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuB33d-BFiB5eBtHNVsh8jnLNV-tOI-9o9XAK1VorOw5sqvFgiUgjhp-7DPZMWS5L76r1iIt46AzLoJPJ14kuPsGuggRFavbdNpLr_jmfOeDOY2obZJ3YMVdSblBW505vZ6Ec3fN6UPc9HD_orlHg_haMZ8DO_3yWGAGjIzS7Hxvf8-ndsJP6bm3uYpyht7YBAuwISuP_KQFuHySHgl62kzebHvyZCAlYhUzpFKd0gwV']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('mustela-hydra-bebe-visage', 'Hydra Bébé Crème Visage Peau Normale 40ml', 'mustela', 'bebe-maman', NULL, 29.9, 34, 48, 4.8, 132, '40ml', NULL, FALSE, FALSE, FALSE, 'Crème visage quotidienne qui hydrate et protège la peau de bébé.', 'Matin et soir sur le visage de bébé.', 'Avocat Perséose, Jojoba, Tournesol.', ARRAY['Dès la naissance', 'Hydrate', '95% d’ingrédients naturels']::text[], ARRAY['normale', 'sensible']::text[], ARRAY['bebe']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuAmJDBhEqHA6Arig0lc6g9sRmdknceEJM5tzdWxC0bS1WRKEczj22Mv20MQXDXJtoUL_0lIcZluoL7ElyJ9GUmsvdHe3fgplMyHA029xRqlQ168Y1LSMbaRDvwkO6jz4VJzQZyRGpOEr-DBFMwVLflDw_o_dAqVgg2jsyd34gnbGqpZ1MTQTv5JQT7cQS-LfqQFI3dRRri8H_3jo2dV7Mf5MNEelmWynTFWuwclscDQ']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('mustela-gel-lavant-doux', 'Gel Lavant Doux Cheveux & Corps Bébé 500ml', 'mustela', 'bebe-maman', NULL, 36.5, NULL, 50, 4.8, 87, '500ml', NULL, FALSE, FALSE, FALSE, 'Gel lavant ultra-doux sans larmes pour le bain de bébé.', 'Faire mousser et rincer.', 'Avocat Perséose, Glycérine.', ARRAY['Sans larmes', 'Ne dessèche pas']::text[], '{}'::text[], ARRAY['bebe', 'hygiene']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuAmJDBhEqHA6Arig0lc6g9sRmdknceEJM5tzdWxC0bS1WRKEczj22Mv20MQXDXJtoUL_0lIcZluoL7ElyJ9GUmsvdHe3fgplMyHA029xRqlQ168Y1LSMbaRDvwkO6jz4VJzQZyRGpOEr-DBFMwVLflDw_o_dAqVgg2jsyd34gnbGqpZ1MTQTv5JQT7cQS-LfqQFI3dRRri8H_3jo2dV7Mf5MNEelmWynTFWuwclscDQ']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('arkopharma-vitamine-c-1000', 'Vitamine C 1000mg Énergie & Immunité 30 Comprimés', 'arkopharma', 'complements-alimentaires', NULL, 24.9, NULL, 70, 4.6, 59, NULL, NULL, FALSE, FALSE, FALSE, 'Complément à la vitamine C pour réduire la fatigue et soutenir l’immunité.', '1 comprimé par jour le matin.', 'Acide ascorbique 1000mg.', ARRAY['Réduit la fatigue', 'Soutient l’immunité']::text[], '{}'::text[], ARRAY['vitamines']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBXht36nddP3LPVfpeBKltXJJu_oVl5TnDU4fbQPLOpF6h3-bJdcUFbFkaBknMPIhs0_BVQhdYhZYdfOn2QeCcboO4GA3gpXRZ34iGILS1ihCb-2gIjVtD3537X3Osz_kOr1VHjMOot5zw5NnPMU5NMfMxzuPadQwKzbItswo3o5ztYInpyoBPOtUIZGa3XB0eyD9HjE7jSVnmQl-l1udBpj0enrGGVmSqOjSfwaAtW']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('magnesium-b6-30-ampoules', 'Magnésium Marin + Vitamine B6 Anti-Stress 30 Ampoules', 'arkopharma', 'complements-alimentaires', NULL, 32, 38, 40, 4.7, 44, NULL, NULL, FALSE, FALSE, FALSE, 'Magnésium marin et vitamine B6 contre la fatigue et le stress.', '1 ampoule par jour.', 'Magnésium marin, Vitamine B6.', ARRAY['Réduit la fatigue', 'Équilibre nerveux']::text[], '{}'::text[], ARRAY['vitamines']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBXht36nddP3LPVfpeBKltXJJu_oVl5TnDU4fbQPLOpF6h3-bJdcUFbFkaBknMPIhs0_BVQhdYhZYdfOn2QeCcboO4GA3gpXRZ34iGILS1ihCb-2gIjVtD3537X3Osz_kOr1VHjMOot5zw5NnPMU5NMfMxzuPadQwKzbItswo3o5ztYInpyoBPOtUIZGa3XB0eyD9HjE7jSVnmQl-l1udBpj0enrGGVmSqOjSfwaAtW']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('avene-eau-thermale-spray-300ml', 'Eau Thermale Spray Apaisant 300ml', 'avene', 'sante-bien-etre', NULL, 34.5, 39, 80, 4.9, 301, '300ml', NULL, FALSE, TRUE, FALSE, 'Brumisateur d’eau thermale qui apaise et adoucit les peaux sensibles.', 'Vaporiser sur le visage, laisser agir puis sécher.', 'Eau thermale d’Avène 100%.', ARRAY['Apaise', 'Adoucit', 'Rafraîchit']::text[], ARRAY['sensible', 'atopique']::text[], ARRAY['apaisant']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuAVBBA-qwQBPaT_crJf3AyREV7GXOmqU8mY9yUSCiCtRfJF61-vPLXRgIhs6Rjs4tqHz5LnCbN4t_pVdnp9DaBLhviG3Dl-lMb9JKiCFUF7l5DNd8OUmjJdidEZVRmDGJWBHaDS6tP0YP5WGGABI52Uz0JilM_RDcQaUnLNosTNafwqsd0LMWf_mR8RDx3vYc4z6gvTjPhg9WYpTxT-QtHwbTulw5V1P45WLH_fT2Uy']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('lipikar-syndet-ap-plus', 'Lipikar Syndet AP+ Crème Lavante Relipidante 400ml', 'la-roche-posay', 'hygiene', NULL, 49.5, 56, 44, 4.8, 140, '400ml', NULL, FALSE, FALSE, FALSE, 'Crème lavante relipidante anti-irritations pour toute la famille.', 'Sous la douche, rincer.', 'Niacinamide, Beurre de karité.', ARRAY['Nettoie sans dessécher', 'Anti-irritations']::text[], ARRAY['atopique', 'seche']::text[], ARRAY['hygiene']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuCVaLy94kRLSlHNXYGJ-s8wyxGx5KowOVWOtyb8zNcDhe-bFb9WfY9IM-le_gjfmQhwbTnOXgYCwulOj0UiKcjER6IZHi7dpWkp95mbCqJGB6BI8OCJp8mLST8WuPByNsILeyrocX70CyfoxXn-bgVWxFb0jtRxQdRxphZLg_MI1fK_5QhrmgFd06GX1LGs1KytMm9ZIqp92_RDN6lqvqD8ScaTNqO_4jIpFTGDR6Ek']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;
INSERT INTO public.products (slug, name, brand_slug, category_slug, subcategory, price, compare_at_price, stock, rating, review_count, volume, badge, is_new, is_bestseller, is_featured, short_description, usage, ingredients, benefits, skin_types, tags, images, variants) VALUES ('avene-couvrance-fond-de-teint', 'Couvrance Fond de Teint Fluide Correcteur SPF20 30ml', 'avene', 'maquillage', NULL, 58, NULL, 25, 4.5, 36, '30ml', NULL, FALSE, FALSE, FALSE, 'Fond de teint haute couvrance pour peaux sensibles à imperfections.', 'Appliquer du bout des doigts.', 'Eau thermale d’Avène, Pigments.', ARRAY['Haute couvrance', 'Tenue 12h', 'Non comédogène']::text[], ARRAY['sensible']::text[], ARRAY['maquillage']::text[], ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuA75jV45y7M7sm2NbX-jC9GyfjUGysfN3s_DO3o7P9iCR0nXbHWyYI-D4VAP5QawoMdeyxyRpRkRpmaiRMmdwq-qsjzb0GYBlDVPF2VoTzZ9_2watiyhKyOeZCT0WukRKyoqKgvOMcg5R6NQcOh-4mfeO1DBHxz8ScvzX4uhJXm29KMmgvFd9kr4eq2NJDCprp8CGhz7RBQplW_rhOMDsdW0cAJZHWF2S4AHczBQK_X']::text[], '[]'::jsonb) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, images = EXCLUDED.images;

-- ----------------------------------------------------------------------------
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
SELECT id, 'serum-hydratant-booster-eclat', 'Sérum Booster Hydratant 30ml', 'BIODERMA', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB33d-BFiB5eBtHNVsh8jnLNV-tOI-9o9XAK1VorOw5sqvFgiUgjhp-7DPZMWS5L76r1iIt46AzLoJPJ14kuPsGuggRFavbdNpLr_jmfOeDOY2obZJ3YMVdSblBW505vZ6Ec3fN6UPc9HD_orlHg_haMZ8DO_3yWGAGjIzS7Hxvf8-ndsJP6bm3uYpyht7YBAuwISuP_KQFuHySHgl62kzebHvyZCAlYhUzpFKd0gwV', 78.500, 1
FROM public.orders WHERE order_number = '#TN-84920'
AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.product_slug = 'serum-hydratant-booster-eclat');

INSERT INTO public.order_items (order_id, product_slug, product_name, brand_name, image_url, unit_price, quantity)
SELECT id, 'creme-solaire-spf50-invisible-50ml', 'Crème Solaire SPF 50+ Invisible 50ml', 'HELIOPROTECT TUNISIE', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsdRpnTPcoLcxH__prXp3buv3ItU9t7pq79EYKcvjPQ2Jza5NrEL1UJrFZ4awt5pQN4bxqJjqDE1Dd2n3-5Q11yhUu23cF5UsWhsQxf2gNPYhSa9HSWzEEtnOWng5KCLymkIRnUh-4jPucF1dcFkj3E-1IXuiWWGOz1UxRrurxNk93XzUL3RssMIvWQytS1oZ3AybEqFTuaG_Aq3G-6iN_LZ4325JKyNAVlcu9YwHx', 35.000, 2
FROM public.orders WHERE order_number = '#TN-84920'
AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.product_slug = 'creme-solaire-spf50-invisible-50ml');

INSERT INTO public.reviews (product_slug, author_name, city, rating, comment, verified)
VALUES
  ('serum-hydratant-booster-eclat', 'Syrine Y.', 'Tunis (La Marsa)', 5, 'Texture ultra légère qui pénètre immédiatement sans effet collant. Ma peau est visiblement plus lumineuse dès la 2ème semaine !', TRUE),
  ('serum-hydratant-booster-eclat', 'Mariem K.', 'Sousse (Kantaoui)', 5, 'Conseillé par le pharmacien sur WhatsApp pour ma peau sensible déshydratée. Livré en 24h avec échantillons offerts.', TRUE),
  ('serum-hyalu-b5-anti-rides', 'Amel B.', 'Sfax Ville', 5, 'Produit 100% original avec code lot vérifiable. Prix très compétitif par rapport aux parapharmacies physiques.', TRUE);
