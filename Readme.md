## Precise.io Server
A Precise.io Server is a slightly adjusted DataChannel.io Server. All credits go to DataChannel.io for handling the WebRTC DataChannels and forwarding data, when ever the WebRTC connection fails.

## DataChannel.io
Cite from [DataChannel.io](https://github.com/marcolanaro/DataChannel.IO) : 
<cite>
Datachannel.io is inspired by the amazing socket.io framework and implements a real-time communication using the WebRTC technology.
Peers are directly connected and datas are exchanged between clients without passing throug the server.

Socket.io has two purposes:
* Serve signals between clients needed to coordinate the communication.
* In case peer-to-peer communication fails or your browser does not support WebRTC, socket.io serve also the data message.
</cite>
#### License

MIT

## How To Set up your Precise.io Server
This installation guide assumes you are using a Debian or Ubuntu Server. It is however not too difficult to adopt these steps on other systems, since node.js works on as good as any platform.

1. fetch the code from this repository as zip or by cloning

2. copy it to a folder 'preciseio' on your server ( e.g. /home/you/preciseio )

3. install nodejs, npm and redis-server.

	`$ apt-get install nodejs npm redis-server`

4. cd into your folder

	`$ cd /home/you/preciseio`

5. install the required modules

	`$ npm install`

6. sometimes the redis module will not be installed in the socket.io folder. If this happens, do the following:	
	
	`$ cd node_modules/socket.io`<br />
	`$ npm install redis`<br />
	`$ cd ../..`

7. find the ip address of your server using

	`$ ifconfig`

8. go to your precise.io account and add a new configuration using your ip and the port 8080

9. back at your server, run the script
	
	`$ nodejs runDatachannel.js`
	
10. activate your new configuration instead of the default configuration
	
You should now be running on your local server! If it fails, check your firewall. You can change the port for the DataChannel in the 'runDatachannel.js' script

## License

MIT
