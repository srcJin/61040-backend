import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

// Configuration options for tags
export interface TagOptions {
  Color?: string;
  Required?: boolean; // This may need further clarification, but for now, I'll include it.
}

// Individual tag that contains the id of the items it is assigned to
export interface TagDoc extends BaseDoc {
  name: string; // Name of the tag
  // ChatGPT: MongoDB doesn't natively support the JavaScript Set object, and when you store it, it's likely being stored as an array.
  owns: ObjectId[]; // Items which this tag is assigned to
  options?: TagOptions; // Options for this tag
}

export default class TagConcept {
  public readonly tags = new DocCollection<TagDoc>("tags");

  // create a new tag
  // fixed: has bug where you can create a tag with the same name as an existing tag
  // fixed: has bug that can create empty name tag
  async createTag(name: string) {
    console.log("Creating tag...");

    // Check if the name is empty, undefined, null, or contains only whitespace
    if (!name || !name.trim()) {
      throw new NotAllowedError("Tag name cannot be empty or just whitespace!");
    }

    // Check if a tag with the given name already exists
    const existingTag = await this.tags.readOne({ name });
    if (existingTag) {
      throw new NotAllowedError("Tag with this name already exists!");
    }

    const _id = await this.tags.createOne({ name, owns: [] });
    console.log("Created tag with ID:", _id);
    const tag = await this.getTagById(_id);
    return { msg: "Tag successfully created!", tag };
  }

  // assign a tag to an item
  async assignTagToItem(tagId: ObjectId, itemId: ObjectId) {
    console.log("Assigning tag to item...");
    const tag = await this.getTagById(tagId);
    if (!tag) {
      throw new NotAllowedError(`Tag ${tagId} does not exist!`);
    }
    if (!tag.owns.includes(itemId)) {
      tag.owns.push(itemId);
      await this.tags.updateOne({ _id: tagId }, tag);
    }

    return tag;
  }

  // helper function to get tag by id
  async getTagById(_id: ObjectId) {
    console.log("Fetching tag name by ID:", _id);
    return await this.tags.readOne({ _id });
  }

  // get the tags currently avaliable
  async getAllTags(query?: Filter<TagDoc>) {
    console.log("Fetching all tags...");
    const tags = await this.tags.readMany(query || {});
    if (!tags || tags.length === 0) {
      return { msg: "No tags found.", tags: [] };
    }
    return { msg: "Tags fetched successfully!", tags: tags };
  }

  // get the tags currently assigned to an item
  async getTagsByItemId(itemId: ObjectId) {
    console.log("Fetching tags by item ID:", itemId);
    const tags = await this.tags.readMany({ owns: { $in: [itemId] } });
    if (!tags || tags.length === 0) {
      return { msg: `No tags found for item with ID ${itemId}.`, tags: [] };
    }
    return { msg: `Tags fetched successfully for item ID ${itemId}!`, tags: tags };
  }

  async getItemsByTagId(tagId: ObjectId) {
    console.log("Fetching items by tag ID:", tagId);
    const tag = await this.tags.readOne({ _id: tagId });
    if (!tag) {
      return { msg: `Tag with ID ${tagId} does not exist.`, items: [] };
    }
    return { msg: `Items fetched successfully for tag ID ${tagId}!`, items: tag.owns };
  }

  async updateTag(_id: ObjectId, update: Partial<TagDoc>) {
    this.sanitizeUpdate(update);
    await this.tags.updateOne({ _id }, update);
    const updatedTag = await this.getTagById(_id);
    if (!updatedTag) {
      return { msg: `Tag with ID ${_id} does not exist.`, tag: null };
    }
    return { msg: `Tag with ID ${_id} updated successfully!`, tag: updatedTag };
  }

  async deleteTag(_id: ObjectId) {
    console.log("Deleting tag...");
    const deleted = await this.tags.deleteOne({ _id });
    if (deleted.deletedCount === 0) {
      return { msg: `Tag with ID ${_id} does not exist or was not deleted.`, success: false };
    }
    return { msg: `Tag with ID ${_id} deleted successfully!`, success: true };
  }

  private sanitizeUpdate(update: Partial<TagDoc>) {
    const allowedUpdates = ["name", "owns", "options"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

// we don't need a tag list at this stage, we can just read the existing tags from the database
// export class TagList {
//   public readonly tagLists = new DocCollection<TagListDoc>("tagLists");

//   async createTagList(tags: string[], options?: TagOptions[]) {
//     console.log("Creating tag list...");
//     const _id = await this.tagLists.createOne({ tags, options });
//     console.log("Created tag list with ID:", _id);
//     return await this.getTagListById(_id);
//   }

//   async getAllTagLists() {
//     console.log("Fetching all tag lists...");
//     return await this.tagLists.readMany({});
//   }

//   async getTagListById(_id: ObjectId) {
//     console.log("Fetching tag list by ID:", _id);
//     return await this.tagLists.readOne({ _id });
//   }

//   async updateTagList(_id: ObjectId, update: Partial<TagListDoc>) {
//     console.log("Updating tag list...");
//     await this.tagLists.updateOne({ _id }, update);
//     return await this.getTagListById(_id);
//   }

//   async deleteTagList(_id: ObjectId) {
//     console.log("Deleting tag list...");
//     return await this.tagLists.deleteOne({ _id });
//   }
// }
