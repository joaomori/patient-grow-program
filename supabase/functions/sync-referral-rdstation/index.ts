import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("RDSTATION_CRM_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "RDSTATION_CRM_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      referral_id,
      referred_name,
      referred_phone,
      referred_email,
      affiliate_name,
      referral_code,
    } = await req.json();

    // 1. Create contact in RD Station CRM
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
    if (!contactRes.ok) {
      console.error("RD Station contact error:", JSON.stringify(contactData));
      return new Response(
        JSON.stringify({ error: "Failed to create contact", details: contactData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contactId = contactData._id || contactData.id;

    // 2. Create deal linked to contact
    const dealRes = await fetch(
      `https://crm.rdstation.com/api/v1/deals?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal: {
            name: `Indicação - ${referred_name}`,
            contacts_ids: [contactId],
            annotation: `Indicado por: ${affiliate_name || "Desconhecido"} (código: ${referral_code || "N/A"})`,
          },
        }),
      }
    );

    const dealData = await dealRes.json();
    if (!dealRes.ok) {
      console.error("RD Station deal error:", JSON.stringify(dealData));
      return new Response(
        JSON.stringify({ error: "Failed to create deal", details: dealData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dealId = dealData._id || dealData.id;

    // 3. Update referral with deal ID if referral_id provided
    if (referral_id && dealId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase
        .from("referrals")
        .update({ rdstation_deal_id: dealId })
        .eq("id", referral_id);
    }

    return new Response(
      JSON.stringify({ success: true, contact_id: contactId, deal_id: dealId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-referral-rdstation error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
