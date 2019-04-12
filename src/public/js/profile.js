$(document).ready(() => {
    $("main").animate({ opacity: 1 }, 1000) // fade-in
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

$("#edit, #back").click(function() {
    $("#profile").collapse("toggle");
    $("#update").collapse("toggle");
})

$("#subscription, #back2").click(function() {
    $("#profile").collapse("toggle");
    $("#sub-details").collapse("toggle");
})

$("#profile-image-input").change(function(event) {
    const file = event.target.files[0];

    if (!file) { return; }
    
    const reader = new FileReader();

    reader.onload = function(e) {
        document.getElementById('thumbnail').setAttribute('src', e.target.result);
        $("#update-image-button").css('display', 'inline');
    }

    reader.readAsDataURL(file);
});
