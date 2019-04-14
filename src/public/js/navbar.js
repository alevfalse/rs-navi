window.onscroll = function() {
    const navbar = document.getElementById('mainNavbar')
    const scrollTop = document.documentElement ? document.documentElement.scrollTop : document.body.scrollTop;

    if (scrollTop > navbar.clientHeight) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}
