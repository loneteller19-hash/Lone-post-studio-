const express=require("express"),multer=require("multer"),fs=require("fs"),path=require("path");
const {OAuth2Client}=require("google-auth-library");
const {youtube}=require("@googleapis/youtube");
try{for(const l of fs.readFileSync(".env","utf8").split("\n")){const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2]}}catch{}
const E=process.env,PORT=E.PORT||3000,BASE=E.BASE_URL||`http://localhost:${PORT}`,PUB=()=>E.PUBLIC_URL||BASE;
for(const d of["uploads","data"])fs.mkdirSync(d,{recursive:true});
const rd=(f,d)=>{try{return JSON.parse(fs.readFileSync(f))}catch{return d}},wr=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,1));
const TOK="data/google.json",JOBS="data/jobs.json";
let jobs=rd(JOBS,[]);
const oauth=()=>new OAuth2Client(E.GOOGLE_CLIENT_ID,E.GOOGLE_CLIENT_SECRET,BASE+"/auth/google/callback");
const app=express(),up=multer({dest:"uploads/",limits:{fileSize:2e9}});
app.use(express.static("public"));app.use("/uploads",express.static("uploads"));

app.get("/auth/google",(q,r)=>r.redirect(oauth().generateAuthUrl({access_type:"offline",prompt:"consent",scope:["https://www.googleapis.com/auth/youtube.upload"]})));
app.get("/auth/google/callback",async(q,r)=>{try{const{tokens}=await oauth().getToken(q.query.code);wr(TOK,tokens);r.redirect("/")}catch(e){r.status(500).send("Google sign-in failed: "+e.message)}});
app.get("/api/status",(q,r)=>r.json({youtube:fs.existsSync(TOK),instagram:!!(E.IG_USER_ID&&E.IG_ACCESS_TOKEN),jobs}));

app.post("/api/post",up.single("video"),(q,r)=>{
  if(!q.file)return r.status(400).json({error:"Choose a video file"});
  const b=q.body,platforms=JSON.parse(b.platforms||"[]");
  if(!b.title||!platforms.length)return r.status(400).json({error:"Title and a platform are required"});
  const job={id:Date.now(),file:q.file.filename,title:b.title,description:b.description||"",platforms,short:b.short==="true",
    at:b.scheduleAt?new Date(b.scheduleAt).getTime():Date.now(),state:"scheduled",results:{}};
  jobs.push(job);wr(JOBS,jobs);run();r.json({ok:true,id:job.id});
});

async function toYouTube(j){
  const a=oauth();a.setCredentials(rd(TOK,null)||{});
  a.on("tokens",t=>wr(TOK,{...rd(TOK,{}),...t}));
  const tag=j.short&&!/#shorts/i.test(j.title+j.description)?" #Shorts":"";
  const res=await youtube({version:"v3",auth:a}).videos.insert({part:"snippet,status",
    requestBody:{snippet:{title:(j.title+tag).slice(0,100),description:j.description+tag},status:{privacyStatus:"public"}},
    media:{body:fs.createReadStream("uploads/"+j.file)}});
  return"https://youtu.be/"+res.data.id;
}
async function toInstagram(j){
  const g=(p,o)=>fetch("https://graph.facebook.com/v21.0/"+p,o).then(r=>r.json());
  const c=await g(E.IG_USER_ID+"/media",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({media_type:"REELS",video_url:`${PUB()}/uploads/${j.file}`,caption:`${j.title}\n\n${j.description}`,access_token:E.IG_ACCESS_TOKEN})});
  if(!c.id)throw new Error(c.error?.message||"Instagram rejected the video");
  for(let i=0;i<60;i++){
    const s=await g(`${c.id}?fields=status_code&access_token=${E.IG_ACCESS_TOKEN}`);
    if(s.status_code==="FINISHED")break;
    if(s.status_code==="ERROR")throw new Error("Instagram could not process the video");
    await new Promise(r=>setTimeout(r,5000));
  }
  const p=await g(E.IG_USER_ID+"/media_publish",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({creation_id:c.id,access_token:E.IG_ACCESS_TOKEN})});
  if(!p.id)throw new Error(p.error?.message||"Publish failed");
  return"Published (id "+p.id+")";
}
let busy=false;
async function run(){
  if(busy)return;busy=true;
  try{for(const j of jobs.filter(x=>x.state==="scheduled"&&x.at<=Date.now())){
    j.state="posting";wr(JOBS,jobs);
    await Promise.all(j.platforms.map(async p=>{
      try{j.results[p]={ok:true,msg:await(p==="youtube"?toYouTube:toInstagram)(j)}}
      catch(e){j.results[p]={ok:false,msg:e.message}}}));
    j.state="done";wr(JOBS,jobs);
  }}finally{busy=false}
}
jobs.forEach(j=>{if(j.state==="posting")j.state="scheduled"});
setInterval(run,30000);
app.listen(PORT,()=>console.log("Lone Post Studio on "+BASE));
