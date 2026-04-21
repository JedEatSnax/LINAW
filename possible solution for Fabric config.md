possible solution for the fabric config idk if this will work but i think it's worth a shot.

our backend, postgres, pgadmin, (soon blob storage will be in a same docker compose ) but the fabric related is separated from the backend docker compose. Suggestions ng google a.i possible lng nag double check din ako across the links and i think viable din to pero di ako 100% sure dito


To connect your containerized Node.js backend to your Hyperledger Fabric network when they are managed by different docker-compose files, you must implement a shared external network. This allows the backend to resolve the Fabric Peer and CA containers by their service names

Step 1: Create a Global External Network
Infrastructure must manually create a persistent network that exists outside of any specific Compose project. 

docker network create fabric_shared


Step 2: Configure the Fabric Network (docker-compose-fabric.yaml)
Update your existing Fabric infrastructure to join the new shared network.

    Infrastructure Change: Add fabric_shared to each Peer, Orderer, and CA service.
    Network Declaration: Set the network as external: true at the bottom of the file. (https://stackoverflow.com/questions/56152767/i-want-to-build-a-hyperledger-fabric-network-running-on-multiple-hosts-with-mult)
    
yaml    
    services:
  peer0.org1.example.com:
    # ... existing config ...
    networks:
      - fabric_shared

networks:
  fabric_shared:
    external: true

Step 3: Configure the Backend Stack (docker-compose-backend.yaml)
The backend service needs access to both your database and the Fabric network. 

    Multi-Homing: Connect the backend service to both its internal db_network and the fabric_shared network.
    Crypto Mounting: Use bind mounts to inject the required certificates into the backend container so your Node.js code can access them. (https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Foneuptime.com%2Fblog%2Fpost%2F2026-01-25-communication-between-docker-compose-projects%2Fview&ved=0CAEQ1fkOahgKEwjwydPRtP-TAxUAAAAAHQAAAAAQ5AM&opi=89978449)
    
yaml

services:
  backend:
    build: .
    networks:
      - db_network       # For Postgres/PgAdmin
      - fabric_shared    # For Fabric Peer/CA
    volumes:
      # Map host crypto folder to a specific path inside the container
      - ./organizations:/usr/src/app/organizations:ro
    env_file:
      - .env

networks:
  db_network:
  fabric_shared:
    external: true



Step 4: Align Environment Variables (.env)
Update your backend environment variables to use the Docker Service Names as hostnames. The Node.js Gateway SDK will use these to find the nodes on the shared network (https://hyperledger.github.io/fabric-sdk-node/main/tutorial-discovery-fabric-network.html)

# Internal Docker DNS names
FABRIC_PEER_ENDPOINT=peer0.org1.example.com:7051
FABRIC_CA_SERVER_PORT=7054

# Absolute paths INSIDE the container (matching Step 3 volume mount)
FABRIC_CERT_PATH=/usr/src/app/organizations/peerOrganizations/://example.com
FABRIC_KEY_DIRECTORY_PATH=/usr/src/app/organizations/peerOrganizations/://example.com
FABRIC_TLS_CERT_PATH=/usr/src/app/organizations/peerOrganizations/://example.com


Summary for Team Leads

    Infra: Ensure all containers are on the fabric_shared bridge; use the Docker Network Connect command for existing running containers if needed.
    Blockchain Dev: Update the fabricConfig logic to point to the mounted /usr/src/app/organizations paths instead of local host paths.
    Security: The use of external networks ensures that while the backend can talk to both stacks, the database remains isolated from the Fabric network. 




