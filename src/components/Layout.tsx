import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MobileContainer from "./MobileContainer";
import BottomNavigation from "./BottomNavigation";
import SideMenu from "./SideMenu";

// Pages built around StatChartPage's full-bleed top panel — see the
// bleedTop prop on MobileContainer.
const BLEED_TOP_ROUTES = ["/progress/weight", "/progress/calories", "/progress/activity"];

function Layout() {
  const { pathname } = useLocation();

  // While the bottom nav's quick-add drawer is open, the page content
  // behind it gets a real CSS filter blur — applied here because <main>
  // is BottomNavigation's sibling. Deliberately NOT a backdrop-filter
  // overlay: on iOS WebKit that rendered or silently didn't depending on
  // whether an ancestor happened to carry a transform at that moment,
  // while a plain filter on the content itself always renders.
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <MobileContainer bleedTop={BLEED_TOP_ROUTES.includes(pathname)}>
      <SideMenu>
        <main
          id="app-scroll-root"
          className="h-full overflow-y-auto pb-36"
          style={{
            filter: quickAddOpen ? "blur(15px)" : "none",
            transition: "filter 200ms ease",
          }}
        >
          <Outlet />
        </main>

        <BottomNavigation onDrawerOpenChange={setQuickAddOpen} />
      </SideMenu>
    </MobileContainer>
  );
}

export default Layout;
