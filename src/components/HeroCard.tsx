type HeroCardProps = {
  title: string;
  emoji: string;
  status: string;
  description?: string;
};

function HeroCard({
  title,
  emoji,
  status,
  description,
}: HeroCardProps) {
  return (
    <div className="glass-panel rounded-[32px] p-8 text-center">
      <p className="text-sm text-zinc-200">
        {title}
      </p>

      <div className="mt-6 text-6xl">
        {emoji}
      </div>

      <h2 className="mt-5 text-3xl font-bold">
        {status}
      </h2>

      {description && (
        <p className="mt-4 text-sm leading-7 text-zinc-200">
          {description}
        </p>
      )}
    </div>
  );
}

export default HeroCard;