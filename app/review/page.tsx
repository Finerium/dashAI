import { ReviewClient } from "@/components/review-client";

export const metadata = {
  title: "Penyimpanan Bukti — dashAI",
  description:
    "Tinjau, segel secara kriptografis, dan ekspor bukti pelanggaran lalu lintas yang terkumpul.",
};

/**
 * Server shell for the evidence review page. All interactivity (IndexedDB read,
 * sealing, report download) lives in the client component below.
 */
export default function ReviewPage() {
  return <ReviewClient />;
}
