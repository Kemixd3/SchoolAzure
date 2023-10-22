import { Router } from "express";
const albumsController = Router();

import pool from "../Services/dbService.js";

albumsController.post("/albums", async (req, res) => {
  const { album_title, release_date } = req.body;
  const sql = "INSERT INTO Albums (album_title, release_date) VALUES (?, ?)";

  try {
    const [result, fields] = await pool
      .promise()
      .query(sql, [album_title, release_date]);
    res.status(201).json({ album_id: result.insertId });
  } catch (err) {
    console.error("Error creating album:", err);
    res.status(500).send("Error creating album");
  }
});

albumsController.get("/albums", async (req, res) => {
  try {
    const connection = await pool.promise().getConnection();

    try {
      const [albums, fields] = await connection.query("SELECT * FROM albums");
      res.status(200).json(albums);
    } catch (selectErr) {
      console.error("Error retrieving albums:", selectErr);
      res.status(500).send("Error retrieving albums");
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error getting MySQL connection:", err);
    res.status(500).send("Error retrieving albums");
  }
});

albumsController.post("/album_tracks", async (req, res) => {
  const { album_id, track_id, track_order } = req.body;
  console.log(album_id);

  const sql =
    "INSERT INTO Album_Tracks (album_id, track_id, track_order) VALUES (?, ?, ?)";

  try {
    const [result, fields] = await pool
      .promise()
      .query(sql, [album_id, track_id, track_order]);
    res.status(201).send("Album tracklisting created successfully");
  } catch (err) {
    console.error("Error creating album tracklisting:", err);
    res.status(500).send("Error creating album tracklisting");
  }
});

albumsController.post("/album_artists", async (req, res) => {
  const { album_id, artist_id } = req.body;
  const sql = "INSERT INTO album_artists (album_id, artist_id) VALUES (?, ?";

  // Check if the relationship already exists
  const checkSql =
    "SELECT * FROM album_artists WHERE album_id = ? AND artist_id = ?";

  try {
    const [checkResult, checkFields] = await pool
      .promise()
      .query(checkSql, [album_id, artist_id]);

    if (checkResult.length > 0) {
      // The relationship already exists
      res
        .status(400)
        .json({ error: "Album-artist relationship already exists" });
      return;
    }

    // The relationship doesn't exist, so insert it
    const [result, fields] = await pool
      .promise()
      .query(sql, [album_id, artist_id]);
    res.status(201).json({ relationship_id: result.insertId });
  } catch (err) {
    console.error("Error creating or checking album-artist relationship:", err);
    res
      .status(500)
      .json({ error: "Error creating or checking album-artist relationship" });
  }
});

albumsController.post("/related_albums", async (req, res) => {
  const { original_album_id, related_album_id } = req.body;
  const sql =
    "INSERT INTO Related_Albums (original_album_id, related_album_id) VALUES (?, ?)";

  try {
    const [result, fields] = await pool
      .promise()
      .query(sql, [original_album_id, related_album_id]);
    res.status(201).json({ relationship_id: result.insertId });
  } catch (err) {
    console.error("Error creating related album relationship:", err);
    res.status(500).send("Error creating related album relationship");
  }
});

// Search for albums by title
albumsController.get("/search/albums", async (req, res) => {
  const { query } = req.query;
  const sql = "SELECT * FROM Albums WHERE album_title LIKE ?";
  const searchQuery = `%${query}%`;

  try {
    const [albums, fields] = await pool.promise().query(sql, [searchQuery]);
    res.status(200).json(albums);
  } catch (err) {
    console.error("Error searching for albums:", err);
    res.status(500).send("Error searching for albums");
  }
});

// Backend API Route
albumsController.get("/search/albums-with-tracks", async (req, res) => {
  const { query } = req.query;
  const albumSql = "SELECT * FROM Albums WHERE album_title LIKE ?";
  const searchQuery = `%${query}%`;

  try {
    const [albums, albumFields] = await pool
      .promise()
      .query(albumSql, [searchQuery]);

    const albumsWithTracks = [];

    const trackSql = "SELECT * FROM tracks WHERE album_id = ?";

    const getTracksForAlbum = async (album) => {
      try {
        const [tracks, trackFields] = await pool
          .promise()
          .query(trackSql, [album.album_id]);
        return { ...album, tracks };
      } catch (err) {
        console.error("Error fetching tracks for album:", err);
        throw err;
      }
    };

    const albumPromises = albums.map(getTracksForAlbum);

    const result = await Promise.all(albumPromises);
    albumsWithTracks.push(...result);

    res.status(200).json(albumsWithTracks);
  } catch (err) {
    console.error("Error searching for albums with tracks:", err);
    res.status(500).send("Error searching for albums with tracks");
  }
});

// Backend API Route
albumsController.get(
  "/search/albums-with-artists-and-tracks",
  async (req, res) => {
    try {
      const { query } = req.query;
      const searchQuery = `%${query}%`;

      // SQL query to fetch albums with related artists and tracks
      const sql = `
      SELECT
        a.album_id,
        a.album_title,
        a.release_date,
        b.artist_id,
        b.artist_name,
        GROUP_CONCAT(t.track_id) AS track_ids,
        GROUP_CONCAT(t.track_title) AS track_titles,
        GROUP_CONCAT(t.duration) AS track_durations
      FROM Albums a
      LEFT JOIN Album_Artists aa ON a.album_id = aa.album_id
      LEFT JOIN Artists b ON aa.artist_id = b.artist_id
      LEFT JOIN Tracks t ON a.album_id = t.album_id
      WHERE (a.album_title LIKE ? OR b.artist_name LIKE ?)
      GROUP BY a.album_id, a.album_title, a.release_date, b.artist_id, b.artist_name;
    `;

      console.log("Search Query:", searchQuery); // Log the search query for debugging

      const [results, fields] = await pool
        .promise()
        .query(sql, [searchQuery, searchQuery]);

      // Process the results and structure the data as needed
      const albumsWithArtistsAndTracks = results.map((row) => {
        const trackIds = row.track_ids.split(",");
        const trackTitles = row.track_titles.split(",");
        const trackDurations = row.track_durations.split(",");

        const tracks = trackIds.map((trackId, index) => ({
          track_id: trackId,
          track_title: trackTitles[index],
          duration: trackDurations[index],
        }));

        return {
          album_id: row.album_id,
          album_title: row.album_title,
          release_date: row.release_date,
          artists: [
            {
              artist_id: row.artist_id,
              artist_name: row.artist_name,
            },
          ],
          tracks,
        };
      });

      res.status(200).json(albumsWithArtistsAndTracks);
    } catch (err) {
      console.error("Error searching for albums with artists and tracks:", err);
      res.status(500).json("error");
    }
  }
);

// Delete an album by album ID
albumsController.delete("/albums/:albumId", async (req, res) => {
  try {
    const albumId = req.params.albumId;
    const sql = "DELETE FROM Albums WHERE album_id = ?";

    const [result] = await pool.promise().query(sql, [albumId]);

    if (result.affectedRows === 0) {
      // No rows were deleted, so the album with the given ID doesn't exist
      res.status(404).json({ error: "Album not found" });
    } else {
      res.status(204).send(); // 204 No Content indicates successful deletion
    }
  } catch (err) {
    console.error("Error deleting album:", err);
    res.status(500).json({ error: "Error deleting album" });
  }
});

// Update an album by album ID
albumsController.put("/albums/:albumId", async (req, res) => {
  try {
    const albumId = req.params.albumId;
    const { album_title, release_date } = req.body;
    const sql =
      "UPDATE Albums SET album_title = ?, release_date = ? WHERE album_id = ?";

    const [result] = await pool
      .promise()
      .query(sql, [album_title, release_date, albumId]);

    if (result.affectedRows === 0) {
      // No rows were updated, so the album with the given ID doesn't exist
      res.status(404).json({ error: "Album not found" });
    } else {
      res.status(200).json({ message: "Album updated successfully" });
    }
  } catch (err) {
    console.error("Error updating album:", err);
    res.status(500).json({ error: "Error updating album" });
  }
});

export default albumsController;
