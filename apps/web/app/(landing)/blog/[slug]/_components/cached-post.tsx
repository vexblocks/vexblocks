import { getPostData } from "./get-post-data"
import { Post } from "./post"

type CachedPostProps = {
	slug: string
}

/**
 * CachedPost - Renders cached post content
 *
 * Data is fetched via getPostData() which has "use cache".
 * This component awaits the cached data and renders it.
 * No data is sent to the client, only HTML.
 */
export async function CachedPost({ slug }: CachedPostProps) {
	const { post, schemaId } = await getPostData(slug)

	if (!schemaId) {
		return null
	}

	return <Post post={post} slug={slug} schemaId={schemaId} />
}
