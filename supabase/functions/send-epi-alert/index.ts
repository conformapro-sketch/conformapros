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

    console.log('Starting EPI alerts check...');

    // Récupérer tous les EPI attribués
    const { data: epiArticles, error: epiError } = await supabase
      .from('epi_articles')
      .select(`
        *,
        type:epi_types(duree_vie_moyenne_mois, libelle),
        employe:employes(nom, prenom, email),
        site:sites(nom_site)
      `)
      .eq('statut', 'attribue')
      .not('date_attribution', 'is', null);

    if (epiError) throw epiError;

    console.log(`Found ${epiArticles?.length || 0} attributed EPI articles`);

    const alertsToSend: any[] = [];
    const today = new Date();

    // Vérifier chaque EPI pour déterminer s'il nécessite un remplacement
    epiArticles?.forEach((article: any) => {
      if (!article.type?.duree_vie_moyenne_mois || !article.date_attribution) return;

      const dateAttribution = new Date(article.date_attribution);
      const dateRemplacement = new Date(dateAttribution);
      dateRemplacement.setMonth(dateRemplacement.getMonth() + article.type.duree_vie_moyenne_mois);

      const diffDays = Math.floor((dateRemplacement.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Alertes à 30, 15 et 7 jours
      if (diffDays === 30 || diffDays === 15 || diffDays === 7 || diffDays <= 0) {
        alertsToSend.push({
          article,
          daysRemaining: diffDays,
          replacementDate: dateRemplacement,
        });
      }
    });

    console.log(`Found ${alertsToSend.length} EPI requiring alerts`);

    // Récupérer la configuration des alertes
    const { data: alertConfig } = await supabase
      .from('alert_config')
      .select('*')
      .eq('module', 'epi')
      .eq('alert_type', 'remplacement')
      .eq('actif', true)
      .single();

    // Grouper les alertes par site pour envoyer un seul email par site
    const alertsBySite = alertsToSend.reduce((acc: any, alert) => {
      const siteId = alert.article.site?.id || 'unknown';
      if (!acc[siteId]) {
        acc[siteId] = {
          site: alert.article.site,
          alerts: [],
        };
      }
      acc[siteId].alerts.push(alert);
      return acc;
    }, {});

    // Pour chaque site, envoyer un email récapitulatif
    for (const [siteId, siteData] of Object.entries(alertsBySite)) {
      const { site, alerts } = siteData as any;
      
      console.log(`Preparing email for site ${site?.nom_site} with ${alerts.length} alerts`);

      // Construction du contenu de l'email
      let emailContent = `
        <h2>Alertes de remplacement EPI - ${site?.nom_site}</h2>
        <p>Les EPI suivants nécessitent votre attention :</p>
        <ul>
      `;

      alerts.forEach((alert: any) => {
        const status = alert.daysRemaining <= 0 
          ? '⚠️ <strong>URGENT - À remplacer immédiatement</strong>'
          : `⏰ À remplacer dans ${alert.daysRemaining} jours`;
        
        emailContent += `
          <li>
            <strong>${alert.article.code_article}</strong> - ${alert.article.type?.libelle}<br/>
            Employé: ${alert.article.employe?.prenom} ${alert.article.employe?.nom}<br/>
            ${status}
          </li>
        `;
      });

      emailContent += `
        </ul>
        <p>Veuillez prendre les mesures nécessaires pour remplacer ces équipements.</p>
      `;

      // Envoyer l'email (à implémenter avec un service d'envoi d'emails)
      // TODO: Intégrer avec Resend ou autre service d'email
      console.log('Email content prepared:', emailContent);
      
      if (alertConfig?.destinataires_emails?.length > 0) {
        console.log('Would send to:', alertConfig.destinataires_emails);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertsCount: alertsToSend.length,
        sitesCount: Object.keys(alertsBySite).length,
        message: `Processed ${alertsToSend.length} EPI alerts across ${Object.keys(alertsBySite).length} sites`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing EPI alerts:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
