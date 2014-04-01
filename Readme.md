## Precise.io Server
A Precise.io Server is a slightly adjusted DataChannel.io Server. All credits go to DataChannel.io for handling the WebRTC DataChannels and forwarding data, when ever the WebRTC connection fails.

## DataChannel.io

Datachannel.io is inspired by the amazing socket.io framework and implements a real-time communication using the WebRTC technology.
Peers are directly connected and datas are exchanged between clients without passing throug the server.

Socket.io has two purposes:
* Serve signals between clients needed to coordinate the communication.
* In case peer-to-peer communication fails or your browser does not support WebRTC, socket.io serve also the data message.
 
#### License

MIT

## How To Set up your Precise.io Server
This installation guide is assumes you are using a Debian or Ubuntu Server. It is however not too difficult to adopt these steps to other systems, since node.js works on as good as any platform.

1. Fetch the code from this repository as zip or by cloning
2. Copy it to a folder 'preciseio' on your server ( e.g. /home/you/preciseio )
3. Install nodejs and npm.

	`$ apt-get install nodejs npm`

4. cd into your folder

	`$ cd /home/you/preciseio`

5. Install the required modules

	`$ npm install`

6. find the ip address of your server using

	`$ ifconfig`

7. go to your precise.io account and add a new configuration using your ip and the port 9000
8. activate your just created configuration	
9. back at your server, run the script

	`$ nodejs runDataChannel.js`
	
You should now be running on your local server!

## License

MIT
