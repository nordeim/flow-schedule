// /api/notes/[id] — PATCH + DELETE.
import { fail, ok, readJson, requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;

  const existing = await db.note.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return fail("NOT_FOUND", "Note not found.", 404);
  }

  const body = await readJson(req);
  const data: Record<string, unknown> = {};
  if (typeof body.content === "string") {
    const content = body.content.trim();
    if (!content) return fail("VALIDATION", "Note content cannot be empty.");
    if (content.length > 10_000) {
      return fail("VALIDATION", "Note content must be 10,000 characters or fewer.");
    }
    data.content = content;
  }
  if ("title" in body) {
    data.title =
      typeof body.title === "string" && body.title.trim().length > 0
        ? body.title.trim().slice(0, 300)
        : null;
  }
  if (Array.isArray(body.tags)) {
    data.tags = JSON.stringify(
      body.tags
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().slice(0, 50))
        .slice(0, 20),
    );
  }

  const note = await db.note.update({ where: { id }, data });
  return ok({ note: serializeNote(note) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;

  const existing = await db.note.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return fail("NOT_FOUND", "Note not found.", 404);
  }
  await db.note.delete({ where: { id } });
  return ok({ deleted: id });
}
