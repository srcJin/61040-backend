import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ReplyOptions {
  backgroundColor?: string;
}

export type ReplyType = "comment" | "answer";

export interface ReplyDoc extends BaseDoc {
  author: ObjectId;
  // replies does not have a title
  replyType: ReplyType; // Added type field
  content: string;
  relatedPost: ObjectId; // different from post, reply has a related post
  options?: ReplyOptions;
}

export default class ReplyConcept {
  public readonly replys = new DocCollection<ReplyDoc>("replys");

  async create(author: ObjectId, content: string, replyType: ReplyType, relatedPost: ObjectId, options?: ReplyOptions) {
    console.log("Creating reply...");
    const _id = await this.replys.createOne({ author, content, replyType, relatedPost, options });
    console.log("Created reply with ID:", _id);
    const reply = await this.replys.readOne({ _id });
    console.log("Fetched reply:", reply);
    return { msg: "Reply successfully created!", reply };
  }

  async getReplys(query: Filter<ReplyDoc>) {
    console.log("Getting replys with query:", query);
    const replys = await this.replys.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return replys;
  }

  async getRepliesByPostId(queryPostID: ObjectId) {
    console.log("Getting replies by post ID:", queryPostID);
    return await this.getReplys({ relatedPost: queryPostID });
  }

  // async getRepliesByAuthor(author: ObjectId) {
  //   return await this.getReplys({ author });
  // }

  async update(_id: ObjectId, update: Partial<ReplyDoc>) {
    this.sanitizeUpdate(update);
    await this.replys.updateOne({ _id }, update);
    // For testing, remove when final deployment
    const updatedReply = await this.replys.readOne({ _id });
    return { msg: "Reply successfully updated!", updatedReply };
  }

  async delete(_id: ObjectId) {
    // for testing, remove when final deployment
    const replyToDelete = await this.replys.readOne({ _id });
    await this.replys.deleteOne({ _id });
    return { msg: "Reply deleted successfully!", replyToDelete };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const reply = await this.replys.readOne({ _id });
    if (!reply) {
      throw new NotFoundError(`Reply ${_id} does not exist!`);
    }
    if (reply.author.toString() !== user.toString()) {
      throw new ReplyAuthorNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<ReplyDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "options"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class ReplyAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of reply {1}!", author, _id);
  }
}
