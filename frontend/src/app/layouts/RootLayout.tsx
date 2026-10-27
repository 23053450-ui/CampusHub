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
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Subject } from "@/shared/user";
import { HeaderProvider, useHeader } from "@/lib/header-context";
import { useResizable } from "@/lib/use-resizable";
import { ResizeHandle } from "@/components/ui/resize-handle";

const subjects: Subject[] = [
  {
    id: "cs301",
    name: "Database Management Systems",
    code: "CS301",
  },
  {
    id: "cs302",
    name: "Computer Networks",
    code: "CS302",
  },
  {
    id: "cs303",
    name: "Operating Systems",
    code: "CS303",
  },
  {
    id: "cs304",
    name: "Design and Analysis of Algorithms",
    code: "CS304",
  },
];

const studentTools = [
  {
    to: "/project-analysis",
    label: "Project Analysis",
    icon: GitBranch,
  },
  {
    to: "/resume-reviewer",
    label: "Resume Reviewer",
    icon: FileText,
  },
  {
    to: "/daily-quiz",
    label: "Daily Quiz",
    icon: Brain,
  },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";

  if (pathname.startsWith("/communities")) {
    return "Communities";
  }

  if (pathname.startsWith("/project-analysis")) {
    return "Project Analysis";
  }

  if (pathname.startsWith("/resume-reviewer")) {
    return "Resume Reviewer";
  }

  if (pathname.startsWith("/daily-quiz")) {
    return "Daily Quiz";
  }

  if (pathname.startsWith("/subjects")) {
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length > 1) {
      const subject = subjects.find((s) => s.id === parts[1]);

      if (subject) {
        return subject.name;
      }
    }

    return "My Subjects";
  }

  return "Dashboard";
}

function RootLayoutContent() {
 const [isSidebarOpen, setIsSidebarOpen] = useState(
  () => typeof window !== "undefined" && window.innerWidth >= 768
);
  const [isStudentToolsOpen, setIsStudentToolsOpen] = useState(true);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(true);

  const location = useLocation();
  const { actions, title: customTitle } = useHeader();

  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDarkMode = resolvedTheme === "dark";

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

  const isStudentToolsActive = studentTools.some((tool) =>
    location.pathname.startsWith(tool.to)
  );

  const isSubjectsActive = location.pathname.startsWith("/subjects");

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        style={
          isSidebarOpen
            ? ({
                "--sidebar-width": `${sidebarWidth}px`,
              } as React.CSSProperties)
            : undefined
        }
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-card md:static relative ${
          isSidebarDragging ? "" : "transition-[width] duration-200"
        } ${
          isSidebarOpen
            ? "w-64 md:w-[var(--sidebar-width,16rem)] translate-x-0 shrink-0"
            : "-translate-x-full md:w-0 md:translate-x-0 md:border-r-0 md:overflow-hidden shrink-0"
        }`}
      >
        <div className="flex h-full w-full flex-col justify-between overflow-y-auto p-4">
          <div className="space-y-6">
            {/* CampusHub Logo */}
            <Link
              to="/"
              onClick={closeSidebarOnMobile}
              className="flex items-center gap-2.5 px-2 py-1.5 text-xl font-bold tracking-tight"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>

              <span>CampusHub</span>
            </Link>

            {/* Main Navigation */}
            <nav className="space-y-1.5">
              {/* Dashboard */}
              <NavLink
                to="/"
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </NavLink>

              {/* Communities */}
              <NavLink
                to="/communities"
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Communities</span>
              </NavLink>

              {/* Student Tools */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setIsStudentToolsOpen((previous) => !previous)
                  }
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isStudentToolsActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-expanded={isStudentToolsOpen}
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 shrink-0" />
                    <span>Student Tools</span>
                  </div>

                  {isStudentToolsOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isStudentToolsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-2">
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
                              ? "bg-secondary font-medium text-foreground"
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

              {/* My Subjects */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsSubjectsOpen((previous) => !previous)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isSubjectsActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-expanded={isSubjectsOpen}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>My Subjects</span>
                  </div>

                  {isSubjectsOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isSubjectsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                    {subjects.map((subject) => {
                      const isActive =
                        location.pathname === `/subjects/${subject.id}`;

                      return (
                        <NavLink
                          key={subject.id}
                          to={`/subjects/${subject.id}`}
                          onClick={closeSidebarOnMobile}
                          className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-secondary font-medium text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className="truncate pr-1.5">
                            {subject.name}
                          </span>

                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {subject.code}
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

        {/* Sidebar Resize Handle */}
        {isSidebarOpen && (
          <ResizeHandle
            side="right"
            isDragging={isSidebarDragging}
            {...sidebarHandleProps}
            className="hidden md:flex"
          />
        )}
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen((previous) => !previous)}
              aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className="text-muted-foreground hover:text-foreground"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>

            <h1 className="text-base font-semibold text-foreground md:text-lg">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Feature-specific Header Actions */}
            {actions}

            {/* Theme Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="text-muted-foreground hover:text-foreground"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* User Avatar */}
            <Avatar className="h-8 w-8 cursor-pointer border transition-all hover:ring-2 hover:ring-primary/20">
              <AvatarFallback className="text-xs font-semibold">
                ST
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function RootLayout() {
  return (
    <HeaderProvider>
      <RootLayoutContent />
    </HeaderProvider>
  );
}
