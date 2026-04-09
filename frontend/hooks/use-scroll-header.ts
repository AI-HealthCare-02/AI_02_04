import { useState, useEffect } from "react";

/**
 * 윈도우 스크롤 위치를 추적해 스크롤 여부를 반환합니다.
 * scrollY > 0 이면 true, 0이면 false.
 */
export function useScrollHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // 마운트 시 초기값 반영
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return isScrolled;
}
