/**
 * @file CommunitiesPage.tsx
 * @description Main view for Communities feature uniting discussion feed and academic resources.
 * @owner Communities Team
 */

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityHeader } from "./components/CommunityHeader";
import { PostFeed } from "./components/PostFeed";
import { ResourceArchive } from "./components/ResourceArchive";
import { communitiesService } from "./services";
import type { CommunitiesContextType } from "./CommunitiesLayout";
import type {
  Post,
  ResourceNote,
  ResourceType,
  ResourceCategory,
} from "./services/types";

export default function CommunitiesPage() {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const context = useOutletContext<CommunitiesContextType | undefined>();

  const activeForum = context?.activeForum || null;
  const searchQuery = context?.searchQuery || "";

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postSort, setPostSort] = useState<"new" | "top" | "hot">("new");

  const [notes, setNotes] = useState<ResourceNote[]>([]);
  const [pyqs, setPyqs] = useState<ResourceNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingPyqs, setIsLoadingPyqs] = useState(true);

  // Active Main Tab ("posts" | "resources")
  const [activeTab, setActiveTab] = useState<"posts" | "resources">("posts");

  // Automatically switch to Posts tab when a search query is typed
  useEffect(() => {
    if (searchQuery.trim()) {
      setActiveTab("posts");
    }
  }, [searchQuery]);

  // Filter posts by title using active search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return posts.filter((post) => {
      const titleLower = post.title.toLowerCase();
      return terms.every((term) => titleLower.includes(term));
    });
  }, [posts, searchQuery]);

  // 1. Load Posts for active forum
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

  // 2. Load Resources for active forum
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

  // Optimistic Vote Handler
  const handleVotePost = async (postId: string, newVote: 1 | -1 | null) => {
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

    const result = await communitiesService.votePost(postId, newVote);
    if (result.error) {
      loadPosts();
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
    <div className="p-4 sm:p-6 lg:p-8 min-w-0">
      {activeForum ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Forum Header Banner */}
          <CommunityHeader forum={activeForum} />

          {/* Main Tabs: Posts | Resources */}
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
                posts={filteredPosts}
                isLoading={isLoadingPosts}
                subjectName={activeForum.name}
                subjectId={activeForum.id}
                sortBy={postSort}
                onSortChange={setPostSort}
                onVote={handleVotePost}
                onRefresh={loadPosts}
                searchQuery={searchQuery}
                onClearSearch={() => context?.setSearchQuery("")}
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
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Select a subject forum to view discussions and academic resources.
        </div>
      )}
    </div>
  );
}
