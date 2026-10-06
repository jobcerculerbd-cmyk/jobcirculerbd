/* =========================================
   JOB CIRCULER BD
   OPTIMIZED JOB PORTAL SCRIPT

   Features:
   - Instant Local Cache
   - Background API Refresh
   - Search
   - Category Filter
   - Location Filter
   - Duplicate Protection
   - Job Cards
   - Auto Refresh
   - Offline Cache Support
========================================= */


// =====================================================
// GOOGLE APPS SCRIPT API
// =====================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwqQo7pgDmhYIvUBHlOOD-eGvAd-Vbix-sPkCBuLNV1cDpRr6r29iUpkaFVAzhdJgkb/exec?api=json";


// =====================================================
// CACHE SETTINGS
// =====================================================

const CACHE_KEY =
  "job_circuler_bd_jobs_cache_v1";

const CACHE_TIME_KEY =
  "job_circuler_bd_jobs_cache_time_v1";

// Cache lifetime: 30 minutes
const CACHE_MAX_AGE =
  30 * 60 * 1000;


// =====================================================
// GLOBAL DATA
// =====================================================

let allJobs = [];

let filteredJobs = [];


// =====================================================
// DOM ELEMENTS
// =====================================================

const jobsContainer =
  document.getElementById(
    "jobsContainer"
  );

const loading =
  document.getElementById(
    "loading"
  );

const errorMessage =
  document.getElementById(
    "errorMessage"
  );

const errorText =
  document.getElementById(
    "errorText"
  );

const noJobs =
  document.getElementById(
    "noJobs"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const searchBtn =
  document.getElementById(
    "searchBtn"
  );

const categoryFilter =
  document.getElementById(
    "categoryFilter"
  );

const locationFilter =
  document.getElementById(
    "locationFilter"
  );

const clearFilters =
  document.getElementById(
    "clearFilters"
  );

const retryBtn =
  document.getElementById(
    "retryBtn"
  );

const visibleJobCount =
  document.getElementById(
    "visibleJobCount"
  );

const totalJobs =
  document.getElementById(
    "totalJobs"
  );

const totalCompanies =
  document.getElementById(
    "totalCompanies"
  );

const totalCategories =
  document.getElementById(
    "totalCategories"
  );

const lastUpdated =
  document.getElementById(
    "lastUpdated"
  );

const categoriesContainer =
  document.getElementById(
    "categoriesContainer"
  );

const companiesContainer =
  document.getElementById(
    "companiesContainer"
  );

const currentYear =
  document.getElementById(
    "currentYear"
  );


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (currentYear) {

      currentYear.textContent =
        new Date().getFullYear();

    }

    /*
       IMPORTANT:

       First try cache.

       If cache exists:
       Show jobs immediately.

       Then refresh API
       silently in background.
    */

    const cachedJobs =
      loadJobsFromCache();

    if (
      cachedJobs &&
      cachedJobs.length
    ) {

      console.log(
        "Showing cached jobs instantly."
      );

      setJobs(
        cachedJobs,
        false
      );

      hideLoading();

      /*
         Background API refresh
      */

      refreshJobsInBackground();

    } else {

      /*
         First visitor / no cache

         API must load.
      */

      loadJobsFromAPI(
        true
      );

    }

  }
);


// =====================================================
// MAIN JOB LOADER
// =====================================================

async function loadJobs() {

  /*
     If jobs already exist,
     DON'T show loading screen.

     Instead update silently.
  */

  if (
    allJobs &&
    allJobs.length
  ) {

    await refreshJobsInBackground();

    return;

  }


  loadJobsFromAPI(
    true
  );

}


// =====================================================
// API LOAD
// =====================================================

