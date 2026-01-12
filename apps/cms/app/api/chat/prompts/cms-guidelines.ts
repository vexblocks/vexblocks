/**
 * CMS-specific guidelines for the AI agent
 */
export function getCmsGuidelines(): string {
	return `## Your Capabilities

You have access to tools that allow you to:

### Schema Management
1. **listSchemas** - List all CMS schemas in the database
2. **getSchema** - Get details of a specific schema by ID
3. **createSchema** - Create new content schemas with fields
4. **updateSchema** - Modify existing schemas (requires double confirmation)
5. **getSchemaStats** - Get statistics about a schema (content count, last updated)

### Content Management
6. **listContent** - View existing content entries for a schema
7. **getContent** - Get a specific content entry by ID
8. **createContent** - Add new content entries to schemas
9. **updateContent** - Modify existing content entries
10. **validateContent** - Validate content data against schema fields before creating/updating
11. **searchContent** - Search for content across schemas
12. **previewChanges** - Preview what changes will be made before applying them

## Schema Types

- **global**: Singleton content (e.g., site settings, header, footer). Only one published entry allowed.
- **page**: Individual pages with unique slugs (e.g., about page, contact page).
- **collection**: Multiple items with unique slugs (e.g., blog posts, products).

## Field Types

**IMPORTANT: Use these EXACT field type names when creating schemas:**

- \`shortText\` - Single line text (for titles, names, etc.)
- \`longText\` - Multi-line text (for descriptions, summaries)
- \`richText\` - Rich text editor with HTML formatting
- \`number\` - Numeric values
- \`boolean\` - True/false toggle
- \`date\` - Date picker
- \`media\` - Image/file upload (Convex storage)
- \`url\` - URL field
- \`youtubeUrl\` - YouTube video URL
- \`select\` - Dropdown selection (requires \`options\` array)
- \`reference\` - Reference to another content entry (requires \`referenceSchema\`)
- \`multiReference\` - Multiple references (e.g., tags, categories)
- \`group\` - Nested group of fields (requires nested \`fields\` array)
- \`repeater\` - Repeatable group of fields (requires nested \`fields\` array)
- \`flexibleBlocks\` - Dynamic content blocks
- \`blockReference\` - Reference to a reusable block

## Field Definition Structure

Each field must have:
- \`name\`: Field identifier in snake_case (e.g., "title", "due_date")
- \`label\`: Display name (e.g., "Title", "Due Date")
- \`type\`: One of the types above (EXACT spelling required)
- \`required\`: Boolean (true/false)

Example field:
\`\`\`json
{
  "name": "title",
  "label": "Title",
  "type": "shortText",
  "required": true
}
\`\`\`

## Best Practices

1. **Always check existing data first** - Use list/get tools before creating/updating
2. **Validate field types** - Ensure content data matches schema field types
3. **Use descriptive names** - Schema names in snake_case, display names in Title Case
4. **Handle localization** - Some fields may be translatable with locale structure
5. **Respect content status** - Draft vs Published affects visibility

## CRITICAL: Content Creation Workflow

**BEFORE creating any content, you MUST:**

1. **Get the schema details first** - Use \`getSchema\` with the schema ID to get the full field structure
2. **Understand all required fields** - Check which fields are marked as \`required: true\`
3. **Match field types correctly** - Use appropriate data types for each field:
   - \`shortText\`, \`longText\`, \`richText\` → string values
   - \`number\` → numeric values
   - \`boolean\` → true/false
   - \`date\` → ISO date string (e.g., "2024-01-15")
   - \`media\` → Convex storage ID or null
   - \`select\` → one of the defined options
   - \`reference\` → content ID from referenced schema

**For mock/sample data requests:**
- You CAN and SHOULD generate realistic mock data based on the schema structure
- Use the schema's field names and types to create appropriate sample values
- Generate unique slugs for each content entry (e.g., "todo-1", "todo-2")
- Set status to "draft" unless user specifies "published"

**Example workflow for "add 10 todos":**
1. Call \`getSchema\` with the todos schema ID to get field structure
2. For each record, generate appropriate data matching field types
3. Call \`createContent\` for each record with the generated data`
}
