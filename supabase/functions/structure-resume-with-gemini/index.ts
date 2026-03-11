// @ts-nocheck — Supabase Edge Function (Deno). Structures extracted resume text via Gemini; same patterns as reference ai-score.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESUMES_TABLE = "resumes";
const RESUME_BLOCKS_TABLE = "resume_blocks";

const BlockSchema = z.object({
  type: z.string().min(1),
  title: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

const GeminiResultSchema = z.object({
  basics: z.record(z.unknown()),
  blocks: z.array(BlockSchema),
});

// Always return HTTP 200 so supabase.functions.invoke can read the body.
// Use ok:false + message for errors so the client can surface the real reason.
function jsonResponse(obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errResponse(message: string) {
  console.error(`[structure-resume-with-gemini] error:`, message);
  return jsonResponse({ ok: false, error: message, message });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fast Flash models first; one attempt each to stay within 1–2 min for ~10k char resumes
const modelsToTry = [
  { name: "gemini-2.0-flash", version: "v1beta" },
  { name: "gemini-2.5-flash", version: "v1beta" },
  { name: "gemini-flash-latest", version: "v1beta" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const resumeId = (body?.resumeId ?? body?.body?.resumeId ?? "").toString().trim();
    const text = (body?.text ?? body?.body?.text ?? "").toString().trim();

    console.log(`[structure-resume-with-gemini] resumeId: ${resumeId}, text length: ${text.length}`);

    if (!resumeId || !UUID_REGEX.test(resumeId)) {
      return errResponse("Valid resumeId (UUID) is required.");
    }

    if (!text || text.length < 20) {
      return errResponse(`Resume text is too short (${text.length} chars). Please provide at least 20 characters.`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return errResponse("Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: verify ownership via auth header
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (user && !userError) {
        const { data: row } = await supabase
          .from(RESUMES_TABLE)
          .select("id, user_id")
          .eq("id", resumeId)
          .maybeSingle();
        if (row && (row as { user_id?: string }).user_id !== user.id) {
          return errResponse("You do not own this resume.");
        }
      }
    }

    const { data: resumeRow, error: resumeErr } = await supabase
      .from(RESUMES_TABLE)
      .select("id")
      .eq("id", resumeId)
      .maybeSingle();

    if (resumeErr || !resumeRow) {
      return errResponse("Resume not found. It may have been deleted.");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return errResponse("Gemini API key is not configured. Please add GEMINI_API_KEY in your Supabase project's Edge Function secrets.");
    }

    // Cap at 10k chars for fast response (target: result within 1–2 min for typical resumes)
    const resumeInput = text.slice(0, 10000);
    const prompt = `Parse this resume into JSON. Sections: experience, education, skills, projects, certifications, awards. Output ONLY valid JSON.

{"basics":{"name":null,"email":null,"phone":null,"location":null,"headline":null,"summary":null,"linkedin":null,"github":null,"portfolio":null},"blocks":[{"type":"experience","title":"Work Experience","data":{"items":[{"role":"","company":"","dates":"","description":""}]}},{"type":"education","data":{"items":[{"name":"","degree":"","dates":""}]}},{"type":"skills","data":{"items":[]}},{"type":"projects","data":{"items":[{"name":"","description":"","url":""}]}}]}

Use blocks[].data.items for lists. Preserve all content.

Resume:
${resumeInput}`;

    let response: Response | null = null;
    let lastError: Error | null = null;

    for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
      const { name: modelName, version } = modelsToTry[modelIndex];
      try {
        console.log(`[structure-resume-with-gemini] trying model: ${modelName}`);
        const GEMINI_URL = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        response = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          console.log(`[structure-resume-with-gemini] success with model: ${modelName}`);
          break;
        }

        if (response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          lastError = new Error(`Gemini rate limit hit (model: ${modelName}). Please try again in a moment.`);
          response = null;
          continue;
        }

        if (response.status === 404) {
          lastError = new Error(`Model ${modelName} not available, trying next…`);
          response = null;
          continue;
        }

        const errorText = await response.text();
        lastError = new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 200)}`);
        response = null;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error("Network error calling Gemini.");
        response = null;
      }
    }

    if (!response || !response.ok) {
      const msg = lastError?.message ?? "All Gemini models failed. Check your API key and try again.";
      return errResponse(msg);
    }

    const geminiResponse = await response.json();
    const finishReason = geminiResponse.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS") {
      console.warn("[structure-resume-with-gemini] Response was truncated due to MAX_TOKENS.");
    }

    let content = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content || content.trim().length === 0) {
      console.error("[structure-resume-with-gemini] Empty response from Gemini:", JSON.stringify(geminiResponse));
      return errResponse(`Empty response from Gemini (finish reason: ${finishReason ?? "unknown"}). Please try again.`);
    }

    // Clean markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    let parsed: z.infer<typeof GeminiResultSchema>;
    try {
      const raw = JSON.parse(cleanedContent);
      const result = GeminiResultSchema.safeParse(raw);
      if (!result.success) {
        throw new Error(`Validation failed: ${result.error.message}`);
      }
      parsed = result.data;
    } catch (parseError) {
      const msg = finishReason === "MAX_TOKENS"
        ? "Gemini response was cut off. Try again or use a shorter resume."
        : `Failed to parse Gemini response: ${parseError instanceof Error ? parseError.message : "unknown"}`;
      console.error("[structure-resume-with-gemini] Parse failed:", cleanedContent.slice(0, 300));
      return errResponse(msg);
    }

    // Save to DB
    console.log("[structure-resume-with-gemini] stage: save");
    const { data: existingMeta } = await supabase
      .from(RESUMES_TABLE)
      .select("meta")
      .eq("id", resumeId)
      .maybeSingle();
    const currentMeta =
      existingMeta?.meta != null && typeof existingMeta.meta === "object"
        ? (existingMeta.meta as Record<string, unknown>)
        : {};

    const { error: updateError } = await supabase
      .from(RESUMES_TABLE)
      .update({
        basics: parsed.basics,
        meta: { ...currentMeta, parsed: true },
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId);

    if (updateError) return errResponse(`Failed to save resume basics: ${updateError.message}`);

    const { error: deleteError } = await supabase
      .from(RESUME_BLOCKS_TABLE)
      .delete()
      .eq("resume_id", resumeId);
    if (deleteError) return errResponse(`Failed to clear old blocks: ${deleteError.message}`);

    if (parsed.blocks.length > 0) {
      const rows = parsed.blocks.map((b, i) => ({
        resume_id: resumeId,
        type: b.type,
        title: b.title ?? null,
        content: b.data ?? {},
        sort_order: i,
      }));
      const { error: insertError } = await supabase.from(RESUME_BLOCKS_TABLE).insert(rows);
      if (insertError) return errResponse(`Failed to save resume blocks: ${insertError.message}`);
    }

    const blocksCount = parsed.blocks.length;
    console.log("[structure-resume-with-gemini] done, blocksCount:", blocksCount);
    return jsonResponse({
      ok: true,
      blocksCount,
      basics: parsed.basics,
      blocks: parsed.blocks.map((b) => ({ type: b.type, title: b.title ?? null, data: b.data ?? {} })),
    });
  } catch (e) {
    console.error("[structure-resume-with-gemini] unhandled error:", e);
    return jsonResponse({
      ok: false,
      error: "Structuring failed",
      message: e instanceof Error ? e.message : "An unexpected error occurred. Please try again.",
    });
  }
});
