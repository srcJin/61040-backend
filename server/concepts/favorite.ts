import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export type FavoriteType = "post" | "reply"; // Add more types as necessary

// Here we generaized the favorite concept to allow for multiple types of items
export interface FavoriteDoc extends BaseDoc {
  user: ObjectId;
  type: FavoriteType;
  entityIds: ObjectId[]; // the eneityIds is the list of the catagory of that type, each user can have multiple favorite lists for each types
}

export default class FavoriteConcept {
  public readonly favorites = new DocCollection<FavoriteDoc>("favorites");

  async addFavorite(user: ObjectId, type: FavoriteType, entityId: ObjectId) {
    const existing = await this.favorites.readOne({ user, type });

    if (!existing) {
      await this.favorites.createOne({ user, type, entityIds: [entityId] });
    } else {
      if (existing.entityIds.includes(entityId)) {
        throw new AlreadyFavoritedError(user, type, entityId);
      } else {
        const updatedEntityIds = [...existing.entityIds, entityId];
        await this.favorites.updateOne({ user, type }, { entityIds: updatedEntityIds });
      }
    }
    return { msg: "Added to favorites!" };
  }

  async removeFavorite(user: ObjectId, type: FavoriteType, entityId: ObjectId) {
    const existing = await this.favorites.readOne({ user, type });
    const idToRemove = entityId;

    if (!existing || !existing.entityIds.includes(entityId)) {
      throw new FavoriteNotFoundError(user, type, entityId);
    }

    if (existing.entityIds.length === 1) {
      // If there's only one entityId left, remove the entire document
      await this.favorites.deleteOne({ user, type });
    } else {
      // filter out the entityId from the list, and create a new entityIds list
      const updatedEntityIds = existing.entityIds.filter((id) => id.toString() != entityId.toString());
      await this.favorites.updateOne({ user, type }, { entityIds: updatedEntityIds });
    }

    return { msg: "Removed from favorites!", id: idToRemove };
  }

  async getFavorites(user: ObjectId, type?: FavoriteType) {
    const query: Partial<FavoriteDoc> = { user };
    if (type) {
      query.type = type;
    }
    const favorites = await this.favorites.readMany(query);
    console.log("getFavorites", favorites);
    return favorites.flatMap((fav) => fav.entityIds);
  }
}

export class AlreadyFavoritedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly type: FavoriteType,
    public readonly entityId: ObjectId,
  ) {
    super("{2} of type {1} is already in the favorites of user {0}!", user, type, entityId);
  }
}

export class FavoriteNotFoundError extends NotFoundError {
  constructor(
    public readonly user: ObjectId,
    public readonly type: FavoriteType,
    public readonly entityId: ObjectId,
  ) {
    super("{2} of type {1} by user {0} does not exist in favorites!", user, type, entityId);
  }
}
