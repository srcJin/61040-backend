import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export type MarkerType = "User" | "POI";

export interface MarkerDoc extends BaseDoc {
  location: [number, number]; // [lng, lat]
  itemId: ObjectId; // This will be either a user ID or a POI ID based on the type
  type: MarkerType;
  info?: string; // info is optional, only for "POI" type
  postIds?: ObjectId[]; // postIds is optional, only for "User" type
}

export default class MarkerConcept {
  public readonly markers = new DocCollection<MarkerDoc>("markers");

  async create(location: [number, number], itemId: ObjectId, type: MarkerType, info?: string, postIds?: ObjectId[]): Promise<{ msg: string; marker: MarkerDoc }> {
    const _id = await this.markers.createOne({
      location,
      itemId,
      type,
      info,
      postIds,
    });

    const marker = await this.markers.readOne({ _id });
    if (!marker) {
      throw new NotFoundError(`Error creating Marker with id ${_id}`);
    }
    return { msg: "Marker successfully created!", marker };
  }

  //   async getMarkers(query: Filter<MarkerDoc>) {
  //     const markers = await this.markers.readMany(query, {
  //       sort: { dateUpdated: -1 },
  //     });
  //     return markers;
  //   }

  // Here always sort by dateUpdated due to type constrains, TODO: is it possible to add a sort option
  async getMarkers(query: Filter<MarkerDoc>, options?: { sort: { dateUpdated: -1 }; limit?: number }): Promise<MarkerDoc[]> {
    return await this.markers.readMany(query, options);
  }

  // we first get the markers within the range of the map
  // integrating the filter criteria directly into the database query
  async getMarkersInRange(centerLocation: [number, number], zoomLevel: number, additionalQuery?: Filter<MarkerDoc>): Promise<MarkerDoc[]> {
    const zoomToRadiusMap: Record<number, number> = {
      // below needs to be adjusted according to actual API
      1: 5000000, // 5000 km
      2: 2000000, // 2000 km
      3: 1000000, // 1000 km
      4: 500000, // 500 km
    };

    const radius = zoomToRadiusMap[zoomLevel] || 1000;

    const locationQuery = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: centerLocation,
          },
          $maxDistance: radius,
        },
      },
    };

    const combinedQuery: Filter<MarkerDoc> = { ...additionalQuery, ...locationQuery };

    if (radius > 1000) {
      return this.getMarkers(combinedQuery, { sort: { dateUpdated: -1 }, limit: 20 });
    }

    return this.getMarkers(combinedQuery, { sort: { dateUpdated: -1 } });
  }

  // getMarkersWithFilter has been combined with getMarkersInRange
  //   // then filter the markers by the query
  //   async getMarkersWithFilter(query: Filter<MarkerDoc>, centerLocation?: [number, number], zoomLevel?: number) {
  //     if (centerLocation && zoomLevel) {
  //       return this.getMarkersInRange(centerLocation, zoomLevel, query);
  //     }
  //     return this.getMarkers(query);
  //   }

  async update(_id: ObjectId, update: Partial<MarkerDoc>) {
    this.sanitizeUpdate(update);
    await this.markers.updateOne({ _id }, update);
    const marker = await this.markers.readOne({ _id });
    return { msg: "Marker successfully updated!", marker };
  }

  async delete(_id: ObjectId) {
    const marker = await this.markers.readOne({ _id });
    await this.markers.deleteOne({ _id });
    return { msg: "Marker deleted successfully!", marker };
  }

  async addPostId(markerId: ObjectId, postId: ObjectId): Promise<void> {
    const marker = await this.markers.readOne({ _id: markerId });
    if (!marker) {
      throw new NotFoundError(`Marker with id ${markerId} not found.`);
    }

    if (!marker.postIds) {
      marker.postIds = [];
    }

    if (!marker.postIds.includes(postId)) {
      marker.postIds.push(postId);
      await this.markers.updateOne({ _id: markerId }, marker);
    }
  }

  private sanitizeUpdate(update: Partial<MarkerDoc>) {
    const allowedUpdates = ["location", "info", "postIds"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}
