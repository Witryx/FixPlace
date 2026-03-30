(() => {
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const skillsBlock = document.getElementById("skillsBlock");

  const animateReveal = (element) => {
    const delayIndex = Number(element.dataset.revealIndex || "0");
    window.setTimeout(() => {
      element.classList.add("visible");
    }, delayIndex * 70);
  };

  const animateSkillBars = () => {
    if (!skillsBlock) {
      return;
    }

    skillsBlock.querySelectorAll(".skill-fill").forEach((bar, index) => {
      if (bar.dataset.progress) {
        bar.style.width = `${bar.dataset.progress}%`;
      }

      window.setTimeout(() => {
        bar.classList.add("animate");
      }, index * 100);
    });
  };

  revealItems.forEach((item, index) => {
    item.dataset.revealIndex = String(index);
  });

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => animateReveal(item));
    animateSkillBars();
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateReveal(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });

  if (!skillsBlock) {
    return;
  }

  let skillsAnimated = false;

  const skillsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || skillsAnimated) {
          return;
        }

        skillsAnimated = true;
        animateSkillBars();
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );

  skillsObserver.observe(skillsBlock);
})();
