### Postgres db
- I noticed some issue on providers though it's safe in production level but we'll be relying on it for db. I'm worried that when we present another progress presentation neon.tech the postgres cloud provider might be down or having issues it can really mess up our progress presentation. So I planned to use postgres and run it through docker this is good for development and thesis since we hold everything, though this will suck at scalling, monitoring and backups since we'll be doing it all manually. I think this will suffice for our need for now, our thesis won't be an actually be in production if I'm correct. 

Also i remember we're going local right? everything local hosting, so this docker postgres will be more than enough if it's just development, thesis and demo. 

Furthermore I have learned a way to add some monitoring for the postgres docker and I'll do the immudb kinda last i can't say but for sure it'll be right at the end. 

I'll be pushing this progress_report.md but i'll try to not add it to every pr.

Currently trying to make git ignore this file and reading postgres docs for docker.