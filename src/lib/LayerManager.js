import { Map, View } from "ol";
import {
  fromLonLat,
  getTransformFromProjections,
  get as getProjection, toLonLat,
} from 'ol/proj';
import Collection from "ol/Collection";
import { defaults } from "ol/control";
import Attribution from "ol/control/Attribution";
import { circular as circularPolygon } from "ol/geom/Polygon";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { cartoDark, cartoLight, mapTilerOutdoor, osm } from "../layers/base";
import { latLon, mapBaseLayer, sharedActiveCap, zoomlevel } from '../stores';
import { DeviceDetect as dd } from '../lib/DeviceDetect';

let shouldUpdate = true;

/**
 * Manages the reflectivity + forecast layers shown on the map.
 */
// eslint-disable-next-line import/prefer-default-export
export class LayerManager {
  constructor(options) {
    this.options = options;
    this.settings = options.settings;
    this.capabilities = options.capabilities;
    this.maps = [];
    this.accuracyFeatures = [];
    this.positionFeatures = [];
    this.currentCap = null;
    this.mapCount = 0;

    Object.keys(this.capabilities).forEach((capability) => {
      const newMap = this.makeMap(capability);
      this.capabilities[capability].setMap(newMap);
      this.maps.push(newMap);
    });

    mapBaseLayer.subscribe((newBaseLayer) => { this.switchBaseLayer(newBaseLayer); });
  }

  updateLocation(lat, lon, accuracy, zoom = false, focus = true) {
    let accuracyPoly = null;
    if (accuracy >= 0) {
      accuracyPoly = circularPolygon([lon, lat], accuracy, 64);
      accuracyPoly.applyTransform(
        getTransformFromProjections(
          getProjection("EPSG:4326"),
          getProjection("EPSG:3857"),
        ),
      );
    }
    this.accuracyFeatures.forEach((feature) => feature.setGeometry(accuracyPoly));
    let centerPoint;
    const center = fromLonLat([lon, lat]);
    if (lat === -1 && lon === -1 && accuracy === -1) {
      centerPoint = null;
      latLon.set(null);
    } else {
      centerPoint = center ? new Point(center) : null;
      latLon.set([lat, lon]);
    }
    this.positionFeatures.forEach((feature) => feature.setGeometry(centerPoint));

    if (centerPoint === null) return;

    const view = this.maps[0].getView();
    let zoomLevel = view.getZoom();
    const oldCenter = view.getCenter();
    if (zoom) {
      if (accuracy < 400) {
        zoomLevel = 12;
      } else if (accuracy < 800) {
        zoomLevel = 11;
      } else if (accuracy < 2000) {
        zoomLevel = 10;
      } else if (accuracy < 4000) {
        zoomLevel = 9;
      } else {
        zoomLevel = 8;
      }
    }
    let newCenter;
    if (focus) {
      newCenter = center;
    } else {
      newCenter = oldCenter;
    }
    if (zoom || focus) {
      view.animate({ center: newCenter, zoom: zoomLevel, duration: 500 });
    }
    this.forEachMap((map) => map.render());
  }

  resetLocation() {
    this.positionFeatures.forEach((feature) => feature.setGeometry(null));
    this.accuracyFeatures.forEach((feature) => feature.setGeometry(null));
  }

  setTarget(cap, target) {
    if (this.currentCap && this.capabilities[this.currentCap].willLoseFocus && cap !== this.currentCap) {
      this.capabilities[this.currentCap].willLoseFocus();
    }
    this.capabilities[cap].setTarget(target);
    sharedActiveCap.set(cap);
    this.currentCap = cap;
  }

  getCurrentMap() {
    return this.capabilities[this.currentCap].map;
  }

  setDefaultTarget(target) {
    console.log(`Starting with default cap ${this.settings.get("capability")}`);
    this.setTarget(this.settings.get("capability"), target);
  }

  makeMap(capability) {
    let controls = new Collection();
    if (!dd.isApp()) {
      controls = defaults({ attribution: false }).extend([
        new Attribution({
          collapsible: false,
        }),
      ]);
    }

    const accuracyFeature = new Feature();
    this.accuracyFeatures.push(accuracyFeature);
    const positionFeature = new Feature();
    this.positionFeatures.push(positionFeature);
    const geolocationPositionLayer = new VectorLayer({
      source: new VectorSource({
        features: [positionFeature],
        kind: "geolocationPositionLayer",
      }),
      style: new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({
            color: "#048EF9",
          }),
          stroke: new Stroke({
            color: "#fff",
            width: 3.5,
          }),
        }),
      }),
      zIndex: 99999,
    });
    const geolocationAccuracyLayer = new VectorLayer({
      source: new VectorSource({
        features: [accuracyFeature],
        kind: "geolocationPositionLayer",
      }),
      zIndex: 99999,
    });

    let lat = 51.0;
    let lon = 11.0;
    let z = 6;

    const parts = this.settings.get("latLonZ").split(",");
    if (parts.length === 3) {
      [lat, lon, z] = parts.map(parseFloat);
    }

    const newMap = new Map({
      layers: [
        this.baseLayerFactory(this.settings.get("mapBaseLayer")),
        geolocationAccuracyLayer,
        geolocationPositionLayer,
      ],
      view:
        this.maps.length > 0 ?
          this.maps[0].getView() :
          new View({
            constrainResolution: false,
            zoom: z,
            center: fromLonLat([lon, lat]),
            enableRotation: this.settings.get("mapRotation"),
          }),
      capability,
      controls,
    });
    newMap.on("moveend", (e) => {
      zoomlevel.set(newMap.getView().getZoom());
    });
    newMap.set("capability", capability);
    if (this.mapCount === 0) {
      newMap.on("moveend", () => {
        if (!shouldUpdate) {
          // do not update the URL when the view was changed in the 'popstate' handler
          shouldUpdate = true;
          return;
        }

        const center = newMap.getView().getCenter();
        const center4326 = toLonLat(center);
        const url = new URL(window.location.href);
        url.searchParams.set("latLonZ",
          `${center4326[1].toFixed(6)},${center4326[0].toFixed(6)},${newMap.getView().getZoom().toFixed(2)}`);
        window.history.pushState({ location: url.toString() }, `meteocool 2.0 ${window.location.toString()}`, url.toString());
      });

      // restore the view state when navigating through the history, see
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
      window.addEventListener("popstate", (event) => {
        if (event.state === null) {
          return;
        }
        shouldUpdate = false;
        const url = new URL(event.state.location);
        if (url.searchParams.has("latLonZ")) {
          this.settings.cb("latLonZ");
        }
      });
    }
    this.mapCount += 1;
    return newMap;
  }

  baseLayerFactory(layer) {
    switch (layer) {
      case "osm":
        return osm();
      case "dark":
        return cartoDark();
      case "light":
        return cartoLight();
      case "topographic":
      default:
        return mapTilerOutdoor();
    }
  }

  switchBaseLayer(newBaseLayer) {
    this.forEachMap((map) => {
      map
        .getLayers()
        .getArray()
        .filter((layer) => layer.get("base") === true)
        .forEach((layer) => map.removeLayer(layer));
      map.addLayer(this.baseLayerFactory(newBaseLayer));
    });
  }

  forEachMap(cb) {
    this.maps.forEach((map) => cb(map));
  }
}

/* vim: set ts=2 sw=2 expandtab: */
