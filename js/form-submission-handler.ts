(function () {
  type HTMLFormInput = HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;
  // get all data in form and return object
  function getFormData(form: HTMLFormElement) {
    let elements = form.elements;
    let honeypot;

    let fields: string[] = Object.keys(elements).filter((k) => {
      if ((elements[k as any as number] as HTMLFormInput).name === "honeypot") {
        honeypot = (elements[k as any as number] as HTMLFormInput).value;
        return false;
      }
      return true;
    }).map((k) => {
      if ((elements[k as any as number]as HTMLFormInput).name !== undefined) {
        return (elements[k as any as number] as any).name;
        // special case for Edge's html collection
      } else if ((elements[k as any as number] as any as RadioNodeList).length > 0) {
        return ((elements[k as any as number] as any as RadioNodeList).item(0) as HTMLFormInput).name;
      }
    }).filter((item, pos, self) => {
      return self.indexOf(item) == pos && item;
    });

    let formData: { [key: string]: any } = {};
    fields.forEach((name) => {
      let element = elements[name as any as number] as HTMLFormInput | RadioNodeList;

      // singular form elements just have one value
      formData[name] = element.value;

      // when our element has multiple items, get their values
      if ((element as RadioNodeList).length) {
        let data = [];
        for (var i = 0; i < (element as RadioNodeList).length; i++) {
          let item = (element as RadioNodeList).item(i) as HTMLInputElement | HTMLOptionElement;
          if ((item as HTMLInputElement).checked || (item as HTMLOptionElement).selected) {
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

  function handleFormSubmit(event: Event) {  // handles form submit without any jquery
    event.preventDefault();           // we are submitting via xhr below
    let form = event.target as HTMLFormElement;
    let formData = getFormData(form);
    let data = formData.data;

    // If a honeypot field is filled, assume it was done so by a spam bot.
    if (formData.honeypot) {
      return false;
    }

    disableAllButtons(form);
    let url = form.action;
    let xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    // xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        form.reset();
        let formElements = form.querySelectorAll<HTMLElement>(".form-group")
        if (formElements && formElements.length > 0) {
          formElements.forEach((e) => e.style.display = "none");// hide form controls
        }
        let thankYouMessage = form.querySelector<HTMLElement>(".alert");
        if (thankYouMessage) {
          thankYouMessage.style.display = "block";
        }
      }
    };
    // url encode form data for sending as post data
    let encoded = Object.keys(data).map((k) => {
      return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
    }).join('&');
    xhr.send(encoded);
  }

  function loaded() {
    // bind to the submit event of our form
    let forms = document.querySelectorAll<HTMLFormElement>("form.gform");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", handleFormSubmit, false);
    }
  };
  document.addEventListener("DOMContentLoaded", loaded, false);

  function disableAllButtons(form: HTMLFormElement) {
    let buttons = form.querySelectorAll<HTMLButtonElement>("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }
})();