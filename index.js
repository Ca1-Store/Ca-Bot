// ======================================================
// CA STORE ULTIMATE BOT
// FINAL FULL VERSION
// ======================================================

require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const express = require("express");
const transcript = require("discord-html-transcripts");

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
});

// ======================================================
// CONFIG
// ======================================================

const CONFIG = {

    SUPPORT_ROLE: "1479863465442021547",
    EXTRA_ROLE: "1479828121745100983",
    VIP_ROLE: "PUT_VIP_ROLE_ID",

    REVIEW_CHANNEL: "1480229260466852092",
    LOG_CHANNEL: "1479880568899375264",

    TICKET_CATEGORY: "1479861697283100955",

    BRAND_NAME: "Ca Store",

    TRANSCRIPT_DOMAIN: "http://YOUR_SERVER_IP:3000",

    AUTO_CLOSE_HOURS: 24,

    TICKET_FILE: "./tickets.json",

    TRANSCRIPTS_DIR: "./transcripts"
};

// ======================================================
// EXPRESS
// ======================================================

const app = express();

app.use(
    "/transcripts",
    express.static(path.join(__dirname, "transcripts"))
);

app.listen(3000, () => {

    console.log("Transcript Viewer Ready");
});

// ======================================================
// FILES
// ======================================================

if (!fs.existsSync(CONFIG.TICKET_FILE)) {

    fs.writeFileSync(
        CONFIG.TICKET_FILE,
        JSON.stringify({ count: 0 }, null, 4)
    );
}

if (!fs.existsSync(CONFIG.TRANSCRIPTS_DIR)) {

    fs.mkdirSync(CONFIG.TRANSCRIPTS_DIR);
}

// ======================================================
// CACHE
// ======================================================

const claimedTickets = new Map();
const openedAt = new Map();
const cooldown = new Map();

// ======================================================
// HELPERS
// ======================================================

function createEmbed({
    title,
    description,
    fields = [],
    thumbnail = null
}) {

    const embed = new EmbedBuilder()

        .setColor("#ffffff")

        .setTitle(title)

        .setDescription(description)

        .setFooter({
            text: CONFIG.BRAND_NAME
        })

        .setTimestamp();

    if (fields.length > 0) {

        embed.addFields(fields);
    }

    if (thumbnail) {

        embed.setThumbnail(thumbnail);
    }

    return embed;
}

function getNextTicketNumber() {

    const data = JSON.parse(
        fs.readFileSync(CONFIG.TICKET_FILE)
    );

    data.count++;

    fs.writeFileSync(
        CONFIG.TICKET_FILE,
        JSON.stringify(data, null, 4)
    );

    return data.count;
}

function getStars(stars) {

    if (isNaN(stars)) return "☆☆☆☆☆";

    const fixed = Math.max(1, Math.min(5, stars));

    return "⭐".repeat(fixed) +
    "☆".repeat(5 - fixed);
}

function formatDuration(ms) {

    const minutes =
        Math.floor(ms / 60000);

    if (minutes < 60) {

        return `${minutes} دقيقة`;
    }

    const hours =
        Math.floor(minutes / 60);

    const remain =
        minutes % 60;

    return `${hours} ساعة و ${remain} دقيقة`;
}

function isSupport(member) {

    return member.roles.cache.has(CONFIG.SUPPORT_ROLE);
}

// ======================================================
// MODS DATA
// ======================================================

