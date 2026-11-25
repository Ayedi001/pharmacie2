export default function Stars({ rating = 5, count = null, size = 'text-sm' }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.3 && rating - full < 0.8
  const fullAdjusted = rating - full >= 0.8 ? full + 1 : full

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex text-tertiary" aria-label={`Note ${rating} sur 5`}>
        {[1, 2, 3, 4, 5].map((idx) => {
          let icon = 'star_border'
          if (idx <= fullAdjusted) icon = 'star'
          else if (idx === fullAdjusted + 1 && half) icon = 'star_half'
          return (
            <span key={idx} className={`material-symbols-outlined ${size} icon-fill`}>
              {icon}
            </span>
          )
        })}
      </div>
      {count !== null && (
        <span className="text-body-sm text-outline font-semibold">
          {Number(rating).toFixed(1)} ({count})
        </span>
      )}
    </div>
  )
}
