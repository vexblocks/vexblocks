"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Container } from "@/components/atoms/container"
import { Heading } from "@/components/atoms/heading"
import { Text } from "@/components/atoms/text"

export default function BlogPage() {
	const posts = useQuery(api.cms.content.listCollection, {
		schemaName: "blog_posts",
	})

	return (
		<>
			{/* Hero Section */}
			<section className="bg-linear-to-b from-blue-50 to-white py-16">
				<Container>
					<div className="mx-auto max-w-3xl text-center">
						<Heading as="h1" size="6xl" className="mb-4">
							Blog Demo
						</Heading>
						<Text className="text-gray-600 text-xl">
							Explore articles powered by VexBlocks CMS with real-time updates
							and seamless content delivery.
						</Text>
					</div>
				</Container>
			</section>

			{/* Blog Posts Grid */}
			<section className="py-16">
				<Container>
					{!posts ? (
						<div className="py-12 text-center">
							<div className="mx-auto h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
							<Text className="mt-4 text-gray-600">Loading posts...</Text>
						</div>
					) : posts.length === 0 ? (
						<div className="py-12 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
								<svg
									className="h-8 w-8 text-gray-400"
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
							<Heading as="h2" size="2xl" className="mb-2">
								No posts yet
							</Heading>
							<Text className="mb-6 text-gray-600">
								Create your first blog post in the VexBlocks CMS to see it here.
							</Text>
							<div className="mx-auto max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-6 text-left">
								<Heading as="h3" size="lg" className="mb-3">
									Quick Start:
								</Heading>
								<ol className="space-y-2 text-gray-700 text-sm">
									<li className="flex gap-2">
										<span className="font-bold text-blue-600">1.</span>
										<span>
											Go to the CMS admin and create a schema named{" "}
											<code className="rounded bg-white px-2 py-0.5 text-blue-600">
												blog_posts
											</code>{" "}
											with type <strong>Collection</strong>
										</span>
									</li>
									<li className="flex gap-2">
										<span className="font-bold text-blue-600">2.</span>
										<span>
											Add fields:{" "}
											<code className="rounded bg-white px-2 py-0.5">
												title
											</code>
											,{" "}
											<code className="rounded bg-white px-2 py-0.5">
												excerpt
											</code>
											,{" "}
											<code className="rounded bg-white px-2 py-0.5">
												content
											</code>
											,{" "}
											<code className="rounded bg-white px-2 py-0.5">
												author
											</code>
											,{" "}
											<code className="rounded bg-white px-2 py-0.5">
												published_date
											</code>
											,{" "}
											<code className="rounded bg-white px-2 py-0.5">
												featured_image
											</code>
										</span>
									</li>
									<li className="flex gap-2">
										<span className="font-bold text-blue-600">3.</span>
										<span>Create and publish some blog posts</span>
									</li>
									<li className="flex gap-2">
										<span className="font-bold text-blue-600">4.</span>
										<span>Refresh this page to see your content!</span>
									</li>
								</ol>
							</div>
						</div>
					) : (
						<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
							{posts.map((post) => (
								<Link
									key={post._id}
									href={`/blog/${post.slug}`}
									className="group"
								>
									<article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
										{/* Featured Image */}
										{post.data.featured_image ? (
											<div className="relative aspect-video overflow-hidden bg-linear-to-br from-blue-100 to-blue-200">
												<Image
													src={post.data.featured_image}
													alt={post.data.title || "Blog post image"}
													fill
													className="object-cover transition-transform duration-300 group-hover:scale-105"
												/>
											</div>
										) : (
											<div className="flex aspect-video items-center justify-center bg-linear-to-br from-blue-100 to-blue-200">
												<Image
													src="/logotype.png"
													alt="VexBlocks"
													width={40}
													height={40}
												/>
											</div>
										)}

										{/* Content */}
										<div className="flex flex-1 flex-col p-6">
											<div className="mb-3 flex items-center gap-4 text-gray-500 text-sm">
												{post.data.published_date && (
													<div className="flex items-center gap-1">
														<Calendar className="h-4 w-4" />
														<time>
															{new Date(
																post.data.published_date,
															).toLocaleDateString("en-US", {
																month: "short",
																day: "numeric",
																year: "numeric",
															})}
														</time>
													</div>
												)}
												{post.data.read_time && (
													<div className="flex items-center gap-1">
														<Clock className="h-4 w-4" />
														<span>{post.data.read_time} min read</span>
													</div>
												)}
											</div>

											<Heading
												as="h3"
												size="xl"
												className="mb-2 transition-colors group-hover:text-blue-600"
											>
												{post.data.title || "Untitled Post"}
											</Heading>

											{post.data.excerpt && (
												<Text className="mb-4 line-clamp-3 flex-1 text-gray-600">
													{post.data.excerpt}
												</Text>
											)}

											{post.data.author && (
												<div className="mb-4 flex items-center gap-2 text-gray-500 text-sm">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
														<span className="font-medium text-blue-600">
															{post.data.author.charAt(0).toUpperCase()}
														</span>
													</div>
													<span>{post.data.author}</span>
												</div>
											)}

											<div className="flex items-center gap-2 font-medium text-blue-600 text-sm transition-all group-hover:gap-3">
												<span>Read more</span>
												<ArrowRight className="h-4 w-4" />
											</div>
										</div>
									</article>
								</Link>
							))}
						</div>
					)}
				</Container>
			</section>
		</>
	)
}
