import type { Pool } from "pg";

export interface ReleasePayload {
  release_id: number;
  artist_id: number;
  title: string;
  artist: string;
  genre: string;
  release_date: string;
  audio_url: string;
  cover_url: string;
  isrc?: string;
  upc?: string;
  language?: string;
  label?: string;
  copyright_year?: number;
  platforms: string[];
  splits: { name: string; email: string; percentage: number; role: string }[];
}

export interface DistributionResult {
  success: boolean;
  reference: string;
  status: "submitted" | "queued" | "error";
  message: string;
}

// ISRC format: CO-IMM-YY-NNNNN  (Colombia / IM Music / year / sequence)
export function generateISRC(sequence: number): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = String(sequence).padStart(5, "0");
  return `CO-IMM-${year}-${seq}`;
}

// UPC: 12-digit barcode (checksum-valid EAN-13 prefix CO=70)
export function generateUPC(sequence: number): string {
  const base = "769" + String(sequence).padStart(8, "0");
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

export class DistributionService {
  constructor(private pool: Pool) {}

  async submitRelease(payload: ReleasePayload): Promise<DistributionResult> {
    const apiKey = process.env.ONERPM_API_KEY;
    const apiUrl = process.env.ONERPM_API_URL || "https://api.onerpm.com/v2";

    // Only call real API if key is set and not placeholder
    if (apiKey && !apiKey.startsWith("pending_")) {
      try {
        return await this.submitToONErpm(payload, apiKey, apiUrl);
      } catch (e: any) {
        console.error("ONErpm submission failed, falling back to queue:", e.message);
        await this.saveQueueError(payload, e.message);
        return { success: false, reference: "", status: "error", message: e.message };
      }
    }

    return await this.queueForDistribution(payload);
  }

  private async submitToONErpm(
    payload: ReleasePayload,
    apiKey: string,
    apiUrl: string
  ): Promise<DistributionResult> {
    const response = await fetch(`${apiUrl}/releases`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: payload.title,
        primary_artist: payload.artist,
        genre: payload.genre,
        release_date: payload.release_date,
        audio_file_url: payload.audio_url,
        artwork_url: payload.cover_url,
        isrc: payload.isrc,
        upc: payload.upc,
        language: payload.language || "es",
        label_name: payload.label,
        stores: payload.platforms.map((p) => p.toLowerCase().replace(/\s/g, "_")),
        splits: payload.splits.map((s) => ({
          name: s.name,
          email: s.email,
          percentage: s.percentage,
          role: s.role,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error("ONErpm " + response.status + ": " + JSON.stringify(err));
    }

    const data: any = await response.json();
    const reference = data.release_id || data.id || "ONERPM-UNKNOWN";

    await this.pool.query(
      "UPDATE distribution_queue SET status=$1, distributor_reference=$2, submitted_at=NOW() WHERE release_id=$3",
      ["submitted", String(reference), payload.release_id]
    ).catch(() => {});

    return {
      success: true,
      reference: String(reference),
      status: "submitted",
      message: "Enviado a ONErpm exitosamente",
    };
  }

  private async queueForDistribution(payload: ReleasePayload): Promise<DistributionResult> {
    const r = await this.pool.query(
      `INSERT INTO distribution_queue (release_id, artist_id, payload, status, distributor, created_at)
       VALUES ($1, $2, $3, 'pending', 'onerpm', NOW())
       ON CONFLICT (release_id) DO UPDATE SET payload=$3, status='pending', created_at=NOW()
       RETURNING id`,
      [payload.release_id, payload.artist_id, JSON.stringify(payload)]
    );
    const reference = "QUEUE-" + r.rows[0].id;
    return {
      success: true,
      reference,
      status: "queued",
      message: "En cola para distribución. Se procesará cuando la API esté activa.",
    };
  }

  private async saveQueueError(payload: ReleasePayload, errorMsg: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO distribution_queue (release_id, artist_id, payload, status, distributor, error_message, created_at)
       VALUES ($1, $2, $3, 'error', 'onerpm', $4, NOW())
       ON CONFLICT (release_id) DO UPDATE SET status='error', error_message=$4`,
      [payload.release_id, payload.artist_id, JSON.stringify(payload), errorMsg]
    ).catch(() => {});
  }
}
