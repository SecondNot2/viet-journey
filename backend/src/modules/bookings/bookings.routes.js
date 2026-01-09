/**
 * Bookings Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");

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
