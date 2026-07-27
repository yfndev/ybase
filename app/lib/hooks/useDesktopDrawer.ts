import { useEffect, useState } from "react";

const DESKTOP_DRAWER_QUERY = "(min-width: 1200px)";

export function useDesktopDrawer() {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(DESKTOP_DRAWER_QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_DRAWER_QUERY);
    const update = () => setIsDesktop(mediaQuery.matches);

    mediaQuery.addEventListener("change", update);
    update();
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
