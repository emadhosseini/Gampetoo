import { Outlet } from "react-router-dom";
import MobileContainer from "./MobileContainer";
import BottomNavigation from "./BottomNavigation";

function Layout() {
  return (
    <MobileContainer>
      <main className="pb-24">
        <Outlet />
      </main>

      <BottomNavigation />
    </MobileContainer>
  );
}

export default Layout;