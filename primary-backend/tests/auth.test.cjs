jest.mock("../src/config.ts", () => ({ JWT_PASSWORD: "unit-only-secret" }));
jest.mock("jsonwebtoken", () => ({ verify: jest.fn() }));
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../src/middleware.ts");
let req, res, next;
beforeEach(() => {
  req = { headers: {} };
  res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  next = jest.fn();
  jwt.verify.mockReset();
});
test.each([undefined, "", "Bearer ", "null", "undefined"])(
  "rejects missing/empty token %s",
  (value) => {
    req.headers.authorization = value;
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(jwt.verify).not.toHaveBeenCalled();
  },
);
test.each(["Bearer valid-token", "valid-token"])("accepts supported header format %s", (value) => {
  req.headers.authorization = value;
  jwt.verify.mockReturnValue({ id: 7, iat: 100, exp: 43300 });
  authMiddleware(req, res, next);
  expect(jwt.verify).toHaveBeenCalledWith("valid-token", "unit-only-secret", {
    algorithms: ["HS256"],
    maxAge: 43200,
  });
  expect(req.id).toBe("7");
  expect(next).toHaveBeenCalledTimes(1);
  expect(res.status).not.toHaveBeenCalled();
});
test("accepts a string user ID", () => {
  req.headers.authorization = "valid";
  jwt.verify.mockReturnValue({ id: "9", iat: 100, exp: 43300 });
  authMiddleware(req, res, next);
  expect(req.id).toBe("9");
  expect(next).toHaveBeenCalledTimes(1);
});
test.each([
  {},
  null,
  { id: 0 },
  { id: -1 },
  { id: "invalid" },
  { id: "7trailing" },
  { id: 1.5 },
  { id: Infinity },
  { id: Number.MAX_SAFE_INTEGER + 1 },
])("rejects missing or invalid identity %s", (payload) => {
  req.headers.authorization = "valid";
  jwt.verify.mockReturnValue(payload === null ? null : { iat: 100, exp: 43300, ...payload });
  authMiddleware(req, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});
test("rejects failed signature verification", () => {
  req.headers.authorization = "tampered";
  jwt.verify.mockImplementation(() => {
    throw new Error("Invalid signature");
  });
  authMiddleware(req, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});

test.each([{ id: 1 }, { id: 1, iat: 100, exp: 50000 }, { id: 1, iat: 100, exp: 100 }])(
  "rejects missing or excessive expiry %s",
  (payload) => {
    req.headers.authorization = "valid";
    jwt.verify.mockReturnValue(payload);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  },
);
