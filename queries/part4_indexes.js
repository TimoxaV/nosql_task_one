use("spotify");

// Walks winningPlan.inputStage and returns the full stage chain,
function planChain(plan) {
  const stages = [];
  let node = plan;
  while (node) {
    stages.push(node.stage);
    node = node.inputStage || null;
  }
  return stages.reverse().join(" -> ");
}

// Task 1
const beforeIndex = db.tracks
  .find(
    {
      track_genre: "pop",
      "audio_features.danceability": { $gte: 0.7 }
    }
  )
  .sort({ popularity: -1 })
  .explain("executionStats");

const b = beforeIndex.executionStats;

db.tracks.createIndex(
  {
    track_genre:                   1,
    "audio_features.danceability": 1,
    popularity:                   -1
  },
  { name: "idx_genre_danceability_popularity" }
);

const afterIndex = db.tracks
  .find(
    {
      track_genre: "pop",
      "audio_features.danceability": { $gte: 0.7 }
    }
  )
  .sort({ popularity: -1 })
  .explain("executionStats");

const a = afterIndex.executionStats;

print("\n========== TASK 1: Before / After summary ==========");
print("Metric              | BEFORE                      | AFTER");
print("--------------------|-----------------------------|------------------");
print("Plan chain          | " + planChain(beforeIndex.queryPlanner.winningPlan).padEnd(27) + " | " + planChain(afterIndex.queryPlanner.winningPlan));
print("executionTimeMillis | " + String(b.executionTimeMillis).padEnd(27) + " | " + a.executionTimeMillis);
print("totalDocsExamined   | " + String(b.totalDocsExamined).padEnd(27) + " | " + a.totalDocsExamined);
print("totalKeysExamined   | " + String(b.totalKeysExamined).padEnd(27) + " | " + a.totalKeysExamined);

// Task 2
const workBefore = db.tracks
  .find({
    "audio_features.instrumentalness": { $gt: 0.5 },
    "audio_features.speechiness":      { $lt: 0.1 },
    explicit: false
  })
  .explain("executionStats");

const wb = workBefore.executionStats;

db.tracks.createIndex(
  {
    "audio_features.instrumentalness": 1,
    "audio_features.speechiness":      1,
    explicit:                           1
  },
  { name: "idx_work_music" }
);

const workAfter = db.tracks
  .find({
    "audio_features.instrumentalness": { $gt: 0.5 },
    "audio_features.speechiness":      { $lt: 0.1 },
    explicit: false
  })
  .explain("executionStats");

const wa = workAfter.executionStats;

print("\n========== TASK 2: Before / After summary ==========");
print("Metric              | BEFORE                      | AFTER");
print("--------------------|-----------------------------|------------------");
print("Plan chain          | " + planChain(workBefore.queryPlanner.winningPlan).padEnd(27) + " | " + planChain(workAfter.queryPlanner.winningPlan));
print("executionTimeMillis | " + String(wb.executionTimeMillis).padEnd(27) + " | " + wa.executionTimeMillis);
print("totalDocsExamined   | " + String(wb.totalDocsExamined).padEnd(27) + " | " + wa.totalDocsExamined);
print("totalKeysExamined   | " + String(wb.totalKeysExamined).padEnd(27) + " | " + wa.totalKeysExamined);

// Task 3
print("\n========== TASK 3 ==========");
print("TASK 3: explain() — no projection")
const coveredCandidate = db.tracks
  .find({ track_genre: "pop", popularity: { $gte: 70 } })
  .explain("executionStats");

const cc = coveredCandidate.executionStats;
print("Plan chain  : " + planChain(coveredCandidate.queryPlanner.winningPlan));
print("Time (ms)   : " + cc.executionTimeMillis);
print("docsExamined: " + cc.totalDocsExamined);
print("keysExamined: " + cc.totalKeysExamined);

print("\nTASK 3: explain() — with projection (covered attempt)");
const coveredWithProjection = db.tracks
  .find(
    { track_genre: "pop", popularity: { $gte: 70 } },
    { _id: 0, track_genre: 1, popularity: 1, "audio_features.danceability": 1 }
  )
  .explain("executionStats");

const cp = coveredWithProjection.executionStats;
print("Plan chain  : " + planChain(coveredWithProjection.queryPlanner.winningPlan));
print("Time (ms)   : " + cp.executionTimeMillis);
print("docsExamined: " + cp.totalDocsExamined);
print("keysExamined: " + cp.totalKeysExamined);
