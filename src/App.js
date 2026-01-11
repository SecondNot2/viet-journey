import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext";

// Layouts
import MainLayout from "./components/MainLayout";
import AdminLayout from "./components/Admin/Layout";

// Core components
import ScrollToTop from "./components/ScrollToTop";
import Home from "./components/Home";
import NotFound from "./components/NotFound";

// Destination components
import Destinations from "./components/Destinations";
import DestinationDetail from "./components/Destinations/DestinationDetail";

// Tour components
import Tours from "./components/Services/Tours";
import TourDetail from "./components/Services/Tours/TourDetail";
import TourBooking from "./components/Services/Tours/TourBooking";
import TourBookingSuccess from "./components/Services/Tours/TourBookingSuccess";

// Flight components
import FlightSearch from "./components/Services/Flights";
import FlightDetailPage from "./components/Services/Flights/FlightDetailPage";
import FlightBookingPage from "./components/Services/Flights/FlightBookingPage";
import FlightBookingSuccess from "./components/Services/Flights/FlightBookingSuccess";

// Hotel components
import HotelSearch from "./components/Services/Hotels";
import HotelDetailPage from "./components/Services/Hotels/HotelDetailPage";
import HotelBooking from "./components/Services/Hotels/HotelBooking";
import HotelBookingSuccess from "./components/Services/Hotels/HotelBookingSuccess";
import HotelBookingFailed from "./components/Services/Hotels/HotelBookingFailed";

// Transport components
import TransportSearch from "./components/Services/Transport";
import TransportDetailPage from "./components/Services/Transport/TransportDetailPage";
import TransportBooking from "./components/Services/Transport/TransportBooking";
import TransportBookingSuccess from "./components/Services/Transport/TransportBookingSuccess";

// Service components
import Promotions from "./components/Services/Promotions";
import PromotionServices from "./components/Services/PromotionServices";

// Blog components
import BlogList from "./components/Blog/BlogList";
import BlogCategory from "./components/Blog/BlogCategory";
import BlogPost from "./components/Blog/BlogPost";

// User components
import About from "./components/About";
import Wishlist from "./components/Wishlist";

// Auth components
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

// Admin components
import Dashboard from "./components/Admin/Dashboard";
import ToursManagement from "./components/Admin/Tours";
import TourForm from "./components/Admin/Tours/TourForm";
import DestinationManagement from "./components/Admin/Destinations";
import DestinationForm from "./components/Admin/Destinations/DestinationForm";
import BookingManagement from "./components/Admin/Bookings/Index";
import HotelManagement from "./components/Admin/Hotels";
import FlightManagement from "./components/Admin/Flights";
import TransportManagement from "./components/Admin/Transport";
import UserManagement from "./components/Admin/Users";
import PostsManagement from "./components/Admin/Posts";
import PromotionsManagement from "./components/Admin/Promotions";
import ReviewsManagement from "./components/Admin/Reviews";

// User Profile components
import Profile from "./components/User/Profile";
import BookingHistory from "./components/User/BookingHistory";
import Reviews from "./components/User/Reviews";

// Admin Profile component
import AdminProfile from "./components/Admin/Profile";

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="destinations">
            <Route index element={<DestinationManagement />} />
            <Route path="create" element={<DestinationForm />} />
            <Route path=":id/edit" element={<DestinationForm />} />
          </Route>
          <Route path="tours">
            <Route index element={<ToursManagement />} />
            <Route path="create" element={<TourForm />} />
            <Route path=":id/edit" element={<TourForm />} />
          </Route>
          <Route path="bookings">
            <Route index element={<BookingManagement />} />
          </Route>
          <Route path="hotels">
            <Route index element={<HotelManagement />} />
          </Route>
          <Route path="flights">
            <Route index element={<FlightManagement />} />
          </Route>
          <Route path="transport">
            <Route index element={<TransportManagement />} />
          </Route>
          <Route path="users">
            <Route index element={<UserManagement />} />
          </Route>
          <Route path="posts">
            <Route index element={<PostsManagement />} />
          </Route>
          <Route path="promotions">
            <Route index element={<PromotionsManagement />} />
          </Route>
          <Route path="reviews">
            <Route index element={<ReviewsManagement />} />
          </Route>
        </Route>

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />

          {/* Destinations Routes */}
          <Route path="destinations">
            <Route index element={<Destinations />} />
            <Route path=":id" element={<DestinationDetail />} />
          </Route>

          {/* Tours Routes */}
          <Route path="tours">
            <Route index element={<Tours />} />
            <Route path="type/:type" element={<Tours />} />
            <Route path="region/:region" element={<Tours />} />
            <Route path=":id" element={<TourDetail />} />
            <Route path=":id/booking" element={<TourBooking />} />
            <Route path="booking/success" element={<TourBookingSuccess />} />
          </Route>

          {/* Flight Routes */}
          <Route path="flights">
            <Route index element={<FlightSearch />} />
            <Route path=":id" element={<FlightDetailPage />} />
            <Route path=":id/booking" element={<FlightBookingPage />} />
            <Route path="booking/success" element={<FlightBookingSuccess />} />
          </Route>

          {/* Hotel Routes */}
          <Route path="hotels">
            <Route index element={<HotelSearch />} />
            <Route path=":id" element={<HotelDetailPage />} />
            <Route path=":id/booking" element={<HotelBooking />} />
            <Route path="booking/success" element={<HotelBookingSuccess />} />
            <Route path="booking/failed" element={<HotelBookingFailed />} />
          </Route>

          {/* Transport Routes */}
          <Route path="transport">
            <Route index element={<TransportSearch />} />
            <Route path=":id" element={<TransportDetailPage />} />
            <Route path=":id/booking" element={<TransportBooking />} />
            <Route
              path="booking/success"
              element={<TransportBookingSuccess />}
            />
          </Route>

          {/* Service Routes */}
          <Route path="promotions" element={<Promotions />} />
          <Route path="promotions-services" element={<PromotionServices />} />

          {/* Blog Routes */}
          <Route path="blog">
            <Route index element={<BlogList />} />
            <Route path=":category" element={<BlogCategory />} />
            <Route path="post/:id" element={<BlogPost />} />
          </Route>

          {/* Other Routes */}
          <Route path="about" element={<About />} />
          <Route path="wishlist" element={<Wishlist />} />

          {/* Auth Routes */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* User Profile Routes */}
          <Route path="profile">
            <Route index element={<Profile />} />
            <Route path="bookings" element={<BookingHistory />} />
            <Route path="reviews" element={<Reviews />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
