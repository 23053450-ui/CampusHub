/**
 * @file CommunitiesPage.tsx
 * @description Main view for Communities feature uniting discussion feed and academic resources.
 * @owner Communities Team
 */

import React, { useEffect, useState, useTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Settings, MessageSquare, BookOpen } from "lucide-react";
import { HeaderActions } from "@/lib/header-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubjectForumsSidebar } from "./components/SubjectForumsSidebar";
import { CommunityHeader } from "./components/CommunityHeader";
import { PostFeed } from "./components/PostFeed";
import { ResourceArchive } from "./components/ResourceArchive";
import { communitiesService } from "./services";
import type {
  SubjectForum,
  Post,
  ResourceNote,
  ResourceType,
  ResourceCategory,
} from "./services/types";

export default function CommunitiesPage() {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const navigate = useNavigate();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data states
  const [forums, setForums] = useState<SubjectForum[]>([]);
  const [activeForum, setActiveForum] = useState<SubjectForum | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postSort, setPostSort] = useState<"new" | "top" | "hot">("new");

  const [notes, setNotes] = useState<ResourceNote[]>([]);
  const [pyqs, setPyqs] = useState<ResourceNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingPyqs, setIsLoadingPyqs] = useState(true);

  // Active Main Tab ("posts" | "resources")
  const [activeTab, setActiveTab] = useState<"posts" | "resources">("posts");

  // Global header search query
  const [headerSearch, setHeaderSearch] = useState("");

  // 1. Load Subject Forums
  useEffect(() => {
    let isMounted = true;
    communitiesService.getSubjectForums().then((res) => {
      if (isMounted && res.data) {
        setForums(res.data);
        // Set default active forum based on URL or first item
        const selected =
          res.data.find((f) => f.id === subjectId) || res.data[0] || null;
        setActiveForum(selected);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  // 2. Load Posts for active forum
  const loadPosts = () => {
    if (!activeForum) return;
    setIsLoadingPosts(true);
    communitiesService.getPosts(activeForum.id, postSort).then((res) => {
      if (res.data) {
        setPosts(res.data);
      }
      setIsLoadingPosts(false);
    });
  };

  useEffect(() => {
    loadPosts();
  }, [activeForum?.id, postSort]);

  // 3. Load Resources for active forum
  const loadResources = () => {
    if (!activeForum) return;
    setIsLoadingNotes(true);
    setIsLoadingPyqs(true);

    communitiesService.getResources(activeForum.id, "Note").then((res) => {
      if (res.data) setNotes(res.data);
      setIsLoadingNotes(false);
    });

    communitiesService.getResources(activeForum.id, "PYQ").then((res) => {
      if (res.data) setPyqs(res.data);
      setIsLoadingPyqs(false);
    });
  };

  useEffect(() => {
    loadResources();
  }, [activeForum?.id]);

  // Forum selection handler
  const handleSelectSubject = (id: string) => {
    navigate(`/communities/${id}`);
    const selected = forums.find((f) => f.id === id);
    if (selected) {
      setActiveForum(selected);
    }
  };

  // Optimistic Vote Handler
  const handleVotePost = async (postId: string, newVote: 1 | -1 | null) => {
    // 1. Optimistically update local posts state
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        let upvotes = post.upvotes;
        let downvotes = post.downvotes;
        const prevVote = post.currentUserVote;

        if (prevVote === 1) upvotes = Math.max(0, upvotes - 1);
        if (prevVote === -1) downvotes = Math.max(0, downvotes - 1);

        if (newVote === 1) upvotes += 1;
        if (newVote === -1) downvotes += 1;

        return {
          ...post,
          upvotes,
          downvotes,
          currentUserVote: newVote,
        };
      })
    );

    // 2. Dispatch to service layer
    const result = await communitiesService.votePost(postId, newVote);
    if (result.error) {
      // Revert if error occurs
      loadPosts();
    }
  };

  // Create Post Handler
  const handleCreatePost = async (title: string, body: string) => {
    if (!activeForum) return;
    const res = await communitiesService.createPost({
      subjectId: activeForum.id,
      title,
      body,
    });
    if (res.data) {
      setPosts((prev) => [res.data, ...prev]);
    }
  };

  // Upload Resource Handler
  const handleUploadResource = async (data: {
    title: string;
    type: ResourceType;
    category?: ResourceCategory;
    pageCount?: number;
    file?: File;
  }) => {
    if (!activeForum) return;
    const res = await communitiesService.uploadResource({
      subjectId: activeForum.id,
      title: data.title,
      type: data.type,
      category: data.category,
      pageCount: data.pageCount,
      file: data.file,
    });
    if (res.data) {
      if (res.data.type === "Note") {
        setNotes((prev) => [res.data, ...prev]);
      } else {
        setPyqs((prev) => [res.data, ...prev]);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-5.5rem)] -m-4 md:-m-6 lg:-m-8 overflow-hidden bg-background">
      {/* Top Main Navigation Bar Actions (matching wireframe search & settings) */}
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

      {/* Secondary Left Column: Subject Forums Navigator */}
      <SubjectForumsSidebar
        forums={forums}
        activeSubjectId={activeForum?.id || ""}
        onSelectSubject={handleSelectSubject}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Forum Workspace Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
        {activeForum ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Forum Header Banner */}
            <CommunityHeader forum={activeForum} />

            {/* Main Tabs matching wireframe: Posts | Resources */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "posts" | "resources")}
              className="w-full"
            >
              <div className="border-b">
                <TabsList className="bg-transparent h-10 p-0 space-x-6">
                  <TabsTrigger
                    value="posts"
                    className="relative rounded-none border-b-2 border-transparent px-2 pb-2.5 pt-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                  >
                    Posts
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="relative rounded-none border-b-2 border-transparent px-2 pb-2.5 pt-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                  >
                    Resources
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: Posts (Discussions) */}
              <TabsContent value="posts" className="mt-4 focus-visible:outline-none">
                <PostFeed
                  posts={posts}
                  isLoading={isLoadingPosts}
                  subjectName={activeForum.name}
                  sortBy={postSort}
                  onSortChange={setPostSort}
                  onVote={handleVotePost}
                  onCreatePost={handleCreatePost}
                  onRefresh={loadPosts}
                />
              </TabsContent>

              {/* Tab 2: Resources (Notes & PYQs) */}
              <TabsContent value="resources" className="mt-4 focus-visible:outline-none">
                <ResourceArchive
                  notes={notes}
                  pyqs={pyqs}
                  isLoadingNotes={isLoadingNotes}
                  isLoadingPyqs={isLoadingPyqs}
                  subjectName={activeForum.name}
                  onUploadResource={handleUploadResource}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a subject forum to view discussions and academic resources.
          </div>
        )}
      </div>
    </div>
  );
}
