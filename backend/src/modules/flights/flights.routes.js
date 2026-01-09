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
          base_price, duration, baggage, amenities, trip_type
        )
      `
      )
      .eq("status", "scheduled")
      .order("departure_datetime", { ascending: true })
      .limit(4);

    if (error) throw error;

    // Flatten nested data for frontend compatibility
    const flattenedFlights = (data || []).map((schedule) => ({
      id: schedule.id,
      schedule_code: schedule.schedule_code,
      flight_date: schedule.flight_date,
      departure_datetime: schedule.departure_datetime,
      arrival_datetime: schedule.arrival_datetime,
      departure_time: schedule.departure_datetime,
      arrival_time: schedule.arrival_datetime,
      status: schedule.status,
      flight_number: schedule.flight_routes?.flight_number || "",
      airline: schedule.flight_routes?.airline || "Hãng bay",
      airline_image: schedule.flight_routes?.airline_image,
      from_location: schedule.flight_routes?.from_location || "",
      to_location: schedule.flight_routes?.to_location || "",
      aircraft: schedule.flight_routes?.aircraft,
      price: schedule.price_override || schedule.flight_routes?.base_price || 0,
      duration: schedule.flight_routes?.duration || 0,
      baggage: schedule.flight_routes?.baggage,
      amenities: schedule.flight_routes?.amenities,
      trip_type: schedule.flight_routes?.trip_type || "one_way",
    }));

    res.json(flattenedFlights);
  } catch (error) {
    console.error("Error fetching featured flights:", error);
    res.status(500).json({ error: "Lỗi khi lấy chuyến bay nổi bật" });
  }
});

// Get all cities (from/to locations)
router.get("/cities", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("flight_routes")
      .select("from_location, to_location")
      .eq("status", "active");

    if (error) throw error;

    // Extract unique locations
    const fromLocations = [
      ...new Set((data || []).map((r) => r.from_location).filter(Boolean)),
    ];
    const toLocations = [
      ...new Set((data || []).map((r) => r.to_location).filter(Boolean)),
    ];

    res.json({
      from_locations: fromLocations.sort(),
      to_locations: toLocations.sort(),
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách thành phố" });
  }
});

// Get all airlines
router.get("/airlines", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("flight_routes")
      .select("airline")
      .eq("status", "active");

    if (error) throw error;

    // Extract unique airlines
    const airlines = [
      ...new Set((data || []).map((r) => r.airline).filter(Boolean)),
    ];

    res.json({ airlines: airlines.sort() });
  } catch (error) {
    console.error("Error fetching airlines:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách hãng bay" });
  }
});

// Get location suggestions
router.get("/locations/suggest", async (req, res) => {
  try {
    const { q, field } = req.query;
    if (!q) {
      return res.json({ locations: [] });
    }

    const supabase = db.getClient();
    const column = field === "from" ? "from_location" : "to_location";

    const { data, error } = await supabase
      .from("flight_routes")
      .select(column)
      .eq("status", "active")
      .ilike(column, `%${q}%`);

    if (error) throw error;

    const locations = [
      ...new Set((data || []).map((r) => r[column]).filter(Boolean)),
    ];
    res.json({ locations: locations.sort() });
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    res.status(500).json({ error: "Lỗi khi lấy gợi ý địa điểm" });
  }
});

// Get destinations from a specific origin
router.get("/destinations/:origin", async (req, res) => {
  try {
    const { origin } = req.params;
    const supabase = db.getClient();

    const { data, error } = await supabase
      .from("flight_routes")
      .select("to_location")
      .eq("from_location", decodeURIComponent(origin))
      .eq("status", "active");

    if (error) throw error;

    const destinations = [
      ...new Set((data || []).map((r) => r.to_location).filter(Boolean)),
    ];
    res.json({ destinations: destinations.sort() });
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({ error: "Lỗi khi lấy điểm đến" });
  }
});

// Get origins to a specific destination
router.get("/origins/:destination", async (req, res) => {
  try {
    const { destination } = req.params;
    const supabase = db.getClient();

    const { data, error } = await supabase
      .from("flight_routes")
      .select("from_location")
      .eq("to_location", decodeURIComponent(destination))
      .eq("status", "active");

    if (error) throw error;

    const origins = [
      ...new Set((data || []).map((r) => r.from_location).filter(Boolean)),
    ];
    res.json({ origins: origins.sort() });
  } catch (error) {
    console.error("Error fetching origins:", error);
    res.status(500).json({ error: "Lỗi khi lấy điểm đi" });
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
      from_location,
      to_location,
      departure_date,
      page = 1,
      limit = 10,
    } = req.query;
    const supabase = db.getClient();
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    // Query all scheduled flights with routes
    let query = supabase
      .from("flight_schedules")
      .select(
        `
        *,
        flight_routes!inner (
          flight_number, airline, airline_image,
          from_location, to_location, aircraft,
          base_price, duration, baggage, amenities, trip_type
        )
      `,
        { count: "exact" }
      )
      .eq("status", "scheduled");

    if (departure_date) {
      query = query.eq("flight_date", departure_date);
    }

    const { data, error } = await query.order("departure_datetime", {
      ascending: true,
    });

    if (error) throw error;

    // Apply location filters in JavaScript (for nested fields)
    let filteredFlights = data || [];

    // Filter by origin/from_location
    const fromFilter = origin || from_location;
    if (fromFilter) {
      filteredFlights = filteredFlights.filter((s) =>
        s.flight_routes?.from_location
          ?.toLowerCase()
          .includes(fromFilter.toLowerCase())
      );
    }

    // Filter by destination/to_location
    const toFilter = destination || to_location;
    if (toFilter) {
      filteredFlights = filteredFlights.filter((s) =>
        s.flight_routes?.to_location
          ?.toLowerCase()
          .includes(toFilter.toLowerCase())
      );
    }

    // Apply pagination after filtering
    const total = filteredFlights.length;
    const total_pages = Math.ceil(total / parsedLimit);
    const offset = (parsedPage - 1) * parsedLimit;
    const paginatedFlights = filteredFlights.slice(
      offset,
      offset + parsedLimit
    );

    // Flatten nested flight_routes data for frontend compatibility
    const flattenedFlights = paginatedFlights.map((schedule) => ({
      // Schedule fields
      id: schedule.id,
      schedule_id: schedule.id,
      schedule_code: schedule.schedule_code,
      flight_date: schedule.flight_date,
      departure_datetime: schedule.departure_datetime,
      arrival_datetime: schedule.arrival_datetime,
      departure_time: schedule.departure_datetime,
      arrival_time: schedule.arrival_datetime,
      seat_classes: schedule.seat_classes,
      flight_status: schedule.status,
      discount_percentage: schedule.discount_percentage || 0,
      // Flattened route fields
      flight_number: schedule.flight_routes?.flight_number || "",
      airline: schedule.flight_routes?.airline || "Hãng bay",
      airline_image: schedule.flight_routes?.airline_image,
      from_location: schedule.flight_routes?.from_location || "",
      to_location: schedule.flight_routes?.to_location || "",
      aircraft: schedule.flight_routes?.aircraft,
      price: schedule.price_override || schedule.flight_routes?.base_price || 0,
      base_price: schedule.flight_routes?.base_price || 0,
      duration: schedule.flight_routes?.duration || 0,
      baggage: schedule.flight_routes?.baggage,
      amenities: schedule.flight_routes?.amenities,
      trip_type: schedule.flight_routes?.trip_type || "one_way",
    }));

    res.json({
      flights: flattenedFlights,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        total_pages,
      },
    });
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

    // Flatten nested flight_routes data for frontend compatibility
    const flattenedFlight = {
      // Schedule fields
      id: data.id,
      schedule_id: data.id,
      schedule_code: data.schedule_code,
      flight_date: data.flight_date,
      departure_datetime: data.departure_datetime,
      arrival_datetime: data.arrival_datetime,
      departure_time: data.departure_datetime,
      arrival_time: data.arrival_datetime,
      seat_classes: data.seat_classes,
      flight_status: data.status,
      status: data.status,
      discount_percentage: data.discount_percentage || 0,
      // Flattened route fields
      route_id: data.route_id,
      flight_number: data.flight_routes?.flight_number || "",
      airline: data.flight_routes?.airline || "Hãng bay",
      airline_image: data.flight_routes?.airline_image,
      from_location: data.flight_routes?.from_location || "",
      to_location: data.flight_routes?.to_location || "",
      aircraft: data.flight_routes?.aircraft,
      price: data.price_override || data.flight_routes?.base_price || 0,
      base_price: data.flight_routes?.base_price || 0,
      duration: data.flight_routes?.duration || 0,
      baggage: data.flight_routes?.baggage,
      amenities: data.flight_routes?.amenities,
      trip_type: data.flight_routes?.trip_type || "one_way",
    };

    res.json(flattenedFlight);
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
