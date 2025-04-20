import api from "../Modules/Api.js";
import Config from "../Utils/Config.js";
import Database from "../Modules/Database.js";
import Constants from "../Utils/Constants.js";

const {
    subscriptionActive,
    trackStatusEnabled,
    trackStatusDisabled,
} = Constants;

const { SHOPTRACKER_DASHBOARD_USERNAME, SHOPTRACKER_DASHBOARD_PASSWORD } = Config;

api.post("/dashboard", async function (req, res) {
    const { username, password } = req.body;

    if (!username || !password || username !== SHOPTRACKER_DASHBOARD_USERNAME || password !== SHOPTRACKER_DASHBOARD_PASSWORD) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
        return;
    }

    // Total number of active users
    const [[{ total_active_users }]] = await Database.query("SELECT COUNT(*) AS total_active_users FROM user WHERE disabled=0");

    // Number of active subscriptions by plan
    const [activeSubscriptions] = await Database.query(`
        SELECT p.name, COUNT(*) AS active_subscriptions
        FROM subscription s
        JOIN plan p ON s.plan_id=p.id
        WHERE s.status_id=${subscriptionActive}
        GROUP BY p.name
    `);

    // Estimated Monthly Recurring Revenue (MRR)
    const [[{ mrr }]] = await Database.query(`
        SELECT SUM(p.price) AS mrr
        FROM subscription s
        JOIN plan p ON s.plan_id=p.id
        WHERE s.status_id=${subscriptionActive}
    `);

    // Plan distribution (all subscriptions)
    const [plansDistribution] = await Database.query(`
        SELECT p.name, COUNT(*) AS user_count
        FROM subscription s
        JOIN plan p ON s.plan_id=p.id
        GROUP BY p.name
        ORDER BY user_count DESC
    `);

    // Conversion rate: users with a subscription vs. users without any subscription
    const [[conversion]] = await Database.query(`
        SELECT 
            COUNT(DISTINCT CASE WHEN s.user_id IS NULL THEN u.id END) AS free_users,
            COUNT(DISTINCT CASE WHEN s.user_id IS NOT NULL THEN u.id END) AS paying_users,
            ROUND(
                COUNT(DISTINCT CASE WHEN s.user_id IS NOT NULL THEN u.id END) * 100.0 /
                COUNT(DISTINCT u.id), 2
            ) AS conversion_rate
        FROM user u
        LEFT JOIN subscription s ON u.id=s.user_id
    `);

    // Average number of tracked products per user
    const [[{ avg_tracks_per_user }]] = await Database.query(`
        SELECT ROUND(COUNT(*) / (SELECT COUNT(*) FROM user), 2) AS avg_tracks_per_user
        FROM track
    `);

    // Users who have not tracked any products
    const [[{ users_no_track }]] = await Database.query(`
        SELECT COUNT(*) AS users_no_track
        FROM user u
        LEFT JOIN track t ON t.user_id=u.id
        WHERE t.id IS NULL
    `);

    // Product tracking status distribution
    const [trackStatus] = await Database.query(`
        SELECT ts.status, COUNT(*) AS count
        FROM track t
        JOIN track_status ts ON t.status_id=ts.id
        GROUP BY ts.status
    `);

    // Number of enabled vs disabled tracked products
    const [[enabledDisabled]] = await Database.query(`
        SELECT 
            COUNT(CASE WHEN status_id=${trackStatusEnabled} THEN 1 END) AS enabled,
            COUNT(CASE WHEN status_id=${trackStatusDisabled} THEN 1 END) AS disabled
        FROM track
    `);

    // Tracking success rate (OK vs KO)
    const [[trackingSuccess]] = await Database.query(`
        SELECT 
            (SELECT COUNT(*) FROM track_check_ok) AS total_ok,
            (SELECT COUNT(*) FROM track_check_ko) AS total_ko,
            ROUND(
            (SELECT COUNT(*) FROM track_check_ok) * 100.0 /
            ((SELECT COUNT(*) FROM track_check_ok) + (SELECT COUNT(*) FROM track_check_ko)), 2
            ) AS success_rate
    `);

    // Users without Stripe customer ID
    const [[{ users_no_stripe }]] = await Database.query(`
        SELECT COUNT(*) AS users_no_stripe
        FROM user
        WHERE stripe_customer_id IS NULL
    `);

    // Churned users (no active subscription)
    const [[{ churned_users }]] = await Database.query(`
        SELECT COUNT(*) AS churned_users
        FROM user u
        LEFT JOIN subscription s ON u.id=s.user_id
        WHERE s.status_id != ${subscriptionActive} OR s.status_id IS NULL
    `);

    // Evolution of signups over time (monthly)
    const [signupsOverTime] = await Database.query(`
        SELECT 
            FROM_UNIXTIME(created_at / 1000, '%Y-%m') AS month,
            COUNT(*) AS total_users
        FROM user
        GROUP BY month
        ORDER BY month
    `);

    // Evolution of subscriptions by plan over time (monthly)
    const [subscriptionsOverTime] = await Database.query(`
        SELECT 
            FROM_UNIXTIME(s.created_at / 1000, '%Y-%m') AS month,
            p.name AS plan_name,
            COUNT(*) AS subscriptions
        FROM subscription s
        JOIN plan p ON p.id=s.plan_id
        GROUP BY month, plan_name
        ORDER BY month, plan_name
    `);

    // Monthly Recurring Revenue (MRR) over time
    const [mrrOverTime] = await Database.query(`
        SELECT 
            FROM_UNIXTIME(s.created_at / 1000, '%Y-%m') AS month,
            ROUND(SUM(p.price), 2) AS mrr
        FROM subscription s
        JOIN plan p ON p.id=s.plan_id
        WHERE s.status_id IN (${subscriptionActive})
        GROUP BY month
        ORDER BY month;
    `);

    // Monthly churn (approximate)
    const [churnOverTime] = await Database.query(`
        SELECT 
            FROM_UNIXTIME(updated_at / 1000, '%Y-%m') AS month,
            COUNT(*) AS churned
        FROM subscription
        WHERE status_id NOT IN (${subscriptionActive})
        GROUP BY month
        ORDER BY month
    `);

    // Number of tracked products by plan
    const [tracksByPlan] = await Database.query(`
        SELECT 
            p.name AS plan_name,
            COUNT(DISTINCT t.id) AS total_tracks
        FROM user u
        JOIN subscription s ON u.id=s.user_id
        JOIN plan p ON p.id=s.plan_id
        JOIN track t ON t.user_id=u.id
        GROUP BY plan_name
    `);

    // Daily creation of tracked products
    const [tracksCreatedOverTime] = await Database.query(`
        SELECT 
            FROM_UNIXTIME(created_at / 1000, '%Y-%m-%d') AS day,
            COUNT(*) AS tracks_created
        FROM track
        GROUP BY day
        ORDER BY day
    `);

    // Distribution of active plans
    const [activePlansDistribution] = await Database.query(`
        SELECT 
            p.name,
            COUNT(*) AS active_subscriptions
        FROM subscription s
        JOIN plan p ON p.id=s.plan_id
        WHERE s.status_id=${subscriptionActive}
        GROUP BY p.name
        ORDER BY active_subscriptions DESC
    `);

    // Most active weekdays for product tracking
    const [tracksByWeekday] = await Database.query(`
        SELECT 
            FROM_UNIXTIME(created_at / 1000, '%W') AS weekday,
            COUNT(*) AS total
        FROM track
        GROUP BY weekday
        ORDER BY FIELD(weekday, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `);

    // Adoption of price threshold alerts over time
    const [tracksWithThresholdOverTime] = await Database.query(`
        SELECT 
            FROM_UNIXTIME(created_at / 1000, '%Y-%m') AS month,
            COUNT(*) AS tracks_with_threshold
        FROM track
        WHERE track_price_threshold IS NOT NULL
        GROUP BY month
    `);

    res.status(200).json({
        data: {
            revenueMetrics: {
                activeSubscriptions,
                mrr,
                mrrOverTime,
                plansDistribution,
                activePlansDistribution,
                subscriptionsOverTime,
                churned_users,
                churnOverTime,
                users_no_stripe,
            },
            userMetrics: {
                total_active_users,
                signupsOverTime,
                conversion,
                users_no_track,
            },
            trackMetrics: {
                avg_tracks_per_user,
                trackStatus,
                enabledDisabled,
                trackingSuccess,
                tracksByPlan,
                tracksCreatedOverTime,
                tracksByWeekday,
                tracksWithThresholdOverTime,
            },
        },
        msg: "Dashboard data retrieved."
    });
});