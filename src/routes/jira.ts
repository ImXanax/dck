import { Router } from 'express';
import { TextChannel, EmbedBuilder, Client } from 'discord.js';
import { getDiscId, returnIssueCategory } from '../functions';
import { IEventType } from '../helper/types';

const router = Router();

const jiraRoutes = (client: Client) => {
  router.post('/jira-events', async (req, res) => {
    console.log('🔵 BODY : ', JSON.stringify(req.body, null, 2));

    try {
      const { issue, webhookEvent } = req.body;
      const eventMeta = returnIssueCategory(req.body.issue_event_type_name);

      const channelId = process.env.CHANNEL_ID;
      if (!channelId) return res.sendStatus(404);

      const channel = client.channels.cache.get(channelId) as TextChannel;
      if (!channel) return res.sendStatus(404);

      let embed = new EmbedBuilder().setTimestamp(new Date(req.body.timestamp));
      let contentPing = '';

      if (eventMeta.category === IEventType.comment) {
        // Comment event
        const comment = issue.fields.comment?.comments?.[0];
        const commentText = comment?.body || 'No comment text';

        const mentionRegex = /\[~(\w+)\]/g;
        const mentions = [...commentText.matchAll(mentionRegex)]
          .map((m) => getDiscId(m[1], true))
          .join(' ');

        console.log('✔ mentions: ', mentions);
        console.log('✔ comment: ', comment);
        console.log('✔ text: ', commentText);

        contentPing = mentions || '';

        embed
          .setTitle(`💬 ${issue.key}`)
          .setURL(`(${process.env.JURL}browse/${issue.key}`)
          .setDescription(commentText)
          .setColor('Yellow')
          .addFields(
            { name: 'Commenter', value: comment?.author?.displayName || 'Unknown', inline: true },
            { name: 'Mentions', value: mentions || 'None', inline: true }
          );

        if (comment?.attachment?.length) {
          embed.setThumbnail(comment.attachment[0].thumbnail || comment.attachment[0].content);
        }
      } else if (eventMeta.category === IEventType.issue) {
        // Issue event
        const assignee = issue.fields.assignee;
        const status = issue.fields.status?.name || 'N/A';

        contentPing = assignee ? getDiscId(assignee.name, true) : '';

        embed
          .setTitle(`🔵 Issue ${issue.key} Updated`)
          .setURL(`(${process.env.JURL}browse/${issue.key}`)
          .setDescription(`**Status updated to:** ${status}`)
          .setColor('Blue')
          .addFields(
            { name: 'Assignee', value: assignee?.displayName || 'Unassigned', inline: true },
            { name: 'Priority', value: issue.fields.priority?.name || 'N/A', inline: true }
          );
      }

      await channel.send({ content: contentPing, embeds: [embed] });
      res.sendStatus(200);
    } catch (err) {
      console.error('❌ Error handling Jira event:', err);
      res.sendStatus(500);
    }
  });

  return router;
};

export default jiraRoutes;
