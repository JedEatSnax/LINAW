### src
## /adapters 
- translate external input/output into your core’s ports and types.

# adapters/controllers
- HTTP controllers (Express route handlers) and/or WebSocket handlers; they parse/validate input, call a use-case, map output to HTTP/WS responses; keep them thin. 
# adapters/fabric
- Your Fabric gateway/client adapter(s) that implement ports defined in core (e.g., LedgerCommitPort or BlockchainGatewayPort), plus mapping to chaincode function calls.
# adapters/repositories
- Concrete implementations of repository ports (e.g., PostgresJournalEntryRepository, MongoJournalEntryRepository, InMemoryJournalEntryRepository for tests).

## /core
- framework-free and contain the rules of your finance app.

# /core/domain
- Entities + value objects + domain rules (e.g., JournalEntry, Money, LedgerAccount, PostingPeriod, invariants like “posted entries cannot be edited”)
# /core/ports
- Interfaces/contracts and DTO types that core depends on (e.g., JournalEntryRepository, EventBus, Clock, IdGenerator). In hexagonal terms: these are your ports.
# /core/use-cases
- Application actions (or “interactors”) like CreateJournalEntry, EditDraftJournalEntry, PostJournalEntry, ReverseJournalEntry, VoidJournalEntry, GetJournalEntry, ListJournalEntries.

## /infrastructure
- where frameworks, configuration, and “composition/wiring” live (Express app setup, DB connection, dependency injection).

# /infractructure/config
- Env parsing, config objects, secrets loading, constants.
# /infrastructrue/database
- DB client setup, migrations, ORM models (if any), connection pooling.

guide ko lng to sa taas para di ako maligaw kung ano dapat ilagay per folder

----------------------------------------------------------------------------------------------------



### So just learned 2/26/26

so I just learnt na mali pala nagiging direction buti di pa ako malalim sa rabit hole ng pag gawa taena.

alsoo nga pala nalaman ko lng din yung couchdb na local yun per peers so no di yun nagagalaw ng backend server pero nakikita ng backend server natin yung nag commit. then again it's a world state for all peers so yeppp... 

just learned also yung immudb na maganda para sa mga monitoring logs in terms of security pero pero I think magiging weird aspect lng to. pero yah maganda to in terms of security.

Pwede pala natin gamiting yung grafana pang visually display yung metrics or montoring data and yung Prometheus yung scraper nung data 

### just managed to do something at least. 2/27/26 4:00 pm

assumptions palang mga api endpoint na, di pa to concrete pero pwede to maging crutch and building blocks para di na natin mold yung buong endpoints need naman to lahat from what i see pero i think may ilan dito grabeng redundant or possible mag karoon ng conflicts dahil sa naming scheme, nabobo nako mag naming legit. anyways try ko taposin yung mga routes muna tas mamaya or bukas after school ko gawin yung mga controllers tingin ko kaya naman after that sana tapos na yung frontend para mabind ko ng maayos at makagawa ng appropriate endpoint response kasi lahat gagawin ko muna tong status 200.

also I think ahh late ko add yung prometheus at grafana after matapos lahat ng endpoint at ng network provisioning tas yung prob na di ko magawa ipaliwanag maski sa sarili ko kasi di ko pa maintindihan yung creation ng blockchain network channel inaaral ko palang idk pa yung pwede ko maging fitfall sa blockchain so imma do the monitoring metrics last.

also just stumbled lng ano yung sa part ng diba di nga dadaan sa server natin yung mga hash na journal entries and weird part lng na di ko pa magawang ipaliwanag yung sa org side access siguro after ng full creation ng backend server then lipat sa org paano nila magagawa makipag communicate sa channel even though nasa system natin yung blockchain nila. Also napansin ko at ngayon ko lng napag isip isip yung sa part ng blockchain explorer sa isang authorized peer lng pala dapat yun kala ko sa server natin hahahaha. 

umm just addition for today lng ahh legit assumptions ko lng to since di pa ko sure sa part ng blockchain gusto ko lng may crutch habang ginagawa habang di ko pa naiimplement yung hyperledger fabric dito gawan ko muna ng standby. 
pwede naman to modify or palitan pag need eh.


nga pala end note lng for today.

seriously I'm sorry yung pag sabi namin kay maam kala talaga namin papabayaan mo na kami bumagsak at sosolohin mo na to, kaya lumapit kami kay maam para malaman namin kung anong pwede namin magawa since yung takot namin na di mo na kami kakausapin. In all seriousness I'm really sorry I didn't intend to put you in any hard situation kay ma'am gargar. also I'll steer clear of you nalang muna, di kita iistorbohin dito nalang sa MD ako maga iwan ng mga notes at mga progress report sayo. That's all thank you and I'm really sorry.

### Api endpoints finished feb/27/26 8:09 pm

umm natapos ko na yung mga asssumption api endpoints papaganahin ko nalang muna to at ipareturn ko ng status 200 muna lahat tas after siguro bukas or later pag kaya pa ng katawan ko gawin ko na yung mga handler functions per endpoint after that implement ko na yung auth.js dito.


