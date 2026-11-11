const $ = (id) => document.getElementById(id);
const previewView =
  location.protocol === "file:" ? new URLSearchParams(location.search).get("preview") : null;
const previewMode = previewView === "status" || previewView === "setup";
const connectedPreviewState = {
  config: {
    handle: "Tushal_007",
    codechefHandle: "tushallohar",
    gfgHandle: "tushallohar",
    repo: "testxyz",
    owner: "tushallohar",
    platforms: {
      codeforces: true,
      leetcode: true,
      cses: true,
      codechef: true,
      gfg: true,
    },
    setupComplete: true,
    hasToken: true,
    repoVisibilityConfirmed: true,
  },
  session: { cfOk: true, lcOk: true, csesOk: true, codechefOk: true, gfgOk: true },
  projectRepoStarred: false,
};
const previewState =
  previewView === "setup"
    ? {
        config: {
          handle: "",
          codechefHandle: "",
          gfgHandle: "",
          repo: "CP-Solutions",
          owner: "",
          platforms: {
            codeforces: false,
            leetcode: true,
            cses: true,
            codechef: false,
            gfg: false,
          },
          setupComplete: false,
          hasToken: false,
        },
        session: {},
      }
    : connectedPreviewState;
const send = previewMode
  ? async (msg) => {
      if (msg.type === "status") return previewState;
      if (msg.type === "star-project-repo") return { ok: true, starred: true };
      return { ok: true };
    }
  : (msg) => chrome.runtime.sendMessage(msg);
let editing = false;
let setupPopulated = false;

const accountPlatformFields = [
  ["platformCF", "handle"],
  ["platformCodeChef", "codechefHandle"],
  ["platformGFG", "gfgHandle"],
];

function syncAccountFieldStates() {
  for (const [platformId, fieldId] of accountPlatformFields) {
    const enabled = $(platformId).checked;
    const field = $(fieldId);
    field.disabled = !enabled;
    field.setAttribute("aria-disabled", String(!enabled));
  }
}

function populateForm(config) {
  if (!config) return;
  $("handle").value = config.handle || "";
  $("codechefHandle").value = config.codechefHandle || "";
  $("gfgHandle").value = config.gfgHandle || "";
  $("repo").value = config.repo || "CP-Solutions";
  $("repoPublicConsent").checked = Boolean(
    config.repoVisibilityConfirmed || config.setupComplete !== false,
  );
  $("platformCF").checked = config.platforms?.codeforces !== false;
  $("platformLC").checked = config.platforms?.leetcode !== false;
  $("platformCSES").checked = config.platforms?.cses !== false;
  $("platformCodeChef").checked = config.platforms?.codechef !== false;
  $("platformGFG").checked = config.platforms?.gfg !== false;
  syncAccountFieldStates();
}

function renderGithubStatus(config) {
  const statusEl = $("githubStatus");
  const connectBtn = $("githubConnect");
  const saveBtn = $("save");
  const connected = Boolean(config && config.hasToken && config.owner);
  if (statusEl) {
    statusEl.textContent = connected ? `Connected as ${config.owner}` : "Not connected";
    statusEl.className = `github-status ${connected ? "connected" : "not-connected"}`;
  }
  if (connectBtn) {
    connectBtn.textContent = connected ? "Reconnect" : "Connect GitHub";
    connectBtn.disabled = false;
  }
  if (saveBtn) {
    saveBtn.textContent = connected ? "Save Changes" : "Connect GitHub & Save";
  }
}

function isSetupFlowActive(flow) {
  return Boolean(flow && ["authorizing", "saving", "finalizing"].includes(flow.status));
}

