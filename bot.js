const { Client, GatewayIntentBits, Partials, AttachmentBuilder, ActivityType } = require('discord.js');
const Canvas = require('canvas');
const path = require('path');
require('dotenv').config();

// Register custom font
Canvas.registerFont(path.join(__dirname, 'supercell-magic.ttf'), { family: 'Supercell' });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Set up a Map to track sent welcomes
const welcomedUsers = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Set custom status
    client.user.setPresence({
        activities: [{ name: 'New Users', type: ActivityType.Listening }],
        status: 'online',
    });
});

client.on('guildMemberAdd', async member => {
    try {
        // Check if the member has been welcomed before
        if (welcomedUsers.has(member.id)) return;

        // Add member to welcomed list
        welcomedUsers.set(member.id, true);

        // Create a canvas
        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        // Load the banner image
        const background = await Canvas.loadImage(path.join(__dirname, 'welcomebanner.jpg'));
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Add "WELCOME" text
        ctx.font = '50px "Supercell"'; // Increased font size
        ctx.fillStyle = '#FFFF00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText('WELCOME', canvas.width / 2, canvas.height / 5); // Moved up
        ctx.fillText('WELCOME', canvas.width / 2, canvas.height / 5); // Moved up

        // Add user profile picture
        const avatarURL = member.user.displayAvatarURL({ format: 'jpg' });
        const avatar = await Canvas.loadImage(avatarURL);

        // Draw circle for avatar
        const avatarX = canvas.width / 2;
        const avatarY = canvas.height / 2 - 20;
        const avatarRadius = 50;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();

        // Draw border around avatar
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.closePath();

        // Invert colors if avatar is predominantly black
        const avatarData = ctx.getImageData(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < avatarData.length; i += 4) {
            r += avatarData[i];
            g += avatarData[i + 1];
            b += avatarData[i + 2];
            count++;
        }
        r /= count;
        g /= count;
        b /= count;

        if (r < 50 && g < 50 && b < 50) {
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = 'white';
            ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Add username without discriminator
        const username = member.user.username;
        ctx.font = '30px "Supercell"';
        ctx.strokeText(username, canvas.width / 2, canvas.height / 1.3);
        ctx.fillText(username, canvas.width / 2, canvas.height / 1.3);

        // Add "TO CLASHGROUND SERVER" text
        ctx.strokeText('TO CLASHGROUND SERVER', canvas.width / 2, canvas.height / 1.1);
        ctx.fillText('TO CLASHGROUND SERVER', canvas.width / 2, canvas.height / 1.1);

        // Attach the image to the message
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

        // Send the welcome message to the specific channel
        const channel = member.guild.channels.cache.get('1253623026528813138');
        if (channel) {
            await channel.send({ content: `Welcome to the server, ${member}!`, files: [attachment] });
        }
    } catch (error) {
        console.error('Error in guildMemberAdd event:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
