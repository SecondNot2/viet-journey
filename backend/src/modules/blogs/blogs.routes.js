/**
 * Blogs Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get featured/latest blogs
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("blogs")
      .select(
        `
        *,
        users (username)
      `
      )
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching featured blogs:", error);
    res.status(500).json({ error: "Lỗi khi lấy bài viết nổi bật" });
  }
});

// Get blog categories
router.get("/categories", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase.from("blogs").select("category");

    if (error) throw error;

    // Get unique categories
    const categories = [
      ...new Set(data.map((b) => b.category).filter(Boolean)),
    ];
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh mục" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from("blogs").select(
      `
        *,
        users (username)
      `,
      { count: "exact" }
    );

    if (category) {
      query = query.eq("category", category);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ blogs: data || [], total: count || 0 });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách bài viết" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get blog by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("blogs")
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
        return res.status(404).json({ error: "Bài viết không tồn tại" });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ error: "Lỗi khi lấy bài viết" });
  }
});

// Create blog
router.post("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("blogs")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "Tạo bài viết thành công" });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ error: "Lỗi khi tạo bài viết" });
  }
});

// Update blog
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("blogs")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật bài viết thành công" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bài viết" });
  }
});

// Delete blog
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase.from("blogs").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "Xóa bài viết thành công" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Lỗi khi xóa bài viết" });
  }
});

module.exports = router;
