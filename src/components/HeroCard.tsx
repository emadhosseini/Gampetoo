type HeroCardProps = {
  title: string;
  emoji: string;
  // A drawn illustration to show instead of the emoji. Not every state has
  // one (see characterIcons — `upper` and the rest-less days don't), so the
  // emoji stays the fallback rather than being replaced outright.
  iconSrc?: string;
  status: string;
  description?: string;
  onClick?: () => void;
};

function HeroCard({
  title,
  emoji,
  iconSrc,
  status,
  description,
  onClick,
}: HeroCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="glass-panel w-full rounded-[32px] p-8 text-center disabled:cursor-default"
    >
      <p className="text-sm text-white">
        {title}
      </p>

      {iconSrc ? (
        // Fixed square so the card's height doesn't jump between an icon
        // that's still loading and one that's painted, and identical across
        // icons so it doesn't shift as the program moves from day to day.
        // Rendered at 128px from a 384px source — 3x, so it stays crisp on
        // the phone screens this app is built for.
        <img
          src={iconSrc}
          alt=""
          aria-hidden="true"
          width={128}
          height={128}
          className="mx-auto mt-6 h-32 w-32 object-contain"
        />
      ) : (
        <div className="mt-6 text-6xl">
          {emoji}
        </div>
      )}

      <h2 className="mt-5 text-3xl font-bold">
        {status}
      </h2>

      {description && (
        <p className="mt-4 text-sm leading-7 text-white">
          {description}
        </p>
      )}
    </button>
  );
}

export default HeroCard;