async function loadJobsFromAPI(
  showLoader = false
) {

  if (
    showLoader &&
    (!allJobs || !allJobs.length)
  ) {

    showLoading();

  }


  try {

    const response =
      await fetch(
        API_URL +
        (
          API_URL.includes("?")
            ? "&"
            : "?"
        ) +
        "_t=" +
        Date.now(),
        {
          method: "GET",
          cache: "no-store"
        }
      );


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


    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        data?.message ||
        data?.error ||
        "API returned an unsuccessful response."
      );

    }


    if (
      !Array.isArray(
        data.jobs
      )
    ) {

      throw new Error(
        "Jobs data was not found in API response."
      );

    }


    /*
       Normalize data
    */

    const newJobs =
      normalizeJobs(
        data.jobs
      );


    /*
       Save to browser cache
    */

    saveJobsToCache(
      newJobs
    );


    /*
       Update website
    */

    setJobs(
      newJobs,
      true
    );


    hideLoading();


    console.log(
      "Jobs updated successfully."
    );


  } catch (error) {

    console.error(
      "Job API Error:",
      error
    );


    /*
       IMPORTANT:

       If cached jobs already exist,
       DO NOT show error screen.

       Keep showing cached jobs.
    */

    if (
      allJobs &&
      allJobs.length
    ) {

      console.log(
        "API failed. Cached jobs remain visible."
      );

      hideLoading();

      return;

    }


    /*
       No cache + API failed
    */

    showError(
      "Unable to load job data. Please check the API or try again."
    );

  }

}


// =====================================================
// BACKGROUND REFRESH
// =====================================================

async function refreshJobsInBackground() {

  try {

    const response =
      await fetch(
        API_URL +
        (
          API_URL.includes("?")
            ? "&"
            : "?"
        ) +
        "_t=" +
        Date.now(),
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP Error: ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !data ||
      data.success !== true ||
      !Array.isArray(
        data.jobs
      )
    ) {

      throw new Error(
        "Invalid API response."
      );

    }


    const newJobs =
      normalizeJobs(
        data.jobs
      );


    /*
       Check whether
       jobs actually changed.
    */

    const oldData =
      JSON.stringify(
        allJobs
      );

    const newData =
      JSON.stringify(
        newJobs
      );


    if (
      oldData !== newData
    ) {

      console.log(
        "New job data detected. Updating website."
      );


      saveJobsToCache(
        newJobs
      );


      setJobs(
        newJobs,
        true
      );

    } else {

      console.log(
        "No job changes detected."
      );

    }


    hideLoading();


  } catch (error) {

    console.warn(
      "Background refresh failed:",
      error
    );

    /*
       Keep existing cached jobs.
    */

    hideLoading();

  }

}


// =====================================================
// SET JOB DATA
// =====================================================

function setJobs(
  jobs,
  updateTime = true
) {

  allJobs =
    normalizeJobs(
      jobs
    );


  filteredJobs =
    [
      ...allJobs
    ];


  updateStatistics();


  buildFilters();


  buildCategories();


  buildCompanies();


  renderJobs(
    filteredJobs
  );


  if (
    updateTime
  ) {

    updateLastUpdated();

  }

}


// =====================================================
// CACHE SAVE
// =====================================================

function saveJobsToCache(
  jobs
) {

  try {

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(
        jobs
      )
    );


    localStorage.setItem(
      CACHE_TIME_KEY,
      String(
        Date.now()
      )
    );


    console.log(
      "Jobs saved to local cache."
    );


  } catch (error) {

    console.warn(
      "Could not save jobs to cache:",
      error
    );

  }

}


// =====================================================
// CACHE LOAD
// =====================================================

function loadJobsFromCache() {

  try {

    const raw =
      localStorage.getItem(
        CACHE_KEY
      );


    if (!raw) {

      return null;

    }


    const cachedJobs =
      JSON.parse(
        raw
      );


    if (
      !Array.isArray(
        cachedJobs
      )
    ) {

      return null;

    }


    /*
       We intentionally allow
       slightly old cache.

       Even if cache is old,
       show it instantly.

       API will update it
       in background.
    */

    return normalizeJobs(
      cachedJobs
    );


  } catch (error) {

    console.warn(
      "Cache read error:",
      error
    );


    return null;

  }

}


// =====================================================
// CACHE CLEAR
// =====================================================

function clearJobCache() {

  try {

    localStorage.removeItem(
      CACHE_KEY
    );

    localStorage.removeItem(
      CACHE_TIME_KEY
    );


    console.log(
      "Job cache cleared."
    );

  } catch (error) {

    console.warn(
      "Cache clear error:",
      error
    );

  }

}


