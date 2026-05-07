export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || secret !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME;
  if (!username) {
    return Response.json({ error: "NEXT_PUBLIC_GITHUB_USERNAME not set" }, { status: 500 });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return Response.json({ message: "KV not configured — nothing to clear" });
  }

  try {
    const { kv } = await import("@vercel/kv");
    await kv.del(`github:${username}:v2`);
    return Response.json({ message: "Cache cleared", username });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
