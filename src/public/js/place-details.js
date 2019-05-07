$(document).ready(() => {
    $("main").animate({ opacity: 1 }, 1000) // fade-in
});

$("#report-button, #cancel-report-button").click(function() {
    $("#report-form").collapse("toggle");
    $("#place-title").collapse("toggle");
});