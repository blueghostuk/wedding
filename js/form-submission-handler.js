"use strict";
(function () {
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
            formData[name] = element.value;
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
        formData.formDataNameOrder = JSON.stringify(fields);
        formData.formGoogleSheetName = form.dataset.sheet || "responses";
        formData.formGoogleSend = form.dataset.email || "";
        return { data: formData, honeypot: honeypot };
    }
    function handleFormSubmit(event) {
        event.preventDefault();
        var form = event.target;
        var thankYouMessage = form.querySelector(".alert");
        if (thankYouMessage) {
            thankYouMessage.style.display = "none";
        }
        disableAllButtons(form, true, "Submitting");
        var formData = getFormData(form);
        var data = formData.data;
        if (formData.honeypot) {
            return false;
        }
        var url = form.action;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                disableAllButtons(form, false, "Submit");
                if (xhr.status === 200) {
                    form.reset();
                    var formElements = form.querySelectorAll(".form-group");
                    if (formElements && formElements.length > 0) {
                        formElements.forEach(function (e) { return e.style.display = "none"; });
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
        var encoded = Object.keys(data).map(function (k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }).join('&');
        xhr.send(encoded);
    }
    function loaded() {
        var forms = document.querySelectorAll("form.gform");
        for (var i = 0; i < forms.length; i++) {
            forms[i].addEventListener("submit", handleFormSubmit, false);
        }
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