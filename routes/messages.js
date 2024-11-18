const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const {
  ensureLoggedIn,
  authenticateJWT,
  ensureCorrectUser,
} = require("../middleware/auth");
const ExpressError = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const results = await Message.get(req.params.id);
    //Make sure the user looking at the message is either the sender or receiver:
    if (
      req.user.username !== results.from_user.username ||
      req.user.username !== results.to_user.username
    ) {
      throw new ExpressError("Unauthorized Access", 401);
    }
    return res.json({ results });
  } catch (e) {
    return next(e);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const from_username = req.user.username; //authenicates Posting user
    const { to_username, body } = req.body; //grabs the TO user and the message body from the inputs
    if (!to_username || !body) {
      throw new ExpressError("All Fields Required", 400);
    }
    const message = await Message.create({ from_username, to_username, body });
    return res.status(201).json({ message }); //201 is created code
  } catch (e) {
    return next(e);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
  try {
    const username = req.user.username;
    const message = await Message.get(req.params.id);
    if (username !== message.to_user.username) {
      throw new ExpressError("Unauthorized", 401);
    }
    const results = await Message.markRead(req.params.id);
    return res.status(200).json({ message: results });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
