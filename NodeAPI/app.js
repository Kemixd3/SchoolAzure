const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser"); // Required to parse the request body
const fs = require("fs");

const app = express();
const port = 3000;

const dbConfig = {
  host: "school.mysql.database.azure.com",
  user: "NikolaiZ",
  password: "!Silas1234",
  database: "skoledb",
  ssl: {
    ca: fs.readFileSync("ssl/DigiCertGlobalRootCA.crt.pem"), // Path to your CA certificate file
  },
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

app.use(bodyParser.json()); // Parse JSON request body

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

      // Check if the user already exists
      // Insert the new user into the database
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

          connection.release(); // Release the connection back to the pool
        }
      );
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error registering user");
  }
});

app.post("/create-artist", (req, res) => {
  try {
    const { name, age, image, description } = req.body;

    // Create a connection from the pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting MySQL connection:", err);
        res.status(500).send("Error creating artist");
        return;
      }

      // Insert the new artist into the database
      const insertQuery =
        "INSERT INTO artists (name, age, image, description) VALUES (?, ?, ?, ?)";
      connection.query(
        insertQuery,
        [name, age, image, description],
        (insertErr) => {
          if (insertErr) {
            console.error("Error creating artist:", insertErr);
            res.status(500).send("Error creating artist");
          } else {
            res.status(201).send("Artist created successfully");
          }

          connection.release(); // Release the connection back to the pool
        }
      );
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error creating artist");
  }
});

app.post("/create-album", (req, res) => {
  try {
    const { artist_id, title, release_date, image, description } = req.body;

    // Create a connection from the pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting MySQL connection:", err);
        res.status(500).send("Error creating album");
        return;
      }

      // Insert the new album into the database
      const insertQuery =
        "INSERT INTO albums (artist_id, title, release_date, image, description) VALUES (?, ?, ?, ?, ?)";
      connection.query(
        insertQuery,
        [artist_id, title, release_date, image, description],
        (insertErr) => {
          if (insertErr) {
            console.error("Error creating album:", insertErr);
            res.status(500).send("Error creating album");
          } else {
            res.status(201).send("Album created successfully");
          }

          connection.release(); // Release the connection back to the pool
        }
      );
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error creating album");
  }
});

app.post("/create-track", (req, res) => {
  try {
    const { album_id, title, duration, description } = req.body;

    // Create a connection from the pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting MySQL connection:", err);
        res.status(500).send("Error creating track");
        return;
      }

      // Insert the new track into the database
      const insertQuery =
        "INSERT INTO tracks (album_id, title, duration, description) VALUES (?, ?, ?, ?)";
      connection.query(
        insertQuery,
        [album_id, title, duration, description],
        (insertErr) => {
          if (insertErr) {
            console.error("Error creating track:", insertErr);
            res.status(500).send("Error creating track");
          } else {
            res.status(201).send("Track created successfully");
          }

          connection.release(); // Release the connection back to the pool
        }
      );
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error creating track");
  }
});

app.get("/albums", (req, res) => {
  // Create a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection:", err);
      res.status(500).send("Error retrieving albums");
      return;
    }

    // Retrieve albums from the database
    const selectQuery = "SELECT * FROM albums";
    connection.query(selectQuery, (selectErr, albums) => {
      if (selectErr) {
        console.error("Error retrieving albums:", selectErr);
        res.status(500).send("Error retrieving albums");
      } else {
        res.status(200).json(albums);
      }

      connection.release(); // Release the connection back to the pool
    });
  });
});

app.get("/tracks", (req, res) => {
  const pageSize = 20;
  const pageNum = req.query.pageNum || 1; // Get the page number from the query parameters (default to 1 if not provided)

  // Calculate the offset based on the page number and page size
  const offset = (pageNum - 1) * pageSize;

  // Create a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection:", err);
      res.status(500).send("Error retrieving tracks");
      return;
    }

    // Retrieve tracks from the database with pagination
    const selectQuery = "SELECT * FROM tracks LIMIT ? OFFSET ?";
    const values = [pageSize, offset];

    connection.query(selectQuery, values, (selectErr, tracks) => {
      if (selectErr) {
        console.error("Error retrieving tracks:", selectErr);
        res.status(500).send("Error retrieving tracks");
      } else {
        res.status(200).json(tracks);
      }

      connection.release(); // Release the connection back to the pool
    });
  });
});

app.get("/artists", (req, res) => {
  // Create a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection:", err);
      res.status(500).send("Error retrieving artists");
      return;
    }

    // Retrieve artists from the database
    const selectQuery = "SELECT * FROM artists";
    connection.query(selectQuery, (selectErr, artists) => {
      if (selectErr) {
        console.error("Error retrieving artists:", selectErr);
        res.status(500).send("Error retrieving artists");
      } else {
        res.status(200).json(artists);
      }

      connection.release(); // Release the connection back to the pool
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
