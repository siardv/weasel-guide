/* weasel decision guide — tree data + ui controller */

const TREE = {
  start: {
    title: "Data source",
    question: "Are you working with your own longitudinal panel data, or would you like to begin with synthetic example data?",
    explanation: "This initial choice determines whether weasel is configured around your actual research data or used in a learning mode via its built-in data generator. The package supports both: its pipelines are structurally identical regardless of data origin.",
    options: [
      {
        label: "I have my own data",
        hint: "Your data should be a long-format data frame with at minimum one respondent identifier column and one wave or time column.",
        next: "goal_own"
      },
      {
        label: "I want to use synthetic example data",
        hint: "generate_weasel_dummy_data() creates a realistic panel with four layered missingness mechanisms: random, attention-decay, attrition, and block dropout.",
        next: "dummy_config"
      }
    ]
  },

  dummy_config: {
    title: "Synthetic data scale",
    question: "What scale of synthetic data do you need?",
    explanation: "The data generator accepts arguments for respondent count, number of waves, variables, and missingness parameters. Smaller datasets run instantly and are suited to learning the pipeline logic; larger datasets better reflect the missingness dynamics of real panel studies.",
    options: [
      {
        label: "Small (< 100 respondents) — quick exploration",
        hint: "generate_weasel_dummy_data(n_ids = 50, n_times = 8, seed = 1). Useful for testing each pipeline step without delay.",
        next: "goal_dummy"
      },
      {
        label: "Realistic scale (500–1 000 respondents)",
        hint: "generate_weasel_dummy_data(n_ids = 1000, n_times = 13, seed = 42). The default configuration; reflects realistic missingness distributions.",
        next: "goal_dummy"
      }
    ]
  },

  goal_own: {
    title: "Analytic goal",
    question: "What is your primary analytic goal with this dataset?",
    explanation: "Weasel supports two complementary workflows. The scope pipeline is built for interactive, step-by-step exploration of response patterns without committing to a selection rule. The plan pipeline is designed for structured scenario comparison, scoring, and reproducible documentation of a final selection decision.",
    options: [
      {
        label: "Explore missingness and wave-presence patterns in my data",
        hint: "You want to understand which wave combinations are most common before deciding on a selection rule.",
        next: "scope_range"
      },
      {
        label: "Compare scenario-based selection rules and commit to one",
        hint: "You need to evaluate different missingness tolerances and endpoint requirements, and document the resulting trade-off between sample size and data quality.",
        next: "plan_span"
      },
      {
        label: "Both: explore first, then formalize a selection rule",
        hint: "The recommended approach for unfamiliar data — run the scope pipeline to understand the pattern landscape, then switch to the plan pipeline for a structured, documented decision.",
        next: "combined"
      }
    ]
  },

  goal_dummy: {
    title: "Learning goal",
    question: "Which aspect of weasel would you like to explore with your synthetic data?",
    explanation: "Synthetic data lets you exercise every component of the package under controlled conditions. Choose a direction based on what you are trying to learn about the pipeline.",
    options: [
      {
        label: "Learn the scope pipeline (pattern inspection)",
        hint: "Walk through set_weasel_scope → reshape_to_wide → summarize_waves → filter_wave_summary → get_data_by_row.",
        next: "scope_range"
      },
      {
        label: "Learn the plan pipeline (scenario comparison)",
        hint: "Walk through weasel_plan → weasel_compare_scenarios → weasel_summarize_subset → weasel_apply.",
        next: "plan_span"
      },
      {
        label: "Run the full built-in demonstration",
        hint: "weasel_example() exercises both pipelines on a single synthetic dataset and prints formatted output at each stage.",
        next: "terminal_example"
      }
    ]
  },

  scope_range: {
    title: "Wave range",
    question: "Do you want to restrict the analysis to a specific subset of waves?",
    explanation: "The scope pipeline requires a defined wave window. Setting explicit bounds focuses pattern detection on the analytically relevant portion of the panel and drops respondents observed only outside that range. If no bounds are given, weasel infers them automatically from the data.",
    options: [
      {
        label: "Yes — I will set explicit lower and/or upper bounds",
        hint: "Pass lower = and/or upper = to set_weasel_scope(). Waves outside this range are excluded before the presence matrix is built.",
        next: "scope_extract"
      },
      {
        label: "No — use the full observed wave range",
        hint: "Leave lower and upper as NULL. evaluate_weasel_scope() will infer the bounds from the minimum and maximum values in the wave column.",
        next: "scope_extract"
      }
    ]
  },

  scope_extract: {
    title: "Extraction goal",
    question: "What do you want to do after identifying the wave patterns?",
    explanation: "Once respondents are grouped by their observed-wave fingerprint and the pattern summary is available, you have two retrieval options. Filtering restricts the summary table to patterns meeting a minimum respondent threshold; extraction pulls the original long-format rows for a specific pattern by its row index.",
    options: [
      {
        label: "Filter the summary to patterns with a minimum respondent count",
        hint: "filter_wave_summary(ids_range = c(5, Inf)) retains only patterns shared by at least 5 respondents. Adjust the lower bound as needed.",
        next: "terminal_scope_filter"
      },
      {
        label: "Extract long-format data for a specific pattern",
        hint: "get_data_by_row(1) returns the original long-format rows for all respondents matching the most common pattern (row 1 of the summary).",
        next: "terminal_scope_extract"
      },
      {
        label: "Both: filter the summary, then extract from a specific row",
        hint: "Filter first to narrow the candidate list, note the row index of interest from the filtered table, then call get_data_by_row(i).",
        next: "terminal_scope_both"
      }
    ]
  },

  plan_span: {
    title: "Wave span strategy",
    question: "How do you want to define the analysis window for scenario comparison?",
    explanation: "The plan pipeline can operate across all observed waves (full span) or automatically identify the highest-coverage consecutive window of a target length (core span). The core strategy is recommended when your model requires a fixed number of measurement occasions and you want the densest available window.",
    options: [
      {
        label: "Core span — find the highest-coverage window of fixed length",
        hint: "span = \"core\", core_len = 6L (default). Weasel selects the L consecutive waves with the highest mean respondent coverage.",
        next: "plan_scenarios"
      },
      {
        label: "Full span — use all available waves",
        hint: "span = \"full\". Covers the complete observed wave range. Suitable when your model tolerates variable observation windows or when you need maximum longitudinal depth.",
        next: "plan_scenarios"
      }
    ]
  },

  plan_scenarios: {
    title: "Scenario definition",
    question: "Do you want to use weasel's three built-in scenarios or define your own?",
    explanation: "The built-in scenarios range from conservative to permissive and are designed to cover the most common research needs. Custom scenarios are appropriate when you have specific substantive reasons to deviate — for example, when your study design has a known acceptable gap structure or when endpoint presence cannot be guaranteed by design.",
    options: [
      {
        label: "Use the three built-in scenarios",
        hint: "anchored_strict (no missing, endpoints required), anchored_balanced (≤1 missing, ≤1 gap), lenient_info_max (≤2 missing, no endpoint requirement).",
        next: "plan_justify"
      },
      {
        label: "Define custom scenarios",
        hint: "Pass a data frame with columns scenario, require_endpoints, max_missing, n_gap_max, max_gap_max to the scenarios = argument of weasel_plan().",
        next: "plan_justify"
      }
    ]
  },

  plan_justify: {
    title: "Methods documentation",
    question: "Do you need a prose paragraph for your methods section documenting the selection?",
    explanation: "`weasel_justify_subset()` generates a ready-to-paste paragraph referencing the wave window, structural constraints, sample size, and coverage diagnostics of a chosen scenario. Three verbosity levels are available: a full methods-section paragraph, a concise summary for pre-registration or supplementary material, and an extended rationale with sensitivity framing.",
    options: [
      {
        label: "Yes — generate a methods-section paragraph",
        hint: "Choose style = \"methods\" (full), \"concise\" (2–3 sentences), or \"extended\" (detailed rationale). Supply author = and year = for a formal in-text citation.",
        next: "terminal_plan_justify"
      },
      {
        label: "No — I only need the filtered data frame",
        hint: "`weasel_apply(plan_obj, scenario)` returns the analysis-ready long-format data frame directly, with no prose output required.",
        next: "terminal_plan_nojustify"
      }
    ]
  },

  combined: {
    title: "Transition point",
    question: "At which point do you want to switch from exploratory to formal analysis?",
    explanation: "Both pipelines are designed to be complementary and share the same input data. A practical sequence is to run the scope pipeline until you have a clear picture of the missingness landscape, then initialize weasel_plan() to score scenarios against what you observed.",
    options: [
      {
        label: "After viewing the wave pattern distribution",
        hint: "Run scope through summarize_waves(), then call weasel_plan() to evaluate scenarios against the pattern landscape you observed.",
        next: "terminal_combined_early"
      },
      {
        label: "After extracting and inspecting a candidate pattern subset",
        hint: "Use get_data_by_row() to examine a first candidate, then formalize the decision across all respondents using weasel_plan().",
        next: "terminal_combined_late"
      }
    ]
  },

  /* ── terminal nodes ── */

  terminal_example: {
    terminal: true,
    title: "Full demonstration",
    subtitle: "weasel_example(seed = 42)",
    description: "Runs both pipelines end-to-end on synthetic data, printing formatted output at each step. Suitable as a smoke-test after installation and as a learning walkthrough.",
    steps: [
      { fn: "d <- generate_weasel_dummy_data(seed = 42)", note: "creates synthetic panel" },
      { fn: "set_weasel_scope(d, \"id\", \"time\", gap = 2, upper = 12)", note: "scope pipeline: bind data" },
      { fn: "reshape_to_wide()", note: "build presence matrix" },
      { fn: "summarize_waves()", note: "group by wave fingerprint" },
      { fn: "weasel_print_table(filter_wave_summary(), n = 10)", note: "inspect top patterns" },
      { fn: "p <- weasel_plan(d, \"id\", \"time\", span = \"core\")", note: "plan pipeline: score scenarios" },
      { fn: "cmp <- weasel_compare_scenarios(p)", note: "ranked scenario table" },
      { fn: "weasel_justify_subset(p, \"anchored_balanced\")", note: "methods paragraph" }
    ],
    note: "Alternatively call `weasel_example()` directly to execute all of the above with formatted output."
  },

  terminal_scope_filter: {
    terminal: true,
    title: "Scope pipeline — pattern filtering",
    subtitle: "Inspect prevalent response patterns",
    description: "Use this pathway when your goal is to understand the distribution of wave-presence patterns and identify which patterns are shared by enough respondents to be analytically viable.",
    steps: [
      { fn: "set_weasel_scope(data, \"id\", \"time\", upper = N)", note: "bind data, set wave range" },
      { fn: "evaluate_weasel_scope()", note: "resolve bounds explicitly" },
      { fn: "reshape_to_wide()", note: "build respondent × wave matrix" },
      { fn: "summarize_waves()", note: "group respondents by wave fingerprint" },
      { fn: "filter_wave_summary(ids_range = c(5, Inf))", note: "retain patterns with ≥ 5 respondents" },
      { fn: "weasel_print_table(filter_wave_summary(), title = \"Patterns\")", note: "display filtered results" }
    ],
    note: "Adjust `ids_range` as needed. Omit it entirely to view all patterns."
  },

  terminal_scope_extract: {
    terminal: true,
    title: "Scope pipeline — data extraction",
    subtitle: "Retrieve long-format data for a specific pattern",
    description: "Use this pathway when you want the raw data for respondents sharing a particular wave-presence fingerprint — for example, the most common complete-observation pattern.",
    steps: [
      { fn: "set_weasel_scope(data, \"id\", \"time\", upper = N)", note: "bind data, set wave range" },
      { fn: "evaluate_weasel_scope()", note: "resolve bounds" },
      { fn: "reshape_to_wide()", note: "build presence matrix" },
      { fn: "summarize_waves()", note: "group by wave fingerprint" },
      { fn: "subset1 <- get_data_by_row(1)", note: "extract data for most common pattern" },
      { fn: "weasel_print_table(head(subset1, 10), title = \"Preview\")", note: "inspect extracted subset" }
    ],
    note: "Change the index `i` in `get_data_by_row(i)` to target any row from the pattern summary."
  },

  terminal_scope_both: {
    terminal: true,
    title: "Scope pipeline — filter then extract",
    subtitle: "Narrow candidates, then extract by row index",
    description: "Filter the pattern summary to a manageable set of candidates, then extract data for the specific pattern that best matches your analytic needs.",
    steps: [
      { fn: "set_weasel_scope(data, \"id\", \"time\", upper = N)", note: "bind data, set range" },
      { fn: "reshape_to_wide()", note: "build presence matrix" },
      { fn: "summarize_waves()", note: "group by wave fingerprint" },
      { fn: "v <- filter_wave_summary(ids_range = c(5, Inf))", note: "narrow to common patterns" },
      { fn: "weasel_print_table(v, title = \"Filtered patterns\")", note: "note the row index i of interest" },
      { fn: "subset_i <- get_data_by_row(i)", note: "extract data for chosen pattern" }
    ],
    note: "The row index `i` refers to the position in the full (unfiltered) summary, not the filtered view. Inspect `v` to identify the correct `i`."
  },

  terminal_plan_justify: {
    terminal: true,
    title: "Plan pipeline — with methods documentation",
    subtitle: "Compare scenarios, extract data, and generate prose",
    description: "The complete plan pipeline pathway: score scenarios against the data, audit the chosen scenario's coverage properties, extract the analysis-ready data frame, and generate a reproducible methods paragraph.",
    steps: [
      { fn: "p <- weasel_plan(data, \"id\", \"time\", span = \"core\")", note: "build and score three scenarios" },
      { fn: "cmp <- weasel_compare_scenarios(p)", note: "inspect scored comparison table" },
      { fn: "weasel_print_table(cmp, title = \"Scenario comparison\")", note: "display results" },
      { fn: "s <- weasel_summarize_subset(p, \"anchored_balanced\", data, \"id\", \"time\")", note: "audit chosen scenario" },
      { fn: "weasel_print_table(s$per_wave_coverage, title = \"Coverage\")", note: "per-wave coverage check" },
      { fn: "analysis_data <- weasel_apply(p, \"anchored_balanced\")", note: "extract filtered data" },
      { fn: "cat(weasel_justify_subset(p, \"anchored_balanced\"), \"\\n\")", note: "generate methods paragraph" }
    ],
    note: "Replace `\"anchored_balanced\"` with the scenario name from `cmp$scenario[cmp$recommended]` to use the auto-recommended scenario."
  },

  terminal_plan_nojustify: {
    terminal: true,
    title: "Plan pipeline — data extraction",
    subtitle: "Compare scenarios and extract the filtered data frame",
    description: "A focused version of the plan pipeline that scores scenarios and produces the analysis-ready data frame without generating prose output.",
    steps: [
      { fn: "p <- weasel_plan(data, \"id\", \"time\", span = \"core\")", note: "build and score scenarios" },
      { fn: "cmp <- weasel_compare_scenarios(p)", note: "compare scenarios" },
      { fn: "cat(weasel_compare_to_sentence(cmp), \"\\n\")", note: "print summary sentence" },
      { fn: "analysis_data <- weasel_apply(p, \"anchored_balanced\")", note: "extract filtered data" },
      { fn: "dim(analysis_data)", note: "verify dimensions of result" }
    ],
    note: "`weasel_compare_to_sentence()` produces a single natural-language sentence summarizing the comparison — useful for quick console output."
  },

  terminal_combined_early: {
    terminal: true,
    title: "Combined workflow — explore, then plan",
    subtitle: "Scope pipeline → Plan pipeline",
    description: "The recommended workflow for an unfamiliar dataset. Use the scope pipeline to orient yourself to the missingness landscape, then apply the plan pipeline for a structured, documented selection decision.",
    steps: [
      { fn: "set_weasel_scope(data, \"id\", \"time\", upper = N)", note: "scope pipeline: bind data" },
      { fn: "reshape_to_wide() → summarize_waves()", note: "pattern detection" },
      { fn: "weasel_print_table(filter_wave_summary(), n = 10)", note: "understand pattern landscape" },
      { fn: "p <- weasel_plan(data, \"id\", \"time\", span = \"core\")", note: "switch to plan pipeline" },
      { fn: "cmp <- weasel_compare_scenarios(p)", note: "score and rank scenarios" },
      { fn: "analysis_data <- weasel_apply(p, \"anchored_balanced\")", note: "extract final subset" },
      { fn: "cat(weasel_justify_subset(p, \"anchored_balanced\"))", note: "document the selection" }
    ],
    note: "The two pipelines share no state — you can run them in any order on the same data object."
  },

  terminal_combined_late: {
    terminal: true,
    title: "Combined workflow — extract candidate, then formalize",
    subtitle: "Scope pipeline (with extraction) → Plan pipeline",
    description: "Extract a candidate subset from the scope pipeline to inspect it concretely, then use the plan pipeline to evaluate the decision systematically across all respondents and produce formal documentation.",
    steps: [
      { fn: "set_weasel_scope(data, \"id\", \"time\", upper = N)", note: "scope pipeline" },
      { fn: "reshape_to_wide() → summarize_waves()", note: "pattern detection" },
      { fn: "candidate <- get_data_by_row(1)", note: "inspect leading pattern concretely" },
      { fn: "p <- weasel_plan(data, \"id\", \"time\", span = \"core\")", note: "formalize with plan pipeline" },
      { fn: "rec <- weasel_compare_scenarios(p)", note: "score all scenarios" },
      { fn: "analysis_data <- weasel_apply(p, rec$scenario[rec$recommended])", note: "extract recommended subset" },
      { fn: "cat(weasel_justify_subset(p, rec$scenario[rec$recommended]))", note: "generate methods paragraph" }
    ],
    note: "Using `rec$scenario[rec$recommended]` dynamically selects the highest-scoring scenario rather than hard-coding a name."
  }
};

