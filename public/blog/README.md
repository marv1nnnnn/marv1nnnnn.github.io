# Blog Folder

This folder contains the blog posts and metadata for the blog reader application.

## Structure

- `blog-metadata.json` - Contains metadata for all blog posts
- `*.md` - Markdown files for individual blog posts

## Adding New Blog Posts

1. Create a new markdown file (e.g., `my-new-post.md`) in this folder
2. Write your blog post content in Markdown format
3. Update `blog-metadata.json` with the new post information:

```json
{
  "id": "4",
  "slug": "my-new-post",
  "title": "My New Post Title",
  "author": "Your Name",
  "date": "2025-06-16",
  "tags": ["tag1", "tag2", "category"],
  "filename": "my-new-post.md"
}
```

## Markdown Support

The blog reader supports standard Markdown syntax including:

- Headers (# ## ###)
- **Bold** and *italic* text
- `Code blocks`
- Lists (numbered and bulleted)
- Horizontal rules (---)

## Metadata Format

Each blog post entry in `blog-metadata.json` should include:

- `id` - Unique identifier (string)
- `slug` - URL-friendly version of the title
- `title` - Display title of the post
- `author` - Author name
- `date` - Publication date (YYYY-MM-DD format)
- `tags` - Array of tags/categories
- `filename` - Name of the markdown file

## File Naming Convention

- Use kebab-case for filenames (lowercase with hyphens)
- Use `.md` extension for all blog posts
- Keep filenames descriptive but concise

Example: `understanding-react-hooks.md` 