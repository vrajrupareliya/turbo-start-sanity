import { env } from "@workspace/env/server";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const expected = env.SANITY_REVALIDATE_SECRET;
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  // Fail closed: reject when the secret is unset (undefined === undefined).
  if (!expected || secret !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request: body must be valid JSON", {
      status: 400,
    });
  }

  const syncTags: unknown = (body as { syncTags?: unknown })?.syncTags;
  if (!Array.isArray(syncTags) || syncTags.length === 0) {
    return new Response("Bad Request: syncTags must be a non-empty array", {
      status: 400,
    });
  }

  for (const tag of syncTags as string[]) {
    // `sanityFetch` tags entries as `sanity:${tag}`; `{ expire: 0 }` = no stale window.
    revalidateTag(`sanity:${tag}`, { expire: 0 });
  }

  return NextResponse.json({ revalidated: true, syncTags });
}
