
(function ($) {
    "use strict";


    /*==================================================================
    [ Focus Contact2 ]*/
    $('.input2').each(function () {
        $(this).on('blur', function () {
            if ($(this).val().trim() != "") {
                $(this).addClass('has-val');
            }
            else {
                $(this).removeClass('has-val');
            }
        })
    })



    /*==================================================================
    [ Validate ]*/
    var email = $('.validate-input input[name="email"]');
    var min = $('.validate-input input[name="min"]');
    var max = $('.validate-input input[name="max"]');


    // $('.validate-form').on('submit', function () {
    //     var check = true;
    //     var minCheck = $(min).val() == '' || $(min).val() == undefined;
    //     var maxCheck = $(max).val() == '' || $(max).val() == undefined;

    //     if (minCheck && maxCheck) {
    //         showValidate(min);
    //         check = false;
    //     }

    //     if (!minCheck && !maxCheck) {
    //         if (Number($(min).val()) > Number($(max).val())) {
    //             showValidate(max);
    //             check = false;
    //         }
    //     }

    //     if ($(email).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
    //         showValidate(email);
    //         check = false;
    //     }
    //     return check;
    // });


    $('.validate-form .input2').each(function () {
        $(this).focus(function () {
            hideValidate(this);
        });
    });

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }

    $('a').on('click', function () {
        $('.wrap, a').toggleClass('active');
        $('.wrap-contact2').toggle();
        return false;
    });

    $('#TARGET').click(function (event) {
        event.stopPropagation();
    });

    $('body').click(function (evt) {
        if ($('.wrap').hasClass('active')) {
            $('.wrap, a').toggleClass('active');
            $('.wrap-contact2').toggle();
        }
    });

    $('.contact2-form-btn').on('click', function () {

        var minCheck = $(min).val() == '' || $(min).val() == undefined;
        var maxCheck = $(max).val() == '' || $(max).val() == undefined;

        if ($(email).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
            showValidate(email);
            return false;
        }

        if (minCheck && maxCheck) {
            showValidate(min);
            return false;
        }

        if (Number($(min).val()) < 0 || Number($(max).val()) < 0) {
            new Noty({
                type: 'error',
                text: 'Numbers must be greater than zero',
                timeout: 2500,
                progressBar: true
            }).show();
            return false;
        }

        if (!minCheck && !maxCheck) {
            if (Number($(min).val()) > Number($(max).val())) {
                showValidate(max);
                return false;
            }
        }

        var data = JSON.stringify({ "email": email.val(), "min": min.val(), "max": max.val() });
        $.ajax({
            type: "POST",
            url: "/",
            data: data,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) { alert(data); },
            failure: function (errMsg) {
                alert(errMsg);
            }
        });
        new Noty({
            type: 'success',
            text: 'You have been subscribed successfully',
            timeout: 2500,
            progressBar: true
        }).show();
        return false; //Avoiding an extra form submission from the HTML
    });




})(jQuery);
