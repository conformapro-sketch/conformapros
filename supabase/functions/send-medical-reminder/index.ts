import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      visitId,
      employeeEmail,
      employeeName,
      visitDate,
      visitType,
      reminderType,
    }: MedicalReminderRequest = await req.json();

    // Format date
    const formattedDate = new Date(visitDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Get visit type label
    const typeLabels: Record<string, string> = {
      EMBAUCHE: "d'embauche",
      PERIODIQUE: "périodique (GMT)",
      REPRISE: "de reprise",
      CHANGEMENT_POSTE: "de changement de poste",
      SMS: "de surveillance médicale spéciale",
    };
    const typeLabel = typeLabels[visitType] || visitType;

    // Reminder message based on type
    let subject = "";
    let message = "";

    if (reminderType === "7days") {
      subject = `Rappel : Visite médicale ${typeLabel} dans 7 jours`;
      message = `Votre visite médicale ${typeLabel} est prévue dans 7 jours.`;
    } else if (reminderType === "1day") {
      subject = `Rappel : Visite médicale ${typeLabel} demain`;
      message = `Votre visite médicale ${typeLabel} est prévue demain.`;
    } else {
      subject = `Rappel : Visite médicale ${typeLabel}`;
      message = `Nous vous rappelons votre visite médicale ${typeLabel}.`;
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "ConformaPro <medical@conformapro.tn>",
      to: [employeeEmail],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: white;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 10px 10px;
              }
              .info-box {
                background: #f3f4f6;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .info-box strong {
                color: #667eea;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🩺 Visite Médicale</h1>
            </div>
            <div class="content">
              <p>Bonjour ${employeeName},</p>
              
              <p>${message}</p>

              <div class="info-box">
                <p style="margin: 5px 0;"><strong>Type de visite :</strong> Visite ${typeLabel}</p>
                <p style="margin: 5px 0;"><strong>Date :</strong> ${formattedDate}</p>
              </div>

              <p><strong>Informations importantes :</strong></p>
              <ul>
                <li>Merci de vous présenter à l'heure indiquée</li>
                <li>Munissez-vous de votre carte d'identité</li>
                <li>Apportez vos lunettes si vous en portez</li>
                <li>En cas d'empêchement, prévenez le service HSE au plus tôt</li>
              </ul>

              <p>Cette visite médicale est <strong>obligatoire</strong> dans le cadre de la réglementation du travail.</p>

              <div class="footer">
                <p><strong>Service Santé & Sécurité au Travail</strong></p>
                <p>ConformaPro - Gestion HSE</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Medical reminder email sent successfully:", emailResponse);

    // Log the notification in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update SMS flags in med_visites
    const smsFlags: Record<string, boolean> = {
      sent_7days: reminderType === "7days",
      sent_1day: reminderType === "1day",
      sent_manual: reminderType === "manual",
    };

    await supabase
      .from("med_visites")
      .update({
        sms_flags: smsFlags,
      })
      .eq("id", visitId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Medical reminder sent successfully",
        emailResponse,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-medical-reminder function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
