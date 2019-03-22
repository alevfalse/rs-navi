$(document).ready(function() {
    $('form').attr('autocomplete', 'off');  // disable default autocomplete
    $("main").animate({ opacity: 1 }, 1000) // fade-in
})

// ==============================================================================
// Realtime Form Validations ====================================================
$("form").on('submit', function(event) {
    console.log($(this).find(".is-invalid").length)

    // prevent form submit if a field contains an invalid value
    if ($(this).find(".is-invalid").length > 0) {
        event.preventDefault();
        event.stopPropagation();
        
        let fields = [];
        $(this).find(".is-invalid").each(function(i, elem) {
            fields.push(elem.getAttribute('placeholder') || elem.getAttribute('name'));
        })
        alert($(this).find(".is-invalid").length + ' Invalid Field(s):\n' + fields.join(', '));
    }
})

$("#signupPassword, #confirmSignupPassword").keyup(function() {

    const password = $("#signupPassword");
    const confirm = $("#confirmSignupPassword");

    if (confirm.val() !== password.val()) {
        password.removeClass('is-valid').addClass('is-invalid');
        confirm.removeClass('is-valid').addClass('is-invalid')
        confirm.next().addClass('invalid-feedback').text('Passwords do not match');
    } else {
        password.removeClass('is-invalid').addClass('is-valid')
        confirm.removeClass('is-invalid').addClass('is-valid')
        confirm.next().addClass('valid-feedback').text('');
    }
})

$("input[type='text']").keyup(function() {
            
    const input = $(this);
    const name = input.val();
    const res = input.next();
    
    if (name.startsWith(' ')) {
        res.text('Must not start with space')
    } else if (name.match(/[^a-zA-Zñ\s]|\s{2,}/)) {
        res.text('Contains invalid character')
    } else if (name.length == 0) {
        res.text('Cannot be empty');
    } else if (name.length > 50) {
        res.text('Too long');
    }  else {
        $(this).removeClass('is-invalid').addClass('is-valid');
        $(this).next().removeClass('invalid-feedback').addClass('valid-feedback').text('');
        return; // return as a valid name
    }
    
    // will only execute if at least one of the invalid conditions above are met
    $(this).removeClass('is-valid').addClass('is-invalid');
    $(this).next().removeClass('valid-feedback').addClass('invalid-feedback')
})

const validateEmailFunction = function(email, role, input, res) {
    $.ajax({
        url: '/validate/email',
        data: { 
            email: email,
            role: role
         },
        success: function(valid) {
            console.log(valid);
            valid = valid;
            console.log(input.attr('id'));
            if (valid) {
                if (input.attr('id') == "forgotPasswordEmail") {
                    input.removeClass('is-valid').addClass('is-invalid');
                    res.removeClass('valid-feedback').addClass('invalid-feedback').text('Email does not exist')
                } else {
                    input.removeClass('is-invalid').addClass('is-valid');
                    res.removeClass('invalid-feedback').addClass('valid-feedback').text('');
                }
            } else {
                if (input.attr('id') == "forgotPasswordEmail") {
                    input.removeClass('is-invalid').addClass('is-valid');
                } else {
                    input.removeClass('is-valid').addClass('is-invalid');
                    res.removeClass('valid-feedback').addClass('invalid-feedback').text('Email address is already taken');
                }
            }
        }
    })
}

// client-side rate-limiting
const throttledValidateEmailFunction = _.throttle(validateEmailFunction, 1000);

$("input[type='email']:not('#loginEmail')").keyup(function() {

    const input = $(this);
    const email = input.val();
    const res = input.next();
    const role = $("#signupRoleInput").val();
    
    let valid = false;

    if (email.startsWith(' ')) {
        res.text('Must not start with space')
    } else if (email.match(/[^a-zA-Z0-9.@_]/)) {
        res.text('Contains invalid character')
    } else if (email.length == 0) {
        res.text('Cannot be empty');
    } else if (email.length > 50) {
        res.text('Too long');       // regex: if starts/ends with @ or period, 2 or more @, an @ is preceded by a period
    } else if (!email.includes('@') || email.match(/[@.]$|^[@.]|@[^@]*@|\.@/)) {
        res.text('Invalid email address')
    } else {
        valid = true;
        throttledValidateEmailFunction(email, role, input, res);
    }
    
    if (!valid) {
        // will only execute if at least one of the invalid conditions above are met
        $(this).removeClass('is-valid').addClass('is-invalid');
        $(this).next().removeClass('valid-feedback').addClass('invalid-feedback')
    }
})

