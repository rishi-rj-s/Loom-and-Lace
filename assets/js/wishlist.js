document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to wishlist buttons
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const productId = button.dataset.productId;
            toggleWishlist(productId);
        });
    });
});

function toggleWishlist(productId) {
    fetch(`/wishlist/${productId}`, {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        // Update heart icon based on response
        const heartIcon = document.querySelector(`.wishlist-btn[data-product-id="${productId}"] i`);
        if (data.isInWishlist) {
            heartIcon.classList.add('fa-solid');
            heartIcon.classList.remove('fa-regular');
        } else {
            heartIcon.classList.remove('fa-solid');
            heartIcon.classList.add('fa-regular');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
