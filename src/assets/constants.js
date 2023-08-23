export const URL = "http://localhost:3000";

export const ROOM_TYPE = {
  PERSONAL_ROOM: 1,
  ONETOONE_ROOM: 2,
  GROUP_ROOM: 3,
};

export const USER_TYPE = {
  USER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const USER_TYPE2TEXT = {
  1: "User",
  2: "Admin",
  3: "Owner",
};

export const MESSAGE_TYPE = {
  EVENT: 1,
  TEXT: 2,
  VIDEO: 3,
  IMAGE: 4,
  DOCUMENT: 5,
};

export const MESSAGE_TYPE2TEXT = {
  1: "Event",
  2: "Text",
  3: "Video",
  4: "Image",
  5: "Document",
};

export const getURLFromFile = ((file) => {
  return window.URL.createObjectURL(file);
})

export const getFileFromUrl = (async (url, name, defaultType = 'image/jpeg') => {
  const response = await fetch(url);
  const data = await response.blob();
  return new File([data], name, {
    type: data.type || defaultType,
  })
})
