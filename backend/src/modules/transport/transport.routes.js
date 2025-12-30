/**
 * Transport Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get featured transport
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("transport_trips")
      .select(
        `
        *,
        transport_routes (
          route_name, type, vehicle_name, company,
          from_location, to_location, price, duration,
          image, amenities
        )
      `
      )
      .eq("status", "scheduled")
      .order("departure_datetime", { ascending: true })
      .limit(4);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching featured transport:", error);
    res.status(500).json({ error: "Lỗi khi lấy phương tiện nổi bật" });
  }
});

// Get transport routes (templates)
router.get("/routes", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("transport_routes")
      .select("*")
      .eq("status", "active");

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching transport routes:", error);
    res.status(500).json({ error: "Lỗi khi lấy tuyến đường" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all transport trips
router.get("/", async (req, res) => {
  try {
    const { type, origin, destination, page = 1, limit = 10 } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("transport_trips")
      .select(
        `
        *,
        transport_routes (
          route_name, type, vehicle_name, company,
          from_location, to_location, price, duration,
          image, amenities
        )
      `,
        { count: "exact" }
      )
      .eq("status", "scheduled");

    const { data, count, error } = await query
      .order("departure_datetime", { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ transports: data || [], total: count || 0 });
  } catch (error) {
    console.error("Error fetching transports:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách phương tiện" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get transport by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("transport_trips")
      .select(
        `
        *,
        transport_routes (*)
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

// Create transport trip
router.post("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("transport_trips")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi tạo" });
  }
});

// Update transport
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("transport_trips")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật" });
  }
});

// Delete transport
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("transport_trips")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi xóa" });
  }
});

module.exports = router;