const mods = [

    {
        command: "!extra-vegetation",
        title: "Extra Vegetation",
        category: "Vegetation Pack",
        image: "Extra.png",
        description:
        "مود Vegetation احترافي يضيف كثافة أشجار واقعية وظلال محسّنة."
    },

    {
        command: "!german-roads",
        title: "German Roads",
        category: "Roads Pack",
        image: "German_Roads.png",
        description:
        "مود طرق ألمانية بجودة عالية وخامات HD."
    },

    {
        command: "!europe-roads",
        title: "European Roads",
        category: "Roads Pack",
        image: "Europe.png",
        description:
        "مود طرق أوروبية واقعية بتفاصيل دقيقة."
    },

    {
        command: "!nve-roads",
        title: "NVE Roads",
        category: "Roads Pack",
        image: "NVE_Roads.png",
        description:
        "مود الطرق الخاص بـ NVE بجودة Ultra HD."
    },

    {
        command: "!foggy",
        title: "Weather Foggy",
        category: "Weather Pack",
        image: "Foggy_Deep_Weather.jpg",
        description:
        "مود ضبابي واقعي يضيف أجواء سينمائية."
    },

    {
        command: "!mount",
        title: "Snowy Mount Chiliad",
        category: "Snow Pack",
        image: "Mount.png",
        description:
        "مود ثلوج احترافي لجبل تشيلياد."
    },

    {
        command: "!sandy",
        title: "Sandy Shores Vegetation",
        category: "Vegetation Pack",
        image: "Sandy.png",
        description:
        "Vegetation خاص بمنطقة Sandy Shores."
    },

    {
        command: "!christmas",
        title: "Christmas Content Pack",
        category: "Seasonal Pack",
        image: "Christmas_Content_Pack.jpg",
        description:
        "مود كريسماس يضيف أجواء احتفالية جميلة."
    },

    {
        command: "!halloween",
        title: "Halloween Content Pack",
        category: "Seasonal Pack",
        image: "Halloween_Content_Pack.jpg",
        description:
        "مود هالوين بأجواء مظلمة ومخيفة."
    },

    {
        command: "!volumetric",
        title: "Volumetric Clouds",
        category: "Weather Pack",
        image: "volumatric.png",
        description:
        "سحب ثلاثية الأبعاد بإضاءة ديناميكية."
    }
        ,{
        command: "!volumetric",
        title: "Volumetric Clouds",
        category: "Weather Pack",
        image: "volumatric.png",
        description:
        "سحب ثلاثية الأبعاد بإضاءة ديناميكية."
    }

];

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {

    console.log(`${client.user.tag} جاهز`);

    await client.application.commands.set([
        {
            name: "review",
            description: "إرسال رسالة التقييم"
        },
        {
            name: "send-product",
            description: "إرسال رسالة منتج"
        }
    ]);
});

// ======================================================
// MESSAGE CREATE
// ======================================================

