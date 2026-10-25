/**
 * @file SubjectAiPanelPage.tsx
 * @description Main view for Subject AI Study Companion Panel feature.
 * @owner Subject AI Panel Team
 */

import { useParams } from "react-router-dom";
import { ChatPanel } from "./components/ChatPanel";

export default function SubjectAiPanelPage() {
  const { subjectId } = useParams<{ subjectId: string }>();

  if (!subjectId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Open a subject to chat with the AI companion.
      </div>
    );
  }

  // key={subjectId} resets the conversation when you switch subjects
  return <ChatPanel key={subjectId} subjectId={subjectId} />;
}