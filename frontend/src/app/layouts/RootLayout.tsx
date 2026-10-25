import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Users,
  Wrench,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GitBranch,
  FileText,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Subject } from "@/shared/user";
import { HeaderProvider, useHeader } from "@/lib/header-context";
import { ImageViewerProvider } from "@/lib/image-viewer-context";
import { useResizable } from "@/lib/use-resizable";
import { usePersistentToggle } from "@/lib/use-persistent-toggle";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { Toaster } from "@/components/ui/sonner";

const subjects: Subject[] = [
  { id: "cs301", name: "Database Management Systems", code: "CS301" },
  { id: "cs302", name: "Computer Networks", code: "CS302" },
  { id: "cs303", name: "Operating Systems", code: "CS303" },
  { id: "cs304", name: "Design and Analysis of Algorithms", code: "CS304" },
];

const studentTools = [
  { to: "/project-analysis", label: "Project Analysis", icon: GitBranch },
  { to: "/resume-reviewer", label: "Resume Reviewer", icon: FileText },
  { to: "/daily-quiz", label: "Daily Quiz", icon: Brain },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/communities")) return "Communities";
  if (pathname.startsWith("/project-analysis")) return "Project Analysis";
  if (pathname.startsWith("/resume-reviewer")) return "Resume Reviewer";
  if (pathname.startsWith("/daily-quiz")) return "Daily Quiz";
  if (pathname.startsWith("/subjects")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 1) {
      const subject = subjects.find((s) => s.id === parts[1]);
      if (subject) return subject.name;
    }
    return "Subjects";
  }
  return "Dashboard";
}

function RootLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = usePersistentToggle("campushub:sidebar:main", true);
  const [isStudentToolsOpen, setIsStudentToolsOpen] = usePersistentToggle("campushub:sidebar:student-tools", true);
  const [isSubjectsOpen, setIsSubjectsOpen] = usePersistentToggle("campushub:sidebar:subjects", true);
  const location = useLocation();
  const { actions, title: customTitle, center } = useHeader();

  const {
    width: sidebarWidth,
    isDragging: isSidebarDragging,
    handleProps: sidebarHandleProps,
  } = useResizable({
    direction: "right",
    defaultWidth: 256,
    minWidth: 200,
    maxWidth: 440,
    storageKey: "campushub:left-sidebar-width",
  });

  const pageTitle = customTitle || getPageTitle(location.pathname);

  const isStudentToolsActive = studentTools.some((tool) => location.pathname.startsWith(tool.to));
  const isSubjectsActive = location.pathname.startsWith("/subjects");

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar with toggle */}
      <aside
        style={{
          width: isSidebarOpen ? `${sidebarWidth}px` : 0,
        }}
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-card md:static relative shrink-0 overflow-hidden ${
          isSidebarDragging ? "" : "transition-[width] duration-200 ease-in-out"
        } ${
          isSidebarOpen
            ? "translate-x-0 overflow-visible border-r"
            : "-translate-x-full md:translate-x-0 overflow-hidden border-r-0 pointer-events-none"
        }`}
      >
        <div
          style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
          className={`flex h-full flex-col justify-between p-4 overflow-y-auto transition-transform duration-200 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-6">
            {/* App Logo */}
            <Link
              to="/"
              onClick={closeSidebarOnMobile}
              className="flex items-center gap-2.5 px-2 py-1.5 font-bold tracking-tight text-xl"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span>CampusHub</span>
            </Link>

            {/* Navigation links: Dashboard, Communities, Student tools, Subjects */}
            <nav className="space-y-1.5">
              {/* 1. Dashboard */}
              <NavLink
                to="/"
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </NavLink>

              {/* 2. Communities */}
              <NavLink
                to="/communities"
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Communities</span>
              </NavLink>

              {/* 3. Student Tools */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsStudentToolsOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    isStudentToolsActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-expanded={isStudentToolsOpen}
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 shrink-0" />
                    <span>Student Tools</span>
                  </div>
                  {isStudentToolsOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform text-muted-foreground" />
                  )}
                </button>

                {isStudentToolsOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l pl-2">
                    {studentTools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = location.pathname.startsWith(tool.to);
                      return (
                        <NavLink
                          key={tool.to}
                          to={tool.to}
                          onClick={closeSidebarOnMobile}
                          className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-secondary text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{tool.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Subjects */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsSubjectsOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    isSubjectsActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-expanded={isSubjectsOpen}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>Subjects</span>
                  </div>
                  {isSubjectsOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform text-muted-foreground" />
                  )}
                </button>

                {isSubjectsOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l pl-2">
                    {subjects.map((sub) => {
                      const isActive = location.pathname === `/subjects/${sub.id}`;
                      return (
                        <NavLink
                          key={sub.id}
                          to={`/subjects/${sub.id}`}
                          onClick={closeSidebarOnMobile}
                          className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-secondary text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className="truncate pr-1.5">{sub.name}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                            {sub.code}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>

        {isSidebarOpen && (
          <ResizeHandle
            side="right"
            isDragging={isSidebarDragging}
            {...sidebarHandleProps}
            className="hidden md:flex"
          />
        )}
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
        <header className="relative flex h-14 items-center justify-between border-b pl-2 pr-4 lg:pr-6 bg-background">
          <div className="flex items-center gap-2 shrink-0 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>

            <h1 className="text-base font-semibold text-foreground md:text-lg truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
              {pageTitle}
            </h1>
          </div>

          {/* Centered Header Slot */}
          {center && (
            <div className="absolute inset-x-0 mx-auto flex items-center justify-center pointer-events-none px-4">
              <div className="pointer-events-auto w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl flex justify-center">
                {center}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0 z-10">
            {/* Feature Custom Header Actions */}
            {actions}

            <Avatar className="h-8 w-8 cursor-pointer border hover:ring-2 hover:ring-primary/20 transition-all">
              <AvatarFallback className="text-xs font-semibold">ST</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>

        <Toaster position="bottom-right" richColors />
      </div>
    </div>
  );
}

export default function RootLayout() {
  return (
    <HeaderProvider>
      <ImageViewerProvider>
        <RootLayoutContent />
      </ImageViewerProvider>
    </HeaderProvider>
  );
}
