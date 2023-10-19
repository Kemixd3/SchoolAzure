import { Router } from "express";
import pool from "../Services/dbService.js";
const artistsController = Router();

artistsController.post("/artists", (req, res) => {
  const { artist_name, birth_date } = req.body;
  const sql = "INSERT INTO Artists (artist_name, birth_date) VALUES (?, ?)";
  pool.promise().query(sql, [artist_name, birth_date], (err, result) => {
    if (err) {
      console.error("Error creating artist:", err);
      res.status(500).send("Error creating artist");
      return;
    }
    res.status(201).json({ artist_id: result.insertId });
  });
});

artistsController.get("/artists", (req, res) => {
  const sql = "SELECT * FROM Artists";
  pool.query(sql, (err, artists) => {
    if (err) {
      console.error("Error retrieving artists:", err);
      res.status(500).send("Error retrieving artists");
      return;
    }
    res.status(200).json(artists);
  });
});

// Search for artists by name
artistsController.get("/search/artist", (req, res) => {
  const { query } = req.query;
  const sql = "SELECT * FROM Artists WHERE artist_name LIKE ?";
  const searchQuery = `%${query}%`;

  artistsController.query(sql, [searchQuery], (err, artists) => {
    if (err) {
      console.error("Error searching for artists:", err);
      res.status(500).send("Error searching for artists");
      return;
    }
    res.status(200).json(artists);
  });
});

artistsController.delete("/artists/:artistId", (req, res) => {
  const artistId = req.params.artistId;
  const sql = "DELETE FROM Artists WHERE artist_id = ?";

  pool.query(sql, [artistId], (err, result) => {
    if (err) {
      console.error("Error deleting artist:", err);
      res.status(500).send("Error deleting artist");
      return;
    }
    res.status(204).send(); // 204 No Content indicates successful deletion
  });
});

artistsController.put("/artists/:artistId", (req, res) => {
  const artistId = req.params.artistId;
  const { artist_name, birth_date } = req.body;
  const sql =
    "UPDATE Artists SET artist_name = ?, birth_date = ? WHERE artist_id = ?";

  pool.query(sql, [artist_name, birth_date, artistId], (err, result) => {
    if (err) {
      console.error("Error updating artist:", err);
      res.status(500).send("Error updating artist");
      return;
    }
    res.status(200).json({ message: "Artist updated successfully" });
  });
});

export default artistsController;
