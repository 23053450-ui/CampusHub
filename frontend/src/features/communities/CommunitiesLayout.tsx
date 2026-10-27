/**
 * @file CommunitiesLayout.tsx
 * @description Layout shell providing persistent SubjectForumsSidebar across all community views.
 * @owner Communities Team
 */

import React, { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { HeaderActions, HeaderCenter } from "@/lib/header-context";
import { Button } from "@/components/ui/button";
import { SubjectForumsSidebar } from "./components/SubjectForumsSidebar";
import { GlobalSearchBar } from "./components/GlobalSearchBar";
import { usePersistentToggle } from "@/lib/use-persistent-toggle";
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

  const [isSidebarOpen, setIsSidebarOpen] = usePersistentToggle("campushub:sidebar:communities", true);
  const [forums, setForums] = useState<SubjectForum[]>([]);
  const [activeForum, setActiveForum] = useState<SubjectForum | null>(null);

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
      {/* Centered Global Header Search */}
      <HeaderCenter>
        <GlobalSearchBar />
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
        <Outlet context={{ forums, activeForum, isSidebarOpen }} />
      </div>
    </div>
  );
}

