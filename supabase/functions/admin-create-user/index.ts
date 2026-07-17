import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = new Set([
  "https://afriquecon.vercel.app",
  "https://afrique-con.com",
  "https://www.afrique-con.com",
  "http://localhost:5173",
]);
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey);

function responseHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://afriquecon.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

function reply(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(req) });
}

type AccountRole = "client" | "agent" | "manager" | "super_admin";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: responseHeaders(req) });
  if (req.method !== "POST") return reply(req, { error: "Method not allowed" }, 405);

  try {
    const accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) return reply(req, { error: "Authentication required" }, 401);

    // Verify the caller's supplied JWT with the service client. This avoids
    // depending on legacy anon-key environment variables in Edge Functions.
    const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !user) return reply(req, { error: "Authentication required" }, 401);

    const { data: callerAdmin, error: roleError } = await admin
      .from("admin_users")
      .select("role")
      .eq("email", user.email ?? "")
      .eq("active", true)
      .in("role", ["super_admin"])
      .maybeSingle();
    if (roleError || callerAdmin?.role !== "super_admin") {
      return reply(req, { error: "Super Admin access required" }, 403);
    }

    const payload = await req.json();
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    const accountRole: AccountRole = payload.role;
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    const country = payload.country === "NG" ? "NG" : "CM";

    if (!/^\S+@\S+\.\S+$/.test(email) || !fullName || password.length < 8) {
      return reply(req, { error: "Enter a valid email, full name, and a password of at least 8 characters" }, 400);
    }
    if (!["client", "agent", "manager", "super_admin"].includes(accountRole)) {
      return reply(req, { error: "Invalid account role" }, 400);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone: phone || null, country },
    });
    if (createError || !created.user) return reply(req, { error: createError?.message ?? "Unable to create account" }, 400);

    if (accountRole !== "client") {
      const { error: staffError } = await admin.from("admin_users").insert({
        email,
        full_name: fullName,
        role: accountRole,
        active: true,
      });
      if (staffError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return reply(req, { error: "Unable to assign the requested staff role" }, 500);
      }
    }

    return reply(req, { id: created.user.id, email, role: accountRole, message: "Account created successfully" }, 201);
  } catch (error) {
    console.error("admin-create-user error", error);
    return reply(req, { error: "Unable to create account" }, 500);
  }
});
