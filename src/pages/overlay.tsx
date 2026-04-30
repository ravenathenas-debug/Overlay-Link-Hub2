import { useEffect, useState } from "react";
import LZString from "lz-string";
import { Layer } from "@/hooks/use-layers";

type OverlayConfig = {
  layers: Layer[];
  background?: string;
};

export default function OverlayPage() {
  const [config, setConfig] = useState<OverlayConfig>({ layers: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("overlay-mode");
    document.body.classList.add("overlay-mode");
    return () => {
      document.documentElement.classList.remove("overlay-mode");
      document.body.classList.remove("overlay-mode");
    };
  }, []);

  useEffect(() => {
  const id = "live-overlay";

  const unsubscribe = (window as any).db
    .collection("overlays")
    .doc(id)
    .onSnapshot((doc: any) => {
      const data = doc.data();
      if (!data) return;

      setConfig({
        layers: data.layers || [],
        background: data.background || undefined,
      });

      setError(null);
    });

  return () => unsubscribe();
}, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-white/50 text-sm font-mono pointer-events-none">
        {error}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {config.background && (
  config.background.endsWith(".mp4") || config.background.endsWith(".webm") ? (
    <video
      src={config.background}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  ) : (
    <img
      src={config.background}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  )
)}
      {config.layers.filter((l) => l.visible).map((layer) => {
  const zoom = layer.zoom ?? 100;
  const rotation = layer.rotation ?? 0;

  const isVideo =
    layer.url.endsWith(".mp4") ||
    layer.url.endsWith(".webm") ||
    layer.url.includes("video") ||
    layer.url.includes("cdn.discordapp");

  return (
    <div
      key={layer.id}
      className="absolute overflow-hidden pointer-events-none"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        height: `${layer.height}%`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      {isVideo ? (
        <video
          src={layer.url}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          preload="auto"
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <iframe
          src={layer.url}
          className="border-none pointer-events-none absolute top-0 left-0"
          style={{
            width: `${10000 / zoom}%`,
            height: `${10000 / zoom}%`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: "0 0",
          }}
        />
      )}
    </div>
  );
})}
