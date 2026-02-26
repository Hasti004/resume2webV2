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

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errResponse(stage: string, error: string, status = 500) {
  console.error(`[structure-resume-with-gemini] ${stage}:`, error);
  return jsonResponse({ ok: false, stage, error }, status);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const modelsToTry = [
  { name: "gemini-flash-latest", version: "v1beta" }, // Cheapest and fastest
  { name: "gemini-2.5-flash", version: "v1beta" },
  { name: "gemini-2.0-flash", version: "v1beta" },
  { name: "gemini-2.0-flash-exp", version: "v1beta" },
  { name: "gemini-pro-latest", version: "v1beta" },
  { name: "gemini-2.5-pro", version: "v1beta" },
  { name: "gemini-3-pro-preview", version: "v1beta" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const ensureCors = (res: Response) => {
    const h = new Headers(res.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => h.set(k, v));
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  };

  try {
    const body = await req.json().catch(() => ({}));
    const resumeId = (body?.resumeId ?? body?.body?.resumeId ?? "").toString().trim();
    const text = (body?.text ?? body?.body?.text ?? "").toString().trim();

    console.log(`[structure-resume-with-gemini] resumeId: ${resumeId}, text length: ${text.length}`);

    if (!resumeId || !UUID_REGEX.test(resumeId)) {
      return jsonResponse(
        { error: "Invalid input", message: "Valid resumeId (UUID) is required." },
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text || text.length < 20) {
      return jsonResponse(
        { error: "Text too short", message: "Resume text must be at least 20 characters." },
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return errResponse("config", "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: verify resume exists and optionally check auth
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
          return jsonResponse(
            { error: "Forbidden", message: "You do not own this resume." },
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const { data: resumeRow, error: resumeErr } = await supabase
      .from(RESUMES_TABLE)
      .select("id")
      .eq("id", resumeId)
      .maybeSingle();

    if (resumeErr || !resumeRow) {
      return jsonResponse(
        { error: "Not found", message: "Resume not found." },
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return errResponse("config", "Gemini API key not configured", 500);
    }

    const resumeInput = text.slice(0, 18000);
    const prompt = `Parse this resume into JSON. Include ALL sections: experience, education, skills, projects, certifications, awards, languages. Output ONLY valid JSON, no markdown.

Schema:
{"basics":{"name":null,"email":null,"phone":null,"location":null,"headline":null,"summary":null,"linkedin":null,"github":null,"portfolio":null},"blocks":[{"type":"experience","title":"Work Experience","data":{"items":[{"role":"","company":"","dates":"","description":""}]}},{"type":"education","data":{"items":[{"name":"","degree":"","dates":""}]}},{"type":"skills","data":{"items":[]}},{"type":"projects","data":{"items":[{"name":"","description":"","url":""}]}}]}

Use blocks[].data.items for lists. Use data.text for single-text blocks. Preserve all details.

Resume:
${resumeInput}`;

    let response: Response | null = null;
    let lastError: Error | null = null;

    for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
      const { name: modelName, version } = modelsToTry[modelIndex];

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`[structure-resume-with-gemini] Gemini attempt ${attempt + 1} with model: ${modelName} (${version})`);
          const GEMINI_URL = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
          response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 16384,
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            console.log(`[structure-resume-with-gemini] Success with model: ${modelName}`);
            break;
          }

          if (response.status === 429) {
            console.log("[structure-resume-with-gemini] Rate limited, waiting before retry...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }

          if (response.status === 404) {
            const errorText = await response.text();
            console.log(`[structure-resume-with-gemini] Model ${modelName} not found (404), trying next model...`);
            lastError = new Error(`Model ${modelName} not available: ${errorText}`);
            break;
          }

          const errorText = await response.text();
          console.error(`[structure-resume-with-gemini] Gemini API error: ${response.status}`, errorText);
          lastError = new Error(`API returned ${response.status}: ${errorText}`);
        } catch (e) {
          console.error("[structure-resume-with-gemini] Fetch error:", e);
          lastError = e instanceof Error ? e : new Error("Unknown error");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (response && response.ok) break;
    }

    if (!response || !response.ok) {
      throw lastError || new Error("Failed to get Gemini response after retries");
    }

    const geminiResponse = await response.json();
    const finishReason = geminiResponse.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS") {
      console.warn("[structure-resume-with-gemini] Response was truncated due to MAX_TOKENS.");
    }

    let content = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content || content.trim().length === 0) {
      console.error("[structure-resume-with-gemini] Empty response from Gemini:", JSON.stringify(geminiResponse));
      throw new Error(`Empty response from Gemini. Finish reason: ${finishReason || "unknown"}`);
    }

    // Clean markdown code blocks if present (same as reference)
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
        ? "Response was truncated. Try again."
        : "Failed to parse structuring response.";
      console.error("[structure-resume-with-gemini] Parse failed:", cleanedContent.slice(0, 300));
      throw new Error(msg);
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

    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await supabase
      .from(RESUME_BLOCKS_TABLE)
      .delete()
      .eq("resume_id", resumeId);
    if (deleteError) throw new Error(deleteError.message);

    if (parsed.blocks.length > 0) {
      const rows = parsed.blocks.map((b, i) => ({
        resume_id: resumeId,
        type: b.type,
        title: b.title ?? null,
        content: b.data ?? {},
        sort_order: i,
      }));
      const { error: insertError } = await supabase.from(RESUME_BLOCKS_TABLE).insert(rows);
      if (insertError) throw new Error(insertError.message);
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
    console.error("[structure-resume-with-gemini] error:", e);
    return ensureCors(
      jsonResponse(
        {
          error: "Structuring failed",
          message: e instanceof Error ? e.message : "Unknown error occurred",
        },
        500
      )
    );
  }
});
