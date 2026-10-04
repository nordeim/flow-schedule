// /api/notes — GET (list) + POST (create). Note shapes mirror the reference:
// title (nullable), content, tags (JSON string array).
import { fail, ok, readJson, requireUser } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const notes = await db.note.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });
  return ok({ notes });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await readJson(req);
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return fail("VALIDATION", "Note content is required.");
  }
  if (content.length > 10_000) {
    return fail("VALIDATION", "Note content must be 10,000 characters or fewer.");
  }
  const title =
    typeof body.title === "string" && body.title.trim().length > 0
      ? body.title.trim().slice(0, 300)
      : null;

  let tags: string[] = [];
  if (Array.isArray(body.tags)) {
    tags = body.tags
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim().slice(0, 50))
      .slice(0, 20);
  }

  const note = await db.note.create({
    data: {
      title,
      content,
      tags: JSON.stringify(tags),
      userId: auth.user.id,
    },
  });
  return ok({ note }, 201);
}
