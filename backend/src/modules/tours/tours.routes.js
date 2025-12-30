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
      .select(`*, destinations (name)`, { count: "exact" })
      .eq("status", "active");

    if (location) query = query.ilike("location", `%${location}%`);
    if (type) query = query.eq("type", type);
    if (min_price) query = query.gte("price", Number(min_price));
    if (max_price) query = query.lte("price", Number(max_price));

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ tours: data || [], total: count || 0 });
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
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
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

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Tour không tồn tại" });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching tour:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin tour" });
  }
});

// Create tour
router.post("/", async (req, res) => {
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
router.put("/:id", async (req, res) => {
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
});

// Delete tour
router.delete("/:id", async (req, res) => {
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
});

module.exports = router;
