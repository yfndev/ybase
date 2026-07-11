import { type RefObject, useEffect } from "react";
import type SignaturePad from "react-signature-canvas";

export function useSignatureResize(padRef: RefObject<SignaturePad | null>) {
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    const canvas = pad.getCanvas();

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.offsetWidth * ratio;
      const height = canvas.offsetHeight * ratio;
      if (!width || !height) return;
      if (canvas.width === width && canvas.height === height) return;
      const drawing = pad.toData();
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      if (drawing.length > 0) pad.fromData(drawing);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [padRef]);
}
