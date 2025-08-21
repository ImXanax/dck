import {Client, GatewayIntentBits, Collection, PermissionFlagsBits, TextChannel, EmbedBuilder} from "discord.js";
import { Command, SlashCommand } from "./types";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import express from "express";

config()
const { Guilds, MessageContent, GuildMessages, GuildMembers } = GatewayIntentBits
const client = new Client({intents:[Guilds, MessageContent, GuildMessages, GuildMembers]})

client.slashCommands = new Collection<string, SlashCommand>()
client.commands = new Collection<string, Command>()
client.cooldowns = new Collection<string, number>()

const handlersDir = join(__dirname, "./handlers")
readdirSync(handlersDir).forEach(handler => {
    if (!handler.endsWith(".js")) return;
    require(`${handlersDir}/${handler}`)(client)
})

client.once("ready", () => {
    const channelId = "1403495218975735842";

    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (!channel) {
        console.error(`❌ Could not find channel with ID: ${channelId}`);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle("Bot Status")
        .setDescription("✅ The bot is now **online** and ready to go!")
        .setColor("Green")
        .setTimestamp()
        .setFooter({ text: `Bot started at`, iconURL: client.user?.displayAvatarURL() || undefined });

    channel.send({ embeds: [embed] });
});

const app = express();
app.use(express.json());
const router = express.Router();

// Jira will POST events here
router.post("/jira-events", async (req, res) => {
    try {
        const { issue, user, webhookEvent } = req.body;
        const channelId = process.env.CHANNEL_ID;

        console.log("✔ 🔆BODY : ",req.body);
        if(!channelId) {
            console.error("❌Channel ID is missing");
            return res.sendStatus(404);
        }
        const channel = client.channels.cache.get(channelId) as TextChannel;

        if (!channel) {
            console.error("❌ Jira event received, but Discord channel not found.");
            return res.sendStatus(404);
        }

        // Format an embed for nicer display
        const embed = new EmbedBuilder()
            .setTitle(`📌 Jira Event: ${webhookEvent}`)
            .setDescription(`**Issue:** ${issue.key} - ${issue.fields.summary}`)
            .addFields(
                { name: "Reported By", value: user?.displayName || "Unknown", inline: true },
                { name: "Link", value: `[View Issue](${issue.self})`, inline: true }
            )
            .setColor("Blue")
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        res.sendStatus(200);
    } catch (err) {
        console.error("❌ Error handling Jira event:", err);
        res.sendStatus(500);
    }
});

// router.post("/gitlab-events", async (req, res) => {
//     try {
//         const { object_kind, project, user_name, commits } = req.body;
//         const channelId = process.env.GITLAB_CHANNEL_ID;
//
//         if(!channelId) {return res.sendStatus(404);}
//         const channel = client.channels.cache.get(channelId) as TextChannel;
//
//         if (!channel) return res.sendStatus(404);
//
//         const embed = new EmbedBuilder()
//             .setTitle(`📌 GitLab Event: ${object_kind}`)
//             .setDescription(`**Project:** ${project.name}`)
//             .addFields(
//                 { name: "User", value: user_name || "Unknown", inline: true },
//                 { name: "Commits", value: commits?.map(c => `• ${c.message}`).join("\n") || "No commits", inline: false }
//             )
//             .setColor("Purple")
//             .setTimestamp();
//
//         await channel.send({ embeds: [embed] });
//         res.sendStatus(200);
//     } catch (err) {
//         console.error("Error handling GitLab event:", err);
//         res.sendStatus(500);
//     }
// });


app.use("/bot",router)

// Start Express server for Jira webhooks
app.listen(3000, () => {
    console.log("🚀 Jira webhook listener running on port 3000");
});

client.login(process.env.TOKEN)
