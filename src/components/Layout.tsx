import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import TopNavBar from "@/components/TopNavBar";

export function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Full-screen routes without navbar/sidebar
  const fullscreenRoutes = new Set(["/profile"]);
  if (fullscreenRoutes.has(pathname)) {
    return <Outlet />;
  }
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopNavBar onProfileClick={() => navigate("/profile")} />
          <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
