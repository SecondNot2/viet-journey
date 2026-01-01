/**
 * Promotions Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get global promotions with linked services for homepage display
router.get("/global", async (req, res) => {
  try {
    const supabase = db.getClient();
    const today = new Date().toISOString().split("T")[0];

    // First get promotionservices with promotions
    const { data: promoServices, error: promoError } = await supabase
      .from("promotionservices")
      .select(
        `
        id,
        service_type,
        service_id,
        promotions (*)
      `
      )
      .not("promotions", "is", null);

    if (promoError) throw promoError;

    // Filter active promotions with valid date
    const activePromos = (promoServices || []).filter((ps) => {
      const promo = ps.promotions;
      if (!promo) return false;
      return promo.status === "active" && promo.end_date >= today;
    });

    // Enrich with service data
    const enrichedPromotions = [];

    for (const ps of activePromos.slice(0, 8)) {
      const promo = ps.promotions;
      let serviceData = null;

      try {
        // Fetch service info based on type
        if (ps.service_type === "tour") {
          const { data } = await supabase
            .from("tours")
            .select("id, title, location, price, duration, images, type")
            .eq("id", ps.service_id)
            .single();
          if (data) {
            serviceData = {
              id: data.id,
              type: "tour",
              name: data.title,
              location: data.location,
              price: data.price,
              duration: data.duration,
              image: Array.isArray(data.images) ? data.images[0] : data.images,
            };
          }
        } else if (ps.service_type === "hotel") {
          const { data } = await supabase
            .from("hotels")
            .select("id, name, location, rating, images")
            .eq("id", ps.service_id)
            .single();
          if (data) {
            // Get cheapest room price
            const { data: rooms } = await supabase
              .from("hotelrooms")
              .select("price")
              .eq("hotel_id", data.id)
              .order("price", { ascending: true })
              .limit(1);

            serviceData = {
              id: data.id,
              type: "hotel",
              name: data.name,
              location: data.location,
              rating: data.rating,
              price: rooms?.[0]?.price || 0,
              image: Array.isArray(data.images) ? data.images[0] : data.images,
            };
          }
        }
        // Add more service types as needed (flight, transport)
      } catch (err) {
        console.error(
          `Error fetching ${ps.service_type} ${ps.service_id}:`,
          err
        );
      }

      if (serviceData) {
        enrichedPromotions.push({
          ...serviceData,
          promotion: promo,
          original_price: serviceData.price,
          discounted_price:
            promo.type === "percentage"
              ? serviceData.price * (1 - promo.discount / 100)
              : serviceData.price - promo.discount,
        });
      }
    }

    // Sort by discount (highest first)
    enrichedPromotions.sort(
      (a, b) => (b.promotion?.discount || 0) - (a.promotion?.discount || 0)
    );

    res.json(enrichedPromotions);
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
