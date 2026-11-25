import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatTND, getDiscountPercent } from '../lib/format'
import Stars from './Stars'

export default function ProductCard({ product, compact = false, listView = false }) {
  const { addToCart, wishlist, toggleWishlist } = useStore()
  const isFav = wishlist.includes(product.slug)
  const discount = getDiscountPercent(product.price, product.compare_at_price)
  const image = product.images?.[0]

  if (listView) {
    return (
      <div className="group card p-4 flex flex-col sm:flex-row gap-5 items-center hover:shadow-card-hover transition-all duration-300">
        <Link
          to={`/produit/${product.slug}`}
          className="relative w-full sm:w-44 aspect-square rounded-xl bg-surface-bright overflow-hidden flex items-center justify-center p-3 shrink-0"
        >
          {discount > 0 && (
            <span className="absolute top-2 left-2 badge bg-error text-on-error">-{discount}%</span>
          )}
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <div className="flex-1 flex flex-col gap-2 w-full">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-label-sm font-bold uppercase tracking-wider text-outline">
                {product.brand_name || product.brand_slug}
              </span>
              <Link
                to={`/produit/${product.slug}`}
                className="block text-headline-sm text-on-surface hover:text-primary transition-colors mt-0.5"
              >
                {product.name}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => toggleWishlist(product.slug)}
              aria-label="Ajouter aux favoris"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                isFav
                  ? 'bg-error-container text-error'
                  : 'bg-surface text-on-surface-variant hover:bg-error-container hover:text-error'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${isFav ? 'icon-fill' : ''}`}>
                favorite
              </span>
            </button>
          </div>
          <p className="text-body-md text-on-surface-variant line-clamp-2">
            {product.short_description}
          </p>
          <div className="flex items-center gap-3">
            <Stars rating={product.rating} count={product.review_count} />
            <span className="text-body-sm text-primary font-semibold">• En stock Tunis</span>
          </div>
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-outline-variant/30">
            <div className="flex items-baseline gap-2">
              <span className="text-price-display text-primary">
                {product.price.toFixed(3)}{' '}
                <span className="text-xs font-bold">TND</span>
              </span>
              {product.compare_at_price && (
                <span className="text-body-sm text-outline line-through">
                  {formatTND(product.compare_at_price, 'DT')}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => addToCart(product, 1)}
              className="btn-primary btn-sm"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group card p-4 flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative">
      {/* Badges & Wishlist */}
      <div className="flex items-center justify-between w-full mb-2 gap-1">
        <div className="flex flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="badge bg-error text-on-error">-{discount}%</span>
          )}
          {product.badge && (
            <span className="badge bg-secondary-container text-primary">
              {product.badge}
            </span>
          )}
          {!discount && !product.badge && product.is_new && (
            <span className="badge bg-secondary-container text-primary">Nouveau</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-label="Ajouter aux favoris"
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            isFav
              ? 'bg-error-container text-error'
              : 'bg-surface text-on-surface-variant hover:bg-error-container hover:text-error'
          }`}
        >
          <span className={`material-symbols-outlined text-lg ${isFav ? 'icon-fill' : ''}`}>
            favorite
          </span>
        </button>
      </div>

      {/* Product Image */}
      <Link
        to={`/produit/${product.slug}`}
        className="relative w-full aspect-square rounded-xl bg-surface-bright overflow-hidden mb-4 flex items-center justify-center p-3"
      >
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Brand & Name */}
      <div className="flex flex-col flex-1">
        <span className="text-label-sm font-bold uppercase tracking-wider text-outline">
          {product.brand_name || product.brand_slug}
        </span>
        <Link
          to={`/produit/${product.slug}`}
          className="text-label-lg font-semibold text-on-surface line-clamp-2 mt-1 hover:text-primary transition-colors"
        >
          {product.name}
        </Link>
        <div className="mt-2">
          <Stars rating={product.rating} count={product.review_count} />
        </div>
        {!compact && (
          <p className="text-body-sm text-primary font-medium mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            <span>En stock • Dispo immédiate</span>
          </p>
        )}
      </div>

      {/* Price & Action */}
      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
        <div>
          {product.compare_at_price ? (
            <span className="text-body-sm text-outline line-through block">
              {formatTND(product.compare_at_price, 'DT')}
            </span>
          ) : (
            <span className="text-body-sm text-outline block invisible">Prix</span>
          )}
          <span className="text-price-display text-primary">
            {product.price.toFixed(3)}{' '}
            <span className="text-xs font-bold">TND</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => addToCart(product, 1)}
          className="h-10 px-4 rounded-full bg-primary hover:bg-primary-container text-on-primary text-label-md font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_shopping_cart</span>
          <span>Ajouter</span>
        </button>
      </div>
    </div>
  )
}
