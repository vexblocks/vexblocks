/**
 * CMS Shared Types
 * This file exports all generated types and utility types
 */

export * from "./generated"

import type { CMSContent, CMSContentBySchema, CMSSchemaName } from "./generated"

// Type guard utilities
export function isContentType<T extends CMSSchemaName>(
	content: CMSContent,
	schemaName: T,
): content is CMSContentBySchema<T> {
	return (content as any).schemaId === schemaName
}

// Helper to extract data type from content
export type CMSContentData<T extends CMSContent> = T["data"]
