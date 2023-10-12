import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PostOptions {
  backgroundColor?: string;
}

export type PostType = "article" | "quesiton" | "wiki";

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  title: string;
  content: string;
  postType: PostType; // Added type field
  options?: PostOptions;
}

export default class PostConcept {
  public readonly posts = new DocCollection<PostDoc>("posts");

  async create(author: ObjectId, title: string, content: string, postType: PostType, options?: PostOptions) {
    const _id = await this.posts.createOne({ author, title, content, postType, options }); // Added type to the creation
    const post = await this.posts.readOne({ _id });
    return { msg: "Post successfully created!", post };
  }

  async getPosts(query: Filter<PostDoc>) {
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getByAuthor(author: ObjectId) {
    return await this.getPosts({ author });
  }

  // a shortcut method to return posts type by id
  async getPostType(_id: ObjectId): Promise<PostType> {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    return post.postType;
  }

  async update(_id: ObjectId, update: Partial<PostDoc>) {
    this.sanitizeUpdate(update);
    await this.posts.updateOne({ _id }, update);
    const post = await this.posts.readOne({ _id });
    return { msg: "Post successfully updated!", post };
  }

  async delete(_id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!", post };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new PostAuthorNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<PostDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "options", "title", "type"]; // Added type to the allowed updates
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
