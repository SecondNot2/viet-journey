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
      .select("*, hotelrooms(price)")
      .eq("status", "active")
      .order("rating", { ascending: false })
      .limit(4);

    if (error) throw error;

    // Process hotels to add min_price from rooms
    const hotelsWithPrice = (data || []).map((hotel) => {
      const rooms = hotel.hotelrooms || [];
      const prices = rooms
        .filter((room) => room.price != null)
        .map((room) => parseFloat(room.price));
      const min_price = prices.length > 0 ? Math.min(...prices) : null;

      // Remove nested hotelrooms, keep only min_price
      const { hotelrooms, ...hotelData } = hotel;
      return {
        ...hotelData,
        min_price,
        room_count: rooms.length,
      };
    });

    res.json(hotelsWithPrice);
  } catch (error) {
    console.error("Error fetching featured hotels:", error);
    res.status(500).json({ error: "Lỗi khi lấy khách sạn nổi bật" });
  }
});

// Get location suggestions for hotels
router.get("/locations/suggest", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ locations: [] });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("hotels")
      .select("location")
      .eq("status", "active")
      .ilike("location", `%${q}%`);

    if (error) throw error;

    const locations = [
      ...new Set((data || []).map((h) => h.location).filter(Boolean)),
    ];
    res.json({ locations: locations.sort() });
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    res.status(500).json({ error: "Lỗi khi lấy gợi ý địa điểm" });
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
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    // Query hotels with rooms to calculate min_price
    let query = supabase
      .from("hotels")
      .select("*, hotelrooms(price)", { count: "exact" })
      .eq("status", "active");

    if (location) query = query.ilike("location", `%${location}%`);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parsedLimit - 1);

    if (error) throw error;

    // Process hotels to add min_price from rooms
    const hotelsWithPrice = (data || []).map((hotel) => {
      const rooms = hotel.hotelrooms || [];
      const prices = rooms
        .filter((room) => room.price != null)
        .map((room) => parseFloat(room.price));
      const min_price = prices.length > 0 ? Math.min(...prices) : null;

      // Remove nested hotelrooms, keep only min_price
      const { hotelrooms, ...hotelData } = hotel;
      return {
        ...hotelData,
        min_price,
        room_count: rooms.length,
      };
    });

    // Return pagination object that Frontend expects
    const total = count || 0;
    const total_pages = Math.ceil(total / parsedLimit);

    res.json({
      hotels: hotelsWithPrice,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        total_pages,
      },
    });
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
