const blogPosts = [
    {
        title: "My First Blog Post",
        date: "2023-05-01",
        slug: "my-first-blog-post"
    },
    // Add more blog posts here as you write them
];

function displayBlogPosts() {
    const blogList = document.getElementById('blog-list');
    blogPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300';
        postElement.innerHTML = `
            <h3 class="text-2xl font-semibold mb-2">${post.title}</h3>
            <p class="text-gray-600 mb-4">${post.date}</p>
            <a href="post.html?slug=${post.slug}" class="text-blue-600 hover:text-blue-800 transition duration-300">Read more</a>
        `;
        blogList.appendChild(postElement);
    });
}

document.addEventListener('DOMContentLoaded', displayBlogPosts);