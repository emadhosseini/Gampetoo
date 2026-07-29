import { Outlet } from "react-router-dom";
import MobileContainer from "./MobileContainer";
import BottomNavigation from "./BottomNavigation";
import SideMenu from "./SideMenu";

function Layout() {
  return (
    <MobileContainer>
      <SideMenu>
        <main className="h-full overflow-y-auto pb-28">
          <Outlet />
        </main>

        <BottomNavigation />
      </SideMenu>
    </MobileContainer>
  );
}

export default Layout;