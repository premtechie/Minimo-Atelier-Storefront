export const STAR_PATH = "M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z";

/** Five stars, filled to the nearest whole star (colours in reviews.css). */
export function Stars({ value, size = 16, label }: { value: number; size?: number; label?: string }) {
  return (
    <span className="rv-stars" role="img" aria-label={label ?? `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d={STAR_PATH} className={i <= Math.round(value) ? "rv-on" : "rv-off"} />
        </svg>
      ))}
    </span>
  );
}
