/**
 * License-plate OCR via Tesseract.js. Runs only on a small cropped region of a
 * confirmed-violation frame (OCR is expensive), never on the full live stream.
 */
let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

// Indonesian plate: 1–2 letter region code, 1–4 digits, 1–3 letter suffix.
const PLATE_RE = /\b([A-Z]{1,2})\s?(\d{1,4})\s?([A-Z]{1,3})\b/;

async function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** OCR a cropped plate image. Returns the normalised plate or null. */
export async function readPlate(
  crop: HTMLCanvasElement | ImageData,
): Promise<string | null> {
  try {
    const worker = await getWorker();
    const source =
      crop instanceof ImageData ? imageDataToCanvas(crop) : crop;
    const { data } = await worker.recognize(source);
    const text = data.text.toUpperCase().replace(/[^A-Z0-9\s]/g, " ");
    const m = PLATE_RE.exec(text);
    return m ? `${m[1]} ${m[2]} ${m[3]}` : null;
  } catch {
    return null;
  }
}

function imageDataToCanvas(img: ImageData): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d")!.putImageData(img, 0, 0);
  return c;
}

export function isValidPlate(text: string | null | undefined): boolean {
  return !!text && PLATE_RE.test(text.toUpperCase());
}
