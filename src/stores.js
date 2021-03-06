import { writable } from "svelte/store";

export const bottomToolbarMode = writable("collapsed");
export const capDescription = writable("Meteorology for everyone");
export const capLastUpdated = writable(null);
export const capTimeIndicator = writable(0);
export const colorSchemeDark = writable(false);
export const latLon = writable(null);
export const lightningLayerVisible = writable(true);
export const logoStyle = writable("full");
export const layerswitcherVisible = writable("yes");
export const toolbarVisible = writable("yes");
export const cycloneLayerVisible = writable(true);
export const mapBaseLayer = writable("light");
export const radarColorScheme = writable("classic");
export const showForecastPlaybutton = writable(true);
export const satelliteLayer = writable("sentinel2");
export const zoomlevel = writable(3);
export const processedForecastsCount = writable(0);

export const sharedActiveCap = writable("");
export const sharedCmap = writable("");
