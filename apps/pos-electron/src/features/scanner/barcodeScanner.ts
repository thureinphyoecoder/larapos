import type { Product, Variant } from "../../core/types/contracts";

type DetectorResult = { rawValue?: string };
type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<DetectorResult[]>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return detector ?? null;
}

export function isCameraScannerSupported(): boolean {
  return Boolean(getBarcodeDetectorCtor()) && Boolean(navigator.mediaDevices?.getUserMedia);
}

export class CameraBarcodeScanner {
  private stream: MediaStream | null = null;
  private timerId: number | null = null;
  private polling = false;
  private readonly detector: BarcodeDetectorLike | null;

  constructor() {
    const Detector = getBarcodeDetectorCtor();
    this.detector = Detector
      ? new Detector({
          formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"],
        })
      : null;
  }

  async open(video: HTMLVideoElement): Promise<void> {
    if (!isCameraScannerSupported()) {
      throw new Error("Camera barcode/QR scan is not supported on this device.");
    }

    this.stop(video);

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    video.srcObject = this.stream;
    await video.play();
  }

  start(video: HTMLVideoElement, onCodeDetected: (code: string) => Promise<void>): void {
    if (!this.detector) return;

    this.polling = true;

    const loop = async () => {
      if (!this.polling) return;

      if (video.readyState < 2) {
        this.timerId = window.setTimeout(() => {
          void loop();
        }, 400);
        return;
      }

      try {
        const results = await this.detector.detect(video);
        const code = results.find((item) => typeof item.rawValue === "string")?.rawValue?.trim();
        if (code) {
          await onCodeDetected(code);
          this.stop(video);
          return;
        }
      } catch {
        // Ignore single detect failures and continue polling.
      }

      this.timerId = window.setTimeout(() => {
        void loop();
      }, 400);
    };

    void loop();
  }

  stop(video?: HTMLVideoElement | null): void {
    this.polling = false;

    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    if (video) {
      video.srcObject = null;
    }
  }
}

export function findProductByScanCode(
  products: Product[],
  code: string,
): { product: Product; variant?: Variant } | null {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  for (const product of products) {
    if (product.sku?.toLowerCase() === normalized) {
      const firstActive = product.active_variants?.find((item) => item.is_active);
      if (!firstActive) continue;
      return { product, variant: firstActive };
    }

    const variant = product.active_variants?.find((item) => item.sku.toLowerCase() === normalized);
    if (variant) return { product, variant };
  }

  return null;
}
