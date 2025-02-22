import express, { Router } from "express";
import {
  calculateStreak,
  fetchContributions,
} from "../utils/fetchContributions";

const router = Router();

router.get("/streak/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const data = await fetchContributions(username);
    const streakData = calculateStreak(data.weeks);

    res.json({
      username,
      currentStreak: streakData.currentStreak,
      maxStreak: streakData.maxStreak,
      badges: streakData.badges,
      hasCurrentMonthBadge: streakData.hasCurrentMonthBadge,
      ranking: streakData.ranking,
      nextRank: streakData.nextRank,
      progressToNextRank: streakData.progressToNextRank,
      totalCommits: data.totalCommits,
      totalIssues: data.totalIssues,
      totalPRs: data.totalPRs,
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
    const streakData = calculateStreak(weeks);


    const safeUsername = username
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

   
    const bgGradientStart = "#F8FAFD";
    const bgGradientEnd = "#F0F5FA";
    const textPrimaryColor = "#1A202C";
    const textSecondaryColor = "#4A5568";
    const cardBgColor = "#FFFFFF";
    const borderColor = "#E2E8F0";
    const accentColor = "#3182CE";


    const rankColors = {
      Beginner: ["#E6F6FF", "#BEE3F8"],
      Bronze: ["#FFFBEB", "#FBD38D"],
      Silver: ["#F7FAFC", "#E2E8F0"],
      Gold: ["#FFFDEF", "#FAF089"],
      Platinum: ["#E6FFFA", "#B2F5EA"],
      Diamond: ["#EBF8FF", "#90CDF4"],
    };


    const rankBorderColors = {
      Beginner: "#63B3ED",
      Bronze: "#ED8936",
      Silver: "#A0AEC0",
      Gold: "#ECC94B",
      Platinum: "#38B2AC",
      Diamond: "#4299E1",
    };

   
    const rankGradient =
      rankColors[streakData.ranking as keyof typeof rankColors] ||
      rankColors.Beginner;
    const rankBorderColor =
      rankBorderColors[streakData.ranking as keyof typeof rankBorderColors] ||
      rankBorderColors.Beginner;

    const progressBarWidth = 250;
    const filledWidth =
      (progressBarWidth * streakData.progressToNextRank) / 100;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="280" style="border-radius: 8px;">
        <defs>
          <!-- Background gradient -->
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${bgGradientStart};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgGradientEnd};stop-opacity:1" />
          </linearGradient>
          
          <!-- Rank badge gradient -->
          <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${
              rankGradient[0]
            };stop-opacity:1" />
            <stop offset="100%" style="stop-color:${
              rankGradient[1]
            };stop-opacity:1" />
          </linearGradient>
          
          <!-- Progress bar gradient -->
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${rankBorderColor};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${rankBorderColor};stop-opacity:1" />
          </linearGradient>
          
          <!-- Card shadow -->
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Enhanced Background with gradient -->
        <rect width="600" height="400" fill="url(#bgGradient)" rx="12" ry="12"/>
        
        <!-- Top Border with gradient -->
        <rect width="600" height="6" fill="${rankBorderColor}" rx="0" ry="0" opacity="0.9"/>
        
        <!-- Title Section with enhanced typography -->
        <text x="30" y="40" fill="${textPrimaryColor}" font-size="24" font-family="Arial, sans-serif" font-weight="bold" filter="url(#dropShadow)">
          ${safeUsername}'s GitHub Stats
        </text>
        
        <!-- Main Container -->
        <g>
          <!-- Left Column -->
          <g>
            <!-- Activity Stats Card with shadow -->
            <rect x="30" y="60" width="260" height="160" fill="${cardBgColor}" rx="8" ry="8" 
                  filter="url(#dropShadow)" stroke="${borderColor}" stroke-width="1"/>
            <text x="45" y="85" fill="${textPrimaryColor}" font-size="18" font-family="Arial, sans-serif" font-weight="bold">
              Activity Stats
            </text>
            
            <!-- Enhanced stats display -->
            <g>
              ${["Current Streak", "Max Streak", "Total Commits", "Total PRs"]
                .map((label, index) => {
                  const y = 115 + index * 30;
                  const value =
                    label === "Current Streak"
                      ? `${streakData.currentStreak} days`
                      : label === "Max Streak"
                      ? `${streakData.maxStreak} days`
                      : label === "Total Commits"
                      ? totalCommits
                      : totalPRs;
                  return `
                  <text x="45" y="${y}" fill="${textSecondaryColor}" font-size="14" font-family="Arial, sans-serif">
                    ${label}:
                  </text>
                  <text x="270" y="${y}" fill="${textPrimaryColor}" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="end">
                    ${value}
                  </text>
                `;
                })
                .join("")}
            </g>
          </g>
          
          <!-- Right Column -->
          <g>
            <!-- Rank Card with shadow -->
            <rect x="310" y="60" width="260" height="160" fill="${cardBgColor}" rx="8" ry="8" 
                  filter="url(#dropShadow)" stroke="${borderColor}" stroke-width="1"/>
            <text x="325" y="85" fill="${textPrimaryColor}" font-size="18" font-family="Arial, sans-serif" font-weight="bold">
              Rank &amp; Progress
            </text>
            
            <!-- Enhanced rank badge -->
            <rect x="325" y="100" width="140" height="30" fill="url(#rankGradient)" rx="6" ry="6" 
                  stroke="${rankBorderColor}" stroke-width="1.5"/>
            <text x="345" y="120" fill="${textPrimaryColor}" font-size="14" font-family="Arial, sans-serif" font-weight="bold">
              ${streakData.ranking} Rank
            </text>
            
            <!-- Next rank info -->
            <text x="325" y="155" fill="${textSecondaryColor}" font-size="14" font-family="Arial, sans-serif">
              Next Rank: ${streakData.nextRank}
            </text>
            
            <!-- Enhanced progress bar -->
            <text x="325" y="185" fill="${textSecondaryColor}" font-size="14" font-family="Arial, sans-serif">
              Progress: ${streakData.progressToNextRank}%
            </text>
            <rect x="325" y="195" width="${progressBarWidth}" height="10" rx="5" ry="5" fill="#EDF2F7"/>
            <rect x="325" y="195" width="${filledWidth}" height="10" rx="5" ry="5" fill="url(#progressGradient)"/>
          </g>
        </g>
        
        <!-- Enhanced footer -->
        <text x="30" y="240" fill="${textSecondaryColor}" font-size="12" font-family="Arial, sans-serif" opacity="0.8">
          Last updated: ${new Date().toLocaleDateString()}
        </text>
      </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (error) {
    res.status(500).send("Failed to generate streak image");
  }
});

export default router;
