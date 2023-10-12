import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

// Don't know if this is a solution. Maybe it's better to calculate from all the posts and replies
export type LikeType = "post" | "reply";

export interface LikeDoc extends BaseDoc {
  user: ObjectId;
  type: LikeType;
  entityId: ObjectId; // the entityId of the item being liked
}

export default class LikeConcept {
  public readonly likes = new DocCollection<LikeDoc>("likes");

  async addLike(user: ObjectId, type: LikeType, entityId: ObjectId) {
    const existing = await this.likes.readOne({ user, type, entityId });

    if (existing) {
      throw new AlreadyLikedError(user, type, entityId);
    } else {
      await this.likes.createOne({ user, type, entityId });
    }
    return { msg: "Liked!" };
  }

  async removeLike(user: ObjectId, type: LikeType, entityId: ObjectId) {
    const existing = await this.likes.readOne({ user, type, entityId });

    if (!existing) {
      throw new LikeNotFoundError(user, type, entityId);
    } else {
      await this.likes.deleteOne({ user, type, entityId });
    }
    return { msg: "Like removed!" };
  }

  async getUserLikes(user: ObjectId, type?: LikeType) {
    const query: Partial<LikeDoc> = { user };
    if (type) {
      query.type = type;
    }
    const likes = await this.likes.readMany(query);
    return likes.map((like) => like.entityId);
  }

  async getLikeCount(type: LikeType, entityId: ObjectId) {
    const likes = await this.likes.readMany({ type, entityId });
    console.log("getLikeCount", likes);
    console.log("getLikeCount", await this.likes.readMany({}));
    console.log("getLikeCount, query", await this.likes.readMany({ type: "post", entityId }));
    return likes.length;
  }
}

export class AlreadyLikedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly type: LikeType,
    public readonly entityId: ObjectId,
  ) {
    super("{2} of type {1} is already liked by user {0}!", user, type, entityId);
  }
}

export class LikeNotFoundError extends NotFoundError {
  constructor(
    public readonly user: ObjectId,
    public readonly type: LikeType,
    public readonly entityId: ObjectId,
  ) {
    super("{2} of type {1} by user {0} does not exist in likes!", user, type, entityId);
  }
}