/* ── state ── */
let history = [];   // array of { nodeId, choiceLabel }
let currentId = "start";

/* ── dom refs ── */
const intro       = document.getElementById("intro");
const treeSection = document.getElementById("tree-section");
const nodeCard    = document.getElementById("node-card");
const breadcrumb  = document.getElementById("breadcrumb");
const btnStart    = document.getElementById("btn-start");
const btnBack     = document.getElementById("btn-back");
const btnRestart  = document.getElementById("btn-restart");

/* ── bootstrap ── */
btnStart.addEventListener("click", () => {
  intro.classList.add("fade-out");
  setTimeout(() => {
    intro.classList.add("hidden");
    treeSection.classList.remove("hidden");
    treeSection.classList.add("fade-in");
    renderNode("start");
  }, 320);
});

btnBack.addEventListener("click", () => {
  if (history.length === 0) return;
  const prev = history.pop();
  currentId = prev.nodeId;
  renderNode(currentId, "back");
  updateBreadcrumb();
  updateNav();
});

btnRestart.addEventListener("click", () => {
  history = [];
  currentId = "start";
  renderNode("start", "back");
  updateBreadcrumb();
  updateNav();
  // optionally return to intro
});

/* ── render ── */
function renderNode(id, direction = "forward") {
  const node = TREE[id];
  if (!node) return;
  currentId = id;

  // animate out
  nodeCard.classList.add(direction === "back" ? "slide-out-right" : "slide-out-left");

  setTimeout(() => {
    nodeCard.innerHTML = node.terminal ? buildTerminal(node) : buildQuestion(node);
    nodeCard.classList.remove("slide-out-left", "slide-out-right");
    nodeCard.classList.add(direction === "back" ? "slide-in-left" : "slide-in-right");
    setTimeout(() => nodeCard.classList.remove("slide-in-right", "slide-in-left"), 350);

    // attach option click handlers
    if (!node.terminal) {
      nodeCard.querySelectorAll(".option-btn").forEach((btn, i) => {
        btn.addEventListener("click", () => {
          const opt = node.options[i];
          history.push({ nodeId: id, choiceLabel: opt.label });
          renderNode(opt.next);
          updateBreadcrumb();
          updateNav();
        });
      });
    }
  }, 250);
}

