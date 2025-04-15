
const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const db = new sqlite3.Database('./progress.db');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    db.run("CREATE TABLE IF NOT EXISTS progress (userId TEXT PRIMARY KEY, username TEXT, lecture TEXT)");
});

client.on('messageCreate', message => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === '!update') {
        const lecture = args.join(' ');
        db.run("INSERT OR REPLACE INTO progress (userId, username, lecture) VALUES (?, ?, ?)",
            [message.author.id, message.author.username, lecture],
            err => {
                if (err) console.error(err);
                else message.reply(`Your progress has been updated to: ${lecture}`);
            });
    }

    if (command === '!progress') {
        db.get("SELECT lecture FROM progress WHERE userId = ?", [message.author.id], (err, row) => {
            if (err) return console.error(err);
            if (row) message.reply(`You are currently on: ${row.lecture}`);
            else message.reply("You haven't set your lecture progress yet. Use `!update Lecture X`.");
        });
    }

    if (command === '!teamprogress') {
        db.all("SELECT username, lecture FROM progress", [], (err, rows) => {
            if (err) return console.error(err);
            if (rows.length === 0) return message.reply("No team progress found yet.");
            const progressList = rows.map(r => `**${r.username}**: ${r.lecture}`).join("\n");
            message.reply(`📘 **Team Progress:**\n${progressList}`);
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
