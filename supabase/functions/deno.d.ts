/**
 * Type declarations for Supabase Edge Functions (Deno runtime).
 * The IDE uses Node/TS and doesn't know Deno or npm: specifiers; this file silences those errors.
 * At deploy time Supabase runs these functions on Deno, which resolves them correctly.
 */

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

declare module "npm:zod@3.23.8" {
  const z: any;
  export { z };
}
