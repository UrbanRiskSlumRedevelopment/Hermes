#!/bin/bash
#try to stop the service if it is running:
if hash systemctl 2>/dev/null; then
  #only run the stop system command if systemctl exists.
	#need to stop the service otherwise systemd will restart the
	#container when we kill it down below
  sudo systemctl stop docker-hermes.service
fi
sudo docker kill hermes-server
sudo docker rm hermes-server
sudo docker run -p 8001:4001 -d --name "hermes-server" hermes/hermes-web-app
