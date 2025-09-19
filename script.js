/* Main script for all pages.
   Save this file as script.js and keep it linked in all pages.
   All DOM access is wrapped in DOMContentLoaded to avoid null errors.
*/

document.addEventListener("DOMContentLoaded", () => {
  // Common utilities
  const YEAR = new Date().getFullYear();
  document.querySelectorAll("#year, #yearPost, #yearApply").forEach(el => { if (el) el.textContent = YEAR; });

  // Dark mode toggles (on multiple pages)
  function setupDarkToggle(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    // initialize from localStorage
    if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");

    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    });
  }
  setupDarkToggle("darkToggle");
  setupDarkToggle("darkTogglePost");
  setupDarkToggle("darkToggleApply");

  // ========== localStorage helpers ==========
  function getJobs(){
    try { return JSON.parse(localStorage.getItem("jobs")) || []; }
    catch(e){ localStorage.removeItem("jobs"); return []; }
  }
  function saveJobs(jobs){ localStorage.setItem("jobs", JSON.stringify(jobs)); }

  function getApplications(){
    try { return JSON.parse(localStorage.getItem("applications")) || []; }
    catch(e){ localStorage.removeItem("applications"); return []; }
  }
  function saveApplications(apps){ localStorage.setItem("applications", JSON.stringify(apps)); }

  function getSavedJobIds(){
    try { return JSON.parse(localStorage.getItem("savedJobs")) || []; }
    catch(e){ localStorage.removeItem("savedJobs"); return []; }
  }
  function saveSavedJobIds(arr){ localStorage.setItem("savedJobs", JSON.stringify(arr)); }

  // Placeholders
  const PLACEHOLDER_LOGO = "https://via.placeholder.com/120x80?text=Logo";

  // ========== POST JOB page ==========
  const jobForm = document.getElementById("jobForm");
  if (jobForm) {
    jobForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const jobs = getJobs();
      const newJob = {
        id: Date.now(),
        title: document.getElementById("title").value.trim(),
        company: document.getElementById("company").value.trim(),
        location: document.getElementById("location").value.trim(),
        skills: document.getElementById("skills").value.trim(),
        type: document.getElementById("type").value,
        logo: (document.getElementById("logo").value || "").trim(),
      };
      jobs.unshift(newJob); // add to top
      saveJobs(jobs);
      // redirect back to home
      window.location.href = "index.html";
    });
  }

  // ========== INDEX (job listing) page ==========
  const jobList = document.getElementById("jobList");
  if (jobList) {
    // Render jobs into the jobList container
    function renderJobs(jobs) {
      jobList.innerHTML = "";
      if (!jobs.length) {
        jobList.innerHTML = `<div class="job-card"><p class="meta">No job postings yet. Employers can <a href="post-job.html">post a job</a>.</p></div>`;
        return;
      }
      const savedIds = getSavedJobIds();
      for (const job of jobs) {
        const card = document.createElement("div");
        card.className = "job-card";

        const logoUrl = job.logo ? job.logo : `https://via.placeholder.com/120x80?text=${encodeURIComponent(job.company || "Logo")}`;

        card.innerHTML = `
          <div class="top">
            <img class="logo-sm" src="${logoUrl}" alt="company logo" onerror="this.src='${PLACEHOLDER_LOGO}'">
            <div>
              <h4 class="job-title">${escapeHtml(job.title)}</h4>
              <div class="meta">${escapeHtml(job.company)} • ${escapeHtml(job.location)} • <span>${escapeHtml(job.type)}</span></div>
            </div>
          </div>
          <div class="skills">${job.skills.split(',').slice(0,6).map(s => `<span class="skill">${escapeHtml(s.trim())}</span>`).join('')}</div>
          <div class="card-actions">
            <button class="btn-apply" data-id="${job.id}">Apply Now</button>
            <button class="btn-wish" data-id="${job.id}">${savedIds.includes(job.id) ? 'Saved ✓' : 'Save'}</button>
          </div>
        `;
        jobList.appendChild(card);
      }

      // wire up buttons
      jobList.querySelectorAll(".btn-apply").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          localStorage.setItem("applyJobId", id);
          // go to apply page
          window.location.href = "apply.html";
        });
      });
      jobList.querySelectorAll(".btn-wish").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = Number(btn.getAttribute("data-id"));
          toggleSaveJob(id, btn);
        });
      });
    }

    // Save/un-save job (wishlist)
    function toggleSaveJob(jobId, btnEl) {
      let saved = getSavedJobIds();
      if (saved.includes(jobId)) {
        saved = saved.filter(id => id !== jobId);
        btnEl.textContent = "Save";
      } else {
        saved.push(jobId);
        btnEl.textContent = "Saved ✓";
      }
      saveSavedJobIds(saved);
    }

    // Escape HTML to avoid injection
    function escapeHtml(str){ if (!str && str!==0) return ""; return String(str).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

    // initial display
    function displayAllJobs(){
      const jobs = getJobs();
      renderJobs(jobs);
    }
    displayAllJobs();

    // Search & Filter
    const searchInput = document.getElementById("searchInput");
    const filterType = document.getElementById("filterType");
    const clearFiltersBtn = document.getElementById("clearFilters");

    function filterJobs(){
      const q = (searchInput.value || "").toLowerCase().trim();
      const type = (filterType.value || "all");
      const jobs = getJobs();
      const filtered = jobs.filter(job => {
        const inSearch = [job.title, job.skills, job.location, job.company].join(" ").toLowerCase().includes(q);
        const inType = (type === "all") || (job.type === type);
        return inSearch && inType;
      });
      renderJobs(filtered);
    }

    searchInput.addEventListener("input", filterJobs);
    filterType.addEventListener("change", filterJobs);
    clearFiltersBtn.addEventListener("click", () => {
      searchInput.value = "";
      filterType.value = "all";
      displayAllJobs();
    });

    // On first load, if no jobs exist, create sample jobs
    if (!getJobs().length) {
      const sample = [
        { id: Date.now()+1, title: "Frontend Developer", company: "Mindtree", location: "Bengaluru", skills: "HTML, CSS, JavaScript", type: "Full-time", logo: "" },
        { id: Date.now()+2, title: "UI/UX Designer", company: "Acme Co", location: "Remote", skills: "Figma, UX, Prototyping", type: "Remote", logo: "" },
        { id: Date.now()+3, title: "Intern - Web Dev", company: "StartupX", location: "Hyderabad", skills: "HTML, JS, Git", type: "Internship", logo: "" }
      ];
      saveJobs(sample);
      renderJobs(sample);
    }
  } // end jobList presence

  // ========== APPLY page ==========
  const applyForm = document.getElementById("applyForm");
  if (applyForm) {
    const applyJobInfo = document.getElementById("applyJobInfo");
    const applyId = Number(localStorage.getItem("applyJobId"));
    const jobToApply = getJobs().find(j => Number(j.id) === applyId);

    if (jobToApply && applyJobInfo) {
      applyJobInfo.innerHTML = `<div class="apply-job-info"><strong>Applying for:</strong> ${escapeHtml(jobToApply.title)} at ${escapeHtml(jobToApply.company)} • ${escapeHtml(jobToApply.location)}</div>`;
    } else if (applyJobInfo) {
      applyJobInfo.innerHTML = `<div class="apply-job-info"><strong>Applying for:</strong> (No job selected) — open <a href="index.html">job listings</a> and click Apply.</div>`;
    }

    applyForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const apps = getApplications();
      const newApp = {
        id: Date.now(),
        jobId: applyId || null,
        name: document.getElementById("applicantName").value.trim(),
        email: document.getElementById("applicantEmail").value.trim(),
        resume: document.getElementById("resume").value.trim(),
        coverLetter: document.getElementById("coverLetter").value.trim(),
      };
      apps.unshift(newApp);
      saveApplications(apps);
      alert("Application submitted successfully!");
      // optionally clear applyJobId
      localStorage.removeItem("applyJobId");
      window.location.href = "index.html";
    });
  }

  // Utility functions used above in other scopes
  function escapeHtml(str){ if (!str && str!==0) return ""; return String(str).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
});
