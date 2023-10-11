import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export type MarkerType = "User" | "POI";

export interface MarkerDoc extends BaseDoc {
  location: [number, number]; // [lng, lat]
  referenceId: ObjectId; // This will be either a user ID or a POI ID based on the type
  type: MarkerType;
  info?: string; // info is optional, only for "POI" type
  postIds?: ObjectId[]; // postIds is optional, only for "User" type
}

export default class MarkerConcept {
  public readonly markers = new DocCollection<MarkerDoc>("markers");

  async create(location: [number, number], referenceId: ObjectId, type: MarkerType, info?: string, postIds?: ObjectId[]): Promise<{ msg: string; marker: MarkerDoc }> {
    const _id = await this.markers.createOne({
      location,
      referenceId,
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

  async getMarkers(query: Filter<MarkerDoc>) {
    const markers = await this.markers.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return markers;
  }

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
