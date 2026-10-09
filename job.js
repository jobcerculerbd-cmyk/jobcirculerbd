
const JOB_API_URL =
  "https://script.google.com/macros/s/AKfycbwqQo7pgDmhYIvUBHlOOD-eGvAd-Vbix-sPkCBuLNV1cDpRr6r29iUpkaFVAzhdJgkb/exec?api=json";

const JOB_CACHE_KEY = "job_circuler_bd_jobs_cache_v1";

const $ = id => document.getElementById(id);

function safeText(value) {
  return String(value ?? "").trim();
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeDetailJob(job, index) {
  return {
    id: safeText(job.id || job.ID || `JOB-${index + 1}`),
    jobTitle: safeText(job.jobTitle || job.title || job["Job Title"] || "চাকরির সুযোগ"),
    company: safeText(job.company || job.Company || "উল্লেখ করা হয়নি"),
    category: safeText(job.category || job.Category || "অন্যান্য"),
    location: safeText(job.location || job.Location || "উল্লেখ করা হয়নি"),
    deadline: safeText(job.deadline || job.Deadline || "উল্লেখ করা হয়নি"),
    description: safeText(job.description || job.Description),
    applyLink: safeText(job.applyLink || job.apply || job["Apply Link"]),
    imageUrl: safeText(job.imageUrl || job.image || job["Image URL"]),
    status: safeText(job.status || job.Status || "Active")
  };
}

function readCachedJobs() {
  try {
    const data = JSON.parse(localStorage.getItem(JOB_CACHE_KEY) || "[]");
    return Array.isArray(data) ? data.map(normalizeDetailJob) : [];
  } catch {
    return [];
  }
}

async function getJobs() {
  const response = await fetch(
    JOB_API_URL + "&_t=" + Date.now(),
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("API থেকে তথ্য আনা যায়নি।");
  }

  const data = await response.json();

  if (data.success !== true || !Array.isArray(data.jobs)) {
    throw new Error("চাকরির তথ্য সঠিক ফরম্যাটে পাওয়া যায়নি।");
  }

  const jobs = data.jobs.map(normalizeDetailJob);

  try {
    localStorage.setItem(JOB_CACHE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.warn("Cache save failed:", error);
  }

  return jobs;
}

function setText(id, value) {
  $(id).textContent = safeText(value) || "উল্লেখ করা হয়নি";
}

function setApplyLink(id, url) {
  const link = $(id);

  if (validHttpUrl(url)) {
    link.href = url;
    link.hidden = false;
  } else {
    link.hidden = true;
  }
}

function displayJob(job) {
  $("detailsLoading").hidden = true;
  $("detailsError").hidden = true;
  $("jobDetails").hidden = false;

  document.title = `${job.jobTitle} | Job Circular BD`;

  setText("detailTitle", job.jobTitle);
  setText("detailCompany", "🏢 " + job.company);
  setText("detailCategory", job.category);
  setText("detailLocation", job.location);
  setText("detailDeadline", job.deadline);
  setText("detailDescription", job.description || "এই চাকরির বিস্তারিত বিবরণ দেওয়া হয়নি।");

  setText("sideTitle", job.jobTitle);
  setText("sideCompany", job.company);
  setText("sideCategory", job.category);
  setText("sideLocation", job.location);
  setText("sideDeadline", job.deadline);

  const image = $("detailImage");
  const fallback = $("detailImageFallback");

  image.hidden = true;
  fallback.hidden = true;

  if (validHttpUrl(job.imageUrl)) {
    image.onload = () => {
      image.hidden = false;
      fallback.hidden = true;
    };

    image.onerror = () => {
      image.hidden = true;
      fallback.hidden = false;
    };

    image.src = job.imageUrl;
    image.alt = job.jobTitle;
  } else {
    fallback.hidden = false;
  }

  setApplyLink("detailApply", job.applyLink);
  setApplyLink("sideApply", job.applyLink);

  $("applyUnavailable").hidden = validHttpUrl(job.applyLink);
}

function showDetailsError(message) {
  $("detailsLoading").hidden = true;
  $("jobDetails").hidden = true;
  $("detailsError").hidden = false;
  $("detailsErrorText").textContent = message;
}

document.addEventListener("DOMContentLoaded", async () => {
  $("detailYear").textContent = new Date().getFullYear();

  const id = new URLSearchParams(location.search).get("id");

  if (!id) {
    showDetailsError("এই লিংকে কোনো Job ID পাওয়া যায়নি।");
    return;
  }

  const findJob = jobs =>
    jobs.find(job => job.id === id);

  let job = findJob(readCachedJobs());

  if (job) {
    displayJob(job);

    // Update in background in case the cached record is old.
    try {
      const latestJobs = await getJobs();
      const latestJob = findJob(latestJobs);
      if (latestJob) displayJob(latestJob);
    } catch (error) {
      console.warn("Background detail refresh failed:", error);
    }

    return;
  }

  try {
    const jobs = await getJobs();
    job = findJob(jobs);

    if (!job) {
      showDetailsError("এই Job ID-এর চাকরিটি পাওয়া যায়নি।");
      return;
    }

    displayJob(job);
  } catch (error) {
    showDetailsError(
      "চাকরির তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
    );
  }
});
