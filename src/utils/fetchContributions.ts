import axios from "axios";
import { config } from "../config/envConfig";
config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export const fetchContributions = async (username: string) => {
  const query = `
        query {
            user(login: "${username}") {
                contributionsCollection {
                    contributionCalendar {
                        weeks {
                            contributionDays {
                                date
                                contributionCount
                            }
                        }
                    }
                    totalCommitContributions
                }
                issues {
                    totalCount
                }
                pullRequests {
                    totalCount
                }
            }
        }
    `;

  const response = await axios.post(
    "https://api.github.com/graphql",
    { query },
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = response.data.data.user;
  return {
    weeks: data.contributionsCollection.contributionCalendar.weeks,
    totalCommits: data.contributionsCollection.totalCommitContributions,
    totalIssues: data.issues.totalCount,
    totalPRs: data.pullRequests.totalCount,
  };
};

export const calculateStreak = (weeks: any) => {
  let currentStreak = 0;
  let maxStreak = 0;
  const days = weeks.flatMap((week: any) => week.contributionDays);

  // Sort days in descending order (most recent first)
  days.sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check the most recent contribution
  const mostRecentDay = new Date(days[0].date);
  mostRecentDay.setHours(0, 0, 0, 0);

  // Calculate the difference in days
  const daysSinceLastContribution = Math.floor(
    (today.getTime() - mostRecentDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If no contribution today or yesterday, streak is broken
  if (daysSinceLastContribution > 1) {
    currentStreak = 0;
  } else {
    // Count current streak
    for (let i = 0; i < days.length; i++) {
      const { date, contributionCount } = days[i];
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);

      if (i === 0 && contributionCount > 0) {
        currentStreak = 1;
        continue;
      }

      if (i > 0) {
        const prevDate = new Date(days[i - 1].date);
        prevDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1 && contributionCount > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Calculate max streak
  let tempStreak = 0;
  for (let i = 0; i < days.length; i++) {
    const { contributionCount } = days[i];

    if (contributionCount > 0) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // For tracking monthly badges
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInCurrentMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const badges: { month: string; year: number }[] = [];
  const monthlyContributions: Map<string, number> = new Map();

  for (let i = days.length - 1; i >= 0; i--) {
    const { date, contributionCount } = days[i];
    const currentDate = new Date(date);

    // Track monthly contributions
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    if (contributionCount > 0) {
      const currentCount = monthlyContributions.get(monthKey) || 0;
      monthlyContributions.set(monthKey, currentCount + 1);
    }
  }

  for (const [monthKey, count] of monthlyContributions.entries()) {
    const [year, month] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (count >= 30 || count === daysInMonth) {
      const monthName = new Date(year, month).toLocaleString("default", {
        month: "long",
      });
      badges.push({ month: monthName, year });
    }
  }

  let ranking = "";
  if (currentStreak >= 365) {
    ranking = "Diamond";
  } else if (currentStreak >= 180) {
    ranking = "Platinum";
  } else if (currentStreak >= 90) {
    ranking = "Gold";
  } else if (currentStreak >= 30) {
    ranking = "Silver";
  } else if (currentStreak >= 7) {
    ranking = "Bronze";
  } else {
    ranking = "Beginner";
  }

  let progressToNextRank = 0;
  let nextRank = "";

  if (currentStreak < 7) {
    progressToNextRank = (currentStreak / 7) * 100;
    nextRank = "Bronze";
  } else if (currentStreak < 30) {
    progressToNextRank = ((currentStreak - 7) / (30 - 7)) * 100;
    nextRank = "Silver";
  } else if (currentStreak < 90) {
    progressToNextRank = ((currentStreak - 30) / (90 - 30)) * 100;
    nextRank = "Gold";
  } else if (currentStreak < 180) {
    progressToNextRank = ((currentStreak - 90) / (180 - 90)) * 100;
    nextRank = "Platinum";
  } else if (currentStreak < 365) {
    progressToNextRank = ((currentStreak - 180) / (365 - 180)) * 100;
    nextRank = "Diamond";
  } else {
    progressToNextRank = 100;
    nextRank = "Max Rank";
  }

  return {
    currentStreak,
    maxStreak,
    badges,
    hasCurrentMonthBadge: badges.some(
      (b) =>
        b.month === new Date().toLocaleString("default", { month: "long" }) &&
        b.year === currentYear
    ),
    ranking,
    nextRank,
    progressToNextRank: Math.min(Math.round(progressToNextRank), 100),
  };
};
