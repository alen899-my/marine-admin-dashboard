import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const startValue = 0;
    const endValue = target;

    function animate(timestamp: number) {
      if (!start) start = timestamp;

      const progress = Math.min((timestamp - start) / duration, 1);

      // FULL COUNT 0 → target (every number)
      const current = Math.floor(startValue + (endValue - startValue) * progress);

      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}
