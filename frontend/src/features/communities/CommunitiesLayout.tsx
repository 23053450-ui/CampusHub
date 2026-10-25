/**
 * @file CommunitiesLayout.tsx
 * @description Layout shell providing persistent SubjectForumsSidebar across all community views.
 * @owner Communities Team
 */

import React, { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { Search, Settings, X } from "lucide-react";
import { HeaderActions, HeaderCenter } from "@/lib/header-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubjectForumsSidebar } from "./components/SubjectForumsSidebar";
import { usePersistentToggle } from "@/lib/use-persistent-toggle";
import { communitiesService } from "./services";
import type { SubjectForum } from "./services/types";

export interface CommunitiesContextType {
  forums: SubjectForum[];
  activeForum: SubjectForum | null;
  isSidebarOpen: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function CommunitiesLayout() {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = usePersistentToggle("campushub:sidebar:communities", true);
  const [forums, setForums] = useState<SubjectForum[]>([]);
  const [activeForum, setActiveForum] = useState<SubjectForum | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    communitiesService.getSubjectForums().then((res) => {
      if (isMounted && res.data) {
        setForums(res.data);
        const selected =
          res.data.find((f) => f.id === subjectId) || res.data[0] || null;
        setActiveForum(selected);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  // Reset search when active subject changes
  useEffect(() => {
    setSearchQuery("");
  }, [subjectId]);

  const handleSelectSubject = (id: string) => {
    navigate(`/communities/${id}`);
    const selected = forums.find((f) => f.id === id);
    if (selected) {
      setActiveForum(selected);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    // If user starts searching while on a subroute like /post/:postId or /new, navigate to main community feed
    if (val.trim() && (location.pathname.includes("/post/") || location.pathname.endsWith("/new"))) {
      if (activeForum) {
        navigate(`/communities/${activeForum.id}`);
      } else {
        navigate("/communities");
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-5.5rem)] -m-4 md:-m-6 lg:-m-8 overflow-hidden bg-background relative">
      {/* Centered Top Header Search */}
      <HeaderCenter>
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={
              activeForum
                ? `Search ${activeForum.name} posts...`
                : "Search post titles..."
            }
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
              }
            }}
            className="h-8.5 w-full pl-8 pr-8 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border-muted-foreground/20 focus:border-primary transition-all rounded-lg"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </HeaderCenter>

      {/* Top Header Actions (Right) */}
      <HeaderActions>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Community Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </HeaderActions>

      {/* Persistent Subject Forums Sidebar */}
      <SubjectForumsSidebar
        forums={forums}
        activeSubjectId={activeForum?.id || ""}
        onSelectSubject={handleSelectSubject}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <Outlet context={{ forums, activeForum, isSidebarOpen, searchQuery, setSearchQuery }} />
      </div>
    </div>
  );
}

