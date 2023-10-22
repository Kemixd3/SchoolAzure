import { Router } from "express";
const albumsController = Router();

import pool from "../Services/dbService.js";

albumsController.post("/albums", (req, res) => {
  const { album_title, release_date } = req.body;
  const sql = "INSERT INTO Albums (album_title, release_date) VALUES (?, ?)";
  pool.promise().query(sql, [album_title, release_date], (err, result) => {
    if (err) {
      console.error("Error creating album:", err);
      res.status(500).send("Error creating album");
      return;
    }
    res.status(201).json({ album_id: result.insertId });
  });
});

albumsController.get("/albums", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection:", err);
      res.status(500).send("Error retrieving albums");
      return;
    }

    const selectQuery = "SELECT * FROM albums";
    connection.query(selectQuery, (selectErr, albums) => {
      if (selectErr) {
        console.error("Error retrieving albums:", selectErr);
        res.status(500).send("Error retrieving albums");
      } else {
        res.status(200).json(albums);
      }

      connection.release();
    });
  });
});

albumsController.post("/album_tracks", async (req, res) => {
  const { album_id, track_id, track_order } = req.body;
  console.log(album_id);

  const sql =
    "INSERT INTO Album_Tracks (album_id, track_id, track_order) VALUES (?, ?, ?)";
  await pool
    .promise()
    .query(sql, [album_id, track_id, track_order], (err, result) => {
      if (err) {
        console.error("Error creating album tracklisting:", err);
        res.status(500).send("Error creating album tracklisting");
        return null;
      }
      res.status(201).send("User registered successfully");
    });
});

albumsController.post("/album_artists", (req, res) => {
  const { album_id, artist_id } = req.body;
  const sql = "INSERT INTO album_artists (album_id, artist_id) VALUES (?, ?)";

  // Check if the relationship already exists
  const checkSql =
    "SELECT * FROM album_artists WHERE album_id = ? AND artist_id = ?";
  pool
    .promise()
    .query(checkSql, [album_id, artist_id], (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Error checking album-artist relationship:", checkErr);
        res
          .status(500)
          .json({ error: "Error checking album-artist relationship" });
      } else if (checkResult.length > 0) {
        // The relationship already exists
        res
          .status(400)
          .json({ error: "Album-artist relationship already exists" });
      } else {
        // The relationship doesn't exist, so insert it
        pool
          .promise()
          .query(sql, [album_id, artist_id], (insertErr, result) => {
            if (insertErr) {
              console.error(
                "Error creating album-artist relationship:",
                insertErr
              );
              res
                .status(500)
                .json({ error: "Error creating album-artist relationship" });
            } else {
              res.status(201).json({ relationship_id: result.insertId });
            }
          });
      }
    });
});

albumsController.post("/related_albums", (req, res) => {
  const { original_album_id, related_album_id } = req.body;
  const sql =
    "INSERT INTO Related_Albums (original_album_id, related_album_id) VALUES (?, ?)";
  pool
    .promise()
    .query(sql, [original_album_id, related_album_id], (err, result) => {
      if (err) {
        console.error("Error creating related album relationship:", err);
        res.status(500).send("Error creating related album relationship");
        return;
      }
      res.status(201).json({ relationship_id: result.insertId });
    });
});

// Search for albums by title
albumsController.get("/search/albums", (req, res) => {
  const { query } = req.query;
  const sql = "SELECT * FROM Albums WHERE album_title LIKE ?";
  const searchQuery = `%${query}%`;

  pool.query(sql, [searchQuery], (err, albums) => {
    if (err) {
      console.error("Error searching for albums:", err);
      res.status(500).send("Error searching for albums");
      return;
    }
    res.status(200).json(albums);
  });
});

// Backend API Route
albumsController.get("/search/albums-with-tracks", (req, res) => {
  const { query } = req.query;
  const albumSql = "SELECT * FROM Albums WHERE album_title LIKE ?";
  const searchQuery = `%${query}%`;

  // First, find the album(s) that match the query
  pool.query(albumSql, [searchQuery], (err, albums) => {
    if (err) {
      console.error("Error searching for albums:", err);
      res.status(500).send("Error searching for albums");
      return;
    }

    // Then, for each album, find its related tracks
    const albumsWithTracks = [];

    const trackSql = "SELECT * FROM tracks WHERE album_id = ?";

    const getTracksForAlbum = (album) => {
      return new Promise((resolve, reject) => {
        pool.query(trackSql, [album.album_id], (err, tracks) => {
          if (err) {
            console.error("Error fetching tracks for album:", err);
            reject(err);
          } else {
            resolve({ ...album, tracks });
          }
        });
      });
    };

    const albumPromises = albums.map(getTracksForAlbum);

    Promise.all(albumPromises)
      .then((result) => {
        albumsWithTracks.push(...result);
        res.status(200).json(albumsWithTracks);
      })
      .catch((error) => {
        console.error("Error fetching tracks for albums:", error);
        res.status(500).send("Error fetching tracks for albums");
      });
  });
});

// Backend API Route
albumsController.get("/search/albums-with-artists-and-tracks", (req, res) => {
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

    pool.query(sql, [searchQuery, searchQuery], (err, results) => {
      if (err) {
        console.error(
          "Error searching for albums with artists and tracks:",
          err
        );
        res
          .status(500)
          .send("Error searching for albums with artists and tracks");
        return;
      }

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
    });
  } catch (err) {
    console.error("catch", err);
    res.status(500).json("error");
  }
});

albumsController.delete("/albums/:albumId", (req, res) => {
  const albumId = req.params.albumId;
  const sql = "DELETE FROM Albums WHERE album_id = ?";

  pool.query(sql, [albumId], (err, result) => {
    if (err) {
      console.error("Error deleting album:", err);
      res.status(500).send("Error deleting album");
      return;
    }
    res.status(204).send(); // 204 No Content indicates successful deletion
  });
});

albumsController.put("/albums/:albumId", (req, res) => {
  const albumId = req.params.albumId;
  const { album_title, release_date } = req.body;
  const sql =
    "UPDATE Albums SET album_title = ?, release_date = ? WHERE album_id = ?";

  pool.query(sql, [album_title, release_date, albumId], (err, result) => {
    if (err) {
      console.error("Error updating album:", err);
      res.status(500).send("Error updating album");
      return;
    }
    res.status(200).json({ message: "Album updated successfully" });
  });
});

export default albumsController;
