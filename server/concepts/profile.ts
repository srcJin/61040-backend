import { ObjectId } from "mongodb";

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
    // Check if the user already has a profile
    const existingProfile = await this.getByUser(user);
    if (existingProfile) {
      throw new NotAllowedError("User already has a profile!");
    }

    const _id = await this.profiles.createOne({ user, nickname, email });
    return { msg: "Profile successfully created!", profile: await this.profiles.readOne({ _id }) };
  }

  async getByUser(user: ObjectId): Promise<ProfileDoc | null> {
    return await this.profiles.readOne({ user });
  }

  async update(user: ObjectId, update: Partial<ProfileDoc>) {
    this.sanitizeUpdate(update);
    await this.profiles.updateOne({ user }, update);
    return { msg: "Profile successfully updated!" };
  }

  async delete(user: ObjectId) {
    await this.profiles.deleteOne({ user });
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
