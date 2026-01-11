/**
 * Reviews Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");
const {
  authenticateToken,
  requireRole,
} = require("../../shared/middleware/auth.middleware");

// ========================================
// ADMIN ROUTES (must be before public routes)
// ========================================

// Get admin stats for reviews
router.get(
  "/admin/stats",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const supabase = db.getClient();

      // Get total reviews count
      const { count: totalReviews } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true });

      // Get active reviews count
      const { count: activeReviews } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get average rating
      const { data: ratingData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("status", "active");

      let averageRating = 0;
      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, r) => acc + (r.rating || 0), 0);
        averageRating = (sum / ratingData.length).toFixed(2);
      }

      // Get pending reviews (if status field supports 'pending')
      const { count: pendingReviews } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      res.json({
        totalReviews: totalReviews || 0,
        activeReviews: activeReviews || 0,
        pendingReviews: pendingReviews || 0,
        averageRating: parseFloat(averageRating) || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Lỗi khi lấy thống kê" });
    }
  }
);

// Get all reviews for admin (with pagination)
router.get(
  "/admin/reviews",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = "created_desc",
        status,
      } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const supabase = db.getClient();

      let query = supabase.from("reviews").select(
        `
          *,
          users (username, userprofiles (full_name, avatar))
        `,
        { count: "exact" }
      );

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      // Sorting
      if (sort_by === "created_desc") {
        query = query.order("created_at", { ascending: false });
      } else if (sort_by === "created_asc") {
        query = query.order("created_at", { ascending: true });
      } else if (sort_by === "rating_desc") {
        query = query.order("rating", { ascending: false });
      } else if (sort_by === "rating_asc") {
        query = query.order("rating", { ascending: true });
      }

      const { data, count, error } = await query.range(
        offset,
        offset + parseInt(limit) - 1
      );

      if (error) throw error;

      res.json({
        reviews: data || [],
        total: count || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching admin reviews:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách đánh giá" });
    }
  }
);

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get featured/latest reviews
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        users (username),
        userprofiles (avatar)
      `
      )
      .eq("status", "active")
      .gte("rating", 4)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching featured reviews:", error);
    res.status(500).json({ error: "Lỗi khi lấy đánh giá nổi bật" });
  }
});

// Get reviews by tour
router.get("/tour/:tourId", async (req, res) => {
  try {
    const tourId = parseInt(req.params.tourId);
    if (isNaN(tourId)) {
      return res.status(400).json({ error: "Tour ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        users (username),
        userprofiles (avatar)
      `
      )
      .eq("tour_id", tourId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi lấy đánh giá" });
  }
});

// Get reviews by hotel
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    if (isNaN(hotelId)) {
      return res.status(400).json({ error: "Hotel ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        users (username),
        userprofiles (avatar)
      `
      )
      .eq("hotel_id", hotelId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi lấy đánh giá" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all reviews
router.get("/", async (req, res) => {
  try {
    const {
      tour_id,
      hotel_id,
      destination_id,
      page = 1,
      limit = 10,
    } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("reviews")
      .select(
        `
        *,
        users (username),
        userprofiles (avatar)
      `,
        { count: "exact" }
      )
      .eq("status", "active");

    if (tour_id) query = query.eq("tour_id", parseInt(tour_id));
    if (hotel_id) query = query.eq("hotel_id", parseInt(hotel_id));
    if (destination_id)
      query = query.eq("destination_id", parseInt(destination_id));

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ reviews: data || [], total: count || 0 });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi lấy đánh giá" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get user reviews
router.get("/user", authenticateToken, async (req, res) => {
  try {
    // Note: Assuming auth middleware populates req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const { type } = req.query;

    const supabase = db.getClient();
    let query = supabase
      .from("reviews")
      .select(
        `
        *,
        tours (title, location, image),
        hotels (name, location, images),
        flight_schedules (
           flight_routes (airline, flight_number, from_location, to_location)
        ),
        transport_trips (
           transport_routes (company, type, from_location, to_location)
        ),
        destinations (name, location, image),
        blogs (title, category, image)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Client filtering for 'type' can be complex due to dynamic columns (tour_id, etc.)
    // If strict type filtering is needed via query param:
    if (type && type !== "all") {
      if (type === "tour") query = query.not("tour_id", "is", null);
      else if (type === "hotel") query = query.not("hotel_id", "is", null);
      else if (type === "flight") query = query.not("flight_id", "is", null);
      else if (type === "transport")
        query = query.not("transport_id", "is", null);
      else if (type === "destination")
        query = query.not("destination_id", "is", null);
      else if (type === "blog") query = query.not("blog_id", "is", null);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách đánh giá của bạn" });
  }
});

// ========================================
// LIKE ROUTES
// ========================================

// Get liked reviews by user
router.get("/liked", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // We ignore limit/page for now as this is just used for "is liked" checks
    const supabase = db.getClient();

    // Simple query: get all review_ids liked by this user
    const { data, error } = await supabase
      .from("reviewlikes")
      .select("review_id")
      .eq("user_id", userId);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching liked reviews:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách yêu thích" });
  }
});

// Toggle like review
router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Review ID không hợp lệ" });
    }

    const supabase = db.getClient();

    // Check if like exists
    const { data: existing, error: checkError } = await supabase
      .from("reviewlikes")
      .select("id")
      .eq("user_id", userId)
      .eq("review_id", reviewId)
      .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError;

    let liked = false;
    let newCount = 0;

    // Get current count
    const { data: review } = await supabase
      .from("reviews")
      .select("likes_count")
      .eq("id", reviewId)
      .single();

    const currentCount = review?.likes_count || 0;

    if (existing) {
      // Unlike
      await supabase.from("reviewlikes").delete().eq("id", existing.id);
      newCount = Math.max(0, currentCount - 1);
      liked = false;
    } else {
      // Like
      await supabase.from("reviewlikes").insert({
        user_id: userId,
        review_id: reviewId,
      });
      newCount = currentCount + 1;
      liked = true;
    }

    // Update count in reviews table
    await supabase
      .from("reviews")
      .update({ likes_count: newCount })
      .eq("id", reviewId);

    res.json({ success: true, liked, likes_count: newCount });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Lỗi khi thực hiện like/unlike" });
  }
});

// Get review by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        users (username)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Không tìm thấy" });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Create review
router.post("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("reviews")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "Đánh giá thành công" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi tạo đánh giá" });
  }
});

// Update review
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("reviews")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật" });
  }
});

// Delete review
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi xóa" });
  }
});

module.exports = router;
