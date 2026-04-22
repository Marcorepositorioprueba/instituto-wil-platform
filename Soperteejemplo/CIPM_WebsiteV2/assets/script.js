document.addEventListener('DOMContentLoaded', function () {
    const swiper = new Swiper('.hero-carousel', {
        loop: true,
        effect: 'fade', // Use fade effect for smooth background transition
        fadeEffect: {
            crossFade: true
        },
        autoplay: {
            delay: 4000, // 4 seconds for a calmer effect
            disableOnInteraction: false,
        },
        // No pagination or navigation needed for background
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav'); // Changed from .page-nav to .main-nav

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }
});