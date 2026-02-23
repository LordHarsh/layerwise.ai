import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blobs } = await list({ prefix: `${userId}/` });

    const files = blobs.map((blob) => {
      const parts = blob.pathname.split("/");
      const filename = parts.length >= 3 ? parts.slice(2).join("/") : parts[parts.length - 1];
      return {
        url: blob.url,
        filename,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };
    });

    // Sort by most recent first
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
