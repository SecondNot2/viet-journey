/**
 * Wishlist Routes
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");
const {
  authenticateToken,
} = require("../../shared/middleware/auth.middleware");

// ========================================
// ROUTES
// ========================================

// Get user's wishlist
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = db.getClient();

    // 1. Get all wishlist items
    const { data: items, error } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!items || items.length === 0) {
      return res.json([]);
    }

    // 2. Group by type to fetch details efficiently
    const itemsByType = items.reduce((acc, item) => {
      if (!acc[item.item_type]) acc[item.item_type] = [];
      acc[item.item_type].push(item.item_id);
      return acc;
    }, {});

    // 3. Fetch details for each type
    const enrichedItems = [];
    const detailMap = {}; // type -> id -> detailData

    for (const [type, ids] of Object.entries(itemsByType)) {
      let tableName = "";
      let selectQuery = "*";

      switch (type) {
        case "tour":
          tableName = "tours";
          selectQuery = "id, title, image, price, destination_id, rating"; // Select essential fields
          break;
        case "hotel":
          tableName = "hotels";
          selectQuery = "id, name, images, rating, location"; // Hotel schema is different: 'name', 'images' (JSON)
          // For hotels we don't have a direct 'price' on the hotel table, usually it's on rooms.
          // We might need to fetch min price? Or just leave price empty for now.
          break;
        case "flight":
          tableName = "flight_schedules"; // Assuming we wishlist schedules
          break;
        case "transport":
          tableName = "transport_trips";
          break;
      }

      if (tableName) {
        const { data: details, error: detailError } = await supabase
          .from(tableName)
          .select(selectQuery)
          .in("id", ids);

        if (!detailError && details) {
          if (!detailMap[type]) detailMap[type] = {};
          details.forEach((d) => {
            detailMap[type][String(d.id)] = d;
          });
        }
      }
    }

    // 4. Merge details back
    const result = items
      .map((item) => {
        const details = detailMap[item.item_type]?.[String(item.item_id)];
        if (!details) return null; // Item might have been deleted

        // Normalize data for frontend
        let normalized = {
          wishlist_id: item.id,
          type: item.item_type,
          added_at: item.created_at,
          original_data: details,
        };

        if (item.item_type === "tour") {
          normalized = {
            ...normalized,
            id: details.id,
            name: details.title,
            image: details.image,
            price: details.price,
            location: "", // Need to fetch? Tour has location column
            rating: details.rating,
          };
        } else if (item.item_type === "hotel") {
          // Handle Hotel Images (JSON)
          let image = "";
          try {
            const imgs =
              typeof details.images === "string"
                ? JSON.parse(details.images)
                : details.images;
            image = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : "";
          } catch (e) {}

          normalized = {
            ...normalized,
            id: details.id,
            name: details.name,
            image: image,
            price: 0, // Placeholder
            location: details.location,
            rating: details.rating,
          };
        }

        return normalized;
      })
      .filter((i) => i !== null);

    res.json(result);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách yêu thích" });
  }
});

// Add to wishlist
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_type, item_id } = req.body;

    if (!item_type || !item_id) {
      return res.status(400).json({ error: "Thiếu thông tin item" });
    }

    const supabase = db.getClient();

    // Check if exists
    const { data: existing } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", userId)
      .eq("item_type", item_type)
      .eq("item_id", item_id)
      .single();

    if (existing) {
      return res.json({
        message: "Đã có trong danh sách yêu thích",
        id: existing.id,
      });
    }

    const { data, error } = await supabase
      .from("wishlist")
      .insert({
        user_id: userId,
        item_type,
        item_id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Lỗi khi thêm vào danh sách yêu thích" });
  }
});

// Remove from wishlist
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;

    const supabase = db.getClient();
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // Ensure ownership

    if (error) throw error;

    res.json({ message: "Đã xóa khỏi danh sách yêu thích" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Lỗi khi xóa khỏi danh sách yêu thích" });
  }
});

// Check status (Optional, for item detail pages)
router.get("/check", authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.query;
    if (!type || !id) return res.status(400).json({ error: "Missing params" });

    const supabase = db.getClient();
    const { data } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("item_type", type)
      .eq("item_id", id)
      .single();

    res.json({ isWishlisted: !!data, wishlistId: data?.id });
  } catch (e) {
    res.status(500).json({ error: "Error checking status" });
  }
});

module.exports = router;
