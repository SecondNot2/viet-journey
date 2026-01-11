/**
 * Destinations Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");
const { generateSlug, isNumericId } = require("../../shared/utils/slug.util");
const {
  authenticateToken,
  requireRole,
} = require("../../shared/middleware/auth.middleware");

// ========================================
// ADMIN ROUTES (must be before public routes)
// ========================================

// Get admin stats for destinations
router.get(
  "/admin/stats",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const supabase = db.getClient();

      // Get total destinations count
      const { count: totalDestinations } = await supabase
        .from("destinations")
        .select("*", { count: "exact", head: true });

      // Get active destinations count
      const { count: activeDestinations } = await supabase
        .from("destinations")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      res.json({
        totalDestinations: totalDestinations || 0,
        activeDestinations: activeDestinations || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Lỗi khi lấy thống kê" });
    }
  }
);

// Get all destinations for admin (with pagination)
router.get(
  "/admin/destinations",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        search,
        status,
        page = 1,
        limit = 10,
        sort_by = "created_desc",
      } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const supabase = db.getClient();

      let query = supabase.from("destinations").select("*", { count: "exact" });

      if (search) {
        query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
      }
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      // Sorting
      if (sort_by === "created_desc") {
        query = query.order("created_at", { ascending: false });
      } else if (sort_by === "created_asc") {
        query = query.order("created_at", { ascending: true });
      } else if (sort_by === "name_asc") {
        query = query.order("name", { ascending: true });
      } else if (sort_by === "name_desc") {
        query = query.order("name", { ascending: false });
      }

      const { data, count, error } = await query.range(
        offset,
        offset + parseInt(limit) - 1
      );

      if (error) throw error;

      // Add slug to each destination
      const dataWithSlug = (data || []).map((dest) => ({
        ...dest,
        slug: generateSlug(dest.name) + "-" + dest.id,
      }));

      res.json({
        destinations: dataWithSlug,
        total: count || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching admin destinations:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách điểm đến" });
    }
  }
);

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get featured destinations
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("destinations")
      .select("*")
      .eq("status", "active")
      .limit(6);

    if (error) throw error;

    // Add slug to each destination
    const dataWithSlug = (data || []).map((dest) => ({
      ...dest,
      slug: generateSlug(dest.name) + "-" + dest.id,
    }));

    res.json(dataWithSlug);
  } catch (error) {
    console.error("Error fetching featured destinations:", error);
    res.status(500).json({ error: "Lỗi khi lấy điểm đến nổi bật" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all destinations
router.get("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("destinations")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw error;

    // Add slug to each destination
    const dataWithSlug = (data || []).map((dest) => ({
      ...dest,
      slug: generateSlug(dest.name) + "-" + dest.id,
    }));

    res.json(dataWithSlug);
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách điểm đến" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get destination by ID or slug
router.get("/:idOrSlug", async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    const supabase = db.getClient();
    let data, error;

    if (isNumericId(param)) {
      // Lookup by ID
      const id = parseInt(param);
      const result = await supabase
        .from("destinations")
        .select("*")
        .eq("id", id)
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Lookup by slug - extract ID from end of slug (format: name-id)
      const slugParts = param.split("-");
      const potentialId = parseInt(slugParts[slugParts.length - 1]);

      if (!isNaN(potentialId)) {
        const result = await supabase
          .from("destinations")
          .select("*")
          .eq("id", potentialId)
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Fallback: search by name pattern
        const searchName = param.replace(/-/g, " ");
        const result = await supabase
          .from("destinations")
          .select("*")
          .ilike("name", `%${searchName}%`)
          .limit(1)
          .single();
        data = result.data;
        error = result.error;
      }
    }

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Điểm đến không tồn tại" });
      }
      throw error;
    }

    // Add slug to response
    const dataWithSlug = {
      ...data,
      slug: generateSlug(data.name) + "-" + data.id,
    };

    res.json(dataWithSlug);
  } catch (error) {
    console.error("Error fetching destination:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin điểm đến" });
  }
});

// Create destination
router.post("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("destinations")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "Tạo điểm đến thành công" });
  } catch (error) {
    console.error("Error creating destination:", error);
    res.status(500).json({ error: "Lỗi khi tạo điểm đến" });
  }
});

// Update destination
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("destinations")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật điểm đến thành công" });
  } catch (error) {
    console.error("Error updating destination:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật điểm đến" });
  }
});

// Delete destination
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("destinations")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Xóa điểm đến thành công" });
  } catch (error) {
    console.error("Error deleting destination:", error);
    res.status(500).json({ error: "Lỗi khi xóa điểm đến" });
  }
});

module.exports = router;
