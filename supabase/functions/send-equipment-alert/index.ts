import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting equipment alerts check...');

    // Récupérer tous les équipements avec échéance de contrôle
    const { data: equipements, error: equipError } = await supabase
      .from('equipements')
      .select(`
        *,
        site:sites(nom_site, id),
        prestataire:prestataires(nom, contact_email)
      `)
      .not('prochaine_verification', 'is', null)
      .eq('statut', 'en_service');

    if (equipError) throw equipError;

    console.log(`Found ${equipements?.length || 0} equipments to check`);

    const alertsToSend: any[] = [];
    const today = new Date();
    const delaisAlerte = [7, 15, 30]; // Jours avant échéance

    // Vérifier chaque équipement
    equipements?.forEach((equipement: any) => {
      if (!equipement.prochaine_verification) return;

      const dateEcheance = new Date(equipement.prochaine_verification);
      const diffDays = Math.floor((dateEcheance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Vérifier si on est à un délai d'alerte
      if (delaisAlerte.includes(diffDays) || diffDays < 0) {
        alertsToSend.push({
          equipement,
          daysRemaining: diffDays,
          echeanceDate: dateEcheance,
          urgency: diffDays < 0 ? 'urgent' : diffDays <= 7 ? 'high' : 'medium',
        });
      }
    });

    console.log(`Found ${alertsToSend.length} equipment requiring alerts`);

    // Grouper les alertes par site
    const alertsBySite = alertsToSend.reduce((acc: any, alert) => {
      const siteId = alert.equipement.site?.id || 'unknown';
      if (!acc[siteId]) {
        acc[siteId] = {
          site: alert.equipement.site,
          urgent: [],
          high: [],
          medium: [],
        };
      }
      acc[siteId][alert.urgency].push(alert);
      return acc;
    }, {});

    // Pour chaque site, envoyer un email récapitulatif
    for (const [siteId, siteData] of Object.entries(alertsBySite)) {
      const { site, urgent, high, medium } = siteData as any;
      
      console.log(`Preparing email for site ${site?.nom_site}`);

      // Construction du contenu de l'email
      let emailContent = `
        <h2>Alertes de contrôle équipements - ${site?.nom_site}</h2>
      `;

      if (urgent.length > 0) {
        emailContent += `
          <h3 style="color: #dc2626;">🚨 URGENTS - Contrôle en retard (${urgent.length})</h3>
          <ul>
        `;
        urgent.forEach((alert: any) => {
          emailContent += `
            <li>
              <strong>${alert.equipement.nom}</strong> - ${alert.equipement.type_equipement}<br/>
              Localisation: ${alert.equipement.localisation || 'Non spécifié'}<br/>
              ⚠️ <strong>Contrôle en retard de ${Math.abs(alert.daysRemaining)} jours</strong>
            </li>
          `;
        });
        emailContent += '</ul>';
      }

      if (high.length > 0) {
        emailContent += `
          <h3 style="color: #ea580c;">⏰ Priorité haute - Contrôle dans 7 jours (${high.length})</h3>
          <ul>
        `;
        high.forEach((alert: any) => {
          emailContent += `
            <li>
              <strong>${alert.equipement.nom}</strong> - ${alert.equipement.type_equipement}<br/>
              Localisation: ${alert.equipement.localisation || 'Non spécifié'}<br/>
              Contrôle prévu: ${alert.echeanceDate.toLocaleDateString('fr-FR')}
            </li>
          `;
        });
        emailContent += '</ul>';
      }

      if (medium.length > 0) {
        emailContent += `
          <h3>📅 À prévoir - Contrôle dans 15-30 jours (${medium.length})</h3>
          <ul>
        `;
        medium.forEach((alert: any) => {
          emailContent += `
            <li>
              <strong>${alert.equipement.nom}</strong> - ${alert.equipement.type_equipement}<br/>
              Contrôle prévu dans ${alert.daysRemaining} jours
            </li>
          `;
        });
        emailContent += '</ul>';
      }

      emailContent += `
        <p>Veuillez planifier les contrôles nécessaires auprès des prestataires.</p>
      `;

      // Envoyer l'email (à implémenter avec un service d'envoi d'emails)
      // TODO: Intégrer avec Resend ou autre service d'email
      console.log('Email content prepared for site:', site?.nom_site);
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertsCount: alertsToSend.length,
        sitesCount: Object.keys(alertsBySite).length,
        breakdown: {
          urgent: alertsToSend.filter(a => a.urgency === 'urgent').length,
          high: alertsToSend.filter(a => a.urgency === 'high').length,
          medium: alertsToSend.filter(a => a.urgency === 'medium').length,
        },
        message: `Processed ${alertsToSend.length} equipment alerts across ${Object.keys(alertsBySite).length} sites`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing equipment alerts:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