function renderSetupFlow(flow) {
  const active = isSetupFlowActive(flow);
  const failed = flow?.status === "failed";
  const banner = $("setupError");
  const saveButton = $("save");
  const connectButton = $("githubConnect");

  if (active) {
    const messages = {
      authorizing:
        "GitHub authorization is in progress. Complete the GitHub window, then return to SolveBase.",
      saving: "Saving your SolveBase settings...",
      finalizing: "GitHub connected. Preparing your repository...",
    };
    const buttonLabels = {
      authorizing: "Authorizing GitHub...",
      saving: "Saving settings...",
      finalizing: "Preparing repository...",
    };
    banner.textContent = messages[flow.status];
    banner.classList.remove("hidden");
    banner.classList.add("progress-banner");
    saveButton.disabled = true;
    connectButton.disabled = true;
    saveButton.textContent = buttonLabels[flow.status];
    connectButton.textContent = flow.status === "authorizing" ? "Authorizing..." : "Please wait...";
    return;
  }

  banner.classList.remove("progress-banner");
  saveButton.disabled = false;
  connectButton.disabled = false;
  if (failed) {
    banner.textContent = flow.error || "GitHub setup failed. Try again.";
    banner.classList.remove("hidden");
  } else if (flow?.status === "complete") {
    banner.classList.add("hidden");
  }
}

function renderStarState(starred, connected) {
  const button = $("starRepo");
  if (!button) return;
  button.classList.toggle("is-starred", starred);
  button.classList.remove("is-loading");
  button.disabled = starred || !connected;
  button.setAttribute("aria-pressed", String(starred));
  button.setAttribute(
    "aria-label",
    starred ? "SolveBase is starred on GitHub" : "Star SolveBase on GitHub",
  );
  button.title = starred
    ? "SolveBase is starred"
    : connected
      ? "Star SolveBase"
      : "Connect GitHub to star SolveBase";
}

