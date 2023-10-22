import { Router } from "express";
const tracksController = Router();

import pool from "../Services/dbService.js";

tracksController.post("/tracks", (req, res) => {
  const { track_title, duration, album_id } = req.body;
  const sql =
    "INSERT INTO Tracks (track_title, duration, album_id) VALUES (?, ?, ?)";
  pool
    .promise()
    .query(sql, [track_title, duration, album_id], (err, result) => {
      if (err) {
        console.error("Error creating track:", err);
        console.log("DB_USER:", dbUser);
        res.status(500).send("Error creating track");
        return;
      }
      res.status(201).json({ track_id: result.insertId });
    });
});

tracksController.get("/tracks", (req, res) => {
  const pageSize = 20;
  const pageNum = req.query.pageNum || 1;

  const offset = (pageNum - 1) * pageSize;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection:", err);
      console.log("DB_USER:", dbUser);
      res.status(500).send("Error retrieving tracks");
      return;
    }

    const selectQuery = "SELECT * FROM tracks LIMIT ? OFFSET ?";
    const values = [pageSize, offset];

    connection.query(selectQuery, values, (selectErr, tracks) => {
      if (selectErr) {
        console.error("Error retrieving tracks:", selectErr);
        res.status(500).send("Error retrieving tracks");
      } else {
        res.status(200).json(tracks);
      }

      connection.release();
    });
  });
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
tracksController.get("/search/tracks", (req, res) => {
  const { query } = req.query;
  const sql = "SELECT * FROM Tracks WHERE track_title LIKE ?";
  const searchQuery = `%${query}%`;

  pool.query(sql, [searchQuery], (err, tracks) => {
    if (err) {
      console.error("Error searching for tracks:", err);
      res.status(500).send("Error searching for tracks");
      return;
    }
    res.status(200).json(tracks);
  });
});

tracksController.delete("/tracks/:trackId", (req, res) => {
  const trackId = req.params.trackId;
  const sql = "DELETE FROM Tracks WHERE track_id = ?";

  pool.query(sql, [trackId], (err, result) => {
    if (err) {
      console.error("Error deleting track:", err);
      res.status(500).send("Error deleting track");
      return;
    }
    res.status(204).send(); // 204 No Content indicates successful deletion
  });
});

tracksController.put("/tracks/:trackId", (req, res) => {
  const trackId = req.params.trackId;
  const { track_title, duration, album_id } = req.body;
  const sql =
    "UPDATE Tracks SET track_title = ?, duration = ?, album_id = ? WHERE track_id = ?";

  pool.query(sql, [track_title, duration, album_id, trackId], (err, result) => {
    if (err) {
      console.error("Error updating track:", err);
      res.status(500).send("Error updating track");
      return;
    }
    res.status(200).json({ message: "Track updated successfully" });
  });
});

export default tracksController;
