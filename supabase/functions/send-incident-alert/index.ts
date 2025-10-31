import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IncidentAlert {
  incident_id: string;
  recipients: string[];
  alert_type: 'major' | 'overdue' | 'created';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { incident_id, recipients, alert_type }: IncidentAlert = await req.json();

    console.log(`Processing ${alert_type} alert for incident ${incident_id}`);

    // Récupérer les détails de l'incident
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select(`
        *,
        sites:site_id (nom_site),
        employes:personne_impliquee_id (nom, prenom)
      `)
      .eq('id', incident_id)
      .single();

    if (incidentError || !incident) {
      throw new Error(`Incident not found: ${incidentError?.message}`);
    }

    // Définir le sujet et le message selon le type d'alerte
    let subject = '';
    let message = '';

    switch (alert_type) {
      case 'major':
        subject = `🚨 ALERTE - Incident majeur ${incident.numero_incident}`;
        message = `
          Un incident majeur a été déclaré :
          
          Numéro : ${incident.numero_incident}
          Type : ${incident.type_incident}
          Date : ${new Date(incident.date_incident).toLocaleDateString('fr-FR')}
          Site : ${incident.sites?.nom_site || 'Non spécifié'}
          Gravité : MAJEURE
          
          Description : ${incident.description}
          
          Merci de prendre connaissance de cet incident et d'initier les actions appropriées.
        `;
        break;

      case 'overdue':
        subject = `⚠️ Rappel - Incident en retard ${incident.numero_incident}`;
        message = `
          L'incident suivant est en retard de traitement (> 30 jours) :
          
          Numéro : ${incident.numero_incident}
          Date de déclaration : ${new Date(incident.date_incident).toLocaleDateString('fr-FR')}
          Site : ${incident.sites?.nom_site || 'Non spécifié'}
          Statut : ${incident.statut}
          
          Merci de procéder à la clôture de cet incident dans les plus brefs délais.
        `;
        break;

      case 'created':
        subject = `📋 Nouvel incident déclaré - ${incident.numero_incident}`;
        message = `
          Un nouvel incident a été déclaré :
          
          Numéro : ${incident.numero_incident}
          Type : ${incident.type_incident}
          Date : ${new Date(incident.date_incident).toLocaleDateString('fr-FR')}
          Site : ${incident.sites?.nom_site || 'Non spécifié'}
          Gravité : ${incident.gravite}
          
          Description : ${incident.description}
        `;
        break;
    }

    // Pour le moment, on log simplement
    // Dans une version future, on peut intégrer Resend ou un autre service d'email
    console.log('Email to send:', {
      to: recipients,
      subject,
      message,
    });

    // TODO: Intégrer Resend pour l'envoi réel d'emails
    // const resendApiKey = Deno.env.get('RESEND_API_KEY');
    // if (resendApiKey) {
    //   const Resend = (await import('npm:resend@2.0.0')).Resend;
    //   const resend = new Resend(resendApiKey);
    //   await resend.emails.send({
    //     from: 'ConformaPro HSE <noreply@conformapro.com>',
    //     to: recipients,
    //     subject,
    //     text: message,
    //   });
    // }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alert processed',
        incident_id,
        alert_type,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-incident-alert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
