type MobileContainerProps = {
  children: React.ReactNode;
};

function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="app-gradient-bg pt-safe relative mx-auto min-h-screen max-w-md shadow-2xl">
      <div className="light-sweep" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default MobileContainer;