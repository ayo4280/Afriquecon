import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Location data for major hubs
const locations = [
  { id: 'douala', name: 'Douala', country: 'Cameroon', coords: [4.0511, 9.7679] as [number, number] },
  { id: 'yaounde', name: 'Yaoundé', country: 'Cameroon', coords: [3.8480, 11.5021] as [number, number] },
  { id: 'buea', name: 'Buea', country: 'Cameroon', coords: [4.1550, 9.2405] as [number, number] },
  { id: 'kumba', name: 'Kumba', country: 'Cameroon', coords: [4.6300, 9.4460] as [number, number] },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', coords: [6.5244, 3.3792] as [number, number] },
  { id: 'abuja', name: 'Abuja', country: 'Nigeria', coords: [9.0765, 7.3986] as [number, number] },
  { id: 'onitsha', name: 'Onitsha', country: 'Nigeria', coords: [6.1452, 6.7820] as [number, number] },
  { id: 'enugu', name: 'Enugu', country: 'Nigeria', coords: [6.4584, 7.5464] as [number, number] },
  { id: 'abakaliki', name: 'Abakaliki', country: 'Nigeria', coords: [6.3249, 8.1137] as [number, number] },
  { id: 'ikom', name: 'Ikom', country: 'Nigeria', coords: [5.9610, 8.7118] as [number, number] },
];

// Routes connecting the hubs (simplified straight lines for the map)
const routes = [
  { from: 'douala', to: 'lagos' },
  { from: 'douala', to: 'buea' },
  { from: 'buea', to: 'kumba' },
  { from: 'kumba', to: 'ikom' },
  { from: 'ikom', to: 'abakaliki' },
  { from: 'abakaliki', to: 'enugu' },
  { from: 'enugu', to: 'onitsha' },
  { from: 'douala', to: 'yaounde' },
  { from: 'yaounde', to: 'abuja' },
  { from: 'onitsha', to: 'lagos' },
  { from: 'enugu', to: 'abuja' },
];

export default function CoverageMap() {
  const getCoords = (id: string) => locations.find(loc => loc.id === id)?.coords || [0, 0];

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-200 shadow-xl relative z-0">
      <MapContainer 
        center={[6.5, 8.5]} 
        zoom={6} 
        className="w-full h-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {routes.map((route, idx) => (
          <Polyline 
            key={idx} 
            positions={[getCoords(route.from), getCoords(route.to)]} 
            color="#0ea5e9" 
            weight={3} 
            opacity={0.6} 
            dashArray="10, 10" 
          />
        ))}

        {locations.map((loc) => (
          <Marker key={loc.id} position={loc.coords}>
            <Popup>
              <div className="font-semibold text-gray-900">{loc.name}</div>
              <div className="text-sm text-gray-500">{loc.country} Hub</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Custom overlay style to ensure Leaflet controls don't mess up the dark theme if we had one */}
      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
