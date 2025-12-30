import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FlightBooking from "./FlightBooking";
import { Loader2 } from "lucide-react";

// Sample flight data - replace with actual API call
const sampleFlight = {
  airline: "Vietnam Airlines",
  airlineLogo: "/images/airlines/vietnam-airlines.png",
  flightNumber: "VN123",
  price: 2500000,
  seats: 45,
  departureTime: "07:30",
  from: "Hà Nội (HAN)",
  duration: "2h 10m",
  arrivalTime: "09:40",
  to: "Hồ Chí Minh (SGN)",
  aircraft: "Airbus A321",
  baggage: {
    cabin: "7 kg",
    checked: "23 kg",
  },
  amenities: ["meal", "wifi", "power", "entertainment"],
};

const FlightBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call
    const fetchFlight = async () => {
      try {
        // Replace this with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
        setFlight(sampleFlight);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải thông tin chuyến bay. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchFlight();
  }, [id]);

  const handleClose = () => {
    navigate(`/flights/${id}`);
  };

  const handleConfirm = (bookingData) => {
    // Combine booking data with flight info
    const bookingInfo = {
      ...bookingData,
      flightId: id,
      bookingDate: new Date().toISOString(),
      status: "confirmed",
      passengers: bookingData.passengers.map((passenger) => ({
        name: `${passenger.lastName} ${passenger.firstName}`,
        type:
          passenger.title === "mr"
            ? "Người lớn"
            : passenger.title === "ms"
            ? "Trẻ em"
            : "Người lớn",
      })),
    };

    // Navigate to success page with booking info and flight details
    navigate("/flights/booking/success", {
      state: {
        bookingInfo,
        flight: {
          ...flight,
          id,
          departureHour: flight.departureTime,
          price: flight.price,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-gray-600">Đang tải thông tin chuyến bay...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="text-red-600 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FlightBooking
      flight={flight}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );
};

export default FlightBookingPage;
