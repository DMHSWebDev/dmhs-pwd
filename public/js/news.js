// News page: gets the posts from our server and draws them, newest first.
// Posts come from Sanity, so treat them like any outside data:
// everything goes in with textContent, never innerHTML.

const newsMessage = document.querySelector('#news-message');
const newsLoading = document.querySelector('#news-loading');
const postList = document.querySelector('#post-list');

function renderPost(post) {
    const article = document.createElement('article');

    // Not every post has an image
    if (post.imageUrl) {
        const frame = document.createElement('figure');
        frame.className = 'apod-frame';
        const img = document.createElement('img');
        img.src = post.imageUrl;
        img.alt = post.imageAlt;
        img.loading = 'lazy';
        frame.append(img);
        article.append(frame);
    }

    const date = document.createElement('time');
    date.className = 'chip';
    date.dateTime = post.publishedAt;
    date.textContent = new Date(post.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' });

    const title = document.createElement('h2');
    title.className = 'apod-title';
    title.textContent = post.title;

    const body = document.createElement('p');
    body.className = 'post-body';
    body.textContent = post.body;

    article.append(date, title, body);
    return article;
}

async function loadPosts() {
    newsMessage.textContent = '';

    try {
        const response = await fetch('/api/posts');
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            newsMessage.textContent = data.error || 'Could not load the news.';
            return;
        }

        if (data.length === 0) {
            newsMessage.className = 'loading';
            newsMessage.textContent = 'No news yet. Check back soon!';
            return;
        }

        postList.replaceChildren(...data.map(renderPost));
    } catch (err) {
        newsMessage.textContent = 'Could not reach the server. Check your connection.';
    } finally {
        newsLoading.hidden = true;
    }
}

loadPosts();
