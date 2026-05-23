// OneGrasp Psychometric Scoring Engine — fully dynamic, 131 questions
export type Answer = {
  question_id: number;
  question_number: number;
  selected_answer: string;
};

const SCORE_MAP: Record<string, number> = {
  "Strongly Agree": 5, Agree: 4, Neutral: 3, Disagree: 2, "Strongly Disagree": 1,
  Yes: 5, Maybe: 3, No: 1,
  "Completely true": 5, "Mostly true": 4, "Mostly false": 2, "Completely false": 1,
  Always: 5, Often: 4, Sometimes: 3, Rarely: 2, Never: 1,
};

type QDim =
  | { section: "interest"; sub: string }
  | { section: "personality"; sub: "EI" | "SN" | "TF" | "JP"; polarity: 1 | -1 }
  | { section: "eq"; sub: string }
  | { section: "motivator"; sub: string };

const Q_MAP: Record<number, QDim> = {
  1:{section:"interest",sub:"Realistic"},2:{section:"interest",sub:"Realistic"},3:{section:"interest",sub:"Realistic"},4:{section:"interest",sub:"Realistic"},5:{section:"interest",sub:"Realistic"},6:{section:"interest",sub:"Realistic"},7:{section:"interest",sub:"Realistic"},
  8:{section:"interest",sub:"Investigative"},9:{section:"interest",sub:"Investigative"},10:{section:"interest",sub:"Investigative"},11:{section:"interest",sub:"Investigative"},12:{section:"interest",sub:"Investigative"},13:{section:"interest",sub:"Investigative"},14:{section:"interest",sub:"Investigative"},
  15:{section:"interest",sub:"Artistic"},16:{section:"interest",sub:"Artistic"},17:{section:"interest",sub:"Artistic"},18:{section:"interest",sub:"Artistic"},19:{section:"interest",sub:"Artistic"},20:{section:"interest",sub:"Artistic"},21:{section:"interest",sub:"Artistic"},
  22:{section:"interest",sub:"Social"},23:{section:"interest",sub:"Social"},24:{section:"interest",sub:"Social"},25:{section:"interest",sub:"Social"},26:{section:"interest",sub:"Social"},27:{section:"interest",sub:"Social"},28:{section:"interest",sub:"Social"},
  29:{section:"interest",sub:"Enterprising"},30:{section:"interest",sub:"Enterprising"},31:{section:"interest",sub:"Enterprising"},32:{section:"interest",sub:"Enterprising"},33:{section:"interest",sub:"Enterprising"},34:{section:"interest",sub:"Enterprising"},
  35:{section:"interest",sub:"Conventional"},36:{section:"interest",sub:"Conventional"},37:{section:"interest",sub:"Conventional"},38:{section:"interest",sub:"Conventional"},39:{section:"interest",sub:"Conventional"},40:{section:"interest",sub:"Conventional"},
  41:{section:"personality",sub:"EI",polarity:1},42:{section:"personality",sub:"EI",polarity:1},43:{section:"personality",sub:"EI",polarity:1},44:{section:"personality",sub:"EI",polarity:1},45:{section:"personality",sub:"EI",polarity:1},
  46:{section:"personality",sub:"EI",polarity:-1},47:{section:"personality",sub:"EI",polarity:-1},48:{section:"personality",sub:"EI",polarity:-1},49:{section:"personality",sub:"EI",polarity:-1},50:{section:"personality",sub:"EI",polarity:-1},
  51:{section:"personality",sub:"SN",polarity:1},52:{section:"personality",sub:"SN",polarity:1},53:{section:"personality",sub:"SN",polarity:1},54:{section:"personality",sub:"SN",polarity:1},55:{section:"personality",sub:"SN",polarity:1},
  56:{section:"personality",sub:"SN",polarity:-1},57:{section:"personality",sub:"SN",polarity:-1},58:{section:"personality",sub:"SN",polarity:-1},59:{section:"personality",sub:"SN",polarity:-1},60:{section:"personality",sub:"SN",polarity:-1},
  61:{section:"personality",sub:"TF",polarity:1},62:{section:"personality",sub:"TF",polarity:1},63:{section:"personality",sub:"TF",polarity:1},64:{section:"personality",sub:"TF",polarity:1},65:{section:"personality",sub:"TF",polarity:1},
  66:{section:"personality",sub:"TF",polarity:-1},67:{section:"personality",sub:"TF",polarity:-1},68:{section:"personality",sub:"TF",polarity:-1},69:{section:"personality",sub:"TF",polarity:-1},70:{section:"personality",sub:"TF",polarity:-1},
  71:{section:"personality",sub:"JP",polarity:1},72:{section:"personality",sub:"JP",polarity:1},73:{section:"personality",sub:"JP",polarity:1},74:{section:"personality",sub:"JP",polarity:1},75:{section:"personality",sub:"JP",polarity:1},
  76:{section:"personality",sub:"JP",polarity:-1},77:{section:"personality",sub:"JP",polarity:-1},78:{section:"personality",sub:"JP",polarity:-1},79:{section:"personality",sub:"JP",polarity:-1},80:{section:"personality",sub:"JP",polarity:-1},
  81:{section:"eq",sub:"Self Awareness"},82:{section:"eq",sub:"Self Awareness"},83:{section:"eq",sub:"Self Awareness"},84:{section:"eq",sub:"Self Awareness"},85:{section:"eq",sub:"Self Awareness"},86:{section:"eq",sub:"Self Awareness"},
  87:{section:"eq",sub:"Managing Emotions"},88:{section:"eq",sub:"Managing Emotions"},89:{section:"eq",sub:"Managing Emotions"},90:{section:"eq",sub:"Managing Emotions"},91:{section:"eq",sub:"Managing Emotions"},92:{section:"eq",sub:"Managing Emotions"},
  93:{section:"eq",sub:"Motivation"},94:{section:"eq",sub:"Motivation"},95:{section:"eq",sub:"Motivation"},96:{section:"eq",sub:"Motivation"},97:{section:"eq",sub:"Motivation"},98:{section:"eq",sub:"Motivation"},
  99:{section:"eq",sub:"Empathy"},100:{section:"eq",sub:"Empathy"},101:{section:"eq",sub:"Empathy"},102:{section:"eq",sub:"Empathy"},103:{section:"eq",sub:"Empathy"},104:{section:"eq",sub:"Empathy"},
  105:{section:"eq",sub:"Relationship Management"},106:{section:"eq",sub:"Relationship Management"},107:{section:"eq",sub:"Relationship Management"},108:{section:"eq",sub:"Relationship Management"},109:{section:"eq",sub:"Relationship Management"},110:{section:"eq",sub:"Relationship Management"},
  111:{section:"motivator",sub:"High Paced Environment"},112:{section:"motivator",sub:"High Paced Environment"},113:{section:"motivator",sub:"High Paced Environment"},
  114:{section:"motivator",sub:"Creativity"},115:{section:"motivator",sub:"Creativity"},116:{section:"motivator",sub:"Creativity"},
  117:{section:"motivator",sub:"Adventure"},118:{section:"motivator",sub:"Adventure"},119:{section:"motivator",sub:"Adventure"},
  120:{section:"motivator",sub:"Social Service"},121:{section:"motivator",sub:"Social Service"},122:{section:"motivator",sub:"Social Service"},
  123:{section:"motivator",sub:"Continuous Learning"},124:{section:"motivator",sub:"Continuous Learning"},125:{section:"motivator",sub:"Continuous Learning"},
  126:{section:"motivator",sub:"Structured Work Environment"},127:{section:"motivator",sub:"Structured Work Environment"},128:{section:"motivator",sub:"Structured Work Environment"},
  129:{section:"motivator",sub:"Independence"},130:{section:"motivator",sub:"Independence"},131:{section:"motivator",sub:"Independence"},
};

