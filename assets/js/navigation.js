(() => {
  const nav = document.querySelector("nav");
  const toggleButton = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  const navLinks = Array.from(
    document.querySelectorAll('nav a[href^="#"], #mobileMenu a[href^="#"]')
  );
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const revealDelay = 320;
  const minHideScrollY = 48;
  const minScrollDelta = 8;
  let scrollRevealTimer = null;
  let lastScrollY = window.scrollY;

  const getNavOffset = () => {
    if (!nav) {
      return 120;
    }

    const navTop = parseFloat(window.getComputedStyle(nav).top) || 0;

    return Math.ceil(navTop + nav.offsetHeight + 22);
  };

  const syncNavOffset = () => {
    document.documentElement.style.setProperty(
      "--nav-offset",
      `${getNavOffset()}px`
    );
  };

  const setMenuState = (isOpen) => {
    if (!toggleButton || !menu) {
      return;
    }

    nav?.classList.remove("is-hidden");
    menu.classList.toggle("open", isOpen);
    toggleButton.setAttribute("aria-expanded", String(isOpen));
    menu.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  };

  const clearRevealTimer = () => {
    if (!scrollRevealTimer) {
      return;
    }

    window.clearTimeout(scrollRevealTimer);
    scrollRevealTimer = null;
  };

  const showNav = () => {
    nav?.classList.remove("is-hidden");
  };

  const hideNav = () => {
    nav?.classList.add("is-hidden");
  };

  const scheduleNavReveal = () => {
    clearRevealTimer();
    scrollRevealTimer = window.setTimeout(() => {
      showNav();
      scrollRevealTimer = null;
    }, revealDelay);
  };

  const handleScrollState = () => {
    if (!nav || menu?.classList.contains("open")) {
      clearRevealTimer();
      showNav();
      lastScrollY = window.scrollY;
      return;
    }

    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    if (currentScrollY <= minHideScrollY) {
      clearRevealTimer();
      showNav();
      return;
    }

    if (Math.abs(scrollDelta) < minScrollDelta) {
      scheduleNavReveal();
      return;
    }

    hideNav();
    scheduleNavReveal();
  };

  const scrollToSection = (hash) => {
    const target = document.querySelector(hash);

    if (!target) {
      return;
    }

    const targetTop = Math.max(
      target.getBoundingClientRect().top + window.scrollY - getNavOffset(),
      0
    );

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
  };

  syncNavOffset();

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");

      if (!hash) {
        return;
      }

      const target = document.querySelector(hash);

      if (!target) {
        return;
      }

      event.preventDefault();
      clearRevealTimer();
      showNav();
      setMenuState(false);
      window.setTimeout(() => scrollToSection(hash), 10);
    });
  });

  if (!toggleButton || !menu) {
    return;
  }

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

  window.addEventListener(
    "scroll",
    () => {
      handleScrollState();
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    syncNavOffset();
    showNav();

    if (window.innerWidth > 640) {
      setMenuState(false);
    }
  });
})();
