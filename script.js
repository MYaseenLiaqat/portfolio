(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------
     Reveal-on-scroll, once only
  ---------------------------------- */
  var revealItems = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------
     Header progress + active section
  ---------------------------------- */
  var progressFill = document.getElementById("page-progress-fill");
  var desktopNavLinks = Array.prototype.slice.call(document.querySelectorAll(".desktop-nav a[href^='#']"));
  var trackedSections = desktopNavLinks.map(function (link) {
    return { link: link, section: document.querySelector(link.getAttribute("href")) };
  }).filter(function (item) { return item.section; });

  function updateScrollUI() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
    if (progressFill) progressFill.style.width = progress + "%";

    var marker = scrollTop + window.innerHeight * 0.33;
    var current = null;
    trackedSections.forEach(function (item) {
      if (item.section.offsetTop <= marker) current = item;
    });
    trackedSections.forEach(function (item) {
      item.link.classList.toggle("is-active", item === current);
    });
  }

  var scrollTicking = false;
  window.addEventListener("scroll", function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        updateScrollUI();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  /* ---------------------------------
     Mobile navigation
  ---------------------------------- */
  var menuButton = document.getElementById("menu-button");
  var mobileNav = document.getElementById("mobile-nav");
  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      var open = !mobileNav.classList.contains("is-open");
      mobileNav.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
      });
    });
  }

  /* ---------------------------------
     Subtle hero focus rotator
  ---------------------------------- */
  var focusRotator = document.getElementById("focus-rotator");
  var focusItems = [
    "AI/ML engineering",
    "RAG & LLM applications",
    "backend systems",
    "data & ML pipelines"
  ];
  if (focusRotator && !prefersReducedMotion) {
    var focusIndex = 0;
    window.setInterval(function () {
      focusRotator.classList.add("is-changing");
      window.setTimeout(function () {
        focusIndex = (focusIndex + 1) % focusItems.length;
        focusRotator.textContent = focusItems[focusIndex];
        focusRotator.classList.remove("is-changing");
      }, 180);
    }, 2800);
  }

  /* ---------------------------------
     Count-up highlights
  ---------------------------------- */
  var counters = document.querySelectorAll("[data-count-to]");
  function animateCounter(el) {
    if (el.dataset.counted === "true") return;
    el.dataset.counted = "true";

    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReducedMotion) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    var start = null;
    var duration = 850;
    function step(timestamp) {
      if (start === null) start = timestamp;
      var p = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------------------------------
     Capability -> project evidence filter
  ---------------------------------- */
  var skillButtons = Array.prototype.slice.call(document.querySelectorAll("[data-skill]"));
  var projectCards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));
  var filterStatus = document.getElementById("project-filter-status");
  var clearProjectFilter = document.getElementById("clear-project-filter");
  var activeSkillButton = null;

  var skillAliases = {
    "pytorch": ["pytorch", "ml"],
    "scikit-learn": ["scikit-learn", "ml"],
    "rag": ["rag", "ai"],
    "langchain": ["langchain", "rag"],
    "llamaindex": ["llamaindex", "rag"],
    "embeddings": ["embeddings", "rag"],
    "prompt-engineering": ["prompt-engineering", "ai"],
    "evaluation": ["evaluation", "research", "ai"],
    "testing": ["testing", "research", "backend", "ai"],
    "python": ["python"],
    "fastapi": ["fastapi", "backend"],
    "flask": ["flask", "backend"],
    "rest-apis": ["rest-apis", "backend"],
    "docker": ["docker", "backend"],
    "csharp": ["csharp", "backend"],
    "sql": ["sql", "data"],
    "postgresql": ["postgresql", "data"],
    "gcp": ["gcp", "data"],
    "bigquery": ["bigquery", "data"],
    "etl": ["etl", "data"],
    "tableau": ["tableau", "data"],
    "react": ["react", "product"],
    "nextjs": ["nextjs", "product"],
    "flutter": ["flutter", "product"],
    "javascript": ["javascript", "product"],
    "typescript": ["typescript", "product"]
  };

  function clearSkillFilter() {
    if (activeSkillButton) activeSkillButton.classList.remove("is-active");
    activeSkillButton = null;
    projectCards.forEach(function (card) {
      card.classList.remove("is-dim", "is-match");
    });
    if (filterStatus) filterStatus.querySelector("span").textContent = "Showing all work";
    if (clearProjectFilter) clearProjectFilter.hidden = true;
  }

  function applySkillFilter(button) {
    var skill = button.getAttribute("data-skill");
    var aliases = skillAliases[skill] || [skill];
    var label = button.textContent.trim();
    var matches = 0;

    projectCards.forEach(function (card) {
      var stack = (card.getAttribute("data-stack") || "").toLowerCase().split(/\s+/);
      var isMatch = aliases.some(function (alias) { return stack.indexOf(alias) !== -1; });
      card.classList.toggle("is-match", isMatch);
      card.classList.toggle("is-dim", !isMatch);
      if (isMatch) matches += 1;
    });

    if (filterStatus) filterStatus.querySelector("span").textContent = matches ? (label + " → " + matches + " project" + (matches === 1 ? "" : "s")) : (label + " → not in the homepage selection; see all projects");
    if (clearProjectFilter) clearProjectFilter.hidden = false;

    var projectsSection = document.getElementById("projects");
    if (projectsSection) projectsSection.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  skillButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (activeSkillButton === button) {
        clearSkillFilter();
        return;
      }
      if (activeSkillButton) activeSkillButton.classList.remove("is-active");
      activeSkillButton = button;
      button.classList.add("is-active");
      applySkillFilter(button);
    });
  });

  if (clearProjectFilter) clearProjectFilter.addEventListener("click", clearSkillFilter);

  /* ---------------------------------
     Professional card spotlight
  ---------------------------------- */
  projectCards.forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width) * 100 + "%");
      card.style.setProperty("--my", ((event.clientY - rect.top) / rect.height) * 100 + "%");
    });
  });

  /* ---------------------------------
     Local JD evidence matcher
     This is intentionally deterministic and transparent.
  ---------------------------------- */
  var jdInput = document.getElementById("jd-input");
  var analyzeButton = document.getElementById("analyze-jd");
  var clearJdButton = document.getElementById("clear-jd");
  var matcherEmpty = document.getElementById("matcher-empty");
  var matcherResults = document.getElementById("matcher-results");
  var matchScore = document.getElementById("match-score");
  var scoreRing = document.getElementById("score-ring");
  var matchLabel = document.getElementById("match-label");
  var matchSummary = document.getElementById("match-summary");
  var matchedSkills = document.getElementById("matched-skills");
  var missingSkills = document.getElementById("missing-skills");
  var evidenceList = document.getElementById("evidence-list");
  var recruiterBriefText = document.getElementById("recruiter-brief-text");
  var experienceWarning = document.getElementById("experience-warning");
  var copySummaryButton = document.getElementById("copy-summary");
  var lastSummaryText = "";

  var PROFILE_YEARS = 1.5;

  var competencyMap = [
    { name: "Python", aliases: ["python"], have: true, evidence: "Python appears across the production backend and AI/ML projects." },
    { name: "FastAPI", aliases: ["fastapi", "fast api"], have: true, evidence: "Current role includes FastAPI middleware connecting internal systems and partner applications; AI Learning Research also uses FastAPI for controlled task and AI workflows." },
    { name: "Flask", aliases: ["flask"], have: true, evidence: "Mabros Couriers uses Flask for its production backend API." },
    { name: "REST APIs", aliases: ["rest api", "restful", "api development", "apis"], have: true, evidence: "REST API design and service integration are demonstrated in both professional experience and Mabros Couriers." },
    { name: "Docker", aliases: ["docker", "containerization", "containers"], have: true, evidence: "Docker is used to standardize deployment in current professional work and in Mabros Couriers." },
    { name: "SQL", aliases: ["sql", "relational database", "relational databases"], have: true, evidence: "SQL and relational database design are part of prior software engineering work and data projects; an Advanced SQL credential from Kaggle adds recent structured practice." },
    { name: "PostgreSQL", aliases: ["postgresql", "postgres"], have: true, evidence: "PostgreSQL is listed in the portfolio database stack." },
    { name: "MySQL", aliases: ["mysql"], have: true, evidence: "MySQL is listed in the portfolio database stack." },
    { name: "SQL Server", aliases: ["sql server", "mssql"], have: true, evidence: "SQL Server is listed in the portfolio database stack." },
    { name: "PyTorch", aliases: ["pytorch", "torch"], have: true, evidence: "PyTorch is part of the portfolio ML stack." },
    { name: "Scikit-learn", aliases: ["scikit-learn", "sklearn", "scikit learn"], have: true, evidence: "The Bank Marketing project compares and tunes multiple Scikit-learn classifiers." },
    { name: "Machine Learning", aliases: ["machine learning", " ml ", "predictive modeling", "classification model"], have: true, evidence: "The Bank Marketing project demonstrates model comparison, feature engineering, and tuning." },
    { name: "RAG", aliases: ["retrieval augmented generation", "retrieval-augmented generation", "rag"], have: true, evidence: "AI Growth Journal and Reflct both demonstrate retrieval-based AI application work." },
    { name: "LangChain", aliases: ["langchain"], have: true, evidence: "AI Growth Journal is built with LangChain and a RAG pipeline." },
    { name: "LlamaIndex", aliases: ["llamaindex", "llama index"], have: true, evidence: "Reflct uses LlamaIndex for retrieval." },
    { name: "Embeddings", aliases: ["embedding", "embeddings", "vector search", "semantic search"], have: true, evidence: "AI Growth Journal uses vector embeddings and semantic retrieval over past entries." },
    { name: "LLM applications", aliases: ["llm", "large language model", "generative ai", "genai", "generative artificial intelligence"], have: true, evidence: "AI Learning Research, Reflct, and AI Growth Journal demonstrate applied LLM-backed system design, retrieval workflows, and controlled AI behavior; recent Google Cloud badges reinforce the architecture fundamentals." },
    { name: "Prompt Engineering", aliases: ["prompt engineering", "prompt design", "system prompt"], have: true, evidence: "AI Learning Research uses versioned prompts and explicit assistance constraints; prompt engineering is also demonstrated in RAG application work." },
    { name: "AI Evaluation", aliases: ["llm evaluation", "ai evaluation", "evaluation framework", "evals", "evaluation pipeline"], have: true, evidence: "AI Learning Research includes staged tasks, deterministic grading, controlled assistance, and research logging designed for evaluation." },
    { name: "Testing / Pytest", aliases: ["pytest", "unit testing", "integration testing", "automated tests", "testing"], have: true, evidence: "AI Learning Research includes 15+ integrity and backend tests across access, submission, scheduling, seed data, and prompt context." },
    { name: "AI Guardrails", aliases: ["guardrails", "ai guardrails", "llm guardrails", "ai safety", "prompt constraints", "safety controls"], have: true, evidence: "AI Learning Research enforces condition-aware AI access, attempt ownership, time windows, interaction caps, and constrained tutoring prompts." },
    { name: "Experimental Design", aliases: ["experimental design", "controlled experiment", "research design", "a/b test", "ab test"], have: true, evidence: "AI Learning Research is structured around controlled-AI and no-AI learner conditions with frozen provenance across study phases." },
    { name: "GCP", aliases: ["gcp", "google cloud", "google cloud platform"], have: true, evidence: "Google Cloud Platform is part of the cloud/data stack." },
    { name: "BigQuery", aliases: ["bigquery", "big query"], have: true, evidence: "BigQuery and BigQuery ML are listed in the portfolio cloud/data stack." },
    { name: "ETL", aliases: ["etl", "data pipeline", "data pipelines", "data engineering"], have: true, evidence: "ETL pipelines and data engineering are listed as applied capabilities." },
    { name: "React", aliases: ["react.js", "reactjs", "react"], have: true, evidence: "Current professional work includes React.js features for a retail agent-facing application." },
    { name: "Next.js", aliases: ["next.js", "nextjs"], have: true, evidence: "Reflct is a live full-stack application built with Next.js." },
    { name: "Flutter", aliases: ["flutter", "dart"], have: true, evidence: "Current role includes ownership of a cross-platform Flutter application; Popal Eats is published on Google Play." },
    { name: "JavaScript / TypeScript", aliases: ["javascript", "typescript", "js/ts"], have: true, evidence: "JavaScript and TypeScript are listed in the portfolio language stack; Next.js work provides product evidence." },
    { name: "Tableau", aliases: ["tableau"], have: true, evidence: "A live Tableau Sales Dashboard demonstrates BI and data visualization work." },
    { name: "Power BI", aliases: ["power bi", "powerbi", "dax"], have: true, evidence: "Power BI and DAX are listed in the portfolio BI stack." },

    /* Common role requirements not currently evidenced strongly enough on this page */
    { name: "AWS", aliases: ["aws", "amazon web services"], have: false },
    { name: "Azure", aliases: ["azure", "microsoft azure"], have: false },
    { name: "Kubernetes", aliases: ["kubernetes", "k8s"], have: false },
    { name: "Terraform", aliases: ["terraform", "infrastructure as code", "iac"], have: false },
    { name: "MLflow", aliases: ["mlflow", "ml flow"], have: false },
    { name: "Airflow", aliases: ["airflow", "apache airflow"], have: false },
    { name: "Spark", aliases: ["spark", "pyspark", "apache spark"], have: false },
    { name: "Kafka", aliases: ["kafka", "apache kafka"], have: false },
    { name: "TensorFlow", aliases: ["tensorflow", "keras"], have: false },
    { name: "Computer Vision", aliases: ["computer vision", "opencv", "object detection", "image classification"], have: false },
    { name: "NLP", aliases: ["natural language processing", " nlp "], have: false },
    { name: "Fine-tuning", aliases: ["fine-tuning", "finetuning", "fine tuning", "lora", "qlora", "peft"], have: false },
    { name: "MLOps", aliases: ["mlops", "ml ops", "model monitoring", "model registry"], have: false },
    { name: "Git / CI-CD", aliases: ["git", "github", "ci/cd", "cicd", "continuous integration", "continuous deployment"], have: true, evidence: "Git / CI-CD is listed in the tools stack, and the portfolio now includes the GitHub Foundations credential." },
    { name: "Node.js", aliases: ["node.js", "nodejs", "node js"], have: false },
    { name: "C++", aliases: ["c++", "cpp"], have: false }
  ];

  function normalizedText(text) {
    return " " + text.toLowerCase().replace(/[\n\r\t,;:()\[\]{}]/g, " ").replace(/\s+/g, " ") + " ";
  }

  function containsAlias(text, alias) {
    var normalizedAlias = alias.toLowerCase();
    if (normalizedAlias.trim().length <= 2 && normalizedAlias.indexOf(" ") === -1) {
      var escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp("(^|\\W)" + escaped + "($|\\W)", "i").test(text);
    }
    return text.indexOf(normalizedAlias) !== -1;
  }

  function extractYearsRequirement(rawText) {
    var patterns = [
      /(\d+(?:\.\d+)?)\s*\+?\s*(?:years|year|yrs|yr)\s+(?:of\s+)?(?:professional\s+)?experience/i,
      /(?:minimum|min\.?|at least)\s+(\d+(?:\.\d+)?)\s*(?:years|year|yrs|yr)/i,
      /(\d+(?:\.\d+)?)\s*\+\s*(?:years|year|yrs|yr)/i
    ];
    for (var i = 0; i < patterns.length; i += 1) {
      var match = rawText.match(patterns[i]);
      if (match) return parseFloat(match[1]);
    }
    return null;
  }

  function renderTag(container, label) {
    var tag = document.createElement("span");
    tag.textContent = label;
    container.appendChild(tag);
  }

  function analyzeJobDescription() {
    if (!jdInput) return;
    var raw = jdInput.value.trim();
    if (!raw) {
      jdInput.focus();
      return;
    }

    var text = normalizedText(raw);
    var recognized = [];
    var matched = [];
    var missing = [];

    competencyMap.forEach(function (competency) {
      var found = competency.aliases.some(function (alias) { return containsAlias(text, alias); });
      if (!found) return;
      recognized.push(competency);
      if (competency.have) matched.push(competency);
      else missing.push(competency);
    });

    var score = recognized.length ? Math.round((matched.length / recognized.length) * 100) : 0;
    var yearsRequired = extractYearsRequirement(raw);

    if (matcherEmpty) matcherEmpty.hidden = true;
    if (matcherResults) matcherResults.hidden = false;
    if (matchScore) matchScore.textContent = score + "%";
    if (scoreRing) scoreRing.style.setProperty("--score", (score * 3.6) + "deg");

    var label;
    if (!recognized.length) label = "Add more technical detail";
    else if (score >= 80) label = "Strong evidence alignment";
    else if (score >= 60) label = "Good evidence alignment";
    else if (score >= 40) label = "Partial evidence alignment";
    else label = "Limited evidence alignment";
    if (matchLabel) matchLabel.textContent = label;

    var summary;
    if (!recognized.length) {
      summary = "I could not identify enough technical requirements from the controlled skill set. Add the stack, tools, or engineering requirements to get a more useful comparison.";
    } else {
      summary = "Matched " + matched.length + " of " + recognized.length + " recognized technical requirements from the job description.";
      if (missing.length) summary += " " + missing.length + " requirement" + (missing.length === 1 ? " is" : "s are") + " not explicitly evidenced on this portfolio.";
    }
    if (matchSummary) matchSummary.textContent = summary;

    if (matchedSkills) matchedSkills.innerHTML = "";
    if (missingSkills) missingSkills.innerHTML = "";
    if (evidenceList) evidenceList.innerHTML = "";

    if (matched.length) {
      matched.forEach(function (item) {
        renderTag(matchedSkills, item.name);
        if (item.evidence) {
          var li = document.createElement("li");
          li.textContent = item.name + " — " + item.evidence;
          evidenceList.appendChild(li);
        }
      });
    } else {
      renderTag(matchedSkills, "No recognized matches yet");
    }

    if (missing.length) {
      missing.forEach(function (item) { renderTag(missingSkills, item.name); });
    } else {
      renderTag(missingSkills, recognized.length ? "No recognized gaps in this comparison" : "Not enough requirements recognized");
    }

    var recruiterBrief = "";
    if (!recognized.length) {
      recruiterBrief = "Add a more technical job description to generate an evidence-backed recruiter brief.";
    } else {
      var topMatches = matched.slice(0, 5).map(function (item) { return item.name; });
      var topGaps = missing.slice(0, 3).map(function (item) { return item.name; });
      var matchedLower = matched.map(function (item) { return item.name.toLowerCase(); }).join(" ");
      var sources = [];
      if (/llm|rag|prompt|evaluation|guardrail|experimental|fastapi|testing/.test(matchedLower)) sources.push("AI Learning Research");
      if (/llm|rag|llamaindex|next|javascript|typescript/.test(matchedLower)) sources.push("Reflct");
      if (/fastapi|rest|docker|flutter|react|python/.test(matchedLower)) sources.push("professional engineering experience");
      if (/flask|rest|docker|python/.test(matchedLower)) sources.push("Mabros Couriers");
      if (/machine learning|scikit/.test(matchedLower)) sources.push("Bank Marketing Prediction");
      sources = sources.filter(function (item, idx, arr) { return arr.indexOf(item) === idx; }).slice(0, 4);

      recruiterBrief = topMatches.length
        ? "Strongest alignment is around " + topMatches.join(", ") + ". "
        : "The controlled matcher found limited explicit overlap. ";
      if (sources.length) recruiterBrief += "The clearest supporting evidence comes from " + sources.join(", ") + ". ";
      recruiterBrief += topGaps.length
        ? "Potential gaps to validate in interview: " + topGaps.join(", ") + "."
        : "No recognized technical gaps were found in the terms this matcher understands.";
    }
    if (recruiterBriefText) recruiterBriefText.textContent = recruiterBrief;

    if (experienceWarning) {
      if (yearsRequired && yearsRequired > PROFILE_YEARS) {
        experienceWarning.hidden = false;
        experienceWarning.textContent = "Experience note: this JD appears to request about " + yearsRequired + "+ years. The public portfolio currently evidences roughly " + PROFILE_YEARS + "+ years of engineering experience, so tenure may be a gap even where the technical stack aligns.";
      } else {
        experienceWarning.hidden = true;
        experienceWarning.textContent = "";
      }
    }

    var matchedNames = matched.map(function (item) { return item.name; }).join(", ") || "none recognized";
    var missingNames = missing.map(function (item) { return item.name; }).join(", ") || "none among recognized terms";
    lastSummaryText = "Portfolio evidence match: " + score + "%\nMatched: " + matchedNames + "\nNot explicitly evidenced: " + missingNames + "\nRecruiter brief: " + recruiterBrief + (yearsRequired && yearsRequired > PROFILE_YEARS ? "\nExperience note: JD appears to request " + yearsRequired + "+ years while this portfolio currently evidences about " + PROFILE_YEARS + "+ years." : "");
  }

  if (analyzeButton) analyzeButton.addEventListener("click", analyzeJobDescription);
  if (clearJdButton) {
    clearJdButton.addEventListener("click", function () {
      jdInput.value = "";
      if (matcherResults) matcherResults.hidden = true;
      if (matcherEmpty) matcherEmpty.hidden = false;
      lastSummaryText = "";
      jdInput.focus();
    });
  }
  if (jdInput) {
    jdInput.addEventListener("keydown", function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        analyzeJobDescription();
      }
    });
  }
  if (copySummaryButton) {
    copySummaryButton.addEventListener("click", function () {
      if (!lastSummaryText) return;
      navigator.clipboard.writeText(lastSummaryText).then(function () {
        var original = copySummaryButton.textContent;
        copySummaryButton.textContent = "Copied";
        window.setTimeout(function () { copySummaryButton.textContent = original; }, 1200);
      }).catch(function () {
        copySummaryButton.textContent = "Copy unavailable";
      });
    });
  }

  /* ---------------------------------
     Credential image viewer
  ---------------------------------- */
  var credentialDialog = document.getElementById("credential-dialog");
  var credentialDialogImage = document.getElementById("credential-dialog-image");
  var credentialDialogTitle = document.getElementById("credential-dialog-title");
  var credentialDialogClose = document.getElementById("credential-dialog-close");
  var credentialImageButtons = document.querySelectorAll("[data-credential-image]");

  function closeCredentialDialog() {
    if (credentialDialog && credentialDialog.open) credentialDialog.close();
  }

  credentialImageButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (!credentialDialog || !credentialDialogImage) return;
      var src = button.getAttribute("data-credential-image");
      var title = button.getAttribute("data-credential-title") || "Credential preview";
      credentialDialogImage.src = src;
      credentialDialogImage.alt = title;
      if (credentialDialogTitle) credentialDialogTitle.textContent = title;
      if (typeof credentialDialog.showModal === "function") credentialDialog.showModal();
    });
  });

  if (credentialDialogClose) credentialDialogClose.addEventListener("click", closeCredentialDialog);
  if (credentialDialog) {
    credentialDialog.addEventListener("click", function (event) {
      if (event.target === credentialDialog) closeCredentialDialog();
    });
  }

  /* ---------------------------------
     Copy email
  ---------------------------------- */
  var copyEmailButton = document.getElementById("copy-email");
  if (copyEmailButton) {
    copyEmailButton.addEventListener("click", function () {
      var email = "myaseenliaqat94@gmail.com";
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(email).then(function () {
        var original = copyEmailButton.textContent;
        copyEmailButton.textContent = "Copied";
        window.setTimeout(function () { copyEmailButton.textContent = original; }, 1200);
      });
    });
  }

  /* ---------------------------------
     Footer year
  ---------------------------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
