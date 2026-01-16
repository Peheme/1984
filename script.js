document.addEventListener('DOMContentLoaded', () => {
    const postInput = document.getElementById('post-input');
    const postBtn = document.getElementById('post-btn');
    const feed = document.getElementById('feed');
    const favoritesFeed = document.getElementById('favorites-feed');
    const favoritesSection = document.getElementById('favorites-section');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiOptions = document.querySelectorAll('.emoji-option');

    // Auto-resize textarea
    postInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        updatePostButton();
    });

    // Handle post submission
    postBtn.addEventListener('click', createPost);

    // Toggle Emoji Picker
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('hidden');
    });

    // Close picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.classList.add('hidden');
        }

        // Also close any open share menus
        document.querySelectorAll('.share-menu').forEach(menu => {
            if (!menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
            }
        });
    });

    // Add emoji to textarea
    emojiOptions.forEach(emoji => {
        emoji.addEventListener('click', () => {
            const cursorPosition = postInput.selectionStart;
            const text = postInput.value;
            const newText = text.slice(0, cursorPosition) + emoji.textContent + text.slice(cursorPosition);
            postInput.value = newText;
            postInput.focus();
            postInput.setSelectionRange(cursorPosition + emoji.textContent.length, cursorPosition + emoji.textContent.length);
            emojiPicker.classList.add('hidden');
            updatePostButton();
        });
    });

    function updatePostButton() {
        if (postInput.value.trim().length > 0) {
            postBtn.removeAttribute('disabled');
        } else {
            postBtn.setAttribute('disabled', 'true');
        }
    }

    // Initialize button state
    updatePostButton();

    function createPost() {
        const content = postInput.value.trim();
        if (!content) return;

        const postElement = document.createElement('div');
        postElement.className = 'post';
        // Unique ID for the post to handle state if needed
        const postId = Date.now();

        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString([], { day: 'numeric', month: 'short' });

        postElement.innerHTML = `
            <div class="post-header">
                <div class="avatar">👤</div>
                <div class="post-meta">
                    <span class="author-name">Moi</span>
                    <span class="post-time">${dateString} à ${timeString}</span>
                </div>
            </div>
            <div class="post-content">${escapeHtml(content)}</div>
            <div class="post-actions">
                <button class="action-btn favorite" onclick="toggleFavorite(${postId}, this)">
                    <span>⭐</span> Favori
                </button>
                <div style="position: relative;">
                    <button class="action-btn share" onclick="toggleShareMenu(event, this)">
                        <span>🔗</span> Partager
                    </button>
                    <div class="share-menu hidden">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="share-option">Facebook</a>
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}" target="_blank" class="share-option">Twitter</a>
                        <a href="https://wa.me/?text=${encodeURIComponent(content)}" target="_blank" class="share-option">WhatsApp</a>
                    </div>
                </div>
                <!-- Admin only delete button -->
                <button class="action-btn delete" onclick="deletePost(this)">
                    <span>🗑️</span> Supprimer
                </button>
            </div>
        `;

        feed.prepend(postElement);

        // Reset input
        postInput.value = '';
        postInput.style.height = 'auto';
        updatePostButton();
    }

    // Make functions global so they can be called from inline onclick
    window.deletePost = function (btn) {
        if (confirm("Voulez-vous vraiment supprimer ce post ?")) {
            const post = btn.closest('.post');
            post.remove();
            checkFavoritesEmpty();
        }
    };

    window.toggleFavorite = function (id, btn) {
        const post = btn.closest('.post');
        const isFavorite = btn.classList.toggle('active');

        if (isFavorite) {
            // Move to favorites
            btn.innerHTML = '<span>🌟</span> Retirer des favoris';
            favoritesFeed.prepend(post);
            favoritesSection.classList.remove('hidden');
        } else {
            // Move back to main feed
            btn.innerHTML = '<span>⭐</span> Favori';
            feed.prepend(post); // Moves it to top of feed basically (simplification)
            checkFavoritesEmpty();
        }
    };

    window.toggleShareMenu = function (e, btn) {
        e.stopPropagation();
        // Close other open menus
        document.querySelectorAll('.share-menu').forEach(menu => menu.classList.add('hidden'));

        const menu = btn.nextElementSibling;
        menu.classList.toggle('hidden');
    };

    function checkFavoritesEmpty() {
        if (favoritesFeed.children.length === 0) {
            favoritesSection.classList.add('hidden');
        }
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }
});
