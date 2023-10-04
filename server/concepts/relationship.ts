import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface RelationshipDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
  type: string;
}

// follow doesn't need approval
export interface FollowRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
}

// friend need approval
export interface FriendRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";
}

// partner need approval
export interface PartnerRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";
}

export default class RelationshipConcept {
  public readonly friends = new DocCollection<RelationshipDoc>("friends");
  public readonly partners = new DocCollection<RelationshipDoc>("partners");
  public readonly friendRequests = new DocCollection<FriendRequestDoc>("friendRequests");
  public readonly partnerRequests = new DocCollection<PartnerRequestDoc>("partnerRequests");

  async getFriendRequests(user: ObjectId) {
    return await this.friendRequests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }

  async getPartnerRequests(user: ObjectId) {
    return await this.partnerRequests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }

  async sendFriendRequest(from: ObjectId, to: ObjectId) {
    await this.canSendRequest(from, to);
    await this.friendRequests.createOne({ from, to, status: "pending" });
    return { msg: "Sent friend request!" };
  }

  async sendPartnerRequest(from: ObjectId, to: ObjectId) {
    await this.canSendRequest(from, to);
    await this.partnerRequests.createOne({ from, to, status: "pending" });
    return { msg: "Sent partner request!" };
  }

  async acceptFriendRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    // Following two can be done in parallel, thus we use `void`
    void this.friendRequests.createOne({ from, to, status: "accepted" });
    void this.addFriend(from, to);
    return { msg: "Accepted friend request!" };
  }

  async acceptPartnerRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    // Following two can be done in parallel, thus we use `void`
    void this.partnerRequests.createOne({ from, to, status: "accepted" });
    void this.addPartner(from, to);
    return { msg: "Accepted partner request!" };
  }

  async rejectRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    await this.friendRequests.createOne({ from, to, status: "rejected" });
    return { msg: "Rejected request!" };
  }

  async removeRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    return { msg: "Removed request!" };
  }

  async removeFriend(user: ObjectId, friend: ObjectId) {
    const friendship = await this.friends.popOne({
      $or: [
        { user1: user, user2: friend },
        { user1: friend, user2: user },
      ],
    });
    if (friendship === null) {
      throw new FriendNotFoundError(user, friend);
    }
    return { msg: "Unfriended!" };
  }

  // this need further debug, user must be friends before becoming partners
  async removePartner(user: ObjectId, friend: ObjectId) {
    const friendship = await this.partners.popOne({
      $or: [
        { user1: friend, user2: user },
        { user1: user, user2: friend },
      ],
    });
    if (friendship === null) {
      throw new FriendNotFoundError(user, friend);
    }
    return { msg: "Unfriended!" };
  }

  async getRelationships(user: ObjectId) {
    // Fetch friendships
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });

    // Fetch partnerships
    const partnerships = await this.partners.readMany({
      $or: [{ user1: user }, { user2: user }],
    });

    // Extract friend IDs
    const friendIds = friendships.map((friendship) => (friendship.user1.toString() === user.toString() ? friendship.user2 : friendship.user1));

    // Extract partner IDs
    const partnerIds = partnerships.map((partnership) => (partnership.user1.toString() === user.toString() ? partnership.user2 : partnership.user1));

    // Return relationships
    return {
      friends: friendIds,
      partners: partnerIds,
    };
  }

  async getFriends(user: ObjectId) {
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    // Making sure to compare ObjectId using toString()
    return friendships.map((friendship) => (friendship.user1.toString() === user.toString() ? friendship.user2 : friendship.user1));
  }

  async getPartners(user: ObjectId) {
    const friendships = await this.partners.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    // Making sure to compare ObjectId using toString()
    return friendships.map((friendship) => (friendship.user1.toString() === user.toString() ? friendship.user2 : friendship.user1));
  }

  private async addFriend(user1: ObjectId, user2: ObjectId) {
    void this.friends.createOne({ user1, user2 });
  }

  private async addPartner(user1: ObjectId, user2: ObjectId) {
    void this.partners.createOne({ user1, user2 });
  }

  private async removePendingRequest(from: ObjectId, to: ObjectId) {
    const request = await this.friendRequests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new FriendRequestNotFoundError(from, to);
    }
    return request;
  }

  // will change this part later for partners error handling

  private async isNotFriends(u1: ObjectId, u2: ObjectId) {
    const friendship = await this.friends.readOne({
      $or: [
        { user1: u1, user2: u2 },
        { user1: u2, user2: u1 },
      ],
    });
    if (friendship !== null || u1.toString() === u2.toString()) {
      throw new AlreadyFriendsError(u1, u2);
    }
  }

  private async canSendRequest(u1: ObjectId, u2: ObjectId) {
    await this.isNotFriends(u1, u2);
    // check if there is pending request between these users
    const request = await this.friendRequests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      status: "pending",
    });
    if (request !== null) {
      throw new FriendRequestAlreadyExistsError(u1, u2);
    }
  }
}

export class FriendRequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request from {0} to {1} does not exist!", from, to);
  }
}

export class FriendRequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request between {0} and {1} already exists!", from, to);
  }
}

export class FriendNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Friendship between {0} and {1} does not exist!", user1, user2);
  }
}

export class AlreadyFriendsError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("{0} and {1} are already friends!", user1, user2);
  }
}
