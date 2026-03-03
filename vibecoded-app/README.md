# Vibe-Coded App from Claude Code
Study this because it works for some reason. We have to translate this into React JavaScript by the time the presentation arrives

### Stuff I need done
Don't worry about authentication and security for now. I want *Registration* and *Login* pages with the same style before Friday

## How to run
**Create a GitHub Codespace of the `main` branch because I'm too lazy to fix the binary directory of this bum ass blockchain framework. After that, run the instructions below**

0. Drag and drop the `fabric-install.sh` script from the **LINAW/scripts/** directory into the **LINAW/** directory to install the Hyperledger Fabric binaries, code samples, container runtime, and container images. Check the [official documentation](https://hyperledger-fabric.readthedocs.io/en/latest/install.html) for more information.
```bash
./fabric-install.sh
```

1. Go to the `test-network` directory of the **fabric-samples** repository
```bash
# Assuming you're in the `/LINAW/` directory
cd fabric-samples/test-network
```

2. Execute the `network.sh` shell script
```bash
./network.sh up createChannel -ca

# Doesn't matter if you pick Go, Java, JavaScript, or TypeScript for the chaincode
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript

# To see if the containers are running
docker ps
```

3. Install and start the application
```bash
cd ../../vibecoded-app
npm install
npm start
```

4. Cleaning up
```bash
# Press *Ctrl + C* to shutdown the application

# Assuming you're in the **LINAW/vibecoded-app** directory
cd ../fabric-samples/test-network
./network.sh down
docker ps
```
