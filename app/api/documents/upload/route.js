import { requireUser, createAdminClient } from "../../../../lib/supabase/server";
import { json, errorResponse } from "../../../../lib/api";
import { extractText } from "unpdf";

export const runtime = "nodejs";
export async function POST(request) {
  try {
    const user = await requireUser(); const form = await request.formData(); const file = form.get("file");
    if (!file || file.type !== "application/pdf") throw new Error("Please upload a PDF file.");
    if (file.size > 40 * 1024 * 1024) throw new Error("PDFs must be smaller than 4 MB.");
    const buffer = Buffer.from(await file.arrayBuffer()); const { text } = await extractText(new Uint8Array(buffer), { mergePages: false });
    const pages = text.map((value, i) => ({ page: i + 1, text: value.trim() })).filter(p => p.text);
    if (!pages.length) throw new Error("This PDF has no extractable text. Scanned PDFs are not supported.");
    const admin = createAdminClient(); const id = crypto.randomUUID(); const path = `${user.id}/${id}.pdf`;
    const uploaded = await admin.storage.from("documents").upload(path, buffer, { contentType: "application/pdf", upsert: false });
    if (uploaded.error) throw uploaded.error;
    const { data, error } = await admin.from("documents").insert({ id, owner_id: user.id, filename: file.name, storage_path: path, page_count: pages.length, extracted_pages: pages }).select("id,filename,page_count").single();
    if (error) throw error; return json(data);
  } catch (e) { return errorResponse(e); }
}
