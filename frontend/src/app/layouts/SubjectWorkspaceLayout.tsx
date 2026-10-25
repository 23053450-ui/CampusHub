/**
 * @file SubjectWorkspaceLayout.tsx
 * @description Composite layout combining Subject Viewer (main canvas) and collapsible AI Panel (right sidebar).
 * @owner App Shell Team
 */

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { PanelRight, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderActions } from "@/lib/header-context";
import { useResizable } from "@/lib/use-resizable";
import { ResizeHandle } from "@/components/ui/resize-handle";
import SubjectAiPanelPage from "@/features/subject-ai-panel/SubjectAiPanelPage";

export default function SubjectWorkspaceLayout() {
  const [isOpen, setIsOpen] = useState(true);

  const {
    width: aiPanelWidth,
    isDragging: isAiDragging,
    handleProps: aiHandleProps,
  } = useResizable({
    direction: "left",
    defaultWidth: 384,
    minWidth: 280,
    maxWidth: 640,
    storageKey: "campushub:right-ai-sidebar-width",
  });

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Inject AI Panel toggle into the top main header */}
      <HeaderActions>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen((prev) => !prev)}
          className={
            isOpen
              ? "text-foreground bg-secondary hover:bg-secondary/80"
              : "text-muted-foreground hover:text-foreground"
          }
          aria-label={isOpen ? "Collapse AI Panel" : "Expand AI Panel"}
          title={isOpen ? "Collapse AI Panel" : "Expand AI Panel"}
        >
          {isOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRight className="h-5 w-5" />
          )}
        </Button>
      </HeaderActions>

      {/* Main Canvas: Left notes tree + Center document/PDF viewer */}
      <div className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </div>

      {/* Right Sidebar: AI Companion Study Panel */}
      <aside
        style={{
          width: `${aiPanelWidth}px`,
          marginRight: isOpen ? 0 : `-${aiPanelWidth}px`,
        }}
        className={`border-l bg-card shrink-0 relative flex flex-col ${
          isAiDragging ? "" : "transition-[margin] duration-200 ease-in-out"
        } ${isOpen ? "overflow-visible" : "overflow-hidden"}`}
      >
        {isOpen && (
          <ResizeHandle
            side="left"
            isDragging={isAiDragging}
            {...aiHandleProps}
          />
        )}
        <div
          style={{ width: `${aiPanelWidth}px`, minWidth: `${aiPanelWidth}px` }}
          className="flex-1 overflow-auto"
        >
          <SubjectAiPanelPage />
        </div>
      </aside>
    </div>
  );
}
