(() => {
  const form = document.getElementById("contactForm");
  const successMessage = document.getElementById("formSuccess");
  const feedback = document.getElementById("formFeedback");

  if (!form || !successMessage) {
    return;
  }

  const controls = Array.from(form.querySelectorAll(".form-control"));
  const submitButton = form.querySelector(".form-submit-btn");
  const submitButtonMarkup = submitButton?.innerHTML ?? "";
  const endpoint = form.dataset.contactEndpoint || form.getAttribute("action") || "/api/contact";

  const setFeedback = (message = "", state = "info") => {
    if (!feedback) {
      return;
    }

    if (!message) {
      feedback.hidden = true;
      feedback.textContent = "";
      feedback.removeAttribute("data-state");
      return;
    }

    feedback.hidden = false;
    feedback.textContent = message;
    feedback.dataset.state = state;
  };

  const setSubmittingState = (isSubmitting) => {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.classList.toggle("is-loading", isSubmitting);
    submitButton.setAttribute("aria-disabled", String(isSubmitting));
    form.setAttribute("aria-busy", String(isSubmitting));
    submitButton.innerHTML = isSubmitting ? "Odesilam poptavku..." : submitButtonMarkup;
  };

  const syncCustomValidity = (control) => {
    const value = typeof control.value === "string" ? control.value.trim() : control.value;
    const needsRequiredValue = control.hasAttribute("required") && value === "";

    control.setCustomValidity(needsRequiredValue ? "Vyplnte prosim toto pole." : "");
  };

  const updateControlState = (control) => {
    syncCustomValidity(control);
    control.classList.toggle("is-invalid", !control.checkValidity());
  };

  const isLocalPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);

  controls.forEach((control) => {
    const eventName = control.tagName === "SELECT" ? "change" : "input";

    control.addEventListener(eventName, () => {
      updateControlState(control);
      if (feedback?.dataset.state === "error") {
        setFeedback();
      }
    });

    control.addEventListener("blur", () => updateControlState(control));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback();
    controls.forEach((control) => updateControlState(control));

    if (!form.checkValidity()) {
      const firstInvalid = controls.find((control) => !control.checkValidity());
      firstInvalid?.focus();
      form.reportValidity();
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      setSubmittingState(true);
      setFeedback("Odesilam poptavku...", "info");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Send failed");
      }

      form.classList.add("is-hidden");
      successMessage.classList.add("is-visible");
      form.reset();
      controls.forEach((control) => control.classList.remove("is-invalid"));
      setFeedback();
      successMessage.focus();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Nepodarilo se odeslat formular.";

      if (isLocalPreview) {
        setFeedback("Pres Live Server se API nespusti. Otestuj to pres nasazeny web nebo pres `vercel dev`.", "error");
      } else {
        setFeedback(errorMessage, "error");
      }
    } finally {
      setSubmittingState(false);
    }
  });
})();
