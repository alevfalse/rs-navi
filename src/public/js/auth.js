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

    switchToLoginButton.attr('disabled', 'disabled');
    switchToSignupButton.attr('disabled', 'disabled');

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
        }, 250)
    }, 400)
});

$("#switchToSignupButton").click(function() {

    const switchRoleButton = $("#switchRoleButton");
    const switchRoleNav = $("#switchRoleNav");
    const loginRole = $("#loginRole");
    const switchToLoginButton = $("#switchToLoginButton");

    switchToLoginButton.attr('disabled', 'disabled');

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

        setTimeout(() => switchToLoginButton.removeAttr('disabled'), 250);
    }, 400)
});

$("#switchToLoginButton").click(function() {

    const switchRoleButton = $("#switchRoleButton");
    const switchRoleNav = $("#switchRoleNav");
    const loginRole = $("#loginRole");
    const switchToSignupButton = $("#switchToSignupButton");

    switchToSignupButton.attr('disabled', 'disabled');

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
        setTimeout(() => switchToSignupButton.removeAttr('disabled'), 250);
    }, 400)
});

function swap() {
    $("#login").collapse("toggle");
    $("#signup").collapse("toggle");
}