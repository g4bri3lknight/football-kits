'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ImagePlus, Trash2, Crop, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FaceCropper, FaceCrop, clampCrop, cropToCanvas, defaultCrop } from './FaceCropper';

/** Cosa mandare al server per le immagini del giocatore. Campi assenti = non toccare. */
export interface PlayerPhotoPayload {
  imageData?: string | null;
  imageMimeType?: string | null;
  fullImageData?: string | null;
  fullImageMimeType?: string | null;
  cropX?: number | null;
  cropY?: number | null;
  cropSize?: number | null;
}

export interface PlayerPhotoFieldHandle {
  /** Payload da unire ai dati del giocatore; null se la foto non è stata modificata. */
  getPayload: () => Promise<PlayerPhotoPayload | null>;
}

interface PlayerPhotoFieldProps {
  /** Giocatore in modifica (assente = nuovo) */
  player?: {
    id: string;
    hasImage?: boolean;
    hasFullImage?: boolean;
    cropX?: number | null;
    cropY?: number | null;
    cropSize?: number | null;
    updatedAt?: string | Date;
  } | null;
  disabled?: boolean;
}

type SourceKind = 'new' | 'existing-full' | 'existing-thumb';

interface Source {
  url: string;
  kind: SourceKind;
}

const MAX_FULL_SIDE = 1600; // lato massimo della foto intera salvata
const MAX_PLAIN_SIDE = 1024; // lato massimo quando si usa l'immagine così com'è
const THUMB_SIZE = 320; // miniatura del volto (px)

const bust = (updatedAt?: string | Date) => (updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '');

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1] ?? '');
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

const canvasToBase64 = (canvas: HTMLCanvasElement, quality = 0.9): string =>
  canvas.toDataURL('image/jpeg', quality).split(',')[1] ?? '';

