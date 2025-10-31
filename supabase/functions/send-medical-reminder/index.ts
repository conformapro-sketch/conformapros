// Medical reminder edge function
// NOTE: Resend integration is commented out until RESEND_API_KEY is configured
// This is a mock implementation that logs email data

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MedicalReminderRequest {
  visitId: string;
  employeeEmail: string;
  employeeName: string;
  visitDate: string;
  visitType: string;
  reminderType: "7days" | "1day" | "manual";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { visitId, employeeEmail, employeeName, visitDate, visitType, reminderType }: MedicalReminderRequest =
      await req.json();

    const formattedDate = new Date(visitDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const typeLabels: Record<string, string> = {
      EMBAUCHE: "d'embauche",
      PERIODIQUE: "périodique (GMT)",
      REPRISE: "de reprise",
      CHANGEMENT_POSTE: "de changement de poste",
      SMS: "de surveillance médicale spéciale",
    };
    const typeLabel = typeLabels[visitType] || visitType;

    let subject = "";
    if (reminderType === "7days") {
      subject = `Rappel : Visite médicale ${typeLabel} dans 7 jours`;
    } else if (reminderType === "1day") {
      subject = `Rappel : Visite médicale ${typeLabel} demain`;
    } else {
      subject = `Rappel : Visite médicale ${typeLabel}`;
    }

    // Mock email sending (to be replaced with Resend when configured)
    console.log("📧 Mock Email Sent:");
    console.log("To:", employeeEmail);
    console.log("Subject:", subject);
    console.log("Name:", employeeName);
    console.log("Date:", formattedDate);

    // Update visit flags
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const smsFlags: Record<string, boolean> = {
      sent_7days: reminderType === "7days",
      sent_1day: reminderType === "1day",
      sent_manual: reminderType === "manual",
    };

    await supabase.from("med_visites").update({ sms_flags: smsFlags }).eq("id", visitId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Medical reminder logged (mock mode - configure RESEND_API_KEY for real emails)",
        mock: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-medical-reminder function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
