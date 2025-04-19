
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { Book, FileText, PenTool, Lightbulb, BookText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  const menuItems = [
    { 
      title: "Papers", 
      path: "/papers", 
      icon: FileText 
    },
    { 
      title: "Notepad", 
      path: "/notepad", 
      icon: PenTool 
    },
    { 
      title: "Whiteboard", 
      path: "/whiteboard", 
      icon: BookText 
    },
    { 
      title: "AI Insights", 
      path: "/insights", 
      icon: Lightbulb 
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="py-4">
            <div className="flex items-center px-2">
              <Book className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-semibold">Research Nexus</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild className={location.pathname === item.path ? "bg-accent" : ""}>
                      <Link to={item.path} className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="py-2">
            <div className="px-4 text-sm text-muted-foreground">
              <p>Research Nexus v1.0</p>
              <p>© 2025</p>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger />
              <h1 className="ml-4 text-lg font-medium">Research Nexus</h1>
              <div className="ml-auto flex items-center space-x-2">
                {/* Add user menu or other header elements here if needed */}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