function render(state) {
  if (!state) return;
  const config = state.config;
  const setupFlow = state.setupFlow;
  const configured = Boolean(
    config && config.hasToken && config.owner && config.setupComplete !== false,
  );
  const setupFlowVisible = isSetupFlowActive(setupFlow) || setupFlow?.status === "failed";
  renderStarState(state.projectRepoStarred === true, configured);
  $("setup").classList.toggle("hidden", configured && !editing && !setupFlowVisible);
  $("status").classList.toggle("hidden", !configured || editing || setupFlowVisible);
  $("cancelEdit").classList.toggle("hidden", !configured || !editing);

  renderGithubStatus(config);
  renderSetupFlow(setupFlow);

  const session = state.session || {};
  const cfOk = session.cfOk;
  const lcOk = session.lcOk;
  const csesOk = session.csesOk;
  const codechefOk = session.codechefOk;
  const gfgOk = session.gfgOk;
  const anyBad =
    cfOk === false || lcOk === false || csesOk === false || codechefOk === false || gfgOk === false;

  const statusDot = $("statusDot");
  const statusText = $("statusText");
  if (statusDot) {
    statusDot.className = `status-dot ${anyBad ? "bad" : cfOk === true || lcOk === true || csesOk === true || codechefOk === true || gfgOk === true ? "ok" : ""}`;
  }
  if (statusText) {
    statusText.textContent = anyBad ? "Auth Required" : configured ? "Live" : "Setup Required";
  }

  const banner = $("banner");
  if (!anyBad) {
    banner.classList.add("hidden");
  } else {
    banner.classList.remove("hidden");
    if (cfOk === false) {
      $("bannerTitle").textContent = "Codeforces session expired.";
      $("bannerLink").href = "https://codeforces.com/enter";
      $("bannerLink").textContent = "Reconnect Codeforces";
    } else if (lcOk === false) {
      $("bannerTitle").textContent = "LeetCode session expired.";
      $("bannerLink").href = "https://leetcode.com/accounts/login/";
      $("bannerLink").textContent = "Reconnect LeetCode";
    } else if (csesOk === false) {
      $("bannerTitle").textContent = "CSES session expired.";
      $("bannerLink").href = "https://cses.fi/login";
      $("bannerLink").textContent = "Reconnect CSES";
    } else if (codechefOk === false) {
      $("bannerTitle").textContent = "CodeChef session expired.";
      $("bannerLink").href = "https://www.codechef.com/login";
      $("bannerLink").textContent = "Reconnect CodeChef";
    } else if (gfgOk === false) {
      $("bannerTitle").textContent = "GeeksforGeeks session expired.";
      $("bannerLink").href = "https://auth.geeksforgeeks.org/";
      $("bannerLink").textContent = "Reconnect GeeksforGeeks";
    }
  }

  if (config && !setupPopulated && !editing) {
    populateForm(config);
    setupPopulated = true;
  }

  if (!configured) return;

  if ($("repoLine")) {
    $("repoLine").textContent = `${config.owner}/${config.repo}`;
  }
  if ($("repoLink")) {
    $("repoLink").href = `https://github.com/${config.owner}/${config.repo}`;
  }

  const platforms = config.platforms || {};
  const badges = $("activeBadges");
  if (badges) {
    badges.replaceChildren();
    const profiles = session.profiles || {};
    const enabled = [
      [
        "codeforces",
        "Codeforces",
        "cf-mini",
        "icons/codeforces.svg",
        config.handle
          ? `https://codeforces.com/profile/${encodeURIComponent(config.handle)}`
          : "https://codeforces.com/",
      ],
      [
        "leetcode",
        "LeetCode",
        "lc-mini",
        "icons/leetcode.png",
        profiles.leetcode || "https://leetcode.com/",
      ],
      ["cses", "CSES", "cses-mini", "icons/cses.svg", profiles.cses || "https://cses.fi/"],
      [
        "codechef",
        "CodeChef",
        "codechef-mini",
        "icons/codechef.svg",
        config.codechefHandle
          ? `https://www.codechef.com/users/${encodeURIComponent(config.codechefHandle)}`
          : "https://www.codechef.com/",
      ],
      [
        "gfg",
        "GeeksforGeeks",
        "gfg-mini",
        "icons/geeksforgeeks.svg",
        config.gfgHandle
          ? `https://www.geeksforgeeks.org/user/${encodeURIComponent(config.gfgHandle)}/`
          : "https://www.geeksforgeeks.org/",
      ],
    ];
    for (const [platform, label, className, iconPath, profileUrl] of enabled) {
      if (platforms[platform] === false) continue;
      const badge = document.createElement("a");
      badge.className = `mini-badge ${className}`;
      badge.href = profileUrl;
      badge.target = "_blank";
      badge.rel = "noreferrer";
      badge.title = `Open ${label} profile`;

      const iconFrame = document.createElement("span");
      iconFrame.className = "platform-logo-frame";
      const icon = document.createElement("img");
      icon.src = iconPath;
      icon.alt = "";
      iconFrame.append(icon);

      const name = document.createElement("span");
      name.className = "mini-badge-label";
      name.textContent = label;

      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      arrow.classList.add("mini-badge-arrow");
      arrow.setAttribute("aria-hidden", "true");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#icon-chevron");
      arrow.append(use);

      badge.append(iconFrame, name, arrow);
      badges.append(badge);
    }
  }
}

async function refresh() {
  try {
    const res = await send({ type: "status" });
    if (res) render(res);
  } catch {}
}

function readSetupForm() {
  const platforms = {
    codeforces: $("platformCF").checked,
    leetcode: $("platformLC").checked,
    cses: $("platformCSES").checked,
    codechef: $("platformCodeChef").checked,
    gfg: $("platformGFG").checked,
  };
  const handle = $("handle").value.trim();
  const codechefHandle = $("codechefHandle").value.trim();
  const gfgHandle = $("gfgHandle").value.trim();
  const repo = $("repo").value.trim();
  const repoVisibilityConfirmed = $("repoPublicConsent").checked;

  if (!repo) {
    return { error: "Enter a repository name." };
  }
  if (!/^[A-Za-z0-9._-]+$/.test(repo) || repo === "." || repo === ".." || repo.length > 100) {
    return { error: "Invalid repository name. Use letters, numbers, hyphens, or dots." };
  }
  if (!repoVisibilityConfirmed) {
    return { error: "Confirm that the solutions repository and committed files will be public." };
  }

  if (
    !platforms.codeforces &&
    !platforms.leetcode &&
    !platforms.cses &&
    !platforms.codechef &&
    !platforms.gfg
  ) {
    return { error: "Enable at least one platform." };
  }
  if (platforms.codeforces && !handle) {
    return { error: "Enter your Codeforces handle." };
  }
  if (platforms.codechef && !codechefHandle) {
    return { error: "Enter your CodeChef username." };
  }
  if (platforms.gfg && !gfgHandle) {
    return { error: "Enter your GeeksforGeeks username." };
  }
  return { handle, codechefHandle, gfgHandle, repo, platforms, repoVisibilityConfirmed };
}

