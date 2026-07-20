import AnimatedBackground from "./background/AnimatedBackground";

type MobileContainerProps = {
  children: React.ReactNode;
};

function MobileContainer({ children }: MobileContainerProps) {
  return (
    <AnimatedBackground className="pt-safe mx-auto max-w-md shadow-2xl">
      {children}
    </AnimatedBackground>
  );
}

export default MobileContainer;