client.on("messageCreate", async message => {

    if (message.author.bot) return;

    // ======================================================
    // MODS
    // ======================================================

    const mod =
        mods.find(m =>
            m.command === message.content
        );

    if (mod) {

        const embed = createEmbed({

            title: mod.title,

            description: `
## ${mod.title}

> 📁 التصنيف:
${mod.category}

${mod.description}
            `,

            thumbnail:
            message.guild.iconURL()
        })

        .setImage(`attachment://${mod.image}`);

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setLabel("تنزيل المود")

                        .setEmoji("📥")

                        .setStyle(ButtonStyle.Link)

                        .setURL(
"https://discord.com/channels/1318288587435020389/1504847450173870191"
                        )
                );

        return message.channel.send({

            embeds: [embed],

            components: [row],

            files: [
                {
                    attachment:
                    `./assets/${mod.image}`,

                    name: mod.image
                }
            ]
        });
    }

    // ======================================================
    // TICKET PANEL
    // ======================================================

    if (message.content === "!ticket-panel") {

        const menu =
            new StringSelectMenuBuilder()

                .setCustomId("ticket_select")

                .setPlaceholder(
                    "اختر نوع التذكرة"
                )

                .addOptions([

                    {
                        label: "إعادة تركيب",
                        value: "reinstall",
                        emoji: "🔧"
                    },

                    {
                        label: "شراء منتج",
                        value: "buy",
                        emoji: "🛒"
                    },

                    {
                        label: "الاستفسارات",
                        value: "questions",
                        emoji: "❓"
                    }
                ]);

        const row =
            new ActionRowBuilder()
                .addComponents(menu);

        const embed = createEmbed({

            title: "نظام التذاكر",

            description: `
# مرحبًا بك في ${CONFIG.BRAND_NAME}

نقدم لك تجربة دعم احترافية وسريعة.

## القوانين

> احترام الدعم الفني إلزامي
> يمنع السبام
> يمنع فتح تذاكر وهمية
> يمنع الإزعاج
            `,

            thumbnail:
            "attachment://CaStore.png"
        });

        return message.channel.send({

            embeds: [embed],

            components: [row],

            files: [
                {
                    attachment:
                    "./Ca Store.png",

                    name:
                    "CaStore.png"
                }
            ]
        });
    }
});

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async interaction => {

    // ======================================================
    // SELECT MENU
    // ======================================================

    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === "ticket_select") {

            const existing =
                interaction.guild.channels.cache.find(
                    c =>
                    c.topic === interaction.user.id
                );

            if (existing) {

                return interaction.reply({

                    content:
                    `لديك تذكرة مفتوحة بالفعل ${existing}`,

                    ephemeral: true
                });
            }

            if (cooldown.has(interaction.user.id)) {

                return interaction.reply({

                    content:
                    "يرجى الانتظار قليلاً",

                    ephemeral: true
                });
            }

            cooldown.set(interaction.user.id, true);

            setTimeout(() => {

                cooldown.delete(interaction.user.id);

            }, 10000);

            const type =
                interaction.values[0];

            const names = {

                reinstall:
                "اعادة-تركيب",

                buy:
                "شراء",

                questions:
                "استفسار"
            };

            const ticketNumber =
                getNextTicketNumber();

            const isVIP =
                interaction.member.roles.cache.has(
                    CONFIG.VIP_ROLE
                );

            const channel =
                await interaction.guild.channels.create({

                    name:
`${isVIP ? "vip" : names[type]}-${ticketNumber}`,

                    parent:
                    CONFIG.TICKET_CATEGORY,

                    topic:
                    interaction.user.id,

                    type:
                    ChannelType.GuildText,

                    permissionOverwrites: [

                        {
                            id:
                            interaction.guild.id,

                            deny: [
PermissionsBitField.Flags.ViewChannel
                            ]
                        },

                        {
                            id:
                            interaction.user.id,

                            allow: [

PermissionsBitField.Flags.ViewChannel,

PermissionsBitField.Flags.SendMessages,

PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        },

                        {
                            id:
                            CONFIG.SUPPORT_ROLE,

                            allow: [

PermissionsBitField.Flags.ViewChannel,

PermissionsBitField.Flags.SendMessages,

PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        },

                        {
                            id:
                            CONFIG.EXTRA_ROLE,

                            allow: [

PermissionsBitField.Flags.ViewChannel,

PermissionsBitField.Flags.SendMessages,

PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        }
                    ]
                });

            openedAt.set(
                channel.id,
                Date.now()
            );

            const buttons =
                new ActionRowBuilder()

                    .addComponents(

                        new ButtonBuilder()

                            .setCustomId("claim_ticket")

                            .setLabel("استلام")

                            .setEmoji("📌")

                            .setStyle(ButtonStyle.Success),

                        new ButtonBuilder()

                            .setCustomId("close_ticket")

                            .setLabel("إغلاق")

                            .setEmoji("🔒")

                            .setStyle(ButtonStyle.Danger),

                        new ButtonBuilder()

                            .setCustomId("close_reason")

                            .setLabel("إغلاق بسبب")

                            .setEmoji("⚠️")

                            .setStyle(ButtonStyle.Secondary)
                    );

            const embed = createEmbed({

                title:
                "تم فتح التذكرة",

                description: `
مرحبًا ${interaction.user}

سيتم الرد عليك بأقرب وقت ممكن.
                `,

                thumbnail:
                "attachment://CaStore.png"
            });

            await channel.send({

                content:
`${interaction.user}
<@&${CONFIG.SUPPORT_ROLE}>`,

                embeds: [embed],

                components: [buttons],

                files: [
                    {
                        attachment:
                        "./Ca Store.png",

                        name:
                        "CaStore.png"
                    }
                ],

                allowedMentions: {
                    roles: [
                        CONFIG.SUPPORT_ROLE
                    ]
                }
            });

            return interaction.reply({

                content:
                `تم فتح التذكرة ${channel}`,

                ephemeral: true
            });
        }
    }

    // ======================================================
    // BUTTONS
    // ======================================================

    if (interaction.isButton()) {

        // REVIEW BUTTON

        if (interaction.customId === "open_review") {

            const modal =
                new ModalBuilder()

                    .setCustomId("review_modal")

                    .setTitle("إرسال تقييم");

            const product =
                new TextInputBuilder()

                    .setCustomId("product")

                    .setLabel("اسم المنتج")

                    .setStyle(TextInputStyle.Short);

            const opinion =
                new TextInputBuilder()

                    .setCustomId("opinion")

                    .setLabel("رأيك بالخدمة")

                    .setStyle(TextInputStyle.Paragraph);

            const stars =
                new TextInputBuilder()

                    .setCustomId("stars")

                    .setLabel("التقييم من 5")

                    .setPlaceholder("1 - 5")

                    .setStyle(TextInputStyle.Short);

            modal.addComponents(

                new ActionRowBuilder()
                    .addComponents(product),

                new ActionRowBuilder()
                    .addComponents(opinion),

                new ActionRowBuilder()
                    .addComponents(stars)
            );

            return interaction.showModal(modal);
        }

        if (!isSupport(interaction.member)) {

            return interaction.reply({

                content:
                "ليس لديك صلاحية",

                ephemeral: true
            });
        }

        // CLAIM

        if (interaction.customId === "claim_ticket") {

            if (
                claimedTickets.has(
                    interaction.channel.id
                )
            ) {

                return interaction.reply({

                    content:
                    "تم استلام التذكرة بالفعل",

                    ephemeral: true
                });
            }

            claimedTickets.set(
                interaction.channel.id,
                {
                    id:
                    interaction.user.id,

                    at:
                    Date.now()
                }
            );

            const embed = createEmbed({

                title:
                "تم استلام التذكرة",

                description: `
> المسؤول الحالي:
${interaction.user}
                `,

                thumbnail:
interaction.user.displayAvatarURL()
            });

            return interaction.reply({

                embeds: [embed]
            });
        }

        // CLOSE

        if (interaction.customId === "close_ticket") {

            return closeTicket(
                interaction,
                "تم إغلاق التذكرة"
            );
        }

        // CLOSE REASON

        if (interaction.customId === "close_reason") {

            const modal =
                new ModalBuilder()

                    .setCustomId("reason_modal")

                    .setTitle("سبب الإغلاق");

            const reason =
                new TextInputBuilder()

                    .setCustomId("reason")

                    .setLabel("اكتب السبب")

                    .setStyle(
                        TextInputStyle.Paragraph
                    );

            modal.addComponents(

                new ActionRowBuilder()
                    .addComponents(reason)
            );

            return interaction.showModal(modal);
        }
    }

    // ======================================================
    // MODALS
    // ======================================================

    if (interaction.isModalSubmit()) {

        // REVIEW MODAL

        if (interaction.customId === "review_modal") {

            const product =
interaction.fields.getTextInputValue(
    "product"
);

            const opinion =
interaction.fields.getTextInputValue(
    "opinion"
);

            const stars =
parseInt(
interaction.fields.getTextInputValue(
    "stars"
)
);

            const reviewChannel =
                client.channels.cache.get(
                    CONFIG.REVIEW_CHANNEL
                );

            const embed = createEmbed({

                title:
                "تقييم جديد",

                description: `
## تقييم جديد من أحد العملاء

${interaction.user}
                `,

                thumbnail:
interaction.user.displayAvatarURL(),

                fields: [

                    {
                        name:
                        "المنتج",

                        value:
                        product,

                        inline:
                        true
                    },

                    {
                        name:
                        "التقييم",

                        value:
`${getStars(stars)} (${stars}/5)`,

                        inline:
                        true
                    },

                    {
                        name:
                        "رأي العميل",

                        value:
                        opinion
                    }
                ]
            });

            await reviewChannel.send({

                content:
                `${interaction.user}`,

                embeds: [embed]
            });

            await interaction.reply({

                content:
                "تم إرسال تقييمك بنجاح ❤️",

                ephemeral: true
            });

            return closeTicket(
                interaction,
                "تم إنهاء التقييم"
            );
        }

        // CLOSE REASON MODAL

        if (interaction.customId === "reason_modal") {

            const reason =
interaction.fields.getTextInputValue(
    "reason"
);

            return closeTicket(
                interaction,
                reason
            );
        }

        // PRODUCT MODAL

        if (interaction.customId === "product_modal") {

            const productName =
                interaction.fields.getTextInputValue("product_name");

            const version =
                interaction.fields.getTextInputValue("version");

            const features =
                interaction.fields.getTextInputValue("features");

            const price =
                interaction.fields.getTextInputValue("price");

            const imageUrl =
                interaction.fields.getTextInputValue("image_url");

            const notes =
                interaction.fields.getTextInputValue("notes");

            const featuresList = features.split('\n').map(f => `> ${f}`).join('\n');

            const embed = createEmbed({

                title: `${CONFIG.BRAND_NAME}\n${productName} ${version}`,

                description: `
## مميزات الجرافيك

${featuresList}

**السعر:** ${price}

${notes ? `**ملاحظة:** ${notes}` : ''}
                `,

                thumbnail: interaction.guild.iconURL()
            });

            if (imageUrl) {
                embed.setImage(imageUrl);
            }

            const row =
                new ActionRowBuilder()

                    .addComponents(

                        new ButtonBuilder()

                            .setLabel("الشراء السريع")

                            .setEmoji("🛒")

                            .setStyle(ButtonStyle.Success)

                            .setCustomId("quick_buy"),

                        new ButtonBuilder()

                            .setLabel("للمزيد من التفاصيل انقر هنا")

                            .setEmoji("📋")

                            .setStyle(ButtonStyle.Secondary)

                            .setCustomId("more_details")
                    );

            await interaction.channel.send({

                embeds: [embed],

                components: [row]
            });

            return interaction.reply({

                content: "تم إرسال رسالة المنتج بنجاح ✅",

                ephemeral: true
            });
        }
    }

    // ======================================================
    // SLASH COMMANDS
    // ======================================================

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "review") {

            if (!isSupport(interaction.member)) {

                return interaction.reply({

                    content:
                    "ليس لديك صلاحية",

                    ephemeral: true
                });
            }

            const embed = createEmbed({

                title:
                "تقييم الخدمة",

                description: `
نشكر تعاملك مع ${CONFIG.BRAND_NAME}

رأيك يساعدنا على تطوير خدماتنا.
                `,

                thumbnail:
                "attachment://CaStore.png"
            });

            const row =
                new ActionRowBuilder()

                    .addComponents(

                        new ButtonBuilder()

                            .setCustomId("open_review")

                            .setLabel("إرسال تقييم")

                            .setEmoji("⭐")

                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    );

            return interaction.reply({

                embeds: [embed],

                components: [row],

                files: [
                    {
                        attachment:
                        "./Ca Store.png",

                        name:
                        "CaStore.png"
                    }
                ]
            });
        }

        if (interaction.commandName === "send-product") {

            const modal =
                new ModalBuilder()

                    .setCustomId("product_modal")

                    .setTitle("إرسال منتج");

            const productName =
                new TextInputBuilder()

                    .setCustomId("product_name")

                    .setLabel("اسم المنتج")

                    .setStyle(TextInputStyle.Short);

            const version =
                new TextInputBuilder()

                    .setCustomId("version")

                    .setLabel("الإصدار")

                    .setStyle(TextInputStyle.Short);

            const features =
                new TextInputBuilder()

                    .setCustomId("features")

                    .setLabel("المميزات (كل ميزة في سطر جديد)")

                    .setStyle(TextInputStyle.Paragraph);

            const price =
                new TextInputBuilder()

                    .setCustomId("price")

                    .setLabel("السعر")

                    .setStyle(TextInputStyle.Short);

            const imageUrl =
                new TextInputBuilder()

                    .setCustomId("image_url")

                    .setLabel("رابط الصورة")

                    .setStyle(TextInputStyle.Short);

            const notes =
                new TextInputBuilder()

                    .setCustomId("notes")

                    .setLabel("ملاحظات")

                    .setStyle(TextInputStyle.Paragraph);

            modal.addComponents(

                new ActionRowBuilder()
                    .addComponents(productName),

                new ActionRowBuilder()
                    .addComponents(version),

                new ActionRowBuilder()
                    .addComponents(features),

                new ActionRowBuilder()
                    .addComponents(price),

                new ActionRowBuilder()
                    .addComponents(imageUrl),

                new ActionRowBuilder()
                    .addComponents(notes)
            );

            return interaction.showModal(modal);
        }
    }
});

