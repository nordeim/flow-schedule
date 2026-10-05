// /api/notes — GET (list) + POST (create). Note shapes mirror the
// reference (session 12 wire capture): title (nullable), content, tags
// (array on the wire — the storage JSON string is unwrapped by
// serializeNote), plus created_date/updated_date/is_sample/created_by.
// Session 15 (DW-1): the Note wire carries the same server-generated
// date tokens as the Task wire (µs-padded, no Z on reads, Z on creates
// — probed on the reference's own Note traffic), so the entity
// responses ship the wire forms via okWire/okWireCreate.
import { fail, okWire, okWireCreate, readJson, requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { serializeNote } from "@/lib/serialize";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const author = { id: auth.user.id, email: auth.user.email };
  const notes = await db.note.findMany({
    where: { userId: auth.user.id },
    // The reference's fn.Note.list("-created_date") — newest first.
    orderBy: { createdAt: "desc" },
  });
  return okWire({ notes: notes.map((n) => serializeNote(n, author)) });
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
  // The create-response wire (session 15, DW-1): µs dates WITH Z.
  return okWireCreate(
    { note: serializeNote(note, { id: auth.user.id, email: auth.user.email }) },
  );
}
