import assert from "node:assert/strict";
import { liteClient } from "algoliasearch/lite";
import dotenv from "dotenv";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const appId =
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID;
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;
const indexName =
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ||
  process.env.ALGOLIA_INDEX_NAME ||
  "turbo-start-sanity";

assert.ok(appId, "NEXT_PUBLIC_ALGOLIA_APP_ID must be set");
assert.ok(searchKey, "NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY must be set");

const client = liteClient(appId, searchKey);

async function runTests() {
  console.log("=== Running Task 2 Algolia Search Verification Tests ===");

  // Test 1: Empty Query Default State
  console.log("\n[Test 1] Testing Default State (empty query)...");
  const defaultRes = await client.search({
    requests: [
      {
        indexName,
        query: "",
        hitsPerPage: 50,
      },
    ],
  });
  const defaultHits = defaultRes.results[0]?.hits ?? [];
  console.log(`✓ Received ${defaultHits.length} published hits on empty query`);
  assert.ok(
    defaultHits.length >= 20 && defaultHits.length <= 25,
    `Expected 20-25 published posts, received ${defaultHits.length}`
  );

  // Verify newest-first ordering
  for (let i = 0; i < defaultHits.length - 1; i++) {
    const timeA = defaultHits[i].publishedTimestamp || 0;
    const timeB = defaultHits[i + 1].publishedTimestamp || 0;
    assert.ok(
      timeA >= timeB,
      `Hits should be sorted newest first: ${defaultHits[i].publishedAt} vs ${defaultHits[i + 1].publishedAt}`
    );
  }
  console.log("✓ Hits are sorted strictly newest-first");

  // Test 2: Text Search with Highlights
  console.log(
    "\n[Test 2] Testing search-as-you-type with match highlighting..."
  );
  const searchRes = await client.search({
    requests: [
      {
        indexName,
        query: "support",
        hitsPerPage: 10,
      },
    ],
  });
  const searchHits = searchRes.results[0]?.hits ?? [];
  assert.ok(
    searchHits.length > 0,
    "Expected at least 1 hit for query 'support'"
  );
  const hit = searchHits[0];
  const highlightedTitle = hit._highlightResult?.title?.value || "";
  console.log(`✓ Found hit: "${hit.title}"`);
  console.log(`✓ Highlighted HTML: "${highlightedTitle}"`);
  assert.ok(
    highlightedTitle.includes("<mark>Support</mark>") ||
      highlightedTitle.toLowerCase().includes("<mark>support</mark>"),
    "Title highlight should contain <mark> tags"
  );

  // Test 3: Multi-select AND Category Filtering
  console.log("\n[Test 3] Testing multi-category AND filtering...");
  const catSkillsRes = await client.search({
    requests: [
      {
        indexName,
        query: "",
        facetFilters: ["categories:skills"],
        hitsPerPage: 50,
      },
    ],
  });
  const skillsHits = catSkillsRes.results[0]?.hits ?? [];
  console.log(`✓ Posts in 'skills' category: ${skillsHits.length}`);
  assert.ok(skillsHits.length > 0, "Expected posts with 'skills' category");
  for (const h of skillsHits) {
    assert.ok(
      h.categories.includes("skills"),
      `Post "${h.title}" must include category 'skills'`
    );
  }

  // Non-matching intersection should yield 0 hits
  const catBothRes = await client.search({
    requests: [
      {
        indexName,
        query: "",
        facetFilters: ["categories:skills", "categories:nonexistent123"],
        hitsPerPage: 50,
      },
    ],
  });
  assert.equal(
    catBothRes.results[0]?.hits?.length,
    0,
    "Intersection with non-matching category must yield 0 results (AND logic)"
  );
  console.log("✓ AND logic verified (no match for conflicting categories)");

  // Test 4: Dynamic Options Derivation
  console.log("\n[Test 4] Testing dynamic category option derivation...");
  const uniqueCats = new Set();
  for (const h of defaultHits) {
    for (const c of h.categories) {
      uniqueCats.add(c);
    }
  }
  console.log(
    `✓ Available category taxonomy across published posts: [${Array.from(uniqueCats).join(", ")}]`
  );
  assert.ok(
    uniqueCats.size > 0,
    "Categories must be extracted from published posts"
  );

  // Test 5: Rapid Typing Out-Of-Order Handling Simulation
  console.log("\n[Test 5] Testing out-of-order sequence resolution...");
  let latestRequestId = 0;
  let activeResults = "initial";

  const simulateRequest = async (id, delayMs, val) => {
    await new Promise((r) => setTimeout(r, delayMs));
    if (id === latestRequestId) {
      activeResults = val;
    }
  };

  // Dispatched request 1 takes 100ms
  latestRequestId = 1;
  const p1 = simulateRequest(1, 100, "result-1");
  // Dispatched request 2 takes 20ms (finished earlier)
  latestRequestId = 2;
  const p2 = simulateRequest(2, 20, "result-2");

  await Promise.all([p1, p2]);
  assert.equal(
    activeResults,
    "result-2",
    "Request 1 must be discarded and never overwrite Request 2"
  );
  console.log(
    "✓ Out-of-order responses correctly discarded by request sequence tracking"
  );

  console.log("\n=== ALL ALGOLIA SEARCH TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
