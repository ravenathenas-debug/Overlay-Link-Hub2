import { useState, useEffect } from "react";
const nanoid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export type Layer = {
  id: string;
  url: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  zoom?: number;
  rotation?: number;
};

const STORAGE_KEY = "stack-overlay:layers";
const BACKGROUND_STORAGE_KEY = "stack-overlay:background";

export function useLayers() {
  const [layers, setLayers] = useState<Layer[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stored layers", e);
    }
    return [];
  });

  const [background, setBackgroundState] = useState<string>(() => {
    try {
      return localStorage.getItem(BACKGROUND_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layers));
  }, [layers]);

  useEffect(() => {
    try {
      if (background) {
        localStorage.setItem(BACKGROUND_STORAGE_KEY, background);
      } else {
        localStorage.removeItem(BACKGROUND_STORAGE_KEY);
      }
    } catch {
      /* noop */
    }
  }, [background]);

  const setBackground = (url: string) => setBackgroundState(url);

  const addLayer = (url: string, label: string) => {
    setLayers((prev) => [
      ...prev,
      {
        id: nanoid(),
        url,
        label,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        visible: true,
        zoom: 100,
        rotation: 0,
      },
    ]);
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer))
    );
  };

  const removeLayer = (id: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
  };

  const duplicateLayer = (id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copy: Layer = {
        ...original,
        id: nanoid(),
        label: `${original.label} (copy)`,
        x: Math.min(100 - original.width, original.x + 2),
        y: Math.min(100 - original.height, original.y + 2),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const moveLayerUp = (index: number) => {
    if (index === 0) return;
    setLayers((prev) => {
      const newLayers = [...prev];
      const temp = newLayers[index - 1];
      newLayers[index - 1] = newLayers[index];
      newLayers[index] = temp;
      return newLayers;
    });
  };

  const moveLayerDown = (index: number) => {
    if (index === layers.length - 1) return;
    setLayers((prev) => {
      const newLayers = [...prev];
      const temp = newLayers[index + 1];
      newLayers[index + 1] = newLayers[index];
      newLayers[index] = temp;
      return newLayers;
    });
  };

  return {
    layers,
    addLayer,
    updateLayer,
    removeLayer,
    duplicateLayer,
    moveLayerUp,
    moveLayerDown,
    background,
    setBackground,
  };
}
