import express, { Router } from "express";
import {
  calculateStreak,
  fetchContributions,
} from "../utils/fetchContributions";
const router = Router();
router.get("/streak/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const weeks = await fetchContributions(username);
    const streakData = calculateStreak(weeks);

    res.json({
      username,
      currentStreak: streakData.currentStreak,
      maxStreak: streakData.maxStreak,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});
router.get("/streak-svg/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const { weeks, totalCommits, totalIssues, totalPRs } =
      await fetchContributions(username);
    const { currentStreak, maxStreak } = calculateStreak(weeks);
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const badgeEarned = currentStreak === daysInMonth;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" style="border-radius: 10px;">
          <!-- Black background with a cyan gradient -->
          <defs>
            <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0A3D62;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#backgroundGradient)" rx="10" ry="10"/>
          
          <!-- Cyan glow effect -->
          <rect width="100%" height="100%" fill="none" stroke="#00FFFF" stroke-width="2" rx="10" ry="10"/>
          
          <!-- Title -->
          <text x="37%" y="15%" fill="#00FFFF" font-size="18" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
            🚀 ${username}'s GitHub Activity
          </text>
          
          <!-- Current Streak -->
          <text x="30%" y="30%" fill="#00FFFF" font-size="18" font-family="Arial, sans-serif" text-anchor="middle">
            🔥 Current Streak: ${currentStreak} days
          </text>
          
          <!-- Max Streak -->
          <text x="27%" y="45%" fill="#00FFFF" font-size="18" font-family="Arial, sans-serif" text-anchor="middle">
            🏆 Max Streak: ${maxStreak} days
          </text>
          
          <!-- Total Commits -->
          <text x="26%" y="60%" fill="#00FFFF" font-size="18" font-family="Arial, sans-serif" text-anchor="middle">
            📌 Total Commits: ${totalCommits}
          </text>
          
          <!-- Total Issues -->
          <text x="22%" y="75%" fill="#00FFFF" font-size="18" font-family="Arial, sans-serif" text-anchor="middle">
            ❗ Total Issues: ${totalIssues}
          </text>
          
          <!-- Total PRs -->
          <text x="21%" y="90%" fill="#00FFFF" font-size="18" font-family="Arial, sans-serif" text-anchor="middle">
            🔄 Total PRs: ${totalPRs}
          </text>
          
          <!-- Badge Earned -->
          ${
            badgeEarned
              ? `<text x="50%" y="90%" fill="gold" font-size="20" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
                  🏅 ${now.toLocaleString("default", {
                    month: "long",
                  })} Streak Badge
                </text>`
              : ""
          }
        </svg>
      `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (error) {
    res.status(500).send("Failed to generate streak image");
  }
});
export default router;
