(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal ---------- */
  var revealItems = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Schema card stagger (triggers row-by-row transition) ---------- */
  var schemaCard = document.getElementById("schema-card");
  if (schemaCard) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      schemaCard.classList.add("is-visible");
    } else {
      var schemaObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              schemaObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      schemaObserver.observe(schemaCard);
    }
  }

  /* ---------- Animated stat counters ---------- */
  var counters = document.querySelectorAll("[data-count-to]");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var duration = 900;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      var value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
    } else {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (el) { counterObserver.observe(el); });
    }
  }

  /* ---------- Skill → project filter ---------- */
  var chips = document.querySelectorAll(".chip[data-skill]");
  var projectCards = document.querySelectorAll(".project-card[data-stack]");
  var filterBar = document.getElementById("filter-bar");
  var filterTag = document.getElementById("filter-tag");
  var filterCount = document.getElementById("filter-count");
  var clearFilterBtn = document.getElementById("clear-filter");
  var activeChip = null;

  var CAT_COLORS = {
    ml: "#1f6f78",
    lang: "#3b5bdb",
    frontend: "#c2255c",
    backend: "#2f9e44",
    db: "#7048c9",
    cloud: "#1971c2",
    viz: "#c97a2b",
    tools: "#0c8599"
  };

  function clearFilter() {
    if (activeChip) activeChip.classList.remove("is-active");
    activeChip = null;
    projectCards.forEach(function (card) {
      card.classList.remove("is-dim", "is-match");
    });
    filterBar.classList.remove("is-active");
    document.documentElement.style.removeProperty("--active-cat");
  }

  function applyFilter(skill, label) {
    var matchCount = 0;
    projectCards.forEach(function (card) {
      var stack = (card.getAttribute("data-stack") || "").split(",");
      if (stack.indexOf(skill) !== -1) {
        card.classList.add("is-match");
        card.classList.remove("is-dim");
        matchCount++;
      } else {
        card.classList.add("is-dim");
        card.classList.remove("is-match");
      }
    });

    filterTag.textContent = label;
    filterCount.textContent =
      matchCount === 0
        ? "— not yet demoed in a featured project (see Experience section)"
        : "— " + matchCount + " project" + (matchCount === 1 ? "" : "s");
    filterBar.classList.add("is-active");

    if (!prefersReduced) {
      var projectsSection = document.getElementById("projects");
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var skill = chip.getAttribute("data-skill");
      var label = chip.textContent;

      if (activeChip === chip) {
        clearFilter();
        return;
      }
      if (activeChip) activeChip.classList.remove("is-active");
      chip.classList.add("is-active");
      activeChip = chip;

      var group = chip.closest(".skill-group");
      var cat = group ? group.getAttribute("data-cat") : null;
      if (cat && CAT_COLORS[cat]) {
        document.documentElement.style.setProperty("--active-cat", CAT_COLORS[cat]);
      } else {
        document.documentElement.style.removeProperty("--active-cat");
      }

      applyFilter(skill, label);
    });
  });

  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", clearFilter);
  }
})();
