import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await params;
  try {
    const { imageDataUrl } = await request.json();

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Convert data URL to buffer
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Generate filename
    const filename = `${claimId}_annotated_${Date.now()}.jpg`;
    const filePath = join(
      process.cwd(),
      "public",
      "images",
      "annotated",
      "edited_by_claims_agent",
      filename
    );

    // Write file
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = `/images/annotated/edited_by_claims_agent/${filename}`;

    return NextResponse.json({ imageUrl: publicPath });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}
