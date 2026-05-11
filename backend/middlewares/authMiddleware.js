import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      next();
    } catch (error) {
      res.status(401).json({
        msg: "Not Authorized ,No token",
      });
    }
  }

  if (!token) {
    res.status(400).json({
      msg: "No Authorized Token found",
    });
  }
};

export default protect;
