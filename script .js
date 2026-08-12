(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal (replays every time an element enters view) ---------- */
  var revealItems = document.querySelectorAll(".reveal, .reveal-drop, .reveal-left, .reveal-right, .reveal-zoom");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Schema card: terminal-style typing (replays every entry) ---------- */
  var schemaCard = document.getElementById("schema-card");
  if (schemaCard) {
    var schemaValEls = schemaCard.querySelectorAll(".schema-val");
    var schemaOriginals = [];
    schemaValEls.forEach(function (el) {
      schemaOriginals.push(el.textContent);
      if (!prefersReduced) el.textContent = "";
    });

    var schemaTimers = [];
    function clearSchemaTimers() {
      schemaTimers.forEach(function (id) {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
      schemaTimers = [];
    }

    function typeSchemaRows() {
      if (prefersReduced) return;
      clearSchemaTimers();
      schemaValEls.forEach(function (el) { el.textContent = ""; });
      var rowDelay = 0;
      schemaValEls.forEach(function (el, idx) {
        var fullText = schemaOriginals[idx];
        var startId = window.setTimeout(function () {
          var i = 0;
          var iv = window.setInterval(function () {
            el.textContent = fullText.slice(0, i + 1);
            i++;
            if (i >= fullText.length) window.clearInterval(iv);
          }, 14);
          schemaTimers.push(iv);
        }, rowDelay);
        schemaTimers.push(startId);
        rowDelay += 180 + fullText.length * 6;
      });
    }

    if (prefersReduced || !("IntersectionObserver" in window)) {
      schemaCard.classList.add("is-visible");
    } else {
      var schemaObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            schemaCard.classList.toggle("is-visible", entry.isIntersecting);
            if (entry.isIntersecting) {
              typeSchemaRows();
            } else {
              clearSchemaTimers();
              schemaValEls.forEach(function (el) { el.textContent = ""; });
            }
          });
        },
        { threshold: 0.3 }
      );
      schemaObserver.observe(schemaCard);
    }
  }

  /* ---------- Hero role-rotator (typewriter) ---------- */
  var roleTextEl = document.getElementById("role-rotator-text");
  var ROLES = ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Application Builder"];
  if (roleTextEl) {
    if (prefersReduced) {
      roleTextEl.textContent = ROLES[0];
    } else {
      (function typewriterLoop() {
        var roleIdx = 0;
        function typeRole() {
          var word = ROLES[roleIdx];
          var i = 0;
          var typeIv = window.setInterval(function () {
            roleTextEl.textContent = word.slice(0, i + 1);
            i++;
            if (i >= word.length) {
              window.clearInterval(typeIv);
              window.setTimeout(eraseRole, 1400);
            }
          }, 55);
        }
        function eraseRole() {
          var word = ROLES[roleIdx];
          var i = word.length;
          var eraseIv = window.setInterval(function () {
            roleTextEl.textContent = word.slice(0, i - 1);
            i--;
            if (i <= 0) {
              window.clearInterval(eraseIv);
              roleIdx = (roleIdx + 1) % ROLES.length;
              window.setTimeout(typeRole, 250);
            }
          }, 30);
        }
        typeRole();
      })();
    }
  }

  /* ---------- Animated stat counters (replay every entry) ---------- */
  var counters = document.querySelectorAll("[data-count-to]");
  var counterRunIds = new WeakMap();
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var runId = {};
    counterRunIds.set(el, runId);
    var duration = 900;
    var start = null;
    function step(ts) {
      if (counterRunIds.get(el) !== runId) return; // a newer run superseded this one
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
            } else if (!prefersReduced) {
              var decimals = parseInt(entry.target.getAttribute("data-decimals") || "0", 10);
              var suffix = entry.target.getAttribute("data-suffix") || "";
              entry.target.textContent = (0).toFixed(decimals) + suffix;
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

  /* ---------- Scroll progress bar ---------- */
  var progressFill = document.getElementById("nav-progress-fill");
  function updateProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + "%";
  }

  /* ---------- Active nav-link highlighting + liquid pill ---------- */
  var navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  var navTrack = document.getElementById("nav-track");
  var navPill = document.getElementById("nav-pill");
  var trackedSections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute("href").slice(1);
    var section = document.getElementById(id);
    if (section) trackedSections.push({ link: link, section: section });
  });

  function movePill(link) {
    if (!navPill || !navTrack) return;
    if (!link) {
      navPill.style.opacity = "0";
      return;
    }
    var trackRect = navTrack.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();
    var x = linkRect.left - trackRect.left;
    navPill.style.width = linkRect.width + "px";
    navPill.style.transform = "translateX(" + x + "px)";
    navPill.style.opacity = "1";
  }

  function updateActiveNav() {
    var scrollPos = window.scrollY + window.innerHeight * 0.3;
    var current = null;
    trackedSections.forEach(function (item) {
      if (item.section.offsetTop <= scrollPos) current = item;
    });
    trackedSections.forEach(function (item) {
      item.link.classList.toggle("is-active", item === current);
    });
    movePill(current ? current.link : null);
  }
  window.addEventListener("resize", function () {
    var activeItem = trackedSections.filter(function (i) { return i.link.classList.contains("is-active"); })[0];
    movePill(activeItem ? activeItem.link : null);
  });

  /* ---------- Hero parallax + continuous float ---------- */
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  var startTime = performance.now();

  function floatLoop(now) {
    if (!prefersReduced) {
      var elapsed = (now - startTime) / 1000;
      var y = window.scrollY;
      parallaxEls.forEach(function (el, i) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0;
        var bobAmp = 14;
        var bobSpeed = 0.35 + i * 0.08;
        var bobOffsetX = Math.sin(elapsed * bobSpeed) * bobAmp;
        var bobOffsetY = Math.cos(elapsed * bobSpeed * 0.8) * bobAmp;
        el.style.transform =
          "translate3d(" + bobOffsetX + "px," + (y * speed + bobOffsetY) + "px,0)";
      });
    }
    window.requestAnimationFrame(floatLoop);
  }
  if (parallaxEls.length) window.requestAnimationFrame(floatLoop);

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress();
        updateActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3D tilt (project cards + skill groups) ---------- */
  function attachTilt(el, maxDeg) {
    el.addEventListener("mousemove", function (e) {
      var rect = el.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      el.style.setProperty("--mx", px * 100 + "%");
      el.style.setProperty("--my", py * 100 + "%");
      if (prefersReduced) return;
      var rx = (0.5 - py) * maxDeg;
      var ry = (px - 0.5) * maxDeg;
      el.classList.add("is-tilting");
      el.style.transform =
        "perspective(1000px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) scale3d(1.015,1.015,1.015)";
    });
    el.addEventListener("mouseleave", function () {
      el.classList.remove("is-tilting");
      if (!prefersReduced) el.style.transform = "";
    });
  }
  document.querySelectorAll(".project-card").forEach(function (el) { attachTilt(el, 9); });
  document.querySelectorAll(".skill-group").forEach(function (el) { attachTilt(el, 6); });

  /* ---------- Project card spotlight (hover) + tap glow (touch) ---------- */
  var cards = document.querySelectorAll(".project-card");
  cards.forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var mx = ((e.clientX - rect.left) / rect.width) * 100;
      var my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", mx + "%");
      card.style.setProperty("--my", my + "%");
    });

    card.addEventListener(
      "touchstart",
      function () {
        cards.forEach(function (c) { c.classList.remove("is-touched"); });
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "35%");
        card.classList.add("is-touched");
        window.setTimeout(function () { card.classList.remove("is-touched"); }, 900);
      },
      { passive: true }
    );
  });
})();
