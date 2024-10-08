import xss from "xss";

const sanitizeData = (data: any) => {
  if (typeof data === "string") {
    return xss(data);
  } else if (typeof data === "object" && data !== null) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        data[key] = sanitizeData(data[key]);
      }
    }
  }
  return data;
};

const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeData(req.body);
  req.query = sanitizeData(req.query);
  req.params = sanitizeData(req.params);
  next();
};

export default sanitizeRequest;
