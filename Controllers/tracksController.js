import { Router } from "express";
const tracksController = Router();

import pool from "../Services/dbService.js";
// Create a new track
tracksController.post("/tracks", async (req, res) => {
  try {
    const { track_title, duration, album_id } = req.body;
    const sql =
      "INSERT INTO Tracks (track_title, duration, album_id) VALUES (?, ?, ?)";
    const [result] = await pool
      .promise()
      .query(sql, [track_title, duration, album_id]);

    res.status(201).json({ track_id: result.insertId });
  } catch (err) {
    console.error("Error creating track:", err);
    res.status(500).json({ error: "Error creating track" });
  }
});

// Retrieve a paginated list of tracks
tracksController.get("/tracks", async (req, res) => {
  try {
    const pageSize = 20;
    const pageNum = req.query.pageNum || 1;
    const offset = (pageNum - 1) * pageSize;

    const selectQuery = "SELECT * FROM tracks LIMIT ? OFFSET ?";
    const values = [pageSize, offset];

    const [tracks] = await pool.promise().query(selectQuery, values);
    res.status(200).json(tracks);
  } catch (err) {
    console.error("Error retrieving tracks:", err);
    res.status(500).json({ error: "Error retrieving tracks" });
  }
});

tracksController.post("/track_artists", (req, res) => {
  const { track_id, artist_id } = req.body;
  const sql = "INSERT INTO Track_Artists (track_id, artist_id) VALUES (?, ?)";
  pool.promise().query(sql, [track_id, artist_id], (err, result) => {
    if (err) {
      console.error("Error creating track-artist relationship:", err);
      res.status(500).send("Error creating track-artist relationship");
      return;
    }
    res.status(201).json({ relationship_id: result.insertId });
  });
});

// Search for tracks by title
tracksController.get("/search/tracks", async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = `%${query}%`;

    const sql = "SELECT * FROM Tracks WHERE track_title LIKE ?";
    const [tracks] = await pool.promise().query(sql, [searchQuery]);

    res.status(200).json(tracks);
  } catch (err) {
    console.error("Error searching for tracks:", err);
    res.status(500).json({ error: "Error searching for tracks" });
  }
});

tracksController.delete("/tracks/:trackId", async (req, res) => {
  const trackId = req.params.trackId;
  const sql = "DELETE FROM Tracks WHERE track_id = ?";

  try {
    const [result] = await pool.promise().query(sql, [trackId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Track not found" });
    } else {
      res.status(204).send(); // 204 No Content indicates successful deletion
    }
  } catch (err) {
    console.error("Error deleting track:", err);
    res.status(500).json({ error: "Error deleting track" });
  }
});

tracksController.put("/tracks/:trackId", async (req, res) => {
  const trackId = req.params.trackId;
  const { track_title, duration, album_id } = req.body;
  const sql =
    "UPDATE Tracks SET track_title = ?, duration = ?, album_id = ? WHERE track_id = ?";

  try {
    const [result] = await pool
      .promise()
      .query(sql, [track_title, duration, album_id, trackId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Track not found" });
    } else {
      res.status(200).json({ message: "Track updated successfully" });
    }
  } catch (err) {
    console.error("Error updating track:", err);
    res.status(500).json({ error: "Error updating track" });
  }
});

export default tracksController;
