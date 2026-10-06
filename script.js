/* =========================================
   JOB CIRCULER BD
   API + SEARCH + FILTER + JOB CARDS
========================================= */

// ===============================
// GOOGLE APPS SCRIPT API
// ===============================

const API_URL = "https://script.google.com/macros/s/AKfycbwqQo7pgDmhYIvUBHlOOD-eGvAd-Vbix-sPkCBuLNV1cDpRr6r29iUpkaFVAzhdJgkb/exec?api=json";


// ===============================
// GLOBAL DATA
// ===============================

let allJobs = [];
let filteredJobs = [];


// ===============================
// DOM ELEMENTS
// ===============================

const jobsContainer =
  document.getElementById("jobsContainer");

const loading =
  document.getElementById("loading");

const errorMessage =
  document.getElementById("errorMessage");

const errorText =
  document.getElementById("errorText");

const noJobs =
  document.getElementById("noJobs");

const searchInput =
  document.getElementById("searchInput");

const searchBtn =
  document.getElementById("searchBtn");

const categoryFilter =
  document.getElementById("categoryFilter");

const locationFilter =
  document.getElementById("locationFilter");

const clearFilters =
  document.getElementById("clearFilters");

const retryBtn =
  document.getElementById("retryBtn");

const visibleJobCount =
  document.getElementById("visibleJobCount");

const totalJobs =
  document.getElementById("totalJobs");

const totalCompanies =
  document.getElementById("totalCompanies");

const totalCategories =
  document.getElementById("totalCategories");

const lastUpdated =
  document.getElementById("lastUpdated");

const categoriesContainer =
  document.getElementById("categoriesContainer");

const companiesContainer =
  document.getElementById("companiesContainer");

const currentYear =
  document.getElementById("currentYear");


// ===============================
// INITIALIZATION
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (currentYear) {
      currentYear.textContent =
        new Date().getFullYear();
    }

    loadJobs();

  }
);


// ===============================
// LOAD JOBS FROM API
// ===============================

