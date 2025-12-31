module.exports = async (sock, m) => {
    const prefix = global.prefix;
    const command = m.body.toLowerCase();

    if (command === `${prefix}menu`) {
        const menuText = `*LIST MENU*

${prefix}ping
${prefix}owner
${prefix}botinfo

_Kirim perintah sesuai daftar di atas._`;

        await m.reply(menuText);
    }
};
