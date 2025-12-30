import React from "react";
import FeaturedDestinations from "../sections/FeaturedDestinations";
import FeaturedTours from "../sections/FeaturedTours";
import FeaturedFlights from "../sections/FeaturedFlights";
import FeaturedHotels from "../sections/FeaturedHotels";
import HotPromotions from "../sections/HotPromotions";
import LatestBlogs from "../sections/LatestBlogs";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <FeaturedDestinations />
      <FeaturedTours />
      <FeaturedFlights />
      <FeaturedHotels />
      <HotPromotions />
      <LatestBlogs />
    </div>
  );
};

export default Home;
