import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req as unknown as Request,
      onBeforeGenerateToken: async () => {
        // Verify authentication
        const { userId } = getAuth(req);
        if (!userId) {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Upload completed:", blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
}
