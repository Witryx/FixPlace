(() => {
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const animateReveal = (element, order = 0) => {
    const revealDelay = prefersReducedMotion.matches
      ? 0
      : Math.min(order, 3) * 70;

    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        element.classList.add("visible");
      });
    }, revealDelay);
  };

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item, index) => animateReveal(item, index));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (firstEntry, secondEntry) =>
            firstEntry.boundingClientRect.top - secondEntry.boundingClientRect.top
        )
        .forEach((entry, index) => {
          animateReveal(entry.target, index);
          observer.unobserve(entry.target);
        });
    },
    { threshold: 0.05, rootMargin: "0px 0px 10% 0px" }
  );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });
})();
