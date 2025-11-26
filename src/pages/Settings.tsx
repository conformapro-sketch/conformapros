import { useState } from 'react';
import { useUserType } from '@/hooks/useUserType';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Settings as SettingsIcon, Users, Shield, Building2, Layers, Globe, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface SettingsSection {
  id: string;
  label: string;
  icon: any;
  description?: string;
  path?: string;
}

const staffSections: SettingsSection[] = [
  {
    id: 'account',
    label: 'Mon Compte',
    icon: User,
    description: 'Gérer mes informations personnelles et préférences',
    path: '/settings/account'
  },
  {
    id: 'staff-roles',
    label: 'Rôles du Staff',
    icon: Shield,
    description: 'Gérer les rôles et permissions du personnel ConformaPro',
    path: '/staff/roles'
  },
  {
    id: 'staff-users',
    label: 'Utilisateurs Staff',
    icon: Users,
    description: 'Gérer les membres de l\'équipe ConformaPro',
    path: '/staff/users'
  },
  {
    id: 'client-users',
    label: 'Utilisateurs Clients',
    icon: User,
    description: 'Vue d\'ensemble des utilisateurs clients',
    path: '/staff/client-users'
  },
  {
    id: 'regulatory-domains',
    label: 'Domaines Réglementaires',
    icon: Globe,
    description: 'Gérer les domaines et sous-domaines',
    path: '/bibliotheque/domaines'
  },
  {
    id: 'regulatory-authorities',
    label: 'Autorités Émettrices',
    icon: Building2,
    description: 'Gérer les autorités réglementaires',
    path: '/bibliotheque/autorites'
  }
];

const clientAdminSections: SettingsSection[] = [
  {
    id: 'account',
    label: 'Mon Compte',
    icon: User,
    description: 'Gérer mes informations personnelles et préférences',
    path: '/settings/account'
  },
  {
    id: 'organization',
    label: 'Mon Organisation',
    icon: Building2,
    description: 'Gérer les informations de mon entreprise',
    path: '/settings/organization'
  },
  {
    id: 'my-users',
    label: 'Mes Utilisateurs',
    icon: Users,
    description: 'Gérer les utilisateurs de mon organisation',
    path: '/client-admin/users'
  },
  {
    id: 'sites',
    label: 'Sites',
    icon: Building2,
    description: 'Gérer les sites de mon organisation',
    path: '/sites'
  },
  {
    id: 'modules',
    label: 'Modules',
    icon: Layers,
    description: 'Configuration des modules par site',
  }
];

export default function Settings() {
  const userType = useUserType();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  if (userType === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = userType === 'staff' ? staffSections : clientAdminSections;

  const handleSectionClick = (section: SettingsSection) => {
    if (section.path) {
      navigate(section.path);
    } else {
      setSelectedSection(section.id);
    }
  };

  // Determine active section based on current path
  const isActive = (section: SettingsSection) => {
    if (section.path) {
      return location.pathname === section.path;
    }
    return selectedSection === section.id;
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Sidebar - Settings Menu */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="sticky top-0 flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border p-4">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive(section) && "bg-accent text-accent-foreground"
                  )}
                >
                  <section.icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{section.label}</p>
                    {section.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {section.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              {userType === 'staff' ? 'Configuration Staff' : 'Configuration Client'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-5xl py-8">
          {!selectedSection ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <SettingsIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Paramètres
              </h1>
              <p className="text-muted-foreground max-w-md">
                Sélectionnez une section dans le menu de gauche pour configurer votre système.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {sections.find(s => s.id === selectedSection)?.label}
              </h1>
              <p className="text-muted-foreground mb-6">
                {sections.find(s => s.id === selectedSection)?.description}
              </p>
              <Separator className="mb-6" />
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  Contenu de configuration pour cette section à implémenter.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
