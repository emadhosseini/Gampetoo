import { Outlet, useLocation } from "react-router-dom";
import MobileContainer from "./MobileContainer";
import BottomNavigation from "./BottomNavigation";
import SideMenu from "./SideMenu";

// Pages built around StatChartPage's full-bleed top panel — see the
// bleedTop prop on MobileContainer.
const BLEED_TOP_ROUTES = ["/progress/weight", "/progress/calories", "/progress/water", "/progress/activity"];

function Layout() {
  const { pathname } = useLocation();

  return (
    <MobileContainer bleedTop={BLEED_TOP_ROUTES.includes(pathname)}>
      <SideMenu>
        <main className="h-full overflow-y-auto pb-36">
          <Outlet />
        </main>

        <BottomNavigation />
      </SideMenu>
    </MobileContainer>
  );
}

export default Layout;