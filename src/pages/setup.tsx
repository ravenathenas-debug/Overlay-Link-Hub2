import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useLayers, Layer } from "@/hooks/use-layers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Trash2, Copy, Plus, ArrowUp, ArrowDown, ExternalLink, Settings2, LayoutTemplate, Magnet, Monitor, Smartphone, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Square, Maximize, CopyPlus, Image as ImageIcon, X, Upload, RotateCw, MoveDiagonal2, Expand, ChevronLeft, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LZString from "lz-string";

type Aspect = "16:9" | "9:16";
const ASPECT_STORAGE_KEY = "stack-overlay:aspect";

const MAX_BG_FILE_BYTES = 20 * 1024 * 1024;

export default function SetupPage() {
  const { layers, addLayer, updateLayer, removeLayer, duplicateLayer, moveLayerUp, moveLayerDown, background, setBackground } = useLayers();
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [aspect, setAspect] = useState<Aspect>(() => {
    if (typeof window === "undefined") return "16:9";
    const saved = window.localStorage.getItem(ASPECT_STORAGE_KEY);
    return saved === "9:16" ? "9:16" : "16:9";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
useEffect(() => {
  return () => {
    if (background && background.startsWith("blob:")) {
      URL.revokeObjectURL(background);
    }
  };
}, [background]);
  const handleBackgroundUpload = (file: File) => {
    if (!file) return;

if (
  !file.type.startsWith("image/") &&
  !file.type.startsWith("video/")
) {
  toast({
    title: "Unsupported file",
    description: "Please choose an image or video.",
    variant: "destructive",
  });
  return;
}

if (file.size > MAX_BG_FILE_BYTES) {
  toast({
    title: "File too large",
    description: `Max ${Math.round(
      MAX_BG_FILE_BYTES / 1024 / 1024
    )} MB.`,
    variant: "destructive",
  });
  return;
}

// 🔥 clean previous file (prevents crashes)
if (background && background.startsWith("blob:")) {
  URL.revokeObjectURL(background);
}

const url = URL.createObjectURL(file);

setBackground(url);

toast({
  title: "Background loaded",
  description: file.name,
});

};

  const setAspectAndSave = (next: Aspect) => {
    setAspect(next);
    try {
      window.localStorage.setItem(ASPECT_STORAGE_KEY, next);
    } catch {
      /* noop */
    }
  };

  const obsDimensions = aspect === "9:16" ? "1080 × 1920" : "1920 × 1080";

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const handleAddLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newLabel) return;
    if (!isValidUrl(newUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid HTTP/HTTPS URL.", variant: "destructive" });
      return;
    }
    
    addLayer(newUrl, newLabel);
    setNewUrl("");
    setNewLabel("");
  };

  const generatedUrl = useMemo(() => {
    if (layers.length === 0 && !background) return "";
    const payload = JSON.stringify({ layers, background: background || undefined });
    const compressed = LZString.compressToEncodedURIComponent(payload);

    const origin = window.location.origin;
    return `${origin}/overlay?c=${compressed}`;
  }, [layers, background]);

  const copyToClipboard = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      toast({ title: "Copied!", description: "Overlay URL copied to clipboard." });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen md:h-screen w-full bg-background text-foreground flex flex-col md:flex-row">
      {/* Floating button to reopen the sidebar when collapsed */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 flex items-center gap-2 px-3 py-2 rounded-md bg-card/90 backdrop-blur border border-border shadow-md text-sm font-medium text-foreground hover:bg-card transition-colors"
          title="Show menu"
          aria-label="Show menu"
        >
          <Menu size={16} />
          <span className="hidden sm:inline">Menu</span>
        </button>
      )}

      {/* Left Sidebar - Configuration */}
      {sidebarOpen && (
      <div className="w-full md:w-[450px] flex-shrink-0 border-r border-border bg-card/50 flex flex-col md:h-full md:overflow-hidden">
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <LayoutTemplate size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex-1 min-w-0">Stack Overlay</h1>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Hide menu"
              aria-label="Hide menu"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Combine multiple browser source widgets into a single OBS browser source.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/50">
            <Label htmlFor="bg-url" className="flex items-center gap-2">
              <ImageIcon size={14} /> Background Image / GIF
            </Label>
            <div className="flex gap-2">
              <Input
                id="bg-url"
                placeholder="Paste image / GIF URL"
                value={background.startsWith("blob:") ? "" : background}
                onChange={(e) => setBackground(e.target.value)}
                className="text-xs"
                disabled={background.startsWith("blob:")}
              />
              {background && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setBackground("")}
                  aria-label="Clear background"
                  title="Clear background"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <input
  ref={bgFileInputRef}
  type="file"
  accept="image/*,video/mp4,video/webm"
  onChange={(e) => {
    const file = e.target.files?.[0];
if (file) handleBackgroundUpload(file);
  }}
/>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => bgFileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {background.startsWith("data") ? "Replace uploaded file" : "Upload from device"}
            </Button>
            {background.startsWith("blob:") && (
              <p className="text-xs text-muted-foreground">
                Using uploaded file ({Math.round((background.length * 0.75) / 1024)} KB embedded in URL).
              </p>
            )}
            {!background && (
              <p className="text-xs text-muted-foreground">
                Leave empty for a fully transparent overlay.
              </p>
            )}
          </div>

          <form onSubmit={handleAddLayer} className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div>
              <Label htmlFor="url">Browser Source URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/widget"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="label">Layer Name</Label>
              <Input
                id="label"
                placeholder="e.g. Gift Alerts"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!newUrl || !newLabel}>
              <Plus className="w-4 h-4 mr-2" /> Add Layer
            </Button>
          </form>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Settings2 size={18} /> Layers
            </h2>
            
            {layers.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground">
                <p className="text-sm">No layers added yet.</p>
                <p className="text-xs mt-2">Add your first layer above to start building your overlay.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {layers.map((layer, index) => (
                  <Card key={layer.id} className={`transition-opacity ${!layer.visible ? 'opacity-60' : ''}`}>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Switch
                          checked={layer.visible}
                          onCheckedChange={(checked) => updateLayer(layer.id, { visible: checked })}
                        />
                        <div className="truncate">
                          <CardTitle className="text-sm font-medium truncate">{layer.label}</CardTitle>
                          <CardDescription className="text-xs truncate">{new URL(layer.url).hostname}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLayerUp(index)} disabled={index === 0} title="Move up" aria-label="Move up">
                          <ArrowUp size={14} />
                        </Button>
                        <Button
  variant="ghost"
  size="icon"
  className="h-7 w-7"
  onClick={() => moveLayerDown(index)}
  disabled={index === layers.length - 1}
  title="Move down"
  aria-label="Move down"
>
                          <ArrowDown size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateLayer(layer.id)} title="Duplicate layer" aria-label="Duplicate layer">
                          <CopyPlus size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/90" onClick={() => {
                          if (confirm('Remove this layer?')) removeLayer(layer.id);
                        }} title="Remove layer" aria-label="Remove layer">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="grid grid-cols-[auto_1fr_40px] items-center gap-3">
                          <Label className="w-12 text-xs">X Pos</Label>
                          <Slider 
                            value={[layer.x]} 
                            max={100} 
                            step={1}
                            onValueChange={([val]) => updateLayer(layer.id, { x: val })}
                          />
                          <span className="text-xs text-right tabular-nums">{layer.x}%</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr_40px] items-center gap-3">
                          <Label className="w-12 text-xs">Y Pos</Label>
                          <Slider 
                            value={[layer.y]} 
                            max={100} 
                            step={1}
                            onValueChange={([val]) => updateLayer(layer.id, { y: val })}
                          />
                          <span className="text-xs text-right tabular-nums">{layer.y}%</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr_40px] items-center gap-3">
                          <Label className="w-12 text-xs">Width</Label>
                          <Slider 
                            value={[layer.width]} 
                            max={100} 
                            step={1}
                            onValueChange={([val]) => updateLayer(layer.id, { width: val })}
                          />
                          <span className="text-xs text-right tabular-nums">{layer.width}%</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr_40px] items-center gap-3">
                          <Label className="w-12 text-xs">Height</Label>
                          <Slider 
                            value={[layer.height]} 
                            max={100} 
                            step={1}
                            onValueChange={([val]) => updateLayer(layer.id, { height: val })}
                          />
                          <span className="text-xs text-right tabular-nums">{layer.height}%</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr_40px] items-center gap-3">
                          <Label className="w-12 text-xs">Zoom</Label>
                          <Slider
                            value={[layer.zoom ?? 100]}
                            min={50}
                            max={300}
                            step={5}
                            onValueChange={([val]) => updateLayer(layer.id, { zoom: val })}
                          />
                          <button
                            type="button"
                            onClick={() => updateLayer(layer.id, { zoom: 100 })}
                            className="text-xs text-right tabular-nums hover:text-foreground text-muted-foreground transition-colors"
                            title="Reset to 100%"
                          >
                            {layer.zoom ?? 100}%
                          </button>
                        </div>
                        <div className="grid grid-cols-[auto_1fr_40px] items-center gap-3">
                          <Label className="w-12 text-xs">Rotate</Label>
                          <Slider
                            value={[layer.rotation ?? 0]}
                            min={-180}
                            max={180}
                            step={1}
                            onValueChange={([val]) => updateLayer(layer.id, { rotation: val })}
                          />
                          <button
                            type="button"
                            onClick={() => updateLayer(layer.id, { rotation: 0 })}
                            className="text-xs text-right tabular-nums hover:text-foreground text-muted-foreground transition-colors"
                            title="Reset to 0°"
                          >
                            {Math.round(layer.rotation ?? 0)}°
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Output Panel at bottom of sidebar */}
        <div className="p-6 border-t border-border bg-card">
          <Label>Generated OBS Output URL</Label>
          <div className="flex mt-2 gap-2">
            <Input readOnly value={generatedUrl || "Add layers to generate URL"} className="font-mono text-xs" />
            <Button onClick={copyToClipboard} disabled={!generatedUrl} variant="secondary">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Copy this URL and add it as a <strong>Browser Source</strong> in OBS. Set the size to <strong>{obsDimensions}</strong>.
          </p>
        </div>
      </div>
      )}

      {/* Right Content - Preview */}
      <div className="flex-1 min-h-[70vh] md:min-h-0 bg-background flex flex-col items-stretch justify-center p-4 md:p-6 overflow-hidden relative gap-4">
        <div className="absolute inset-0 checkered-pattern opacity-50 z-0"></div>

        <PreviewCanvas
          layers={layers}
          updateLayer={updateLayer}
          aspect={aspect}
          setAspect={setAspectAndSave}
          background={background}
        />
      </div>
    </div>
  );
}

