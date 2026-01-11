/**
 * Transport Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");
const {
  isNumericId,
  generateTransportSlug,
} = require("../../shared/utils/slug.util");
const {
  authenticateToken,
  requireRole,
} = require("../../shared/middleware/auth.middleware");

// ========================================
// ADMIN ROUTES (must be before public routes)
// ========================================

// Get admin stats for transport
router.get(
  "/admin/stats",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const supabase = db.getClient();

      // Get total routes count
      const { count: totalRoutes } = await supabase
        .from("transport_routes")
        .select("*", { count: "exact", head: true });

      // Get active routes count
      const { count: activeRoutes } = await supabase
        .from("transport_routes")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get total trips count
      const { count: totalTrips } = await supabase
        .from("transport_trips")
        .select("*", { count: "exact", head: true });

      // Get scheduled trips count
      const { count: scheduledTrips } = await supabase
        .from("transport_trips")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled");

      // Get total bookings for transport
      const { count: totalBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .not("transport_id", "is", null);

      res.json({
        totalRoutes: totalRoutes || 0,
        activeRoutes: activeRoutes || 0,
        totalTrips: totalTrips || 0,
        scheduledTrips: scheduledTrips || 0,
        totalBookings: totalBookings || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Lỗi khi lấy thống kê" });
    }
  }
);

// Get all transport routes for admin
router.get(
  "/admin/routes",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { search, type, status, page = 1, limit = 1000 } = req.query;

      const supabase = db.getClient();

      let query = supabase
        .from("transport_routes")
        .select("*", { count: "exact" });

      if (search) {
        query = query.or(
          `from_location.ilike.%${search}%,to_location.ilike.%${search}%,company.ilike.%${search}%`
        );
      }
      if (type && type !== "all") {
        query = query.eq("type", type);
      }
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      query = query.order("created_at", { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      res.json({
        routes: data || [],
        total: count || 0,
      });
    } catch (error) {
      console.error("Error fetching admin routes:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách tuyến xe" });
    }
  }
);

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
      slug: generateTransportSlug(
        trip.transport_routes?.from_location,
        trip.transport_routes?.to_location,
        trip.id
      ),
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

// Get vehicle names
router.get("/vehicle-names", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("transport_routes")
      .select("vehicle_name")
      .eq("status", "active");

    if (error) throw error;

    const vehicleNames = [
      ...new Set((data || []).map((r) => r.vehicle_name).filter(Boolean)),
    ];
    res.json({ vehicle_names: vehicleNames.sort() });
  } catch (error) {
    console.error("Error fetching vehicle names:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách phương tiện" });
  }
});

// Get companies
router.get("/companies", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("transport_routes")
      .select("company")
      .eq("status", "active");

    if (error) throw error;

    const companies = [
      ...new Set((data || []).map((r) => r.company).filter(Boolean)),
    ];
    res.json({ companies: companies.sort() });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách nhà xe" });
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
      .from("transport_routes")
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

// Get available dates for a route
router.get("/available-dates", async (req, res) => {
  try {
    const { from, to, type } = req.query;
    const supabase = db.getClient();

    let query = supabase
      .from("transport_trips")
      .select(
        `
        trip_date,
        transport_routes!inner (from_location, to_location, type)
      `
      )
      .eq("status", "scheduled");

    // Filter data after fetching
    const { data, error } = await query;
    if (error) throw error;

    // Filter and extract unique dates
    let filteredData = data || [];
    if (from) {
      filteredData = filteredData.filter(
        (d) => d.transport_routes?.from_location === from
      );
    }
    if (to) {
      filteredData = filteredData.filter(
        (d) => d.transport_routes?.to_location === to
      );
    }
    if (type) {
      filteredData = filteredData.filter(
        (d) => d.transport_routes?.type === type
      );
    }

    const dates = [
      ...new Set(filteredData.map((t) => t.trip_date).filter(Boolean)),
    ].sort();
    res.json({ dates });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ error: "Lỗi khi lấy ngày có sẵn" });
  }
});

// Get available times for a specific date and route
router.get("/available-times", async (req, res) => {
  try {
    const { from, to, date, type } = req.query;
    const supabase = db.getClient();

    let query = supabase
      .from("transport_trips")
      .select(
        `
        departure_datetime,
        transport_routes!inner (from_location, to_location, type)
      `
      )
      .eq("status", "scheduled");

    if (date) {
      query = query.eq("trip_date", date);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter and extract times
    let filteredData = data || [];
    if (from) {
      filteredData = filteredData.filter(
        (d) => d.transport_routes?.from_location === from
      );
    }
    if (to) {
      filteredData = filteredData.filter(
        (d) => d.transport_routes?.to_location === to
      );
    }
    if (type) {
      filteredData = filteredData.filter(
        (d) => d.transport_routes?.type === type
      );
    }

    const times = filteredData
      .map((t) => {
        const dt = new Date(t.departure_datetime);
        return dt.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      })
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    res.json({ times });
  } catch (error) {
    console.error("Error fetching available times:", error);
    res.status(500).json({ error: "Lỗi khi lấy giờ có sẵn" });
  }
});

// Get destinations from a specific origin
router.get("/destinations/from", async (req, res) => {
  try {
    const { origin, type } = req.query;
    const supabase = db.getClient();

    let query = supabase
      .from("transport_routes")
      .select("to_location")
      .eq("status", "active");

    if (origin) {
      query = query.eq("from_location", origin);
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
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
router.get("/origins/to", async (req, res) => {
  try {
    const { destination, type } = req.query;
    const supabase = db.getClient();

    let query = supabase
      .from("transport_routes")
      .select("from_location")
      .eq("status", "active");

    if (destination) {
      query = query.eq("to_location", destination);
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
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

// Get all transport trips
router.get("/", async (req, res) => {
  try {
    const {
      type,
      origin,
      destination,
      from_location,
      to_location,
      vehicle_name,
      company,
      trip_type,
      min_price,
      max_price,
      date,
      time,
      sort_by,
      page = 1,
      limit = 10,
    } = req.query;
    const supabase = db.getClient();
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    // Fetch all scheduled trips with routes
    let query = supabase
      .from("transport_trips")
      .select(
        `
        *,
        transport_routes!inner (
          id, route_name, type, vehicle_name, company,
          from_location, to_location, price, duration,
          image, amenities, trip_type
        )
      `,
        { count: "exact" }
      )
      .eq("status", "scheduled");

    // Apply date filter directly in query
    if (date) {
      query = query.eq("trip_date", date);
    }

    const { data: allTrips, error: fetchError } = await query.order(
      "departure_datetime",
      { ascending: true }
    );

    if (fetchError) throw fetchError;

    // Get all transport trip IDs to fetch booking counts
    const tripIds = (allTrips || []).map((t) => t.id);

    // Fetch booking counts for all trips in one query
    let bookingCounts = {};
    if (tripIds.length > 0) {
      const { data: bookings, error: bookingError } = await supabase
        .from("bookings")
        .select("transport_id, guest_count")
        .in("transport_id", tripIds)
        .in("status", ["pending", "confirmed", "completed"]);

      if (!bookingError && bookings) {
        bookings.forEach((b) => {
          if (!bookingCounts[b.transport_id]) {
            bookingCounts[b.transport_id] = 0;
          }
          bookingCounts[b.transport_id] += b.guest_count || 1;
        });
      }
    }

    // Apply filters in JavaScript (for nested fields)
    let filteredTrips = allTrips || [];

    // Filter by type
    if (type && type !== "all") {
      filteredTrips = filteredTrips.filter(
        (t) => t.transport_routes?.type === type
      );
    }

    // Filter by origin/from_location
    const fromFilter = origin || from_location;
    if (fromFilter) {
      filteredTrips = filteredTrips.filter((t) =>
        t.transport_routes?.from_location
          ?.toLowerCase()
          .includes(fromFilter.toLowerCase())
      );
    }

    // Filter by destination/to_location
    const toFilter = destination || to_location;
    if (toFilter) {
      filteredTrips = filteredTrips.filter((t) =>
        t.transport_routes?.to_location
          ?.toLowerCase()
          .includes(toFilter.toLowerCase())
      );
    }

    // Filter by vehicle_name
    if (vehicle_name && vehicle_name !== "all") {
      filteredTrips = filteredTrips.filter(
        (t) => t.transport_routes?.vehicle_name === vehicle_name
      );
    }

    // Filter by company
    if (company && company !== "all") {
      filteredTrips = filteredTrips.filter(
        (t) => t.transport_routes?.company === company
      );
    }

    // Filter by trip_type
    if (trip_type && trip_type !== "all") {
      filteredTrips = filteredTrips.filter(
        (t) => t.transport_routes?.trip_type === trip_type
      );
    }

    // Filter by price range
    if (min_price) {
      const minP = parseFloat(min_price);
      filteredTrips = filteredTrips.filter((t) => {
        const price = t.price_override || t.transport_routes?.price || 0;
        return price >= minP;
      });
    }
    if (max_price) {
      const maxP = parseFloat(max_price);
      filteredTrips = filteredTrips.filter((t) => {
        const price = t.price_override || t.transport_routes?.price || 0;
        return price <= maxP;
      });
    }

    // Filter by time (departure hour)
    if (time) {
      filteredTrips = filteredTrips.filter((t) => {
        if (!t.departure_datetime) return false;
        const depTime = new Date(t.departure_datetime).toLocaleTimeString(
          "vi-VN",
          { hour: "2-digit", minute: "2-digit", hour12: false }
        );
        return depTime === time;
      });
    }

    // Sort
    if (sort_by) {
      switch (sort_by) {
        case "price_asc":
          filteredTrips.sort(
            (a, b) =>
              (a.price_override || a.transport_routes?.price || 0) -
              (b.price_override || b.transport_routes?.price || 0)
          );
          break;
        case "price_desc":
          filteredTrips.sort(
            (a, b) =>
              (b.price_override || b.transport_routes?.price || 0) -
              (a.price_override || a.transport_routes?.price || 0)
          );
          break;
        case "departure_time_asc":
          filteredTrips.sort(
            (a, b) =>
              new Date(a.departure_datetime) - new Date(b.departure_datetime)
          );
          break;
        case "departure_time_desc":
          filteredTrips.sort(
            (a, b) =>
              new Date(b.departure_datetime) - new Date(a.departure_datetime)
          );
          break;
        case "duration_asc":
          filteredTrips.sort(
            (a, b) =>
              (a.transport_routes?.duration || 0) -
              (b.transport_routes?.duration || 0)
          );
          break;
        case "duration_desc":
          filteredTrips.sort(
            (a, b) =>
              (b.transport_routes?.duration || 0) -
              (a.transport_routes?.duration || 0)
          );
          break;
      }
    }

    // Apply pagination
    const total = filteredTrips.length;
    const total_pages = Math.ceil(total / parsedLimit);
    const paginatedTrips = filteredTrips.slice(offset, offset + parsedLimit);

    // Flatten nested transport_routes data for frontend compatibility
    // AND calculate dynamic available_seats
    const flattenedTransports = paginatedTrips.map((trip) => {
      const bookedCount = bookingCounts[trip.id] || 0;
      const dynamicAvailableSeats = Math.max(0, trip.total_seats - bookedCount);

      return {
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
        available_seats: dynamicAvailableSeats, // Dynamic calculation
        booked_seats: bookedCount,
        trip_status: trip.status,
        // Flattened route fields
        route_id: trip.route_id,
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
        slug: generateTransportSlug(
          trip.transport_routes?.from_location,
          trip.transport_routes?.to_location,
          trip.id
        ),
      };
    });

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

// Get transport by ID or Slug
router.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let id = idOrSlug;

    // Nếu là slug, parse ID từ slug
    if (!isNumericId(idOrSlug)) {
      const parts = idOrSlug.split("-");
      id = parts[parts.length - 1];
    }

    if (!isNumericId(id)) {
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

    // Fetch bookings to calculate dynamic available_seats
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("guest_count")
      .eq("transport_id", id)
      .in("status", ["pending", "confirmed", "completed"]);

    let bookedCount = 0;
    if (!bookingError && bookings) {
      bookedCount = bookings.reduce((sum, b) => sum + (b.guest_count || 1), 0);
    }
    const dynamicAvailableSeats = Math.max(0, data.total_seats - bookedCount);

    // Fetch reviews for rating statistics
    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("transport_id", id)
      .eq("status", "active");

    let avgRating = 0;
    let reviewCount = 0;
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (!reviewError && reviews && reviews.length > 0) {
      reviewCount = reviews.length;
      let totalRating = 0;
      reviews.forEach((r) => {
        totalRating += r.rating || 0;
        const roundedRating = Math.round(r.rating || 0);
        if (ratingBreakdown[roundedRating] !== undefined) {
          ratingBreakdown[roundedRating]++;
        }
      });
      avgRating = totalRating / reviewCount;
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
      available_seats: dynamicAvailableSeats, // Dynamic calculation
      booked_seats: bookedCount,
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
      // Rating statistics
      rating: avgRating,
      rating_count: reviewCount,
      rating_breakdown: ratingBreakdown,
      slug: generateTransportSlug(
        data.transport_routes?.from_location,
        data.transport_routes?.to_location,
        data.id
      ),
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

// ========================================
// REVIEW & RATING ROUTES FOR TRANSPORT
// ========================================

// Get reviews for a transport trip
router.get("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        user:users (
          id, 
          username, 
          role_id,
          userprofiles (full_name, avatar)
        )
      `
      )
      .eq("transport_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Flatten user profile data for frontend
    const formattedReviews = (reviews || []).map((review) => {
      const userProfile = Array.isArray(review.user?.userprofiles)
        ? review.user.userprofiles[0]
        : review.user?.userprofiles;
      return {
        ...review,
        user: {
          ...review.user,
          full_name: userProfile?.full_name || review.user?.username,
          avatar: userProfile?.avatar,
        },
      };
    });

    res.json({ reviews: formattedReviews });
  } catch (error) {
    console.error("Error fetching transport reviews:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách đánh giá" });
  }
});

// Get user's rating for a transport trip
router.get("/:id/rating", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id } = req.query;

    if (isNaN(id) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("transport_id", id)
      .eq("user_id", user_id)
      .eq("status", "active")
      .is("parent_id", null)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;

    res.json({ rating: data?.rating || 0 });
  } catch (error) {
    console.error("Error fetching user rating:", error);
    res.status(500).json({ error: "Lỗi khi lấy đánh giá của người dùng" });
  }
});

// Post/Update rating for transport
router.post("/:id/rating", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id, rating } = req.body;

    if (isNaN(id) || !user_id || !rating) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // Check if user already rated
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("transport_id", id)
      .eq("user_id", user_id)
      .is("parent_id", null)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    if (existingReview) {
      // Update existing rating
      const { data, error } = await supabase
        .from("reviews")
        .update({ rating, updated_at: new Date().toISOString() })
        .eq("id", existingReview.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          transport_id: id,
          user_id,
          rating,
          comment: "",
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, rating: result.rating });
  } catch (error) {
    console.error("Error submitting transport rating:", error);
    res.status(500).json({ error: "Lỗi khi gửi đánh giá" });
  }
});

// Post a review (comment) for transport
router.post("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id, comment, rating, parent_id } = req.body;

    if (isNaN(id) || !user_id || !comment) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // If it's a reply
    if (parent_id) {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          transport_id: id,
          user_id,
          comment,
          parent_id,
          rating: 0,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return res.json({
        review_id: data.id,
        message: "Đăng bình luận thành công",
      });
    }

    // Check if main review exists
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("transport_id", id)
      .eq("user_id", user_id)
      .is("parent_id", null)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    if (existingReview) {
      // Update existing review
      const updateData = { comment, updated_at: new Date().toISOString() };
      if (rating) updateData.rating = rating;

      const { data, error } = await supabase
        .from("reviews")
        .update(updateData)
        .eq("id", existingReview.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new review
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          transport_id: id,
          user_id,
          comment,
          rating: rating || 5,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ review_id: result.id, message: "Đăng đánh giá thành công" });
  } catch (error) {
    console.error("Error posting transport review:", error);
    res.status(500).json({ error: "Lỗi khi đăng đánh giá" });
  }
});

// Get liked reviews by user for transport
router.get("/:id/reviews/liked", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { user_id } = req.query;

    if (isNaN(id) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // Get all review IDs for this transport
    const { data: transportReviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("transport_id", id);

    if (!transportReviews || transportReviews.length === 0) {
      return res.json({ liked_reviews: [] });
    }

    const reviewIds = transportReviews.map((r) => r.id);

    // Get likes for these reviews by this user
    const { data: likes, error } = await supabase
      .from("reviewlikes")
      .select("review_id")
      .in("review_id", reviewIds)
      .eq("user_id", user_id);

    if (error) throw error;

    const likedReviewIds = (likes || []).map((l) => l.review_id);
    res.json({ liked_reviews: likedReviewIds });
  } catch (error) {
    console.error("Error fetching liked transport reviews:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách yêu thích" });
  }
});

// Like/Unlike a transport review
router.post("/:id/reviews/:reviewId/like", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { user_id } = req.body;

    if (isNaN(reviewId) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    // Check if like exists
    const { data: existingLike, error: checkError } = await supabase
      .from("reviewlikes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (checkError) throw checkError;

    let liked = false;

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("reviewlikes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) throw deleteError;

      // Decrement count
      const { data: currentReview } = await supabase
        .from("reviews")
        .select("likes_count")
        .eq("id", reviewId)
        .single();
      if (currentReview) {
        await supabase
          .from("reviews")
          .update({
            likes_count: Math.max(0, (currentReview.likes_count || 0) - 1),
          })
          .eq("id", reviewId);
      }

      liked = false;
    } else {
      // Like
      const { error: insertError } = await supabase
        .from("reviewlikes")
        .insert({ review_id: reviewId, user_id });

      if (insertError) throw insertError;

      // Increment count
      const { data: currentReview } = await supabase
        .from("reviews")
        .select("likes_count")
        .eq("id", reviewId)
        .single();
      if (currentReview) {
        await supabase
          .from("reviews")
          .update({ likes_count: (currentReview.likes_count || 0) + 1 })
          .eq("id", reviewId);
      }

      liked = true;
    }

    res.json({ success: true, liked });
  } catch (error) {
    console.error("Error toggling transport review like:", error);
    res.status(500).json({ error: "Lỗi khi thực hiện thao tác" });
  }
});

// Edit a transport review
router.put("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { user_id, comment } = req.body;

    if (isNaN(reviewId) || !user_id || !comment) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("reviews")
      .update({ comment, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .eq("user_id", user_id);

    if (error) throw error;

    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Error updating transport review:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bình luận" });
  }
});

// Delete a transport review
router.delete("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { user_id } = req.body;

    if (isNaN(reviewId) || !user_id) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user_id);

    if (error) throw error;

    res.json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    console.error("Error deleting transport review:", error);
    res.status(500).json({ error: "Lỗi khi xóa bình luận" });
  }
});

module.exports = router;
