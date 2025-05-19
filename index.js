const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, Collection } = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMembers],
});

const command = {
  data: new SlashCommandBuilder()
    .setName('md')
    .setDescription('Envía un mensaje directo a todos los miembros del servidor')
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('El mensaje a enviar')
        .setRequired(true)
    ),
  async execute(interaction) {
    const mensaje = interaction.options.getString('mensaje');
    const members = await interaction.guild.members.fetch();

    let enviados = 0;
    let fallidos = 0;

    await interaction.reply({ content: '📨 Enviando mensajes...', ephemeral: true });

    for (const member of members.values()) {
      if (member.user.bot) continue;

      try {
        await member.send(mensaje);
        enviados++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 1s para evitar límites
      } catch (err) {
        fallidos++;
      }
    }

    await interaction.followUp({
      content: `✅ Mensaje enviado a ${enviados} usuarios.\n❌ Falló en ${fallidos} usuarios.`,
      ephemeral: true
    });
  }
};

client.commands = new Collection();
client.commands.set(command.data.name, command);

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('🔁 Registrando comando /md...');
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: [command.data.toJSON()] }
    );
    console.log('✅ Comando registrado');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '⚠️ Error al ejecutar el comando.', ephemeral: true });
  }
});

client.login(config.token);
