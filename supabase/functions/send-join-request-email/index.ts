import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JoinRequestPayload {
  tenant_id: string;
  property_id: string;
  tenant_name: string;
  property_title: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: JoinRequestPayload = await req.json();
    const { tenant_id, property_id, tenant_name, property_title, message } = payload;

    console.log("Processing join request email for property:", property_id);

    // Create Supabase admin client to fetch landlord email
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get property owner_id
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select("owner_id, title")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      console.error("Failed to fetch property:", propertyError);
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get landlord email from auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      property.owner_id
    );

    if (authError || !authUser?.user?.email) {
      console.error("Failed to fetch landlord email:", authError);
      return new Response(
        JSON.stringify({ error: "Landlord email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const landlordEmail = authUser.user.email;
    console.log("Sending join request email to landlord:", landlordEmail);

    const emailResponse = await resend.emails.send({
      from: "Nest Pay <onboarding@resend.dev>",
      to: [landlordEmail],
      subject: `New Join Request for ${property_title || property.title || "Your Property"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🏠 New Join Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have received a new join request for your property!</p>
              
              <div class="highlight">
                <p><strong>Tenant:</strong> ${tenant_name || "Unknown"}</p>
                <p><strong>Property:</strong> ${property_title || property.title || "Your Property"}</p>
                ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
              </div>
              
              <p>Please log in to your Nest Pay dashboard to review and approve or decline this request.</p>
              
              <div class="footer">
                <p>This is an automated notification from Nest Pay.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending join request email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