function pct(raw:number,max:number,cnt:number){if(!cnt)return 0;return Math.round((raw/(max*cnt))*100);}
function eqLevel(p:number){return p>=70?"High":p>=50?"Medium":"Low";}

export type CareerPath={name:string;roles:string;psyScore:number;skillScore:number;comment:"Top Choice"|"Good Choice"|"Optional"|"Avoid";};
export type CareerClusterData={name:string;description:string[];paths:CareerPath[];};
export type ReportData={
  mbti:{EI:number;SN:number;TF:number;JP:number;type:string;typeLabel:string;EI_dir:string;SN_dir:string;TF_dir:string;JP_dir:string;};
  interests:{name:string;pct:number}[];topInterests:string;
  eq:{name:string;pct:number;level:string}[];
  motivators:{name:string;pct:number}[];topMotivators:string[];
  planningStage:"Unaware"|"Confused"|"Exploring"|"Clarity"|"Future-Ready";planningStageDesc:string;planningRisk:string;planningAction:string;
  skills:{name:string;pct:number;label:string;desc:string[]}[];overallSkillPct:number;
  learningStyles:{name:string;pct:number}[];dominantLearning:string;
  clusters:{name:string;pct:number}[];topClusters:CareerClusterData[];
  favouritePath:string;careerFocus:string;
  strengthsBullets:string[];gapBullets:string[];
  eduRoadmap:{stages:{stage:string;subject:string;courses:string[];occupations?:string[]}[];};
  salary:{level:string;amount:string}[];
  pathSkills:{name:string;pct:number;sub:string}[];
  personalityType:string;
};

