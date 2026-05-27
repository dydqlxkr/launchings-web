/**
 * 미니앱 데모 srcdoc HTML — 프로토타입(런칭스_프로토타입.html)의
 * <template id="demo-*"> 내용을 그대로 이식.
 *
 * 보안: 이 코드는 우리가 직접 작성한 정적 HTML이므로
 * ADR-0004 상 "srcdoc = 우리 통제 코드"로 분류.
 * iframe sandbox 속성은 AppRunner에서 부여 (allow-scripts allow-same-origin allow-modals).
 * 외부 URL 앱에는 별도 경로(allow-same-origin 미부여)를 사용한다.
 *
 * Phase 2 교체 포인트: 실제 live_url이 생기면 AppRunner가 srcdoc 대신
 * src를 사용하는 외부 URL 경로로 자동 전환된다.
 */

export const APP_DEMOS: Record<string, string> = {
  memoflow: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,sans-serif;margin:0;background:#f6f7fb;color:#1a2030}
.top{background:#fff;padding:16px 20px;border-bottom:1px solid #e6e9f0}.top b{font-size:16px}
.wrap{padding:20px;max-width:620px;margin:0 auto}textarea{width:100%;height:120px;border:1px solid #d6dbe6;border-radius:10px;padding:12px;font-size:14px;font-family:inherit;resize:vertical}
button{background:#3b5bff;color:#fff;border:0;padding:11px 18px;border-radius:9px;font-weight:700;cursor:pointer;margin-top:10px;font-size:14px}
.todo{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #e6e9f0;border-radius:10px;padding:12px 14px;margin-top:10px}
.todo input{width:18px;height:18px}.todo.done span{text-decoration:line-through;color:#9aa3b5}
h3{margin:22px 0 4px;font-size:14px;color:#6b7488}
</style></head><body>
<div class="top"><b>🗒️ MemoFlow</b> &nbsp;<span style="color:#9aa3b5;font-size:13px">회의 메모 → 할 일 자동 추출</span></div>
<div class="wrap">
<textarea id="src">오늘 회의 정리:
다음주까지 랜딩페이지 시안 만들기
김대리가 결제 모듈 검토해야 함
그냥 잡담했던 내용
디자인 피드백 정리하기
일정은 금요일 확정</textarea>
<button onclick="extract()">✨ 할 일 추출하기</button>
<div id="out"></div>
<script>
function extract(){
 var lines=document.getElementById('src').value.split('\\n');
 var kws=['하기','해야','확정','검토','정리','만들','준비','확인'];
 var todos=lines.filter(function(l){return kws.some(function(k){return l.indexOf(k)>-1})});
 var out=document.getElementById('out');
 out.innerHTML='<h3>추출된 할 일 '+todos.length+'개</h3>';
 if(!todos.length){out.innerHTML+='<p style=color:#9aa3b5>추출할 항목이 없어요.</p>';return}
 todos.forEach(function(t){
  var d=document.createElement('div');d.className='todo';
  d.innerHTML='<input type=checkbox onchange="this.parentNode.classList.toggle(\\'done\\')"><span>'+t.trim()+'</span>';
  out.appendChild(d);
 });
}
extract();
<\/script>
</div></body></html>`,

  promptpilot: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,sans-serif;margin:0;background:#0f1320;color:#e8ecf5}
.top{background:#161b2c;padding:16px 20px;border-bottom:1px solid #232a40}
.wrap{padding:20px;max-width:620px;margin:0 auto}
label{display:block;font-size:13px;color:#9aa6c0;margin:14px 0 5px}
input,select{width:100%;background:#161b2c;border:1px solid #2a3450;border-radius:9px;padding:10px 12px;color:#e8ecf5;font-size:14px;font-family:inherit}
.out{background:#10243a;border:1px solid #1f4060;border-radius:12px;padding:16px;margin-top:18px;font-size:14px;line-height:1.7;white-space:pre-wrap}
button{background:#2ee6a6;color:#06281d;border:0;padding:10px 16px;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;margin-top:12px}
</style></head><body>
<div class="top"><b>🤖 PromptPilot</b> &nbsp;<span style="color:#9aa6c0;font-size:13px">좋은 프롬프트를 대신 써드려요</span></div>
<div class="wrap">
<label>AI에게 시킬 역할</label><input id="role" value="시니어 마케터" oninput="gen()">
<label>하고 싶은 일</label><input id="task" value="신제품 출시 인스타 카피 작성" oninput="gen()">
<label>톤 &amp; 분위기</label>
<select id="tone" onchange="gen()"><option>친근하고 위트있게</option><option>전문적이고 신뢰감있게</option><option>간결하고 직설적으로</option></select>
<label>분량/형식</label><input id="fmt" value="3가지 버전, 각 2문장" oninput="gen()">
<div class="out" id="out"></div>
<button onclick="copy()">📋 프롬프트 복사</button>
<script>
function gen(){
 var p='당신은 '+v('role')+'입니다.\\n\\n[목표] '+v('task')+'\\n[톤] '+v('tone')+'\\n[형식] '+v('fmt')+'\\n\\n위 조건에 맞춰 결과물을 작성하세요. 단계별로 생각하되, 최종 출력만 보여주세요.';
 document.getElementById('out').textContent=p;
}
function v(id){return document.getElementById(id).value}
function copy(){navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('out').textContent);var b=event.target;var o=b.textContent;b.textContent='✓ 복사됨!';setTimeout(function(){b.textContent=o},1200)}
gen();
<\/script>
</div></body></html>`,

  paletteai: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,sans-serif;margin:0;background:#faf9fc;color:#241a30}
.top{background:#fff;padding:16px 20px;border-bottom:1px solid #ece6f2}
.wrap{padding:20px;max-width:620px;margin:0 auto}
input{width:100%;border:1px solid #ddd3ea;border-radius:10px;padding:12px;font-size:15px;font-family:inherit}
.row{display:flex;gap:0;margin-top:18px;border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(80,40,120,.12)}
.sw{flex:1;height:150px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px;cursor:pointer;font-size:12px;font-weight:700;font-family:monospace}
.hint{color:#9a8caf;font-size:13px;margin-top:14px;text-align:center}
</style></head><body>
<div class="top"><b>🎨 PaletteAI</b> &nbsp;<span style="color:#9a8caf;font-size:13px">단어로 브랜드 팔레트 생성</span></div>
<div class="wrap">
<input id="kw" value="차분한 가을 카페" oninput="gen()" placeholder="분위기를 한 줄로 (예: 미래적인 핀테크)">
<div class="row" id="row"></div>
<div class="hint">색을 클릭하면 HEX가 복사돼요</div>
<script>
function hash(s){var h=0;for(var i=0;i<s.length;i++){h=s.charCodeAt(i)+((h<<5)-h)}return h}
function gen(){
 var s=document.getElementById('kw').value||'a';var base=Math.abs(hash(s))%360;
 var row=document.getElementById('row');row.innerHTML='';
 for(var i=0;i<5;i++){
  var hue=(base+i*32)%360;var sat=42+i*8;var lit=80-i*13;
  var hex=hslHex(hue,sat,lit);
  var d=document.createElement('div');d.className='sw';d.style.background='hsl('+hue+','+sat+'%,'+lit+'%)';
  d.style.color=lit>55?'#3a2a4a':'#fff';d.textContent=hex;
  d.onclick=(function(h){return function(){navigator.clipboard&&navigator.clipboard.writeText(h);this.textContent='✓ '+h}})(hex);
  row.appendChild(d);
 }
}
function hslHex(h,s,l){s/=100;l/=100;var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,r=0,g=0,b=0;
 if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
 function t(n){return('0'+Math.round((n+m)*255).toString(16)).slice(-2)}return('#'+t(r)+t(g)+t(b)).toUpperCase()}
gen();
<\/script>
</div></body></html>`,

  standupbot: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,sans-serif;margin:0;background:#f4f6f9;color:#1d2530}
.top{background:#4a154b;color:#fff;padding:14px 20px;font-weight:700}
.wrap{padding:20px;max-width:600px;margin:0 auto}
.q{background:#fff;border:1px solid #e4e8ee;border-radius:12px;padding:14px;margin-bottom:12px}
.q label{display:block;font-size:13px;color:#616a78;margin-bottom:7px;font-weight:600}
.q input{width:100%;border:1px solid #dde2ea;border-radius:8px;padding:9px 11px;font-size:14px;font-family:inherit}
button{background:#007a5a;color:#fff;border:0;padding:11px 18px;border-radius:9px;font-weight:700;cursor:pointer;font-size:14px}
.card{background:#fff;border-left:4px solid #007a5a;border-radius:10px;padding:14px 16px;margin-top:16px;font-size:14px;line-height:1.7;display:none}
</style></head><body>
<div class="top">⚡ StandupBot · #daily-standup</div>
<div class="wrap">
<div class="q"><label>✅ 어제 한 일</label><input id="y" value="결제 API 연동 완료"></div>
<div class="q"><label>🎯 오늘 할 일</label><input id="t" value="테스트 코드 작성 + 코드리뷰"></div>
<div class="q"><label>🚧 막히는 점</label><input id="b" value="스테이징 서버 배포 권한 필요"></div>
<button onclick="post()">스탠드업 게시</button>
<div class="card" id="card"></div>
<script>
function post(){
 var c=document.getElementById('card');c.style.display='block';
 c.innerHTML='<b>🙋 나의 오늘 스탠드업</b><br><br>✅ <b>어제:</b> '+val('y')+'<br>🎯 <b>오늘:</b> '+val('t')+'<br>🚧 <b>블로커:</b> '+val('b')+'<br><br><span style=color:#007a5a;font-weight:700>팀에 게시되었습니다 ✓</span>';
}
function val(id){return document.getElementById(id).value||'(없음)'}
<\/script>
</div></body></html>`,

  pixelquest: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,sans-serif;margin:0;background:#16121f;color:#eee;text-align:center}
.top{background:#221830;padding:14px;font-weight:700}
.wrap{padding:18px}
.hud{display:flex;justify-content:center;gap:24px;margin-bottom:14px;font-size:14px;color:#b8a8d8}
.hud b{color:#2ee6a6;font-size:18px}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:300px;margin:0 auto}
.cell{aspect-ratio:1;background:linear-gradient(135deg,#3a2a5a,#2a2042);border:0;border-radius:14px;font-size:26px;font-weight:800;color:#fff;cursor:pointer;transition:.1s}
.cell:hover{transform:scale(1.05)}.cell.hit{background:linear-gradient(135deg,#2ee6a6,#3b9b6c);transform:scale(.92)}
.msg{margin-top:16px;font-size:16px;font-weight:700;min-height:24px}
button.again{margin-top:14px;background:#6c8cff;color:#fff;border:0;padding:10px 18px;border-radius:9px;font-weight:700;cursor:pointer}
</style></head><body>
<div class="top">🎮 PixelQuest · 순서대로 누르기</div>
<div class="wrap">
<div class="hud"><div>다음 숫자<br><b id="next">1</b></div><div>시간<br><b id="time">0.0</b></div><div>최고<br><b id="best">-</b></div></div>
<div class="board" id="board"></div>
<div class="msg" id="msg">1부터 9까지 순서대로 최대한 빠르게!</div>
<button class="again" onclick="start()">다시 시작 🔄</button>
<script>
var next=1,t0=0,timer=null,best=null;
function start(){
 next=1;document.getElementById('next').textContent=1;document.getElementById('msg').textContent='시작!';
 var nums=[1,2,3,4,5,6,7,8,9];for(var i=nums.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var x=nums[i];nums[i]=nums[j];nums[j]=x}
 var b=document.getElementById('board');b.innerHTML='';
 nums.forEach(function(n){var c=document.createElement('button');c.className='cell';c.textContent=n;c.onclick=function(){hit(n,c)};b.appendChild(c)});
 clearInterval(timer);t0=Date.now();timer=setInterval(function(){document.getElementById('time').textContent=((Date.now()-t0)/1000).toFixed(1)},100);
}
function hit(n,c){
 if(n!==next){document.getElementById('msg').textContent='❌ 순서가 틀렸어요! 다음은 '+next;return}
 c.classList.add('hit');next++;document.getElementById('next').textContent=next<=9?next:'✓';
 if(next>9){clearInterval(timer);var sec=((Date.now()-t0)/1000).toFixed(1);
  document.getElementById('msg').textContent='🎉 클리어! '+sec+'초';
  if(best===null||sec*1<best){best=sec*1;document.getElementById('best').textContent=sec}}
}
start();
<\/script>
</div></body></html>`,
};

/**
 * 앱 slug로 demo srcdoc HTML을 반환.
 * 없으면 null (외부 URL 또는 네이티브 경로로 폴백).
 */
export function getDemoSrcdoc(slug: string): string | null {
  return APP_DEMOS[slug] ?? null;
}
