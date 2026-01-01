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
          image, amenities, trip_type
        )
      `
      )
      .eq("status", "scheduled")
      .order("departure_datetime", { ascending: true })
      .limit(4);

    if (error) throw error;

    // Flatten nested data for frontend compatibility
    const flattenedTransports = (data || []).map((trip) => ({
      id: trip.id,
      trip_code: trip.trip_code,
      trip_date: trip.trip_date,
      departure_datetime: trip.departure_datetime,
      arrival_datetime: trip.arrival_datetime,
      departure_time: trip.departure_datetime,
      arrival_time: trip.arrival_datetime,
      total_seats: trip.total_seats,
      available_seats: trip.available_seats,
      status: trip.status,
      route_name: trip.transport_routes?.route_name || "",
      type: trip.transport_routes?.type || "bus",
      vehicle_name: trip.transport_routes?.vehicle_name || "",
      company: trip.transport_routes?.company || "",
      from_location: trip.transport_routes?.from_location || "",
      to_location: trip.transport_routes?.to_location || "",
      price: trip.price_override || trip.transport_routes?.price || 0,
      duration: trip.transport_routes?.duration || 0,
      image: trip.transport_routes?.image,
      amenities: trip.transport_routes?.amenities,
      trip_type: trip.transport_routes?.trip_type || "one_way",
    }));

    res.json(flattenedTransports);
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
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let query = supabase
      .from("transport_trips")
      .select(
        `
        *,
        transport_routes (
          route_name, type, vehicle_name, company,
          from_location, to_location, price, duration,
          image, amenities, trip_type
        )
      `,
        { count: "exact" }
      )
      .eq("status", "scheduled");

    const { data, count, error } = await query
      .order("departure_datetime", { ascending: true })
      .range(offset, offset + parsedLimit - 1);

    if (error) throw error;

    // Flatten nested transport_routes data for frontend compatibility
    const flattenedTransports = (data || []).map((trip) => ({
      // Trip fields
      id: trip.id,
      trip_id: trip.id,
      trip_code: trip.trip_code,
      trip_date: trip.trip_date,
      departure_datetime: trip.departure_datetime,
      arrival_datetime: trip.arrival_datetime,
      departure_time: trip.departure_datetime,
      arrival_time: trip.arrival_datetime,
      total_seats: trip.total_seats,
      available_seats: trip.available_seats,
      booked_seats: trip.booked_seats,
      trip_status: trip.status,
      // Flattened route fields
      route_name: trip.transport_routes?.route_name || "",
      type: trip.transport_routes?.type || "bus",
      vehicle_name: trip.transport_routes?.vehicle_name || "",
      company: trip.transport_routes?.company || "",
      from_location: trip.transport_routes?.from_location || "",
      to_location: trip.transport_routes?.to_location || "",
      price: trip.price_override || trip.transport_routes?.price || 0,
      duration: trip.transport_routes?.duration || 0,
      image: trip.transport_routes?.image,
      amenities: trip.transport_routes?.amenities,
      trip_type: trip.transport_routes?.trip_type || "one_way",
    }));

    // Return with pagination object
    const total = count || 0;
    const total_pages = Math.ceil(total / parsedLimit);

    res.json({
      transports: flattenedTransports,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        total_pages,
      },
    });
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

    // Flatten nested transport_routes data for frontend compatibility
    const flattenedTransport = {
      // Trip fields
      trip_id: data.id,
      id: data.id,
      trip_code: data.trip_code,
      trip_date: data.trip_date,
      departure_datetime: data.departure_datetime,
      arrival_datetime: data.arrival_datetime,
      departure_time: data.departure_datetime,
      arrival_time: data.arrival_datetime,
      total_seats: data.total_seats,
      available_seats: data.available_seats,
      booked_seats: data.booked_seats,
      trip_status: data.status,
      trip_notes: data.notes,
      // Flattened route fields
      route_id: data.route_id,
      route_code: data.transport_routes?.route_code || "",
      route_name: data.transport_routes?.route_name || "",
      type: data.transport_routes?.type || "bus",
      vehicle_name: data.transport_routes?.vehicle_name || "",
      company: data.transport_routes?.company || "",
      from_location: data.transport_routes?.from_location || "",
      to_location: data.transport_routes?.to_location || "",
      price: data.price_override || data.transport_routes?.price || 0,
      base_price: data.transport_routes?.price || 0,
      duration: data.transport_routes?.duration || 0,
      image: data.transport_routes?.image,
      amenities: data.transport_routes?.amenities,
      trip_type: data.transport_routes?.trip_type || "one_way",
      route_notes: data.transport_routes?.notes,
    };

    res.json(flattenedTransport);
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
