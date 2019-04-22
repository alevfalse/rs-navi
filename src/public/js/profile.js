// TODO: Form validation

function enable(button, id) {
    const input = document.getElementById(id);
    if (input.hasAttribute('disabled')) {
        input.removeAttribute('disabled');
        input.focus();
        button.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        input.setAttribute('disabled', '');
        input.value = '';
        button.innerHTML = '<i class="far fa-edit"></i>';
    }
    
    button.setAttribute('disabled', '');
    setTimeout(() => button.removeAttribute('disabled'), 500);
}

$("#edit-password").click(function() {
    
    const $button = $(this); // jquery element
    const newPassword = document.getElementById('np');
    const confirmPassword = document.getElementById('cp');

    // edit is pressed
    if (newPassword.hasAttribute('disabled')) {
        newPassword.removeAttribute('disabled');     // remove the disabled attribute of new password
        confirmPassword.removeAttribute('disabled'); // input field and confirm password input field
        newPassword.focus();     
        $button.html('<i class="fas fa-times"></i>');

    // cancel is pressed
    } else {
        newPassword.setAttribute('disabled', '');     // disable the new password input field
        confirmPassword.setAttribute('disabled', ''); // and confirm password input field
        newPassword.value = '';     
        confirmPassword.value = ''; // clear the value of new and confirm password
        $button.html('<i class="far fa-edit"></i>');

        if ($("#cp-div").hasClass('show')) { // hide the confirm password if it is visible
            $("#cp-div").collapse("toggle"); // and cancel button is pressed on new password
        }
    }

    $button.attr('disabled', '');
    setTimeout(() => $button.removeAttr('disabled'), 500);
});

// whenever the new password's value is changed
$("#np").change(function() {
    if ($(this).val()) {
        if (!$("#cp-div").hasClass('show')) { // show the confirm password if it is hidden and
            $("#cp-div").collapse("toggle");  // and new password has a value
        }
    } else {
        $("#cp").val('');
        if ($("#cp-div").hasClass('show')) { // hide the confirm password if it is visible
            $("#cp-div").collapse("toggle"); // and new password becomes empty
        }
    }
})

$(document).ready(() => {
    $("main").animate({ opacity: 1 }, 1000) // fade-in
});


$(function() {
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