// ======================================================
// CLOSE TICKET
// ======================================================

async function closeTicket(interaction, reason) {

    try {

        const channel =
            interaction.channel;

        if (!channel) return;

        if (channel.closing) return;

        channel.closing = true;

        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            await interaction.deferReply({

                ephemeral: true

            }).catch(() => {});
        }

        const claimed =
            claimedTickets.get(channel.id);

        const opened =
            openedAt.get(channel.id);

        const duration =
            opened
            ? formatDuration(
                Date.now() - opened
            )
            : "غير معروف";

        const attachment =
await transcript.createTranscript(
    channel,
    {
        fileName:
        `${channel.name}.html`,

        poweredBy: false,

        saveImages: true
    }
);

        const transcriptPath =
            path.join(
                CONFIG.TRANSCRIPTS_DIR,
                `${channel.name}.html`
            );

        fs.writeFileSync(
            transcriptPath,
            attachment.attachment
        );

        const transcriptURL =
`${CONFIG.TRANSCRIPT_DOMAIN}/transcripts/${channel.name}.html`;

        const embed = createEmbed({

            title:
            "تم إغلاق التذكرة",

            description: `
## تم إغلاق التذكرة بنجاح

تم حفظ السجل الكامل.
            `,

            thumbnail:
            "attachment://CaStore.png",

            fields: [

                {
                    name:
                    "التذكرة",

                    value:
                    channel.name,

                    inline:
                    true
                },

                {
                    name:
                    "العميل",

                    value:
                    `<@${channel.topic}>`,

                    inline:
                    true
                },

                {
                    name:
                    "المستلم",

                    value:
                    claimed
                    ? `<@${claimed.id}>`
                    : "لم يتم الاستلام",

                    inline:
                    true
                },

                {
                    name:
                    "سبب الإغلاق",

                    value:
                    reason
                },

                {
                    name:
                    "مدة التذكرة",

                    value:
                    duration
                }
            ]
        });

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setLabel(
                            "فتح السجل"
                        )

                        .setEmoji("📄")

                        .setStyle(
                            ButtonStyle.Link
                        )

                        .setURL(
                            transcriptURL
                        )
                );

        const user =
