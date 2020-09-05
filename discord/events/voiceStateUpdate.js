const Discord = require("discord.js");
const config = require("../../config.json")

module.exports = async (client, oldMember, newMember) => {
  // To detect which channel it is you can use the newMember.voiceChannelID
  // to get the ID of the channel the user joined as newMember is an instance
  // of GuildMember which you can see all the properties and methods there.

  //You could also dectect it by its name with newMember.voiceChannel.name or
  // newUserChannel.name as I already set a variable for newMember.voiceChannel in the code.

  // const newUserChannel = newMember.voiceChannel;
  // const oldUserChannel = oldMember.voiceChannel;
  // const channelStatus = "";

  client.channels.fetch('751593283993469048').then(channel => console.log(channel.name));

  let channel = client.guild.channels.cache.get(channelid);
  console.log(channel);


  // if (oldUserChannel === null) {
  //   // Triggered whenever a user joins a voice channel.
	// 	channelStatus = "joined voice channel";
  //
  //   console.log(`${newMember.user.username} ${channelStatus}`);
  //
	// } else if (newUserChannel === null) {
  //   // Triggered whenever a user leaves a voice channel.
	// 	channelStatus = "Left Voice Channel";
  //
	// } else if (oldUserChannel !== null && newUserChannel !== null) {
  //   // Triggered whenever a user moves voice channel.
	// 	channelStatus = "moved voice channel";
  //
	// };
}
