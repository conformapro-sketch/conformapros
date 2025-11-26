import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, CheckCircle2, Bell, Users, TrendingUp, Database, Lock, Zap } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Database,
      title: "Bibliothèque Réglementaire",
      description: "Accédez à une base de données complète de textes réglementaires, codes et articles juridiques."
    },
    {
      icon: CheckCircle2,
      title: "Veille & Conformité",
      description: "Évaluez l'applicabilité des textes et maintenez votre conformité réglementaire en temps réel."
    },
    {
      icon: Bell,
      title: "Alertes Intelligentes",
      description: "Recevez des notifications automatiques sur les changements réglementaires qui vous concernent."
    },
    {
      icon: Shield,
      title: "Gestion HSE",
      description: "Suivez vos incidents, EPI, équipements et formations en toute simplicité."
    },
    {
      icon: FileText,
      title: "Plans d'Action",
      description: "Créez et suivez vos actions correctives avec gestion des échéances et preuves."
    },
    {
      icon: Users,
      title: "Multi-sites & Multi-utilisateurs",
      description: "Architecture multi-tenant avec permissions granulaires par site et module."
    }
  ];

  const stats = [
    { value: "99%", label: "Conformité moyenne" },
    { value: "24/7", label: "Veille réglementaire" },
    { value: "500+", label: "Textes référencés" },
    { value: "100%", label: "Traçabilité" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm fixed w-full z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ConformaPro
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Connexion
              </Button>
              <Button className="bg-gradient-primary shadow-medium" onClick={() => navigate("/register")}>
                Commencer
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Conformité Réglementaire Simplifiée
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Gérez votre conformité HSE, suivez les évolutions réglementaires et automatisez vos processus de conformité en toute confiance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary shadow-medium text-lg px-8" onClick={() => navigate("/register")}>
                Essayer gratuitement
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/login")}>
                Voir une démo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-scale-in">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour gérer tous les aspects de votre conformité réglementaire
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow duration-300 border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Pourquoi choisir ConformaPro ?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Sécurité & Confidentialité</h3>
                    <p className="text-muted-foreground">
                      Vos données sont protégées avec les plus hauts standards de sécurité
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Évolutif</h3>
                    <p className="text-muted-foreground">
                      S'adapte à la croissance de votre organisation et de vos besoins
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Performance</h3>
                    <p className="text-muted-foreground">
                      Interface rapide et intuitive pour une productivité maximale
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
              <Card className="relative shadow-strong border-l-4 border-l-primary">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Conformité globale</div>
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-bold text-primary">87%</span>
                        <span className="text-success mb-2">+5%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary w-[87%]"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <div className="text-2xl font-bold text-foreground">124/142</div>
                        <div className="text-sm text-muted-foreground">Documents conformes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">17</div>
                        <div className="text-sm text-muted-foreground">Contrôles à venir</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="shadow-strong border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Prêt à simplifier votre conformité ?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Rejoignez les organisations qui font confiance à ConformaPro pour gérer leur conformité réglementaire
              </p>
              <Button size="lg" className="bg-gradient-primary shadow-medium text-lg px-8" onClick={() => navigate("/register")}>
                Commencer maintenant
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ConformaPro</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 ConformaPro. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
