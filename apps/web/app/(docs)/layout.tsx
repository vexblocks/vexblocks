import { DocsHeader } from "@/components/docs/header"
import { DocsSidebar } from "@/components/docs/sidebar"
import { TableOfContents } from "@/components/docs/table-of-contents"
import { PreviewProvider, VisualEditing } from "@repo/cms-shared"

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<PreviewProvider>
			<VisualEditing />
			<div className="min-h-screen bg-background">
				<DocsHeader />
				<div className="container max-w-screen-2xl flex-1 items-start md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
					<DocsSidebar />
					<main className="relative py-8 lg:gap-10 xl:grid xl:grid-cols-[1fr_280px]">
						<article className="prose prose-slate dark:prose-invert prose-headings:text-foreground prose-li:text-muted-foreground prose-p:text-muted-foreground prose-p:leading-7 mx-auto w-full max-w-4xl min-w-0 px-4 md:px-8 [&>*:not(:first-child)]:mt-6">
							{children}
						</article>
						<TableOfContents />
					</main>
				</div>
			</div>
		</PreviewProvider>
	)
}