// ==============================================================================
// Forms Swapping ===============================================================

function swapForms() {
    $("#login").collapse("toggle");
    $("#signup").collapse("toggle");
}

$("#switchRoleButton").click(function() {

    const switchRoleButton = $(this);
    const switchRoleNav = $("#switchRoleNav");

    const login = $("#login");
    const loginRole = $("#loginRoleInput");
    const loginRoleTitle = $("#loginRoleTitle");

    const signupRole = $("#signupRoleInput");
    const signupRoleTitle = $("#signupRoleTitle");

    const switchToLoginButton = $("#switchToLoginButton");
    const switchToSignupButton = $("#switchToSignupButton");
    const forgotPasswordButton = $("#forgotPasswordButton");

    const schoolNameInput = $("#schoolNameInput");

    switchRoleButton.attr('disabled', 'disabled');
    switchToLoginButton.attr('disabled', 'disabled');
    switchToSignupButton.attr('disabled', 'disabled');
    forgotPasswordButton.attr('disabled', 'disabled');

    loginRoleTitle.collapse("toggle");
    signupRoleTitle.collapse("toggle");
    switchRoleNav.collapse("toggle");

    setTimeout(() => {

        loginRoleTitle.text(`Login as ${loginRole.val() === 'student' ? 'placeowner' : 'student'}`);
        signupRoleTitle.text(`Signup as ${loginRole.val() === 'student' ? 'placeowner' : 'student'}`)
        switchRoleButton.text(`${login.hasClass('show') ? 'Login' : 'Signup'} as ${loginRole.val()}`);

        loginRole.val(loginRole.val() === 'student' ? 'placeowner' : 'student');
        signupRole.val(loginRole.val());

        if (signupRole.val() === 'student') {
            schoolNameInput.removeAttr('disabled').css('display', 'inline');
        } else {
            schoolNameInput.attr('disabled', 'disabled').css('display', 'none');
        }

        loginRoleTitle.collapse("toggle");
        signupRoleTitle.collapse("toggle");
        switchRoleNav.collapse("toggle");
        
        setTimeout(() => {
            switchRoleButton.removeAttr('disabled');
            switchToLoginButton.removeAttr('disabled');
            switchToSignupButton.removeAttr('disabled');
            forgotPasswordButton.removeAttr('disabled');
        }, 350)
    }, 500)
});

$("#switchToSignupButton, #switchToLoginButton").click(function() {

    const switchRoleButton = $("#switchRoleButton");
    const switchRoleNav = $("#switchRoleNav");

    const login = $("#login");
    const loginRole = $("#loginRoleInput");

    const switchToLoginButton = $("#switchToLoginButton");
    const switchToSignupButton = $("#switchToSignupButton");
    const forgotPasswordButton = $("#forgotPasswordButton");

    switchRoleButton.attr('disabled', 'disabled');
    switchToLoginButton.attr('disabled', 'disabled');
    switchToSignupButton.attr('disabled', 'disabled');
    forgotPasswordButton.attr('disabled', 'disabled');

    swapForms();

    switchRoleNav.collapse("toggle");

    // wait for the initial collapse animation to end before bringing it back up
    setTimeout(() => {

        switchRoleButton.text(`${login.hasClass('show') ? 'Login' : 'Signup'} as ${loginRole.val() === 'student' ? 'Placeowner' : 'Student'}`);
        switchRoleNav.collapse("toggle")

        setTimeout(() => {
            switchRoleButton.removeAttr('disabled');
            switchToLoginButton.removeAttr('disabled');
            switchToSignupButton.removeAttr('disabled');
            forgotPasswordButton.removeAttr('disabled');
        }, 350);
    }, 500)
});

$("#forgotPasswordButton").click(function() {
    if ($("#forgotPasswordForm").hasClass("show")) {
        $(this).animate({ 'font-size': '1rem' }, 300);
    } else {
        $(this).animate({ 'font-size': '2rem' }, 300);
    }
    
    $("#forgotPasswordForm").collapse("toggle");
    $("#loginForm").collapse("toggle");
    $("#switchRoleNav").collapse("toggle");
})