type PreviewCanvasProps = {
  layers: Layer[];
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  aspect: Aspect;
  setAspect: (a: Aspect) => void;
  background: string;
};

const Background = React.memo(({ src }: { src: string }) => {
  if (!src) return null;

  const isVideo =
    src.endsWith(".mp4") ||
    src.endsWith(".webm") ||
    src.includes("video");

  return isVideo ? (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      controls={false}
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  ) : (
    <img
      src={src}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  );
});
function PreviewCanvas({ layers, updateLayer, aspect, setAspect, background }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [snap, setSnap] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const isPortrait = aspect === "9:16";

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);
  const activeLayer = layers.find((l) => l.id === activeId) ?? null;

  const applyPreset = (preset: Preset) => {
    if (!activeLayer) return;
    const w = activeLayer.width;
    const h = activeLayer.height;
    let next: Partial<Layer> = {};
    switch (preset) {
      case "tl":
        next = { x: 0, y: 0 };
        break;
      case "tr":
        next = { x: 100 - w, y: 0 };
        break;
      case "center":
        next = { x: (100 - w) / 2, y: (100 - h) / 2 };
        break;
      case "bl":
        next = { x: 0, y: 100 - h };
        break;
      case "br":
        next = { x: 100 - w, y: 100 - h };
        break;
      case "fill":
        next = { x: 0, y: 0, width: 100, height: 100 };
        break;
    }
    updateLayer(activeLayer.id, next);
  };

  const presetButtons: { id: Preset; label: string; icon: typeof Square }[] = [
    { id: "tl", label: "Top Left", icon: ArrowUpLeft },
    { id: "tr", label: "Top Right", icon: ArrowUpRight },
    { id: "center", label: "Center", icon: Square },
    { id: "bl", label: "Bottom Left", icon: ArrowDownLeft },
    { id: "br", label: "Bottom Right", icon: ArrowDownRight },
    { id: "fill", label: "Full Screen", icon: Maximize },
  ];

  return (
    <div className="relative z-10 mx-auto flex flex-col gap-3 w-full max-w-5xl min-h-0 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/70 backdrop-blur border border-border/60 rounded-lg px-4 py-2">
        <div className="flex items-center gap-1 rounded-md bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setAspect("16:9")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              !isPortrait
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={!isPortrait}
          >
            <Monitor size={13} /> 16:9
          </button>
          <button
            type="button"
            onClick={() => setAspect("9:16")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isPortrait
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={isPortrait}
          >
            <Smartphone size={13} /> 9:16
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Magnet size={14} />
            <span>Snap to {GRID_STEP}% grid</span>
            <Switch
              checked={snap}
              onCheckedChange={setSnap}
              aria-label="Toggle snap to grid"
            />
          </label>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Open fullscreen preview"
            aria-label="Open fullscreen preview"
          >
            <Expand size={13} />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      {activeLayer && (
        <div className="flex flex-wrap items-center gap-3 bg-card/70 backdrop-blur border border-border/60 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <LayoutTemplate size={13} />
            <span className="truncate">
              Quick position: <span className="text-foreground font-medium">{activeLayer.label}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 ml-auto">
            {presetButtons.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  title={p.label}
                  aria-label={p.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div
          ref={canvasRef}
          className={`relative bg-black/40 border border-white/10 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5 max-w-full max-h-full ${
            isPortrait
              ? "h-full aspect-[9/16]"
              : "w-full aspect-video"
          }`}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setActiveId(null);
          }}
        >
          <Background src={background} />

          {layers.filter((l) => l.visible).map((layer) => (
            <InteractiveLayer
              key={layer.id}
              layer={layer}
              canvasRef={canvasRef}
              isActive={activeId === layer.id}
              onActivate={() => setActiveId(layer.id)}
              updateLayer={updateLayer}
              snap={snap}
            />
          ))}

          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 font-medium pointer-events-none text-sm">
              {aspect} OBS Canvas Preview
            </div>
          )}
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            type="button"  
          onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors"
            title="Exit fullscreen (Esc)"
            aria-label="Exit fullscreen preview"
          >
            <X size={18} />
          </button>
          <div className="absolute top-4 left-4 z-10 text-xs text-muted-foreground bg-card/80 backdrop-blur border border-border rounded px-2.5 py-1">
            Fullscreen preview · {aspect} · press Esc to exit
          </div>
          <div
            className={`relative bg-black overflow-hidden shadow-2xl max-w-full max-h-full ${
              isPortrait ? "h-full aspect-[9/16]" : "w-full aspect-video"
            }`}
          >
            <Background src={background} />
            
            {layers.filter((l) => l.visible).map((layer) => {
              const zoom = layer.zoom ?? 100;
              const rotation = layer.rotation ?? 0;
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
                  {isVideoUrl(layer.url) ? (
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
    title={layer.label}
    className="border-none pointer-events-none absolute top-0 left-0"
    style={{
      width: `${10000 / (layer.zoom ?? 100)}%`,
      height: `${10000 / (layer.zoom ?? 100)}%`,
      transform: `scale(${(layer.zoom ?? 100) / 100})`,
      transformOrigin: "0 0",
      willChange: "transform",
    }}
  />
)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type InteractiveLayerProps = {
  layer: Layer;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  onActivate: () => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  snap: boolean;
};

type DragMode =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw"
  | "rotate";

const MIN_PCT = 4;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
const isVideoUrl = (url: string) => {
  return (
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.includes("video/upload") || // Cloudinary
    url.includes("cdn.discordapp")
  );
};
const InteractiveLayer = React.memo(function InteractiveLayer({
  layer,
  canvasRef,
  isActive,
  onActivate,
  updateLayer,
  snap,
}: InteractiveLayerProps) {
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const frame = useRef<number | null>(null);
  const snapVal = (n: number) =>
    snapRef.current ? Math.round(n / GRID_STEP) * GRID_STEP : n;
  const startRef = useRef<{
    pointerId: number;
    mode: DragMode;
    startX: number;
    startY: number;
    startLayer: { x: number; y: number; width: number; height: number };
    canvasW: number;
    canvasH: number;
    target: HTMLElement;
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  } | null>(null);

  const beginDrag = useCallback(
    (mode: DragMode) =>
      (e: React.PointerEvent<HTMLElement>) => {
        e.stopPropagation();
        e.preventDefault();
        onActivate();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + ((layer.x + layer.width / 2) / 100) * rect.width;
        const centerY = rect.top + ((layer.y + layer.height / 2) / 100) * rect.height;
        const startAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
        startRef.current = {
          pointerId: e.pointerId,
          mode,
          startX: e.clientX,
          startY: e.clientY,
          startLayer: {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
          },
          canvasW: rect.width,
          canvasH: rect.height,
          target: e.currentTarget,
          centerX,
          centerY,
          startAngle,
          startRotation: layer.rotation ?? 0,
        };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      },
    [canvasRef, layer.x, layer.y, layer.width, layer.height, layer.rotation, onActivate]
  );

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = startRef.current;
      if (!s || s.pointerId !== e.pointerId) return;

      if (s.mode === "rotate") {
        const currentAngle =
          (Math.atan2(e.clientY - s.centerY, e.clientX - s.centerX) * 180) / Math.PI;
        let newRot = s.startRotation + (currentAngle - s.startAngle);
        newRot = ((newRot + 540) % 360) - 180;
        if (snapRef.current) {
          newRot = Math.round(newRot / 15) * 15;
        }
        updateLayer(layer.id, { rotation: Math.round(newRot) });
        return;
      }

      const dxPct = ((e.clientX - s.startX) / s.canvasW) * 100;
      const dyPct = ((e.clientY - s.startY) / s.canvasH) * 100;

      let { x, y, width, height } = s.startLayer;

      switch (s.mode) {
        case "move":
          x = clamp(snapVal(s.startLayer.x + dxPct), 0, 100 - width);
          y = clamp(snapVal(s.startLayer.y + dyPct), 0, 100 - height);
          break;
        case "e":
          width = clamp(snapVal(s.startLayer.width + dxPct), MIN_PCT, 100 - x);
          break;
        case "w": {
          const newW = clamp(snapVal(s.startLayer.width - dxPct), MIN_PCT, s.startLayer.x + s.startLayer.width);
          x = s.startLayer.x + (s.startLayer.width - newW);
          width = newW;
          break;
        }
        case "s":
          height = clamp(snapVal(s.startLayer.height + dyPct), MIN_PCT, 100 - y);
          break;
        case "n": {
          const newH = clamp(snapVal(s.startLayer.height - dyPct), MIN_PCT, s.startLayer.y + s.startLayer.height);
          y = s.startLayer.y + (s.startLayer.height - newH);
          height = newH;
          break;
        }
        case "ne": {
          width = clamp(snapVal(s.startLayer.width + dxPct), MIN_PCT, 100 - x);
          const newH = clamp(snapVal(s.startLayer.height - dyPct), MIN_PCT, s.startLayer.y + s.startLayer.height);
          y = s.startLayer.y + (s.startLayer.height - newH);
          height = newH;
          break;
        }
        case "nw": {
          const newW = clamp(snapVal(s.startLayer.width - dxPct), MIN_PCT, s.startLayer.x + s.startLayer.width);
          x = s.startLayer.x + (s.startLayer.width - newW);
          width = newW;
          const newH = clamp(snapVal(s.startLayer.height - dyPct), MIN_PCT, s.startLayer.y + s.startLayer.height);
          y = s.startLayer.y + (s.startLayer.height - newH);
          height = newH;
          break;
        }
        case "se":
          width = clamp(snapVal(s.startLayer.width + dxPct), MIN_PCT, 100 - x);
          height = clamp(snapVal(s.startLayer.height + dyPct), MIN_PCT, 100 - y);
          break;
        case "sw": {
          const newW = clamp(snapVal(s.startLayer.width - dxPct), MIN_PCT, s.startLayer.x + s.startLayer.width);
          x = s.startLayer.x + (s.startLayer.width - newW);
          width = newW;
          height = clamp(snapVal(s.startLayer.height + dyPct), MIN_PCT, 100 - y);
          break;
        }
      }

      if (frame.current) cancelAnimationFrame(frame.current);

frame.current = requestAnimationFrame(() => {
  updateLayer(layer.id, {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
  });
});

      
    },
    [layer.id, updateLayer]
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const s = startRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    try {
      s.target.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    startRef.current = null;
  }, []);

  const handleClasses =
    "absolute bg-primary border border-white/80 shadow-md touch-none";
  const cornerSize = "w-3.5 h-3.5";
  const sideSize = "w-3 h-3";

  return (
    <div
      className={`absolute select-none touch-none will-change-transform ${
  isActive ? "ring-2 ring-primary" : "ring-1 ring-primary/40"
}`}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        height: `${layer.height}%`,
        transform: `rotate(${layer.rotation ?? 0}deg)`,
        transformOrigin: "50% 50%",
      }}
      onPointerDown={() => onActivate()}
    >
      <div
        className="absolute -top-6 left-0 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded-t font-medium truncate max-w-[calc(100%-2rem)] pointer-events-none"
      >
        {layer.label}{layer.rotation ? ` · ${Math.round(layer.rotation)}°` : ""}
      </div>

      {/* rotation handle */}
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary border-2 border-white/80 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing touch-none text-primary-foreground"
        onPointerDown={beginDrag("rotate")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title="Drag to rotate"
        aria-label="Rotate layer"
      >
        <RotateCw size={14} />
      </div>
      {/* connector line from rotate handle to layer */}
      <div
        aria-hidden
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-primary/60 pointer-events-none"
      />

      {/* media renderer */}
{isVideoUrl(layer.url) ? (
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
    className="opacity-80 pointer-events-none border-0 absolute top-0 left-0"
    sandbox="allow-scripts allow-same-origin"
    style={{
      width: `${10000 / (layer.zoom ?? 100)}%`,
      height: `${10000 / (layer.zoom ?? 100)}%`,
      transform: `scale(${(layer.zoom ?? 100) / 100})`,
      transformOrigin: "0 0",
    }}
  />
)}

      {/* move surface — covers the full layer */}
      <div
        className="absolute inset-0 cursor-move touch-none bg-primary/10 hover:bg-primary/15 active:bg-primary/20 transition-colors"
        onPointerDown={beginDrag("move")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label={`Drag ${layer.label}`}
      />

      {/* edge handles */}
      <div
        className={`${handleClasses} ${sideSize} left-1/2 -top-1.5 -translate-x-1/2 cursor-n-resize rounded-sm`}
        onPointerDown={beginDrag("n")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div
        className={`${handleClasses} ${sideSize} left-1/2 -bottom-1.5 -translate-x-1/2 cursor-s-resize rounded-sm`}
        onPointerDown={beginDrag("s")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div
        className={`${handleClasses} ${sideSize} top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize rounded-sm`}
        onPointerDown={beginDrag("w")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div
        className={`${handleClasses} ${sideSize} top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize rounded-sm`}
        onPointerDown={beginDrag("e")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      {/* corner handles */}
      <div
        className={`${handleClasses} ${cornerSize} -top-2 -left-2 cursor-nw-resize rounded-sm`}
        onPointerDown={beginDrag("nw")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div
        className={`${handleClasses} ${cornerSize} -top-2 -right-2 cursor-ne-resize rounded-sm`}
        onPointerDown={beginDrag("ne")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div
        className={`${handleClasses} ${cornerSize} -bottom-2 -left-2 cursor-sw-resize rounded-sm`}
        onPointerDown={beginDrag("sw")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      {/* Large bottom-right resize grip with arrow icon for easy resizing */}
      <div
        className="absolute -bottom-3 -right-3 w-7 h-7 rounded-md bg-primary border-2 border-white/80 shadow-md flex items-center justify-center cursor-se-resize touch-none text-primary-foreground"
        onPointerDown={beginDrag("se")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title="Drag to resize"
        aria-label="Resize layer"
      >
        <MoveDiagonal2 size={14} />
      </div>
    </div>
  );
});