async function submitSetup(forceConnect) {
  const form = readSetupForm();
  if (form.error) {
    $("setupError").textContent = form.error;
    $("setupError").classList.remove("hidden");
    return;
  }

  let statusRes;
  try {
    statusRes = await send({ type: "status" });
  } catch {
    statusRes = {};
  }
  const alreadyConnected = Boolean(statusRes?.config?.hasToken && statusRes?.config?.owner);
  const connect = forceConnect || !alreadyConnected;
  const payload = { ...form, connect };

  $("save").disabled = true;
  $("githubConnect").disabled = true;
  $("save").textContent = connect ? "Authorizing GitHub…" : "Saving…";
  $("githubConnect").textContent = "Authorizing…";
  $("setupError").classList.add("hidden");
  try {
    const res = await send({ type: "save-config", payload });
    if (!res || !res.ok) {
      $("setupError").textContent = res?.error || "Save failed";
      $("setupError").classList.remove("hidden");
      return;
    }
    editing = false;
    refresh();
  } catch (err) {
    $("setupError").textContent = err.message;
    $("setupError").classList.remove("hidden");
  } finally {
    $("save").disabled = false;
    $("githubConnect").disabled = false;
    renderGithubStatus((await send({ type: "status" }).catch(() => {}))?.config);
  }
}

$("githubConnect").addEventListener("click", () => submitSetup(true));
$("save").addEventListener("click", () => submitSetup(false));

for (const [platformId] of accountPlatformFields) {
  $(platformId).addEventListener("change", syncAccountFieldStates);
}
syncAccountFieldStates();

$("starRepo").addEventListener("click", async () => {
  const button = $("starRepo");
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add("is-loading");
  button.title = "Starring SolveBase...";
  try {
    const result = await send({ type: "star-project-repo" });
    if (!result?.ok || result.starred !== true) {
      throw new Error(result?.error || "Could not star SolveBase on GitHub.");
    }
    renderStarState(true, true);
  } catch (error) {
    renderStarState(false, true);
    alert(error instanceof Error ? error.message : "Could not star SolveBase on GitHub.");
  }
});

$("edit").addEventListener("click", async () => {
  editing = true;
  $("setup").classList.remove("hidden");
  $("status").classList.add("hidden");
  $("cancelEdit").classList.remove("hidden");
  try {
    const res = await send({ type: "status" });
    if (res?.config) {
      populateForm(res.config);
      setupPopulated = true;
    }
    renderGithubStatus(res?.config);
  } catch {}
});

$("cancelEdit").addEventListener("click", () => {
  editing = false;
  $("setupError").classList.add("hidden");
  refresh();
});

$("disconnectGithub").addEventListener("click", async () => {
  if (
    !confirm(
      "Disconnect GitHub? You'll need to reconnect to resume syncing. Your repo files stay untouched.",
    )
  ) {
    return;
  }
  await send({ type: "github-disconnect" });
  editing = false;
  setupPopulated = false;
  refresh();
});

$("reset").addEventListener("click", async () => {
  if (
    !confirm(
      "Reset SolveBase? This removes the GitHub connection, settings, and local cache. GitHub files stay untouched.",
    )
  )
    return;
  await send({ type: "reset" });
  setupPopulated = false;
  editing = false;
  refresh();
});

send({ type: "check-session" })
  .then(refresh)
  .catch(() => {});
refresh();

// Visibility-aware polling: only poll while popup is active
let pollTimer = setInterval(refresh, 3000);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(pollTimer);
  } else {
    refresh();
    pollTimer = setInterval(refresh, 3000);
  }
});
