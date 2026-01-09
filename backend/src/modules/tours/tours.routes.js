/**
 * Tours Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

// ========================================
// SPECIFIC ROUTES (must be before /:id)
// ========================================

// Get featured tours
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("tours")
      .select(
        `
        *,
        destinations (name),
        guides (name)
      `
      )
      .eq("status", "active")
      .order("rating", { ascending: false })
      .limit(4);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching featured tours:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách tour nổi bật" });
  }
});

// Get tour types
router.get("/types", async (req, res) => {
  try {
    res.json([
      "domestic",
      "international",
      "adventure",
      "cultural",
      "beach",
      "mountain",
    ]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get available tour types from database
router.get("/available-types", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("tours")
      .select("type")
      .eq("status", "active");

    if (error) throw error;

    const types = [...new Set((data || []).map((t) => t.type).filter(Boolean))];
    res.json({ types: types.sort() });
  } catch (error) {
    console.error("Error fetching available types:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách loại tour" });
  }
});

// Get location suggestions for tours
router.get("/locations/suggest", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ locations: [] });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("tours")
      .select("location")
      .eq("status", "active")
      .ilike("location", `%${q}%`);

    if (error) throw error;

    const locations = [
      ...new Set((data || []).map((t) => t.location).filter(Boolean)),
    ];
    res.json({ locations: locations.sort() });
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    res.status(500).json({ error: "Lỗi khi lấy gợi ý địa điểm" });
  }
});

// Get tour suggestions based on query
router.get("/suggestions", async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q) {
      return res.json({ suggestions: [] });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("tours")
      .select("id, title, location, price, images")
      .eq("status", "active")
      .or(`title.ilike.%${q}%,location.ilike.%${q}%`)
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ suggestions: data || [] });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Lỗi khi lấy gợi ý" });
  }
});

// Get available dates for tours
router.get("/available-dates", async (req, res) => {
  try {
    const { tour_id, location, type } = req.query;
    const supabase = db.getClient();

    // Fetch start_dates from tours table
    let query = supabase
      .from("tours")
      .select("start_dates")
      .eq("status", "active");

    if (tour_id) query = query.eq("id", parseInt(tour_id));
    if (location) query = query.ilike("location", `%${location}%`);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;

    // Flatten and get unique dates
    const allDates = [];
    (data || []).forEach((tour) => {
      if (tour.start_dates && Array.isArray(tour.start_dates)) {
        allDates.push(...tour.start_dates);
      }
    });

    const uniqueDates = [...new Set(allDates)].filter(Boolean).sort();
    res.json({ dates: uniqueDates });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ error: "Lỗi khi lấy ngày có sẵn" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all tours with filters
router.get("/", async (req, res) => {
  try {
    const {
      location,
      type,
      min_price,
      max_price,
      page = 1,
      limit = 10,
    } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("tours")
      .select(
        `
        *,
        destinations (name),
        tour_schedules (*)
      `,
        { count: "exact" }
      )
      .eq("status", "active");

    if (location) query = query.ilike("location", `%${location}%`);
    if (type) query = query.eq("type", type);
    if (min_price) query = query.gte("price", Number(min_price));
    if (max_price) query = query.lte("price", Number(max_price));

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Transform data for frontend
    const formattedTours = (data || []).map((tour) => ({
      ...tour,
      destination_name: tour.destinations?.name,
      schedules: tour.tour_schedules,
      // Fallback for image if needed
      image: tour.image || tour.destinations?.image,
    }));

    res.json({ tours: formattedTours, total: count || 0 });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách tour" });
  }
});

// ========================================
// PARAMETERIZED ROUTES (must be after specific routes)
// ========================================

// Get tour by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const selectedDate = req.query.selected_date; // Get selected date from query

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();

    // Fetch tour details with relations
    const { data: tour, error: tourError } = await supabase
      .from("tours")
      .select(
        `
        *,
        destinations (name),
        guides (*),
        tour_schedules (*)
      `
      )
      .eq("id", id)
      .single();

    if (tourError) {
      if (tourError.code === "PGRST116") {
        return res.status(404).json({ error: "Tour không tồn tại" });
      }
      throw tourError;
    }

    // Fetch reviews for statistics
    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("tour_id", id)
      .eq("status", "active");

    if (reviewError) throw reviewError;

    // Calculate rating stats
    const reviewCount = reviews.length;
    let totalRating = 0;
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
      totalRating += r.rating;
      const roundedRating = Math.round(r.rating);
      if (ratingBreakdown[roundedRating] !== undefined) {
        ratingBreakdown[roundedRating]++;
      }
    });

    const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    // Calculate Availability if date is selected
    let availableSeats = undefined;
    let totalBooked = 0;

    if (selectedDate) {
      const { data: bookings, error: bookingError } = await supabase
        .from("bookings")
        .select("guest_count")
        .eq("tour_id", id)
        .eq("check_in", selectedDate)
        .in("status", ["pending", "confirmed", "completed"]);

      if (bookingError) console.error("Error fetching bookings:", bookingError);

      if (bookings) {
        totalBooked = bookings.reduce(
          (sum, b) => sum + (b.guest_count || 0),
          0
        );

        // Parse group size (e.g. "10", "10-15")
        let maxCapacity = 15; // default
        if (tour.group_size) {
          const sizeStr = String(tour.group_size).trim();
          if (sizeStr.includes("-")) {
            const parts = sizeStr
              .split("-")
              .map((p) => parseInt(p))
              .filter((n) => !isNaN(n));
            maxCapacity = Math.max(...parts);
          } else {
            maxCapacity = parseInt(sizeStr) || 15;
          }
        }

        availableSeats = Math.max(0, maxCapacity - totalBooked);
      }
    }

    // Format response
    const formattedTour = {
      ...tour,
      destination_name: tour.destinations?.name,
      guide_name: tour.guides?.name,
      schedules: tour.tour_schedules,
      review_count: reviewCount,
      avg_rating: avgRating,
      rating_breakdown: ratingBreakdown,
      available_seats: availableSeats,
      total_booked: totalBooked,
    };

    res.json(formattedTour);
  } catch (error) {
    console.error("Error fetching tour:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin tour" });
  }
});

// ========================================
// REVIEW & RATING ROUTES
// ========================================

// Get reviews for a tour
router.get("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        user:users (
          id, 
          username, 
          role_id,
          userprofiles (full_name, avatar)
        )
      `
      )
      .eq("tour_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Flatten user profile data for frontend
    const formattedReviews = (reviews || []).map((review) => {
      const userProfile = Array.isArray(review.user?.userprofiles)
        ? review.user.userprofiles[0]
        : review.user?.userprofiles;
      return {
        ...review,
        user: {
          ...review.user,
          full_name: userProfile?.full_name || review.user?.username,
          avatar: userProfile?.avatar,
        },
      };
    });

    res.json({ reviews: formattedReviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách đánh giá" });
  }
});

// Get user's rating for a tour
router.get("/:id/rating", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id } = req.query;

    if (isNaN(id) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("tour_id", id)
      .eq("user_id", user_id)
      .eq("status", "active")
      .is("parent_id", null) // Only get main review, not comments
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;

    res.json({ rating: data?.rating || 0 });
  } catch (error) {
    console.error("Error fetching user rating:", error);
    res.status(500).json({ error: "Lỗi khi lấy đánh giá của người dùng" });
  }
});

// Post/Update rating
router.post("/:id/rating", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id, rating } = req.body;

    if (isNaN(id) || !user_id || !rating) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // Check if user already rated
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("tour_id", id)
      .eq("user_id", user_id)
      .is("parent_id", null)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    if (existingReview) {
      // Update existing rating
      const { data, error } = await supabase
        .from("reviews")
        .update({ rating, updated_at: new Date().toISOString() })
        .eq("id", existingReview.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Create new rating (empty comment initially if just rating)
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          tour_id: id,
          user_id,
          rating,
          comment: "", // Default empty comment for rating-only
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, rating: result.rating });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ error: "Lỗi khi gửi đánh giá" });
  }
});

// Post a review (comment)
router.post("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id, comment, rating, parent_id } = req.body;

    if (isNaN(id) || !user_id || !comment) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // If it's a reply (parent_id exists), just insert
    if (parent_id) {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          tour_id: id,
          user_id,
          comment,
          parent_id,
          rating: 0, // Replies usually don't have ratings
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return res.json({
        review_id: data.id,
        message: "Đăng bình luận thành công",
      });
    }

    // If it's a main review, check if exists to update or insert
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("tour_id", id)
      .eq("user_id", user_id)
      .is("parent_id", null)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    if (existingReview) {
      // Update existing review
      const updateData = { comment, updated_at: new Date().toISOString() };
      if (rating) updateData.rating = rating;

      const { data, error } = await supabase
        .from("reviews")
        .update(updateData)
        .eq("id", existingReview.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new review
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          tour_id: id,
          user_id,
          comment,
          rating: rating || 5, // Default 5 if not provided
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ review_id: result.id, message: "Đăng đánh giá thành công" });
  } catch (error) {
    console.error("Error posting review:", error);
    res.status(500).json({ error: "Lỗi khi đăng đánh giá" });
  }
});

// Get liked reviews by user
router.get("/:id/reviews/liked", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id } = req.query;

    if (isNaN(id) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // Get all review IDs for this tour
    const { data: tourReviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("tour_id", id);

    if (!tourReviews || tourReviews.length === 0) {
      return res.json({ liked_reviews: [] });
    }

    const reviewIds = tourReviews.map((r) => r.id);

    // Get likes for these reviews by this user
    const { data: likes, error } = await supabase
      .from("reviewlikes")
      .select("review_id")
      .in("review_id", reviewIds)
      .eq("user_id", user_id);

    if (error) throw error;

    const likedReviewIds = (likes || []).map((l) => l.review_id);
    res.json({ liked_reviews: likedReviewIds });
  } catch (error) {
    console.error("Error fetching liked reviews:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách yêu thích" });
  }
});

// Like/Unlike a review
router.post("/:id/reviews/:reviewId/like", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { user_id } = req.body;

    if (isNaN(reviewId) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // Check if like exists
    const { data: existingLike, error: checkError } = await supabase
      .from("reviewlikes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (checkError) throw checkError;

    let liked = false;

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("reviewlikes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) throw deleteError;

      // Decrement count manually
      const { data: currentReview } = await supabase
        .from("reviews")
        .select("likes_count")
        .eq("id", reviewId)
        .single();
      if (currentReview) {
        await supabase
          .from("reviews")
          .update({
            likes_count: Math.max(0, (currentReview.likes_count || 0) - 1),
          })
          .eq("id", reviewId);
      }

      liked = false;
    } else {
      // Like
      const { error: insertError } = await supabase
        .from("reviewlikes")
        .insert({ review_id: reviewId, user_id });

      if (insertError) throw insertError;

      // Increment count manually
      const { data: currentReview } = await supabase
        .from("reviews")
        .select("likes_count")
        .eq("id", reviewId)
        .single();
      if (currentReview) {
        await supabase
          .from("reviews")
          .update({ likes_count: (currentReview.likes_count || 0) + 1 })
          .eq("id", reviewId);
      }

      liked = true;
    }

    res.json({ success: true, liked });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Lỗi khi thực hiện thao tác" });
  }
});

// Edit a review
router.put("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { user_id, comment } = req.body;

    if (isNaN(reviewId) || !user_id || !comment) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("reviews")
      .update({ comment, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .eq("user_id", user_id); // Ensure ownership

    if (error) throw error;

    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bình luận" });
  }
});

// Delete a review
router.delete("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    // In DELETE, body usage is non-standard but accepted by Express.
    // Ideally should be query or header.
    // Checking req.body.user_id as per frontend implementation
    const { user_id } = req.body;

    if (isNaN(reviewId) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user_id); // Ensure ownership

    if (error) throw error;

    res.json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Lỗi khi xóa bình luận" });
  }
});

// Create tour
const {
  authenticateToken,
  requireRole,
} = require("../../shared/middleware/auth.middleware");

router.post("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("tours")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "Tạo tour thành công" });
  } catch (error) {
    console.error("Error creating tour:", error);
    res.status(500).json({ error: "Lỗi khi tạo tour" });
  }
});

// Update tour
router.put(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const supabase = db.getClient();
      const { error } = await supabase
        .from("tours")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      res.json({ message: "Cập nhật tour thành công" });
    } catch (error) {
      console.error("Error updating tour:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật tour" });
    }
  }
);

// Delete tour
router.delete(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const supabase = db.getClient();
      const { error } = await supabase
        .from("tours")
        .update({ status: "inactive" })
        .eq("id", id);

      if (error) throw error;
      res.json({ message: "Xóa tour thành công" });
    } catch (error) {
      console.error("Error deleting tour:", error);
      res.status(500).json({ error: "Lỗi khi xóa tour" });
    }
  }
);

module.exports = router;
