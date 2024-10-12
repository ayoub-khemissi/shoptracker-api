import api from "../Modules/Api.js";
import Config from "../Utils/Config.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN } = Config;

api.post("/logout", async function (req, res) {
    res.clearCookie('jwt', { httpOnly: true, secure: SHOPTRACKER_FRONT_HTTPSECURE, sameSite: "strict", domain: SHOPTRACKER_FRONT_DOMAIN });
    res.status(200).json({ data: null, msg: "User successfully logged out." });
});
