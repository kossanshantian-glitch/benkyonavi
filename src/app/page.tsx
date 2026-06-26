'use client';
import { useEffect, useState, useCallback } from 'react';

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
const PROPOSALS: Record<string,Record<string,string>> = {
  knowledge:{C:'「{p}」の基礎から学び直してください。まず用語カードで定義を確認し、教科書の該当箇所を精読しましょう。',B:'「{p}」の知識に抜けがあります。類似問題を3問解いて定着を確認してください。',A:'知識の細部に不安があります。用語の定義を声に出して説明できるか確認してみてください。'},
  understanding:{C:'「{p}」の概念の理解が不十分です。具体例を3つ自分で考え説明してみましょう。',B:'概念は知っているが深さが足りません。「なぜそうなるか」を自分の言葉で説明する練習をしてください。',A:'理解の応用力を高める必要があります。実際のUIを見て原則を当てはめる練習が効果的です。'},
  skip:{C:'問題文のキーワードに下線を引き、選択肢を読む前に自分の答えを先に考える習慣をつけてください。',B:'問題文の重要語句を意識して読む練習が必要です。',A:'急がず問題文を2回読む習慣をつけましょう。'},
  calc:{C:'計算や論理展開の過程を書き出す習慣をつけてください。',B:'計算ステップを丁寧に確認しましょう。解答後に検算する習慣をつけてください。',A:'引き続き計算過程を書き出す習慣を続けてください。'},
  careless:{C:'選択肢を全部読んでから選ぶ。「本当にそうか？」と自問する習慣をつけてください。',B:'直感で答えを決めていませんか？根拠を確認してから解答する癖をつけましょう。',A:'答えの根拠を1文で説明できるか確認してみてください。'},
  time:{C:'問題を解くときは一問一問に集中し、焦らず確認する習慣をつけてください。',B:'解答前に一度立ち止まる「確認の間」を意識してください。',A:'最後の見直しを欠かさない習慣を続けましょう。'},
};
const SUCCESS_PROPOSALS: Record<string,Record<string,string>> = {
  solid_knowledge:{C:'知識の定着が偶然でないか確認しましょう。同系統の問題を解いて再現性を確かめてください。',B:'「{p}」の知識はしっかり定着しています。この調子で他の原則も固めましょう。',A:'完全に定着しています。人に説明できるレベルを目指しましょう。'},
  deep_understanding:{C:'理解はできていますが、まだ不安定かもしれません。別の角度の問題でも通用するか確認しましょう。',B:'「{p}」の理解が深まっています。応用問題にも挑戦してみましょう。',A:'理解が定着しています。他の原則との関連性も考えてみましょう。'},
  careful_read:{C:'丁寧に読めたのは良い兆候です。この読み方を他の問題にも適用しましょう。',B:'問題文を正確に読む習慣がついてきています。継続しましょう。',A:'読解の精度が高いです。スピードも意識してみましょう。'},
  good_elimination:{C:'消去法が機能しました。次は根拠を持って一発で選べるようにしましょう。',B:'選択肢の比較が上手くなっています。判断基準を明確にしましょう。',A:'消去法と直接判断の両方が使えています。'},
  past_review:{C:'復習の効果が出ています。このサイクルを継続しましょう。',B:'過去の振り返りが定着に繋がっています。',A:'復習習慣が完全に身についています。'},
  intuition:{C:'直感が当たりましたが、根拠を言語化できるか確認しておきましょう。',B:'直感は当たっていますが、理由づけも意識すると安定します。',A:'直感と理論が一致しています。素晴らしい状態です。'},
};
const ACTIONS: Record<string,{txt:string,when:string}[]> = {
  knowledge:[{txt:'用語カードで定義を確認する',when:'今日'},{txt:'教科書の該当箇所を精読する',when:'明日'},{txt:'類似問題を3問解いて定着確認',when:'次回から'}],
  understanding:[{txt:'具体例を3つ自分で考えてみる',when:'今日'},{txt:'「なぜそうなるか」を声に出して説明する',when:'明日'},{txt:'実際のUIで原則を当てはめる練習',when:'今週中'}],
  skip:[{txt:'問題文のキーワードに下線を引く',when:'次回から'},{txt:'選択肢を読む前に答えを先に考える',when:'今回から'},{txt:'問題文を2回読んでから解答する',when:'今回から'}],
  calc:[{txt:'計算過程をすべて書き出す',when:'今回から'},{txt:'解答後に検算する',when:'今回から'},{txt:'間違えたステップを特定してメモ',when:'次回から'}],
  careless:[{txt:'選択肢を全部読んでから選ぶ',when:'今回から'},{txt:'「本当にそうか？」と自問する',when:'今回から'},{txt:'答えの根拠を1文で言えるか確認',when:'次回から'}],
  time:[{txt:'解答前に「確認の間」を意識する',when:'今回から'},{txt:'最後に見直しの時間を必ず取る',when:'今回から'},{txt:'焦らず一問一問に集中する',when:'今回から'}],
};
const REINFORCE_ACTIONS: Record<string,{txt:string,when:string}[]> = {
  solid_knowledge:[{txt:'同系統の問題を解いて再現性を確認',when:'今日'},{txt:'用語の定義を人に説明してみる',when:'今週中'}],
  deep_understanding:[{txt:'別の角度からの応用問題に挑戦する',when:'今日'},{txt:'他の原則との関連性を考える',when:'今週中'}],
  careful_read:[{txt:'この読み方を他の問題にも適用する',when:'次回から'},{txt:'読解スピードも意識してみる',when:'次回から'}],
  good_elimination:[{txt:'判断基準を1文でメモしておく',when:'今日'},{txt:'消去法なしで一発で選べるか試す',when:'次回から'}],
  past_review:[{txt:'このサイクルを継続する',when:'次回から'},{txt:'復習ノートに今回の気づきを追加',when:'今日'}],
  intuition:[{txt:'直感の根拠を言語化してメモする',when:'今日'},{txt:'次回も同じ直感が働くか試す',when:'次回から'}],
};

