// lib/leaflet-config.ts
import L from 'leaflet'

// Fix for default icons in Next.js
export const configureLeaflet = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
    })
}

// Sample KML data for testing
export const sampleKML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Fiber Network Sample</name>
    <description>A sample fiber optic network for testing</description>
    
    <Style id="oltStyle">
      <IconStyle>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <Style id="splitterStyle">
      <IconStyle>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/purple-pushpin.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <Style id="fiberStyle">
      <LineStyle>
        <color>ff0066ff</color>
        <width>3</width>
      </LineStyle>
    </Style>
    
    <Placemark>
      <name>OLT-01</name>
      <description>Main Optical Line Terminal</description>
      <styleUrl>#oltStyle</styleUrl>
      <Point>
        <coordinates>77.5946,12.9716,0</coordinates>
      </Point>
    </Placemark>
    
    <Placemark>
      <name>SPL-01</name>
      <description>1:8 PLC Splitter</description>
      <styleUrl>#splitterStyle</styleUrl>
      <Point>
        <coordinates>77.5950,12.9720,0</coordinates>
      </Point>
    </Placemark>
    
    <Placemark>
      <name>SPL-02</name>
      <description>1:16 PLC Splitter</description>
      <styleUrl>#splitterStyle</styleUrl>
      <Point>
        <coordinates>77.5960,12.9700,0</coordinates>
      </Point>
    </Placemark>
    
    <Placemark>
      <name>Fiber Route 1</name>
      <description>Backbone fiber from OLT-01 to SPL-01</description>
      <styleUrl>#fiberStyle</styleUrl>
      <LineString>
        <coordinates>
          77.5946,12.9716,0
          77.5948,12.9718,0
          77.5950,12.9720,0
        </coordinates>
      </LineString>
    </Placemark>
    
    <Placemark>
      <name>Fiber Route 2</name>
      <description>Distribution fiber from SPL-01 to SPL-02</description>
      <styleUrl>#fiberStyle</styleUrl>
      <LineString>
        <coordinates>
          77.5950,12.9720,0
          77.5955,12.9710,0
          77.5960,12.9700,0
        </coordinates>
      </LineString>
    </Placemark>
    
    <Placemark>
      <name>Service Area A</name>
      <description>Primary service coverage area</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              77.5940,12.9710,0
              77.5965,12.9710,0
              77.5965,12.9725,0
              77.5940,12.9725,0
              77.5940,12.9710,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`