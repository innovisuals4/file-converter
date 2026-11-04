import { NextResponse } from "next/server";
import { formatById, getRoute, targetsFor } from "@/lib/registry";
import { runConversion } from "@/lib/server/convert";
import {
  ConversionError,
  contentDispositionValue,
  parseOptions,
  rateLimit,
  requestIp,
  resolveInputFormat,
} from "@/lib/server/util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

function errorResponse(code: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status: code });
}

export async function POST(req: Request) {
  // --- Rate limiting -------------------------------------------------
  const ip = requestIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return errorResponse(429, "Too many conversions from this device — please wait a few minutes and try again.", {
      retryAfter: rl.retryAfter,
    });
  }

  // --- Upload size guards --------------------------------------------
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_UPLOAD_BYTES + 1024 * 512) {
    return errorResponse(413, "File is too large. The limit is 100 MB per file.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errorResponse(400, "Could not read the upload. Please retry.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse(400, "No file was uploaded.");
  }
  if (file.size === 0) {
    return errorResponse(415, "The uploaded file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return errorResponse(413, "File is too large. The limit is 100 MB per file.");
  }

  const target = String(form.get("target") ?? "");
  if (!/^[a-z0-9]+$/.test(target) || !formatById(target)) {
    return errorResponse(400, "Invalid output format.");
  }

  let optionsRaw: unknown = {};
  const optionsStr = form.get("options");
  if (typeof optionsStr === "string" && optionsStr.trim()) {
    try {
      optionsRaw = JSON.parse(optionsStr);
    } catch {
      return errorResponse(400, "Invalid conversion options.");
    }
  }

  // --- Identify the input format from actual bytes --------------------
  const input = Buffer.from(await file.arrayBuffer());
  let from: string;
  try {
    const resolved = await resolveInputFormat(input, file.name);
    from = resolved.from;
  } catch (err) {
    if (err instanceof ConversionError) return errorResponse(err.code, err.message);
    return errorResponse(415, "This file type could not be identified.");
  }

  // --- Registry lookup -------------------------------------------------
  const route = getRoute(from, target);
  if (!route) {
    const valid = targetsFor(from).map((r) => r.to);
    return errorResponse(
      422,
      `Converting ${from.toUpperCase()} to ${target.toUpperCase()} is not supported.`,
      { validTargets: valid },
    );
  }

  const options = parseOptions(route.options, optionsRaw);

  // --- Run -------------------------------------------------------------
  try {
    const result = await runConversion({ input, filename: file.name, from, to: target, options });

    const meta = Buffer.from(
      JSON.stringify({
        from,
        to: target,
        name: result.filename,
        size: result.buffer.length,
        ms: result.ms,
        engine: result.engine,
      }),
    ).toString("base64url");

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mime,
        "Content-Length": String(result.buffer.length),
        "Content-Disposition": contentDispositionValue(result.filename),
        "X-Transmute-Result": meta,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ConversionError) {
      return errorResponse(err.code, err.message, {
        from,
        to: target,
        validTargets: err.code === 422 ? targetsFor(from).map((r) => r.to) : undefined,
      });
    }
    console.error("[api/convert] fatal:", err);
    return errorResponse(500, "Something went wrong while converting. Please try again.");
  }
}
