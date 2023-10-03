import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Friend, Post, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  // User routes
  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  // Authentication routes

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  // Posts routes

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  // Friends routes

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // Profile[User] routes

  @Router.get("users/:username/profile")
  async getProfile(username: string) {
    return null;
  }

  @Router.post("users/:username/profile")
  async createProfile(session: WebSessionDoc, profileData: string) {
    return null;
  }

  @Router.patch("users/:username/profile")
  async updateProfile(session: WebSessionDoc, profileData: string) {
    return null;
  }

  @Router.delete("users/:username/profile")
  async deleteProfile(session: WebSessionDoc) {
    return null;
  }

  // Map routes
  // Map concept is different, need ask TA
  // we are using an API to draw an app at the front end
  // So the data the backend should provide is what the API need
  // functions, like zoom, will only rely on frontend
  // will need to check the API (probably leaflet) to better understand this part.

  // Create a map using Leaflet API ?
  @Router.post("/map")
  async createMap() {
    return null;
  }

  // Update an existing map's center point
  @Router.patch("/map")
  async updateMap(session: WebSessionDoc, centerPoint: string) {
    return null;
  }

  // Delete the map (don't know if necessary )
  @Router.delete("/map")
  async deleteMap(session: WebSessionDoc) {
    return null;
  }

  // Marker[Map] routes

  @Router.get("/map/markers")
  async getMarkers(mapId: ObjectId) {
    return null;
  }

  @Router.post("/map/markers")
  async createMarker(session: WebSessionDoc, location: string) {
    return null;
  }

  @Router.put("/map/markers/:markerId")
  async updateMarker(session: WebSessionDoc, mapId: ObjectId, markerId: ObjectId, updatedData: string) {
    return null;
  }

  @Router.delete("/map/markers/:markerId")
  async deleteMarker(session: WebSessionDoc, mapId: ObjectId, markerId: ObjectId) {
    return null;
  }

  // Location[User] routes
  // Retrieve a specific location by current User
  @Router.get("users/:username/location")
  async getSelfLocation(session: WebSessionDoc) {
    return null;
  }

  @Router.get("users/:username/location")
  async getUserLocation(_id: ObjectId) {
    return null;
  }

  @Router.patch("users/:username/location")
  async updateLocation(session: WebSessionDoc, newLocation: string) {
    return null;
  }

  // Nearby routes：
  @Router.get("/locations/nearby")
  async getNearbyUsers(location: string, radius?: number) {
    return null;
  }

  // Nearby routes：
  @Router.get("/locations/nearby")
  async getNearbyPOIs(location: string, radius?: number) {
    return null;
  }

  // Reply[Post] routes

  @Router.get("/posts/:_id/replies")
  async getReplies(postId: ObjectId) {
    return null;
  }

  @Router.post("/posts/:_id/replies")
  async createReply(session: WebSessionDoc, content: string) {
    return null;
  }

  // Favorite[Post] routes

  @Router.post("/posts/:_id/favorite")
  async favoritePost(session: WebSessionDoc, postId: ObjectId) {
    return null;
  }

  @Router.delete("/posts/:_id/favorite")
  async unfavoritePost(session: WebSessionDoc, postId: ObjectId) {
    return null;
  }

  // Like[Post] routes

  @Router.post("/posts/:_id/like")
  async likePost(session: WebSessionDoc, postId: ObjectId) {
    return null;
  }

  @Router.delete("/posts/:_id/like")
  async unlikePost(session: WebSessionDoc, postId: ObjectId) {
    return null;
  }

  // Tag routes

  @Router.get("/posts/:_id/:tag")
  async getPostsByTag(tag: string) {
    return null;
  }

  @Router.get("/posts/replies/:tag")
  async getRepliesByTag(tag: string) {
    return null;
  }
}

export default getExpressRouter(new Routes());
