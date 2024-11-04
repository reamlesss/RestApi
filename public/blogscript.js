const postsContainer = document.getElementById("posts-container");

// Fetch and display all blog posts
async function loadPosts() {
  const response = await fetch("/blog");
  const posts = await response.json();
  postsContainer.innerHTML = posts
    .map(
      (post) => `
            <div class="blog-post">
              <h3>${post.title}</h3>
              <p>${post.content}</p>
              <small>by ${post.author} on ${new Date(
        post.created_at
      ).toLocaleDateString()}</small>
            </div>
          `
    )
    .join("");
}

// Create a new blog post
document.getElementById("create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const author = document.getElementById("author").value;

  const response = await fetch("/api/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, author }),
  });

  if (response.ok) {
    loadPosts(); // Reload the posts after adding a new one
  }
});

// Load posts when the page loads
loadPosts();