### user api endpoints callback/handler function done

ano stop muna ako saglit di ko magets yung sa auth part sa user side whether if lagyan ng auth lahat ng endpoint or something or something something pa. Nag dug deep pako sa supertokens eto free sya if self hosted yun and magiging resource heavy yun if yung 
password hashing is let's max security, sabi na din naman ng supertokens na kaya naman kahit small lng yung computer eh. inaalala lng is yung sa part ng scalling. wala na kasi akong makitang iba para sa auth na supported yung express.js eh di ako makahanap ng auth provider na may maayos na node/express.js support sa docs yung auth.js experimental pa din pala so walang docs paano gamiting ng maayos yun. so yun lumipat at nag hanap pa ako ng auth provider nakita ko yung supertokens at yah nakita ko free lahat basta self hosted open source naman sya eh.

Naisip ko na gumamit nalang ng provider kasi mahirap gumawa ng from scratch na authentication primarily na din yung part ng session tokens or cookies need nun nababawi at nadedelete and nakita ko at nalaman ko na required pala yung mga ganung functionalities nun tyaka sinusunod ko nalang din mga nakita at nabasa ko from reddit na sinabi instead creating from scratch or using JWT na mahirap implement yung ibang needs gumamit nalang ng provider.

so seems like self hosting ng supertokens. aralin ko tas lagay ako ng readme paano lahat gawin yun. try ko gawin detailed as much as possible para medj less stress na sa part ng hosting. so yeupp aaralin ko muna yun para mailagayan ko ng auth yung user side authentication natin. yun lng

### Auth update lng 

nagpagkasunduan namin ni jerome na gumamit ng firebase para sa authentication and wala nang password handling dito sa backend kundi yung firebase na maga handle ng part na yun, less moving parts dito sa backend. Though every signin/login may makukuha yung backend na firebase token id to use for authentication at authorization. Nga pala tama ka grpc nga para sa hyperledger, mybad on that part na puro restful gamit ko di ako mapakali pag wala pang nasusulat kahit ano sa ibat ibang part neto eh. Anyways aaron said he'll handle that part and implement it slowly habang inaaral nya gawin. And for me naman implement ko yung firebase dito sa backend for that firebase UID tas yung DB model para sa user profile lng naman mostly simple lng laman ng user profile though relearn ako sa pag gawa ng DB model limutan ko na paano sulatin in javascript yun. after that yung monitoring naman na tas implementation ng prometheus at grafana. that's all for tonight. I can't work much besides sa aralin yung firebase if viable maging auth para sa safe ng users at ng system natin. that's all. 


### something something update (di ko alam ano itatawag sa progress update na to)

ano... yung firebase auth mangyayari is lahat ng authentication is mangyayari sa frontend side tyaka makakakuha yung frontend ng firebase uid token naisesend sa client server which is yung backend server natin. 

and yah ang fucked up pag di gumamit ng provider auth dahil sa mga random shit na di ko pa kaya explain tulad ng prob sa jwt yung session cookies need nun mag expire at di madali revoke yun. So later ng demo nalang namin gagawin yung auth side gagawa nalang muna ako ng model tas temp db for storing ng user input login/signup. pwede naman mabago ng mabilisan yun right after, wala namang cons yun masyado. nakita kong linear naman yung development ng auth tas sa user, user profiles db, yung sa monitoring late ko na gawin sabayan ko si aaron sa pag gawa ng hyperledger tulungan ko muna sya bago kami gumawa ng monitoring side.

that's all wala naman masyadong ganap besides sa understanding ng auth, sabay side track sa pinatingin mo samin. that's all lng wala nang iba.

### I can't even call this a progress

ginawa ko lng yung database connection muna sa isang cloud provider yung neon.tech for postgres para lang ma-save yung usernames and password galing sa signup/login,  after na ng demo dun ko ayusin  to kasi di na tayo maga save ng mga raw password sa db kundi mga user profile nalang, roles, yung firebase uid, and something something. 

add ko lng gumagana na sa test tong postgres database na to nilagay ko muna sa neon.tech sa demo db ko dun. yun lng naman di ko to i-add sa progress pang demo lng kasi yung ginwa kong to. bukas gawa ako ng database schema para sa mga user profiles yung added na yung firebase auth. anyways yun lng naman

### di ko pa din masasabi na progress to 

gumawa lang ako ng mga database schema mainly puro metadata lng na galing sa frontend like sino gumawa ng network, nag add ng org, roles nila that's pretty much yung schema na meron sa side ng frontend yung the rest like config files alam ko di talag natin sasave sa user/metadata side db, tingin ko di ko muna papahirapan sarili ko sa immuDB di ko magawang isetup eh naliligaw ako sa documentation nun eh, postgres or mysql nalang to.

yung schema di pa yun final, di ako satisfied sa schema eh, Imma study it more if it needs anything na wala dun sa schema. for now progress ako sa setup ng postgres db dito aalamin ko muna how, alam ko lng kasi pag gagamit ng provider tulad ng neon.tech eh so yeah I need to study it before ko implement 