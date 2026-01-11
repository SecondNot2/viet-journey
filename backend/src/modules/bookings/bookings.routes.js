/**
 * Bookings Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");
const {
  authenticateToken,
  requireRole,
} = require("../../shared/middleware/auth.middleware");

// ========================================
// ADMIN ROUTES (must be before public routes)
// ========================================

// Get admin stats for bookings
router.get(
  "/admin/stats",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const supabase = db.getClient();

      // Get total bookings count
      const { count: totalBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

      // Get pending bookings count
      const { count: pendingBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get confirmed bookings count
      const { count: confirmedBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed");

      // Get total revenue (only from confirmed/completed bookings)
      const { data: revenueData } = await supabase
        .from("bookings")
        .select("total_price")
        .in("status", ["confirmed", "completed"]);

      const totalRevenue = (revenueData || []).reduce(
        (sum, b) => sum + (parseFloat(b.total_price) || 0),
        0
      );

      res.json({
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Lỗi khi lấy thống kê" });
    }
  }
);

// Get analytics data for charts
router.get(
  "/admin/analytics",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const supabase = db.getClient();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      const startDateStr = startDate.toISOString().split("T")[0];

      // Get revenue by service type
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("service_type, total_price, status")
        .in("status", ["confirmed", "completed"]);

      const revenueByService = {};
      (allBookings || []).forEach((b) => {
        const type = b.service_type || "unknown";
        if (!revenueByService[type]) {
          revenueByService[type] = { revenue: 0, count: 0 };
        }
        revenueByService[type].revenue += parseFloat(b.total_price) || 0;
        revenueByService[type].count += 1;
      });

      // Get bookings by status
      const { data: statusData } = await supabase
        .from("bookings")
        .select("status");

      const bookingsByStatus = {};
      (statusData || []).forEach((b) => {
        const status = b.status || "unknown";
        bookingsByStatus[status] = (bookingsByStatus[status] || 0) + 1;
      });

      // Get revenue trend (last N days)
      const { data: trendData } = await supabase
        .from("bookings")
        .select("created_at, total_price, status")
        .gte("created_at", startDateStr)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: true });

      const revenueTrend = {};
      (trendData || []).forEach((b) => {
        const date = b.created_at.split("T")[0];
        if (!revenueTrend[date]) {
          revenueTrend[date] = { revenue: 0, bookings: 0 };
        }
        revenueTrend[date].revenue += parseFloat(b.total_price) || 0;
        revenueTrend[date].bookings += 1;
      });

      res.json({
        revenueByService: Object.entries(revenueByService).map(
          ([type, data]) => ({
            service_type: type,
            revenue: data.revenue,
            count: data.count,
          })
        ),
        bookingsByStatus: Object.entries(bookingsByStatus).map(
          ([status, count]) => ({
            status,
            count,
          })
        ),
        revenueTrend: Object.entries(revenueTrend).map(([date, data]) => ({
          date,
          revenue: data.revenue,
          bookings: data.bookings,
        })),
        topServices: [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Lỗi khi lấy phân tích" });
    }
  }
);

// Get detailed analytics
router.get(
  "/admin/analytics/detailed",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const supabase = db.getClient();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      const startDateStr = startDate.toISOString().split("T")[0];

      // Get all bookings in the period
      const { data: bookings } = await supabase
        .from("bookings")
        .select("service_type, total_price, status, created_at")
        .gte("created_at", startDateStr);

      // Calculate summary
      const totalBookings = (bookings || []).length;
      const confirmedBookings = (bookings || []).filter((b) =>
        ["confirmed", "completed"].includes(b.status)
      ).length;
      const cancelledBookings = (bookings || []).filter(
        (b) => b.status === "cancelled"
      ).length;
      const pendingBookings = (bookings || []).filter(
        (b) => b.status === "pending"
      ).length;

      const totalRevenue = (bookings || [])
        .filter((b) => ["confirmed", "completed"].includes(b.status))
        .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

      const conversionRate =
        totalBookings > 0
          ? ((confirmedBookings / totalBookings) * 100).toFixed(1)
          : 0;
      const cancellationRate =
        totalBookings > 0
          ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
          : 0;

      // Service Details breakdown
      const byService = {};
      (bookings || []).forEach((b) => {
        const type = b.service_type || "unknown";
        if (!byService[type]) {
          byService[type] = {
            service_type: type,
            total_bookings: 0,
            confirmed_bookings: 0,
            completed_bookings: 0,
            cancelled_bookings: 0,
            pending_bookings: 0,
            paid_revenue: 0,
            pending_revenue: 0,
            lost_revenue: 0,
            prices: [],
          };
        }
        byService[type].total_bookings += 1;
        const price = parseFloat(b.total_price) || 0;
        byService[type].prices.push(price);

        if (b.status === "confirmed") {
          byService[type].confirmed_bookings += 1;
          byService[type].paid_revenue += price;
        } else if (b.status === "completed") {
          byService[type].completed_bookings += 1;
          byService[type].paid_revenue += price;
        } else if (b.status === "cancelled") {
          byService[type].cancelled_bookings += 1;
          byService[type].lost_revenue += price;
        } else if (b.status === "pending") {
          byService[type].pending_bookings += 1;
          byService[type].pending_revenue += price;
        }
      });

      const serviceDetails = Object.values(byService).map((service) => ({
        ...service,
        avg_paid_order:
          service.paid_revenue /
            (service.confirmed_bookings + service.completed_bookings) || 0,
        min_order: service.prices.length > 0 ? Math.min(...service.prices) : 0,
        max_order: service.prices.length > 0 ? Math.max(...service.prices) : 0,
        prices: undefined, // Remove prices array from response
      }));

      // Hourly distribution
      const hourlyDist = {};
      for (let i = 0; i < 24; i++) hourlyDist[i] = { bookings: 0, revenue: 0 };
      (bookings || []).forEach((b) => {
        const hour = new Date(b.created_at).getHours();
        hourlyDist[hour].bookings += 1;
        if (["confirmed", "completed"].includes(b.status)) {
          hourlyDist[hour].revenue += parseFloat(b.total_price) || 0;
        }
      });

      const hourlyDistribution = Object.entries(hourlyDist).map(
        ([hour, data]) => ({
          hour: parseInt(hour),
          ...data,
        })
      );

      // Daily breakdown
      const dailyData = {};
      (bookings || []).forEach((b) => {
        const date = b.created_at.split("T")[0];
        const type = b.service_type || "unknown";
        const key = `${date}-${type}`;

        if (!dailyData[key]) {
          dailyData[key] = {
            date,
            service_type: type,
            total_bookings: 0,
            confirmed_bookings: 0,
            completed_bookings: 0,
            cancelled_bookings: 0,
            pending_bookings: 0,
            total_revenue: 0,
            pending_revenue: 0,
            avg_order: 0,
          };
        }

        dailyData[key].total_bookings += 1;
        const price = parseFloat(b.total_price) || 0;

        if (b.status === "confirmed") {
          dailyData[key].confirmed_bookings += 1;
          dailyData[key].total_revenue += price;
        } else if (b.status === "completed") {
          dailyData[key].completed_bookings += 1;
          dailyData[key].total_revenue += price;
        } else if (b.status === "cancelled") {
          dailyData[key].cancelled_bookings += 1;
        } else if (b.status === "pending") {
          dailyData[key].pending_bookings += 1;
          dailyData[key].pending_revenue += price;
        }
      });

      const dailyBreakdown = Object.values(dailyData)
        .map((d) => ({
          ...d,
          avg_order:
            d.total_bookings > 0 ? d.total_revenue / d.total_bookings : 0,
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      // Top performers (simplified - just get counts by service)
      // For a real implementation, you would join with tours/hotels/flights tables
      res.json({
        summary: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          pendingBookings,
          totalRevenue,
          conversionRate: parseFloat(conversionRate),
          cancellationRate: parseFloat(cancellationRate),
          avgOrderValue:
            totalBookings > 0 ? totalRevenue / confirmedBookings : 0,
        },
        serviceDetails,
        topPerformers: {
          tours: [],
          hotels: [],
          flights: [],
          transports: [],
        },
        hourlyDistribution,
        dailyBreakdown,
        period: { days: parseInt(days), startDate: startDateStr },
      });
    } catch (error) {
      console.error("Error fetching detailed analytics:", error);
      res.status(500).json({ error: "Lỗi khi lấy phân tích chi tiết" });
    }
  }
);

// Get comparison analytics
router.get(
  "/admin/analytics/comparison",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const daysNum = parseInt(days);
      const supabase = db.getClient();

      // Current period
      const currentEnd = new Date();
      const currentStart = new Date();
      currentStart.setDate(currentStart.getDate() - daysNum);

      // Previous period
      const previousEnd = new Date(currentStart);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - daysNum);

      // Get current period data
      const { data: currentData } = await supabase
        .from("bookings")
        .select("total_price, status")
        .gte("created_at", currentStart.toISOString())
        .lt("created_at", currentEnd.toISOString())
        .in("status", ["confirmed", "completed"]);

      // Get previous period data
      const { data: previousData } = await supabase
        .from("bookings")
        .select("total_price, status")
        .gte("created_at", previousStart.toISOString())
        .lt("created_at", previousEnd.toISOString())
        .in("status", ["confirmed", "completed"]);

      const currentRevenue = (currentData || []).reduce(
        (sum, b) => sum + (parseFloat(b.total_price) || 0),
        0
      );
      const previousRevenue = (previousData || []).reduce(
        (sum, b) => sum + (parseFloat(b.total_price) || 0),
        0
      );

      const revenueChange =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : currentRevenue > 0
          ? 100
          : 0;

      const bookingsChange =
        (previousData || []).length > 0
          ? (((currentData || []).length - (previousData || []).length) /
              (previousData || []).length) *
            100
          : (currentData || []).length > 0
          ? 100
          : 0;

      // Calculate average order values
      const currentAvgOrderValue =
        (currentData || []).length > 0
          ? currentRevenue / (currentData || []).length
          : 0;
      const previousAvgOrderValue =
        (previousData || []).length > 0
          ? previousRevenue / (previousData || []).length
          : 0;
      const avgOrderValueChange =
        previousAvgOrderValue > 0
          ? ((currentAvgOrderValue - previousAvgOrderValue) /
              previousAvgOrderValue) *
            100
          : currentAvgOrderValue > 0
          ? 100
          : 0;

      res.json({
        current: {
          revenue: currentRevenue,
          bookings: (currentData || []).length,
          avgOrderValue: currentAvgOrderValue,
        },
        previous: {
          revenue: previousRevenue,
          bookings: (previousData || []).length,
          avgOrderValue: previousAvgOrderValue,
        },
        growth: {
          revenue: revenueChange.toFixed(2),
          bookings: bookingsChange.toFixed(2),
          avgOrderValue: avgOrderValueChange.toFixed(2),
        },
      });
    } catch (error) {
      console.error("Error fetching comparison:", error);
      res.status(500).json({ error: "Lỗi khi lấy so sánh" });
    }
  }
);

// Get all bookings for admin
router.get(
  "/admin/bookings",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        type,
        status,
        page = 1,
        limit = 10,
        sort_by = "created_desc",
      } = req.query;

      const supabase = db.getClient();
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = supabase.from("bookings").select(
        `
        *,
        users (username, email),
        tours (title, image, location),
        hotels (name, images, location),
        flight_schedules (
          schedule_code,
          flight_routes (airline, from_location, to_location)
        ),
        transport_trips (
          trip_code,
          transport_routes (company, from_location, to_location)
        )
      `,
        { count: "exact" }
      );

      // Apply filters
      if (type && type !== "all") {
        query = query.eq("service_type", type);
      }
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      // Apply sorting
      if (sort_by === "created_asc") {
        query = query.order("created_at", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, count, error } = await query.range(
        offset,
        offset + parseInt(limit) - 1
      );

      if (error) throw error;

      // Format response
      const formattedBookings = (data || []).map((booking) => ({
        ...booking,
        user_name: booking.users?.username,
        user_email: booking.users?.email,
        tour_title: booking.tours?.title,
        hotel_name: booking.hotels?.name,
        flight_airline: booking.flight_schedules?.flight_routes?.airline,
        transport_company: booking.transport_trips?.transport_routes?.company,
      }));

      res.json({
        bookings: formattedBookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách đặt chỗ" });
    }
  }
);

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get stats
router.get("/stats", async (req, res) => {
  try {
    const supabase = db.getClient();

    const { count: total } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    const { count: pending } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: confirmed } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");

    res.json({
      total: total || 0,
      pending: pending || 0,
      confirmed: confirmed || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Lỗi khi lấy thống kê" });
  }
});

// Get user bookings
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "User ID không hợp lệ" });
    }

    const supabase = db.getClient();
    let query = supabase
      .from("bookings")
      .select(
        `
        *,
        tours (
          title, location, duration, image, price,
          guides (id, name, phone, email, avatar)
        ),
        hotels (
          name, location, images,
          hotelrooms (id, name, price, capacity, amenities)
        ),
        flight_schedules (
          schedule_code, flight_date, departure_datetime, arrival_datetime, seat_classes,
          flight_routes (airline, flight_number, from_location, to_location, duration, aircraft, airline_image)
        ),
        transport_trips (
          trip_code, trip_date, departure_datetime, arrival_datetime, total_seats, available_seats,
          transport_routes (company, type, vehicle_name, from_location, to_location, duration, image, seats, amenities)
        )
      `
      )
      .eq("user_id", userId);

    const { status } = req.query;
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Lỗi khi lấy đặt chỗ của người dùng" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all bookings
router.get("/", async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from("bookings").select(
      `
        *,
        users (username, email),
        tours (title),
        hotels (name),
        flight_schedules (schedule_code)
      `,
      { count: "exact" }
    );

    if (status) query = query.eq("status", status);
    if (type && type !== "all") query = query.eq("service_type", type);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ bookings: data || [], total: count || 0 });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách đặt chỗ" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get booking by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        users (username, email),
        bookingpassengers (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Đặt chỗ không tồn tại" });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin đặt chỗ" });
  }
});

// Create booking
router.post("/", async (req, res) => {
  try {
    console.log(
      "[DEBUG] Create booking request body:",
      JSON.stringify(req.body, null, 2)
    );

    const supabase = db.getClient();

    // Chỉ lấy các field hợp lệ theo schema
    const validFields = {
      user_id: req.body.user_id,
      hotel_id: req.body.hotel_id,
      tour_id: req.body.tour_id,
      flight_id: req.body.flight_id,
      transport_id: req.body.transport_id,
      booking_date: req.body.booking_date,
      status: req.body.status || "pending",
      payment_status: req.body.payment_status || "pending",
      service_type: req.body.service_type,
      total_price: req.body.total_price,
      contact_email: req.body.contact_email,
      contact_phone: req.body.contact_phone,
      notes: req.body.notes,
      seat_class: req.body.seat_class,
      passenger_count: req.body.passenger_count,
      check_in: req.body.check_in,
      check_out: req.body.check_out,
      room_count: req.body.room_count,
      guest_count: req.body.guest_count,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Loại bỏ các field undefined
    Object.keys(validFields).forEach((key) => {
      if (validFields[key] === undefined) delete validFields[key];
    });

    console.log(
      "[DEBUG] Cleaned booking data:",
      JSON.stringify(validFields, null, 2)
    );

    const { data, error } = await supabase
      .from("bookings")
      .insert(validFields)
      .select()
      .single();

    if (error) {
      console.error("[DEBUG] Supabase error:", error);
      throw error;
    }

    console.log("[DEBUG] Booking created successfully:", data.id);
    res.status(201).json({
      booking_id: data.id,
      id: data.id,
      message: "Đặt chỗ thành công",
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: error.message || "Lỗi khi tạo đặt chỗ" });
  }
});

// Update booking status
router.put("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const { status } = req.body;
    const supabase = db.getClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật đặt chỗ" });
  }
});

// Cancel booking
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Hủy đặt chỗ thành công" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Lỗi khi hủy đặt chỗ" });
  }
});

module.exports = router;
