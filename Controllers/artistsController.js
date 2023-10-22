import { Router } from "express";
import pool from "../Services/dbService.js";
import cors from "cors";
const artistsController = Router();

artistsController.use(cors());

// Create a new artist
artistsController.post("/artists", async (req, res) => {
  try {
    const { artist_name, debut } = req.body;
    const sql = "INSERT INTO Artists (artist_name, debut) VALUES (?, ?)";

    const [result] = await pool.promise().query(sql, [artist_name, debut]);

    res.status(201).json({ artist_id: result.insertId });
  } catch (err) {
    console.error("Error creating artist:", err);
    res.status(500).json({ error: "Error creating artist" });
  }
});

// Retrieve all artists
artistsController.get("/artists", async (req, res) => {
  try {
    const sql = "SELECT * FROM Artists";
    const [artists] = await pool.promise().query(sql);

    res.status(200).json(artists);
  } catch (err) {
    console.error("Error retrieving artists:", err);
    res.status(500).json({ error: "Error retrieving artists" });
  }
});

// Search for artists by name
// Search for artists by name
artistsController.get("/search/artist", async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = `%${query}%`;
    const sql = "SELECT * FROM Artists WHERE artist_name LIKE ?";

    const [artists] = await pool.promise().query(sql, [searchQuery]);

    res.status(200).json(artists);
  } catch (err) {
    console.error("Error searching for artists:", err);
    res.status(500).json({ error: "Error searching for artists" });
  }
});

// Delete an artist by ID
artistsController.delete("/artists/:artistId", async (req, res) => {
  try {
    const artistId = req.params.artistId;
    const sql = "DELETE FROM Artists WHERE artist_id = ?";

    const [result] = await pool.promise().query(sql, [artistId]);

    if (result.affectedRows === 0) {
      // No artist was deleted (not found)
      res.status(404).json({ message: "Artist not found" });
    } else {
      // Artist deleted successfully
      res.status(204).send(); // 204 No Content indicates successful deletion
    }
  } catch (err) {
    console.error("Error deleting artist:", err);
    res.status(500).json({ error: "Error deleting artist" });
  }
});

// Update an artist by ID
artistsController.put("/artists/:artistId", async (req, res) => {
  try {
    const artistId = req.params.artistId;
    const { artist_name, debut } = req.body;

    let sql;
    let params;

    if (artist_name !== null && artist_name !== undefined) {
      // Update artist_name if it's not null or undefined
      sql = "UPDATE Artists SET artist_name = ?, debut = ? WHERE artist_id = ?";
      params = [artist_name, debut, artistId];
    } else {
      // Only update debut
      sql = "UPDATE Artists SET debut = ? WHERE artist_id = ?";
      params = [debut, artistId];
    }

    const [result] = await pool.promise().query(sql, params);

    if (result.affectedRows === 0) {
      // No artist was updated (not found)
      res.status(404).json({ message: "Artist not found" });
    } else {
      // Artist updated successfully
      res.status(200).json({ message: "Artist updated successfully" });
    }
  } catch (err) {
    console.error("Error updating artist:", err);
    res.status(500).json({ error: "Error updating artist" });
  }
});

export default artistsController;
