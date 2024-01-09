const express = require('express');
const mysql = require('mysql');

const app = express();

// MySQL Connection
const connection = mysql.createConnection({
  host: 'bswgames.czciiccykz6k.eu-north-1.rds.amazonaws.com',
  user: 'root',
  password: 'Abcd1234',
  database: 'GameScore',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Current week leaderboard (Top 200)
app.get('/current-week-leaderboard', (req, res) => {
  const query = `
      SELECT * FROM Leaderboard
      WHERE WEEK(TimeStamp) = WEEK(NOW()) AND YEAR(TimeStamp) = YEAR(NOW())
      ORDER BY Score DESC
      LIMIT 200;
    `;
  connection.query(query, (error, results) => {
    if (error) {
      res
        .status(500)
        .json({ error: 'Error fetching current week leaderboard' });
    } else {
      const formattedResults = results.map((result) => {
        return {
          UID: result.UID,
          Name: result.Name,
          Score: result.Score,
          Country: result.Country,
          TimeStamp: result.TimeStamp.toString(),
        };
      });
      res.set('Content-Type', 'text/plain');
      res.send(JSON.stringify({ leaderboard: formattedResults }, null, 2)); // Send formatted JSON
    }
  });
});

app.get('/last-week-leaderboard/:countryCode', (req, res) => {
    const countryCode = req.params.countryCode;
    const query = `
        SELECT * FROM Leaderboard 
        WHERE WEEK(TimeStamp) = WEEK(CURDATE() - INTERVAL 1 WEEK) 
        AND Country = '${countryCode}' 
        ORDER BY Score DESC 
        LIMIT 200
    `;
    connection.query(
        query,
        (error, results) => {
            if (error) {
                res.status(500).json({ error: 'Error fetching last week leaderboard for the country' });
            } else {
                const formattedResults = results.map((result) => {
                    return {
                      UID: result.UID,
                      Name: result.Name,
                      Score: result.Score,
                      Country: result.Country,
                      TimeStamp: result.TimeStamp.toString(),
                    };
                  });
                  res.set('Content-Type', 'text/plain');
                  res.send(JSON.stringify({ leaderboard: formattedResults }, null, 2)); // Send formatted JSON
            }
        }
    );
});

app.get('/user/:userId/rank', (req, res) => {
    const userId = req.params.userId;
    const query = `
      SELECT r.userRank
      FROM (
        SELECT UID, RANK() OVER (ORDER BY Score DESC) AS userRank
        FROM Leaderboard
      ) AS r
      WHERE r.UID = '${userId}'
    `;
    
    connection.query(
      query,
      (error, results) => {
        if (error) {
          res.status(500).json({ error: 'Error fetching user rank' });
        } else if (results.length === 0) {
          res.status(404).json({ message: 'User not found' });
        } else {
          res.json({ results });
        }
      }
    );
  });

// Host the APIs
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
