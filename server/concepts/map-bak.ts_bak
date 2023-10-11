import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

type MarkerType = "User" | "POI";

interface MarkerDoc extends BaseDoc {
  location: [number, number]; // [lng, lat]
  user: ObjectId;
  type: MarkerType;
}

interface MapState {
  centerPoint: [number, number]; // [lng, lat]
  zoomLevel: number; // a float number
  layers: string[]; // weather, risk, user, poi, flower
  theme: string; // "normal", "night", "satellite", "terrain"
}

export default class Map {
  state: MapState;
  private readonly markersCollection: DocCollection<MarkerDoc>;

  constructor(collectionName: string) {
    this.markersCollection = new DocCollection<MarkerDoc>(collectionName);
    // Default map state
    this.state = {
      centerPoint: [0, 0], // Default to 0,0, will change to user's location later
      zoomLevel: 1.0, // Default zoom level
      layers: ["user", "poi"], // Default layers to display
      theme: "normal", // Default theme
    };
  }

  // Map related methods

  setCenterPoint(lng: number, lat: number) {
    this.state.centerPoint = [lng, lat];
  }

  setZoomLevel(zoom: number) {
    this.state.zoomLevel = zoom;
  }

  addLayer(layer: string) {
    if (!this.state.layers.includes(layer)) {
      this.state.layers.push(layer);
    }
  }

  removeLayer(layer: string) {
    const index = this.state.layers.indexOf(layer);
    if (index > -1) {
      this.state.layers.splice(index, 1);
    }
  }

  setTheme(theme: string) {
    this.state.theme = theme;
  }

  // Marker-specific methods

  async createMarker(location: [number, number], user: ObjectId, type: MarkerType) {
    const _id = await this.markers.createOne({ location, user, type });
    const marker = await this.markers.readOne({ _id });
    return { msg: "Marker successfully created!", marker };
  }

  async getMarkers(query: Filter<MarkerDoc>) {
    const markers = await this.markers.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return markers;
  }

  async getByUser(user: ObjectId) {
    return await this.getMarkers({ user });
  }

  async updateMarker(_id: ObjectId, update: Partial<MarkerDoc>) {
    this.sanitizeUpdate(update);
    await this.markers.updateOne({ _id }, update);
    const marker = await this.markers.readOne({ _id });
    return { msg: "Marker successfully updated!", marker };
  }

  async deleteMarker(_id: ObjectId) {
    const marker = await this.markers.readOne({ _id });
    await this.markers.deleteOne({ _id });
    return { msg: "Marker deleted successfully!", marker };
  }

  async isUser(user: ObjectId, _id: ObjectId) {
    const marker = await this.markers.readOne({ _id });
    if (!marker) {
      throw new NotFoundError(`Marker ${_id} does not exist!`);
    }
    if (marker.user.toString() !== user.toString()) {
      throw new MarkerUserNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<MarkerDoc>) {
    // Prevent certain fields from being updated. 
    const allowedUpdates = ["location", "type"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }

  export class MarkerUserNotMatchError extends NotAllowedError {
    constructor(
      public readonly user: ObjectId,
      public readonly _id: ObjectId,
    ) {
      super("{0} is not the user of marker {1}!", user, _id);
    }
}
