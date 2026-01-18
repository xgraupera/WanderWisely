// types/leaflet-markercluster.d.ts
import * as L from "leaflet";

declare module "leaflet" {
  namespace control {
    function fullscreen(options?: any): any;
  }

  function markerClusterGroup(options?: L.MarkerClusterGroupOptions): L.MarkerClusterGroup;
}
