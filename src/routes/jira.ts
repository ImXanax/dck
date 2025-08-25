import { Router } from 'express';
import { TextChannel, EmbedBuilder, Client } from 'discord.js';
import {
  getDiscId,
  getStatusMeta,
  replaceMentions,
  returnIssueCategory,
} from '../helper/functions';
import { IEventType, IStatuses } from '../helper/types';

const router = Router();

const jiraRoutes = (client: Client) => {
  router.post('/jira-events', async (req, res) => {
    console.log('🔵 BODY : ', JSON.stringify(req.body, null, 2));

    try {
      const { issue, comment } = req.body;
      const channelId = process.env.CHANNEL_ID;
      if (!channelId) return res.sendStatus(404);
      const channel = client.channels.cache.get(channelId) as TextChannel;
      if (!channel) return res.sendStatus(404);

      const eventMeta = returnIssueCategory(req.body.issue_event_type_name);
      let embed = new EmbedBuilder().setTimestamp(new Date(req.body.timestamp));
      let contentPing = '';

      if (eventMeta.category === IEventType.comment) {
        // Comment event
        const commentText = comment?.body || 'No comment text';

        const mentionRegex = /\[~(\w+)\]/g;
        const mentions = [...commentText.matchAll(mentionRegex)].map((m) => getDiscId(m[1], true)); // convert each username to Discord ID

        contentPing = mentions.length > 0 ? mentions.join(' ') : '';
        console.log("💥 issue fields: ", issue.fields);
        embed
          .setTitle(`💬 ${issue.key}`)
          .setURL(`${process.env.JURL}browse/${issue.key}`)
          .setDescription(`Content:\n ${replaceMentions(commentText)}`)
          .setColor('White')
          .addFields(
            { name: 'Commenter', value: comment?.author?.displayName || 'Unknown', inline: true },
            { name: 'Mentions', value: mentions.join(' | ') || 'None', inline: true }
          );
      } else if (eventMeta.category === IEventType.issue) {
        // Issue event
        const assignee = issue.fields.assignee;
        const status = issue.fields.status?.name || 'N/A';
        const { emoji, color } = getStatusMeta(status as IStatuses);

        contentPing = assignee ? getDiscId(assignee.name, true) : '';

        embed
          .setTitle(`${emoji} Issue ${issue.key} Updated`)
          .setURL(`${process.env.JURL}browse/${issue.key}`)
          .setDescription(`**Status updated to:** ${status}`)
          .setColor(color)
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
