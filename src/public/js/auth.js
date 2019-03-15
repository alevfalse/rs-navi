$("main").animate({ opacity: 1 }, 1000)

$("#switchRoleButton").click(function() {

    const switchRoleButton = $("#switchRoleButton");
    const switchRoleNav = $("#switchRoleNav");

    const login = $("#login");
    
    const loginRole = $("#loginRole");
    const loginAsStudentTitle = $("#loginAsStudentTitle");
    const loginAsPlaceownerTitle = $("#loginAsPlaceownerTitle");

    const studentSignupForm = $("#studentSignup");
    const placeownerSignupForm = $("#placeownerSignup");

    const switchToLoginButton = $("#switchToLoginButton");
    const switchToSignupButton = $("#switchToSignupButton");
    const forgotPasswordButton = $("#forgotPasswordButton");

    switchToLoginButton.attr('disabled', 'disabled');
    switchToSignupButton.attr('disabled', 'disabled');
    forgotPasswordButton.attr('disabled', 'disabled');
    
    loginAsStudentTitle.collapse("toggle");
    loginAsPlaceownerTitle.collapse("toggle");

    studentSignupForm.collapse("toggle");
    placeownerSignupForm.collapse("toggle");

    switchRoleNav.collapse("toggle");

    setTimeout(() => {
        switchRoleButton.text(`${login.hasClass('show') ? 'Login' : 'Signup'} as ${loginRole.val()}`);
        
        if (loginRole.val() === 'student') {
            loginRole.val('placeowner');
        } else if (loginRole.val() === 'placeowner') {
            loginRole.val('student');
        } 
        switchRoleNav.collapse("toggle");
        setTimeout(() => {
            switchToLoginButton.removeAttr('disabled');
            switchToSignupButton.removeAttr('disabled');
            forgotPasswordButton.removeAttr('disabled');
        }, 300)
    }, 500)
});

$("#switchToSignupButton").click(function() {

    const switchRoleButton = $("#switchRoleButton");
    const switchRoleNav = $("#switchRoleNav");
    const loginRole = $("#loginRole");

    const switchToLoginButton = $("#switchToLoginButton");
    const forgotPasswordButton = $("#forgotPasswordButton");

    switchToLoginButton.attr('disabled', 'disabled');
    forgotPasswordButton.attr('disabled', 'disabled');

    swap();

    switchRoleNav.collapse("toggle");

    // wait for the initial collapse animation to end before bringing it back up
    setTimeout(() => {
        if (loginRole.val() === 'student') {
            switchRoleButton.text('Signup as Placeowner');
        } else {
            switchRoleButton.text('Signup as Student');
        }
        switchRoleNav.collapse("toggle")

        $("#forgot").removeClass("show");
        setTimeout(() => {
            switchToLoginButton.removeAttr('disabled');
            forgotPasswordButton.removeAttr('disabled');
        }, 300);
    }, 500)
});

$("#switchToLoginButton").click(function() {

    const switchRoleButton = $("#switchRoleButton");
    const switchRoleNav = $("#switchRoleNav");
    const loginRole = $("#loginRole");
    
    const switchToSignupButton = $("#switchToSignupButton");
    const forgotPasswordButton = $("#forgotPasswordButton");
    
    switchToSignupButton.attr('disabled', 'disabled');
    forgotPasswordButton.attr('disabled', 'disabled');

    swap();

    switchRoleNav.collapse("toggle");

    // wait for the initial collapse animation to end before bringing it back up
    setTimeout(() => {
        if (loginRole.val() === 'student') {
            switchRoleButton.text('Login as Placeowner');
        } else {
            switchRoleButton.text('Login as Student');
        }
        switchRoleNav.collapse("toggle")
        setTimeout(() => {
            switchToSignupButton.removeAttr('disabled');
            forgotPasswordButton.removeAttr('disabled');
        }, 300);
    }, 500)
});

function swap() {
    $("#login").collapse("toggle");
    $("#signup").collapse("toggle");
}


$("#forgotPasswordButton").click(function() {
    if ($("#forgot").hasClass("show")) {
        $(this).animate({ 'font-size': '1rem' }, 300);
    } else {
        $(this).animate({ 'font-size': '2rem' }, 300);
    }
    
    $("#forgot").collapse("toggle");
    $("#loginInner").collapse("toggle");
    $("#switchRoleNav").collapse("toggle");
})

$("#signupEmail1").change(function() {

    const email = $(this).val();

    if (email.length == 0 || !email.includes('@')) {
        $("#validitySpan1").addClass('d-none');
        return;
    }

    const span = $("#validitySpan1");
    const icon = $("#validityIcon1");

    span.removeClass('d-none');

    $.ajax({
        url: '/validate/email',
        data: { email: $(this).val() },
        success: function(valid) {
            if (valid) {
                span.removeClass('bg-danger').addClass('bg-primary');
                icon.removeClass('fa-times').addClass('fa-check');

            } else {
                span.removeClass('bg-primary').addClass('bg-danger');
                icon.removeClass('fa-check').addClass('fa-times');
            }
        }
    })
})

$("#signupEmail2").change(function() {

    const email = $(this).val();

    if (email.length == 0 || !email.includes('@')) {
        $("#validitySpan2").addClass('d-none');
        return;
    }

    const span = $("#validitySpan2");
    const icon = $("#validityIcon2");

    span.removeClass('d-none');

    $.ajax({
        url: '/validate/email',
        data: { email: $(this).val() },
        success: function(valid) {
            if (valid) {
                span.removeClass('bg-danger').addClass('bg-primary');
                icon.removeClass('fa-times').addClass('fa-check');

            } else {
                span.removeClass('bg-primary').addClass('bg-danger');
                icon.removeClass('fa-check').addClass('fa-times');
            }
        }
    })
})