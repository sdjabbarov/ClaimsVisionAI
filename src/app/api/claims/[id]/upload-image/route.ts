import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { imageData, fileName } = body;

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Extract base64 data (remove data:image/...;base64, prefix)
    const base64Data = imageData.includes(",")
      ? imageData.split(",")[1]
      : imageData;

    // Generate filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName
      ? fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
      : "upload";
    const extension = sanitizedFileName.includes(".")
      ? sanitizedFileName.split(".").pop()
      : "jpg";
    const newFileName = `${id}_${timestamp}.${extension}`;

    // Save to public/images/uploads directory
    const uploadsDir = join(process.cwd(), "public", "images", "uploads");
    const filePath = join(uploadsDir, newFileName);

    // Ensure directory exists
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Convert base64 to buffer and write
    const buffer = Buffer.from(base64Data, "base64");
    await writeFile(filePath, buffer);

    // Return public URL
    const imageUrl = `/images/uploads/${newFileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
