import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export enum RelType {
  Friend = "friend",
  Partner = "partner",
}

export interface RelationshipDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
  relType: RelType;
}

export interface RequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  relType: RelType;
  status: "pending" | "rejected" | "accepted";
}

export default class RelationshipConcept {
  private readonly relationships = new DocCollection<RelationshipDoc>("relationships");
  private readonly requests = new DocCollection<RequestDoc>("requests");

  async getRequests(user: ObjectId, type: RelType) {
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
      type: type,
    });
  }

  async sendRequest(from: ObjectId, to: ObjectId, relType: RelType) {
    await this.canSendRequest(from, to, relType);
    await this.requests.createOne({ from, to, relType, status: "pending" });
    return { msg: `Sent ${relType} request!` };
  }

  async acceptRequest(from: ObjectId, to: ObjectId, relType: RelType) {
    await this.removePendingRequest(from, to, relType);
    void this.requests.createOne({ from, to, relType, status: "accepted" });
    void this.addRelationship(from, to, relType);
    return { msg: `Accepted ${relType} request!` };
  }

  async rejectRequest(from: ObjectId, to: ObjectId, relType: RelType) {
    await this.removePendingRequest(from, to, relType);
    await this.requests.createOne({ from, to, relType, status: "rejected" });
    return { msg: `Rejected ${relType} request!` };
  }

  async removeRequest(from: ObjectId, to: ObjectId, relType: RelType) {
    await this.removePendingRequest(from, to, relType);
    return { msg: `Removed ${relType} request!` };
  }

  async removeRelationship(user: ObjectId, target: ObjectId, relType: RelType) {
    const relationship = await this.relationships.popOne({
      $or: [
        { user1: user, user2: target },
        { user1: target, user2: user },
      ],
      relType: RelType,
    });
    if (!relationship) {
      throw new RelationshipNotFoundError(user, target, relType);
    }
    return { msg: `Removed ${relType}!` };
  }

  async getRelationships(user: ObjectId, relType: RelType) {
    const relationships = await this.relationships.readMany({
      $or: [{ user1: user }, { user2: user }],
      relType: relType, // Fixed here
    });
    return relationships.map((rel) => (rel.user1.toString() === user.toString() ? rel.user2 : rel.user1));
  }

  private async addRelationship(user1: ObjectId, user2: ObjectId, relType: RelType) {
    void this.relationships.createOne({ user1, user2, relType });
  }

  private async removePendingRequest(from: ObjectId, to: ObjectId, relType: RelType) {
    const request = await this.requests.popOne({ from, to, relType, status: "pending" }); // Fixed here
    if (!request) {
      throw new RequestNotFoundError(from, to, relType);
    }
    return request;
  }

  // the "parter" can only be requested when two users become a "friend"
  // a helper function for checking if two users are friends
  private async areFriends(user1: ObjectId, user2: ObjectId): Promise<boolean> {
    const friendship = await this.relationships.readOne({
      $or: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 },
      ],
      relType: RelType.Friend,
    });
    return !!friendship;
  }

  private async canSendRequest(u1: ObjectId, u2: ObjectId, relType: RelType) {
    const relationship = await this.relationships.readOne({
      $or: [
        { user1: u1, user2: u2 },
        { user1: u2, user2: u1 },
      ],
      relType: relType, // Fixed here
    });

    // request for "partner" relationship is only avaliable when they are friends
    if (relType === RelType.Partner && !(await this.areFriends(u1, u2))) {
      throw new NotAllowedError(`Cannot request ${RelType.Partner} relationship unless both users are friends.`);
    }

    if (relationship || u1.toString() === u2.toString()) {
      throw new AlreadyRelatedError(u1, u2, relType);
    }

    const request = await this.requests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      relType: relType, // Fixed here
      status: "pending",
    });
    if (request) {
      throw new RequestAlreadyExistsError(u1, u2, relType);
    }
  }
}

// Errors
export class RequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
    public readonly relType: RelType,
  ) {
    super(`${relType} request from ${from} to ${to} does not exist!`); // fixed here
  }
}

export class RequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
    public readonly relType: RelType,
  ) {
    super(`${relType} request between ${from} and ${to} already exists!`); // fixed here
  }
}

export class RelationshipNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
    public readonly relType: RelType,
  ) {
    super(`Relationship of type ${relType} between ${user1} and ${user2} does not exist!`); // fixed here
  }
}

export class AlreadyRelatedError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
    public readonly relType: RelType,
  ) {
    super(`${user1} and ${user2} are already in a ${relType} relationship!`); // fixed here
  }
}
