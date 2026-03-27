export async function uploadToBunny(
  buffer: Buffer,
  fileName: string,
  folder: string = "cvs"
): Promise<string> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE!;
  const apiKey = process.env.BUNNY_API_KEY!;
  const region = process.env.BUNNY_REGION || "storage";
  const cdnUrl = process.env.BUNNY_CDN_URL!;

  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${timestamp}-${sanitized}`;

  const uploadUrl = `https://${region}.bunnycdn.com/${storageZone}/${path}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bunny CDN upload failed (${response.status}): ${text}`);
  }

  return `${cdnUrl}/${path}`;
}

export async function deleteFromBunny(cdnUrl: string): Promise<void> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE!;
  const apiKey = process.env.BUNNY_API_KEY!;
  const region = process.env.BUNNY_REGION || "storage";
  const baseCdnUrl = process.env.BUNNY_CDN_URL!;

  const path = cdnUrl.replace(`${baseCdnUrl}/`, "");
  const deleteUrl = `https://${region}.bunnycdn.com/${storageZone}/${path}`;

  await fetch(deleteUrl, {
    method: "DELETE",
    headers: { AccessKey: apiKey },
  });
}
