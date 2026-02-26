import Review from "../models/Review.js";

// List reviews for the logged-in vendor
export async function listVendorReviews(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const { limit = 50, skip = 0 } = req.query;

    const filter = { vendorId: req.user.vendorId };

    const reviews = await Review.find(filter)
      .populate("studentId", "name phone")
      .populate("orderId", "items totalAmount createdAt")
      .sort({ createdAt: -1 })
      .skip(Math.max(0, parseInt(skip, 10)))
      .limit(Math.min(100, Math.max(1, parseInt(limit, 10))))
      .lean();

    const total = await Review.countDocuments(filter);

    // Compute rating summary (average, count, and breakdown)
    const [summary] = await Review.aggregate([
      { $match: filter },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalCount: { $sum: 1 },
              },
            },
          ],
          breakdown: [
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    let ratingSummary = { averageRating: 0, totalCount: 0, breakdown: {} };
    if (summary?.stats?.[0]) {
      const s = summary.stats[0];
      ratingSummary.averageRating = Math.round(s.averageRating * 10) / 10;
      ratingSummary.totalCount = s.totalCount;
    }
    if (summary?.breakdown?.length) {
      summary.breakdown.forEach((b) => {
        ratingSummary.breakdown[b._id] = b.count;
      });
    }

    res.json({
      success: true,
      reviews,
      total,
      ratingSummary,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
