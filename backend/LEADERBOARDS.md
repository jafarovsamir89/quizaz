# Bilik Arena Social & Rankings

This document describes the leaderboard system and aggregation logic.

## 1. Aggregation Strategy
Leaderboards are calculated dynamically using raw SQL queries for maximum performance and flexibility. PostgreSQL indices ensure that even with thousands of logs, the aggregation remains fast.

## 2. Ranking Periods
All endpoints support a `period` query parameter:
- `daily`: Data from the last 24 hours.
- `weekly`: Data from the last 7 days.
- `monthly`: Data from the last 30 days.
- `all`: All-time data (default).

## 3. Leaderboard Types

### City Leaderboard (`GET /leaderboards/cities`)
Aggregates points from `CityPointsLog`.
- **Logic**: Sum of all points earned by users belonging to each city within the specified period.
- **Response**: `cityId`, `cityName`, `totalPoints`, `playersCount`, `rank`.

### Player Leaderboard (`GET /leaderboards/players`)
Aggregates points from `GameSession`.
- **Logic**: Sum of `totalScore` from all finished sessions for each user.
- **Filters**: Can be filtered by `cityId` to show the top players of a specific city.
- **Response**: `userId`, `nickname`, `avatarUrl`, `cityName`, `totalPoints`, `gamesCount`, `averageScore`, `rank`.

### My Rank (`GET /leaderboards/me`)
Provides the current user's personalized standings.
- **Global Rank**: User's rank among all players worldwide.
- **City Rank**: User's rank among players in their selected city.
- **Response**: Global status, City status, total points for the period.

## 4. API Endpoints

- **Cities Ranking**: `GET /leaderboards/cities?period=weekly`
- **Global Players**: `GET /leaderboards/players?period=monthly`
- **City Specific Players**: `GET /leaderboards/cities/:cityId/players`
- **My Standings**: `GET /leaderboards/me?period=daily`

## 5. Performance Indices
The following indices were added to optimize queries:
- `GameSession`: `[userId, status, finishedAt]`, `[status, finishedAt]`
- `CityPointsLog`: `[cityId, createdAt]`, `[userId, createdAt]`
