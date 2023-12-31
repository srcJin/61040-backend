type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  // User related operations
  {
    name: "[Session] Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "[User] Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "[User] Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "[User] Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "[User] Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "[User] Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "[User] Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "[Profile] Create User Profile by Username",
    endpoint: "/api/profile/:username",
    method: "POST",
    fields: { username: "input", nickname: "input", email: "input", headshotUrl: "input", lastLocation: "input" },
  },
  {
    name: "[Profile] Get User Profile by Username",
    endpoint: "/api/profile/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "[Profile] Update User Profile by Username",
    endpoint: "/api/profile/:username",
    method: "PATCH",
    fields: { username: "input", update: { nickname: "input", email: "input" } },
  },
  {
    name: "[Profile] Delete User Profile by Username",
    endpoint: "/api/profile/:username",
    method: "DELETE",
    fields: { username: "input" },
  },
  // useful apis for getting and update user location
  {
    name: "[Profile] Get User Location by Username",
    endpoint: "/api/profile/:username/location",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "[Profile] Update User Location by Username",
    endpoint: "/api/profile/:username/location",
    method: "PATCH",
    fields: { username: "input", location: "input" },
  },
  // Post-reply related operations
  {
    name: "[Post] Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { title: "input", content: "input", postType: "input", options: { backgroundColor: "input", visibility: "input" } },
  },
  {
    name: "[Post] Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input", title: "input", postType: "input" },
  },
  {
    name: "[Post] Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { title: "input", content: "input", postType: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "[Post] Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },

  {
    name: "[Reply] Create Reply on Post",
    endpoint: "/api/replies/:_postId",
    method: "POST",
    fields: { id: "input", content: "input", replyType: "input" },
  },
  {
    name: "[Reply] Get Replies by Post ID",
    endpoint: "/api/replies/:_postId",
    method: "GET",
    fields: { id: "input", replyType: "input" },
  },
  {
    name: "[Reply] Update Reply on Post",
    endpoint: "/api/replies/:_postId/:_replyId",
    method: "PATCH",
    fields: { id: "input", replyId: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "[Reply] Delete Reply on Post",
    endpoint: "/api/replies/:_postId/:_replyId",
    method: "DELETE",
    fields: { id: "input", replyId: "input" },
  },
  // Favorite related operations
  {
    name: "[Favorite] Add Post to Favorites",
    endpoint: "/api/favorites/post/:_id",
    method: "POST",
    fields: { id: "input" },
  },
  {
    name: "[Favorite] Remove Post from Favorites",
    endpoint: "/api/favorites/post/:_id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "[Favorite] Add Reply to Favorites",
    endpoint: "/api/favorites/reply/:_id",
    method: "POST",
    fields: { postId: "input", replyId: "input" },
  },
  {
    name: "[Favorite] Remove Reply from Favorites",
    endpoint: "/api/favorites/reply/:_id",
    method: "DELETE",
    fields: { postId: "input", replyId: "input" },
  },
  {
    name: "[Favorite] Get All Favorite Posts and Replies",
    endpoint: "/api/favorites",
    method: "GET",
    fields: {}, // No fields required to fetch all favorites for a user
  },
  // Like related operations
  {
    name: "[Like] Add Post to Likes",
    endpoint: "/api/likes/post/:id",
    method: "POST",
    fields: { id: "input" },
  },
  {
    name: "[Like] Remove Post from Likes",
    endpoint: "/api/likes/post/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "[Like] Add Reply to Likes",
    endpoint: "/api/likes/reply/:_id",
    method: "POST",
    fields: { _id: "input" },
  },
  {
    name: "[Like] Remove Reply from Likes",
    endpoint: "/api/likes/reply/:_id",
    method: "DELETE",
    fields: { _id: "input" },
  },
  // Keep the other endpoints as they are since they were not provided in the router functions.
  {
    name: "[Like] Get All Liked Posts and Replies",
    endpoint: "/api/likes",
    method: "GET",
    fields: {},
  },
  {
    name: "[Like] Get Like Count for a Post",
    endpoint: "/api/likes/post/:_id/like-count",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "[Like] Get Like Count for a Reply",
    endpoint: "/api/likes/reply/:_id/like-count",
    method: "GET",
    fields: { _id: "input" },
  },

  // Relationship related operations
  {
    name: "[Relationship] Follow a User",
    endpoint: "/api/relationships/follow/:usernameToFollow",
    method: "POST",
    fields: { usernameToFollow: "input" },
  },
  {
    name: "[Relationship] Get All Relationships",
    endpoint: "/api/relationships",
    method: "GET",
    fields: {},
  },
  {
    name: "[Relationship] Remove a Relationship with a target user",
    endpoint: "/api/relationships/:type/:target",
    method: "DELETE",
    fields: { type: "input", target: "input" },
  },
  {
    name: "[Relationship] Get Relationship Requests",
    endpoint: "/api/relationships/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "[Relationship] Send Relationship Request",
    endpoint: "/api/relationships/requests/:to/:type",
    method: "POST",
    fields: { to: "input", type: "input" },
  },
  {
    name: "[Relationship] Remove Relationship Request",
    endpoint: "/api/relationships/requests/:to",
    method: "DELETE",
    fields: { to: "input" },
  },
  {
    name: "[Relationship] Accept Relationship Request",
    endpoint: "/api/relationships/accept/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "[Relationship] Reject Relationship Request",
    endpoint: "/api/relationships/reject/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "[Marker] Create Marker",
    endpoint: "/api/markers",
    method: "POST",
    fields: {
      location: "input",
      itemId: "input",
      type: "input",
      info: "input",
      postIds: "input",
    },
  },
  {
    name: "[Marker] Get Markers",
    endpoint: "/api/markers",
    method: "GET",
    fields: {
      itemId: "input",
      type: "input",
      location: "input",
      zoomLevel: "input",
    },
  },
  {
    name: "[Marker] Update Marker",
    endpoint: "/api/markers/:id",
    method: "PATCH",
    fields: {
      id: "input",
      update: {
        location: "input",
        info: "input",
        postIds: "input",
      },
    },
  },
  {
    name: "[Marker] Delete Marker",
    endpoint: "/api/markers/:id",
    method: "DELETE",
    fields: {
      id: "input",
    },
  },
  {
    name: "[Tag] Create Tag",
    endpoint: "/api/tags",
    method: "POST",
    fields: { name: "input" },
  },

  {
    name: "[Tag] Get All Tags",
    endpoint: "/api/tags",
    method: "GET",
    fields: {},
  },
  {
    name: "[Tag] Update Tag by ID",
    endpoint: "/api/tags/:tagId",
    method: "PATCH",
    fields: { tagId: "input", update: { name: "input", options: "input" } },
  },
  {
    name: "[Tag] Delete Tag by ID",
    endpoint: "/api/tags/:tagId",
    method: "DELETE",
    fields: { tagId: "input" },
  },
  {
    name: "[Tag] Assign Tag to Item",
    endpoint: "/api/tags/:tagId/items/:itemId",
    method: "POST",
    fields: { tagId: "input", itemId: "input" },
  },
  {
    name: "[Tag] Get Items by Tag ID",
    endpoint: "/api/tags/:tagId/items",
    method: "GET",
    fields: { tagId: "input" },
  },
  {
    name: "[Tag] Get Tags by Item ID",
    endpoint: "/api/tags/:itemId/tags",
    method: "GET",
    fields: { tagId: "input" },
  },
  {
    name: "[Map] Create Map",
    endpoint: "/api/map",
    method: "POST",
    fields: {},
  },
  {
    name: "[Map] Get Map State",
    endpoint: "/api/map/state",
    method: "GET",
    fields: {},
  },
  {
    name: "[Map] Set Center Point",
    endpoint: "/api/map/centerpoint",
    method: "PATCH",
    fields: {
      lng: "input",
      lat: "input",
    },
  },
  {
    name: "[Map] Set Zoom Level",
    endpoint: "/api/map/zoomlevel",
    method: "PATCH",
    fields: {
      zoom: "input",
    },
  },
  {
    name: "[Map] Add Layer",
    endpoint: "/api/map/layer",
    method: "POST",
    fields: {
      layer: "input",
    },
  },
  {
    name: "[Map] Remove Layer",
    endpoint: "/api/map/layer",
    method: "DELETE",
    fields: {
      layer: "input",
    },
  },
  {
    name: "[Map] Set Theme",
    endpoint: "/api/map/theme",
    method: "PATCH",
    fields: {
      theme: "input",
    },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
