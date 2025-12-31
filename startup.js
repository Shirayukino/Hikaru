require("./config");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const { smsg } = require("./utils/utils");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth/parent');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(global.nomorbot);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(code);
            } catch (e) {}
        }, 3000);
    }

    const pluginsPath = path.join(__dirname, "plugins");
    if (!fs.existsSync(pluginsPath)) fs.mkdirSync(pluginsPath);

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            let m = chatUpdate.messages[0];
            if (!m.message) return;
            m = smsg(sock, m);
            if (m.fromMe) return;

            const files = fs.readdirSync(pluginsPath).filter(file => file.endsWith(".js"));
            for (let file of files) {
                const pluginPath = path.join(pluginsPath, file);
                delete require.cache[require.resolve(pluginPath)];
                const plugin = require(pluginPath);
                if (typeof plugin === "function") {
                    await plugin(sock, m);
                }
            }
        } catch (e) {}
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        } else if (connection === "open") {
            console.log("Connected");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