async function loadJobs() {

  showLoading();

  try {

    const response =
      await fetch(API_URL, {
        method: "GET",
        cache: "no-store"
      });


    if (!response.ok) {

      throw new Error(
        `HTTP Error: ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "Job API Response:",
      data
    );


    if (!data || data.success !== true) {

      throw new Error(
        data?.message ||
        "API returned an unsuccessful response."
      );

    }


    if (!Array.isArray(data.jobs)) {

      throw new Error(
        "Jobs data was not found in API response."
      );

    }


    // Normalize + remove duplicates
    allJobs =
      normalizeJobs(data.jobs);


    filteredJobs =
      [...allJobs];


    updateStatistics();

    buildFilters();

    buildCategories();

    buildCompanies();

    renderJobs(filteredJobs);

    hideLoading();


  } catch (error) {

    console.error(
      "Job API Error:",
      error
    );

    showError(
      "Unable to load job data. Please check the API or try again."
    );

  }

}


// ===============================
// NORMALIZE JOB DATA
// ===============================

function normalizeJobs(jobs) {

  const unique =
    new Map();


  jobs.forEach(
    (job, index) => {

      if (!job) return;


      const normalized = {

        id:
          cleanValue(
            job.id ||
            job.ID ||
            `JOB-${index + 1}`
          ),

        jobTitle:
          cleanValue(
            job.jobTitle ||
            job.title ||
            job["Job Title"] ||
            "Job Opportunity"
          ),

        company:
          cleanValue(
            job.company ||
            job.Company ||
            "Company Not Specified"
          ),

        category:
          cleanValue(
            job.category ||
            job.Category ||
            "Other"
          ),

        location:
          cleanValue(
            job.location ||
            job.Location ||
            "Not specified"
          ),

        deadline:
          cleanValue(
            job.deadline ||
            job.Deadline ||
            "Not specified"
          ),

        description:
          cleanValue(
            job.description ||
            job.Description ||
            ""
          ),

        applyLink:
          cleanValue(
            job.applyLink ||
            job.apply ||
            job["Apply Link"] ||
            "#"
          ),

        imageUrl:
          cleanValue(
            job.imageUrl ||
            job.image ||
            job["Image URL"] ||
            ""
          ),

        facebookPostUrl:
          cleanValue(
            job.facebookPostUrl ||
            job.facebookUrl ||
            job["Facebook Post URL"] ||
            ""
          ),

        postDate:
          cleanValue(
            job.postDate ||
            job["Post Date"] ||
            ""
          ),

        status:
          cleanValue(
            job.status ||
            job.Status ||
            "Active"
          )

      };


      // Duplicate protection
      const duplicateKey =
        [
          normalized.id,
          normalized.jobTitle,
          normalized.company,
          normalized.deadline
        ]
          .join("|")
          .toLowerCase();


      if (!unique.has(duplicateKey)) {

        unique.set(
          duplicateKey,
          normalized
        );

      }

    }
  );


  return Array.from(
    unique.values()
  );

}


// ===============================
// CLEAN VALUES
// ===============================

function cleanValue(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value).trim();

}


// ===============================
// RENDER JOBS
// ===============================

function renderJobs(jobs) {

  jobsContainer.innerHTML = "";


  visibleJobCount.textContent =
    jobs.length;


  if (!jobs.length) {

    noJobs.style.display =
      "block";

    return;

  }


  noJobs.style.display =
    "none";


  const fragment =
    document.createDocumentFragment();


  jobs.forEach(
    job => {

      const card =
        createJobCard(job);

      fragment.appendChild(card);

    }
  );


  jobsContainer.appendChild(
    fragment
  );

}


// ===============================
// CREATE JOB CARD
// ===============================

function createJobCard(job) {

  const card =
    document.createElement("article");


  card.className =
    "job-card";


  const image =
    job.imageUrl
      ? escapeAttribute(job.imageUrl)
      : "";


  const imageHTML =
    image
      ? `
        <img
          class="job-image"
          src="${image}"
          alt="${escapeHTML(job.jobTitle)}"
          loading="lazy"
          onerror="this.style.display='none';"
        >
      `
      : `
        <div
          class="job-image"
          style="
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:42px;
          "
        >
          💼
        </div>
      `;


  const applyURL =
    isValidURL(job.applyLink)
      ? escapeAttribute(job.applyLink)
      : "#";


  card.innerHTML = `

    ${imageHTML}

    <div class="job-content">

      <h3 class="job-title">
        ${escapeHTML(job.jobTitle)}
      </h3>

      <div class="job-company">
        🏢 ${escapeHTML(job.company)}
      </div>

      <div class="job-category">
        ${escapeHTML(job.category)}
      </div>

      <div class="job-meta">

        <div class="job-meta-item">
          <span>📍</span>
          <span>
            ${escapeHTML(job.location || "Not specified")}
          </span>
        </div>

        <div class="job-meta-item">
          <span>📅</span>
          <span>
            Deadline:
            ${escapeHTML(job.deadline || "Not specified")}
          </span>
        </div>

      </div>

      <div class="job-footer">

        <span class="active-badge">

          <span class="active-dot"></span>

          ${escapeHTML(
            job.status || "Active"
          )}

        </span>

        ${
          applyURL !== "#"
            ? `
              <a
                class="apply-btn"
                href="${applyURL}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply Now →
              </a>
            `
            : `
              <span
                class="apply-btn"
                style="opacity:.5;cursor:not-allowed;"
              >
                Apply Unavailable
              </span>
            `
        }

      </div>

    </div>

  `;


  return card;

}


// ===============================
// UPDATE STATISTICS
// ===============================

function updateStatistics() {

  totalJobs.textContent =
    allJobs.length;


  const companies =
    new Set(
      allJobs
        .map(job =>
          job.company
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    );


  totalCompanies.textContent =
    companies.size;


  const categories =
    new Set(
      allJobs
        .map(job =>
          job.category
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    );


  totalCategories.textContent =
    categories.size;


  lastUpdated.textContent =
    new Date().toLocaleTimeString(
      "en-BD",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }
    );

}


// ===============================
// BUILD CATEGORY FILTER
// ===============================

function buildFilters() {

  const categories =
    uniqueSorted(
      allJobs.map(
        job => job.category
      )
    );


  const locations =
    uniqueSorted(
      allJobs.map(
        job => job.location
      )
    );


  categoryFilter.innerHTML =
    `<option value="">
      All Categories
    </option>`;


  categories.forEach(
    category => {

      categoryFilter.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeAttribute(category)}">
            ${escapeHTML(category)}
          </option>
        `
      );

    }
  );


  locationFilter.innerHTML =
    `<option value="">
      All Locations
    </option>`;


  locations.forEach(
    location => {

      locationFilter.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeAttribute(location)}">
            ${escapeHTML(location)}
          </option>
        `
      );

    }
  );

}


// ===============================
// CATEGORY SECTION
// ===============================

function buildCategories() {

  categoriesContainer.innerHTML =
    "";


  const counts =
    {};


  allJobs.forEach(
    job => {

      const category =
        job.category ||
        "Other";


      counts[category] =
        (counts[category] || 0) + 1;

    }
  );


  Object.entries(counts)
    .sort(
      (a, b) => b[1] - a[1]
    )
    .forEach(
      ([category, count]) => {

        const div =
          document.createElement("div");


        div.className =
          "category-card";


        div.innerHTML = `

          <div class="category-icon">
            📂
          </div>

          <div class="category-name">
            ${escapeHTML(category)}
          </div>

          <div class="category-count">
            ${count}
            ${count === 1 ? "Job" : "Jobs"}
          </div>

        `;


        div.addEventListener(
          "click",
          () => {

            categoryFilter.value =
              category;

            applyFilters();

            document
              .getElementById("jobs")
              ?.scrollIntoView({
                behavior: "smooth"
              });

          }
        );


        categoriesContainer.appendChild(
          div
        );

      }
    );

}


// ===============================
// COMPANY SECTION
// ===============================

function buildCompanies() {

  companiesContainer.innerHTML =
    "";


  const counts =
    {};


  allJobs.forEach(
    job => {

      const company =
        job.company ||
        "Unknown Company";


      counts[company] =
        (counts[company] || 0) + 1;

    }
  );


  Object.entries(counts)
    .sort(
      (a, b) => b[1] - a[1]
    )
    .forEach(
      ([company, count]) => {

        const div =
          document.createElement("div");


        div.className =
          "company-card";


        const initial =
          company
            .charAt(0)
            .toUpperCase();


        div.innerHTML = `

          <div class="company-logo">
            ${escapeHTML(initial)}
          </div>

          <div>

            <div class="company-name">
              ${escapeHTML(company)}
            </div>

            <div class="company-jobs">
              ${count}
              ${count === 1 ? "Job" : "Jobs"}
            </div>

          </div>

        `;


        companiesContainer.appendChild(
          div
        );

      }
    );

}


// ===============================
// SEARCH
// ===============================

function performSearch() {

  applyFilters();

}


searchBtn?.addEventListener(
  "click",
  performSearch
);


searchInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      performSearch();

    }

  }
);


// ===============================
// FILTERS
// ===============================

categoryFilter?.addEventListener(
  "change",
  applyFilters
);


locationFilter?.addEventListener(
  "change",
  applyFilters
);


function applyFilters() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();


  const category =
    categoryFilter.value
      .trim()
      .toLowerCase();


  const location =
    locationFilter.value
      .trim()
      .toLowerCase();


  filteredJobs =
    allJobs.filter(
      job => {

        const searchableText =
          [
            job.jobTitle,
            job.company,
            job.category,
            job.location,
            job.description
          ]
            .join(" ")
            .toLowerCase();


        const matchesSearch =
          !search ||
          searchableText.includes(
            search
          );


        const matchesCategory =
          !category ||
          job.category
            .toLowerCase() ===
            category;


        const matchesLocation =
          !location ||
          job.location
            .toLowerCase() ===
            location;


        return (
          matchesSearch &&
          matchesCategory &&
          matchesLocation
        );

      }
    );


  renderJobs(
    filteredJobs
  );

}


// ===============================
// CLEAR FILTERS
// ===============================

clearFilters?.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    categoryFilter.value = "";

    locationFilter.value = "";

    filteredJobs =
      [...allJobs];

    renderJobs(
      filteredJobs
    );

  }
);


// ===============================
// RETRY
// ===============================

retryBtn?.addEventListener(
  "click",
  () => {

    loadJobs();

  }
);


// ===============================
// LOADING
// ===============================

function showLoading() {

  loading.style.display =
    "block";

  errorMessage.style.display =
    "none";

  noJobs.style.display =
    "none";

  jobsContainer.innerHTML =
    "";

}


function hideLoading() {

  loading.style.display =
    "none";

  errorMessage.style.display =
    "none";

}


function showError(message) {

  loading.style.display =
    "none";

  errorMessage.style.display =
    "block";

  noJobs.style.display =
    "none";

  jobsContainer.innerHTML =
    "";

  errorText.textContent =
    message;

}


// ===============================
// UTILITY FUNCTIONS
// ===============================

function uniqueSorted(values) {

  return [
    ...new Set(
      values
        .map(
          value =>
            String(value || "").trim()
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        undefined,
        {
          sensitivity: "base"
        }
      )
  );

}


function isValidURL(url) {

  if (!url) return false;

  try {

    const parsed =
      new URL(url);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );

  } catch {

    return false;

  }

}


function escapeHTML(value) {

  return String(value || "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


// ===============================
// AUTO REFRESH
// ===============================

// Refresh job data every 10 minutes.

setInterval(
  () => {

    loadJobs();

  },
  10 * 60 * 1000
);