function buildQuestion(node) {
  return `
    <div class="node-header">
      <span class="node-step">Step ${history.length + 1}</span>
      <h2 class="node-title">${node.title}</h2>
    </div>
    <p class="node-question">${node.question}</p>
    <p class="node-explanation">${inlineCode(node.explanation)}</p>
    <div class="options-list">
      ${node.options.map((opt, i) => `
        <button class="option-btn" data-index="${i}">
          <div class="option-label">${opt.label}</div>
          <div class="option-hint">${opt.hint}</div>
          <span class="option-arrow">→</span>
        </button>
      `).join("")}
    </div>
  `;
}

function buildTerminal(node) {
  const stepsHtml = node.steps.map((s, i) => `
    <div class="workflow-step">
      <span class="step-num">${String(i + 1).padStart(2, "0")}</span>
      <div class="step-content">
        <code class="step-fn">${escapeHtml(s.fn)}</code>
        <span class="step-note">${s.note}</span>
      </div>
    </div>
  `).join("");

  const noteHtml = node.note
    ? `<p class="terminal-note">${inlineCode(node.note)}</p>`
    : "";

  return `
    <div class="node-header terminal-header">
      <span class="node-step terminal-badge">Recommended pathway</span>
      <h2 class="node-title">${node.title}</h2>
      <p class="terminal-subtitle">${node.subtitle}</p>
    </div>
    <p class="node-explanation">${inlineCode(node.description)}</p>
    <div class="workflow-block">
      <div class="workflow-label">R workflow
        <button class="btn-copy" id="btn-copy" aria-label="Copy code to clipboard">
          <span class="btn-copy-icon">⎘</span>
          <span class="btn-copy-text">Copy</span>
        </button>
      </div>
      <div class="workflow-steps">${stepsHtml}</div>
    </div>
    ${noteHtml}
    <div class="terminal-actions">
      <button class="btn-action" id="btn-new-path">Explore another pathway <span class="btn-action-arrow">→</span></button>
    </div>
  `;
}

