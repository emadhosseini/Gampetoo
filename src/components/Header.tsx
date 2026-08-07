import { getCurrentUserName } from "@/utils/userEngine";

function Header() {
  const userName = getCurrentUserName() ?? "";

  return (
    // pb-10, not the old pb-6: today's date used to sit under the heading
    // here, and its own height was what actually separated this from the
    // card below — removing it (see formatTodayFull's doc comment) shrank
    // that gap down to whatever padding was left, which read as cramped.
    // This restores the gap directly instead of leaning on a line of text
    // that no longer exists to provide it.
    <header className="px-6 pt-8 pb-10 text-center">
      <p className="text-sm text-white">
        سلام {userName}
      </p>

      <h1 className="mt-2 text-3xl font-bold">
        امروز چه برنامه‌ای داری؟
      </h1>
    </header>
  );
}

export default Header;
