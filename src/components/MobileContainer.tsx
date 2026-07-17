type MobileContainerProps = {
  children: React.ReactNode;
};

function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-zinc-950 shadow-2xl">
      {children}
    </div>
  );
}

export default MobileContainer;