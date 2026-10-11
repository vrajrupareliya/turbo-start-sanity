import { timingSafeEqual } from "node:crypto";
import { Logger } from "@workspace/logger";
import { type NextRequest, NextResponse } from "next/server";

import {
  deletePostFromAlgolia,
  syncAllPublishedPostsToAlgolia,
  syncSinglePostToAlgolia,
} from "@/lib/algolia-admin";

const logger = new Logger("AlgoliaSyncRoute");

function isAuthorized(req: NextRequest): boolean {
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET;

  const authHeader = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const secretHeader = req.headers.get("x-webhook-secret");
  const provided = authHeader || secretHeader;

  if (!provided) return false;

  const validSecrets = [adminKey, revalidateSecret].filter((s): s is string =>
    Boolean(s && s.length > 0)
  );

  for (const valid of validSecrets) {
    try {
      const a = Buffer.from(provided);
      const b = Buffer.from(valid);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

type SyncRequestBody = {
  action?: "sync" | "update" | "delete";
  id?: string;
  _id?: string;
  _type?: string;
};

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    logger.warn("Unauthorized Algolia sync attempt rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: SyncRequestBody = {};
    try {
      body = (await req.json()) as SyncRequestBody;
    } catch {
      // Body may be empty for simple POST /api/algolia/sync
    }

    const { action, id, _id, _type } = body;
    const targetId = id || _id;

    if (action === "delete" && targetId) {
      const res = await deletePostFromAlgolia(targetId);
      return NextResponse.json(res);
    }

    if (action === "update" && targetId) {
      const res = await syncSinglePostToAlgolia(targetId);
      return NextResponse.json(res);
    }

    if (_type === "blog" && targetId) {
      const res = await syncSinglePostToAlgolia(targetId);
      return NextResponse.json(res);
    }

    // Default: full sync of all published posts
    const res = await syncAllPublishedPostsToAlgolia();
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Algolia sync failed", { error: message });
    return NextResponse.json(
      { error: message || "Internal server error" },
      { status: 500 }
    );
  }
}
