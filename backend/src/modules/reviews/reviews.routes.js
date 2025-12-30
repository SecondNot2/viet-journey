/**
 * Reviews Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

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
