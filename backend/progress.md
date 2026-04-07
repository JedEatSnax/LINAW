### I'll be pushing this progress_report.md but i won't be adding it to every pr.
so yep i need to at least make some progress_report not just for me to keep track of what I'm actually doing but to also give you an idea on what I'm actually doing. I'll be deleting this markdown in my branch whenever I'm creating a pull request. I'll keep that in mind so I won't accidentally merge some unnecessary file in main. That's all

### Postgres db
- I noticed some issue on providers though it's safe in production level but we'll be relying on it for db. I'm worried that when we present another progress presentation neon.tech the postgres cloud provider might be down or having issues it can really mess up our progress presentation. So I planned to use postgres and run it through docker this is good for development and thesis since we hold everything, though this will suck at scalling, monitoring and backups since we'll be doing it all manually. I think this will suffice for our need for now, our thesis won't be an actually be in production if I'm correct. 

Also i remember we're going local right? everything local hosting, so this docker postgres will be more than enough if it's just development, thesis and demo. 

Furthermore I have learned a way to add some monitoring for the postgres docker and I'll do the immudb kinda last i can't say but for sure it'll be right at the end. 

Currently trying to make git ignore this file and reading postgres docs for docker.

I'll be pushing this progress_report.md but i'll try to not add it to every pr.

### Setup postgres docker and created the connection 03/09/2026

- I managed to setup the connection for the postgres db hosted on docker so yep. 

- I won't lie i got confused by docker but all goods up and running

so here to run the docker 

cd into root and run docker compose up -d 

to check whether the backend is connected you need the url for the database just mention me or message me for the .env file. 

also for anyone testing it one must need the database folder sitting inside the application dir.

also I delete the unnecessary api endpoint in server.js

### so some updates on the database 03/10/2026 12:51 am

- yep i fully set it up, now i learned just now that controllers literally doesn't have access to the data layer and it only handles req and res. More abstractions. so yep this is getting deep so fast and the entire codebase is getting thicker by the second and yep learned that controllers shouldn't have any data access, currently doing it as of the moment, and trying to implement it asap first i need to abstract the backend for maintenance, tests, resuable also this kind of architecture or structure will separate every concerns so controllers won't really become fat later and just stay as http only. the reason for the services is really just business rules or the logic really. the data access object (DAO) literally isolates the db code. These changes will literally give us scalability in the backend then again we can add more features later down.

if I made this correct and understand this almost near prod level backend with maintainability in mind 

- Routes → Controllers → Services (validate model) → DAOs → DB.

this is the most that I can do i won't be adding middleware and the utils or helpers from what i see it won't be needed as much and this will lessen the thickness of the code for the two of us writing the backend. 

knex.js setup is done, i need to refactor almost everything for knex.js.

I'll finish later the login endpoint idk why it keeps saying users table not defined

### studied user based authorization 03/19/26

so the Role based access control is a dynamic role only changing when you are a member of an organization's network and whether you are managing a node or not that's the role based part. so yeah that's the authorization.

in terms of the database it's already done and fully running just needs data and correct schema for it. Some columns are still unknown and I just don't wanna create unecessary columns or a table that lacks a certain column.

okay in much more deep dive for the encryption, I won't lie I have been enlightened by many things like the docs of cloudflare, nginx, and apache hahahahhaha. apparently you were right and devops will handle the encryption of the server via nany one of this or something cloudflare, nginx, and apache to make the connection between the front and backend encrypted and secured and on my part is the authentication and authorization which i got it settled just implementing it right about now. 

for now the authorization will take a bit more time dynamic role fucks with me. Imma first go for the most basic one plain user like as in plain i can refactor it anyway.

### re-created db

so yep i disabled for now the firebase auth. frontend is taking too long to integrate backend but it's okay, re-implementation is easy enough of me that i can do it in 5-15 mins depending on the scale but yeah I created network creation endpoint. btw the part of why there's a separate for organization creation umm when we create a user it doesn't have any organization so yep it needs to create an org first and I tested this it works imma check for further bugs tommorrow night and then i'll write the implementaion of hyperledger fabric. thanks btw for that repo that teaches that in code.

### 03/25/26 progress

so I made some progress. I implemented RBAC alongside with RuBAC, though rules will be done a bit more later than I wanted too. I also implement rate limiting. everything is protected just waiting for that frontend to backend integration. 

also imma drop organizations table and network table for now since i kinda just did it without really talking to aaron our dev for hyperledger implementation. anyways i can always adjust and recreate it anyways. 

i made sure i that the endpoints are now protected with firebase auth. The authorization is still not complete if you see the permissions. Still work in progress.


### 03/29/ 26 -> 04/02/2026 

During my mental health break from March 29, 2026 to April 3, 2026, I was able to complete significant development work related to the client-side Hyperledger Fabric integration. Specifically, I finished the implementation of Fabric-connected endpoints from the routing layer up to the application service layer, and I also developed supporting backend components such as validations, unit tests, a centralized error handler, Fabric gateway connection setup, Fabric configuration, and the service layer responsible for actual blockchain communication.

### 04/07/ 26 

bruh respectfully what in the fuck? hahahaha our transaction page in the frontend literally copies what the fabric samples does and I dugged deeps i noticed that even the chaincode for basic in the fabric samples are literally the same no other way around it. I'll write another chaincode for later i guess after finals or something, pretty much it will be another new endpoints. I'll be writing that after all of the chaos in our subjects subside. I'll write a literally custom chaincode after i settled everything. so yepp imma finish the basic asset transfer chaincode and prep another new chaincode for later. 

The asset-transfer basic should suffice for our mvp. Though i'll make sure to write another for sure custom chaincode. 

I think the best course of action instead of adding that new shit asap is to finish the mvp first like literally, I'll be finishing everything first before doing that new chaincode cause it'll need a lot of new things endpoints, controllers, service layer and another new validator.