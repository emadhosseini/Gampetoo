import MeshGradientBackground from "@/components/background/MeshGradientBackground";

type MobileContainerProps = {
  children: React.ReactNode;
};

function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="app-gradient-bg pt-safe relative mx-auto min-h-screen max-w-md shadow-2xl">
      <MeshGradientBackground colorA="#3b9149" colorB="#faea5c" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default MobileContainer;