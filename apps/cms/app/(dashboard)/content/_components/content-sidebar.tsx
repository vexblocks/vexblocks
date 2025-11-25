"use client"

import { FileText, Folder, Globe, Menu, X } from "lucide-react"
import { useState } from "react"

type Schema = {
	_id: string
	name: string
	displayName: string
	type: "global" | "page" | "collection"
	icon?: string
}

type ContentSidebarProps = {
	schemas: Schema[]
	selectedSchemaId: string
	onSelectSchema: (schemaId: string) => void
}

export function ContentSidebar({
	schemas,
	selectedSchemaId,
	onSelectSchema,
}: ContentSidebarProps) {
	const [isOpen, setIsOpen] = useState(false)

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "global":
				return <Globe className="h-4 w-4" />
			case "page":
				return <FileText className="h-4 w-4" />
			case "collection":
				return <Folder className="h-4 w-4" />
			default:
				return <FileText className="h-4 w-4" />
		}
	}

	const _getTypeBadge = (type: string) => {
		switch (type) {
			case "global":
				return (
					<span className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-700 text-xs">
						Global
					</span>
				)
			case "page":
				return (
					<span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-700 text-xs">
						Page
					</span>
				)
			case "collection":
				return (
					<span className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-700 text-xs">
						Collection
					</span>
				)
			default:
				return null
		}
	}

	const groupedSchemas = {
		global: schemas.filter((s) => s.type === "global"),
		page: schemas.filter((s) => s.type === "page"),
		collection: schemas.filter((s) => s.type === "collection"),
	}

	return (
		<>
			{/* Mobile Toggle Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="fixed top-4 left-4 z-50 rounded-lg bg-primary p-2 text-white shadow-lg lg:hidden"
			>
				{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
			</button>

			{/* Overlay for mobile */}
			{isOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/50 lg:hidden"
					onClick={() => setIsOpen(false)}
					role="button"
					tabIndex={0}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed top-0 left-0 z-40 h-full w-64 transform border-grey-200 border-r bg-white transition-transform lg:relative lg:translate-x-0 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex h-full flex-col">
					{/* Header */}
					<div className="border-grey-200 border-b p-4">
						<h2 className="font-semibold text-grey-900 text-lg">Schemas</h2>
						<p className="text-grey-500 text-sm">Select a content type</p>
					</div>

					{/* Schema List */}
					<div className="flex-1 overflow-y-auto p-4">
						<div className="space-y-6">
							{/* Collections */}
							{groupedSchemas.collection.length > 0 && (
								<div>
									<h3 className="mb-2 flex items-center gap-2 text-grey-500 text-xs uppercase tracking-wide">
										<Folder className="h-3 w-3" />
										Collections
									</h3>
									<div className="space-y-1">
										{groupedSchemas.collection.map((schema) => (
											<button
												key={schema._id}
												type="button"
												onClick={() => {
													onSelectSchema(schema._id)
													setIsOpen(false)
												}}
												className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
													selectedSchemaId === schema._id
														? "bg-primary text-white"
														: "text-grey-700 hover:bg-grey-100"
												}`}
											>
												{getTypeIcon(schema.type)}
												<span className="flex-1 truncate">
													{schema.displayName}
												</span>
											</button>
										))}
									</div>
								</div>
							)}

							{/* Pages */}
							{groupedSchemas.page.length > 0 && (
								<div>
									<h3 className="mb-2 flex items-center gap-2 text-grey-500 text-xs uppercase tracking-wide">
										<FileText className="h-3 w-3" />
										Pages
									</h3>
									<div className="space-y-1">
										{groupedSchemas.page.map((schema) => (
											<button
												key={schema._id}
												type="button"
												onClick={() => {
													onSelectSchema(schema._id)
													setIsOpen(false)
												}}
												className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
													selectedSchemaId === schema._id
														? "bg-primary text-white"
														: "text-grey-700 hover:bg-grey-100"
												}`}
											>
												{getTypeIcon(schema.type)}
												<span className="flex-1 truncate">
													{schema.displayName}
												</span>
											</button>
										))}
									</div>
								</div>
							)}

							{/* Globals */}
							{groupedSchemas.global.length > 0 && (
								<div>
									<h3 className="mb-2 flex items-center gap-2 text-grey-500 text-xs uppercase tracking-wide">
										<Globe className="h-3 w-3" />
										Globals
									</h3>
									<div className="space-y-1">
										{groupedSchemas.global.map((schema) => (
											<button
												key={schema._id}
												type="button"
												onClick={() => {
													onSelectSchema(schema._id)
													setIsOpen(false)
												}}
												className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
													selectedSchemaId === schema._id
														? "bg-primary text-white"
														: "text-grey-700 hover:bg-grey-100"
												}`}
											>
												{getTypeIcon(schema.type)}
												<span className="flex-1 truncate">
													{schema.displayName}
												</span>
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</aside>
		</>
	)
}
