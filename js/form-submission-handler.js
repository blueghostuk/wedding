"use strict";
(function () {
    // get all data in form and return object
    function getFormData(form) {
        var elements = form.elements;
        var honeypot;
        var fields = Object.keys(elements).filter(function (k) {
            if (elements[k].name === "honeypot") {
                honeypot = elements[k].value;
                return false;
            }
            return true;
        }).map(function (k) {
            if (elements[k].name !== undefined) {
                return elements[k].name;
                // special case for Edge's html collection
            }
            else if (elements[k].length > 0) {
                return elements[k].item(0).name;
            }
        }).filter(function (item, pos, self) {
            return self.indexOf(item) == pos && item;
        });
        var formData = {};
        fields.forEach(function (name) {
            var element = elements[name];
            // singular form elements just have one value
            formData[name] = element.value;
            // when our element has multiple items, get their values
            if (element.length) {
                var data = [];
                for (var i = 0; i < element.length; i++) {
                    var item = element.item(i);
                    if (item.checked || item.selected) {
                        data.push(item.value);
                    }
                }
                formData[name] = data.join(', ');
            }
        });
        // add form-specific values into the data
        formData.formDataNameOrder = JSON.stringify(fields);
        formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
        formData.formGoogleSend = form.dataset.email || ""; // no email by default
        return { data: formData, honeypot: honeypot };
    }
    function handleFormSubmit(event) {
        event.preventDefault(); // we are submitting via xhr below
        var form = event.target;
        var thankYouMessage = form.querySelector(".alert");
        if (thankYouMessage) {
            thankYouMessage.style.display = "none";
        }
        disableAllButtons(form, true, "Submitting");
        var formData = getFormData(form);
        var data = formData.data;
        // If a honeypot field is filled, assume it was done so by a spam bot.
        if (formData.honeypot) {
            return false;
        }
        var url = form.action;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        // xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                disableAllButtons(form, false, "Submit");
                if (xhr.status === 200) {
                    form.reset();
                    var formElements = form.querySelectorAll(".form-group");
                    if (formElements && formElements.length > 0) {
                        formElements.forEach(function (e) { return e.style.display = "none"; }); // hide form controls
                    }
                    if (thankYouMessage) {
                        thankYouMessage.classList.toggle("alert-success", true);
                        thankYouMessage.classList.toggle("alert-danger", false);
                        thankYouMessage.innerHTML = "<h2>Thanks for your RSVP.</h2>";
                        thankYouMessage.style.display = "block";
                    }
                }
                else {
                    if (thankYouMessage) {
                        thankYouMessage.classList.toggle("alert-success", false);
                        thankYouMessage.classList.toggle("alert-danger", true);
                        thankYouMessage.innerHTML = "<h2>Sorry there was a problem sending your RSVP, please try again.</h2>";
                        thankYouMessage.style.display = "block";
                    }
                }
            }
        };
        // url encode form data for sending as post data
        var encoded = Object.keys(data).map(function (k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }).join('&');
        xhr.send(encoded);
    }
    function loaded() {
        // bind to the submit event of our form
        var forms = document.querySelectorAll("form.gform");
        for (var i = 0; i < forms.length; i++) {
            forms[i].addEventListener("submit", handleFormSubmit, false);
        }
        // address is required if can attend
        var address = document.getElementById("address");
        var addressLabel = document.querySelector("label[for='address']");
        var attendOptions = document.querySelectorAll("input[name='attend']");
        attendOptions.forEach(function (attendInput) {
            attendInput.addEventListener("change", function () {
                var required = attendInput.value === "yes" && attendInput.checked;
                address === null || address === void 0 ? void 0 : address.toggleAttribute("required", required);
                if (addressLabel) {
                    if (required) {
                        addressLabel.innerText = "Address: *";
                    }
                    else {
                        addressLabel.innerText = "Address:";
                    }
                }
            });
        });
    }
    ;
    document.addEventListener("DOMContentLoaded", loaded, false);
    function disableAllButtons(form, disabled, text) {
        if (disabled === void 0) { disabled = true; }
        var buttons = form.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = disabled;
            if (text) {
                buttons[i].innerHTML = text;
            }
        }
    }
})();
//# sourceMappingURL=form-submission-handler.js.map