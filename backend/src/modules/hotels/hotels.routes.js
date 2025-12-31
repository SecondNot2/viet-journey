/**
 * Hotels Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get featured hotels
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("status", "active")
      .order("rating", { ascending: false })
      .limit(4);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching featured hotels:", error);
    res.status(500).json({ error: "Lỗi khi lấy khách sạn nổi bật" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all hotels
router.get("/", async (req, res) => {
  try {
    const { location, min_price, max_price, page = 1, limit = 10 } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("hotels")
      .select("*", { count: "exact" })
      .eq("status", "active");

    if (location) query = query.ilike("location", `%${location}%`);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ hotels: data || [], total: count || 0 });
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách khách sạn" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get hotel by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("hotels")
      .select(`*, hotelrooms (*)`)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Khách sạn không tồn tại" });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin khách sạn" });
  }
});

// Get hotel rooms
router.get("/:id/rooms", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("hotelrooms")
      .select("*")
      .eq("hotel_id", id)
      .eq("status", "available");

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách phòng" });
  }
});

// Create hotel
const {
  authenticateToken,
  requireRole,
} = require("../../shared/middleware/auth.middleware");

router.post("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("hotels")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "Tạo khách sạn thành công" });
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(500).json({ error: "Lỗi khi tạo khách sạn" });
  }
});

// Update hotel
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
        .from("hotels")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      res.json({ message: "Cập nhật khách sạn thành công" });
    } catch (error) {
      console.error("Error updating hotel:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật khách sạn" });
    }
  }
);

// Delete hotel
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
        .from("hotels")
        .update({ status: "inactive" })
        .eq("id", id);

      if (error) throw error;
      res.json({ message: "Xóa khách sạn thành công" });
    } catch (error) {
      console.error("Error deleting hotel:", error);
      res.status(500).json({ error: "Lỗi khi xóa khách sạn" });
    }
  }
);

module.exports = router;
