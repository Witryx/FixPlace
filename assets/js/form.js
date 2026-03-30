(() => {
  const form = document.getElementById("contactForm");
  const successMessage = document.getElementById("formSuccess");

  if (!form || !successMessage) {
    return;
  }

  const controls = Array.from(form.querySelectorAll(".form-control"));

  const syncCustomValidity = (control) => {
    const value = typeof control.value === "string" ? control.value.trim() : control.value;
    const needsRequiredValue = control.hasAttribute("required") && value === "";

    control.setCustomValidity(needsRequiredValue ? "Vyplňte prosím toto pole." : "");
  };

  const updateControlState = (control) => {
    syncCustomValidity(control);
    control.classList.toggle("is-invalid", !control.checkValidity());
  };

  controls.forEach((control) => {
    const eventName = control.tagName === "SELECT" ? "change" : "input";

    control.addEventListener(eventName, () => updateControlState(control));
    control.addEventListener("blur", () => updateControlState(control));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    controls.forEach((control) => updateControlState(control));

    if (!form.checkValidity()) {
      const firstInvalid = controls.find((control) => !control.checkValidity());
      firstInvalid?.focus();
      form.reportValidity();
      return;
    }

    form.classList.add("is-hidden");
    successMessage.classList.add("is-visible");
    form.reset();
    controls.forEach((control) => control.classList.remove("is-invalid"));
    successMessage.focus();
  });
})();
