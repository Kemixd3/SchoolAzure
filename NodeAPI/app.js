const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = 3000;

const dbConfig = {
  host: "school.mysql.database.azure.com",
  user: "NikolaiZ",
  password: "!Silas1234",
  database: "skoledb",
  ssl: {
    ca: fs.readFileSync("ssl/DigiCertGlobalRootCA.crt.pem"),
  },
};

app.post("/album_artists", (req, res) => {
  const { album_id, artist_id } = req.body;
  const sql = "INSERT INTO Album_Artists (album_id, artist_id) VALUES (?, ?)";
  db.query(sql, [album_id, artist_id], (err, result) => {
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
  db.query(sql, [track_id, artist_id], (err, result) => {
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

const pool = mysql.createPool(dbConfig);

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
