const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();

// Cargar comandos
const command = require('./commands/md.js');
client.commands.set(command.data.name, command);

const rest = new REST({ version: '10' }).setToken(config.token);

// Registrar comando slash
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
