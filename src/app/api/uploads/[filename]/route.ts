import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// Allow only safe filenames (no path traversal)
const SAFE_FILENAME = /^[a-zA-Z0-9_.-]+$/;

const EXT_TO_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename || !SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const uploadsDir = join(process.cwd(), "public", "images", "uploads");
    const filePath = join(uploadsDir, filename);
    const buffer = await readFile(filePath);

    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType = EXT_TO_TYPE[ext] ?? "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[uploads] Failed to serve image:", filename, error);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
