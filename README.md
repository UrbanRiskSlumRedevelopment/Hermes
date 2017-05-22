# Hermes
Node server that inputs data from data collection android app and outputs to Ashwin and Maya

# Docker
We use docker to deploy and test images. To build the image for the Hermes server, do: 
`docker build -t <username>/hermes-web-app .` 
Inside the root folder. 

This will create an image with npm, node, and our dependencies. To run the container, do: 

`docker run -p <host port>:4001 -d <username>/hermes-web-app`

This will start the container and have it exponsed at the port you specify in `<host port>`.
