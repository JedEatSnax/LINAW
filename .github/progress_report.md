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

------------------------------------------------------------------
- I won't lie i got confused by docker but all goods up and running

so here to run the docker 

cd into root and run docker compose -d postgres

to check whether the backend is connected you need the url for the database just mention me or message me for the .env file. 

also for anyone testing it one must need the database folder sitting inside the application dir.

also I delete the unnecessary api endpoint in server.js




>>>>>>> 4e75c51 (setup local postgres docker for more details please refer to docs/progres_report.md):docs/progress_report.md
