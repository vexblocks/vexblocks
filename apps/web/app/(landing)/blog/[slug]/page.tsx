"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/atoms/button"
import { Container } from "@/components/atoms/container"
import { Heading } from "@/components/atoms/heading"
import { Text } from "@/components/atoms/text"

export default function BlogPostPage({ params }: { params: { slug: string } }) {
	const post = useQuery(api.cms.content.getCollectionItem, {
		schemaName: "blog_posts",
		slug: params.slug,
	})

	if (post === undefined) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
					<Text className="text-gray-600">Loading post...</Text>
				</div>
			</div>
		)
	}

	if (post === null) {
		return (
			<section className="py-20">
				<Container>
					<div className="mx-auto max-w-2xl text-center">
						<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
							<svg
								className="h-10 w-10 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<Heading as="h1" size="4xl" className="mb-4">
							Post Not Found
						</Heading>
						<Text className="mb-8 text-gray-600 text-lg">
							The blog post you are looking for does not exist or has not been
							published yet.
						</Text>
						<Link href="/blog">
							<Button size="md">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Blog
							</Button>
						</Link>
					</div>
				</Container>
			</section>
		)
	}

	return (
		<>
			<section className="border-b bg-gray-50 py-6">
				<Container>
					<Link
						href="/blog"
						className="inline-flex items-center gap-2 text-gray-600 text-sm transition-colors hover:text-blue-600"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Blog
					</Link>
				</Container>
			</section>

			<article className="py-12">
				<Container>
					<div className="mx-auto max-w-4xl">
						<div className="mb-6 flex flex-wrap items-center gap-4 text-gray-600 text-sm">
							{post.data.published_date && (
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									<time>
										{new Date(post.data.published_date).toLocaleDateString(
											"en-US",
											{
												month: "long",
												day: "numeric",
												year: "numeric",
											},
										)}
									</time>
								</div>
							)}
							{post.data.read_time && (
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4" />
									<span>{post.data.read_time} min read</span>
								</div>
							)}
							{post.data.author && (
								<div className="flex items-center gap-2">
									<User className="h-4 w-4" />
									<span>{post.data.author}</span>
								</div>
							)}
						</div>

						<Heading as="h1" size="6xl" className="mb-6">
							{post.data.title || "Untitled Post"}
						</Heading>

						{post.data.excerpt && (
							<Text className="mb-8 text-gray-600 text-xl leading-relaxed">
								{post.data.excerpt}
							</Text>
						)}

						{post.data.featured_image && (
							<div className="mb-12 overflow-hidden rounded-xl">
								<div className="relative aspect-video bg-gray-100">
									<Image
										src={post.data.featured_image}
										alt={post.data.title || "Blog post image"}
										fill
										className="object-cover"
										priority
									/>
								</div>
							</div>
						)}

						<div className="prose prose-lg mb-12 max-w-none">
							{post.data.content ? (
								<div
									dangerouslySetInnerHTML={{ __html: post.data.content }}
									className="prose-ol:my-6 prose-ul:my-6 prose-h2:mt-12 prose-h3:mt-8 prose-h2:mb-4 prose-h3:mb-3 prose-li:mb-2 prose-p:mb-6 prose-ol:list-decimal prose-ul:list-disc prose-pre:overflow-x-auto prose-code:rounded prose-img:rounded-lg prose-pre:rounded-lg prose-blockquote:border-blue-600 prose-blockquote:border-l-4 prose-code:bg-gray-100 prose-pre:bg-gray-900 prose-pre:p-6 prose-code:px-2 prose-code:py-1 prose-blockquote:pl-6 prose-ol:pl-6 prose-ul:pl-6 prose-headings:font-bold prose-headings:font-serif prose-strong:font-semibold prose-a:text-blue-600 prose-blockquote:text-gray-600 prose-code:text-blue-600 prose-code:text-sm prose-h2:text-3xl prose-h3:text-2xl prose-li:text-gray-700 prose-p:text-gray-700 prose-pre:text-gray-100 prose-strong:text-gray-900 prose-blockquote:italic prose-p:leading-relaxed prose-a:no-underline prose-img:shadow-lg hover:prose-a:underline"
								/>
							) : (
								<Text className="text-gray-500 italic">
									No content available for this post.
								</Text>
							)}
						</div>

						{post.data.author && (
							<div className="mt-16 border-t pt-8">
								<div className="flex items-center gap-4">
									<div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
										<span className="font-bold text-2xl text-blue-600">
											{post.data.author.charAt(0).toUpperCase()}
										</span>
									</div>
									<div>
										<Text className="font-semibold text-lg">
											{post.data.author}
										</Text>
										<Text className="text-gray-600 text-sm">Author</Text>
									</div>
								</div>
							</div>
						)}

						<div className="mt-16 border-t pt-8 text-center">
							<Link href="/blog">
								<Button size="md">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Read More Articles
								</Button>
							</Link>
						</div>
					</div>
				</Container>
			</article>
		</>
	)
}
