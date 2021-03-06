$(document).ready(() => {
    $("main").animate({ opacity: 1 }, 1000) // fade-in

    // fade out flash messages after 15 seconds
    setTimeout(() => {
        $('.alert').animate({ 'opacity': 0 }, 1000);

        setTimeout(() => {
            $('.alert').css('display', 'none');
        }, 1000);
    }, 15000);
});

// TODO: Form validation

function enable(button, id) {
    const input = document.getElementById(id);
    if (input.hasAttribute('disabled')) {
        input.removeAttribute('disabled');
        input.focus();
        button.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        input.setAttribute('disabled', '');
        if (id !== 'license') input.value = '';
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

        // clear the value of new and confirm password
        newPassword.value = '';     
        confirmPassword.value = ''; 

        $button.html('<i class="far fa-edit"></i>'); // change button icon to edit

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

$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})

$("#edit").click(function() {
    $("#profile").hasClass("show") ? $(this).text("Cancel") : $(this).html('<i class="fas fa-user-edit"></i> Update Profile')
    $("#profile").collapse("toggle");
    $("#update").collapse("toggle");
});

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