// =====================================================
// NORMALIZE JOB DATA
// =====================================================

function normalizeJobs(
  jobs
) {

  const unique =
    new Map();


  jobs.forEach(
    (
      job,
      index
    ) => {

      if (!job) {

        return;

      }


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

        facebookPostId:
          cleanValue(
            job.facebookPostId ||
            job["Facebook Post ID"] ||
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


      /*
         Better duplicate detection.

         First priority:
         Facebook Post ID

         Second:
         ID

         Third:
         Job title + company + deadline
      */

      let duplicateKey;


      if (
        normalized.facebookPostId
      ) {

        duplicateKey =
          "FB|" +
          normalized.facebookPostId
            .toLowerCase();

      } else if (
        normalized.id
      ) {

        duplicateKey =
          "ID|" +
          normalized.id
            .toLowerCase();

      } else {

        duplicateKey =
          [
            normalized.jobTitle,
            normalized.company,
            normalized.deadline
          ]
            .join("|")
            .toLowerCase();

      }


      if (
        !unique.has(
          duplicateKey
        )
      ) {

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


// =====================================================
// CLEAN VALUES
// =====================================================

function cleanValue(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(
    value
  ).trim();

}


// =====================================================
// RENDER JOBS
// =====================================================

function renderJobs(
  jobs
) {

  if (!jobsContainer) {

    return;

  }


  jobsContainer.innerHTML =
    "";


  if (
    visibleJobCount
  ) {

    visibleJobCount.textContent =
      jobs.length;

  }


  if (
    !jobs.length
  ) {

    if (noJobs) {

      noJobs.style.display =
        "block";

    }

    return;

  }


  if (noJobs) {

    noJobs.style.display =
      "none";

  }


  const fragment =
    document.createDocumentFragment();


  jobs.forEach(
    job => {

      const card =
        createJobCard(
          job
        );


      fragment.appendChild(
        card
      );

    }
  );


  jobsContainer.appendChild(
    fragment
  );

}


// =====================================================
// CREATE JOB CARD
// =====================================================

function createJobCard(
  job
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "job-card";


  const image =
    job.imageUrl
      ? escapeAttribute(
          job.imageUrl
        )
      : "";


  const imageHTML =
    image
      ? `
        <img
          class="job-image"
          src="${image}"
          alt="${escapeHTML(
            job.jobTitle
          )}"
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
    isValidURL(
      job.applyLink
    )
      ? escapeAttribute(
          job.applyLink
        )
      : "#";


  card.innerHTML = `

    ${imageHTML}

    <div class="job-content">

      <h3 class="job-title">
        ${escapeHTML(
          job.jobTitle
        )}
      </h3>

      <div class="job-company">
        🏢 ${escapeHTML(
          job.company
        )}
      </div>

      <div class="job-category">
        ${escapeHTML(
          job.category
        )}
      </div>

      <div class="job-meta">

        <div class="job-meta-item">

          <span>📍</span>

          <span>
            ${escapeHTML(
              job.location ||
              "Not specified"
            )}
          </span>

        </div>

        <div class="job-meta-item">

          <span>📅</span>

          <span>
            Deadline:
            ${escapeHTML(
              job.deadline ||
              "Not specified"
            )}
          </span>

        </div>

      </div>

      <div class="job-footer">

        <span class="active-badge">

          <span class="active-dot"></span>

          ${escapeHTML(
            job.status ||
            "Active"
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
                style="
                  opacity:.5;
                  cursor:not-allowed;
                "
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


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStatistics() {

  if (totalJobs) {

    totalJobs.textContent =
      allJobs.length;

  }


  const companies =
    new Set(

      allJobs

        .map(
          job =>
            job.company
              .trim()
              .toLowerCase()
        )

        .filter(Boolean)

    );


  if (totalCompanies) {

    totalCompanies.textContent =
      companies.size;

  }


  const categories =
    new Set(

      allJobs

        .map(
          job =>
            job.category
              .trim()
              .toLowerCase()
        )

        .filter(Boolean)

    );


  if (totalCategories) {

    totalCategories.textContent =
      categories.size;

  }


  updateLastUpdated();

}


// =====================================================
// LAST UPDATED
// =====================================================

function updateLastUpdated() {

  if (!lastUpdated) {

    return;

  }


  lastUpdated.textContent =
    new Date()
      .toLocaleTimeString(
        "en-BD",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      );

}


// =====================================================
// BUILD FILTERS
// =====================================================

function buildFilters() {

  if (
    !categoryFilter ||
    !locationFilter
  ) {

    return;

  }


  const categories =
    uniqueSorted(
      allJobs.map(
        job =>
          job.category
      )
    );


  const locations =
    uniqueSorted(
      allJobs.map(
        job =>
          job.location
      )
    );


  const currentCategory =
    categoryFilter.value;


  const currentLocation =
    locationFilter.value;


  categoryFilter.innerHTML =
    `
      <option value="">
        All Categories
      </option>
    `;


  categories.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category;


      option.textContent =
        category;


      categoryFilter.appendChild(
        option
      );

    }
  );


  locationFilter.innerHTML =
    `
      <option value="">
        All Locations
      </option>
    `;


  locations.forEach(
    location => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        location;


      option.textContent =
        location;


      locationFilter.appendChild(
        option
      );

    }
  );


  /*
     Restore previous selection
  */

  if (
    categories.includes(
      currentCategory
    )
  ) {

    categoryFilter.value =
      currentCategory;

  }


  if (
    locations.includes(
      currentLocation
    )
  ) {

    locationFilter.value =
      currentLocation;

  }

}


// =====================================================
// CATEGORY SECTION
// =====================================================

function buildCategories() {

  if (!categoriesContainer) {

    return;

  }


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
        (
          counts[category] ||
          0
        ) + 1;

    }
  );


  Object.entries(
    counts
  )

    .sort(
      (
        a,
        b
      ) =>
        b[1] -
        a[1]
    )

    .forEach(
      (
        [
          category,
          count
        ]
      ) => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "category-card";


        div.innerHTML = `

          <div class="category-icon">
            📂
          </div>

          <div class="category-name">
            ${escapeHTML(
              category
            )}
          </div>

          <div class="category-count">
            ${count}
            ${
              count === 1
                ? "Job"
                : "Jobs"
            }
          </div>

        `;


        div.addEventListener(
          "click",
          () => {

            if (
              categoryFilter
            ) {

              categoryFilter.value =
                category;

            }


            applyFilters();


            document
              .getElementById(
                "jobs"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth"
              });

          }
        );


        categoriesContainer.appendChild(
          div
        );

      }
    );

}


// =====================================================
// COMPANY SECTION
// =====================================================

function buildCompanies() {

  if (!companiesContainer) {

    return;

  }


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
        (
          counts[company] ||
          0
        ) + 1;

    }
  );


  Object.entries(
    counts
  )

    .sort(
      (
        a,
        b
      ) =>
        b[1] -
        a[1]
    )

    .forEach(
      (
        [
          company,
          count
        ]
      ) => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "company-card";


        const initial =
          company
            .charAt(0)
            .toUpperCase();


        div.innerHTML = `

          <div class="company-logo">
            ${escapeHTML(
              initial
            )}
          </div>

          <div>

            <div class="company-name">
              ${escapeHTML(
                company
              )}
            </div>

            <div class="company-jobs">
              ${count}
              ${
                count === 1
                  ? "Job"
                  : "Jobs"
              }
            </div>

          </div>

        `;


        companiesContainer.appendChild(
          div
        );

      }
    );

}


