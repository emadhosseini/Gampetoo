import type { ReactNode } from "react";

type InfoCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
};

function InfoCard({
  icon,
  title,
  value,
}: InfoCardProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 text-center">
      <div className="mb-4 flex justify-center text-3xl">
        {icon}
      </div>

      <p className="text-sm text-white">
        {title}
      </p>

      <h2 className="mt-2 whitespace-pre-line text-xl font-semibold">
        {value}
      </h2>
    </div>
  );
}

export default InfoCard;