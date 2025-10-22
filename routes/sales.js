// routes/sales.js
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

router.get("/today", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todaysTransactions = await Transaction.find({
      date: { $gte: start, $lte: end },
      status: "Completed"  // optional: only count completed
    });

    const total = todaysTransactions.reduce((sum, tx) => sum + tx.total, 0);

    res.json({ total }); // Return JSON { total: 45280 }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ------------------------
// Sales Trend (Completed Only)
// ------------------------
router.get("/trend", async (req, res) => {
  try {
    const { period } = req.query; // "daily", "weekly", "monthly"

    let projectStage;
    if (period === "weekly") {
      // Weekly: ISO week + year
      projectStage = {
        $project: {
          year: { $isoWeekYear: "$date" },
          week: { $isoWeek: "$date" },
          total: 1,
          status: 1
        }
      };
    } else if (period === "monthly") {
      // Monthly: month + year
      projectStage = {
        $project: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          total: 1,
          status: 1
        }
      };
    } else {
      // Daily: day + month + year
      projectStage = {
        $project: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
          total: 1,
          status: 1
        }
      };
    }

    const trend = await Transaction.aggregate([
      // Only Completed transactions
      { $match: { status: "Completed" } },

      // Project fields
      projectStage,

      // Group by period
      {
        $group: {
          _id: period === "weekly"
            ? { year: "$year", week: "$week" }
            : period === "monthly"
              ? { year: "$year", month: "$month" }
              : { year: "$year", month: "$month", day: "$day" },
          totalSales: { $sum: "$total" }
        }
      },

      // Sort by time
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ]);

    // Format labels for frontend
    const formatted = trend.map(t => {
      let label;
      if (period === "weekly") {
        label = `Week ${t._id.week}, ${t._id.year}`;
      } else if (period === "monthly") {
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        label = `${monthNames[t._id.month - 1]} ${t._id.year}`;
      } else {
        label = `${t._id.year}-${String(t._id.month).padStart(2,'0')}-${String(t._id.day).padStart(2,'0')}`;
      }
      return { _id: label, totalSales: t.totalSales };
    });

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
