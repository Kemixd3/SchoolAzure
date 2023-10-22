import express from "express";
import pool from "./Services/dbService.js";
import cors from "cors";
import bodyParser from "body-parser";

import albumsController from "./Controllers/albumsController.js";
import artistsController from "./Controllers/artistsController.js";
import tracksController from "./Controllers/tracksController.js";

//require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("", albumsController);
app.use("", artistsController);
app.use("", tracksController);

const port = process.env.PORT || 3000;

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error getting MySQL connection:", err);
    return;
  }

  // Use the connection for your queries here.

  connection.release(); // Return the connection to the pool when done.
});

app.get("/", (req, res) => {
  res.send("Status: Online");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//Brugeren skal kunne søge på artist, album eller track, og få vist lister der viser:

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    // Hash the password before storing (you can add bcrypt logic here)
    console.log({ name, email, password, image });
    // Create a connection from the pool
    pool.promise().getConnection((err, connection) => {
      if (err) {
        console.error("Error getting MySQL connection:", err);
        res.status(500).send("Error registering user");
        return;
      }

      const insertQuery =
        "INSERT INTO users (name, email, password, image) VALUES (?, ?, ?, ?)";
      connection.query(
        insertQuery,
        [name, email, password, image],
        (insertErr) => {
          if (insertErr) {
            console.error("Error inserting user into database:", insertErr);
            res.status(500).send("Error registering user");
          } else {
            res.status(201).send("User registered successfully");
          }

          connection.release();
        }
      );
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error registering user");
  }
});

// Backend API Route for Global Search
app.get("/search/searchAll", (req, res) => {
  const { query } = req.query;
  const searchQuery = `%${query}%`;

  // SQL query to search across all entities (tracks, artists, and albums)
  const sql = `
    SELECT 'track' as entity_type, track_id as id, track_title as name, duration
    FROM Tracks
    WHERE track_title LIKE ?
    UNION
    SELECT 'artist' as entity_type, artist_id as id, artist_name as name, birth_date
    FROM Artists
    WHERE artist_name LIKE ?
    UNION
    SELECT 'album' as entity_type, album_id as id, album_title as name, release_date
    FROM Albums
    WHERE album_title LIKE ?;
  `;

  pool.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error("Error performing global search:", err);
      res.status(500).send("Error performing global search");
      return;
    }

    // Process and structure the search results as needed
    res.status(200).json(results);
  });
});

app.post("/album_and_songs_and_artist", async (req, res) => {
  const { album_title, release_date, artist_name, songs } = req.body;
  console.log(album_title, release_date, artist_name, songs);

  try {
    let artist_id;
    let album_id;

    // Check if the artist exists in the database based on their name
    const [artistResult] = await pool
      .promise()
      .query("SELECT artist_id FROM Artists WHERE artist_name = ?", [
        artist_name,
      ]);

    if (artistResult.length > 0) {
      artist_id = artistResult[0].artist_id;
    } else {
      // If the artist doesn't exist, create a new artist record
      const [newArtistResult] = await pool
        .promise()
        .query("INSERT INTO Artists (artist_name) VALUES (?)", [artist_name]);
      artist_id = newArtistResult.insertId;
    }

    // Insert the album with the artist's ID
    album_id = await insertAlbumAndGetId(album_title, release_date);

    if (album_id !== null) {
      // Connect the album and artist using the album_artists table
      const [albumArtistResult] = await pool
        .promise()
        .query(
          "INSERT INTO album_artists (album_id, artist_id) VALUES (?, ?)",
          [album_id, artist_id]
        );

      // Iterate over each track and insert it or use the existing one
      for (const song of songs) {
        const { track_title, duration } = song;
        let track_id;

        // Check if the track exists based on title and album ID
        const [trackResult] = await pool
          .promise()
          .query(
            "SELECT track_id FROM Tracks WHERE track_title = ? AND album_id = ?",
            [track_title, album_id]
          );

        if (trackResult.length > 0) {
          track_id = trackResult[0].track_id;
        } else {
          // If the track doesn't exist, create a new track record
          const [newTrackResult] = await pool
            .promise()
            .query(
              "INSERT INTO Tracks (track_title, duration, album_id) VALUES (?, ?, ?)",
              [track_title, duration, album_id]
            );
          track_id = newTrackResult.insertId;
        }

        console.log(`Inserted/used track with ID ${track_id}`);
      }

      // Respond with the album_id
      res.status(201).json({ album_id });
    } else {
      console.error("Error creating album.");
      res.status(500).json("Error creating album and songs");
    }
  } catch (err) {
    console.error("Error creating album and songs:", err);
    res.status(500).json("Error creating album and songs");
  }
});

async function insertAlbumAndGetId(album_title, release_date, res) {
  try {
    console.log(album_title, release_date);

    // Use pool.query() to execute the query
    const [albumResult] = await pool
      .promise()
      .query("INSERT INTO Albums (album_title, release_date) VALUES (?, ?)", [
        album_title,
        release_date,
      ]);

    if (albumResult && albumResult.insertId) {
      const album_id = albumResult.insertId;
      console.log(album_id);
      //res.send(201).json({ album_id });
      return album_id;
    } else {
      console.error("Album insert result is undefined or missing insertId.");
      res.status(500).json("Error creating album and songs");
    }
  } catch (err) {
    console.error("Error creating album and songs:", err);
    res.status(500).json("Error creating album and songs");
  }
}
