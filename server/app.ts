import FriendConcept from "./concepts/friend";
import RelationshipConcept from "./concepts/relationship";

import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import UserConcept from "./concepts/user";

import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Profile = new ProfileConcept();
export const Relationship = new RelationshipConcept();
