const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActivityType } = require('discord.js');
const simpleGit = require('simple-git');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Debugger menu')
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Pull repository files and restart the bot'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('option2')
                .setDescription('Option 2'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('restart_bot')
                .setDescription('Restart the bot'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('change_status')
                .setDescription('Change the bot status')
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('Enter the new status')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('activity_type')
                        .setDescription('Select the activity type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Playing', value: 'playing' },
                            { name: 'Streaming', value: 'streaming' },
                            { name: 'Listening', value: 'listening' },
                            { name: 'Watching', value: 'watching' }
                        ))),
    async execute(interaction) {
        const allowedUserIds = ['1145477822123626596', '907407245149634571'];
        const allowedRoleId = '221708385601454081';

        if (!allowedUserIds.includes(interaction.user.id) && !interaction.member.roles.cache.has(allowedRoleId)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'update') {
            await interaction.deferReply({ ephemeral: true });
            const rootDir = path.resolve(__dirname, '../../');
            const git = simpleGit(rootDir);

            try {
                const pullResult = await git.pull();
                if (pullResult.summary.changes === 0) {
                    await interaction.followUp({ content: 'Repository is already up to date.', ephemeral: true });
                } else {
                    await interaction.followUp({ content: `Repository updated successfully.\n\n${JSON.stringify(pullResult, null, 2)}`, ephemeral: true });

                    // Restart the bot after successful pull
                    exec('npx pm2 restart mao');
                }
            } catch (error) {
                await interaction.followUp({ content: `Error pulling repository files: ${error.message}`, ephemeral: true });
            }
            return;
        }

        if (subcommand === 'restart_bot') {
            await interaction.reply({ content: 'Restarting bot...', ephemeral: true });
            exec('pm2 restart mao');
            return;
        }

        if (subcommand === 'change_status') {
            const newStatus = interaction.options.getString('status');
            const activityType = interaction.options.getString('activity_type');

            let activityTypeEnum;
            switch (activityType) {
                case 'playing':
                    activityTypeEnum = ActivityType.Playing;
                    break;
                case 'streaming':
                    activityTypeEnum = ActivityType.Streaming;
                    break;
                case 'listening':
                    activityTypeEnum = ActivityType.Listening;
                    break;
                case 'watching':
                    activityTypeEnum = ActivityType.Watching;
                    break;
                default:
                    activityTypeEnum = ActivityType.Playing;
            }

            interaction.client.user.setActivity(newStatus, { type: activityTypeEnum });
            await interaction.reply({ content: `Status changed to: ${newStatus} (${activityType})`, ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Special Command')
            .setDescription(`You selected ${subcommand}`)
            .setColor(0x00AE86);

        await interaction.reply({ embeds: [embed] });
    }
};
