"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Home as HomeIcon, Settings, LayoutGrid } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-6" />
            <h1 className="text-lg font-semibold">App Name</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive>
                <HomeIcon />
                Home
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
           <SidebarTrigger className="md:hidden" />
           <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold text-center tracking-tight">
                Welcome to Your New Application!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-xl text-muted-foreground text-center">
                This is the starting point. I'm ready to help you build something amazing.
              </p>
              <p className="text-md text-muted-foreground text-center mt-4">
                What feature should we build first?
              </p>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
