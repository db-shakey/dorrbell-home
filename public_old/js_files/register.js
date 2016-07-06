$(document).ready(function() {

    var getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var contactId = getUrlParameter('id');

    $.ajax({
        type: "GET",
        url: "https://shrouded-hollows-1707.herokuapp.com/api/contact/" + contactId,
        beforeSend: function(xhr) {
            xhr.setRequestHeader('authorization', 'Basic Z14vbjcyayxOdUpnM0pfXw==');
            xhr.setRequestHeader('Content-Type', 'application/json');
        },
        success: function(res) {
            $("#email").val(res.Email);
        },
        error: function(xhr, ajaxOptions, thrownError) {
            $('#invalid-modal').modal("show")
        }
    });


    $("#register-form").validate({
        submitHandler: function(form) {
            var formData = $('#register-form').serializeObject();
            var currentDate = new Date().toISOString();
            formData.Id = contactId;
            formData.Birthdate = $('#data_1 .input-group.date').datepicker('getDate').toISOString();
            if (currentDate < formData.Birthdate) {
                console.log("invalid date");
            } else if (formData.Password__c != formData.confirmPassword || formData.Password__c.length < 6) {
                $('#password-modal').modal("show")
            } else {
                delete formData.confirmPassword;

                $.ajax({
                    type: "POST",
                    url: "https://shrouded-hollows-1707.herokuapp.com/api/registershopify/" + contactId,
                    data: JSON.stringify(formData),
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('authorization', 'Basic Z14vbjcyayxOdUpnM0pfXw==');
                        xhr.setRequestHeader('Content-Type', 'application/json');
                    },
                    success: function(res) {
                        console.log(res);
                        console.log('bonus');
                        $('#success-modal').modal("show");
                    },
                    error: function(xhr, ajaxOptions, thrownError) {
                        console.log('an error occurred');
                    }
                });
            }
        }
    })

    $('.i-checks').iCheck({
        checkboxClass: 'icheckbox_square-green',
        radioClass: 'iradio_square-green',
    });
    $('#data_1 .input-group.date').datepicker({
        startView: 2,
        todayBtn: "linked",
        keyboardNavigation: false,
        forceParse: false,
        autoclose: true
    });
});
