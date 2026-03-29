'use strict';

const fs = require('fs');
const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');

/*
File that handles gRPC connection and Hyperledger Fabric gateway
*/