// controllers/dataController.js
const bcrypt = require("bcryptjs");
const { getDB } = require("../config/mongodb");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

// Helper: convert a route parameter or value to an ObjectId
function getObjectId(id) {
  // If id consists only of digits, treat it as a timestamp (seconds)
  if (/^\d+$/.test(id)) {
    return ObjectId.createFromTime(Number(id));
  } else if (ObjectId.isValid(id)) {
    // For a 24-character hex string, create ObjectId from hex
    return new ObjectId(id);
  } else {
    throw new Error("Invalid id format");
  }
}

// Define a fetch function using dynamic import for node-fetch (GitHub API)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PER_PAGE = 100; // max number of repos per GitHub page

// Helper: fetch all repositories for the authenticated GitHub user (with pagination)
async function fetchAllRepos() {
  let repos = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const url = `https://api.github.com/user/repos?per_page=${PER_PAGE}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch repos: ${response.status}`);
    }
    const data = await response.json();
    repos = repos.concat(data);
    if (data.length < PER_PAGE) {
      hasMore = false;
    } else {
      page++;
    }
  }
  return repos;
}

// Helper: fetch language data for a single repository
async function fetchRepoLanguages(languagesUrl) {
  const response = await fetch(languagesUrl, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch languages from ${languagesUrl}: ${response.status}`
    );
  }
  return response.json();
}

// 1) Define your static must-load images
const MUST_LOAD_IMAGES = [
  "/home-bg.webp",
  "/Kartavya.webp",
  "/Kartavya-Profile-Photo.webp",
  "/contact-bg.webp",
  "/system-user.webp",
  "/user-icon.svg",

  // "/favicon.ico",
];

// 2) Set up two separate caches
let mustLoadImagesCache = {
  data: null,
  lastUpdated: 0,
};

let dynamicImagesCache = {
  data: null,
  lastUpdated: 0,
};

// 3) Update functions

/**
 * Update the mustLoadImagesCache.
 * In this case, it simply loads the static array into cache.
 */
function updateMustLoadImagesCache() {
  mustLoadImagesCache = {
    data: [...MUST_LOAD_IMAGES],
    lastUpdated: Date.now(),
  };
  console.log(`Must-load images cache updated at ${new Date()}`);
}

/**
 * Update the dynamicImagesCache by reading from your database fields.
 */
async function updateDynamicImagesCache(retryInterval = 1000) {
  const db = getDB();
  if (!db) {
    console.log(`Database not connected. Retrying in ${retryInterval}ms...`);
    return setTimeout(
      () => updateDynamicImagesCache(retryInterval),
      retryInterval
    );
  }
  try {
    const collections = [
      { name: "experienceTable", field: "experienceImages" },
      { name: "honorsExperienceTable", field: "honorsExperienceImages" },
      { name: "involvementTable", field: "involvementImages" },
      { name: "projectTable", field: "projectImages" },
      { name: "yearInReviewTable", field: "yearInReviewImages" },
      { name: "FeedTable", field: "feedImageURL" },
    ];

    let dynamicUrls = [];
    for (const { name, field } of collections) {
      const docs = await db
        .collection(name)
        .find({ [field]: { $exists: true }, deleted: { $ne: true } })
        .toArray();
      docs.forEach((doc) => {
        let url = null;
        if (Array.isArray(doc[field]) && doc[field].length > 0) {
          url = doc[field][0];
        } else if (typeof doc[field] === "string") {
          url = doc[field];
        }
        if (url) dynamicUrls.push(url);
      });
    }

    // Deduplicate the dynamic URLs
    const uniqueDynamicUrls = Array.from(new Set(dynamicUrls));

    dynamicImagesCache = {
      data: uniqueDynamicUrls,
      lastUpdated: Date.now(),
    };
    console.log(`Dynamic images cache updated at ${new Date()}`);
  } catch (error) {
    console.error("Error updating dynamic images cache:", error);
  }
}

// 4) Initialize both caches and schedule updates every 12 hours
updateMustLoadImagesCache();
updateDynamicImagesCache();

setInterval(updateMustLoadImagesCache, 12 * 60 * 60 * 1000);
setInterval(updateDynamicImagesCache, 12 * 60 * 60 * 1000);

// 5) API handlers

/**
 * Returns the must-load images (static).
 */
function getMustLoadImages(request, reply) {
  if (!mustLoadImagesCache.data) {
    updateMustLoadImagesCache();
  }
  reply.send(mustLoadImagesCache.data);
}

/**
 * Returns the dynamic images from the database.
 */
async function getDynamicImages(request, reply) {
  if (!dynamicImagesCache.data) {
    await updateDynamicImagesCache();
  }
  reply.send(dynamicImagesCache.data);
}

// Fetch all documents from a collection (excluding soft-deleted items)
const getAllDocuments = async (collectionName) => {
  const db = getDB();
  return db
    .collection(collectionName)
    .find({ deleted: { $ne: true } })
    .toArray();
};

// Fetch a single document by a specific link field (excluding soft-deleted items)
const getDocumentByLink = async (collectionName, linkField, linkValue) => {
  const db = getDB();
  return db
    .collection(collectionName)
    .findOne({ [linkField]: linkValue, deleted: { $ne: true } });
};

// ===== NEW CODE: Caching for GET ALL endpoints =====

// Global in-memory cache object for collections
const cache = {};
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * Helper: fetch all documents from a collection using caching with TTL.
 * If a cached copy exists and is not expired, return that; otherwise, query the DB and cache the result.
 */
const getCachedAllDocuments = async (collectionName) => {
  const now = Date.now();
  if (
    cache[collectionName] &&
    cache[collectionName].data &&
    cache[collectionName].lastUpdated &&
    now - cache[collectionName].lastUpdated < CACHE_TTL_MS
  ) {
    // console.log(`Returning cached data for collection: ${collectionName}`);
    return cache[collectionName].data;
  }
  console.log(
    `No cached data for collection: ${collectionName}. Querying database...`
  );
  const data = await getAllDocuments(collectionName);
  cache[collectionName] = { data, lastUpdated: now };
  console.log(
    `Data for ${collectionName} cached at ${new Date(
      cache[collectionName].lastUpdated
    )}`
  );
  return data;
};

/**
 * Helper: clear the cache for a specific collection.
 * This should be called in your POST, PUT, DELETE handlers for that collection.
 */
const clearCacheForCollection = (collectionName) => {
  if (cache[collectionName]) {
    delete cache[collectionName];
  }
};

// ===== End of Caching Code =====

// ===== NEW CODE: Caching for getCollectionCounts =====

let collectionCountsCache = null;
const clearCollectionCountsCache = () => {
  collectionCountsCache = null;
};

// ===== NEW CODE: Caching for getTopLanguages =====

let topLanguagesCache = null; // holds { data, lastUpdated }

const updateTopLanguagesCache = async () => {
  try {
    const repos = await fetchAllRepos();
    let languageTotals = {};
    let totalBytes = 0;
    const languagePromises = repos.map((repo) =>
      fetchRepoLanguages(repo.languages_url)
    );
    const languagesArray = await Promise.all(languagePromises);
    for (const languagesData of languagesArray) {
      for (const [language, bytes] of Object.entries(languagesData)) {
        if (
          language === "C#" ||
          language === "Rust" ||
          language === "HTML" ||
          language === "CSS" ||
          language === "ShaderLab"
        )
          continue;
        languageTotals[language] = (languageTotals[language] || 0) + bytes;
        totalBytes += bytes;
      }
    }
    const sortedLanguages = Object.entries(languageTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const top6Total = sortedLanguages.reduce(
      (sum, [, bytes]) => sum + bytes,
      0
    );
    const result = {};
    for (const [language, bytes] of sortedLanguages) {
      const percentage = ((bytes / top6Total) * 100).toFixed(2);
      result[language] = percentage + "%";
    }
    topLanguagesCache = { data: result, lastUpdated: new Date() };
    console.log(
      `Top languages cache updated at ${topLanguagesCache.lastUpdated}`
    );
  } catch (error) {
    console.error("Error updating topLanguagesCache:", error);
  }
};

const scheduleTopLanguagesCacheUpdate = () => {
  // Calculate next 12 AM EST update. EST is UTC-5, so 12 AM EST = 05:00 UTC.
  const now = new Date();
  const nowUTC = new Date(Date.now());
  let nextUpdate = new Date(nowUTC);
  nextUpdate.setUTCHours(5, 0, 0, 0);
  if (nextUpdate <= nowUTC) {
    nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
  }
  const delay = nextUpdate - nowUTC;
  console.log(
    `Scheduling topLanguagesCache update in ${delay / 1000} seconds.`
  );
  setTimeout(async () => {
    await updateTopLanguagesCache();
    // Then schedule subsequent updates every 24 hours
    setInterval(updateTopLanguagesCache, 24 * 60 * 60 * 1000);
  }, delay);
};

// Immediately schedule the topLanguages cache update
scheduleTopLanguagesCacheUpdate();

// ===== End of Top Languages Caching Code =====

// Projects
const getProjects = async (request, reply) => {
  try {
    // Use caching for fetching all projects
    const projects = await getCachedAllDocuments("projectTable");
    reply.send(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from projectTable" });
  }
};
const getProjectByLink = async (request, reply) => {
  try {
    const project = await getDocumentByLink(
      "projectTable",
      "projectLink",
      request.params.projectLink
    );
    if (project) {
      reply.send(project);
    } else {
      reply.code(404).send({ message: "project not found" });
    }
  } catch (error) {
    console.error("Error fetching project by link:", error);
    reply
      .code(500)
      .send({ message: "Error fetching document by link from projectTable" });
  }
};
const addProject = async (request, reply) => {
  try {
    const db = getDB();
    const result = await db.collection("projectTable").insertOne(request.body);
    // Clear caches for this collection and collection counts
    clearCacheForCollection("projectTable");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Project added.",
      newItem: { ...request.body, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding project:", error);
    reply.code(500).send({ message: "Error adding project." });
  }
};
const updateProject = async (request, reply) => {
  try {
    const db = getDB();
    // Remove _id from the update payload
    const { _id, ...updateData } = request.body;
    await db
      .collection("projectTable")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    // Clear caches for this collection and collection counts
    clearCacheForCollection("projectTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Project updated." });
  } catch (error) {
    console.error("Error updating project:", error);
    reply.code(500).send({ message: "Error updating project." });
  }
};
const deleteProject = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("projectTable")
      .updateOne(
        { _id: getObjectId(request.params.id) },
        { $set: { deleted: true } }
      );
    // Clear caches for this collection and collection counts
    clearCacheForCollection("projectTable");
    clearCollectionCountsCache();
    // Hard delete (permanently remove) - not used:
    // await db.collection("projectTable").deleteOne({ _id: getObjectId(request.params.id) });
    reply.send({ success: true, message: "Project soft deleted." });
  } catch (error) {
    console.error("Error deleting project:", error);
    reply.code(500).send({ message: "Error deleting project." });
  }
};

// Involvements
const getInvolvements = async (request, reply) => {
  try {
    const involvements = await getCachedAllDocuments("involvementTable");
    reply.send(involvements);
  } catch (error) {
    console.error("Error fetching involvements:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from involvementTable" });
  }
};
const getInvolvementByLink = async (request, reply) => {
  try {
    const involvement = await getDocumentByLink(
      "involvementTable",
      "involvementLink",
      request.params.involvementLink
    );
    if (involvement) {
      reply.send(involvement);
    } else {
      reply.code(404).send({ message: "involvement not found" });
    }
  } catch (error) {
    console.error("Error fetching involvement by link:", error);
    reply.code(500).send({
      message: "Error fetching document by link from involvementTable",
    });
  }
};
const addInvolvement = async (request, reply) => {
  try {
    const db = getDB();
    const result = await db
      .collection("involvementTable")
      .insertOne(request.body);
    clearCacheForCollection("involvementTable");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Involvement added.",
      newItem: { ...request.body, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding involvement:", error);
    reply.code(500).send({ message: "Error adding involvement." });
  }
};
const updateInvolvement = async (request, reply) => {
  try {
    const db = getDB();
    const { _id, ...updateData } = request.body;
    await db
      .collection("involvementTable")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    clearCacheForCollection("involvementTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Involvement updated." });
  } catch (error) {
    console.error("Error updating involvement:", error);
    reply.code(500).send({ message: "Error updating involvement." });
  }
};
const deleteInvolvement = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("involvementTable")
      .updateOne(
        { _id: getObjectId(request.params.id) },
        { $set: { deleted: true } }
      );
    clearCacheForCollection("involvementTable");
    clearCollectionCountsCache();
    // Hard delete (not used):
    // await db.collection("involvementTable").deleteOne({ _id: getObjectId(request.params.id) });
    reply.send({ success: true, message: "Involvement soft deleted." });
  } catch (error) {
    console.error("Error deleting involvement:", error);
    reply.code(500).send({ message: "Error deleting involvement." });
  }
};

// Experiences
const getExperiences = async (request, reply) => {
  try {
    const experiences = await getCachedAllDocuments("experienceTable");
    reply.send(experiences);
  } catch (error) {
    console.error("Error fetching experiences:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from experienceTable" });
  }
};
const getExperienceByLink = async (request, reply) => {
  try {
    const experience = await getDocumentByLink(
      "experienceTable",
      "experienceLink",
      request.params.experienceLink
    );
    if (experience) {
      reply.send(experience);
    } else {
      reply.code(404).send({ message: "experience not found" });
    }
  } catch (error) {
    console.error("Error fetching experience by link:", error);
    reply.code(500).send({
      message: "Error fetching document by link from experienceTable",
    });
  }
};
const addExperience = async (request, reply) => {
  try {
    const db = getDB();
    const result = await db
      .collection("experienceTable")
      .insertOne(request.body);
    clearCacheForCollection("experienceTable");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Experience added.",
      newItem: { ...request.body, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding experience:", error);
    reply.code(500).send({ message: "Error adding experience." });
  }
};
const updateExperience = async (request, reply) => {
  try {
    const db = getDB();
    const { _id, ...updateData } = request.body;
    await db
      .collection("experienceTable")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    clearCacheForCollection("experienceTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Experience updated." });
  } catch (error) {
    console.error("Error updating experience:", error);
    reply.code(500).send({ message: "Error updating experience." });
  }
};
const deleteExperience = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("experienceTable")
      .updateOne(
        { _id: getObjectId(request.params.id) },
        { $set: { deleted: true } }
      );
    clearCacheForCollection("experienceTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Experience soft deleted." });
  } catch (error) {
    console.error("Error deleting experience:", error);
    reply.code(500).send({ message: "Error deleting experience." });
  }
};

// Year In Reviews
const getYearInReviews = async (request, reply) => {
  try {
    const yearInReviews = await getCachedAllDocuments("yearInReviewTable");
    reply.send(yearInReviews);
  } catch (error) {
    console.error("Error fetching year in reviews:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from yearInReviewTable" });
  }
};
const getYearInReviewByLink = async (request, reply) => {
  try {
    const yir = await getDocumentByLink(
      "yearInReviewTable",
      "yearInReviewLink",
      request.params.yearInReviewLink
    );
    if (yir) {
      reply.send(yir);
    } else {
      reply.code(404).send({ message: "yearInReview not found" });
    }
  } catch (error) {
    console.error("Error fetching year in review by link:", error);
    reply.code(500).send({
      message: "Error fetching document by link from yearInReviewTable",
    });
  }
};
const addYearInReview = async (request, reply) => {
  try {
    const db = getDB();
    const result = await db
      .collection("yearInReviewTable")
      .insertOne(request.body);
    clearCacheForCollection("yearInReviewTable");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Year in Review added.",
      newItem: { ...request.body, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding year in review:", error);
    reply.code(500).send({ message: "Error adding year in review." });
  }
};
const updateYearInReview = async (request, reply) => {
  try {
    const db = getDB();
    const { _id, ...updateData } = request.body;
    await db
      .collection("yearInReviewTable")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    clearCacheForCollection("yearInReviewTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Year in Review updated." });
  } catch (error) {
    console.error("Error updating year in review:", error);
    reply.code(500).send({ message: "Error updating year in review." });
  }
};
const deleteYearInReview = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("yearInReviewTable")
      .updateOne(
        { _id: getObjectId(request.params.id) },
        { $set: { deleted: true } }
      );
    clearCacheForCollection("yearInReviewTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Year in Review soft deleted." });
  } catch (error) {
    console.error("Error deleting year in review:", error);
    reply.code(500).send({ message: "Error deleting year in review." });
  }
};

// Honors Experiences
const getHonorsExperiences = async (request, reply) => {
  try {
    const honors = await getCachedAllDocuments("honorsExperienceTable");
    reply.send(honors);
  } catch (error) {
    console.error("Error fetching honors experiences:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from honorsExperienceTable" });
  }
};
const getHonorsExperienceByLink = async (request, reply) => {
  try {
    const honorsExp = await getDocumentByLink(
      "honorsExperienceTable",
      "honorsExperienceLink",
      request.params.honorsExperienceLink
    );
    if (honorsExp) {
      reply.send(honorsExp);
    } else {
      reply.code(404).send({ message: "honorsExperience not found" });
    }
  } catch (error) {
    console.error("Error fetching honors experience by link:", error);
    reply.code(500).send({
      message: "Error fetching document by link from honorsExperienceTable",
    });
  }
};
const addHonorsExperience = async (request, reply) => {
  try {
    const db = getDB();
    const result = await db
      .collection("honorsExperienceTable")
      .insertOne(request.body);
    clearCacheForCollection("honorsExperienceTable");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Honors experience added.",
      newItem: { ...request.body, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding honors experience:", error);
    reply.code(500).send({ message: "Error adding honors experience." });
  }
};
const updateHonorsExperience = async (request, reply) => {
  try {
    const db = getDB();
    const { _id, ...updateData } = request.body;
    await db
      .collection("honorsExperienceTable")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    clearCacheForCollection("honorsExperienceTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Honors experience updated." });
  } catch (error) {
    console.error("Error updating honors experience:", error);
    reply.code(500).send({ message: "Error updating honors experience." });
  }
};
const deleteHonorsExperience = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("honorsExperienceTable")
      .updateOne(
        { _id: getObjectId(request.params.id) },
        { $set: { deleted: true } }
      );
    clearCacheForCollection("honorsExperienceTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Honors experience soft deleted." });
  } catch (error) {
    console.error("Error deleting honors experience:", error);
    reply.code(500).send({ message: "Error deleting honors experience." });
  }
};

// Skills
const getSkills = async (request, reply) => {
  try {
    const skills = await getCachedAllDocuments("skillsCollection");
    reply.send(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from skillsCollection" });
  }
};
const getSkillComponents = async (request, reply) => {
  try {
    const components = await getCachedAllDocuments("skillsTable");
    reply.send(components);
  } catch (error) {
    console.error("Error fetching skill components:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from skillsTable" });
  }
};
const addSkill = async (request, reply) => {
  try {
    const db = getDB();
    const result = await db
      .collection("skillsCollection")
      .insertOne(request.body);
    clearCacheForCollection("skillsCollection");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Skill added.",
      newItem: { ...request.body, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding skill:", error);
    reply.code(500).send({ message: "Error adding skill." });
  }
};
const updateSkill = async (request, reply) => {
  try {
    const db = getDB();
    const { _id, ...updateData } = request.body;
    await db
      .collection("skillsCollection")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    clearCacheForCollection("skillsCollection");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Skill updated." });
  } catch (error) {
    console.error("Error updating skill:", error);
    reply.code(500).send({ message: "Error updating skill." });
  }
};
const deleteSkill = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("skillsCollection")
      .updateOne(
        { _id: getObjectId(request.params.id) },
        { $set: { deleted: true } }
      );
    clearCacheForCollection("skillsCollection");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Skill soft deleted." });
  } catch (error) {
    console.error("Error deleting skill:", error);
    reply.code(500).send({ message: "Error deleting skill." });
  }
};
const addSkillComponent = async (request, reply) => {
  try {
    const db = getDB();
    const result = await db.collection("skillsTable").insertOne(request.body);
    clearCacheForCollection("skillsTable");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Skill component added.",
      newItem: { ...request.body, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding skill component:", error);
    reply.code(500).send({ message: "Error adding skill component." });
  }
};
const updateSkillComponent = async (request, reply) => {
  try {
    const db = getDB();
    const { _id, ...updateData } = request.body;
    await db
      .collection("skillsTable")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    clearCacheForCollection("skillsTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Skill component updated." });
  } catch (error) {
    console.error("Error updating skill component:", error);
    reply.code(500).send({ message: "Error updating skill component." });
  }
};
const deleteSkillComponent = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("skillsTable")
      .updateOne(
        { _id: getObjectId(request.params.id) },
        { $set: { deleted: true } }
      );
    clearCacheForCollection("skillsTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Skill component soft deleted." });
  } catch (error) {
    console.error("Error deleting skill component:", error);
    reply.code(500).send({ message: "Error deleting skill component." });
  }
};

// Feeds
const getFeeds = async (request, reply) => {
  try {
    const feeds = await getCachedAllDocuments("FeedTable");
    reply.send(feeds);
  } catch (error) {
    console.error("Error fetching feeds:", error);
    reply
      .code(500)
      .send({ message: "Error fetching documents from FeedTable" });
  }
};
const addFeed = async (request, reply) => {
  const { feedTitle, feedCategory, feedContent, feedImageURL, feedLinks } =
    request.body;

  // Validate mandatory fields
  if (!feedTitle || !feedCategory) {
    return reply
      .code(400)
      .send({ message: "feedTitle and feedCategory are required." });
  }

  try {
    const db = getDB();
    const newFeed = {
      feedTitle,
      feedCategory,
      feedContent: feedContent || [],
      feedImageURL: feedImageURL || null,
      feedLinks: feedLinks || [],
      feedCreatedAt: new Date().toISOString(),
    };
    const result = await db.collection("FeedTable").insertOne(newFeed);
    clearCacheForCollection("FeedTable");
    clearCollectionCountsCache();
    reply.send({
      success: true,
      message: "Feed added successfully.",
      newItem: { ...newFeed, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error adding feed:", error);
    reply.code(500).send({ message: "Error adding feed", error });
  }
};

const editFeed = async (request, reply) => {
  try {
    const db = getDB();
    const { _id, ...updateData } = request.body;
    await db
      .collection("FeedTable")
      .updateOne({ _id: getObjectId(request.params.id) }, { $set: updateData });
    clearCacheForCollection("FeedTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Feed updated." });
  } catch (error) {
    console.error("Error updating feed:", error);
    reply.code(500).send({ message: "Error updating feed." });
  }
};
const deleteFeed = async (request, reply) => {
  try {
    const db = getDB();
    await db
      .collection("FeedTable")
      .deleteOne({ _id: getObjectId(request.params.id) });
    clearCacheForCollection("FeedTable");
    clearCollectionCountsCache();
    reply.send({ success: true, message: "Feed deleted." });
  } catch (error) {
    console.error("Error deleting feed:", error);
    reply.code(500).send({ message: "Error deleting feed." });
  }
};
const addLike = async (request, reply) => {
  const { type, title } = request.body;
  // console.log("Type: " + type + " Title: " + title);
  // Both 'type' and 'title' fields are required
  if (!type || !title) {
    return reply
      .code(400)
      .send({ message: "Both 'type' and 'title' are required." });
  }
  // Map the type to the corresponding collection and field
  const typeMapping = {
    Project: { collection: "projectTable", titleField: "projectTitle" },
    Experience: {
      collection: "experienceTable",
      titleField: "experienceTitle",
    },
    Involvement: {
      collection: "involvementTable",
      titleField: "involvementTitle",
    },
    Honors: {
      collection: "honorsExperienceTable",
      titleField: "honorsExperienceTitle",
    },
    YearInReview: {
      collection: "yearInReviewTable",
      titleField: "yearInReviewTitle",
    },
    Feed: { collection: "FeedTable", titleField: "feedTitle" },
  };
  const mapping = typeMapping[type];
  if (!mapping) {
    return reply.code(400).send({ message: "Invalid type provided." });
  }
  try {
    const db = getDB();
    // Build filter to find the document by title field
    const filter = { [mapping.titleField]: title, deleted: { $ne: true } };
    const update = { $inc: { likesCount: 1 } };
    const result = await db
      .collection(mapping.collection)
      .updateOne(filter, update);
    if (result.modifiedCount === 0) {
      // No document was updated (not found or already deleted)
      return reply
        .code(404)
        .send({ message: "Document not found or cannot be updated." });
    }
    clearCacheForCollection(mapping.collection);
    return reply.send({ success: true, message: "Like added successfully." });
  } catch (error) {
    console.error("Error in addLike:", error);
    reply.code(500).send({ message: "Server error while adding like." });
  }
};
// const resetLikes = async (request, reply) => {
//   try {
//     const db = getDB();
//     // Define the collections that hold a likesCount field
//     const collectionsToReset = [
//       "FeedTable",
//       "yearInReviewTable",
//       "projectTable",
//       "involvementTable",
//       "honorsExperienceTable",
//       "experienceTable",
//     ];
//     // For each collection, update all documents to set likesCount to 0
//     for (const colName of collectionsToReset) {
//       await db.collection(colName).updateMany({}, { $set: { likesCount: 0 } });
//     }
//     reply.send({ success: true, message: "All likes reset to 0" });
//   } catch (error) {
//     console.error("Error resetting likes:", error);
//     reply.code(500).send({ success: false, message: "Error resetting likes" });
//   }
// };

// Admin Management
const compareAdminName = async (request, reply) => {
  const { userName } = request.body;
  const db = getDB();
  const admin = await db.collection("KartavyaPortfolio").findOne({});
  if (!admin) {
    return reply.code(404).send({ message: "No Admin found." });
  }
  const match = await bcrypt.compare(userName, admin.userName);
  return match
    ? reply.send({ success: true })
    : reply.code(401).send({ message: "Incorrect Username" });
};
const compareAdminPassword = async (request, reply) => {
  const { password } = request.body;
  const db = getDB();
  try {
    const admin = await db.collection("KartavyaPortfolio").findOne({});
    if (!admin) {
      return reply.code(404).send({ message: "Admin not found" });
    }
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return reply.code(401).send({ message: "Incorrect Password" });
    }
    // Generate OTP and store it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date(Date.now() + 5 * 60000); // 5 minutes from now
    await db.collection("KartavyaPortfolioOTP").deleteMany({});
    await db.collection("KartavyaPortfolioOTP").insertOne({ otp, expireTime });
    reply.send({
      success: true,
      otpSent: true,
      otp: otp,
      message: "OTP sent.",
    });
  } catch (error) {
    reply.code(500).send({ message: "Error comparing passwords." });
  }
};
const compareOTP = async (request, reply) => {
  const { otp, rememberMe = false } = request.body;
  const db = getDB();
  try {
    const otpData = await db.collection("KartavyaPortfolioOTP").findOne({});
    if (!otpData || otpData.otp !== otp) {
      return reply.code(400).send({ message: "Invalid OTP" });
    }
    const currentTime = new Date();
    if (otpData.expireTime < currentTime) {
      return reply.code(400).send({ message: "OTP expired" });
    }
    // Determine token expiration based on rememberMe flag
    const expiresIn = rememberMe ? "365d" : "1h"; // 365 days vs 1 hour
    const token = jwt.sign({ user: "admin" }, process.env.JWT_SECRET, {
      expiresIn,
    });
    // Set secure HTTP-only cookie with the JWT token
    reply.setCookie("token", token, {
      path: "/", // Force the cookie to be available at root
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: rememberMe ? 365 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
    });

    // Invalidate the OTP after use
    await db.collection("KartavyaPortfolioOTP").deleteOne({});
    return reply.send({ success: true, message: "Logged in successfully!" });
  } catch (err) {
    reply.code(500).send({ message: "Server error" });
  }
};
const logoutAdmin = (req, reply) => {
  reply.clearCookie("token", {
    path: "/", // Must match the path used when setting the cookie
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  reply.send({ success: true, message: "Logged out successfully!" });
};

const setAdminCredentials = async (request, reply) => {
  const { userName, password, currentPassword } = request.body;
  const db = getDB();
  try {
    const admin = await db.collection("KartavyaPortfolio").findOne({});
    if (!admin) {
      return reply.code(404).send({ message: "Admin not found." });
    }
    const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatch) {
      return reply
        .code(401)
        .send({ message: "Current password is incorrect." });
    }
    const hashedUsername = await bcrypt.hash(userName, 10);
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("KartavyaPortfolio").deleteMany({});
    await db.collection("KartavyaPortfolio").insertOne({
      userName: hashedUsername,
      password: hashedPassword,
    });
    reply.send({ success: true, message: "Admin credentials set." });
  } catch (error) {
    console.error("Error setting admin credentials:", error);
    reply.code(500).send({ message: "Error setting credentials." });
  }
};

// Miscellaneous
const getCollectionCounts = async (request, reply) => {
  try {
    if (collectionCountsCache) {
      // console.log("Returning cached collection counts.");
      reply.send(collectionCountsCache.data);
      return;
    }
    const db = getDB();
    const collections = {
      skillsCollection: await db
        .collection("skillsCollection")
        .countDocuments({ deleted: { $ne: true } }),
      skillsTable: await db
        .collection("skillsTable")
        .countDocuments({ deleted: { $ne: true } }),
      projectTable: await db
        .collection("projectTable")
        .countDocuments({ deleted: { $ne: true } }),
      experienceTable: await db
        .collection("experienceTable")
        .countDocuments({ deleted: { $ne: true } }),
      involvementTable: await db
        .collection("involvementTable")
        .countDocuments({ deleted: { $ne: true } }),
      honorsExperienceTable: await db
        .collection("honorsExperienceTable")
        .countDocuments({ deleted: { $ne: true } }),
      yearInReviewTable: await db
        .collection("yearInReviewTable")
        .countDocuments({ deleted: { $ne: true } }),
      KartavyaPortfolio: await db
        .collection("KartavyaPortfolio")
        .countDocuments(),
      FeedTable: await db
        .collection("FeedTable")
        .countDocuments({ deleted: { $ne: true } }),
    };
    collectionCountsCache = { data: collections, lastUpdated: new Date() };
    console.log(
      `Collection counts cached at ${collectionCountsCache.lastUpdated}`
    );
    reply.send(collectionCountsCache.data);
  } catch (error) {
    console.error("Error fetching collection counts:", error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
};

// GitHub Stats – aggregate top 6 languages with percentage share (for /api/github-stats/top-langs)
const getTopLanguages = async (request, reply) => {
  try {
    if (topLanguagesCache && topLanguagesCache.data) {
      // console.log("Returning cached top languages data.");
      reply.send(topLanguagesCache.data);
    } else {
      console.log("No cached top languages data. Updating now...");
      await updateTopLanguagesCache();
      reply.send(topLanguagesCache.data);
    }
  } catch (error) {
    console.error("Error aggregating GitHub language stats:", error.message);
    reply.code(500).send({
      error: "Failed to fetch and process GitHub language statistics",
    });
  }
};

module.exports = {
  getMustLoadImages,
  getDynamicImages,
  getProjects,
  getProjectByLink,
  getInvolvements,
  getInvolvementByLink,
  getExperiences,
  getExperienceByLink,
  getYearInReviews,
  getYearInReviewByLink,
  getHonorsExperiences,
  getHonorsExperienceByLink,
  getSkills,
  getSkillComponents,
  compareAdminName,
  compareAdminPassword,
  compareOTP,
  logoutAdmin,
  getCollectionCounts,
  setAdminCredentials,
  addProject,
  updateProject,
  deleteProject,
  addInvolvement,
  updateInvolvement,
  deleteInvolvement,
  addExperience,
  updateExperience,
  deleteExperience,
  addYearInReview,
  updateYearInReview,
  deleteYearInReview,
  addHonorsExperience,
  updateHonorsExperience,
  deleteHonorsExperience,
  addSkill,
  updateSkill,
  deleteSkill,
  addSkillComponent,
  updateSkillComponent,
  deleteSkillComponent,
  getFeeds,
  addFeed,
  deleteFeed,
  editFeed,
  addLike,
  // resetLikes,
  getTopLanguages,
};
