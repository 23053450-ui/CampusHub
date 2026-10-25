/**
 * @file CommunitiesLayout.tsx
 * @description Layout shell providing persistent SubjectForumsSidebar across all community views.
 * @owner Communities Team
 */

import React, { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { Search, Settings } from "lucide-react";
import { HeaderActions } from "@/lib/header-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubjectForumsSidebar } from "./components/SubjectForumsSidebar";
import { communitiesService } from "./services";
import type { SubjectForum } from "./services/types";

export interface CommunitiesContextType {
  forums: SubjectForum[];
  activeForum: SubjectForum | null;
  isSidebarOpen: boolean;
}

export default function CommunitiesLayout() {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [forums, setForums] = useState<SubjectForum[]>([]);
  const [activeForum, setActiveForum] = useState<SubjectForum | null>(null);
  const [headerSearch, setHeaderSearch] = useState("");

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

  const handleSelectSubject = (id: string) => {
    navigate(`/communities/${id}`);
    const selected = forums.find((f) => f.id === id);
    if (selected) {
      setActiveForum(selected);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5.5rem)] -m-4 md:-m-6 lg:-m-8 overflow-hidden bg-background relative">
      {/* Top Header Actions */}
      <HeaderActions>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={activeForum ? activeForum.name : "Search Communities..."}
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/40 focus:bg-background"
            />
          </div>
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
        <Outlet context={{ forums, activeForum, isSidebarOpen }} />
      </div>
    </div>
  );
}

