export type FieldType =
	| "shortText"
	| "longText"
	| "richText"
	| "media"
	| "file"
	| "url"
	| "youtubeUrl"
	| "boolean"
	| "number"
	| "date"
	| "select"
	| "reference"
	| "multiReference"
	| "group"
	| "repeater"
	| "flexibleBlocks"
	| "blockReference"

export type Field = {
	name: string
	label: string
	type: FieldType
	required?: boolean
	helpText?: string
	options?: string[]
	referenceSchema?: string
	fields?: Field[]
	// For flexibleBlocks
	allowedBlocks?: string[]
	maxBlocks?: number
	// For blockReference
	blockId?: string
	// For shortText slug configuration
	isSlug?: boolean
	slugSource?: string
	// Localization
	translatable?: boolean
}

export type Locale = {
	code: string
	name: string
	isDefault: boolean
}

export type LocalizationSettings = {
	enabled: boolean
	locales: Locale[]
	defaultLocale: string
}
