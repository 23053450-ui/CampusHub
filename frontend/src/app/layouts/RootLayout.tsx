import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
  GitBranch,
  FileText,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const subjects = [
  { id: "cs301", name: "Database Management Systems", code: "CS301" },
  { id: "cs302", name: "Computer Networks", code: "CS302" },
  { id: "cs303", name: "Operating Systems", code: "CS303" },
  { id: "cs304", name: "Design and Analysis of Algorithms", code: "CS304" },
];

export default function RootLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const mainNavLinks = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/communities", label: "Communities", icon: Users },
  ];

  const toolLinks = [
    { to: "/project-analysis", label: "Project Analysis", icon: GitBranch },
    { to: "/resume-reviewer", label: "Resume Reviewer", icon: FileText },
    { to: "/daily-quiz", label: "Daily Quiz", icon: Brain },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Main Sidebar with toggle / hide ability */}
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

            {/* Primary Navigation */}
            <nav className="space-y-1">
              {mainNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.to);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <Separator />

            {/* Student Tools Navigation */}
            <div className="space-y-2">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Student Tools
              </div>
              <nav className="space-y-1">
                {toolLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname.startsWith(link.to);
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <Separator />

            {/* My Subjects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>My Subjects</span>
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1">
                {subjects.map((sub) => {
                  const isActive = location.pathname === `/subjects/${sub.id}`;
                  return (
                    <NavLink
                      key={sub.id}
                      to={`/subjects/${sub.id}`}
                      className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                        {sub.code}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
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
          {/* Left: Sidebar toggle button */}
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

          {/* Right: Only the Account button */}
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
