### I'll be pushing this progress_report.md but i won't be adding it to every pr.
so yep i need to at least make some progress_report not just for me to keep track of what I'm actually doing but to also give you an idea on what I'm actually doing. I'll be deleting this markdown in my branch whenever I'm creating a pull request. I'll keep that in mind so I won't accidentally merge some unnecessary file in main. That's all

### Postgres db
- I noticed some issue on providers though it's safe in production level but we'll be relying on it for db. I'm worried that when we present another progress presentation neon.tech the postgres cloud provider might be down or having issues it can really mess up our progress presentation. So I planned to use postgres and run it through docker this is good for development and thesis since we hold everything, though this will suck at scalling, monitoring and backups since we'll be doing it all manually. I think this will suffice for our need for now, our thesis won't be an actually be in production if I'm correct. 

Also i remember we're going local right? everything local hosting, so this docker postgres will be more than enough if it's just development, thesis and demo. 

Furthermore I have learned a way to add some monitoring for the postgres docker and I'll do the immudb kinda last i can't say but for sure it'll be right at the end. 

<<<<<<< HEAD:.github/progress_report.md
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

<<<<<<< HEAD:.github/progress_report.md
>>>>>>> 4e75c51 (setup local postgres docker for more details please refer to docs/progres_report.md):docs/progress_report.md
=======
- Routes → Controllers → Services (validate model) → DAOs → DB.

this is the most that I can do i won't be adding middleware and the utils or helpers from what i see it won't be needed as much and this will lessen the thickness of the code for the two of us writing the backend. 

knex.js setup is done, i need to refactor almost everything for knex.js.

I'll finish later the login endpoint idk why it keeps saying users table not defined
>>>>>>> 91b6231 (refactors the old database implementation to postgres docker):docs/progress_report.md
