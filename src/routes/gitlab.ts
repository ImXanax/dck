// import { Client, EmbedBuilder, TextChannel } from 'discord.js';
// import { Router } from 'express';
//
// const router = Router();
//
// const gitlabRoutes = (client: Client) => {
//   router.post('/gitlab-events', async (req, res) => {
//     try {
//       const { object_kind, project, user_name, commits } = req.body;
//       const channelId = process.env.GITLAB_CHANNEL_ID;
//
//       if (!channelId) {
//         return res.sendStatus(404);
//       }
//       const channel = client.channels.cache.get(channelId) as TextChannel;
//
//       if (!channel) return res.sendStatus(404);
//
//       const embed = new EmbedBuilder()
//         .setTitle(`📌 GitLab Event: ${object_kind}`)
//         .setDescription(`**Project:** ${project.name}`)
//         .addFields(
//           { name: 'User', value: user_name || 'Unknown', inline: true },
//           {
//             name: 'Commits',
//             value: commits?.map((c) => `• ${c.message}`).join('\n') || 'No commits',
//             inline: false,
//           }
//         )
//         .setColor('Purple')
//         .setTimestamp();
//
//       await channel.send({ embeds: [embed] });
//       res.sendStatus(200);
//     } catch (err) {
//       console.error('Error handling GitLab event:', err);
//       res.sendStatus(500);
//     }
//   });
//   return router;
// };
//
// export default gitlabRoutes;
