import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { GraduationCap, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function RootLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar with toggle */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-card transition-all duration-200 md:static ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full md:w-0 md:translate-x-0 md:border-r-0 md:overflow-hidden"
        }`}
      >
        <div className="flex h-full w-64 flex-col justify-between p-4">
          <div className="space-y-6">
            {/* App Logo */}
            <Link to="/" className="flex items-center gap-2.5 px-2 py-1.5 font-bold tracking-tight text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span>CampusHub</span>
            </Link>

            <nav className="space-y-1">
              {/* Feature routes are mounted into the shell */}
            </nav>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile view when sidebar is open */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6 bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="text-muted-foreground hover:text-foreground"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>

          <Avatar className="h-8 w-8 cursor-pointer border hover:ring-2 hover:ring-primary/20 transition-all">
            <AvatarFallback className="text-xs font-semibold">ST</AvatarFallback>
          </Avatar>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