interface QSummary{rank:'A'|'B'|'C';attemptCount:number;correctCount:number;lastAttempt:string|null;}
interface HistRecord{id:string;qid:number;timestamp:string;isCorrect:boolean;causes:string[];memo:string;actions:string[];rank:'A'|'B'|'C';}
interface LatestCause{isCorrect:boolean;causes:string[];}
function trunc(s:string,n:number){return s.length>n?s.slice(0,n)+'…':s;}
function fmtDate(iso:string|null){if(!iso)return '-';const d=new Date(iso);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function fmtDateFull(iso:string){const d=new Date(iso);return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes,qRes,lcRes] = await Promise.all([fetch('/api/history'),fetch('/api/questions'),fetch('/api/latest-causes')]);
      const hData=await hRes.json(); const qData=await qRes.json(); const lcData=await lcRes.json();
      const qMap:Record<number,QSummary>={};
      for(const r of qData.questions??[]){qMap[r.qid]={rank:r.rank,attemptCount:r.attempt_count,correctCount:r.correct_count,lastAttempt:r.last_attempt};}
      setQuestions(qMap);
      setHistory((hData.history??[]).map((r:Record<string,unknown>)=>({id:r.id,qid:r.qid,timestamp:r.timestamp,isCorrect:r.is_correct,causes:r.causes,memo:r.memo,actions:r.actions,rank:r.rank})));
      const lcMap:Record<number,LatestCause>={};
      for(const r of lcData.latestCauses??[]){lcMap[r.qid]={isCorrect:r.is_correct,causes:r.causes};}
      setLatestCauses(lcMap);
    } catch(e){console.error(e);}
    setLoading(false);
  },[]);

  useEffect(()=>{fetchAll();},[fetchAll]);

  const sortedQ=()=>{const O={C:0,B:1,A:2};return [...QS].sort((a,b)=>(O[questions[a.id]?.rank??'C']??3)-(O[questions[b.id]?.rank??'C']??3));};

  const handleSave=async()=>{
    if(cur===null||answered===null)return;
    setSaving(true);
    const selCauseIds=Object.keys(causes).filter(k=>causes[k]);
    const rank=questions[cur]?.rank??'C';
    const id=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const timestamp=new Date().toISOString();
    try {
      await Promise.all([
        fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,qid:cur,timestamp,isCorrect:answered,causes:selCauseIds,memo,actions:[],rank})}),
        fetch('/api/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qid:cur,rank,attemptCount:(questions[cur]?.attemptCount??0)+1,correctCount:(questions[cur]?.correctCount??0)+(answered?1:0),lastAttempt:timestamp})}),
        fetch('/api/latest-causes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qid:cur,isCorrect:answered,causes:selCauseIds})}),
      ]);
      await fetchAll();
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

  const setRank=async(r:'A'|'B'|'C')=>{
    if(cur===null)return;
    const q=questions[cur]??{rank:'C',attemptCount:0,correctCount:0,lastAttempt:null};
    await fetch('/api/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qid:cur,rank:r,attemptCount:q.attemptCount,correctCount:q.correctCount,lastAttempt:q.lastAttempt})});
    setQuestions(prev=>({...prev,[cur]:{...q,rank:r}}));
  };

  const handleSel=(qid:number)=>{setCur(qid);setSelAns(null);setAnswered(null);setCauses({});setMemo('');setSelectedActions({});};
  const handleSubmit=()=>{if(cur===null||selAns===null)return;setAnswered(selAns===QS[cur].answer);};

  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:14,color:'#6b7280'}}>読み込み中…</div>;

  const doneCount=Object.keys(questions).length;
  const q=cur!==null?QS[cur]:null;
  const qd=cur!==null?(questions[cur]??{rank:'C',attemptCount:0,correctCount:0,lastAttempt:null}):null;
  const rank=(qd?.rank??'C') as 'A'|'B'|'C';
  const hasCause=Object.values(causes).some(Boolean);
  const causeList=answered?SUCCESS_FACTORS:CAUSES;
  const proposalMap=answered?SUCCESS_PROPOSALS:PROPOSALS;
  const actionMap=answered?REINFORCE_ACTIONS:ACTIONS;
  const selItems=causeList.filter(c=>causes[c.id]);
  const primary=selItems[0];
  const proposal=primary?(proposalMap[primary.id]?.[rank]??'').replace('{p}',q?.principle??''):'';
  const allActions=selItems.flatMap(c=>actionMap[c.id]??[]).filter((a,i,arr)=>arr.findIndex(x=>x.txt===a.txt)===i).slice(0,4);
  const bdgStyle=(r:'A'|'B'|'C'|undefined)=>r?{background:r==='A'?'#d1fae5':r==='B'?'#fef3c7':'#fee2e2',color:r==='A'?'#059669':r==='B'?'#d97706':'#dc2626',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4}:{background:'#f3f4f6',color:'#6b7280',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4};

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

      {tab==='learn'&&(
        <div style={{display:'grid',gridTemplateColumns:'22% 24% 24% 30%',height:'calc(100vh - 102px)'}}>
          <div style={{borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 12px',borderBottom:'1px solid #e5e7eb',background:'#f8f9fc',flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'#2563eb',letterSpacing:'.08em'}}>PANE 1</div>
              <div style={{fontSize:11,fontWeight:700}}>問題一覧（復習優先）</div>
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
                  {(qd2?.lastAttempt||cs)&&<div style={{fontSize:10,color:'#6b7280',marginTop:3,paddingLeft:28}}>{[qd2?.lastAttempt?`前回 ${fmtDate(qd2.lastAttempt)}`:'',cs].filter(Boolean).join('　')}</div>}
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
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>{answered?'正解できた要因（複数可）':'間違えた原因（複数可）'}</div>
                  {causeList.map(c=>(
                    <div key={c.id} onClick={()=>setCauses(prev=>({...prev,[c.id]:!prev[c.id]}))} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',border:`1.5px solid ${causes[c.id]?(answered?'#059669':'#dc2626'):'#e5e7eb'}`,borderRadius:8,marginBottom:5,cursor:'pointer',background:causes[c.id]?(answered?'#d1fae5':'#fee2e2'):'#fff'}}>
                      <span style={{fontSize:14,width:22,textAlign:'center',flexShrink:0}}>{c.ico}</span>
                      <div><div style={{fontSize:11,fontWeight:500,color:causes[c.id]?(answered?'#059669':'#dc2626'):'#0f1117'}}>{c.label}</div><div style={{fontSize:9,color:'#6b7280'}}>{c.sub}</div></div>
                    </div>
                  ))}
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>メモ（任意）</div>
                  <textarea value={memo} onChange={e=>setMemo(e.target.value)} rows={2} placeholder="気づきをメモ…" style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:8,padding:7,fontSize:11,fontFamily:'inherit',color:'#0f1117',background:'#fff',resize:'none'}}/>
                  {history.filter(h=>h.qid===cur).slice(-3).reverse().map(h=>{
                    const rl=h.isCorrect?SUCCESS_FACTORS:CAUSES;
                    const cl=h.causes.map(c=>rl.find(x=>x.id===c)?.label).join('・')||'-';
                    return <div key={h.id} style={{background:'#f8f9fc',borderRadius:7,padding:'7px 9px',marginBottom:4,fontSize:10}}>
                      <div style={{color:'#6b7280',marginBottom:2}}>{fmtDateFull(h.timestamp)} <span style={bdgStyle(h.rank)}>{h.rank}</span> {h.isCorrect?'✓ 正解':'✗ 不正解'}</div>
                      {cl}{h.memo&&<div style={{color:'#6b7280',marginTop:2,fontStyle:'italic'}}>{h.memo}</div>}
                    </div>;
                  })}
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
                      <div style={{width:22,height:22,background:answered?'#059669':'#2563eb',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700}}>AI</div>
                      <span style={{fontSize:11,fontWeight:700,color:answered?'#059669':'#2563eb'}}>{answered?'次回への再現プラン':'改善提案'}</span>
                    </div>
                    <div style={{fontSize:11,lineHeight:1.6}}>{proposal}</div>
                  </div>
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>{answered?'継続するアクション':'実行するアクション'}</div>
                  {allActions.map((a,i)=>(
                    <div key={i} onClick={()=>setSelectedActions(prev=>({...prev,[i]:!prev[i]}))} style={{display:'flex',alignItems:'flex-start',gap:7,padding:'7px 9px',border:`1.5px solid ${selectedActions[i]?'#2563eb':'#e5e7eb'}`,borderRadius:8,marginBottom:5,cursor:'pointer',background:selectedActions[i]?'#eff6ff':'#fff'}}>
                      <div style={{width:14,height:14,border:`1.5px solid ${selectedActions[i]?'#2563eb':'#e5e7eb'}`,borderRadius:3,flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,background:selectedActions[i]?'#2563eb':'#fff',color:'#fff'}}>{selectedActions[i]?'✓':''}</div>
                      <div style={{fontSize:11}}>{a.txt}<div style={{fontSize:9,color:'#6b7280',marginTop:2}}>いつ：{a.when}</div></div>
                    </div>
                  ))}
                  <div style={{fontSize:9,color:'#6b7280',fontWeight:700,letterSpacing:'.08em',margin:'8px 0 4px'}}>この問題の理解度</div>
                  <div style={{display:'flex',gap:6,marginBottom:6}}>
                    {(['C','B','A'] as const).map(r=>(
                      <button key={r} onClick={()=>setRank(r)} style={{flex:1,padding:6,borderRadius:7,border:`1.5px solid ${rank===r?'#2563eb':'#e5e7eb'}`,background:rank===r?'#eff6ff':'#fff',color:rank===r?'#2563eb':'#0f1117',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                        {r==='C'?'C 要復習':r==='B'?'B 復習推奨':'A 理解済'}
                      </button>
                    ))}
                  </div>
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
            {[{num:history.length,label:'総解答数',color:'#0f1117'},{num:`${history.length?Math.round(history.filter(h=>h.isCorrect).length/history.length*100):0}%`,label:'正答率',color:'#2563eb'},{num:Object.values(questions).filter(q=>q.rank==='A').length,label:'A理解済',color:'#059669'},{num:doneCount,label:'挑戦済み問題数',color:'#d97706'}].map(({num,label,color})=>(
              <div key={label} style={{border:'1.5px solid #e5e7eb',borderRadius:12,padding:16}}>
                <div style={{fontSize:28,fontWeight:900,marginBottom:2,color}}>{num}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>{label}</div>
              </div>
            ))}
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