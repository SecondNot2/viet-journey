/**
 * Flights Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

// ========================================
// SPECIFIC ROUTES (must be before /:id)
// ========================================

// Get featured flights
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("flight_schedules")
      .select(
        `
        *,
        flight_routes (
          flight_number, airline, airline_image,
          from_location, to_location, aircraft,
          base_price, baggage, amenities
        )
      `
      )
      .eq("status", "scheduled")
      .order("departure_datetime", { ascending: true })
      .limit(4);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching featured flights:", error);
    res.status(500).json({ error: "Lỗi khi lấy chuyến bay nổi bật" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all flight schedules
router.get("/", async (req, res) => {
  try {
    const {
      origin,
      destination,
      departure_date,
      page = 1,
      limit = 10,
    } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("flight_schedules")
      .select(
        `
        *,
        flight_routes (
          flight_number, airline, airline_image,
          from_location, to_location, aircraft,
          base_price, baggage, amenities
        )
      `,
        { count: "exact" }
      )
      .eq("status", "scheduled");

    if (departure_date) {
      query = query.eq("flight_date", departure_date);
    }

    const { data, count, error } = await query
      .order("departure_datetime", { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ flights: data || [], total: count || 0 });
  } catch (error) {
    console.error("Error fetching flights:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách chuyến bay" });
  }
});

// ========================================
// PARAMETERIZED ROUTES (must be after specific routes)
// ========================================

// Get flight by ID
router.get("/:id", async (req, res) => {
  try {
    // Validate that id is a number
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("flight_schedules")
      .select(
        `
        *,
        flight_routes (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Chuyến bay không tồn tại" });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching flight:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin chuyến bay" });
  }
});

// Create flight schedule
router.post("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("flight_schedules")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "Tạo lịch bay thành công" });
  } catch (error) {
    console.error("Error creating flight:", error);
    res.status(500).json({ error: "Lỗi khi tạo lịch bay" });
  }
});

// Update flight
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("flight_schedules")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật chuyến bay thành công" });
  } catch (error) {
    console.error("Error updating flight:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật chuyến bay" });
  }
});

// Cancel flight
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("flight_schedules")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Hủy chuyến bay thành công" });
  } catch (error) {
    console.error("Error deleting flight:", error);
    res.status(500).json({ error: "Lỗi khi hủy chuyến bay" });
  }
});

module.exports = router;
