const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const User = require("../models/user");
const Message = require("../models/message");

const {
  ensureLoggedIn,
  authenticateJWT,
  ensureCorrectUser,
} = require("../middleware/auth");

router.get("/", (req, res, next) => {
  res.send("APP IS WORKING!!!");
});

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError("Username and Password Required", 400);
    }
    if (await User.authenticate(username, password)) {
      let token = jwt.sign({ username }, SECRET_KEY);
      await User.updateLoginTimestamp(username);
      return res.json({ token });
    } else {
      throw new ExpressError("Invalid Username/Password", 400);
    }
  } catch (e) {
    return next(e);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError("All Fields Required", 400);
    }
    const user = await User.register({
      username,
      password,
      first_name,
      last_name,
      phone,
    });
    const token = jwt.sign({ username }, SECRET_KEY);
    await User.updateLoginTimestamp(username);

    return res.json({ token });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
