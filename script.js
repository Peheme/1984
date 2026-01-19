document.addEventListener('DOMContentLoaded', () => {
    const postInput = document.getElementById('post-input');
    const postBtn = document.getElementById('post-btn');
    const feed = document.getElementById('feed');
    const favoritesFeed = document.getElementById('favorites-feed');
    const favoritesSection = document.getElementById('favorites-section');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiOptions = document.querySelectorAll('.emoji-option');
    const historyList = document.getElementById('history-list');

    let currentFilter = 'all'; // 'all' or 'YYYY-MM'

    // Auto-resize textarea
    postInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        updatePostButton();
    });

    // Handle Enter to submit (Shift+Enter for newline)
    postInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createPost();
        }
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

        // Store raw date for filtering
        // Format YYYY-MM
        const monthKey = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear(); // e.g., "Janvier 2024"
        const filterKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // e.g., "2024-01"

        postElement.dataset.date = filterKey;

        postElement.innerHTML = `
            <div class="post-header">
                <div class="avatar">👤</div>
                <div class="post-meta">
                    <span class="author-name">Pierre-Marie</span>
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

        // Update history sidebar
        updateHistory(filterKey, monthKey);

        // Apply current filter (if we are viewing 'all' or this specific month, show it. Else hide it?)
        // Actually, if we prepend, we just need to re-verify visibility.
        if (currentFilter !== 'all' && currentFilter !== filterKey) {
            postElement.style.display = 'none';
        }

        // Reset input
        postInput.value = '';
        postInput.style.height = 'auto';
        updatePostButton();
    }

    // History Sidebar Logic
    const historyMap = new Set();

    function updateHistory(filterKey, displayString) {
        if (!historyMap.has(filterKey)) {
            historyMap.add(filterKey);

            // Allow duplicates in UI? No, check if exists.
            // In a real app we'd sort these.

            const existingItem = document.querySelector(`.history-item[data-date="${filterKey}"]`);
            if (!existingItem) {
                const li = document.createElement('li');
                li.className = 'history-item';
                li.dataset.date = filterKey;
                // Capitalize first letter
                li.textContent = displayString.charAt(0).toUpperCase() + displayString.slice(1);

                li.addEventListener('click', () => filterPosts(filterKey, li));

                historyList.appendChild(li); // append keeps "All" at top usually
            }
        }
    }

    // Default "All" click handler
    document.querySelector('.history-item[data-date="all"]').addEventListener('click', function () {
        filterPosts('all', this);
    });

    function filterPosts(key, clickedItem) {
        currentFilter = key;

        // Update active class
        document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');

        // Update feed visibility
        const posts = document.querySelectorAll('.post');
        posts.forEach(post => {
            if (key === 'all' || post.dataset.date === key) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        });
    }

    // Make functions global so they can be called from inline onclick
    window.deletePost = function (btn) {
        if (confirm("Voulez-vous vraiment supprimer ce post ?")) {
            const post = btn.closest('.post');
            post.remove();
            checkFavoritesEmpty();
            // In a real app, we might check if we need to remove a history item, 
            // but for now we keep it simple (it remains even if empty).
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
