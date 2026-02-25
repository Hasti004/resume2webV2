// @ts-nocheck — Supabase Edge Functions run on Deno (npm: specifiers, Deno global). IDE uses Node/TS.
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const BlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  title: z.string().optional(),
  content: z.record(z.unknown()).optional(),
  data: z.record(z.unknown()).optional(),
  sort_order: z.number().optional(),
});
const ResponseSchema = z.object({
  basicsProposed: z.record(z.unknown()),
  blocksProposed: z.array(BlockSchema),
});

type AiEditInput = {
  basics: Record<string, unknown>;
  blocks: Array<{ id?: string; type: string; content?: Record<string, unknown>; sort_order?: number }>;
  instruction: string;
  scope: string;
  selectedBlockId?: string;
};

async function callGemini(input: AiEditInput): Promise<z.infer<typeof ResponseSchema>> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const blockPayload = input.blocks.map((b) => ({
    id: b.id,
    type: b.type,
    content: b.content ?? {},
    sort_order: b.sort_order,
  }));

  const prompt = `You are a resume editor. Apply the user's edit to the resume and return the FULL proposed basics and blocks.

Current resume:
basics: ${JSON.stringify(input.basics)}
blocks: ${JSON.stringify(blockPayload)}

User instruction: ${input.instruction}
Scope: ${input.scope}
${input.selectedBlockId ? `Focus on block id: ${input.selectedBlockId}` : ""}

Rules:
- Return ONLY valid JSON. No markdown, no explanation.
- Output: { "basicsProposed": {...}, "blocksProposed": [ { "id": "...", "type": "...", "content": {...}, "sort_order": 0 }, ... ] }
- basicsProposed: full object with all basic fields (name, email, phone, location, headline, summary, linkedin, github, portfolio).
- blocksProposed: full array of blocks; each block has id (if any), type, content (object), sort_order.
- Preserve block ids from input. Apply only the requested change; keep the rest unchanged unless the instruction implies otherwise.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const json = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!text) throw new Error("Empty response from Gemini");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  const parsedOut = ResponseSchema.safeParse(parsed);
  if (!parsedOut.success) {
    throw new Error(`Gemini response validation failed: ${parsedOut.error.message}`);
  }
  const out = parsedOut.data;
  const blocksProposed = out.blocksProposed.map((b, i) => ({
    id: b.id ?? input.blocks[i]?.id,
    type: b.type,
    content: b.content ?? b.data ?? {},
    sort_order: b.sort_order ?? i,
  }));
  return { basicsProposed: out.basicsProposed, blocksProposed };
}

const GEMINI_JSON_RETRIES = 2;

async function callGeminiWithRetry(input: AiEditInput): ReturnType<typeof callGemini> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= GEMINI_JSON_RETRIES; attempt++) {
    try {
      return await callGemini(input);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const isValidationOrJson = /invalid JSON|validation failed/i.test(lastErr.message);
      if (!isValidationOrJson || attempt === GEMINI_JSON_RETRIES) throw lastErr;
    }
  }
  throw lastErr ?? new Error("AI edit failed");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as AiEditInput;
    const { basics, blocks, instruction, scope, selectedBlockId } = body;
    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return jsonResponse({ error: "instruction required" }, 400);
    }
    if (!basics || typeof basics !== "object") {
      return jsonResponse({ error: "basics required" }, 400);
    }
    if (!Array.isArray(blocks)) {
      return jsonResponse({ error: "blocks required (array)" }, 400);
    }

    const result = await callGeminiWithRetry({
      basics,
      blocks,
      instruction: instruction.trim(),
      scope: scope ?? "full",
      selectedBlockId: typeof selectedBlockId === "string" ? selectedBlockId : undefined,
    });
    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI edit failed";
    return jsonResponse({ error: message }, 500);
  }
});
