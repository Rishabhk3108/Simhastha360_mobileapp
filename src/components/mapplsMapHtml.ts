export function buildMapplsMapHtml(apiKey: string, centerLat: number, centerLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1.0, width=device-width" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    #debug-status {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
      background: rgba(27,33,64,0.92); color: #F6F1E7; font-family: monospace;
      font-size: 11px; padding: 8px; word-break: break-all;
      max-height: 40%; overflow-y: auto;
    }
  </style>
</head>
<body>
  <div id="debug-status">booting...</div>
  <div id="map"></div>
  <script>
    var map;
    var userMarker, destinationMarker, routeLine;
    var mapIsReady = false;
    var pendingCommands = [];

    var debugLog = [];
    function setDebug(text) {
      debugLog.push(text);
      if (debugLog.length > 8) debugLog.shift();
      var el = document.getElementById('debug-status');
      if (el) el.textContent = debugLog.join('\\n---\\n');
    }

    function post(payload) {
      setDebug(JSON.stringify(payload));
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    var __origConsoleError = console.error;
    console.error = function () {
      __origConsoleError.apply(console, arguments);
      try {
        post({ type: 'mapError', message: 'console.error: ' + Array.prototype.slice.call(arguments).join(' ') });
      } catch (e) {}
    };

    function hasWebGL() {
      try {
        var canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
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
      setDebug('script loaded, initializing...');
      if (!hasWebGL()) {
        post({ type: 'mapError', message: 'This WebView has no WebGL support - the map cannot render.' });
        return;
      }
      try {
        var MMI = findSdkNamespace();
        if (!MMI) {
          var candidates = Object.keys(window).filter(function (k) { return /map/i.test(k); });
          post({ type: 'mapError', message: 'SDK loaded but no Map constructor found. window keys: ' + candidates.join(', ') });
          return;
        }
        window.__MMI = MMI;
        var mapDiv = document.getElementById('map');
        setDebug('creating map, container size: ' + mapDiv.offsetWidth + 'x' + mapDiv.offsetHeight);
        map = new MMI.Map('map', {
          center: [${centerLat}, ${centerLng}],
          zoom: 15,
          zoomControl: false,
          search: false,
        });
        var readyPosted = false;
        function postReadyOnce() {
          if (readyPosted) return;
          readyPosted = true;
          mapIsReady = true;
          post({ type: 'mapReady', containerSize: mapDiv.offsetWidth + 'x' + mapDiv.offsetHeight, queuedCommands: pendingCommands.length });
          var queued = pendingCommands;
          pendingCommands = [];
          queued.forEach(runCommand);
        }
        if (typeof map.on === 'function') {
          map.on('load', postReadyOnce);
          setTimeout(postReadyOnce, 1500);
        } else {
          postReadyOnce();
        }
      } catch (e) {
        post({ type: 'mapError', message: String((e && e.message) || e) });
      }
    }

    function mapScriptError() {
      clearTimeout(window.__mapTimeout);
      post({ type: 'mapError', message: 'Could not load the Mappls map script (network error).' });
    }

    window.onerror = function (message) {
      post({ type: 'mapError', message: String(message) });
      return true;
    };

    window.__mapTimeout = setTimeout(function () {
      post({ type: 'mapError', message: 'Map failed to load in time - the API key may not be active yet.' });
    }, 10000);

    function handleCommand(command) {
      if (!mapIsReady) {
        pendingCommands.push(command);
        post({ type: 'debug', message: 'queued "' + command.type + '" - map not ready yet' });
        return;
      }
      runCommand(command);
    }

    function runCommand(command) {
      if (!map || !window.__MMI) return;
      try {
        runCommandUnsafe(command);
      } catch (e) {
        post({ type: 'mapError', message: 'runCommand(' + command.type + '): ' + String((e && e.message) || e) });
      }
    }

    function runCommandUnsafe(command) {
      var MMI = window.__MMI;
      if (command.type === 'setUserLocation') {
        if (userMarker && userMarker.remove) userMarker.remove();
        userMarker = new MMI.Marker({
          map: map,
          position: [command.lat, command.lng],
          fitbounds: false,
          color: '#1B2140',
        });
        if (typeof userMarker.setPosition === 'function') {
          userMarker.setPosition([command.lat, command.lng]);
        }
        if (command.recenter) {
          map.setCenter([command.lat, command.lng]);
        }
      } else if (command.type === 'setDestination') {
        if (destinationMarker && destinationMarker.remove) destinationMarker.remove();
        destinationMarker = new MMI.Marker({
          map: map,
          position: [command.lat, command.lng],
          popupHtml: command.label || '',
          color: '#D9762B',
        });
        if (typeof destinationMarker.setPosition === 'function') {
          destinationMarker.setPosition([command.lat, command.lng]);
        }
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
</body>
</html>`;
}
