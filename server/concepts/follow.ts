// follow doesn't need approval
export interface FollowRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
}
