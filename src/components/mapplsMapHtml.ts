export function buildMapplsMapHtml(apiKey: string, centerLat: number, centerLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1.0, width=device-width" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  </style>
  <script>
    var map;
    var userMarker, destinationMarker, routeLine;

    function post(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function findSdkNamespace() {
      // Mappls' own docs inconsistently show both "Mappls.Map" and lowercase
      // "mappls.search" - rather than guess again, check both and report
      // exactly what's on window if neither has a usable Map constructor.
      if (typeof window.Mappls !== 'undefined' && window.Mappls.Map) return window.Mappls;
      if (typeof window.mappls !== 'undefined' && window.mappls.Map) return window.mappls;
      return null;
    }

    function initMap() {
      clearTimeout(window.__mapTimeout);
      try {
        var MMI = findSdkNamespace();
        if (!MMI) {
          var candidates = Object.keys(window).filter(function (k) {
            return /map/i.test(k);
          });
          post({ type: 'mapError', message: 'SDK loaded but no Map constructor found. window keys matching "map": ' + candidates.join(', ') });
          return;
        }
        window.__MMI = MMI;
        map = new MMI.Map('map', {
          center: [${centerLat}, ${centerLng}],
          zoom: 15,
          zoomControl: false,
          search: false,
        });
        map.on('load', function () {
          post({ type: 'mapReady' });
        });
      } catch (e) {
        post({ type: 'mapError', message: String((e && e.message) || e) });
      }
    }

    function mapScriptError() {
      clearTimeout(window.__mapTimeout);
      post({ type: 'mapError', message: 'Could not load the Mappls map script.' });
    }

    window.onerror = function (message) {
      post({ type: 'mapError', message: String(message) });
      return true;
    };

    window.__mapTimeout = setTimeout(function () {
      post({ type: 'mapError', message: 'Map failed to load in time - the API key may not be active yet.' });
    }, 10000);

    function handleCommand(command) {
      if (!map || !window.__MMI) return;
      var MMI = window.__MMI;
      if (command.type === 'setUserLocation') {
        if (userMarker) userMarker.remove();
        userMarker = new MMI.Marker({
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
        destinationMarker = new MMI.Marker({
          map: map,
          position: { lat: command.lat, lng: command.lng },
          popupHtml: command.label || '',
        });
        map.setCenter([command.lat, command.lng]);
      } else if (command.type === 'drawRoute') {
        if (routeLine) routeLine.remove();
        routeLine = new MMI.Polyline({
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
  <script src="https://sdk.mappls.com/map/sdk/web?v=3.0&layer=vector&access_token=${apiKey}" onload="initMap()" onerror="mapScriptError()"></script>
</head>
<body>
  <div id="map"></div>
</body>
</html>`;
}
