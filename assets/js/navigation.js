(() => {
  const nav = document.querySelector("nav");
  const toggleButton = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  const revealDelay = 320;
  const minHideScrollY = 48;
  const minScrollDelta = 8;
  const sectionLeadOffset = 18;
  let scrollRevealTimer = null;
  let lastScrollY = window.scrollY;
  let anchorScrollRaf = null;
  let anchorScrollTargetY = null;
  let anchorScrollStartedAt = 0;
  let anchorScrollLastY = null;
  let anchorScrollStableFrames = 0;
  let anchorScrollHasMoved = false;
  let isAnchorScrolling = false;

  const getNavOffset = () => {
    if (!nav) {
      return 120;
    }

    const navTop = parseFloat(window.getComputedStyle(nav).top) || 0;

    return Math.ceil(navTop + nav.offsetHeight + 22);
  };

  const getScrollTarget = (hash) => {
    const target = document.querySelector(hash);

    if (!target) {
      return null;
    }

    const contentTarget =
      target.id === "hero" ? target : target.firstElementChild || target;

    return Math.max(
      contentTarget.getBoundingClientRect().top +
        window.scrollY -
        getNavOffset() -
        sectionLeadOffset,
      0
    );
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

  const finishAnchorScroll = () => {
    if (anchorScrollRaf) {
      window.cancelAnimationFrame(anchorScrollRaf);
      anchorScrollRaf = null;
    }

    isAnchorScrolling = false;
    anchorScrollTargetY = null;
    anchorScrollStartedAt = 0;
    anchorScrollLastY = null;
    anchorScrollStableFrames = 0;
    anchorScrollHasMoved = false;
    lastScrollY = window.scrollY;
  };

  const trackAnchorScroll = () => {
    if (!isAnchorScrolling) {
      return;
    }

    const currentY = window.scrollY;
    const distanceToTarget = Math.abs(currentY - anchorScrollTargetY);
    const frameDelta =
      anchorScrollLastY === null ? Number.POSITIVE_INFINITY : Math.abs(currentY - anchorScrollLastY);

    if (frameDelta >= 0.5) {
      anchorScrollHasMoved = true;
      anchorScrollStableFrames = 0;
    } else if (anchorScrollHasMoved) {
      anchorScrollStableFrames += 1;
    }

    anchorScrollLastY = currentY;

    const timedOut = performance.now() - anchorScrollStartedAt > 1800;

    if (distanceToTarget <= 2 || anchorScrollStableFrames >= 8 || timedOut) {
      finishAnchorScroll();
      return;
    }

    anchorScrollRaf = window.requestAnimationFrame(trackAnchorScroll);
  };

  const startAnchorScroll = (hash) => {
    const targetY = getScrollTarget(hash);

    if (targetY === null) {
      return;
    }

    finishAnchorScroll();
    clearRevealTimer();
    showNav();

    isAnchorScrolling = true;
    anchorScrollTargetY = targetY;
    anchorScrollStartedAt = performance.now();
    anchorScrollLastY = window.scrollY;
    anchorScrollStableFrames = 0;
    anchorScrollHasMoved = false;

    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });

    anchorScrollRaf = window.requestAnimationFrame(trackAnchorScroll);
  };

  const handleScrollState = () => {
    if (!nav || menu?.classList.contains("open")) {
      clearRevealTimer();
      showNav();
      lastScrollY = window.scrollY;
      return;
    }

    if (isAnchorScrolling) {
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

  const handleHashLinkClick = (event) => {
    const link = event.target.closest('a[href^="#"]');

    if (!link) {
      return;
    }

    const hash = link.getAttribute("href");

    if (!hash || hash === "#") {
      return;
    }

    if (!document.querySelector(hash)) {
      return;
    }

    event.preventDefault();
    setMenuState(false);

    if (window.location.hash === hash) {
      history.replaceState(null, "", hash);
    } else {
      history.pushState(null, "", hash);
    }

    window.requestAnimationFrame(() => startAnchorScroll(hash));
  };

  const cancelAnchorScroll = () => {
    if (!isAnchorScrolling) {
      return;
    }

    finishAnchorScroll();
  };

  syncNavOffset();
  document.addEventListener("click", handleHashLinkClick);

  if (window.location.hash) {
    window.requestAnimationFrame(() => {
      const targetY = getScrollTarget(window.location.hash);

      if (targetY === null) {
        return;
      }

      window.scrollTo(0, targetY);
      lastScrollY = window.scrollY;
    });
  }

  if (toggleButton && menu) {
    setMenuState(false);

    toggleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      setMenuState(!menu.classList.contains("open"));
    });

    menu.querySelectorAll("[data-close-menu]").forEach((link) => {
      link.addEventListener("click", () => setMenuState(false));
    });
  }

  document.addEventListener("click", (event) => {
    if (!menu?.classList.contains("open")) {
      return;
    }

    if (menu.contains(event.target) || toggleButton?.contains(event.target)) {
      return;
    }

    setMenuState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }

    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "PageDown" ||
      event.key === "PageUp" ||
      event.key === "Home" ||
      event.key === "End" ||
      event.key === " "
    ) {
      cancelAnchorScroll();
    }
  });

  ["wheel", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, cancelAnchorScroll, {
      passive: true,
    });
  });

  window.addEventListener(
    "scroll",
    () => {
      handleScrollState();
    },
    { passive: true }
  );

  window.addEventListener("hashchange", () => {
    if (!window.location.hash) {
      return;
    }

    startAnchorScroll(window.location.hash);
  });

  window.addEventListener("resize", () => {
    cancelAnchorScroll();
    syncNavOffset();
    showNav();

    if (window.innerWidth > 640) {
      setMenuState(false);
    }
  });
})();
