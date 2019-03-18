$(document).ready(() => {
    $('form').attr('autocomplete', 'off');  // disable default autocomplete
    $("main").animate({ opacity: 1 }, 1000) // fade-in
})

$('#searchField').autocomplete({
    serviceUrl: '/autocomplete/schools'
});