/* ── breadcrumb ── */
function updateBreadcrumb() {
  if (history.length === 0) {
    breadcrumb.innerHTML = "";
    return;
  }
  const crumbs = history.map((h, i) => {
    const label = TREE[h.nodeId]?.title || h.nodeId;
    return `<span class="crumb">${label}</span><span class="crumb-sep">›</span>`;
  });
  breadcrumb.innerHTML = crumbs.join("") +
    `<span class="crumb crumb-current">${TREE[currentId]?.title || currentId}</span>`;
}

/* ── nav ── */
function updateNav() {
  btnBack.classList.toggle("hidden", history.length === 0);
}

/* ── delegate terminal actions (rendered after innerHTML set) ── */
nodeCard.addEventListener("click", (e) => {
  if (e.target.closest("#btn-new-path")) {
    history = [];
    currentId = "start";
    renderNode("start", "back");
    updateBreadcrumb();
    updateNav();
  }

  const copyBtn = e.target.closest("#btn-copy");
  if (copyBtn) {
    const node = TREE[currentId];
    if (!node?.steps) return;
    const code = node.steps.map(s => `${s.fn}  # ${s.note}`).join("\n");
    navigator.clipboard.writeText(code).then(() => {
      const label = copyBtn.querySelector(".btn-copy-text");
      label.textContent = "Copied!";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        label.textContent = "Copy";
        copyBtn.classList.remove("copied");
      }, 2000);
    }).catch(() => {
      // fallback for browsers without clipboard API
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
  }
});

/* ── utils ── */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// converts `backtick spans` to inline <code> elements
function inlineCode(str) {
  return str.replace(/`([^`]+)`/g, "<code class=\"inline-code\">$1</code>");
}
