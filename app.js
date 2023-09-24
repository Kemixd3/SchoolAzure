const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

//
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase = process.env.DB_DATABASE;

const dbConfig = {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
  ssl: {
    ca: fs.readFileSync("ssl/DigiCertGlobalRootCA.crt.pem"), // Path to your CA certificate file
  },
};
const pool = mysql.createPool(dbConfig);
//Brugeren skal kunne søge på artist, album eller track, og få vist lister der viser:

app.post("/album_artists", (req, res) => {
  const { album_id, artist_id } = req.body;
  const sql = "INSERT INTO Album_Artists (album_id, artist_id) VALUES (?, ?)";
  pool.query(sql, [album_id, artist_id], (err, result) => {
    if (err) {
      console.error("Error creating album-artist relationship:", err);
      res.status(500).send("Error creating album-artist relationship");
      return;
    }
    res.status(201).json({ relationship_id: result.insertId });
  });
});

app.post("/track_artists", (req, res) => {
  const { track_id, artist_id } = req.body;
  const sql = "INSERT INTO Track_Artists (track_id, artist_id) VALUES (?, ?)";
  pool.query(sql, [track_id, artist_id], (err, result) => {
    if (err) {
      console.error("Error creating track-artist relationship:", err);
      res.status(500).send("Error creating track-artist relationship");
      return;
    }
    res.status(201).json({ relationship_id: result.insertId });
  });
});

app.post("/related_albums", (req, res) => {
  const { original_album_id, related_album_id } = req.body;
  const sql =
    "INSERT INTO Related_Albums (original_album_id, related_album_id) VALUES (?, ?)";
  db.query(sql, [original_album_id, related_album_id], (err, result) => {
    if (err) {
      console.error("Error creating related album relationship:", err);
      res.status(500).send("Error creating related album relationship");
      return;
    }
    res.status(201).json({ relationship_id: result.insertId });
  });
});

app.post("/album_tracks", (req, res) => {
  const { album_id, track_id, track_order } = req.body;
  const sql =
    "INSERT INTO Album_Tracks (album_id, track_id, track_order) VALUES (?, ?, ?)";
  db.query(sql, [album_id, track_id, track_order], (err, result) => {
    if (err) {
      console.error("Error creating album tracklisting:", err);
      res.status(500).send("Error creating album tracklisting");
      return;
    }
    res.status(201).json({ tracklisting_id: result.insertId });
  });
});

app.use(bodyParser.json());

app.post("/signup", (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    // Hash the password before storing (you can add bcrypt logic here)
    console.log({ name, email, password, image });
    // Create a connection from the pool
    pool.getConnection((err, connection) => {
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

app.post("/albums", (req, res) => {
  const { album_title, release_date } = req.body;
  const sql = "INSERT INTO Albums (album_title, release_date) VALUES (?, ?)";
  db.query(sql, [album_title, release_date], (err, result) => {
    if (err) {
      console.error("Error creating album:", err);
      res.status(500).send("Error creating album");
      return;
    }
    res.status(201).json({ album_id: result.insertId });
  });
});

app.post("/tracks", (req, res) => {
  const { track_title, duration, album_id } = req.body;
  const sql =
    "INSERT INTO Tracks (track_title, duration, album_id) VALUES (?, ?, ?)";
  db.query(sql, [track_title, duration, album_id], (err, result) => {
    if (err) {
      console.error("Error creating track:", err);
      console.log("DB_USER:", dbUser);
      res.status(500).send("Error creating track");
      return;
    }
    res.status(201).json({ track_id: result.insertId });
  });
});

app.get("/albums", (req, res) => {
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

app.get("/tracks", (req, res) => {
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

app.post("/artists", (req, res) => {
  const { artist_name, birth_date } = req.body;
  const sql = "INSERT INTO Artists (artist_name, birth_date) VALUES (?, ?)";
  pool.query(sql, [artist_name, birth_date], (err, result) => {
    if (err) {
      console.error("Error creating artist:", err);
      res.status(500).send("Error creating artist");
      return;
    }
    res.status(201).json({ artist_id: result.insertId });
  });
});

app.get("/artists", (req, res) => {
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
app.get("/search/artist", (req, res) => {
  const { query } = req.query;
  const sql = "SELECT * FROM Artists WHERE artist_name LIKE ?";
  const searchQuery = `%${query}%`;

  pool.query(sql, [searchQuery], (err, artists) => {
    if (err) {
      console.error("Error searching for artists:", err);
      res.status(500).send("Error searching for artists");
      return;
    }
    res.status(200).json(artists);
  });
});

// Search for albums by title
app.get("/search/albums", (req, res) => {
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

// Search for tracks by title
app.get("/search/tracks", (req, res) => {
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
// Backend API Route
app.get("/search/albums-with-tracks", (req, res) => {
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
app.get("/search/albums-with-artists-and-tracks", (req, res) => {
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
      t.track_id,
      t.track_title,
      t.duration
    FROM Albums a
    LEFT JOIN Album_Artists aa ON a.album_id = aa.album_id
    LEFT JOIN Artists b ON aa.artist_id = b.artist_id
    LEFT JOIN Tracks t ON a.album_id = t.album_id
    WHERE a.album_title LIKE ?;
  `;

  pool.query(sql, [searchQuery], (err, results) => {
    if (err) {
      console.error("Error searching for albums with artists and tracks:", err);
      res
        .status(500)
        .send("Error searching for albums with artists and tracks");
      return;
    }

    // Process the results and structure the data as needed

    const albumsWithArtistsAndTracks = [];
    results.forEach((row) => {
      let existingAlbum = albumsWithArtistsAndTracks.find(
        (album) => album.album_id === row.album_id
      );

      if (!existingAlbum) {
        // Create a new album entry if it doesn't exist
        const album = {
          album_id: row.album_id,
          album_title: row.album_title,
          release_date: row.release_date,
          artists: [],
          tracks: [], // Initialize an empty array for tracks
        };
        albumsWithArtistsAndTracks.push(album);
        existingAlbum = album; // Assign the new album to existingAlbum
      }

      // Add artist information
      if (row.artist_id && row.artist_name) {
        const artist = {
          artist_id: row.artist_id,
          artist_name: row.artist_name,
        };
        existingAlbum.artists.push(artist);
      }

      // Add track information
      if (row.track_id && row.track_title && row.duration) {
        const track = {
          track_id: row.track_id,
          track_title: row.track_title,
          duration: row.duration,
        };
        existingAlbum.tracks.push(track);
      }
    });

    res.status(200).json(albumsWithArtistsAndTracks);
  });
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
app.post("/albums_and_songs", async (req, res) => {
  const { album_title, release_date, songs } = req.body;
  console.log(album_title, release_date, songs);
  try {
    // Start a database transaction

    // SQL query to insert the album
    const albumSql =
      "INSERT INTO Albums (album_title, release_date) VALUES (?, ?)";
    const albumResult = await pool.query(albumSql, [album_title, release_date]);

    const album_id = albumResult.insertId;
    console.log(album_id);
    res.status(201).json({ album_id });
  } catch (err) {
    console.error("Error creating album and songs:", err);

    // Rollback the transaction if there is an error

    res.status(500).send("Error creating album and songs");
  }
});

app.delete("/tracks/:trackId", (req, res) => {
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

app.delete("/artists/:artistId", (req, res) => {
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

app.delete("/albums/:albumId", (req, res) => {
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

app.put("/tracks/:trackId", (req, res) => {
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

app.put("/artists/:artistId", (req, res) => {
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

app.put("/albums/:albumId", (req, res) => {
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

// Manual rollback function

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
