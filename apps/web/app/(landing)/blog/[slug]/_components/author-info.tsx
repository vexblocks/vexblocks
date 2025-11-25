"use client";

import type { ContentAuthorsContent } from "@repo/cms-shared";
import { CFImage } from "@repo/cms-shared";
import { useQuery } from "convex/react";
import { api } from "vexblocks-backend/convex/_generated/api";
import type { Id } from "vexblocks-backend/convex/_generated/dataModel";
import { useState } from "react";

type AuthorInfoProps = {
  author: string | ContentAuthorsContent;
};

export function AuthorInfo({ author: authorData }: AuthorInfoProps) {
  const isAuthorString = typeof authorData === "string";
  const [imageError, _setImageError] = useState(false);

  // Fetch author if it's an ID string
  const fetchedAuthor = useQuery(
    api.cms.content.getPublishedById,
    isAuthorString && authorData
      ? { id: authorData as Id<"cmsContent"> }
      : "skip"
  ) as ContentAuthorsContent | null | undefined;

  // Determine which author data to use
  const author: ContentAuthorsContent | null | undefined = isAuthorString
    ? fetchedAuthor
    : (authorData as ContentAuthorsContent);

  if (!author) return null;

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = author.data.name ? getInitials(author.data.name) : "?";

  return (
    <div className="flex items-center gap-4">
      {/* Author Picture or Avatar */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-gray-200">
        {author.data.picture && !imageError ? (
          <div className="relative size-full">
            <CFImage
              assetId={author.data.picture}
              alt={author.data.name || "Author"}
              width={56}
              height={56}
              variant="avatar"
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="flex size-full items-center justify-center bg-linar-to-br from-teal-500 to-teal-700 font-semibold text-2xl text-white">
            {initials}
          </div>
        )}
      </div>

      {/* Author Details */}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-2xl text-gray-900 tracking-tight">
          {author.data.name}
        </p>
        {(author.data.job_title || author.data.company_name) && (
          <p className="text-gray-600 text-lg">
            {[author.data.job_title, author.data.company_name]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