await client.users.fetch(
    channel.topic
).catch(() => null);

        if (user) {

            await user.send({

                embeds: [embed],

                components: [row],

                files: [
                    {
                        attachment:
                        "./Ca Store.png",

                        name:
                        "CaStore.png"
                    }
                ]

            }).catch(() => {});
        }

        const logChannel =
client.channels.cache.get(
    CONFIG.LOG_CHANNEL
);

        if (logChannel) {

            await logChannel.send({

                embeds: [embed],

                components: [row],

                files: [
                    {
                        attachment:
                        "./Ca Store.png",

                        name:
                        "CaStore.png"
                    }
                ]
            });
        }

        await interaction.editReply({

            content:
            "تم إغلاق التذكرة بنجاح ✅"

        }).catch(() => {});

        setTimeout(async () => {

            await channel.delete()
            .catch(() => {});

        }, 3000);

    } catch (err) {

        console.log(err);
    }
}

// ======================================================
// AUTO CLOSE
// ======================================================

setInterval(async () => {

    const now = Date.now();

    client.guilds.cache.forEach(async guild => {

        guild.channels.cache.forEach(async channel => {

            if (
                channel.parentId !==
                CONFIG.TICKET_CATEGORY
            ) return;

            const opened =
                openedAt.get(channel.id);

            if (!opened) return;

            const diff =
                now - opened;

            const hours =
                diff / (1000 * 60 * 60);

            if (
                hours >=
                CONFIG.AUTO_CLOSE_HOURS
            ) {

                await channel.send({

                    embeds: [

                        createEmbed({

                            title:
                            "إغلاق تلقائي",

                            description:
"تم إغلاق التذكرة تلقائيًا بسبب عدم النشاط."
                        })
                    ]
                });

                closeTicket({

                    channel,

                    guild,

                    user:
                    client.user,

                    deferred:
                    true,

                    replied:
                    true,

                    editReply:
                    async () => {},

                    followUp:
                    async () => {}

                },
                "إغلاق تلقائي بسبب عدم النشاط");
            }
        });
    });

}, 600000);

// ======================================================
// LOGIN
// ======================================================

client.login(process.env.TOKEN);