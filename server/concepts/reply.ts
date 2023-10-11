import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ReplyOptions {
  backgroundColor?: string;
}

export interface ReplyDoc extends BaseDoc {
  author: ObjectId;
  // replies does not have a title
  content: string;
  relatedPost: ObjectId; // different from post, reply has a related post
  tags?: string[];
  options?: ReplyOptions;
}

export default class ReplyConcept {
  public readonly replys = new DocCollection<ReplyDoc>("replys");

  async create(author: ObjectId, content: string, relatedPost: ObjectId, options?: ReplyOptions) {
    const _id = await this.replys.createOne({ author, content, relatedPost, options });
    const reply = await this.replys.readOne({ _id });
    return { msg: "Reply successfully created!", reply, details: this.extractReplyDetails(reply) };
  }

  async getReplys(query: Filter<ReplyDoc>) {
    const replys = await this.replys.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return replys;
  }

  async getRepliesByPost(relatedPost: ObjectId) {
    return await this.getReplys({ relatedPost });
  }

  // async getRepliesByAuthor(author: ObjectId) {
  //   return await this.getReplys({ author });
  // }

  async update(_id: ObjectId, update: Partial<ReplyDoc>) {
    this.sanitizeUpdate(update);
    await this.replys.updateOne({ _id }, update);
    // For testing, remove when final deployment
    const updatedReply = await this.replys.readOne({ _id });
    return { msg: "Reply successfully updated!", details: this.extractReplyDetails(updatedReply) };
  }

  async delete(_id: ObjectId) {
    // for testing, remove when final deployment
    const replyToDelete = await this.replys.readOne({ _id });
    await this.replys.deleteOne({ _id });
    return { msg: "Reply deleted successfully!", details: this.extractReplyDetails(replyToDelete) };
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

  // a helper function for extracting reply details
  private extractReplyDetails(reply?: ReplyDoc | null) {
    if (!reply) {
      throw new NotFoundError("Reply not found.");
    }
    return {
      id: reply._id,
      content: reply.content,
      date: reply.dateUpdated,
      tags: reply.tags,
      relatedPost: reply.relatedPost,
      // add other fields as needed
    };
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
