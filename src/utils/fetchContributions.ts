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

    for (let i = days.length - 1; i >= 0; i--) {
        const { date, contributionCount } = days[i];
        const currentDate = new Date(date);
        if (i === days.length - 1) {
            lastDate = currentDate;
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

    return { currentStreak, maxStreak };
};
