(() => {
  const toggleButton = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");

  if (!toggleButton || !menu) {
    return;
  }

  const setMenuState = (isOpen) => {
    menu.classList.toggle("open", isOpen);
    toggleButton.setAttribute("aria-expanded", String(isOpen));
    menu.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  };

  setMenuState(false);

  toggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuState(!menu.classList.contains("open"));
  });

  menu.querySelectorAll("[data-close-menu]").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("open")) {
      return;
    }

    if (menu.contains(event.target) || toggleButton.contains(event.target)) {
      return;
    }

    setMenuState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) {
      setMenuState(false);
    }
  });
})();