// =====================================================
// SEARCH
// =====================================================

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
      event.key ===
      "Enter"
    ) {

      performSearch();

    }

  }
);


// =====================================================
// FILTER EVENTS
// =====================================================

categoryFilter?.addEventListener(
  "change",
  applyFilters
);


locationFilter?.addEventListener(
  "change",
  applyFilters
);


// =====================================================
// FILTER JOBS
// =====================================================

function applyFilters() {

  const search =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";


  const category =
    categoryFilter
      ? categoryFilter.value
          .trim()
          .toLowerCase()
      : "";


  const location =
    locationFilter
      ? locationFilter.value
          .trim()
          .toLowerCase()
      : "";


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


// =====================================================
// CLEAR FILTERS
// =====================================================

clearFilters?.addEventListener(
  "click",
  () => {

    if (searchInput) {

      searchInput.value =
        "";

    }


    if (categoryFilter) {

      categoryFilter.value =
        "";

    }


    if (locationFilter) {

      locationFilter.value =
        "";

    }


    filteredJobs =
      [
        ...allJobs
      ];


    renderJobs(
      filteredJobs
    );

  }
);


// =====================================================
// RETRY BUTTON
// =====================================================

retryBtn?.addEventListener(
  "click",
  () => {

    /*
       Clear error first
    */

    if (
      errorMessage
    ) {

      errorMessage.style.display =
        "none";

    }


    /*
       If cached jobs exist,
       keep them visible while
       retrying.
    */

    if (
      allJobs &&
      allJobs.length
    ) {

      hideLoading();

      refreshJobsInBackground();

    } else {

      loadJobsFromAPI(
        true
      );

    }

  }
);


// =====================================================
// LOADING
// =====================================================

function showLoading() {

  /*
     IMPORTANT:

     Never clear existing
     jobs while loading.

     This prevents flickering.
    */

  if (
    allJobs &&
    allJobs.length
  ) {

    hideLoading();

    return;

  }


  if (loading) {

    loading.style.display =
      "block";

  }


  if (errorMessage) {

    errorMessage.style.display =
      "none";

  }


  if (noJobs) {

    noJobs.style.display =
      "none";

  }

}


// =====================================================
// HIDE LOADING
// =====================================================

function hideLoading() {

  if (loading) {

    loading.style.display =
      "none";

  }


  if (errorMessage) {

    errorMessage.style.display =
      "none";

  }

}


// =====================================================
// SHOW ERROR
// =====================================================

function showError(
  message
) {

  if (loading) {

    loading.style.display =
      "none";

  }


  if (errorMessage) {

    errorMessage.style.display =
      "block";

  }


  if (noJobs) {

    noJobs.style.display =
      "none";

  }


  /*
     IMPORTANT:

     Do NOT remove cached jobs.
  */

  if (
    errorText
  ) {

    errorText.textContent =
      message;

  }

}


// =====================================================
// UNIQUE SORTED
// =====================================================

function uniqueSorted(
  values
) {

  return [

    ...new Set(

      values

        .map(
          value =>
            String(
              value || ""
            ).trim()
        )

        .filter(Boolean)

    )

  ].sort(
    (
      a,
      b
    ) =>
      a.localeCompare(
        b,
        undefined,
        {
          sensitivity:
            "base"
        }
      )
  );

}


// =====================================================
// VALID URL
// =====================================================

function isValidURL(
  url
) {

  if (!url) {

    return false;

  }


  try {

    const parsed =
      new URL(
        url
      );


    return (

      parsed.protocol ===
        "http:" ||

      parsed.protocol ===
        "https:"

    );

  } catch {

    return false;

  }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
  value
) {

  return String(
    value || ""
  )

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


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}


// =====================================================
// AUTO REFRESH
// =====================================================

/*
   Every 10 minutes:

   API will be checked
   silently in background.

   Visitor will NOT see
   loading screen.
*/

setInterval(
  () => {

    refreshJobsInBackground();

  },
  10 * 60 * 1000
);


// =====================================================
// PAGE VISIBILITY REFRESH
// =====================================================

/*
   If visitor leaves the tab
   and comes back after some time,
   silently check for new jobs.
*/

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      refreshJobsInBackground();

    }

  }
);


// =====================================================
// ONLINE EVENT
// =====================================================

/*
   If internet reconnects,
   refresh jobs automatically.
*/

window.addEventListener(
  "online",
  () => {

    console.log(
      "Internet connection restored."
    );


    refreshJobsInBackground();

  }
);


// =====================================================
// DEBUG INFORMATION
// =====================================================

console.log(
  "Job Circuler BD optimized script loaded."
);
