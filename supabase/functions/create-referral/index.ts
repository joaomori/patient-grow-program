import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  referral_code: z.string().min(1).max(50),
  referred_name: z.string().min(2).max(255),
  referred_phone: z.string().min(8).max(30),
  referred_email: z.union([z.string().email().max(255), z.literal(""), z.undefined()]).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { referral_code, referred_name, referred_phone, referred_email } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate affiliate code
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliates")
      .select("id, referral_code, profiles(full_name)")
      .eq("referral_code", referral_code)
      .eq("is_active", true)
      .single();

    if (affiliateError || !affiliate) {
      return new Response(
        JSON.stringify({ error: "Código de indicação inválido ou inativo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const affiliateId = affiliate.id;
    const affiliateName = (affiliate as any).profiles?.full_name || "";

    // Simple duplicate check: same name + phone for same affiliate in last 5 minutes
    const { data: recent } = await supabase
      .from("referrals")
      .select("id")
      .eq("affiliate_id", affiliateId)
      .eq("referred_phone", referred_phone)
      .eq("referred_name", referred_name)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .maybeSingle();

    if (recent) {
      return new Response(
        JSON.stringify({ error: "Indicação duplicada recente. Aguarde alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert referral
    const { data: referral, error: insertError } = await supabase
      .from("referrals")
      .insert({
        affiliate_id: affiliateId,
        referred_name: referred_name.trim(),
        referred_phone: referred_phone.trim(),
        referred_email: referred_email?.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !referral) {
      console.error("Insert referral error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar indicação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sync with RD Station CRM
    const token = Deno.env.get("RDSTATION_CRM_TOKEN");
    let contactId = null;
    let dealId = null;

    if (token) {
      try {
        const contactRes = await fetch(
          `https://crm.rdstation.com/api/v1/contacts?token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact: {
                name: referred_name,
                phones: referred_phone ? [{ phone: referred_phone }] : [],
                emails: referred_email ? [{ email: referred_email }] : [],
              },
            }),
          }
        );
        const contactData = await contactRes.json();
        if (contactRes.ok) {
          contactId = contactData._id || contactData.id;

          const dealRes = await fetch(
            `https://crm.rdstation.com/api/v1/deals?token=${token}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deal: {
                  name: `Indicação - ${referred_name}`,
                  contacts_ids: [contactId],
                  annotation: `Indicado por: ${affiliateName || "Desconhecido"} (código: ${referral_code})`,
                },
              }),
            }
          );
          const dealData = await dealRes.json();
          if (dealRes.ok) {
            dealId = dealData._id || dealData.id;
            await supabase
              .from("referrals")
              .update({ rdstation_deal_id: dealId })
              .eq("id", referral.id);
          }
        } else {
          console.error("RD Station contact error:", JSON.stringify(contactData));
        }
      } catch (e) {
        console.error("RD Station sync error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, referral_id: referral.id, contact_id: contactId, deal_id: dealId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-referral error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
