// // GoogleHotelMap.jsx
// import React from 'react';
// // import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

// const mapContainerStyle = {
//   width: '100%',
//   height: '100%'
// };

// const defaultCenter = {
//   lat: 51.5074,
//   lng: -0.1278
// };

// const GoogleHotelMap = ({ hotels, selectedHotel, onHotelSelect, mapCenter }) => {
//   const { isLoaded, loadError } = useLoadScript({
//     googleMapsApiKey: "AIzaSyBpGIsi94mRHxjtou3EV8pxbAgQgFATehE",
//     libraries: ['places'],
//   });

//   const createMarkerIcon = (color) => {
//     // Use encodeURIComponent instead of btoa for emoji characters
//     const svgString = `
//       <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
//         <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
//         <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-family="Arial">🏨</text>
//       </svg>
//     `;
    
//     return {
//       url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
//       scaledSize: new window.google.maps.Size(40, 40),
//       anchor: new window.google.maps.Point(20, 40)
//     };
//   };

//   if (loadError) {
//     return (
//       <div className="map-error">
//         <div>Error loading maps</div>
//         <button onClick={() => window.location.reload()}>Retry</button>
//       </div>
//     );
//   }

//   if (!isLoaded) {
//     return (
//       <div className="map-loading">
//         <div className="loading-spinner"></div>
//         <p>Loading map...</p>
//       </div>
//     );
//   }

//   return (
//     <GoogleMap
//       mapContainerStyle={mapContainerStyle}
//       center={mapCenter || defaultCenter}
//       zoom={13}
//       options={{
//         styles: [
//           {
//             "featureType": "all",
//             "elementType": "geometry",
//             "stylers": [{ "color": "#f5f5f5" }]
//           },
//           {
//             "featureType": "all",
//             "elementType": "labels.text.fill",
//             "stylers": [{ "gamma": 0.01 }, { "lightness": 20 }]
//           },
//           {
//             "featureType": "poi",
//             "elementType": "labels",
//             "stylers": [{ "visibility": "off" }]
//           },
//           {
//             "featureType": "water",
//             "stylers": [{ "color": "#b5d0d0" }]
//           }
//         ],
//         zoomControl: true,
//         mapTypeControl: false,
//         scaleControl: true,
//         streetViewControl: false,
//         rotateControl: false,
//         fullscreenControl: true
//       }}
//     >
//       {hotels.map((hotel, index) => {
//         const hotelPosition = {
//           lat: (mapCenter?.lat || defaultCenter.lat) + (Math.random() - 0.5) * 0.05,
//           lng: (mapCenter?.lng || defaultCenter.lng) + (Math.random() - 0.5) * 0.05
//         };

//         return (
//           <Marker
//             key={hotel.id}
//             position={hotelPosition}
//             icon={createMarkerIcon(
//               selectedHotel?.id === hotel.id ? '#2ecc71' : '#e74c3c'
//             )}
//             onClick={() => onHotelSelect(hotel)}
//             title={hotel.hotelName}
//           />
//         );
//       })}
//     </GoogleMap>
//   );
// };

// export default GoogleHotelMap;