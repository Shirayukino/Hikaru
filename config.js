const fs = require('fs');

global.owner = "79861620303";
global.nomorbot = "79861620303";
global.namebot = "Bot WhatsApp";
global.prefix = ".";

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    delete require.cache[file];
    require(file);
});
