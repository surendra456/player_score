const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const playerDbIntoResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const matchDetailsDbIntoResponse = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const allPlayersQuery = `
    SELECT 
      * 
    FROM 
      player_details;`;
  const players = await db.all(allPlayersQuery);
  response.send(players.map((each) => playerDbIntoResponse(each)));
});

// APi 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const particularPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
  const particularPlayers = await db.get(particularPlayerQuery);
  response.send(playerDbIntoResponse(particularPlayers));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `UPDATE player_details
    SET player_name = ${playerName}
    WHERE player_id = ${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchesQuery = `
    SELECT * 
    FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(matchesQuery);
  response.send(matchDetailsDbIntoResponse(match));
});

// API 5
app.get("players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const listOfMatchesQuery = `
    SELECT 
        *
    FROM 
        match_details NATURAL JOIN player_match_score 
    WHERE player_id = ${playerId};`;
  const listOfPlayers = await db.all(listOfMatchesQuery);
  response.send(listOfPlayers.map((each) => matchDetailsDbIntoResponse(each)));
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchIdPlayersQuery = `
    SELECT * 
    FROM  player_details NATURAL JOIN player_match_score 
    WHERE match_id = ${matchId};`;
  const getPlayers = await db.all(getMatchIdPlayersQuery);
  response.send(getPlayers.map((each) => playerDbIntoResponse(each)));
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const statsOfPlayerQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_details NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const stats = await db.get(statsOfPlayerQuery);
  response.send(stats);
});

module.exports = app;
