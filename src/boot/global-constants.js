import * as constants from "../assets/constants";
import { boot } from "quasar/wrappers";

export default boot(({ app }) => {
  app.config.globalProperties.$URL = "http://localhost:3000";
  app.config.globalProperties.$ROOM_TYPE = {
    PERSONAL_ROOM: 1,
    ONETOONE_ROOM: 2,
    GROUP_ROOM: 3,
  };
  app.config.globalProperties.$USER_TYPE = {
    USER: 1,
    ADMIN: 2,
    OWNER: 3,
  };

  app.config.globalProperties.$USER_TYPE2TEXT = {
    1: "User",
    2: "Admin",
    3: "Owner",
  };

  app.config.globalProperties.$MESSAGE_TYPE = {
    EVENT: 1,
    TEXT: 2,
    VIDEO: 3,
    IMAGE: 4,
    DOCUMENT: 5,
  };

  app.config.globalProperties.$MESSAGE_TYPE2TEXT = {
    1: "Event",
    2: "Text",
    3: "Video",
    4: "Image",
    5: "Document",
  };
});
