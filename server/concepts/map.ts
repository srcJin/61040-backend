import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface MapDoc extends BaseDoc {
  user?: ObjectId;
  centerPoint: number[]; // number can be either int or float
  zoomLevel: number;
  layers: string[];
  theme: string;
}

export default class MapConcept {
  private readonly maps = new DocCollection<MapDoc>("maps");

  // to avoid type issue
  getDefaultMap(): MapDoc {
    return {
      _id: new ObjectId(), // Generate a new ObjectId
      dateCreated: new Date(),
      dateUpdated: new Date(),
      centerPoint: [0, 0],
      zoomLevel: 1.0,
      layers: ["user", "poi"],
      theme: "normal",
    };
  }

  async getMapByUser(userId?: ObjectId) {
    const query = userId ? { user: userId } : {};
    let map = await this.maps.readOne(query);
    if (!map) {
      if (userId) {
        throw new NotFoundError(`Map for user ${userId} does not exist!`);
      } else {
        // Return default settings if no user-specific map is found
        map = this.getDefaultMap();
      }
    }
    return map;
  }

  async setCenterPoint(centerPoint: [number, number], userId?: ObjectId) {
    const query = userId ? { user: userId } : {};
    await this.maps.updateOne(query, { centerPoint });
    return this.getMapByUser(userId);
  }

  async setZoomLevel(zoomLevel: number, userId?: ObjectId) {
    const query = userId ? { user: userId } : {};
    await this.maps.updateOne(query, { zoomLevel });
    return this.getMapByUser(userId);
  }

  async addLayer(layer: string, userId?: ObjectId) {
    const query = userId ? { user: userId } : {};
    const currentMap = await this.getMapByUser(userId);
    if (!currentMap.layers.includes(layer)) {
      currentMap.layers.push(layer);
      await this.maps.updateOne(query, { layers: currentMap.layers });
    }
    return this.getMapByUser(userId);
  }

  async removeLayer(layer: string, userId?: ObjectId) {
    const query = userId ? { user: userId } : {};
    const currentMap = await this.getMapByUser(userId);
    const index = currentMap.layers.indexOf(layer);
    if (index > -1) {
      currentMap.layers.splice(index, 1);
      await this.maps.updateOne(query, { layers: currentMap.layers });
    }
    return this.getMapByUser(userId);
  }

  async setTheme(theme: string, userId?: ObjectId) {
    const query = userId ? { user: userId } : {};
    await this.maps.updateOne(query, { theme });
    return this.getMapByUser(userId);
  }

  async createMap(initialState?: Partial<MapDoc>) {
    // If you want to prevent creating multiple maps without userId, you can check and throw an error:
    if (!initialState?.user) {
      const defaultMap = await this.maps.readOne({ user: undefined });
      if (defaultMap) {
        throw new NotAllowedError("A default map already exists!");
      }
    }

    const defaultState = {
      centerPoint: [0, 0],
      zoomLevel: 1.0,
      layers: ["user", "poi"],
      theme: "normal",
      ...initialState,
    };
    await this.maps.createOne(defaultState);
    return this.getMapByUser(initialState?.user);
  }
}
