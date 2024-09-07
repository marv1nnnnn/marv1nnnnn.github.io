const md = window.markdownit();

async function loadBlogPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        document.getElementById('blog-post').innerHTML = '<p>Blog post not found.</p>';
        return;
    }

    try {
        const response = await fetch(`posts/${slug}.md`);
        if (!response.ok) throw new Error('Blog post not found');
        const markdown = await response.text();
        const html = md.render(markdown);
        document.getElementById('blog-post').innerHTML = html;
        document.title = `${slug.replace(/-/g, ' ')} - Marvin's Blog`;
    } catch (error) {
        console.error('Error loading blog post:', error);
        document.getElementById('blog-post').innerHTML = '<p>Error loading blog post.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadBlogPost);