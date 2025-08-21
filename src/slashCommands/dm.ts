import { SlashCommandBuilder, User } from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("dm")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to DM")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("msg")
                .setDescription("The message to send")
                .setRequired(true)
        )
        .setDescription("Send a direct message to a user")
    ,
    execute: async (interaction) => {
        const targetUser = interaction.options.getUser("user", true) as User;
        const message = interaction.options.getString("msg", true);

        try {
            await targetUser.send(message);
            await interaction.reply({ content: `✅ Message sent to **${targetUser.tag}**`, ephemeral: true });
        } catch (error) {
            console.error("Failed to send DM:", error);
            await interaction.reply({ content: "❌ Could not send the DM. They might have DMs disabled.", ephemeral: true });
        }
    },
    cooldown: 5
};

export default command;
