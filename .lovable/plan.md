
Objectif
- Faire ressortir clairement l’item actif (page courante) dans la navbar verticale, de façon fiable sur toutes les pages (y compris /codes-juridiques et /codes-juridiques/:id, et les pages Bibliothèque avec paramètres de filtre).

Constat (cause probable du “still not working”)
- Dans AppSidebar, plusieurs liens React Router (<NavLink/>) sont enveloppés avec les composants shadcn SidebarMenuButton / SidebarMenuSubButton en mode asChild.
- Ces composants utilisent Radix Slot et injectent leur propre className sur l’enfant.
- Résultat fréquent : le className “fonction” de NavLink (className={({isActive}) => ...}) est écrasé par le className injecté via Slot, donc vos styles “isActive” ne s’appliquent pas, et visuellement l’item actif ne change pas (ou très peu).
- La bonne façon avec ce Sidebar est d’utiliser les props isActive de SidebarMenuButton / SidebarMenuSubButton (elles posent data-active=true) puis de styler via data-[active=true]:...

Approche de correction (robuste)
1) Centraliser la détection “actif” dans AppSidebar (sans dépendre du className-fonction de NavLink)
- Dans src/components/AppSidebar.tsx :
  - Calculer cleanPath = location.pathname (déjà sans query) + supporter les sous-routes :
    - activeExact(url): cleanPath === url
    - activePrefix(url): cleanPath === url || cleanPath.startsWith(url + "/")
  - Pour chaque module :
    - moduleIsActive = si item.url match (prefix) OU un de ses subItems match (prefix)
  - Pour chaque subItem :
    - subIsActive = activePrefix(subItem.url)
  - Important : /codes-juridiques/:id doit continuer à marquer “Codes juridiques” actif => activePrefix("/codes-juridiques")

2) Utiliser isActive sur les composants Sidebar (au lieu du className dynamique sur NavLink)
- Sub-items (expanded, dans SidebarMenuSubButton asChild) :
  - Passer isActive={subIsActive} à <SidebarMenuSubButton>
  - Retirer le className={({isActive})=>...} du <NavLink> (ou le réduire à un className statique minimal), pour éviter l’écrasement.
  - Ajouter le style fort d’actif sur SidebarMenuSubButton via className avec data selectors, par ex :
    - className="
        sidebar-hover
        data-[active=true]:bg-primary/15
        data-[active=true]:text-primary
        data-[active=true]:font-bold
        data-[active=true]:shadow-sm
        data-[active=true]:border-l-4
        data-[active=true]:border-primary
        data-[active=true]:pl-3
      "
    - et un padding normal quand inactif (ex: pl-4) directement sur SidebarMenuSubButton.
  - Conserver NavLink uniquement pour la navigation (to, end si souhaité), sans logique de style.

- Items top-level sans sous-menu (expanded + collapsed) :
  - Passer isActive={itemIsActive} à <SidebarMenuButton asChild>
  - Mettre le style “actif fort” sur SidebarMenuButton (data-[active=true]:...) plutôt que sur NavLink.

- Bouton module (CollapsibleTrigger) quand on est dans une page du module :
  - Passer isActive={moduleIsActive} à <SidebarMenuButton> (celui qui affiche le titre du module + chevron)
  - Ainsi, même si l’utilisateur ne regarde pas le sous-item, il voit clairement quel “bloc” est actif.

- Mode collapsed (icône uniquement) :
  - Passer isActive={moduleIsActive} au SidebarMenuButton de l’icône (HoverCardTrigger) pour avoir un indicateur visible même sans ouvrir le hover.

3) Harmoniser aussi le rendu dans le HoverCard (sidebar collapsed)
- Dans la branche isCollapsed, les subItems sont des NavLink “directs” (pas de Slot).
- Mettre une logique de style cohérente (activePrefix) pour que /codes-juridiques/:id reste clairement actif.
- Option : réutiliser les mêmes classes “fortes” que l’expanded.

Fichiers à modifier
- src/components/AppSidebar.tsx
  - Ajouter helpers activeExact/activePrefix
  - Remplacer les styles “isActive” sur NavLink (quand ils sont enfants de SidebarMenuButton/SubButton) par :
    - isActive prop sur SidebarMenuButton/SidebarMenuSubButton
    - className avec data-[active=true] sur SidebarMenuButton/SidebarMenuSubButton
  - Rendre actif aussi le parent (module) via isActive sur son SidebarMenuButton.

Pourquoi ça va marcher
- SidebarMenuButton et SidebarMenuSubButton sont conçus pour styliser l’état actif via data-active.
- En alimentant isActive nous-mêmes, on n’est plus dépendant de la mécanique NavLink/className-fonction qui peut être cassée par le Slot.

Tests de validation (à faire après implémentation)
1) Aller sur /codes-juridiques
   - “Codes juridiques” doit être très clairement surligné
   - Le module “Bibliothèque …” doit aussi être visuellement “actif”
2) Aller sur /codes-juridiques/123
   - “Codes juridiques” doit rester actif
3) Aller sur /bibliotheque/articles?texte=...
   - “Articles” doit être actif
4) Tester sidebar collapsed + hover
   - L’icône du module actif doit être distinguable même sans hover
5) Tester dark mode si vous l’utilisez
   - Contraste lisible (bg-primary/15 + text-primary)

Amélioration optionnelle (si besoin)
- Ajouter un petit “dot”/barre indicatrice (pseudo-element) pour l’actif plutôt qu’un border-left qui peut bouger légèrement les alignements.
