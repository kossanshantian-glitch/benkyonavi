'use client';
import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { generateSuggestion } from '@/lib/suggestion-engine';
import { estimateRank } from '@/lib/rank-estimator';
import HomeScreen from '@/components/HomeScreen';

const QS = [
  {id:0,text:'「システム状態の視認性」とは、ユーザーに現在の状態を常に知らせることを意味する。',type:'ox',answer:true,explain:'適切なフィードバックを適切なタイミングで提供し、ユーザーが現在何が起きているか常に把握できるようにすることです。',point:'進行状況バー、ローディングスピナーなどが代表例。',principle:'第1原則：システム状態の視認性'},
  {id:1,text:'「エラー防止」の原則は「エラーメッセージ」の原則よりも優先度が低い。',type:'ox',answer:false,explain:'エラーを防ぐことはエラー後に対処することよりも重要です。エラー防止の方が優先度が高い。',point:'確認ダイアログ、制約付き入力などが代表例。',principle:'第5原則：エラー防止'},
  {id:2,text:'ユーザーの記憶負荷を最小化するために行うべきことはどれか？',type:'sel',choices:['すべての情報を一画面に表示する','オブジェクト・行動・選択肢を可視化する','テキストのみのインターフェースを使用する','ショートカットキーを廃止する'],answer:1,explain:'「認識対想起」の原則では、ユーザーが記憶するのではなく見て認識できるようにすることが重要です。',point:'ドロップダウン、アイコン、ツールチップが記憶負荷を下げる。',principle:'第6原則：認識対想起'},
  {id:3,text:'「柔軟性と効率性」において、初心者には見えない機能を上級者向けに提供することは適切である。',type:'ox',answer:true,explain:'アクセラレーターは上級者向けに提供し、両方のニーズに応えられます。',point:'キーボードショートカット、カスタマイズ機能などが代表例。',principle:'第7原則：柔軟性と効率性'},
  {id:4,text:'「一貫性と標準」においてメタファーが重要な理由はどれか？',type:'sel',choices:['デザインを美しく見せるため','現実世界の概念をUI操作に活用するため','システムの処理速度を上げるため','ユーザーのログインを簡単にするため'],answer:1,explain:'ユーザーが慣れ親しんだ概念を使うことで直感的な理解を促します。',point:'ゴミ箱、ショッピングカートなどが代表例。',principle:'第2原則：現実世界との一致'},
  {id:5,text:'「ユーザーの制御と自由」は、誤操作の際に簡単に元に戻せることを保証する。',type:'ox',answer:true,explain:'「緊急脱出口」を提供することでユーザーは安心して操作できます。',point:'Ctrl+Z、キャンセルボタンなどが重要な実装例。',principle:'第3原則：ユーザーの制御と自由'},
  {id:6,text:'「審美的で最小限のデザイン」において適切でない行為はどれか？',type:'sel',choices:['不要な情報を削除する','重要な情報を強調する','すべての機能を一画面に詰め込む','白いスペースを活用する'],answer:2,explain:'不要な情報はすべての関連情報を薄めます。優先順位を明確にすることが重要です。',point:'情報の優先順位付け、余白、視覚的階層が核心。',principle:'第8原則：審美的で最小限のデザイン'},
];
const CAUSES = [
  {id:'knowledge',label:'知識不足',sub:'必要な知識を知らなかった',ico:'📚'},
  {id:'understanding',label:'理解不足',sub:'知識はあるが理解が不十分',ico:'💡'},
  {id:'skip',label:'読み飛ばし',sub:'問題文を正確に読んでいない',ico:'👁'},
  {id:'calc',label:'計算ミス',sub:'計算過程でミスした',ico:'🔢'},
  {id:'careless',label:'勘違い・思い込み',sub:'思い込みや勘違いをしていた',ico:'🤔'},
  {id:'time',label:'ケアレスミス',sub:'注意不足によるミス',ico:'⚡'},
];
const SUCCESS_FACTORS = [
  {id:'solid_knowledge',label:'知識が定着していた',sub:'用語・定義を正確に覚えていた',ico:'📚'},
  {id:'deep_understanding',label:'概念を理解していた',sub:'なぜそうなるか説明できる',ico:'💡'},
  {id:'careful_read',label:'問題文を丁寧に読めた',sub:'キーワードを正確に拾えた',ico:'👁'},
  {id:'good_elimination',label:'消去法がうまくいった',sub:'選択肢を比較して絞れた',ico:'🔢'},
  {id:'past_review',label:'前回の復習が効いた',sub:'過去の間違いを覚えていた',ico:'🔁'},
  {id:'intuition',label:'直感が当たった',sub:'根拠は薄いが正解できた',ico:'⚡'},
];
interface QSummary{rank:'A'|'B'|'C';attemptCount:number;correctCount:number;lastAttempt:string|null;easinessFactor:number;intervalDays:number;repetitions:number;nextReviewDate:string|null;consecutiveCorrect:number;consecutiveWrong:number;}
interface HistRecord{id:string;qid:number;timestamp:string;isCorrect:boolean;causes:string[];memo:string;actions:string[];rank:'A'|'B'|'C';suggestedRank?:'A'|'B'|'C'|null;}
interface QuestionHistory{timestamp:string;isCorrect:boolean;causes:string[];memo:string;rank:'A'|'B'|'C';actions:string[];}
interface LatestCause{isCorrect:boolean;causes:string[];}
function trunc(s:string,n:number){return s.length>n?s.slice(0,n)+'…':s;}
function fmtDate(iso:string|null){if(!iso)return '-';const d=new Date(iso);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function fmtDateFull(iso:string){const d=new Date(iso);return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function fmtRelativeDays(iso:string){const then=new Date(iso);const now=new Date();const days=Math.floor((now.getTime()-then.getTime())/(1000*60*60*24));if(days<=0)return '今日';if(days===1)return '昨日';return `${days}日前`;}
function causeLabelsFromIds(causeIds:string[],isCorrect:boolean){const rl=isCorrect?SUCCESS_FACTORS:CAUSES;return causeIds.map(c=>rl.find(x=>x.id===c)?.label??c);}
function getChangeIndicator(older:QuestionHistory,newer:QuestionHistory):{icon:string;text:string;color:string}|null{if(older.isCorrect&&!newer.isCorrect)return{icon:'🔴',text:'前回正解でしたが今回は間違えました。気を引き締めましょう',color:'#dc2626'};const o=older.rank,n=newer.rank;if(o==='C'&&n==='C')return{icon:'🔴',text:'同じ課題が続いています。アプローチを変えてみましょう',color:'#dc2626'};if(o==='C'&&n==='B')return{icon:'🟡',text:'少し改善しています。この調子で続けましょう',color:'#d97706'};if(o==='B'&&n==='A')return{icon:'🟢',text:'大きく成長しています！',color:'#059669'};if(o==='A'&&n==='A')return{icon:'✅',text:'安定して定着しています',color:'#059669'};return null;}
function HistorySkeleton(){return(<div style={{background:'#f8f9fc',borderRadius:8,padding:10,marginBottom:10,border:'1px solid #e5e7eb'}}>{[1,2,3].map(i=><div key={i} style={{height:10,background:'#e5e7eb',borderRadius:4,marginBottom:6,width:`${100-i*15}%`}}/>)}</div>);}
function PrevRecordCard({record,bdgStyle,title}:{record:QuestionHistory;bdgStyle:(r:'A'|'B'|'C'|undefined)=>CSSProperties;title:string}){const labels=causeLabelsFromIds(record.causes,record.isCorrect);return(<div style={{background:'#fff',borderRadius:8,padding:9,marginBottom:6,border:'1px solid #e5e7eb',fontSize:10}}><div style={{fontWeight:700,marginBottom:4,color:'#374151'}}>{title}</div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}><span>結果: {record.isCorrect?'✅ 正解':'❌ 不正解'}</span><span style={bdgStyle(record.rank)}>ランク: {record.rank}</span></div>{labels.length>0&&<div style={{marginBottom:3}}>原因: {labels.join('、')}</div>}{record.memo&&<div style={{color:'#6b7280',fontStyle:'italic'}}>メモ: 「{record.memo}」</div>}{record.actions?.length>0&&<div style={{color:'#6b7280',marginTop:3}}>アクション: {record.actions.join(' / ')}</div>}</div>);}
function todayStr(){return new Date().toISOString().slice(0,10);}
function fmtReviewDate(dateStr:string|null){if(!dateStr)return '';if(dateStr<=todayStr())return '今日復習';const d=new Date(`${dateStr}T00:00:00`);return `復習 ${d.getMonth()+1}/${d.getDate()}`;}
function reviewSortKey(qid:number,questions:Record<number,QSummary>):[number,string]{const qd=questions[qid];if(!qd)return [0,''];const due=qd.nextReviewDate??todayStr();if(due<=todayStr())return [1,due];return [2,due];}
function getConsecutiveWrong(history:HistRecord[],qid:number):number{const records=[...history].filter(h=>h.qid===qid).sort((a,b)=>b.timestamp.localeCompare(a.timestamp));let count=1;for(const h of records){if(!h.isCorrect)count++;else break;}return count;}
const EMPTY_Q:QSummary={rank:'C',attemptCount:0,correctCount:0,lastAttempt:null,easinessFactor:2.5,intervalDays:1,repetitions:0,nextReviewDate:null,consecutiveCorrect:0,consecutiveWrong:0};
export default function Home() {
  const [tab, setTab] = useState<'learn'|'history'|'stats'>('learn');
  const [questions, setQuestions] = useState<Record<number,QSummary>>({});
  const [history, setHistory] = useState<HistRecord[]>([]);
  const [latestCauses, setLatestCauses] = useState<Record<number,LatestCause>>({});
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState<number|null>(null);
  const [selAns, setSelAns] = useState<number|boolean|null>(null);
  const [answered, setAnswered] = useState<boolean|null>(null);
  const [causes, setCauses] = useState<Record<string,boolean>>({});
  const [memo, setMemo] = useState('');
  const [selectedActions, setSelectedActions] = useState<Record<number,boolean>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [sessionRank, setSessionRank] = useState<'A'|'B'|'C'|null>(null);
  const [rankUserModified, setRankUserModified] = useState(false);
  const [showHomeScreen, setShowHomeScreen] = useState(true);
  const [planSortOrder, setPlanSortOrder] = useState<number[]|null>(null);
  const [accuracyTrend, setAccuracyTrend] = useState<{date:string;correct:number;total:number;rate:number}[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d'|'30d'|'all'>('7d');
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchQuestionHistory = useCallback(async (qid:number)=>{
    setHistoryLoading(true);
    try{
      const res=await fetch(`/api/history/${qid}`);
      const data=await res.json();
      setQuestionHistory(data.history??[]);
    }catch(e){console.error(e);setQuestionHistory([]);}
    setHistoryLoading(false);
  },[]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes,qRes,lcRes] = await Promise.all([fetch('/api/history'),fetch('/api/questions'),fetch('/api/latest-causes')]);
      const hData=await hRes.json(); const qData=await qRes.json(); const lcData=await lcRes.json();
      const qMap:Record<number,QSummary>={};
      for(const r of qData.questions??[]){qMap[r.qid]={rank:r.rank,attemptCount:r.attempt_count,correctCount:r.correct_count,lastAttempt:r.last_attempt,easinessFactor:r.easiness_factor??2.5,intervalDays:r.interval_days??1,repetitions:r.repetitions??0,nextReviewDate:r.next_review_date?String(r.next_review_date).slice(0,10):null,consecutiveCorrect:r.consecutive_correct??0,consecutiveWrong:r.consecutive_wrong??0};}
      setQuestions(qMap);
      setHistory((hData.history??[]).map((r:Record<string,unknown>)=>({id:r.id,qid:r.qid,timestamp:r.timestamp,isCorrect:r.is_correct,causes:r.causes,memo:r.memo,actions:r.actions,rank:r.rank,suggestedRank:r.suggested_rank??null})));
      const lcMap:Record<number,LatestCause>={};
      for(const r of lcData.latestCauses??[]){lcMap[r.qid]={isCorrect:r.is_correct,causes:r.causes};}
      setLatestCauses(lcMap);
    } catch(e){console.error(e);}
    setLoading(false);
  },[]);

  useEffect(()=>{fetchAll();},[fetchAll]);
  useEffect(()=>{
    if(cur===null){setQuestionHistory([]);return;}
    setHistoryExpanded(false);
    fetchQuestionHistory(cur);
  },[cur,fetchQuestionHistory]);
  useEffect(()=>{setSelectedActions({});},[cur,answered,causes,sessionRank]);
  useEffect(()=>{setRankUserModified(false);setSessionRank(null);},[cur,answered,causes]);

  const sortedQ=()=>{
    if(planSortOrder&&planSortOrder.length>0){
      const orderMap=new Map(planSortOrder.map((id,i)=>[id,i]));
      return [...QS].sort((a,b)=>{
        const ia=orderMap.get(a.id);const ib=orderMap.get(b.id);
        if(ia!==undefined&&ib!==undefined)return ia-ib;
        if(ia!==undefined)return -1;
        if(ib!==undefined)return 1;
        return a.id-b.id;
      });
    }
    const O={C:0,B:1,A:2};
    return [...QS].sort((a,b)=>{const [pa,da]=reviewSortKey(a.id,questions);const [pb,db]=reviewSortKey(b.id,questions);if(pa!==pb)return pa-pb;if(da!==db)return da<db?-1:1;return (O[questions[a.id]?.rank??'C']??3)-(O[questions[b.id]?.rank??'C']??3);});
  };

  const handleStartLearning=(sortOrder:number[])=>{setPlanSortOrder(sortOrder);setShowHomeScreen(false);};

  const handleSave=async()=>{
    if(cur===null||answered===null)return;
    setSaving(true);
    const selCauseIds=Object.keys(causes).filter(k=>causes[k]);
    const qd=questions[cur]??EMPTY_Q;
    const causeList=answered?SUCCESS_FACTORS:CAUSES;
    const causeLabels=selCauseIds.map(id=>causeList.find(c=>c.id===id)?.label??id);
    const prevRank=questionHistory[0]?.rank??null;
    const rankEst=estimateRank({isCorrect:answered,causes:causeLabels,consecutiveCorrect:answered?(qd.consecutiveCorrect+1):qd.consecutiveCorrect,consecutiveWrong:answered?qd.consecutiveWrong:(qd.consecutiveWrong+1),previousRank:prevRank,totalAttempts:qd.attemptCount+1});
    const rank=(sessionRank??rankEst.suggestedRank) as 'A'|'B'|'C';
    const suggestion=generateSuggestion({isCorrect:answered,causes:causeLabels,rank,consecutiveWrong:answered?0:getConsecutiveWrong(history,cur),intervalDays:qd.intervalDays});
    const savedActions=suggestion.actions.filter((_,i)=>selectedActions[i]);
    const id=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const timestamp=new Date().toISOString();
    try {
      await Promise.all([
        fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,qid:cur,timestamp,isCorrect:answered,causes:selCauseIds,memo,actions:savedActions,rank,suggestedRank:rankEst.suggestedRank})}),
        fetch('/api/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qid:cur,rank,attemptCount:(questions[cur]?.attemptCount??0)+1,correctCount:(questions[cur]?.correctCount??0)+(answered?1:0),lastAttempt:timestamp,isCorrect:answered})}),
        fetch('/api/latest-causes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qid:cur,isCorrect:answered,causes:selCauseIds})}),
      ]);
      await fetchAll();
      if(cur!==null)await fetchQuestionHistory(cur);
      setSavedMsg(true);
      setTimeout(()=>setSavedMsg(false),1500);
    } catch(e){console.error(e);alert('保存に失敗しました');}
    setSaving(false);
  };

  const handleDelete=async(ids:string[])=>{
    if(!confirm(`${ids.length}件を削除しますか？`))return;
    await fetch('/api/history',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});
    await fetchAll();
  };

  const setRank=(r:'A'|'B'|'C')=>{setSessionRank(r);setRankUserModified(true);};

  const handleSel=(qid:number)=>{setCur(qid);setSelAns(null);setAnswered(null);setCauses({});setMemo('');setSelectedActions({});setSessionRank(null);setRankUserModified(false);};
  const handleSubmit=()=>{if(cur===null||selAns===null)return;setAnswered(selAns===QS[cur].answer);};

  const qdForEst=cur!==null?(questions[cur]??EMPTY_Q):null;
  const hasCauseForEst=Object.values(causes).some(Boolean);
  const causeListForEst=answered?SUCCESS_FACTORS:CAUSES;
  const causeLabelsForEst=Object.keys(causes).filter(k=>causes[k]).map(id=>causeListForEst.find(c=>c.id===id)?.label??id);
  const prevRankForEst=questionHistory[0]?.rank??null;
  const rankEstimate=answered!==null&&hasCauseForEst&&qdForEst?estimateRank({isCorrect:answered,causes:causeLabelsForEst,consecutiveCorrect:answered?(qdForEst.consecutiveCorrect+1):qdForEst.consecutiveCorrect,consecutiveWrong:answered?qdForEst.consecutiveWrong:(qdForEst.consecutiveWrong+1),previousRank:prevRankForEst,totalAttempts:qdForEst.attemptCount+1}):null;
  useEffect(()=>{if(rankEstimate&&!rankUserModified)setSessionRank(rankEstimate.suggestedRank);},[rankEstimate?.suggestedRank,rankEstimate?.reason,rankUserModified]);

  const fetchAccuracyTrend = useCallback(async (period:'7d'|'30d'|'all')=>{
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (period !== 'all') params.set('period', period);
      const res = await fetch(`/api/stats/accuracy-trend?${params.toString()}`);
      const data = await res.json();
      setAccuracyTrend(data ?? []);
    } catch (error) {
      console.error(error);
      setAccuracyTrend([]);
    }
    setStatsLoading(false);
  }, []);

  useEffect(()=>{
    if (tab === 'stats') {
      fetchAccuracyTrend(selectedPeriod);
    }
  }, [tab, selectedPeriod, fetchAccuracyTrend]);

  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:14,color:'#6b7280'}}>読み込み中…</div>;

  const doneCount=Object.keys(questions).length;
  const q=cur!==null?QS[cur]:null;
  const qd=cur!==null?(questions[cur]??EMPTY_Q):null;
  const hasCause=hasCauseForEst;
  const causeList=causeListForEst;
  const causeLabels=causeLabelsForEst;
  const rank=(sessionRank??rankEstimate?.suggestedRank??'C') as 'A'|'B'|'C';
  const suggestion=answered!==null&&hasCause?generateSuggestion({isCorrect:answered,causes:causeLabels,rank,consecutiveWrong:answered?0:(cur!==null?getConsecutiveWrong(history,cur):0),intervalDays:qd?.intervalDays??1}):null;
  const bdgStyle=(r:'A'|'B'|'C'|undefined):CSSProperties=>r?{background:r==='A'?'#d1fae5':r==='B'?'#fef3c7':'#fee2e2',color:r==='A'?'#059669':r==='B'?'#d97706':'#dc2626',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4}:{background:'#f3f4f6',color:'#6b7280',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4};
  const prevRecord=questionHistory[0]??null;
  const changeIndicator=questionHistory.length>=2?getChangeIndicator(questionHistory[1],questionHistory[0]):null;
  const prevCauseLabels=prevRecord?causeLabelsFromIds(prevRecord.causes,prevRecord.isCorrect):(cur!==null&&latestCauses[cur]?.causes?.length?causeLabelsFromIds(latestCauses[cur].causes,latestCauses[cur].isCorrect):[]);

  return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",color:'#0f1117',background:'#fff',fontSize:14,lineHeight:1.6,minHeight:'100vh'}}>
      <div style={{borderBottom:'2px solid #0f1117',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:50,position:'sticky',top:0,background:'#fff',zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16,fontWeight:900,letterSpacing:'-0.03em'}}>勉強<span style={{color:'#2563eb'}}>ナビ</span></span>
          <span style={{fontSize:11,color:'#6b7280',border:'1px solid #e5e7eb',padding:'2px 10px',borderRadius:20}}>学習改善システム</span>
        </div>
        <span style={{fontSize:11,color:'#6b7280'}}>{doneCount}/{QS.length}問完了</span>
      </div>
      <div style={{display:'flex',borderBottom:'1.5px solid #e5e7eb',padding:'0 20px',background:'#fff'}}>
        {(['learn','history','stats'] as const).map(t=>(
          <div key={t} onClick={()=>setTab(t)} style={{padding:'10px 18px',fontSize:13,fontWeight:700,cursor:'pointer',borderBottom:`2.5px solid ${tab===t?'#2563eb':'transparent'}`,marginBottom:-1.5,color:tab===t?'#2563eb':'#6b7280'}}>
            {t==='learn'?'📝 学習':t==='history'?'📋 履歴':'📊 統計'}
          </div>
        ))}
      </div>

      {tab==='learn'&&showHomeScreen&&(
        <HomeScreen onStartLearning={handleStartLearning}/>
      )}

      {tab==='learn'&&!showHomeScreen&&(
        <div style={{display:'grid',gridTemplateColumns:'22% 24% 24% 30%',height:'calc(100vh - 102px)'}}>
          <div style={{borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 12px',borderBottom:'1px solid #e5e7eb',background:'#f8f9fc',flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'#2563eb',letterSpacing:'.08em'}}>PANE 1</div>
              <div style={{fontSize:11,fontWeight:700}}>問題一覧（復習優先・SM-2）</div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <div style={{height:4,background:'#e5e7eb',borderRadius:2,flex:1,maxWidth:160}}><div style={{height:'100%',background:'#2563eb',borderRadius:2,width:`${Math.round(doneCount/QS.length*100)}%`,transition:'width .4s'}}/></div>
                <span style={{fontSize:11,color:'#6b7280'}}>{doneCount}/{QS.length}問</span>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:8}}>
              {sortedQ().map(q2=>{
                const qd2=questions[q2.id];const lc=latestCauses[q2.id];
                const rl=lc?.isCorrect?SUCCESS_FACTORS:CAUSES;
                const cs=lc?.causes?.length?lc.causes.map(c=>rl.find(x=>x.id===c)?.label).join('・'):'';
                return(<div key={q2.id} onClick={()=>handleSel(q2.id)} style={{padding:'8px 10px',borderRadius:8,border:`1.5px solid ${cur===q2.id?'#bfdbfe':'transparent'}`,marginBottom:4,cursor:'pointer',background:cur===q2.id?'#eff6ff':'transparent'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:10,color:'#6b7280',minWidth:22,fontFamily:'monospace'}}>Q{q2.id+1}</span>
                    <span style={{fontSize:11,flex:1,lineHeight:1.4}}>{trunc(q2.text,28)}</span>
                    <span style={bdgStyle(qd2?.rank)}>{qd2?.rank??'未'}</span>
                  </div>
                  {(qd2?.lastAttempt||cs||qd2?.nextReviewDate)&&<div style={{fontSize:10,color:'#6b7280',marginTop:3,paddingLeft:28}}>{[qd2?.nextReviewDate?fmtReviewDate(qd2.nextReviewDate):'',qd2?.lastAttempt?`前回 ${fmtDate(qd2.lastAttempt)}`:'',cs].filter(Boolean).join('　')}</div>}
                </div>);
              })}
            </div>
          </div>

          <div style={{borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 12px',borderBottom:'1px solid #e5e7eb',background:'#f8f9fc',flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'#2563eb',letterSpacing:'.08em'}}>PANE 2</div>
              <div style={{fontSize:11,fontWeight:700}}>{q?`Q${q.id+1} ${q.principle}`:'問題と解答'}</div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:8}}>
              {!q?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:140,color:'#6b7280',fontSize:11,textAlign:'center'}}>← 問題を選んでください</div>:(
                <>
                  <div style={{fontSize:12,lineHeight:1.7,padding:10,background:'#f8f9fc',borderRadius:8,marginBottom:10}}>{q.text}</div>
                  {historyLoading?<HistorySkeleton/>:questionHistory.length===0?(
                    <div style={{background:'#eff6ff',border:'1.5px solid #bfdbfe',borderRadius:8,padding:10,marginBottom:10,fontSize:11,color:'#2563eb',fontWeight:700}}>🎉 はじめての挑戦です！</div>
                  ):(
                    <div style={{background:'#f8f9fc',border:'1.5px solid #e5e7eb',borderRadius:8,padding:10,marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,marginBottom:6}}>📋 前回の記録（{fmtRelativeDays(prevRecord!.timestamp)}）</div>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap',fontSize:11}}>
                        <span>結果: {prevRecord!.isCorrect?'✅ 正解':'❌ 不正解'}</span>
                        <span style={bdgStyle(prevRecord!.rank)}>ランク: {prevRecord!.rank}</span>
                      </div>
                      {causeLabelsFromIds(prevRecord!.causes,prevRecord!.isCorrect).length>0&&<div style={{fontSize:10,marginBottom:4}}>原因: {causeLabelsFromIds(prevRecord!.causes,prevRecord!.isCorrect).join('、')}</div>}
                      {prevRecord!.memo&&<div style={{fontSize:10,color:'#6b7280',fontStyle:'italic'}}>メモ: 「{prevRecord!.memo}」</div>}
                      {changeIndicator&&<div style={{fontSize:10,fontWeight:700,color:changeIndicator.color,marginTop:8,padding:'6px 8px',background:'#fff',borderRadius:6,border:`1px solid ${changeIndicator.color}33`}}>{changeIndicator.icon} {changeIndicator.text}</div>}
                      {questionHistory.length>1&&(
                        <>
                          <div onClick={()=>setHistoryExpanded(v=>!v)} style={{fontSize:10,color:'#2563eb',cursor:'pointer',marginTop:8,fontWeight:700}}>{historyExpanded?'▲ 折りたたむ':`▼ 2回前・3回前を見る（${questionHistory.length-1}件）`}</div>
                          {historyExpanded&&questionHistory.slice(1).map((h,i)=><PrevRecordCard key={h.timestamp} record={h} bdgStyle={bdgStyle} title={`${i+2}回前（${fmtRelativeDays(h.timestamp)}）`}/>)}
                        </>
                      )}
                    </div>
                  )}
                  {q.type==='ox'?(
                    <div style={{display:'flex',gap:6,marginBottom:8}}>
                      {([true,false] as const).map(v=>{
                        let bg='#fff',border='1.5px solid #e5e7eb';
                        if(answered!==null){if(v===q.answer){bg='#d1fae5';border='1.5px solid #059669';}else if(v===selAns){bg='#fee2e2';border='1.5px solid #dc2626';}}
                        else if(selAns===v){bg=v?'#d1fae5':'#fee2e2';border=`1.5px solid ${v?'#059669':'#dc2626'}`;}
                        return <button key={String(v)} onClick={()=>{if(answered===null)setSelAns(v);}} disabled={answered!==null} style={{flex:1,padding:10,fontSize:20,border,borderRadius:8,cursor:answered!==null?'default':'pointer',background:bg}}>{v?'○':'×'}</button>;
                      })}
                    </div>
                  ):(
                    q.choices?.map((c,i)=>{
                      let bg='#fff',border='1.5px solid #e5e7eb';
                      if(answered!==null){if(i===q.answer){bg='#d1fae5';border='1.5px solid #059669';}else if(i===selAns){bg='#fee2e2';border='1.5px solid #dc2626';}}
                      else if(selAns===i){bg='#eff6ff';border='1.5px solid #2563eb';}
                      return <button key={i} onClick={()=>{if(answered===null)setSelAns(i);}} disabled={answered!==null} style={{width:'100%',textAlign:'left',padding:'7px 10px',border,borderRadius:7,marginBottom:5,cursor:answered!==null?'default':'pointer',fontSize:11,fontFamily:'inherit',color:'#0f1117',background:bg}}>{String.fromCharCode(65+i)}. {c}</button>;
                    })
                  )}
                  {answered===null
                    ?<button onClick={handleSubmit} disabled={selAns===null} style={{width:'100%',padding:8,borderRadius:8,border:'none',background:selAns===null?'#e5e7eb':'#2563eb',color:selAns===null?'#6b7280':'#fff',fontSize:11,fontWeight:700,cursor:selAns===null?'not-allowed':'pointer',marginTop:6}}>解答する</button>
                    :<>
                      <div style={{padding:'8px 12px',borderRadius:8,fontSize:12,fontWeight:700,marginBottom:8,background:answered?'#d1fae5':'#fee2e2',color:answered?'#059669':'#dc2626'}}>{answered?'✓ 正解！':'✗ 不正解'}</div>
                      <div style={{background:'#f8f9fc',borderRadius:8,padding:9,marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:'#6b7280',marginBottom:3}}>解説</div><div style={{fontSize:11,lineHeight:1.6}}>{q.explain}</div></div>
                      <div style={{background:'#f8f9fc',borderRadius:8,padding:9,marginBottom:8,borderLeft:'2px solid #2563eb'}}><div style={{fontSize:9,fontWeight:700,color:'#6b7280',marginBottom:3}}>ポイント</div><div style={{fontSize:11,lineHeight:1.6}}>{q.point}</div></div>
                    </>
                  }
                </>
              )}
            </div>
          </div>

          <div style={{borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 12px',borderBottom:'1px solid #e5e7eb',background:'#f8f9fc',flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'#2563eb',letterSpacing:'.08em'}}>PANE 3</div>
              <div style={{fontSize:11,fontWeight:700}}>原因分析</div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:8}}>
              {answered===null?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:140,color:'#6b7280',fontSize:11,textAlign:'center'}}><span style={{fontSize:22,opacity:.4}}>🔒</span>解答後に入力できます</div>:(
                <>
                  {prevCauseLabels.length>0&&(
                    <div style={{background:'#f8f9fc',borderRadius:8,padding:'7px 9px',marginBottom:8,border:'1px solid #e5e7eb'}}>
                      <div style={{fontSize:10,color:'#374151',fontWeight:600,marginBottom:4}}>
                        前回: {prevCauseLabels.map((label,i)=><span key={label}>{i>0?' / ':''}<span style={{fontWeight:700,color:prevRecord?.isCorrect?'#059669':'#dc2626'}}>{label}</span></span>)}
                      </div>
                    </div>
                  )}
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>{answered?'正解できた要因（複数可）':'間違えた原因（複数可）'}</div>
                  {causeList.map(c=>(
                    <div key={c.id} onClick={()=>setCauses(prev=>({...prev,[c.id]:!prev[c.id]}))} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',border:`1.5px solid ${causes[c.id]?(answered?'#059669':'#dc2626'):'#e5e7eb'}`,borderRadius:8,marginBottom:5,cursor:'pointer',background:causes[c.id]?(answered?'#d1fae5':'#fee2e2'):'#fff'}}>
                      <span style={{fontSize:14,width:22,textAlign:'center',flexShrink:0}}>{c.ico}</span>
                      <div><div style={{fontSize:11,fontWeight:500,color:causes[c.id]?(answered?'#059669':'#dc2626'):'#0f1117'}}>{c.label}</div><div style={{fontSize:9,color:'#6b7280'}}>{c.sub}</div></div>
                    </div>
                  ))}
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>メモ（任意）</div>
                  <textarea value={memo} onChange={e=>setMemo(e.target.value)} rows={2} placeholder="気づきをメモ…" style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:8,padding:7,fontSize:11,fontFamily:'inherit',color:'#0f1117',background:'#fff',resize:'none'}}/>
                </>
              )}
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 12px',borderBottom:'1px solid #e5e7eb',background:'#f8f9fc',flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'#2563eb',letterSpacing:'.08em'}}>PANE 4</div>
              <div style={{fontSize:11,fontWeight:700}}>改善計画</div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:8}}>
              {(answered===null||!hasCause)?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:140,color:'#6b7280',fontSize:11,textAlign:'center'}}><span style={{fontSize:22,opacity:.4}}>🔒</span>{answered===null?'解答後に入力できます':'原因を1つ以上選択してください'}</div>:(
                <>
                  <div style={{background:answered?'#d1fae5':'#eff6ff',border:`1.5px solid ${answered?'#a7f3d0':'#bfdbfe'}`,borderRadius:10,padding:10,marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                      <div style={{width:22,height:22,background:answered?'#059669':'#2563eb',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700}}>提案</div>
                      <span style={{fontSize:11,fontWeight:700,color:answered?'#059669':'#2563eb'}}>{answered?'次回への再現プラン':'改善提案'}</span>
                    </div>
                    <div style={{fontSize:11,lineHeight:1.6}}>{suggestion?.message}</div>
                    {suggestion?.nextFocus&&<div style={{fontSize:10,fontWeight:700,color:answered?'#059669':'#2563eb',marginTop:6}}>→ {suggestion.nextFocus}</div>}
                  </div>
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>{answered?'継続するアクション':'実行するアクション'}</div>
                  {suggestion?.actions.map((action,i)=>(
                    <div key={i} onClick={()=>setSelectedActions(prev=>({...prev,[i]:!prev[i]}))} style={{display:'flex',alignItems:'flex-start',gap:7,padding:'7px 9px',border:`1.5px solid ${selectedActions[i]?'#2563eb':'#e5e7eb'}`,borderRadius:8,marginBottom:5,cursor:'pointer',background:selectedActions[i]?'#eff6ff':'#fff'}}>
                      <div style={{width:14,height:14,border:`1.5px solid ${selectedActions[i]?'#2563eb':'#e5e7eb'}`,borderRadius:3,flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,background:selectedActions[i]?'#2563eb':'#fff',color:'#fff'}}>{selectedActions[i]?'✓':''}</div>
                      <div style={{fontSize:11}}>{action}</div>
                    </div>
                  ))}
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>理解度を設定</div>
                  <div style={{display:'flex',gap:6,marginBottom:6}}>
                    {(['C','B','A'] as const).map(r=>{
                      const isSelected=rank===r;
                      const isSuggested=rankEstimate?.suggestedRank===r;
                      const labels={C:'C 要復習',B:'B 復習推奨',A:'A 理解済'} as const;
                      return(
                        <button key={r} onClick={()=>setRank(r)} style={{flex:1,padding:6,borderRadius:7,border:`1.5px solid ${isSelected?'#2563eb':isSuggested?'#fbbf24':'#e5e7eb'}`,background:isSelected?'#eff6ff':isSuggested?'#fffbeb':'#fff',color:isSelected?'#2563eb':'#0f1117',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',position:'relative'}}>
                          {isSuggested&&'⭐ '}{labels[r]}
                          {isSuggested&&isSelected&&<div style={{fontSize:8,color:'#d97706',fontWeight:700,marginTop:2}}>おすすめ</div>}
                        </button>
                      );
                    })}
                  </div>
                  {rankEstimate&&(
                    <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'8px 10px',marginBottom:6,fontSize:10,lineHeight:1.5}}>
                      <div style={{fontWeight:700,color:'#92400e',marginBottom:2}}>💡 今回は{rankEstimate.suggestedRank}がおすすめです</div>
                      <div style={{color:'#78350f'}}>{rankEstimate.reason}</div>
                    </div>
                  )}
                  <button onClick={handleSave} disabled={saving||savedMsg} style={{width:'100%',padding:9,borderRadius:8,background:savedMsg?'#059669':saving?'#e5e7eb':'#059669',color:saving?'#6b7280':'#fff',border:'none',fontSize:11,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',marginTop:8}}>
                    {savedMsg?'✓ 保存しました':saving?'保存中…':'💾 記録を保存する'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab==='history'&&(
        <div style={{maxWidth:900,margin:'0 auto',padding:'24px 20px'}}>
          <div style={{fontSize:20,fontWeight:900,marginBottom:4}}>学習履歴</div>
          <div style={{fontSize:13,color:'#6b7280',marginBottom:20}}>保存されたすべての解答と改善計画の記録</div>
          {history.length===0?<div style={{textAlign:'center',padding:60,color:'#6b7280'}}>まだ記録がありません。</div>:(
            <>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
                <button onClick={()=>handleDelete(history.map(h=>h.id))} style={{fontSize:12,padding:'6px 14px',borderRadius:7,border:'1.5px solid #dc2626',background:'#fee2e2',color:'#dc2626',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>🗑 全件削除</button>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['日時','問題','正誤','理解度','原因／要因','メモ',''].map(h=><th key={h} style={{fontSize:11,fontWeight:700,color:'#6b7280',textAlign:'left',padding:'8px 12px',borderBottom:'2px solid #e5e7eb'}}>{h}</th>)}</tr></thead>
                <tbody>{[...history].reverse().map(h=>{
                  const q2=QS[h.qid];const rl=h.isCorrect?SUCCESS_FACTORS:CAUSES;
                  const ct=h.causes.map(c=>rl.find(x=>x.id===c)?.label).join('・')||'-';
                  return <tr key={h.id}>
                    <td style={{padding:'9px 12px',borderBottom:'1px solid #e5e7eb',fontSize:11,color:'#6b7280',whiteSpace:'nowrap'}}>{fmtDateFull(h.timestamp)}</td>
                    <td style={{padding:'9px 12px',borderBottom:'1px solid #e5e7eb'}}><div style={{fontSize:11,fontWeight:700}}>Q{h.qid+1}</div><div style={{fontSize:10,color:'#6b7280'}}>{trunc(q2.principle,16)}</div></td>
                    <td style={{padding:'9px 12px',borderBottom:'1px solid #e5e7eb',fontSize:12,fontWeight:700,color:h.isCorrect?'#059669':'#dc2626'}}>{h.isCorrect?'○':'✗'}</td>
                    <td style={{padding:'9px 12px',borderBottom:'1px solid #e5e7eb'}}><span style={bdgStyle(h.rank)}>{h.rank}</span></td>
                    <td style={{padding:'9px 12px',borderBottom:'1px solid #e5e7eb',fontSize:11}}>{ct}</td>
                    <td style={{padding:'9px 12px',borderBottom:'1px solid #e5e7eb',fontSize:11,color:'#6b7280'}}>{h.memo||'-'}</td>
                    <td style={{padding:'9px 12px',borderBottom:'1px solid #e5e7eb'}}><button onClick={()=>handleDelete([h.id])} style={{border:'none',background:'transparent',cursor:'pointer',fontSize:13,padding:4}}>🗑</button></td>
                  </tr>;
                })}</tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab==='stats'&&(
        <div style={{maxWidth:900,margin:'0 auto',padding:'24px 20px'}}>
          <div style={{fontSize:20,fontWeight:900,marginBottom:4}}>統計ダッシュボード</div>
          <div style={{fontSize:13,color:'#6b7280',marginBottom:20}}>蓄積データから見えてきた学習傾向</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
            {[{num:history.length,label:'総解答数',color:'#0f1117'},{num:`${history.length?Math.round(history.filter(h=>h.isCorrect).length/history.length*100):0}%`,label:'正答率',color:'#2563eb'},{num:Object.values(questions).filter(q=>q.nextReviewDate&&q.nextReviewDate<=todayStr()).length,label:'今日の復習',color:'#dc2626'},{num:Object.values(questions).filter(q=>q.rank==='A').length,label:'A理解済',color:'#059669'}].map(({num,label,color})=>(
              <div key={label} style={{border:'1.5px solid #e5e7eb',borderRadius:12,padding:16}}>
                <div style={{fontSize:28,fontWeight:900,marginBottom:2,color}}>{num}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{border:'1.5px solid #e5e7eb',borderRadius:12,padding:20,marginBottom:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700}}>正答率の推移</div>
                <div style={{fontSize:11,color:'#6b7280'}}>期間を切り替えて、日別/週別の傾向を確認できます。</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                {(['7d','30d','all'] as const).map((period)=> (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${selectedPeriod === period ? '#2563eb' : '#e5e7eb'}`,
                      background: selectedPeriod === period ? '#eff6ff' : '#fff',
                      color: selectedPeriod === period ? '#2563eb' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {period === '7d' ? '直近7日' : period === '30d' ? '直近30日' : '全期間'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {statsLoading ? (
                <div style={{color: '#6b7280'}}>読み込み中…</div>
              ) : accuracyTrend.length === 0 ? (
                <div style={{color: '#6b7280'}}>データがありません。</div>
              ) : (
                <div style={{width: '100%', overflowX: 'auto'}}>
                  <div style={{display: 'grid', gridTemplateColumns: `repeat(${accuracyTrend.length}, minmax(48px, 1fr))`, gap: 8, alignItems: 'end', height: 180}}>
                    {accuracyTrend.map((item) => (
                      <div key={item.date} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                        <div style={{width: '100%', background: '#f3f4f6', borderRadius: 8, height: '100%', display: 'flex', alignItems: 'flex-end'}}>
                          <div style={{width: '100%', background: '#2563eb', borderRadius: 8, minHeight: 4, height: `${Math.round(item.rate * 100)}%`}} />
                        </div>
                        <div style={{fontSize: 10, color: '#6b7280', textAlign: 'center', wordBreak: 'break-word'}}>{item.date.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16}}>
              <div style={{padding: 12, border: '1px solid #e5e7eb', borderRadius: 10}}>
                <div style={{fontSize: 11, color: '#6b7280', marginBottom: 6}}>最新正答率</div>
                <div style={{fontSize: 18, fontWeight: 700}}>{accuracyTrend.length ? `${Math.round(accuracyTrend[accuracyTrend.length-1].rate * 100)}%` : '-'}</div>
              </div>
              <div style={{padding: 12, border: '1px solid #e5e7eb', borderRadius: 10}}>
                <div style={{fontSize: 11, color: '#6b7280', marginBottom: 6}}>合計解答数</div>
                <div style={{fontSize: 18, fontWeight: 700}}>{accuracyTrend.reduce((sum, item) => sum + item.total, 0)}</div>
              </div>
              <div style={{padding: 12, border: '1px solid #e5e7eb', borderRadius: 10}}>
                <div style={{fontSize: 11, color: '#6b7280', marginBottom: 6}}>平均正答率</div>
                <div style={{fontSize: 18, fontWeight: 700}}>{accuracyTrend.length ? `${Math.round((accuracyTrend.reduce((sum, item) => sum + item.rate, 0) / accuracyTrend.length) * 100)}%` : '-'}</div>
              </div>
            </div>
          </div>
          <div style={{border:'1.5px solid #e5e7eb',borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>問題別 正答率</div>
            {QS.map(q2=>{
              const qd2=questions[q2.id];
              if(!qd2)return <div key={q2.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{fontSize:10,color:'#6b7280',width:90,textAlign:'right'}}>Q{q2.id+1}</span><div style={{flex:1,height:20,background:'#f8f9fc',borderRadius:4}}/><span style={{fontSize:11,color:'#6b7280',width:30,textAlign:'right'}}>-</span></div>;
              const pct=Math.round(qd2.correctCount/qd2.attemptCount*100);
              const col=pct>=80?'#059669':pct>=50?'#d97706':'#dc2626';
              return <div key={q2.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{fontSize:10,color:'#6b7280',width:90,textAlign:'right',flexShrink:0}}>Q{q2.id+1} <span style={bdgStyle(qd2.rank)}>{qd2.rank}</span></span>
                <div style={{flex:1,height:20,background:'#f8f9fc',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',borderRadius:4,background:col,width:`${pct}%`,transition:'width .5s',minWidth:4}}/></div>
                <span style={{fontSize:11,color:'#6b7280',width:35,textAlign:'right',fontFamily:'monospace'}}>{pct}%</span>
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}