export function generateReport(answers:Answer[]):ReportData{
  const iRaw:Record<string,number>={Realistic:0,Investigative:0,Artistic:0,Social:0,Enterprising:0,Conventional:0};
  const iCnt:Record<string,number>={Realistic:0,Investigative:0,Artistic:0,Social:0,Enterprising:0,Conventional:0};
  const pRaw:Record<string,number>={EI:0,SN:0,TF:0,JP:0};
  const eRaw:Record<string,number>={"Self Awareness":0,"Managing Emotions":0,Motivation:0,Empathy:0,"Relationship Management":0};
  const eCnt:Record<string,number>={"Self Awareness":0,"Managing Emotions":0,Motivation:0,Empathy:0,"Relationship Management":0};
  const mRaw:Record<string,number>={"High Paced Environment":0,Creativity:0,Adventure:0,"Social Service":0,"Continuous Learning":0,"Structured Work Environment":0,Independence:0};
  const mCnt:Record<string,number>={"High Paced Environment":0,Creativity:0,Adventure:0,"Social Service":0,"Continuous Learning":0,"Structured Work Environment":0,Independence:0};

  answers.forEach(a=>{
    const s=SCORE_MAP[a.selected_answer]??3;
    const d=Q_MAP[a.question_number];
    if(!d)return;
    if(d.section==="interest"){iRaw[d.sub]+=s;iCnt[d.sub]++;}
    else if(d.section==="personality"){pRaw[d.sub]+=s*d.polarity;}
    else if(d.section==="eq"){eRaw[d.sub]+=s;eCnt[d.sub]++;}
    else if(d.section==="motivator"){mRaw[d.sub]+=s;mCnt[d.sub]++;}
  });

  function mbtiPct(raw:number){return Math.round(((Math.max(-20,Math.min(20,raw))+20)/40)*100);}
  const EI=mbtiPct(pRaw.EI);const SN=mbtiPct(pRaw.SN);const TF=mbtiPct(pRaw.TF);const JP=mbtiPct(pRaw.JP);
  const EI_dir=EI>=50?"E":"I";const SN_dir=SN>=50?"S":"N";const TF_dir=TF>=50?"F":"T";const JP_dir=JP>=50?"J":"P";
  const type=`${EI_dir}${SN_dir}${TF_dir}${JP_dir}`;
  const EI_d=EI>=50?EI:100-EI;const SN_d=SN>=50?SN:100-SN;const TF_d=TF>=50?TF:100-TF;const JP_d=JP>=50?JP:100-JP;
  const typeLabel=[EI>=50?"Extrovert":"Introvert",SN>=50?"Sensing":"iNtuitive",TF>=50?"Feeling":"Thinking",JP>=50?"Judging":"Perceiving"].join(" · ");

  const interests=Object.entries(iRaw).map(([n,r])=>({name:n,pct:pct(r,5,iCnt[n]||7)})).sort((a,b)=>b.pct-a.pct);
  const topInterests=interests.slice(0,2).map(i=>i.name).join(" & ");
  const eq=Object.entries(eRaw).map(([n,r])=>{const p=pct(r,5,eCnt[n]||6);return{name:n,pct:p,level:eqLevel(p)};});
  const motivators=Object.entries(mRaw).map(([n,r])=>({name:n,pct:pct(r,5,mCnt[n]||3)})).sort((a,b)=>b.pct-a.pct);
  const topMotivators=motivators.slice(0,3).map(m=>m.name);

  const si=interests.find(i=>i.name==="Social")?.pct??50;
  const ii=interests.find(i=>i.name==="Investigative")?.pct??50;
  const ci=interests.find(i=>i.name==="Conventional")?.pct??50;
  const ei=interests.find(i=>i.name==="Enterprising")?.pct??50;
  const ai=interests.find(i=>i.name==="Artistic")?.pct??50;
  const ri=interests.find(i=>i.name==="Realistic")?.pct??50;
  const rm=eq.find(e=>e.name==="Relationship Management")?.pct??50;
  const mo=eq.find(e=>e.name==="Motivation")?.pct??50;
  const em=eq.find(e=>e.name==="Empathy")?.pct??50;
  const sa=eq.find(e=>e.name==="Self Awareness")?.pct??50;

  const clarity=(interests.reduce((s,i)=>s+i.pct,0)/6+eq.reduce((s,e)=>s+e.pct,0)/5)/2;
  let planningStage:ReportData["planningStage"],planningStageDesc:string,planningRisk:string,planningAction:string;
  if(clarity>=75){planningStage="Future-Ready";planningStageDesc="You are future-ready in career planning. You have a clear understanding of your career goals and have already taken significant steps toward achieving them.";planningRisk="Stagnation if you stop updating your skills; over-confidence.";planningAction="Execute your plan > Keep upskilling > Network strategically > Seek mentorship.";}
  else if(clarity>=62){planningStage="Clarity";planningStageDesc="You have achieved clarity in your career planning. You have a good idea of the career path you want to pursue and are actively working towards it.";planningRisk="Delayed execution, not acting on clarity in time.";planningAction="Start executing your plan > Build required skills > Network > Apply early.";}
  else if(clarity>=48){planningStage="Exploring";planningStageDesc="You are at the exploring stage. You are actively exploring different career options and trying to find the best fit. You are aware of your interests but still gathering information.";planningRisk="Analysis paralysis, spending too much time exploring without deciding.";planningAction="Shortlist 2–3 options > Research deeply > Talk to professionals > Decide.";}
  else if(clarity>=35){planningStage="Confused";planningStageDesc="You are at the confused stage in career planning. We understand that you are having little idea of career planning, but usually confused among various career options. At this stage, you are looking for proper guidance.";planningRisk="Wrong selection of a career path, career dissatisfaction, and self-interest mismatch.";planningAction="Explore your strengths and weakness > Explore career options > Gather information > Match best suitable option > Early execution.";}
  else{planningStage="Unaware";planningStageDesc="You are at the unaware stage. You may not yet have thought seriously about your career path. This is the beginning of your career planning journey.";planningRisk="Missed opportunities, reactive career choices, lack of direction.";planningAction="Start self-discovery > Take interest assessments > Speak with a career counsellor > Begin exploring.";}

  function cap(v:number){return Math.max(20,Math.min(95,Math.round(v)));}
  const skills=[
    {name:"Numerical Ability",pct:cap(ci*0.5+ii*0.3+EI_d*0.2),label:"",desc:["Your numerical skills are good.","Numeracy involves an understanding of numerical data and numbers.","Being competent and confident while working with numbers holds an advantage in a wide range of career options."]},
    {name:"Logical Ability",pct:cap(ii*0.5+SN_d*0.3+ci*0.2),label:"",desc:["Your logical skills are good.","Logical thinking is very important for analytical profiles.","Being able to understand and analyze data in different formats is considered an essential skill in many career options."]},
    {name:"Verbal Ability",pct:cap(si*0.4+ai*0.3+EI*0.3),label:"",desc:["Your communication skills are good.","Good verbal and written communication helps you communicate your message effectively."]},
    {name:"Administrative and Organizing Skills",pct:cap(ci*0.4+JP_d*0.3+mo*0.3),label:"",desc:["Your organizing & planning skills are good.","It includes general organizing, planning, time management, scheduling, coordinating resources and meeting deadlines."]},
    {name:"Spatial & Visualization Ability",pct:cap(ai*0.5+ri*0.3+SN_d*0.2),label:"",desc:["Your visualization skills are average.","This skill allows you to explore, analyze, and create visual solutions.","It is important in many academic and professional career fields."]},
    {name:"Leadership & Decision Making Skills",pct:cap(ei*0.35+rm*0.35+mo*0.3),label:"",desc:["Your leadership & decision-making skills are good.","It includes strategic thinking, planning, people management, change management, communication, and persuasion and influencing.","These skills allow you to make decisions quickly, adapt to changing scenarios and respond to opportunities promptly."]},
    {name:"Social & Co-operation Skills",pct:cap(si*0.4+em*0.3+rm*0.3),label:"",desc:["Your social and cooperation skills are good.","Social skills are important because they help you build, maintain and grow relationships with others.","This skill is beneficial in the service industry and social causes."]},
    {name:"Mechanical Abilities",pct:cap(ri*0.6+SN_d*0.4),label:"",desc:["The score indicates that your mechanical ability is good.","This section evaluates your basic mechanical understanding and mechanical knowledge.","This skill is required for many career options like engineering and mechanical services."]},
  ];
  skills.forEach(s=>{if(s.pct>=80)s.label="Excellent";else if(s.pct>=65)s.label="Good";else if(s.pct>=50)s.label="Average";else s.label="Needs Improvement";});
  const overallSkillPct=Math.round(skills.reduce((s,k)=>s+k.pct,0)/skills.length);

  const aL=cap(si*0.4+EI*0.3+sa*0.3);const rL=cap(ci*0.4+JP_d*0.3+SN_d*0.3);const vL=cap(ai*0.5+SN_d*0.3+ii*0.2);const kL=cap(ri*0.5+ei*0.3+25);
  const tot=aL+rL+vL+kL;
  const learningStyles=[{name:"Auditory Learning",pct:Math.round(aL/tot*100)},{name:"Read & Write Learning",pct:Math.round(rL/tot*100)},{name:"Visual Learning",pct:Math.round(vL/tot*100)},{name:"Kinesthetic Learning",pct:Math.round(kL/tot*100)}].sort((a,b)=>b.pct-a.pct);
  const dominantLearning=learningStyles[0].name.replace(" Learning","");

  const CWEIGHTS:Record<string,{i:string[];p:string[];m:string[]}>={
    "Education and Training":{i:["Social","Conventional"],p:["F","J"],m:["Social Service","Continuous Learning"]},
    "Human Service":{i:["Social","Investigative"],p:["F","E"],m:["Social Service","Adventure"]},
    "Media and Communication":{i:["Artistic","Enterprising"],p:["E","N"],m:["Creativity","High Paced Environment"]},
    "Accounts and Finance":{i:["Conventional","Investigative"],p:["T","J"],m:["Structured Work Environment"]},
    "Logistics and Transportation":{i:["Realistic","Conventional"],p:["S","J"],m:["Structured Work Environment"]},
    "Legal Services":{i:["Investigative","Social"],p:["T","J"],m:["Continuous Learning"]},
    "Government Services":{i:["Social","Conventional"],p:["S","J"],m:["Social Service"]},
    "Hospitality and Tourism":{i:["Social","Enterprising"],p:["E","F"],m:["Adventure","High Paced Environment"]},
    "Public Safety and Security":{i:["Realistic","Social"],p:["S","J"],m:["Adventure"]},
    "Business Management":{i:["Enterprising","Conventional"],p:["E","J"],m:["High Paced Environment"]},
    "Arts and Language Arts":{i:["Artistic"],p:["N","P"],m:["Creativity"]},
    "Marketing and Advertising":{i:["Enterprising","Artistic"],p:["E","N"],m:["Creativity","High Paced Environment"]},
    "Sports and Physical Activities":{i:["Realistic"],p:["E","P"],m:["Adventure"]},
  };
  const pLetters=[EI_dir,SN_dir,TF_dir,JP_dir];
  const topMot4=motivators.slice(0,4).map(m=>m.name);
  const clusters=Object.entries(CWEIGHTS).map(([n,w])=>{
    let s=0,mx=0;
    w.i.forEach(x=>{s+=interests.find(i=>i.name===x)?.pct??0;mx+=100;});
    w.p.forEach(x=>{if(pLetters.includes(x))s+=20;mx+=20;});
    w.m.forEach(x=>{if(topMot4.includes(x))s+=15;mx+=15;});
    return{name:n,pct:Math.min(95,Math.round(s/mx*100))};
  }).sort((a,b)=>b.pct-a.pct);

  const CDESCs:Record<string,string[]>={
    "Human Service":["Human services professionals help individuals and families meet their personal needs.","You might work in a government office, hospital, nonprofit agency or as an independent counsellor.","You will be involved in social support and social activities."],
    "Accounts and Finance":["Finance and Accounts professionals keep track of money.","You might work in financial planning, banking, or insurance.","You could maintain financial records or give advice to business executives on how to operate their business."],
    "Business Management":["Business administrative professionals give the support needed to make a business run.","You will provide the overall direction for a company or department.","It includes planning, organizing, directing and evaluating business functions.","Career opportunities are available in every sector of the economy."],
    "Marketing and Advertising":["Marketing professionals are involved in planning, managing, and performing marketing activities to reach organizational objectives.","Marketing professionals help businesses promote products.","You might advertise and promote products so customers want to buy them."],
    "Education and Training":["Education professionals design, develop and deliver training and learning experiences.","You might work as a teacher, trainer, curriculum developer or academic researcher.","You help individuals acquire knowledge, skills and competencies."],
    "Media and Communication":["Media professionals create and distribute content across various platforms.","You might work in journalism, broadcasting, public relations or digital media.","Strong communication and storytelling skills are essential."],
    "Legal Services":["Legal professionals provide advice, representation and administrative support in legal matters.","You might work as a lawyer, paralegal, legal analyst or compliance officer."],
    "Government Services":["Government service professionals serve the public through administration, policy and public programs.","Roles in government offer stability and the opportunity to make a public impact."],
    "Hospitality and Tourism":["Hospitality professionals create exceptional experiences for guests.","You might work in hotels, restaurants, travel agencies or event management.","The field combines service excellence with business management skills."],
    "Arts and Language Arts":["Creative professionals work in art, design, writing and cultural sectors.","You might work as a designer, writer, artist or cultural administrator.","Creativity, originality and communication are key skills."],
  };

  function mkPaths(cluster:string):CareerPath[]{
    const avgInt=interests.slice(0,2).reduce((s,i)=>s+i.pct,0)/2;const sk=overallSkillPct;
    const PT:Record<string,CareerPath[]>={
      "Human Service":[
        {name:"Clinical Psychology",roles:"Depression Counselling, Anxiety Specialist",psyScore:cap(avgInt*1.1),skillScore:cap(sk*0.95),comment:"Top Choice"},
        {name:"Counselling Psychology",roles:"Career Counsellor, Behavioural Counsellor, Relationship Counsellor",psyScore:cap(avgInt*1.05),skillScore:cap(sk),comment:"Top Choice"},
        {name:"Sociology",roles:"Social Worker, Human Rights Worker, NGO Volunteer",psyScore:cap(avgInt),skillScore:cap(sk),comment:"Top Choice"},
        {name:"Mentor and Coach",roles:"Mentor, Guide, Life Coach",psyScore:cap(avgInt*0.9),skillScore:cap(sk),comment:"Good Choice"},
        {name:"Political Science",roles:"Politician, Political Analyst, Civil Servant, Teacher",psyScore:cap(avgInt*0.75),skillScore:cap(sk),comment:"Optional"},
        {name:"Anthropology and Archaeology",roles:"Applied Anthropologist, Applied Archaeologist",psyScore:cap(avgInt*0.65),skillScore:cap(sk*0.9),comment:"Optional"},
      ],
      "Accounts and Finance":[
        {name:"Financial Risk Management",roles:"Financial Risk Analyst, Credit Risk Analysis",psyScore:cap(ii*0.85),skillScore:cap(sk*0.9),comment:"Optional"},
        {name:"Chartered Accountant",roles:"Accountant, Auditor",psyScore:cap(ci*0.8),skillScore:cap(sk*0.9),comment:"Optional"},
        {name:"Financial Analyst",roles:"Equity Research Analyst, Investment Analyst",psyScore:cap(ii*0.78),skillScore:cap(sk*0.9),comment:"Optional"},
        {name:"Financial & Investment Planning",roles:"Investment Banker, Financial Planner, Advisor",psyScore:cap(ii*0.7),skillScore:cap(sk*0.95),comment:"Optional"},
        {name:"Banking & Related Services",roles:"Banking Manager, Financial Manager, Teller",psyScore:cap(ci*0.72),skillScore:cap(sk*0.95),comment:"Optional"},
        {name:"Economics",roles:"Economist, Foreign Trade Analyst",psyScore:cap(ii*0.75),skillScore:cap(sk*0.95),comment:"Optional"},
      ],
      "Business Management":[
        {name:"Human Resources",roles:"HR Manager, Recruiter, Trainer",psyScore:cap(ei*0.9),skillScore:cap(sk),comment:"Good Choice"},
        {name:"Retail Management",roles:"Retail Manager, Brand Manager, Warehouse Manager",psyScore:cap(ei*0.85),skillScore:cap(sk*1.05),comment:"Good Choice"},
        {name:"Business Analytics",roles:"Business Data Analyst, Marketing Research",psyScore:cap(ii*0.8),skillScore:cap(sk*0.95),comment:"Optional"},
        {name:"Project Management",roles:"Project Manager, Project Lead",psyScore:cap(ei*0.7),skillScore:cap(sk*0.98),comment:"Optional"},
        {name:"International Business",roles:"Foreign Trade Manager, Import/Export Manager",psyScore:cap(ei*0.65),skillScore:cap(sk*0.98),comment:"Optional"},
        {name:"BPO",roles:"Call Center, Technical Support, Customer Service",psyScore:cap(ei*0.6),skillScore:cap(sk*0.98),comment:"Optional"},
      ],
      "Marketing and Advertising":[
        {name:"Content Creation",roles:"Content Writer, Creative Writer, Storyteller",psyScore:cap(ai*0.8),skillScore:cap(sk*0.9),comment:"Good Choice"},
        {name:"Digital Marketing",roles:"Digital Marketing Specialist, SEO Specialist",psyScore:cap(ai*0.7),skillScore:cap(sk*0.95),comment:"Optional"},
        {name:"Brand Management",roles:"Brand Manager, Marketing Manager",psyScore:cap(ei*0.65),skillScore:cap(sk*0.95),comment:"Optional"},
        {name:"Advertising & Communication",roles:"Advertising Manager, PR Specialist",psyScore:cap(ai*0.6),skillScore:cap(sk*0.98),comment:"Avoid"},
        {name:"Professional Sales",roles:"Sales Executive, Business Development Manager",psyScore:cap(ei*0.55),skillScore:cap(sk),comment:"Avoid"},
      ],
      "Education and Training":[
        {name:"School Teaching",roles:"School Teacher, Primary Teacher",psyScore:cap(si*0.9),skillScore:cap(sk),comment:"Top Choice"},
        {name:"Technical Training",roles:"Technical Trainer, Corporate Trainer",psyScore:cap(si*0.85),skillScore:cap(sk*0.95),comment:"Good Choice"},
        {name:"Academic Research",roles:"Research Associate, Lecturer",psyScore:cap(ii*0.8),skillScore:cap(sk*0.9),comment:"Good Choice"},
        {name:"Curriculum Design",roles:"Curriculum Developer, Instructional Designer",psyScore:cap(si*0.75),skillScore:cap(sk*0.85),comment:"Optional"},
      ],
    };
    const paths=PT[cluster]??[{name:"General Professional",roles:"Various roles in the field",psyScore:60,skillScore:sk,comment:"Optional"}];
    return paths.map(p=>{
      const ps=Math.max(20,Math.min(99,p.psyScore));const ss=Math.max(50,Math.min(99,p.skillScore));
      let c:CareerPath["comment"]="Optional";
      if(ps>=75&&ss>=72)c="Top Choice";else if(ps>=62&&ss>=68)c="Good Choice";else if(ps<40)c="Avoid";
      return{...p,psyScore:ps,skillScore:ss,comment:c};
    });
  }

  const topClusters:CareerClusterData[]=clusters.slice(0,4).map(c=>({name:c.name,description:CDESCs[c.name]??[`${c.name} professionals work in a dynamic field with diverse opportunities.`],paths:mkPaths(c.name)}));
  const allPaths=topClusters.flatMap(c=>c.paths);
  const favPath=allPaths.find(p=>p.comment==="Top Choice")??allPaths.find(p=>p.comment==="Good Choice")??allPaths[0];
  const favouritePath=favPath?.name??"Career Counselling";

  const sb:string[]=[];const gb:string[]=[];
  if(EI>=50){sb.push("You are quite talkative, energized and like to spend lots of time with others.");sb.push("Your primary mode of living is focused externally.");sb.push("You quickly adapt to a given situation.");}
  else{sb.push("You prefer deep focus and work well independently.");sb.push("You are thoughtful, reflective and a good listener.");}
  if(JP>=50){sb.push("You prefer a planned or orderly way of life.");sb.push("You are self-disciplined and decisive.");}
  else{sb.push("You are flexible and open to new possibilities.");}
  if(ii>=55){sb.push("Your interest in analytical, intellectual and logical related activities is high.");sb.push("You enjoy using logic and solving complex problems.");}
  if(si>=55){sb.push("You enjoy helping, training and supporting others.");sb.push("You communicate in a warm, cheerful and tactful manner.");}
  sb.push(`Your Career motivators are ${topMotivators.join(", ")}.`);

  if(TF>=50&&TF_d<70)gb.push("You tend to make decisions based on your values and feelings. The career path you choose may require more analytical decision-making.");
  if(ii<55)gb.push("Your interest in intellectual, logical and investigative activities may need strengthening for your chosen career path.");
  if(ei<50)gb.push("Your interest in leadership roles and persuading others is lower than required. Developing people management skills will be beneficial.");
  if(ci<50)gb.push("Your interest in planning, scheduling and organizing activities is below what is needed. You need to work on this.");
  if(!gb.length){gb.push("Continue developing your skills to match the demands of your chosen career path.");gb.push("Seek mentorship and networking opportunities in your chosen field.");}

  function getEdu(p:string){
    const M:Record<string,ReportData["eduRoadmap"]>={
      "Financial & Investment Planning":{stages:[{stage:"Higher Education / Career Courses",subject:"Graduation",courses:["BBA – Finance","Bachelor of Finance","BCom (Accounting & Finance)","B.Sc Finance","Bachelor of Finance & Investment Analysis (BFIA)","BA in Accounting and Finance"],occupations:["Personal Financial Advisor","Financial Manager","Financial Planner","Investment Banker","Market Research Analyst","Mutual Fund Manager","Equity Trader","Risk Manager","Wealth Manager","Fund Manager"]},{stage:"Higher Education / Career Courses",subject:"Post Graduation",courses:["MSc in Finance and Investment","Masters in Financial Planning and Wealth Management","MBA – Investment Analysis","PGDBM in Wealth Management & Financial Planning","MSc Strategic Planning and Investment"]},{stage:"Career Development / Career Change",subject:"Career Advancement",courses:["Certified Financial Planner Course (FPSB)","NSE Certification in Financial Market","BSE Certification in Financial Market","Diploma in Wealth Management","Capital Market Certification Course"]}]},
      "School Teaching":{stages:[{stage:"Higher Education / Career Courses",subject:"Graduation",courses:["B.Ed (Bachelor of Education)","BA/BSc with Education","Integrated B.Ed Programme"],occupations:["Primary Teacher","Secondary Teacher","Special Educator","School Counsellor","Academic Coordinator"]},{stage:"Higher Education / Career Courses",subject:"Post Graduation",courses:["M.Ed (Master of Education)","MA in Education","Diploma in Educational Technology"]},{stage:"Career Development / Career Change",subject:"Career Advancement",courses:["CTET (Central Teacher Eligibility Test)","TET Certification","School Leadership Programme","Curriculum Design Certification"]}]},
      "Clinical Psychology":{stages:[{stage:"Higher Education / Career Courses",subject:"Graduation",courses:["B.Sc Psychology","BA Psychology","B.Sc Counselling Psychology"],occupations:["Clinical Psychologist","Counsellor","Therapist","Mental Health Professional","Social Worker","Rehabilitation Specialist"]},{stage:"Higher Education / Career Courses",subject:"Post Graduation",courses:["M.Sc Clinical Psychology","M.A Psychology","M.Phil Clinical Psychology","PGDDP (Post Graduate Diploma in Developmental Psychology)"]},{stage:"Career Development / Career Change",subject:"Career Advancement",courses:["Diploma in Counselling","Certificate in CBT","Mental Health First Aid Certification","Rehabilitation Psychology Certification"]}]},
    };
    return M[p]??{stages:[{stage:"Higher Education / Career Courses",subject:"Graduation",courses:["Bachelor's degree in your chosen field","Specialized undergraduate programmes"],occupations:["Entry-level professional","Analyst","Coordinator"]},{stage:"Higher Education / Career Courses",subject:"Post Graduation",courses:["Master's degree (specialization)","MBA or professional master's","PG Diploma"]},{stage:"Career Development / Career Change",subject:"Career Advancement",courses:["Professional certification (field-specific)","Skill development workshops","Leadership & management programmes"]}]};
  }

  function getSal(p:string){
    const M:Record<string,{level:string;amount:string}[]>={
      "Financial & Investment Planning":[{level:"Freshers (0 yrs)",amount:"₹ 2,67,800"},{level:"Early Career (1–3 yrs)",amount:"₹ 4,00,000"},{level:"Mid Career (4–7 yrs)",amount:"₹ 8,00,000"},{level:"Late Career (9–12 yrs)",amount:"₹ 14,00,000"},{level:"Experienced (13+ yrs)",amount:"₹ 20,00,000"}],
      "Clinical Psychology":[{level:"Freshers (0 yrs)",amount:"₹ 2,00,000"},{level:"Early Career (1–3 yrs)",amount:"₹ 3,20,000"},{level:"Mid Career (4–7 yrs)",amount:"₹ 6,00,000"},{level:"Late Career (9–12 yrs)",amount:"₹ 10,00,000"},{level:"Experienced (13+ yrs)",amount:"₹ 15,00,000"}],
      "School Teaching":[{level:"Freshers (0 yrs)",amount:"₹ 2,20,000"},{level:"Early Career (1–3 yrs)",amount:"₹ 3,50,000"},{level:"Mid Career (4–7 yrs)",amount:"₹ 6,50,000"},{level:"Late Career (9–12 yrs)",amount:"₹ 10,00,000"},{level:"Experienced (13+ yrs)",amount:"₹ 14,00,000"}],
      "Human Resources":[{level:"Freshers (0 yrs)",amount:"₹ 2,40,000"},{level:"Early Career (1–3 yrs)",amount:"₹ 3,60,000"},{level:"Mid Career (4–7 yrs)",amount:"₹ 7,00,000"},{level:"Late Career (9–12 yrs)",amount:"₹ 12,00,000"},{level:"Experienced (13+ yrs)",amount:"₹ 18,00,000"}],
    };
    return M[p]??[{level:"Freshers (0 yrs)",amount:"₹ 2,50,000"},{level:"Early Career (1–3 yrs)",amount:"₹ 4,00,000"},{level:"Mid Career (4–7 yrs)",amount:"₹ 8,00,000"},{level:"Late Career (9–12 yrs)",amount:"₹ 13,00,000"},{level:"Experienced (13+ yrs)",amount:"₹ 20,00,000"}];
  }

  function getPSk(p:string){
    const M:Record<string,{name:string;pct:number;sub:string}[]>={
      "Financial & Investment Planning":[{name:"Investment Analysis",pct:85,sub:"Equity analysis, Fixed income analysis, Portfolio theory"},{name:"Financial Modeling",pct:82,sub:"Discounted cash flow, Scenario analysis, Excel modeling"},{name:"Risk Management",pct:80,sub:"Risk assessment, Hedging strategies, Derivatives risk modeling"},{name:"Wealth Management",pct:78,sub:"Asset allocation, High net worth strategies, Wealth preservation"},{name:"Client Relationship Management",pct:75,sub:"CRM software, Client portfolio reviews, Trust building"},{name:"Tax Planning",pct:70,sub:"Tax efficient investing, Tax-loss harvesting, IRS/IT regulations"},{name:"Regulatory Compliance",pct:68,sub:"SEBI regulations, AMFI rules, Anti-money laundering"},{name:"Behavioral Finance",pct:60,sub:"Client psychology, Decision-making biases, Communication"},{name:"Financial Technology",pct:65,sub:"Robo-advisors, Fintech apps, Digital platforms"},{name:"Estate Planning",pct:62,sub:"Wills and trusts, Probate process, Estate tax strategies"}],
      "Clinical Psychology":[{name:"Psychotherapy",pct:88,sub:"CBT, DBT, Humanistic therapy, Psychoanalysis"},{name:"Clinical Assessment",pct:84,sub:"Psychological testing, Diagnosis, Case formulation"},{name:"Crisis Intervention",pct:80,sub:"Suicide assessment, Mental health crisis management"},{name:"Counselling Skills",pct:78,sub:"Active listening, Empathy, Rapport building"},{name:"Research Methods",pct:72,sub:"Quantitative and qualitative research, Evidence-based practice"},{name:"Neuropsychology",pct:68,sub:"Brain-behaviour relationships, Cognitive assessment"},{name:"Psychopharmacology",pct:65,sub:"Medication basics, Drug-therapy interaction"},{name:"Ethics & Professional Practice",pct:80,sub:"APA ethics code, Confidentiality, Informed consent"}],
    };
    return M[p]??[{name:"Core Technical Skills",pct:80,sub:"Domain-specific technical knowledge"},{name:"Communication Skills",pct:75,sub:"Written, verbal and presentation skills"},{name:"Analytical Thinking",pct:72,sub:"Problem solving, data analysis, critical thinking"},{name:"Leadership & Management",pct:68,sub:"Team management, decision making, strategic planning"},{name:"Digital Literacy",pct:65,sub:"Technology tools, software and digital platforms"},{name:"Project Management",pct:62,sub:"Planning, execution, monitoring and closing projects"},{name:"Research Skills",pct:60,sub:"Information gathering, synthesis and application"},{name:"Interpersonal Skills",pct:58,sub:"Networking, collaboration, conflict resolution"}];
  }

  return{
    mbti:{EI:EI_d,SN:SN_d,TF:TF_d,JP:JP_d,type,typeLabel,EI_dir,SN_dir,TF_dir,JP_dir},
    interests,topInterests,eq,motivators,topMotivators,
    planningStage,planningStageDesc,planningRisk,planningAction,
    skills,overallSkillPct,learningStyles,dominantLearning,
    clusters,topClusters,favouritePath,careerFocus:favouritePath,
    strengthsBullets:sb,gapBullets:gb,
    eduRoadmap:getEdu(favouritePath),salary:getSal(favouritePath),pathSkills:getPSk(favouritePath),
    personalityType:type,
  };
}
