import api from "../Modules/Api.js";
import Config from "../Utils/Config.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN, SHOPTRACKER_COOKIES_SAME_SITE } =
    Config;

api.post("/logout", async function (req, res) {
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: SHOPTRACKER_FRONT_HTTPSECURE,
        sameSite: SHOPTRACKER_COOKIES_SAME_SITE,
        domain: SHOPTRACKER_FRONT_DOMAIN,
    });
    res.status(200).json({ data: null, msg: "User successfully logged out." });
});
