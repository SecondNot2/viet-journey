import React, { useRef } from "react";
import { Tab } from "@headlessui/react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  Users,
  Plus,
  Minus,
  Hotel,
  MapPin,
  Bus,
  Train,
  Car,
  Compass,
} from "lucide-react";

function Hero({
  selectedTab,
  setSelectedTab,
  showDatePicker,
  setShowDatePicker,
  dateRange,
  setDateRange,
  passengers,
  setPassengers,
}) {
  const [showPassengerSelector, setShowPassengerSelector] =
    React.useState(false);
  const [rooms, setRooms] = React.useState([
    { adults: 2, children: 0 }, // Mặc định 1 phòng với 2 người lớn
  ]);

  // Thêm refs cho các menu
  const datePickerRef = useRef(null);
  const passengerSelectorRef = useRef(null);
  const roomSelectorRef = useRef(null);

  // Hàm đóng tất cả các menu
  const closeAllMenus = () => {
    setShowDatePicker(false);
    setShowPassengerSelector(false);
  };

  const renderPassengerSelector = () => (
    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg p-4 z-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Người lớn</p>
            <p className="text-sm text-gray-500">Từ 12 tuổi</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPassengers((p) => ({
                  ...p,
                  adults: Math.max(1, p.adults - 1),
                }));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center">{passengers.adults}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPassengers((p) => ({ ...p, adults: p.adults + 1 }));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Trẻ em</p>
            <p className="text-sm text-gray-500">2-11 tuổi</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPassengers((p) => ({
                  ...p,
                  children: Math.max(0, p.children - 1),
                }));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center">{passengers.children}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPassengers((p) => ({ ...p, children: p.children + 1 }));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Em bé</p>
            <p className="text-sm text-gray-500">Dưới 2 tuổi</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPassengers((p) => ({
                  ...p,
                  infants: Math.max(0, p.infants - 1),
                }));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center">{passengers.infants}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPassengers((p) => ({ ...p, infants: p.infants + 1 }));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoomSelector = () => (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 z-50">
      <div className="space-y-6">
        {rooms.map((room, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-medium">Phòng {index + 1}</h3>
              {index > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRooms(rooms.filter((_, i) => i !== index));
                  }}
                  className="text-red-500 text-sm hover:text-red-600"
                >
                  Xóa phòng
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Người lớn</p>
                <p className="text-sm text-gray-500">Từ 12 tuổi</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRooms(
                      rooms.map((r, i) =>
                        i === index
                          ? { ...r, adults: Math.max(1, r.adults - 1) }
                          : r
                      )
                    );
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{room.adults}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRooms(
                      rooms.map((r, i) =>
                        i === index
                          ? { ...r, adults: Math.min(4, r.adults + 1) }
                          : r
                      )
                    );
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Trẻ em</p>
                <p className="text-sm text-gray-500">2-11 tuổi</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRooms(
                      rooms.map((r, i) =>
                        i === index
                          ? { ...r, children: Math.max(0, r.children - 1) }
                          : r
                      )
                    );
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{room.children}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRooms(
                      rooms.map((r, i) =>
                        i === index
                          ? { ...r, children: Math.min(3, r.children + 1) }
                          : r
                      )
                    );
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {rooms.length < 4 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRooms([...rooms, { adults: 1, children: 0 }]);
            }}
            className="w-full mt-4 py-2 px-4 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Thêm phòng
          </button>
        )}

        <div className="text-xs text-gray-500 mt-4">
          * Tối đa 4 người lớn hoặc 3 trẻ em mỗi phòng
        </div>
      </div>
    </div>
  );

  const renderFlightSearch = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Điểm đi
        </label>
        <input
          type="text"
          placeholder="Chọn điểm đi"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Điểm đến
        </label>
        <input
          type="text"
          placeholder="Chọn điểm đến"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày đi - Ngày về
        </label>
        <button
          ref={datePickerRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowPassengerSelector(false);
            setShowDatePicker(!showDatePicker);
          }}
          className="w-full p-3 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <span>
            {dateRange.from
              ? format(dateRange.from, "dd/MM/yyyy")
              : "Chọn ngày"}
            {dateRange.to ? ` - ${format(dateRange.to, "dd/MM/yyyy")}` : ""}
          </span>
          <Calendar size={18} />
        </button>
        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg z-50">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.to) setShowDatePicker(false);
              }}
              locale={vi}
              className="p-3"
            />
          </div>
        )}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hành khách
        </label>
        <button
          ref={passengerSelectorRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowDatePicker(false);
            setShowPassengerSelector(!showPassengerSelector);
          }}
          className="w-full p-3 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <span>
            {passengers.adults + passengers.children + passengers.infants} hành
            khách
          </span>
          <Users size={18} />
        </button>
        {showPassengerSelector && (
          <div ref={passengerSelectorRef}>{renderPassengerSelector()}</div>
        )}
      </div>
    </div>
  );

  const renderHotelSearch = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative lg:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa điểm
        </label>
        <input
          type="text"
          placeholder="Nhập tên thành phố, địa điểm hoặc khách sạn"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày nhận - trả phòng
        </label>
        <button
          ref={datePickerRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowPassengerSelector(false);
            setShowDatePicker(!showDatePicker);
          }}
          className="w-full p-3 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <span>
            {dateRange.from
              ? format(dateRange.from, "dd/MM/yyyy")
              : "Chọn ngày"}
            {dateRange.to ? ` - ${format(dateRange.to, "dd/MM/yyyy")}` : ""}
          </span>
          <Calendar size={18} />
        </button>
        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg z-50">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.to) setShowDatePicker(false);
              }}
              locale={vi}
              className="p-3"
            />
          </div>
        )}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số phòng & khách
        </label>
        <button
          ref={roomSelectorRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowDatePicker(false);
            setShowPassengerSelector(!showPassengerSelector);
          }}
          className="w-full p-3 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <span>
            {rooms.length} phòng,{" "}
            {rooms.reduce((sum, room) => sum + room.adults + room.children, 0)}{" "}
            khách
          </span>
          <Hotel size={18} />
        </button>
        {showPassengerSelector && (
          <div ref={roomSelectorRef}>{renderRoomSelector()}</div>
        )}
      </div>
    </div>
  );

  const renderTourSearch = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative lg:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Điểm đến
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Nhập tên thành phố hoặc địa điểm"
            className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày đi
        </label>
        <button
          ref={datePickerRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowPassengerSelector(false);
            setShowDatePicker(!showDatePicker);
          }}
          className="w-full p-3 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <span>
            {dateRange.from
              ? format(dateRange.from, "dd/MM/yyyy")
              : "Chọn ngày"}
          </span>
          <Calendar size={18} />
        </button>
        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg z-50">
            <DayPicker
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => {
                setDateRange({ from: date, to: null });
                setShowDatePicker(false);
              }}
              locale={vi}
              className="p-3"
            />
          </div>
        )}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Loại tour
        </label>
        <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white">
          <option value="">Tất cả loại tour</option>
          <option value="culture">Tour văn hóa</option>
          <option value="nature">Tour thiên nhiên</option>
          <option value="food">Tour ẩm thực</option>
          <option value="adventure">Tour mạo hiểm</option>
          <option value="relax">Tour nghỉ dưỡng</option>
        </select>
        <Compass className="absolute right-3 top-1/2 translate-y-1 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  const renderTransportSearch = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Điểm đi
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Chọn điểm đi"
            className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Điểm đến
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Chọn điểm đến"
            className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày đi
        </label>
        <button
          ref={datePickerRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowPassengerSelector(false);
            setShowDatePicker(!showDatePicker);
          }}
          className="w-full p-3 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <span>
            {dateRange.from
              ? format(dateRange.from, "dd/MM/yyyy")
              : "Chọn ngày"}
          </span>
          <Calendar size={18} />
        </button>
        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg z-50">
            <DayPicker
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => {
                setDateRange({ from: date, to: null });
                setShowDatePicker(false);
              }}
              locale={vi}
              className="p-3"
            />
          </div>
        )}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phương tiện
        </label>
        <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white">
          <option value="">Tất cả phương tiện</option>
          <option value="bus">Xe khách</option>
          <option value="train">Tàu hỏa</option>
          <option value="car">Xe du lịch</option>
        </select>
        <div className="absolute right-3 top-1/2 translate-y-1 flex gap-1 pointer-events-none">
          <Bus className="h-4 w-4 text-gray-400" />
          <Train className="h-4 w-4 text-gray-400" />
          <Car className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );

  // Thêm event listener để đóng menu khi click ra ngoài
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải ở ngoài tất cả các menu không
      const isDatePickerClick =
        datePickerRef.current &&
        (datePickerRef.current.contains(event.target) ||
          event.target.closest(".rdp"));
      const isPassengerSelectorClick =
        passengerSelectorRef.current &&
        passengerSelectorRef.current.contains(event.target);
      const isRoomSelectorClick =
        roomSelectorRef.current &&
        roomSelectorRef.current.contains(event.target);

      if (
        !isDatePickerClick &&
        !isPassengerSelectorClick &&
        !isRoomSelectorClick
      ) {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section className="relative min-h-screen pt-20">
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1528127269322-539801943592"
          className="absolute w-full h-full object-cover"
        >
          <source
            src="https://player.vimeo.com/external/373787886.hd.mp4?s=dee27e23fd31ad8bf1b31af7a232889830a455ca&profile_id=175&oauth2_token_id=57447761"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      <div className="relative container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Khám Phá Vẻ Đẹp Bất Tận
            <br />
            Của Việt Nam
          </h1>
          <p className="text-xl text-white/90">
            Hành trình khám phá những điểm đến tuyệt vời và trải nghiệm văn hóa
            độc đáo
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex bg-gray-50 p-2">
              {["Máy Bay", "Khách Sạn", "Tour", "Vé Xe/Tàu"].map(
                (tab, index) => (
                  <Tab
                    key={index}
                    className={({ selected }) =>
                      `flex-1 py-3 px-5 text-sm font-medium rounded-lg transition
                      ${
                        selected
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
                      }`
                    }
                  >
                    {tab}
                  </Tab>
                )
              )}
            </Tab.List>
            <Tab.Panels className="p-6">
              <Tab.Panel>{renderFlightSearch()}</Tab.Panel>
              <Tab.Panel>{renderHotelSearch()}</Tab.Panel>
              <Tab.Panel>{renderTourSearch()}</Tab.Panel>
              <Tab.Panel>{renderTransportSearch()}</Tab.Panel>
            </Tab.Panels>
          </Tab.Group>

          <div className="px-6 pb-6">
            <button className="w-full bg-emerald-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition">
              Tìm Kiếm
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
