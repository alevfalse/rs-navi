$("main").animate({
    opacity: 1
}, 1000) // fade-in

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

$("#edit, #back").click(function () {
    $("#profile").collapse("toggle");
    $("#update").collapse("toggle");
})

$("#subscription, #back2").click(function () {
    $("#profile").collapse("toggle");
    $("#sub-details").collapse("toggle");
})