import express, { Router } from "express"
import { calculateStreak, fetchContributions } from "../utils/fetchContributions";
const router = Router();
router.get('/streak/:username' , async(req , res) => {
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
})
router.get("/streak-svg/:username", async (req, res) => {
    try {
        const username = req.params.username;
        const { weeks, totalCommits, totalIssues, totalPRs } = await fetchContributions(username);
        const { currentStreak, maxStreak } = calculateStreak(weeks);
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const badgeEarned = currentStreak === daysInMonth;
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="220">
                <rect width="100%" height="100%" fill="white" />
                <text x="50%" y="15%" fill="blue" font-size="18" font-family="Arial, sans-serif" >
                    🔥 Current Streak: ${currentStreak} days
                </text>
                <text x="50%" y="30%" fill="blue" font-size="18" font-family="Arial, sans-serif" text-anchor="left">
                    🏆 Max Streak: ${maxStreak} days
                </text>
                <text x="50%" y="45%" fill="blue" font-size="18" font-family="Arial, sans-serif" text-anchor="left">
                    📌 Total Commits: ${totalCommits}
                </text>
                <text x="50%" y="60%" fill="blue" font-size="18" font-family="Arial, sans-serif" text-anchor="left">
                    ❗ Total Issues: ${totalIssues}
                </text>
                <text x="50%" y="75%" fill="blue" font-size="18" font-family="Arial, sans-serif" text-anchor="left">
                    🔄 Total PRs: ${totalPRs}
                </text>
                ${
                    badgeEarned
                        ? `<text x="50%" y="90%" fill="gold" font-size="20" font-family="Arial, sans-serif" text-anchor="middle">
                            🏅 ${now.toLocaleString("default", { month: "long" })} Streak Badge
                           </text>`
                        : "0"
                }
            </svg>
        `;

        res.setHeader("Content-Type", "image/svg+xml");
        res.send(svg);
    } catch (error) {
        res.status(500).send("Failed to generate streak image");
    }
});




export default router