"use client";

import type { BlogTagsContent, BlogPostsContent } from "@repo/cms-shared";
import { useQuery } from "convex/react";
import { api } from "vexblocks-backend/convex/_generated/api";
import { useState } from "react";
import { Container } from "@/components/atoms/container";
import { BlogFilters } from "./blog-filters";
import { BlogPostsGrid } from "./blog-posts-grid";
import { FeaturedPost } from "./featured-post";

type ContentLibraryClientProps = {
  featuredPost: BlogPostsContent | null;
  tags: BlogTagsContent[];
  posts: BlogPostsContent[];
};

export function ContentLibraryClient({
  featuredPost,
  tags: allTags,
  posts: initialPosts,
}: ContentLibraryClientProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch schema IDs (still client-side as it's fast and cached)
  const _blogPostsSchemaId = useQuery(api.cms.schemas.getIdByName, {
    name: "blog_posts",
  });

  const _blogTagsSchemaId = useQuery(api.cms.schemas.getIdByName, {
    name: "blog_tags",
  });

  // If we have selected tags, filter client-side
  const filteredPosts =
    selectedTags.length > 0 && initialPosts
      ? initialPosts.filter((post) => {
          const postTags = post.data.tags;
          if (!postTags) return false;
          return selectedTags.some((tagId) =>
            postTags.some((t: any) =>
              typeof t === "string" ? t === tagId : t._id === tagId
            )
          );
        })
      : initialPosts;

  // Filter out the featured post from the regular posts
  // Filter out the featured post from the regular posts
  const regularPosts =
    filteredPosts?.filter((post) => post._id !== featuredPost?._id) || [];

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Transform tags data for display
  const tagsForDisplay =
    allTags?.map((tag) => ({
      _id: tag._id,
      name: tag.data.name,
    })) || [];

  return (
    <div className="bg-gray-100 px-4 py-20 md:px-0">
      <Container>
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <FeaturedPost post={featuredPost} />
          </div>
        )}

        {/* Filters */}
        {tagsForDisplay.length > 0 && (
          <div className="mb-16">
            <BlogFilters
              tags={tagsForDisplay}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
          </div>
        )}

        {/* Posts Grid */}
        <div>
          <BlogPostsGrid posts={regularPosts} />
        </div>
      </Container>
    </div>
  );
}
