export function buildMapplsMapHtml(apiKey: string, centerLat: number, centerLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1.0, width=device-width" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
  <script src="https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=initMap" defer async></script>
</head>
<body>
  <div id="map"></div>
  <script>
    var map;
    var userMarker, destinationMarker, routeLine;

    function post(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function initMap() {
      map = new Mappls.Map('map', {
        center: [${centerLat}, ${centerLng}],
        zoom: 15,
        zoomControl: false,
        search: false,
      });
      map.on('load', function () {
        post({ type: 'mapReady' });
      });
    }

    function handleCommand(command) {
      if (!map) return;
      if (command.type === 'setUserLocation') {
        if (userMarker) userMarker.remove();
        userMarker = new Mappls.Marker({
          map: map,
          position: { lat: command.lat, lng: command.lng },
          fitbounds: false,
          icon_url: 'https://apis.mapmyindia.com/map_v3/1.png',
        });
        if (command.recenter) {
          map.setCenter([command.lat, command.lng]);
        }
      } else if (command.type === 'setDestination') {
        if (destinationMarker) destinationMarker.remove();
        destinationMarker = new Mappls.Marker({
          map: map,
          position: { lat: command.lat, lng: command.lng },
          popupHtml: command.label || '',
        });
        map.setCenter([command.lat, command.lng]);
      } else if (command.type === 'drawRoute') {
        if (routeLine) routeLine.remove();
        routeLine = new Mappls.Polyline({
          map: map,
          path: command.coordinates,
          strokeColor: '#1B2140',
          strokeOpacity: 0.9,
          strokeWeight: 5,
        });
        if (map.fitBounds) {
          map.fitBounds(command.coordinates);
        }
      } else if (command.type === 'clearRoute') {
        if (routeLine) { routeLine.remove(); routeLine = null; }
        if (destinationMarker) { destinationMarker.remove(); destinationMarker = null; }
      }
    }

    document.addEventListener('message', function (e) { handleCommand(JSON.parse(e.data)); });
    window.addEventListener('message', function (e) { handleCommand(JSON.parse(e.data)); });
  </script>
</body>
</html>`;
}
