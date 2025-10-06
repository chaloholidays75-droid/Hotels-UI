import React, { useState, useRef, useEffect } from "react";

const HotelMapSearch = ({ booking, setBooking }) => {
  const [query, setQuery] = useState(booking.hotelName || "");
  const [hotels, setHotels] = useState([]);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Load Google Maps script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 }, // Default India center
      zoom: 5,
    });
    mapRef.current.mapInstance = map;
  };

  // Search hotels using Places API
  const searchHotels = () => {
    if (!query) return;

    const service = new window.google.maps.places.PlacesService(mapRef.current.mapInstance);
    const request = {
      query,
      type: "lodging",
    };
    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setHotels(results);

        // Clear previous markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add new markers
        results.forEach(place => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: mapRef.current.mapInstance,
            title: place.name
          });
          marker.addListener("click", () => selectHotel(place));
          markersRef.current.push(marker);
        });

        // Adjust map bounds
        const bounds = new window.google.maps.LatLngBounds();
        results.forEach(r => bounds.extend(r.geometry.location));
        mapRef.current.mapInstance.fitBounds(bounds);
      }
    });
  };

  const selectHotel = (hotel) => {
    setBooking({
      ...booking,
      hotelId: hotel.place_id,
      hotelName: hotel.name,
      hotelCity: hotel.formatted_address.split(",").slice(-3, -2)[0] || "",
      hotelCountry: hotel.formatted_address.split(",").slice(-1)[0] || "",
      hotelLat: hotel.geometry.location.lat(),
      hotelLng: hotel.geometry.location.lng()
    });
    setQuery(hotel.name);
    setHotels([]);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search hotel..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Enter" && searchHotels()}
        className="form-input"
      />
      <button onClick={searchHotels} className="btn btn-primary mt-1">Search</button>

      {/* Hotel Suggestions */}
      {hotels.length > 0 && (
        <div className="autocomplete-dropdown">
          {hotels.map(h => (
            <div key={h.place_id} className="autocomplete-item" onClick={() => selectHotel(h)}>
              {h.name} - {h.formatted_address}
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} style={{ height: "400px", width: "100%", marginTop: "10px" }}></div>
    </div>
  );
};

export default HotelMapSearch;
