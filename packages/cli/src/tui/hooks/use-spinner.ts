import { useEffect, useState } from "react";
import { SPINNER_FRAMES } from "../constants";

export function useSpinner(isActive: boolean): string {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setFrame(0);
      return;
    }

    const timer = setInterval(() => {
      setFrame((current) => (current + 1) % SPINNER_FRAMES.length);
    }, 120);

    return () => clearInterval(timer);
  }, [isActive]);

  return SPINNER_FRAMES[frame] ?? SPINNER_FRAMES[0];
}
