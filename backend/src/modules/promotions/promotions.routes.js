/**
 * Promotions Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get global promotions
router.get("/global", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("status", "active")
      .eq("is_global", true)
      .gte("end_date", new Date().toISOString().split("T")[0]);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching global promotions:", error);
    res.status(500).json({ error: "Lỗi khi lấy khuyến mãi toàn cầu" });
  }
});

// Get promotions for specific service
router.get("/services", async (req, res) => {
  try {
    const { service_type, service_id } = req.query;
    const supabase = db.getClient();

    let query = supabase.from("promotionservices").select(`
        *,
        promotions (*)
      `);

    if (service_type) query = query.eq("service_type", service_type);
    if (service_id) query = query.eq("service_id", service_id);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching service promotions:", error);
    res.status(500).json({ error: "Lỗi khi lấy khuyến mãi dịch vụ" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all promotions
router.get("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("status", "active")
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách khuyến mãi" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get promotion by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
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

// Create promotion
router.post("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("promotions")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi tạo khuyến mãi" });
  }
});

// Update promotion
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("promotions")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật" });
  }
});

// Delete promotion
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("promotions")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi khi xóa" });
  }
});

module.exports = router;
