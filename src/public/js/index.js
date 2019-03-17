$("main").animate({ opacity: 1 }, 700)

$('form').attr('autocomplete', 'off');

$('#searchField').autocomplete({
    serviceUrl: '/autocomplete/schools'
});