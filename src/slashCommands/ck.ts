import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand } from "../types";
import CK from "../schemas/Ck";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("ck")
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("List all users and their CK values"))
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Add CK to a user")
                .addStringOption(opt =>
                    opt.setName("username")
                        .setDescription("Username")
                        .setRequired(true))
                .addNumberOption(opt =>
                    opt.setName("value")
                        .setDescription("Value to add")
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName("edit")
                .setDescription("Edit CK amount for a user")
                .addStringOption(opt =>
                    opt.setName("username")
                        .setDescription("Username")
                        .setRequired(true))
                .addNumberOption(opt =>
                    opt.setName("value")
                        .setDescription("New CK value")
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName("reset")
                .setDescription("Reset CK for all users to 0"))
        .setDescription("Manage CK currency")
    ,
    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "list") {
            const ckList = await CK.find().sort({ ckValue: -1 });
            if (!ckList.length) {
                return interaction.reply({ content: "No CK records found.", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle("💰 CK Leaderboard")
                .setColor("Gold")
                .setDescription(ckList.map(user => `**${user.username}**: ${user.ckValue}`).join("\n"))
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === "add") {
            const username = interaction.options.getString("username", true);
            const value = interaction.options.getNumber("value", true);

            const userRecord = await CK.findOneAndUpdate(
                { username },
                { $inc: { ckValue: value } },
                { upsert: true, new: true }
            );

            return interaction.reply({ content: `✅ Added ${value} CK to **${username}**. Total: ${userRecord.ckValue}` });
        }

        if (subcommand === "edit") {
            const username = interaction.options.getString("username", true);
            const value = interaction.options.getNumber("value", true);

            const userRecord = await CK.findOneAndUpdate(
                { username },
                { ckValue: value },
                { upsert: true, new: true }
            );

            return interaction.reply({ content: `✏️ Set CK for **${username}** to ${userRecord.ckValue}.` });
        }

        if (subcommand === "reset") {
            await CK.updateMany({}, { ckValue: 0 });
            return interaction.reply({ content: "♻️ All CK values reset to 0." });
        }
    },
    cooldown: 5
};

export default command;