/** Ridimensiona (solo in riduzione) e converte in JPEG; ritorna la data URL. */
const downscale = (img: HTMLImageElement, maxSide: number): HTMLCanvasElement => {
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * k);
  canvas.height = Math.round(img.naturalHeight * k);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export const PlayerPhotoField = forwardRef<PlayerPhotoFieldHandle, PlayerPhotoFieldProps>(function PlayerPhotoField(
  { player, disabled },
  ref
) {
  const hasExisting = !!player?.hasImage;
  const existingFull = !!player?.hasFullImage;

  const initialSource = useCallback((): Source | null => {
    if (!player || !player.hasImage) return null;
    if (player.hasFullImage) return { url: `/api/players/${player.id}/image/full${bust(player.updatedAt)}`, kind: 'existing-full' };
    return null; // foto "semplice" già salvata: si mostra la miniatura, il selettore si apre solo su richiesta
  }, [player]);

  const [source, setSource] = useState<Source | null>(initialSource);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<FaceCrop>({ x: 0.3, y: 0.05, s: 0.4 });
  const [useFull, setUseFull] = useState(true); // true = ritaglio del volto; false = usa tutta l'immagine
  const [removed, setRemoved] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Il ritaglio salvato si applica una sola volta, quando la foto esistente è caricata
  const savedCropApplied = useRef(false);

  // Cambio giocatore / riapertura: riparte da zero
  useEffect(() => {
    setSource(initialSource());
    setImgEl(null);
    setSize(null);
    setUseFull(true);
    setRemoved(false);
    setTouched(false);
    setError(null);
    savedCropApplied.current = false;
  }, [player?.id, initialSource]);

  const handleImageLoad = (img: HTMLImageElement) => {
    const dims = { width: img.naturalWidth, height: img.naturalHeight };
    setImgEl(img);
    setSize(dims);
    if (source?.kind === 'existing-full' && !savedCropApplied.current && player?.cropSize) {
      savedCropApplied.current = true;
      setCrop(clampCrop({ x: player.cropX ?? 0, y: player.cropY ?? 0, s: player.cropSize }, dims.width, dims.height));
    } else if (!savedCropApplied.current) {
      savedCropApplied.current = true;
      setCrop(defaultCrop(dims.width, dims.height));
    }
  };

  // Anteprima dei tre formati, aggiornata mentre si trascina
  const previews = useRef<{ big?: HTMLCanvasElement | null; mid?: HTMLCanvasElement | null; small?: HTMLCanvasElement | null }>({});
  useEffect(() => {
    if (!imgEl || !size) return;
    const draw = (cv: HTMLCanvasElement | null | undefined, px: number) => {
      const ctx = cv?.getContext('2d');
      if (!cv || !ctx) return;
      const c = useFull ? crop : cover(size);
      ctx.clearRect(0, 0, px, px);
      ctx.drawImage(cropToCanvas(imgEl, c, px * 2), 0, 0, px, px);
    };
    draw(previews.current.big, 128);
    draw(previews.current.mid, 48);
    draw(previews.current.small, 32);
  }, [imgEl, size, crop, useFull]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine (JPG, PNG, WebP…)');
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      savedCropApplied.current = false;
      setSource({ url, kind: 'new' });
      setImgEl(null);
      setSize(null);
      setUseFull(true);
      setRemoved(false);
      setTouched(true);
    } catch {
      setError('Impossibile leggere il file');
    }
  };

  const openCropOnExistingThumb = () => {
    if (!player) return;
    savedCropApplied.current = false;
    setSource({ url: `/api/players/${player.id}/image${bust(player.updatedAt)}`, kind: 'existing-thumb' });
    setImgEl(null);
    setSize(null);
    setUseFull(true);
    setTouched(true);
  };

  const removePhoto = () => {
    setSource(null);
    setImgEl(null);
    setSize(null);
    setRemoved(true);
    setTouched(true);
  };

  useImperativeHandle(
    ref,
    () => ({
      async getPayload() {
        if (!touched) return null;
        if (removed || !source) {
          // Rimozione esplicita (o nulla da salvare)
          return removed ? { imageData: null, imageMimeType: null, fullImageData: null } : null;
        }
        if (!imgEl || !size) return null;

        if (!useFull) {
          // "Usa tutta l'immagine": un'unica foto, nessuna foto intera
          const canvas = downscale(imgEl, MAX_PLAIN_SIDE);
          return {
            imageData: canvasToBase64(canvas, 0.9),
            imageMimeType: 'image/jpeg',
            fullImageData: null,
            cropX: null,
            cropY: null,
            cropSize: null,
          };
        }

        const thumb = canvasToBase64(cropToCanvas(imgEl, crop, THUMB_SIZE), 0.9);
        const base: PlayerPhotoPayload = {
          imageData: thumb,
          imageMimeType: 'image/jpeg',
          cropX: crop.x,
          cropY: crop.y,
          cropSize: crop.s,
        };

        if (source.kind === 'existing-full') {
          // Foto intera già sul server: si aggiornano solo miniatura e coordinate
          return base;
        }
        if (source.kind === 'existing-thumb') {
          // La foto "semplice" esistente diventa la foto intera (si rimanda così com'è, senza ricomprimerla)
          const res = await fetch(source.url);
          const blob = await res.blob();
          return { ...base, fullImageData: await blobToBase64(blob), fullImageMimeType: blob.type || 'image/jpeg' };
        }
        // Foto nuova: si salva la versione ridimensionata
        const full = downscale(imgEl, MAX_FULL_SIDE);
        return { ...base, fullImageData: canvasToBase64(full, 0.88), fullImageMimeType: 'image/jpeg' };
      },
    }),
    [touched, removed, source, imgEl, size, crop, useFull]
  );

  const showCropper = !!source;
  const currentThumb = player?.hasImage && !touched ? `/api/players/${player.id}/image${bust(player.updatedAt)}` : null;

  return (
    <div className="md:col-span-2 space-y-2">
      <Label>Foto giocatore</Label>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} disabled={disabled} />

      {!showCropper && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3">
          {currentThumb ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentThumb} alt="Foto attuale" className="h-14 w-14 rounded-lg border object-cover" />
              <div className="text-xs text-muted-foreground">
                Foto presente{existingFull ? ' (con foto intera)' : ''}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              {removed ? 'La foto verrà rimossa al salvataggio.' : 'Nessuna foto. Carica anche una foto a figura intera: potrai scegliere il volto per le miniature.'}
            </div>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={disabled}>
              <ImagePlus className="mr-1.5 h-4 w-4" />
              {hasExisting && !removed ? 'Cambia foto' : 'Carica foto'}
            </Button>
            {hasExisting && !existingFull && !removed && (
              <Button type="button" variant="outline" size="sm" onClick={openCropOnExistingThumb} disabled={disabled}>
                <Crop className="mr-1.5 h-4 w-4" />
                Modifica ritaglio
              </Button>
            )}
            {hasExisting && !removed && (
              <Button type="button" variant="outline" size="sm" onClick={removePhoto} disabled={disabled}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Rimuovi
              </Button>
            )}
          </div>
        </div>
      )}

      {showCropper && (
        <div className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row">
          <div className="max-w-full shrink-0">
            <FaceCropper
              src={source!.url}
              crop={crop}
              imageSize={size}
              onChange={(c) => {
                setCrop(c);
                setTouched(true);
              }}
              onImageLoad={handleImageLoad}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs text-muted-foreground">
              {useFull
                ? 'Trascina il quadrato sul volto e ridimensionalo con il cerchio rosso. Card e biografia mostreranno solo quella parte; la foto intera si aprirà con un clic sulla miniatura nella biografia.'
                : 'La foto verrà usata così com’è nelle miniature, senza foto intera.'}
            </p>
            <div className="flex items-end gap-4">
              <figure className="text-center text-[11px] text-muted-foreground">
                <canvas
                  ref={(el) => { previews.current.big = el; }}
                  width={128}
                  height={128}
                  className="mx-auto mb-1 h-24 w-24 rounded-xl border-2 border-[#cd2127] bg-black/30"
                />
                Biografia
              </figure>
              <figure className="text-center text-[11px] text-muted-foreground">
                <canvas
                  ref={(el) => { previews.current.mid = el; }}
                  width={48}
                  height={48}
                  className="mx-auto mb-1 h-12 w-12 rounded-lg border-2 border-[#cd2127] bg-black/30"
                />
                Card
              </figure>
              <figure className="text-center text-[11px] text-muted-foreground">
                <canvas
                  ref={(el) => { previews.current.small = el; }}
                  width={32}
                  height={32}
                  className="mx-auto mb-1 h-8 w-8 rounded-md border-2 border-[#cd2127] bg-black/30"
                />
                Liste
              </figure>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={disabled}>
                <ImagePlus className="mr-1.5 h-4 w-4" />
                Cambia foto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setUseFull((v) => !v);
                  setTouched(true);
                }}
                disabled={disabled}
              >
                {useFull ? <Maximize className="mr-1.5 h-4 w-4" /> : <Crop className="mr-1.5 h-4 w-4" />}
                {useFull ? 'Usa tutta l’immagine' : 'Seleziona il volto'}
              </Button>
              {hasExisting && (
                <Button type="button" variant="outline" size="sm" onClick={removePhoto} disabled={disabled}>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Rimuovi
                </Button>
              )}
              {!hasExisting && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSource(null);
                    setImgEl(null);
                    setSize(null);
                    setTouched(false);
                  }}
                  disabled={disabled}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Annulla foto
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

/** Quadrato centrato che copre tutta l'immagine (equivale a object-cover). */
function cover(size: { width: number; height: number }): FaceCrop {
  const ratio = size.height / size.width;
  const s = Math.min(1, ratio);
  return { x: (1 - s) / 2, y: (ratio - s) / 2, s };
}
