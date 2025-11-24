"use client";

import type { Id } from "vexblocks-backend/convex/_generated/dataModel";
import { Container } from "@/components/atoms/container";
import { AuthorInfo } from "./author-info";
import { PostContent } from "./post-content";
import { PostHeader } from "./post-header";
import { PostTags } from "./post-tags";
import { RelatedPosts } from "./related-posts";
import { ShareSection } from "./share-section";

type PostClientProps = {
  post: any;
  slug: string;
  schemaId: Id<"cmsSchemas">;
};

export function PostClient({ post, slug, schemaId }: PostClientProps) {
  // Not found state
  if (!post) {
    return (
      <div className="bg-white px-4 py-20 md:px-0">
        <Container>
          <div className="py-20 text-center">
            <h1 className="mb-4 font-normal font-serif text-4xl text-gray-900">
              Post not found
            </h1>
            <p className="text-gray-600 text-lg">
              The post you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  // Extract tag IDs for related posts
  const tagIds = post.data.tags
    ? post.data.tags.map((tag: any) =>
        typeof tag === "string" ? tag : tag._id
      )
    : undefined;

  return (
    <div className="bg-gray-100 px-4 py-12 pt-20 md:px-0 md:py-20">
      <Container>
        <div className="mx-auto max-w-[1000px]">
          <PostHeader post={post} />
          <PostContent post={post} />

          {/* Share and Tags Section */}
          <div className="mt-8 flex flex-col gap-6 lg:mt-12 lg:gap-12">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
              {/* Share Section */}
              <div className="flex-1">
                <ShareSection title={post.data.title} slug={slug} />
              </div>

              {/* Tags */}
              {post.data.tags && post.data.tags.length > 0 && (
                <div className="shrink-0">
                  <PostTags tags={post.data.tags} />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-gray-300 border-t" />

            {/* Author Info */}
            {post.data.author && <AuthorInfo author={post.data.author} />}
          </div>

          {/* Related Posts */}
          {schemaId && (
            <div className="mt-16">
              <RelatedPosts
                currentPostId={post._id}
                schemaId={schemaId}
                tags={tagIds}
              />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
