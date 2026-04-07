import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { SA_MAP_CENTER, SA_MAP_ZOOM, CATEGORY_MARKER_COLORS } from '../../lib/constants'

// Fix Leaflet default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createCategoryIcon(category) {
  const color = CATEGORY_MARKER_COLORS[category] ?? '#6b7280'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

function createPendingIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:#f97316;border:3px solid white;
      box-shadow:0 0 0 4px rgba(249,115,22,0.3);
      animation:pulse 1.5s infinite;
    "></div>
    <style>@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(249,115,22,0.4)}70%{box-shadow:0 0 0 8px rgba(249,115,22,0)}100%{box-shadow:0 0 0 0 rgba(249,115,22,0)}}</style>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

/** Inner component that gets map instance and wires up events */
function MapInner({ attractions, pendingPin, onMapClick, onMapReady, onAttractionClick }) {
  const map            = useMapEvents({
    click(e) { onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) },
  })
  const clusterRef     = useRef(null)
  const pendingRef     = useRef(null)
  const markersMapRef  = useRef({}) // id → L.Marker

  // Notify parent of map instance
  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])

  // Manage cluster layer
  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({ chunkedLoading: true })
      map.addLayer(clusterRef.current)
    }
  }, [map])

  // Update attraction markers when data changes
  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()
    markersMapRef.current = {}

    attractions.forEach((attraction) => {
      const coords = attraction.coordinates
      if (!coords?.lat || !coords?.lng) return

      const marker = L.marker([coords.lat, coords.lng], {
        icon: createCategoryIcon(attraction.category),
      })

      marker.bindPopup(`
        <div style="direction:rtl;text-align:right;min-width:160px">
          <strong style="font-size:14px">${attraction.name}</strong>
          <div style="margin-top:4px;font-size:12px;color:#666">${attraction.country ?? ''}</div>
          ${attraction.rating ? `<div style="margin-top:4px">★`.repeat(attraction.rating) + `</div>` : ''}
        </div>
      `)

      marker.on('click', () => onAttractionClick(attraction))
      cluster.addLayer(marker)
      markersMapRef.current[attraction.id] = marker
    })
  }, [attractions, map, onAttractionClick])

  // Pending pin
  useEffect(() => {
    if (pendingRef.current) {
      map.removeLayer(pendingRef.current)
      pendingRef.current = null
    }
    if (pendingPin) {
      pendingRef.current = L.marker([pendingPin.lat, pendingPin.lng], {
        icon: createPendingIcon(),
        zIndexOffset: 1000,
      }).addTo(map)
    }
  }, [pendingPin, map])

  return null
}

export default function MapView({ attractions = [], pendingPin, onMapClick, onMapReady, onAttractionClick, flyToTarget }) {
  const mapInstanceRef = useRef(null)

  const handleMapReady = (map) => {
    mapInstanceRef.current = map
    onMapReady?.(map)
  }

  // flyTo when target changes
  useEffect(() => {
    if (flyToTarget && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([flyToTarget.lat, flyToTarget.lng], 13, { duration: 1.2 })
    }
  }, [flyToTarget])

  return (
    <MapContainer
      center={SA_MAP_CENTER}
      zoom={SA_MAP_ZOOM}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInner
        attractions={attractions}
        pendingPin={pendingPin}
        onMapClick={onMapClick}
        onMapReady={handleMapReady}
        onAttractionClick={onAttractionClick ?? (() => {})}
      />
    </MapContainer>
  )
}
