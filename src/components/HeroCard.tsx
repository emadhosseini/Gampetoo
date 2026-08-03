type HeroCardProps = {
  title: string;
  emoji: string;
  status: string;
  description?: string;
  onClick?: () => void;
};

function HeroCard({
  title,
  emoji,
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

      <div className="mt-6 text-6xl">
        {emoji}
      </div>

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