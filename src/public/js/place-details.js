$(document).ready(function() {
    $("main").animate({ opacity: 1 }, 1000) // fade-in

    // fade out flash messages after 15 seconds
    setTimeout(() => {
        $('.alert').animate({ 'opacity': 0 }, 1000);

        setTimeout(() => {
            $('.alert').css('display', 'none');
        }, 1000);
    }, 15000);
});

$("#report-form").submit(function(event) {
    if ($("#report-comment").val().length > 500) {
        event.preventDefault();
        event.stopPropagation();

        alert('Report commment exceeded maximum characters.');
        return $("#report-comment").focus();
    }
});

$("#report-comment").keyup(function() {

    const input = $(this);
    const feedback = input.next();
    const length = $(this).val().length;
    const left = 500 - length;

    if (left < 0) {
        input.addClass('is-invalid');
        feedback.addClass('invalid-feedback');
    } else {
        input.removeClass('is-invalid');
        feedback.removeClass('invalid-feedback');
    }

    feedback.text(`${left} characters left`);
});

$("#view-map-button").click(function() {
    if (!$("#images").hasClass("show")) {
        $(this).html('<i class="fas fa-map-marker-alt"></i> View Map')
    } else {
        $(this).html('<i class="fas fa-times"></i> Hide Map')
    }

    $("#images").collapse("toggle");
    $("#map-section").collapse("toggle");

    $('html, body').animate({ scrollTop: 0 }, 1000);
});