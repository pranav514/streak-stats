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
    let lastDate = new Date();
    const days = weeks.flatMap((week: any) => week.contributionDays);
    
    // For tracking monthly badges
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // For tracking earned badges
    const badges: { month: string; year: number }[] = [];
    const monthlyContributions: Map<string, number> = new Map();
    
    for (let i = days.length - 1; i >= 0; i--) {
        const { date, contributionCount } = days[i];
        const currentDate = new Date(date);
        
        if (i === days.length - 1) {
            lastDate = currentDate;
        }
        
        // Track monthly contributions for badges
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        if (contributionCount > 0) {
            const currentCount = monthlyContributions.get(monthKey) || 0;
            monthlyContributions.set(monthKey, currentCount + 1);
        }
        
        const diffDays = Math.ceil((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1 && contributionCount > 0) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else if (contributionCount > 0) {
            currentStreak = 1;
        } else {
            break;
        }
        
        lastDate = currentDate;
    }
    
    // Check for earned badges (months with 30/31 day streaks)
    for (const [monthKey, count] of monthlyContributions.entries()) {
        const [year, month] = monthKey.split('-').map(Number);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        if (count >= 30 || count === daysInMonth) {
            const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
            badges.push({ month: monthName, year });
        }
    }
    
    // Calculate ranking based on streak
    let ranking = '';
    if (currentStreak >= 365) {
        ranking = 'Diamond';
    } else if (currentStreak >= 180) {
        ranking = 'Platinum';
    } else if (currentStreak >= 90) {
        ranking = 'Gold';
    } else if (currentStreak >= 30) {
        ranking = 'Silver';
    } else if (currentStreak >= 7) {
        ranking = 'Bronze';
    } else {
        ranking = 'Beginner';
    }
    
    // Calculate progress to next rank
    let progressToNextRank = 0;
    let nextRank = '';
    
    if (currentStreak < 7) {
        progressToNextRank = (currentStreak / 7) * 100;
        nextRank = 'Bronze';
    } else if (currentStreak < 30) {
        progressToNextRank = ((currentStreak - 7) / (30 - 7)) * 100;
        nextRank = 'Silver';
    } else if (currentStreak < 90) {
        progressToNextRank = ((currentStreak - 30) / (90 - 30)) * 100;
        nextRank = 'Gold';
    } else if (currentStreak < 180) {
        progressToNextRank = ((currentStreak - 90) / (180 - 90)) * 100;
        nextRank = 'Platinum';
    } else if (currentStreak < 365) {
        progressToNextRank = ((currentStreak - 180) / (365 - 180)) * 100;
        nextRank = 'Diamond';
    } else {
        progressToNextRank = 100;
        nextRank = 'Max Rank';
    }
    
    return { 
        currentStreak, 
        maxStreak, 
        badges,
        hasCurrentMonthBadge: badges.some(b => b.month === new Date().toLocaleString('default', { month: 'long' }) && b.year === currentYear),
        ranking,
        nextRank,
        progressToNextRank: Math.min(Math.round(progressToNextRank), 100)
    };
};