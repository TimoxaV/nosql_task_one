// Run: mongosh "MONGO_URI" --file scripts/02_transform.js

use("spotify");

db.tracks.drop();

db.tracks_raw.aggregate([
  // Stage 1: keep only needed fields, rename artists
  {
    $project: {
      _id: 0,
      track_id:     1,
      track_name:   1,
      album_name:   1,
      explicit:     1,
      popularity:   1,
      duration_ms:  1,
      track_genre:  1,
      artists_raw:  "$artists",
      danceability:     1,
      energy:           1,
      loudness:         1,
      speechiness:      1,
      acousticness:     1,
      instrumentalness: 1,
      liveness:         1,
      valence:          1,
      tempo:            1,
      key:              1,
      mode:             1,
      time_signature:   1
    }
  },

  // Stage 2: reshape into document-oriented schema
  {
    $addFields: {
      artists: {
        $map: {
          input: { $split: ["$artists_raw", ";"] },
          as: "a",
          in: { $trim: { input: "$$a" } }
        }
      },

      // Nest all audio columns under one sub-document
      audio_features: {
        danceability:     "$danceability",
        energy:           "$energy",
        loudness:         "$loudness",
        speechiness:      "$speechiness",
        acousticness:     "$acousticness",
        instrumentalness: "$instrumentalness",
        liveness:         "$liveness",
        valence:          "$valence",
        tempo:            "$tempo",
        key:              "$key",
        mode:             "$mode",
        time_signature:   "$time_signature"
      },

      // Duration in seconds, rounded to 1 decimal
      duration_sec: {
        $round: [{ $divide: ["$duration_ms", 1000] }, 1]
      },

      // Popularity tier: high / medium / low
      popularity_tier: {
        $switch: {
          branches: [
            { case: { $gte: ["$popularity", 70] }, then: "high"   },
            { case: { $gte: ["$popularity", 40] }, then: "medium" }
          ],
          default: "low"
        }
      }
    }
  },

  // Stage 3: remove flat audio fields and the temporary artists_raw
  {
    $unset: [
      "artists_raw",
      "danceability",
      "energy",
      "loudness",
      "speechiness",
      "acousticness",
      "instrumentalness",
      "liveness",
      "valence",
      "tempo",
      "key",
      "mode",
      "time_signature"
    ]
  },

  // Stage 4: write result to tracks (atomically replaces the collection)
  { $out: "tracks" }
]);

print("tracks count:", db.tracks.countDocuments({}));
printjson(db.tracks.findOne());
