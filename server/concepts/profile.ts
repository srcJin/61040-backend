import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  user: ObjectId;
  nickname: string;
  email: string;
}

export default class ProfileConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");

  async create(user: ObjectId, nickname: string, email: string) {
    const _id = await this.profiles.createOne({ user, nickname, email });
    return { msg: "Profile successfully created!", profile: await this.profiles.readOne({ _id }) };
  }

  async getProfiles(query: Filter<ProfileDoc>) {
    const profiles = await this.profiles.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return profiles;
  }

  async getByUser(user: ObjectId) {
    return await this.getProfiles({ user });
  }

  async update(_id: ObjectId, update: Partial<ProfileDoc>) {
    this.sanitizeUpdate(update);
    await this.profiles.updateOne({ _id }, update);
    return { msg: "Profile successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.profiles.deleteOne({ _id });
    return { msg: "Profile deleted successfully!" };
  }

  async isUser(user: ObjectId, _id: ObjectId) {
    const profile = await this.profiles.readOne({ _id });
    if (!profile) {
      throw new NotFoundError(`Profile ${_id} does not exist!`);
    }
    if (profile.user.toString() !== user.toString()) {
      throw new ProfileUserNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<ProfileDoc>) {
    // Make sure the update cannot change the user.
    const allowedUpdates = ["nickname", "email"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class ProfileUserNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the user of profile {1}!", user, _id);
  }
}
