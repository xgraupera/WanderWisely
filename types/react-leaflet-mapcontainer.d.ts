import "react-leaflet";
import { LatLngExpression } from "leaflet";
import { CSSProperties, ReactNode } from "react";

declare module "react-leaflet" {
  interface MapContainerProps {
    center?: LatLngExpression;
    zoom?: number;
    children?: ReactNode;
    style?: CSSProperties;
    scrollWheelZoom?: boolean;
  }
}
