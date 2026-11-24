const $=id=>document.getElementById(id);let contextMode=false,season='summer',flowing=true,walkers=[],flowTime=0,lastFrame=0,contextGroup,seasonGroup;let night=false,selected=-1;
const nodes=[
{name:'木色格栅顶棚',sub:'几何格构 · 光影层次',lead:'以木色几何格构延续庭院上方的空间界面。',text:'三角格栅与透光开口交织出丰富光影，为步行与停留提供舒适的空间。可关闭“顶棚”查看下层布局。',p:[-10,5.8,-5]},
{name:'楼梯与休息平台',sub:'拾级而下 · 连接上下层',lead:'把单纯的通行节点，变成可以短暂停留的层次空间。',text:'两段楼梯与中间休息平台连接上下层，花池沿台阶展开，形成可通行、可停留的庭院空间。',p:[11,3,9]},
{name:'乔木与层叠绿化',sub:'庭院绿荫 · 台地花池',lead:'用中央乔木、花池与层叠种植，形成庭院的视觉中心。',text:'乔木与层叠花池营造庭院绿荫，步行空间贯穿其间。植物品种、数量及种植尺寸为表现示意。',p:[0,2,1]},
{name:'主要商业界面',sub:'沿庭院展开 · 通透展示',lead:'商业界面沿下沉广场内侧展开，与庭院形成连续的互动。',text:'临庭院的一侧布置通透门面，室内活动与步行空间相连。',p:[9,2.7,-5]},
{name:'庭院外摆',sub:'桌椅停留 · 商业延伸',lead:'让商业活动从室内延伸到有树荫的庭院。',text:'桌椅与休憩座椅围绕花池布置，让用餐、交谈与步行在庭院中自然相融。家具数量及范围为示意。',p:[-10,1,1]},
{name:'上层平台',sub:'入口连接 · 俯瞰庭院',lead:'上层步行平台保留向下看见庭院、向内连接商业的空间关系。',text:'上层平台串联入口与沿街商业，也提供俯瞰庭院的视角，让上下层空间保持视觉联系。',p:[-21,6.5,0]}
];
function choose(i) {
  if (i === 6 && !contextMode) setContext(true);
  selected = i;
  const node = nodes[i];
  $('detailTitle').textContent = node.name;
  $('detailLead').textContent = node.lead;
  $('detailText').textContent = node.text;
  document.querySelectorAll('[data-node]').forEach(button => {
    button.classList.toggle(button.classList.contains('hotspot') ? 'selected' : 'active', +button.dataset.node === i);
  });
  focusNode(i);
}
nodes.push(
{name:'周边铺位门面',sub:'庭院两侧 · 连续商业',lead:'沿庭院两侧展开的门面，将周边商业与广场相连。',text:'两侧门面围合庭院，形成连续的步行与消费界面。',p:[3,3,12]},
{name:'连廊入口',sub:'一楼连廊 · 负一层小餐',lead:'上层连廊串联庭院，连廊入口连接负一层餐饮空间。',text:'上层步行连廊串联庭院，入口连接下层公共空间。',p:[0,5,-4]}
);
nodes[1].text='层层台阶与休息平台连接下层庭院和中层退台，沿途展开的花池提供绿荫与停留空间。';
nodes.push({name:'退台打卡点',sub:'中层停留 · 俯瞰庭院',lead:'沿弧形退台漫步，在上下层之间停留，看见庭院的另一面。',text:'退台通过两端楼梯与上层连接，宽阔的平台可供观景、休憩和外摆，下方延续商业门面。',p:[20,4.6,4]});
nodes.forEach((n,i)=>{const b=document.createElement('button');b.className='node';b.dataset.node=i;b.innerHTML=`<span class="num">0${i+1}</span><span><strong>${["格栅顶棚","楼梯与平台","庭院绿化","商业界面","庭院外摆","上层平台","周边铺位","连廊入口","退台打卡点"][i]}</strong><small>${n.sub}</small></span>`;b.onclick=()=>choose(i);$('nodes').append(b);const pin=document.createElement('button');pin.className='hotspot';pin.dataset.node=i;pin.innerHTML=`<b>0${i+1}</b>${n.name}`;pin.onclick=()=>choose(i);$('pins').append(pin);n.el=pin;});
$('sources').onclick = () => $('sourceDialog').showModal();
let atmosphereTween=null,foliageTween=null;
let terraceWalkRoute=[];
let scene,camera,renderer,controls,roofGroup,greenGroup,ambient,sun,fill,lightMats=[],lamps=[],targetTween=null;
const {THREE:T,OrbitControls}=window.HomeVendor;
const mat=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.8,...extra});
const M={stone:mat('#c9c8b8'),edge:mat('#8a9383'),cream:mat('#dddccc'),dark:mat('#2b3933'),wood:mat('#a2784c'),soil:mat('#35422b'),leaf:mat('#4e7241'),leaf2:mat('#759052'),leaf3:mat('#93a765'),glass:mat('#a8bab3',{metalness:.1,roughness:.25,transparent:true,opacity:.64}),pave:null,bronze:mat('#746449'),chair:mat('#31585b'),light:mat('#fff3c9',{emissive:'#ffda91',emissiveIntensity:.15})};lightMats.push(M.light);
function mesh(geo,material,pos,parent=scene){const o=new T.Mesh(geo,material);if(pos)o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(x,y,z,w,h,d,m,parent=scene){return mesh(new T.BoxGeometry(w,h,d),m,[x,y,z],parent)}
function rod(a,b,r,m,parent=scene){const va=new T.Vector3(...a),vb=new T.Vector3(...b),delta=vb.clone().sub(va);const o=mesh(new T.CylinderGeometry(r,r,delta.length(),6),m,va.add(vb).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o}
function slab(poly,y,h,m,parent=scene){const s=new T.Shape();poly.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);return mesh(g,m,[0,y,0],parent)}
// Unitless scene geometry for the public walkthrough.
const outer = [[-25, 6], [-23, 10], [-18, 13], [-10, 15], [-3, 16],
  [4, 16], [10, 15], [16, 14], [21, 12], [25, 9], [28, 5], [29, 1]];
const inner = [[-25, -7], [-21, -10], [-15, -11], [-10, -12],
  [-6, -12], [-2, -13], [3, -13], [8, -12], [13, -11], [18, -9],
  [23, -7], [27, -4], [29, 1]];
const floor = [...outer, ...inner.slice(0, -1).reverse()];
const terraceEdge = [[7, 9], [10, 10], [14, 10.5], [18, 10], [22, 8.5], [25, 6.5]];
const terraceBack = [[7, 14], [11, 15], [16, 14], [21, 12.5], [24, 10], [26, 7]];
const upperLevel = 6;
const terraceLevel = 3;
function rail(points,y,parent=scene){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];rod([a[0],y+1.05,a[1]],[b[0],y+1.05,b[1]],.055,M.dark,parent);const l=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let j=0;j<=Math.ceil(l/.7);j++){const t=j/Math.ceil(l/.7),x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;rod([x,y,z],[x,y+1.05,z],.024,M.bronze,parent)}}}
function wallBetween(a,b,h,thick,m,y=0,parent=scene){const dx=b[0]-a[0],dz=b[1]-a[1],o=box((a[0]+b[0])/2,y+h/2,(a[1]+b[1])/2,Math.hypot(dx,dz),h,thick,m,parent);o.rotation.y=-Math.atan2(dz,dx);return o}
function label(text,pos,width=6){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.clearRect(0,0,768,128);ctx.fillStyle='#f3ead2';ctx.font='500 48px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,80);const tex=new T.CanvasTexture(c);const sp=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:true}));sp.position.set(...pos);sp.scale.set(width,width/6,1);scene.add(sp);return sp}
let seed=18;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function tree(x,z,y=0,r=1.6){const g=new T.Group();greenGroup.add(g);g.position.set(x,y,z);rod([0,0,0],[0,4.5,0],.11,M.wood,g);for(let i=0;i<7;i++){const a=i*2.4,rad=.9+rand()*.8,h=3+rand()*2;rod([0,1.6,0],[Math.cos(a)*rad,h,Math.sin(a)*rad],.05,M.wood,g);const o=mesh(new T.IcosahedronGeometry(r*(.55+rand()*.45),1),[M.leaf,M.leaf2,M.leaf3][i%3],[Math.cos(a)*rad,h,Math.sin(a)*rad],g);o.scale.y=.65}return g}
function planter(x,z,w,d,y=0,treeHere=false){box(x,y+.4,z,w,.8,d,M.cream);box(x,y+.83,z,w-.16,.12,d-.16,M.soil,greenGroup);for(let i=0;i<Math.ceil(w*d*2);i++){const xx=x+(rand()-.5)*(w-.25),zz=z+(rand()-.5)*(d-.25);const o=mesh(new T.IcosahedronGeometry(.3+rand()*.2,0),i%3?M.leaf:M.leaf2,[xx,y+1,zz],greenGroup);o.scale.y=.7}if(treeHere)tree(x,z,y+.8,1.6);box(x,y+.55,z+d/2+.23,w,.12,.45,M.wood)}
function table(x,z){mesh(new T.CylinderGeometry(.56,.56,.09,20),M.wood,[x,.79,z]);rod([x,0,z],[x,.75,z],.05,M.dark);for(let j=0;j<3;j++){let a=j*Math.PI*2/3+.4,xx=x+Math.cos(a)*1,zz=z+Math.sin(a)*1;const g=new T.Group();g.position.set(xx,0,zz);g.rotation.y=-a;scene.add(g);box(0,.46,0,.42,.09,.44,M.chair,g);box(.17,.74,0,.08,.46,.44,M.chair,g);for(const k of [-1,1])for(const l of [-1,1])rod([k*.15,.43,l*.15],[k*.19,0,l*.19],.018,M.dark,g)}}
function oldPerson(x,z,color='#d8c6ab'){const m=mat(color);mesh(new T.SphereGeometry(.14,10,8),M.cream,[x,1.6,z]);mesh(new T.CylinderGeometry(.16,.19,.65,8),m,[x,1.1,z]);for(const a of [-.1,.1])rod([x+a,.8,z],[x+a,.07,z+.03],.055,M.dark);}
function steps(a,b,width,rise=upperLevel,count=36){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);for(let i=0;i<count;i++){let f=(i+.5)/count,h=(i+1)/count*rise;const o=box(a[0]+dx*f,h/2,a[1]+dz*f,len/count+.015,h,width,M.stone);o.rotation.y=angle;const ll=box(a[0]+dx*f,h+.015,a[1]+dz*f,.06,.025,width*.75,M.light);ll.rotation.y=angle}const nx=-dz/len*width/2,nz=dx/len*width/2;for(let s of [-1,1]){rod([a[0]+nx*s,1,a[1]+nz*s],[b[0]+nx*s,rise+1,b[1]+nz*s],.04,M.dark);for(let j=0;j<=9;j++){let f=j/9;rod([a[0]+dx*f+nx*s,rise*f,a[1]+dz*f+nz*s],[a[0]+dx*f+nx*s,rise*f+1,a[1]+dz*f+nz*s],.024,M.dark)}}}
function init(){scene=new T.Scene();scene.background=null;renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;$('scene').append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','下沉广场立体模型。拖动旋转，滚轮缩放；也可使用预设视角按钮。');camera=new T.PerspectiveCamera(38,1,.1,350);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI/2-.03;controls.minDistance=15;controls.maxDistance=220;controls.target.set(0,1,0);controls.addEventListener('start',()=>{targetTween=null;if(typeof endTour==='function'&&document.body.classList.contains('touring'))endTour(false)});
ambient=new T.HemisphereLight('#fff8e8','#879787',2.4);scene.add(ambient);sun=new T.DirectionalLight('#fff3db',3.2);sun.position.set(-18,45,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-48,right:48,top:38,bottom:-38,near:1,far:120});sun.shadow.normalBias=.05;scene.add(sun);fill=new T.DirectionalLight('#deebff',1);fill.position.set(30,20,-20);scene.add(fill);
roofGroup=new T.Group();greenGroup=new T.Group();scene.add(roofGroup,greenGroup);
const tc=document.createElement('canvas');tc.width=512;tc.height=512;const tx=tc.getContext('2d');tx.fillStyle='#c9c9bd';tx.fillRect(0,0,512,512);for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++){tx.fillStyle=['#c4c4b9','#ccccc1','#bdbeb3','#d1d0c5'][(xx*3+yy*5)%4];tx.fillRect(xx*64+(yy%2)*32,yy*64,62,62)}const texture=new T.CanvasTexture(tc);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(.19,.19);texture.colorSpace=T.SRGBColorSpace;M.pave=mat('#ffffff',{map:texture});
slab(floor,-.65,.65,M.pave);slab(floor,-1.05,.4,M.dark);

for(let i=0;i<inner.length-1;i++){if(i===4)continue;const a=inner[i],b=inner[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.6)continue;wallBetween(a,b,4.8,.3,M.glass);wallBetween(a,b,.8,.5,M.dark,4.1);wallBetween(a,b,.18,.58,M.wood,3.94);for(let j=0;j<=Math.ceil(l/1.7);j++){const t=j/Math.ceil(l/1.7),x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;box(x,2,z,.065,4,.065,M.bronze)}
const dx=b[0]-a[0],dz=b[1]-a[1],nx=dz/l*3,nz=-dx/l*3;const back=[[...a],[...b],[b[0]+nx,b[1]+nz],[a[0]+nx,a[1]+nz]];slab(back,4.9,1.1,M.cream);rail([a,b],upperLevel);for(let j=0;j<Math.floor(l/3);j++){let t=(j+.5)/Math.floor(l/3),x=a[0]+dx*t,z=a[1]+dz*t;const o=box(x+nx*.25,1.7,z+nz*.25,1.1,2,.12,M.light);o.rotation.y=-Math.atan2(dz,dx)}}
// Low cutaway outer edge reveals the sunken commercial level.
for(let i=0;i<outer.length-1;i++){wallBetween(outer[i],outer[i+1],.85,.3,M.cream);}
// One stair links to the upper level, the other passes through the terrace.
steps([-21, 4], [-21, -5], 3, upperLevel, 30);
const s2 = [4, 3], s0 = [7, 9];
const stairRoute = [];
const interp = t => [s2[0] + (s0[0] - s2[0]) * t, s2[1] + (s0[1] - s2[1]) * t];
for (let i = 0; i <= 2; i++) {
  const [x, z] = interp(i / 2);
  stairRoute.push([x, i * terraceLevel / 2, z]);
  if (i === 2) break;
  const group = new T.Group();
  scene.add(group);
  const previousScene = scene;
  scene = group;
  steps([x,z], interp((i + 1) / 2), 3, terraceLevel / 2, 9);
  scene = previousScene;
  group.position.y = i * terraceLevel / 2;
}
buildTerrace();
const upperPlatform = [[-25, -7], [-21, -10], [-16, -10], [-16, -4], [-25, -4]];
slab(upperPlatform, upperLevel - .35, .35, M.stone);
rail([upperPlatform[3], upperPlatform[4]], upperLevel);

// Top trellis bands follow commercial fronts; the courtyard centre stays open.
for(let i=0;i<inner.length-1;i++){if(i===4||i>10)continue;const a=inner[i],b=inner[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<1)continue;const nx=-dz/l*3.8,nz=dx/l*3.8;wallBetween(a,b,.2,.24,M.wood,5.65,roofGroup);wallBetween([a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],.2,.24,M.wood,5.65,roofGroup);const count=Math.ceil(l/2.3);for(let j=0;j<count;j++){const t=j/count,u=(j+1)/count,A=[a[0]+dx*t,5.75,a[1]+dz*t],B=[a[0]+dx*u,5.75,a[1]+dz*u],C=[A[0]+nx,5.75,A[2]+nz],D=[B[0]+nx,5.75,B[2]+nz];rod(A,C,.09,M.wood,roofGroup);rod(A,D,.06,M.wood,roofGroup);rod(B,C,.06,M.wood,roofGroup);for(let q=1;q<5;q++){let f=q/5;rod([A[0]+dx/count*f,5.75,A[2]+dz/count*f],[C[0]+dx/count*f,5.75,C[2]+dz/count*f],.025,M.wood,roofGroup)}}}
planter(-9,0,3.2,2.3,0,true);planter(1,1,4,2.5,0,true);planter(10,3,3.2,2.3,0,true);planter(-19,-1,2,2,0,true);planter(11,7,2.5,1.5,1.1,false);planter(10,8.9,2.7,1.5,2.1,true);
for(const [x,z] of [[-15,0],[-13,3],[-5,-1],[-4,3],[5,0],[8,-1],[16,2]])table(x,z);
buildWalkers(stairRoute);
for(const [x,z] of [[-12,1],[1,1],[10,3]]){let l=new T.PointLight('#ffd397',0,11,2);l.position.set(x,2.4,z);scene.add(l);lamps.push(l)}
label('庭院商街', [10, 4.5, -10], 6);
nodes[0].p = [-12, 6, -9];
nodes[1].p = [5.5, 2, 6];
nodes[2].p = [1, 2.5, 1];
nodes[3].p = [10, 3, -10];
nodes[4].p = [-13, 1, 3];
nodes[5].p = [-21, 6.8, -5];
buildContext();setSeason('summer');new ResizeObserver(resize).observe($('scene'));resize();view('overview',false);animate();}
function resize(){if(!renderer)return;const r=$('scene').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
function view(key,smooth=true){let mobile=innerWidth<720;let fit=mobile?Math.max(1,1.4/camera.aspect):1;const map={overview:{p:[(contextMode?38:29)*fit,(contextMode?50:41)*fit,(contextMode?68:54)*fit],t:[2,4.5,0]},front:{p:[3,14*fit,47*fit],t:[-2,2,0]},shops:{p:[21*fit,10*fit,28*fit],t:[8,2,-6]},terrace:{p:[32*fit,23*fit,-28*fit],t:[19,3.6,0]},top:{p:[0,90*fit,.3],t:[0,0,0]}};const v=map[key];document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===key));if(!camera)return;if(smooth)targetTween={start:performance.now(),a:camera.position.clone(),b:new T.Vector3(...v.p),ta:controls.target.clone(),tb:new T.Vector3(...v.t)};else{camera.position.set(...v.p);controls.target.set(...v.t);controls.update()}}
function animate(now=0){requestAnimationFrame(animate);const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;if(flowing)flowTime+=dt;updateWalkers();if(targetTween){let t=Math.min((performance.now()-targetTween.start)/(targetTween.duration||1400),1);t=t*t*(3-2*t);camera.position.lerpVectors(targetTween.a,targetTween.b,t);controls.target.lerpVectors(targetTween.ta,targetTween.tb,t);if(t>=1)targetTween=null}updateAtmosphere();controls.update();renderer.render(scene,camera);const r=$('scene').getBoundingClientRect();nodes.forEach(n=>{const v=new T.Vector3(...n.p).project(camera);n.el.style.left=(v.x*.5+.5)*r.width+'px';n.el.style.top=(-v.y*.5+.5)*r.height+'px';n.el.style.display=$('hotspots').checked&&v.z<1&&Math.abs(v.x)<.95&&Math.abs(v.y)<.9?'block':'none'})}
function lighting(value){night=value;document.body.classList.toggle('night',night);$('day').classList.toggle('active',!night);$('night').classList.toggle('active',night);if(ambient){ambient.intensity=night?.7:2.4;sun.intensity=night?.2:3.2;fill.intensity=night?.4:1;M.glass.color.set(night?'#b9a985':'#a8bab3');M.glass.emissive.set(night?'#8a6f36':'#000000');M.glass.emissiveIntensity=night?.35:0;M.light.emissiveIntensity=night?2:.15;lamps.forEach(l=>l.intensity=night?25:0);renderer.toneMappingExposure=night?1.15:1.3;sun.color.set(season==='autumn'?'#ffe0ad':season==='winter'?'#e3eeff':'#fff3db')}}
$('day').onclick=()=>lighting(false);$('night').onclick=()=>lighting(true);$('roof').onchange=e=>{if(roofGroup)roofGroup.visible=e.target.checked};$('green').onchange=e=>{if(greenGroup)greenGroup.visible=e.target.checked};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('reset').onclick=()=>view('overview');
$('contextMode').onclick=()=>setContext(true);
$('modelMode').onclick=()=>setContext(false);
$('flow').onchange=e=>{flowing=e.target.checked};
document.querySelectorAll('button[data-season]').forEach(b=>b.onclick=()=>setSeason(b.dataset.season));
window.prototypeState=()=>({contextMode,season,flowing,walkers:walkers.map(w=>w.group.position.toArray()),night,selected,roof:roofGroup?.visible,green:greenGroup?.visible,rendered:!!renderer,meshes:scene?.children.length});

function setContext(value){contextMode=value;contextGroup.visible=value;$('contextMode').classList.toggle('active',value);$('modelMode').classList.toggle('active',!value);$('contextInfo').hidden=!value;view('overview')}
function sign(text,a,b,y=3.7,parent=scene,color='#244d40'){
const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1024,160);ctx.fillStyle='#fff9e7';ctx.textAlign='center';ctx.font='600 72px sans-serif';ctx.fillText(text,512,108);
const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const l=Math.hypot(b[0]-a[0],b[1]-a[1]);const o=mesh(new T.PlaneGeometry(Math.min(l*.88,10),.95),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),[(a[0]+b[0])/2-(b[1]-a[1])/l*.22*(parent===contextGroup?-1:1),y,(a[1]+b[1])/2+(b[0]-a[0])/l*.22*(parent===contextGroup?-1:1)],parent);o.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);return o;
}
function storefront(a,b,text,parent=scene){
wallBetween(a,b,3.65,.18,M.glass,0,parent);wallBetween(a,b,1,.28,M.dark,3.65,parent);
const l=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let k=0;k<=Math.ceil(l/1.6);k++){const t=k/Math.ceil(l/1.6);box(a[0]+(b[0]-a[0])*t,1.8,a[1]+(b[1]-a[1])*t,.06,3.6,.06,M.bronze,parent)}
sign(text,a,b,4.12,parent);rail([a,b],upperLevel,parent);
}
function buildContext(){
contextGroup=new T.Group();scene.add(contextGroup);contextGroup.visible=false;
seasonGroup=new T.Group();greenGroup.add(seasonGroup);
const edges=[
[outer[1],outer[3],'西侧门面'],[outer[3],outer[5],'庭院侧门面'],
];
edges.forEach(([a,b,name])=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*4,nz=dx/l*4;
slab([a,b,[b[0]+nx,b[1]+nz],[a[0]+nx,a[1]+nz]],-.3,.3,M.stone,contextGroup);
storefront(a,b,name,contextGroup);wallBetween([a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],3.7,.18,M.cream,0,contextGroup);
});
const te=terraceEdge;
for(let i=0;i<te.length-1;i++){const a=te[i],b=te[i+1];wallBetween(a,b,2.9,.16,M.glass,0,contextGroup);wallBetween(a,b,.4,.22,M.dark,2.9,contextGroup);box(a[0],1.45,a[1],.055,2.9,.055,M.bronze,contextGroup);}
sign('退台下方',te[4],te[2],3.08,contextGroup);
storefront(inner[0],inner[1],'西侧入口');
const a=inner[4],b=inner[5];storefront(a,b,'连廊入口');
const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),n=[-dz/l*2.4,dx/l*2.4];
slab([a,b,[b[0]+n[0],b[1]+n[1]],[a[0]+n[0],a[1]+n[1]]],upperLevel - .35,.35,M.stone);rail([[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]]],upperLevel);
nodes[7].p=[(a[0]+b[0])/2,5,(a[1]+b[1])/2];
sign('咖啡',inner[2],inner[4],4.5);
sign('餐饮',inner[8],inner[10],4.5,scene);
sign('茶饮',te[3],te.at(-1),3.08,contextGroup);
nodes[6].p=[(outer[9][0]+outer[11][0])/2,3,(outer[9][1]+outer[11][1])/2];
for(let i=0;i<36;i++){const o=mesh(new T.IcosahedronGeometry(.14,0),mat('#efbdd0'),[-9+(rand()-.5)*2,1.12,(rand()-.5)*1.8],seasonGroup);o.userData.flower=true;}
}
function setSeason(key){season=key;document.body.dataset.season=key;const colors={spring:['#739557','#a8b879','#c3cb88'],summer:['#4e7241','#759052','#93a765'],autumn:['#956344','#c48a43','#dcb667'],winter:['#68766b','#899285','#bac0b2']}[key];[M.leaf,M.leaf2,M.leaf3].forEach((m,i)=>m.color.set(colors[i]));if(seasonGroup)seasonGroup.visible=key==='spring';document.querySelectorAll('button[data-season]').forEach(b=>b.classList.toggle('active',b.dataset.season===key));$('seasonText').textContent={spring:'春 · 嫩叶与花色',summer:'夏 · 浓荫庭院',autumn:'秋 · 金棕叶色',winter:'冬 · 清冷常绿'}[key]+'｜季节与人流为展示示意';if(sun&&!night)sun.color.set(key==='autumn'?'#ffe0ad':key==='winter'?'#e3eeff':'#fff3db')}
function person(color){
const group=new T.Group();scene.add(group);const skin=mat('#d4b798'),cloth=mat(color);
mesh(new T.SphereGeometry(.15,10,8),skin,[0,1.62,0],group);mesh(new T.CylinderGeometry(.19,.16,.65,8),cloth,[0,1.14,0],group);
const limbs=[];for(let i=0;i<4;i++){const pivot=new T.Group();pivot.position.set(i<2?(i? .12:-.12):(i===2?-.25:.25),i<2?.83:1.4,0);group.add(pivot);rod([0,0,0],[0,i<2?-.72:-.55,0],i<2?.065:.05,i<2?M.dark:cloth,pivot);limbs.push(pivot)}
return {group,limbs};
}
function buildWalkers(stairRoute){
const routes=[
[[-23,0,-6],[-18,0,-5],[-12,0,-5],[-3,0,-5],[6,0,-5],[13,0,-6],[21,0,-9]],
[[-14,0,-2],[-10,0,-3],[-6,0,-3],[0,0,-3],[7,0,-4],[16,0,-6]],
stairRoute,terraceWalkRoute];
routes.forEach((route,r)=>{for(let i=0;i<(r===2?3:5);i++){const w=person(['#8b6650','#396359','#c2a36f','#66778a'][i%4]);w.route=route.map(p=>new T.Vector3(...p));w.lengths=[0];for(let j=1;j<route.length;j++)w.lengths.push(w.lengths[j-1]+w.route[j].distanceTo(w.route[j-1]));w.total=w.lengths.at(-1);w.offset=i*.19;w.speed=r===2?.55:.75;walkers.push(w)}});
}
function updateWalkers(){for(const w of walkers){const cycle=(flowTime*w.speed/w.total+w.offset)%2,back=cycle>1,u=back?2-cycle:cycle,d=u*w.total;let j=1;while(j<w.lengths.length-1&&w.lengths[j]<d)j++;const t=(d-w.lengths[j-1])/(w.lengths[j]-w.lengths[j-1]);w.group.position.lerpVectors(w.route[j-1],w.route[j],t);const delta=w.route[j].clone().sub(w.route[j-1]);w.group.rotation.y=Math.atan2(delta.x,delta.z)+(back?Math.PI:0);const swing=Math.sin(flowTime*7+w.offset*20)*.42;w.limbs.forEach((limb,i)=>limb.rotation.x=swing*(i%2?1:-1));}}

function buildTerrace() {
  const deck = [...terraceEdge, ...terraceBack.slice().reverse()];
  slab(deck, terraceLevel - .25, .25, M.stone);
  rail(terraceEdge, terraceLevel);
  const [a, b] = [terraceBack[0], terraceBack.at(-1)];
  for (const [start, end] of [[a, [1, 15]], [b, [28, 3]]]) {
    const group = new T.Group();
    scene.add(group);
    const previousScene = scene;
    scene = group;
    steps(start, end, 2, upperLevel - terraceLevel, 16);
    scene = previousScene;
    group.position.y = terraceLevel;
  }
  const centers = [[11, 12], [16, 12], [21, 10]];
  for (const [x,z] of centers) {
    const group = new T.Group();
    scene.add(group);
    const previousScene = scene;
    scene = group;
    table(x,z);
    scene = previousScene;
    group.position.y = terraceLevel;
  }
  terraceWalkRoute = centers.map(([x,z]) => [x, terraceLevel, z]);
  nodes[8].p = [16, terraceLevel + 1, 12];
}

// Presentation controls share the existing model and do not alter source geometry.
let tourStep=0,tourTimer=null,tourPaused=false,tourWasNight=false;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const chapters=[
{title:'向下，<br>走进花园。',copy:'从城市界面，走进一座可以停留的庭院。',eyebrow:'01 / THE GARDEN',view:'overview'},
{title:'沿阶而下，<br>走近花园。',copy:'楼梯、绿荫与平台，把上下层连接成一段旅程。',eyebrow:'02 / THE JOURNEY',view:'front'},
{title:'停在半途，<br>看见更多。',copy:'退台连接庭院与城市。停留、交谈，也留下一个镜头。',eyebrow:'03 / THE TERRACE',view:'terrace'},
{title:'生活，<br>向外延伸。',copy:'商业与外摆沿庭院展开，让相遇发生在日常之间。',eyebrow:'04 / THE EVERYDAY',view:'shops'},
{title:'灯亮之后，<br>花园未眠。',copy:'让暖光接续日光，留住夜晚的片刻。',eyebrow:'05 / AFTER HOURS',view:'overview'}
];
function openDetails(){document.body.classList.add('drawer-open');$('detailPanel').inert=false;$('explore').setAttribute('aria-expanded','true');$('settingsPanel').hidden=true;$('settingsToggle').setAttribute('aria-expanded','false');}
function closeDetails(){document.body.classList.remove('drawer-open');$('detailPanel').inert=true;$('explore').setAttribute('aria-expanded','false');}
function focusNode(i){if(!camera)return;const n=nodes[i],p=new T.Vector3(...n.p);const direction=camera.position.clone().sub(controls.target).normalize();const distance=innerWidth<600?32:24;targetTween={start:performance.now(),duration:reduceMotion?1:1500,a:camera.position.clone(),b:p.clone().add(direction.multiplyScalar(distance)),ta:controls.target.clone(),tb:p};}
$('explore').onclick=()=>{endTour(false);document.body.classList.contains('drawer-open')?closeDetails():openDetails()};
$('closeDetails').onclick=()=>{closeDetails();$('explore').focus()};
$('settingsToggle').onclick=()=>{const open=$('settingsPanel').hidden;closeDetails();$('settingsPanel').hidden=!open;$('settingsToggle').setAttribute('aria-expanded',String(open));};
function setHero(c){const block=document.querySelector('.view-title');block.classList.remove('changing');$('heroTitle').innerHTML=c.title;$('heroCopy').textContent=c.copy;$('heroEyebrow').textContent=c.eyebrow;void block.offsetWidth;block.classList.add('changing');}
function scheduleTour(){clearTimeout(tourTimer);if(!tourPaused&&document.body.classList.contains('touring'))tourTimer=setTimeout(()=>{if(tourStep<chapters.length-1)showChapter(tourStep+1);else{tourPaused=true;$('tourPause').textContent='重播';}},6500);}
function showChapter(index){tourStep=Math.max(0,Math.min(4,index));const c=chapters[tourStep];setHero(c);$('tourCounter').textContent='0'+(tourStep+1)+' / 05';$('tourPrev').disabled=tourStep===0;$('tourNext').disabled=tourStep===4;lighting(tourStep===4);view(c.view,!reduceMotion);if(targetTween)targetTween.duration=reduceMotion?1:2400;scheduleTour();}
function endTour(reset=true){if(!document.body.classList.contains('touring'))return;clearTimeout(tourTimer);document.body.classList.remove('touring');$('tourBar').hidden=true;lighting(tourWasNight);setHero({title:'向下，<br>走进花园。',copy:'城市的热闹之下，留一处慢下来的地方。',eyebrow:'A GARDEN, ONE LEVEL BELOW.'});if(reset)view('overview');}
$('startTour').onclick=()=>{if(!camera)return;closeDetails();$('settingsPanel').hidden=true;$('settingsToggle').setAttribute('aria-expanded','false');tourWasNight=night;document.body.classList.add('touring');$('tourBar').hidden=false;tourPaused=reduceMotion;$('tourPause').textContent=tourPaused?'播放':'暂停';showChapter(0);};
$('tourNext').onclick=()=>showChapter(tourStep+1);$('tourPrev').onclick=()=>showChapter(tourStep-1);$('tourEnd').onclick=()=>endTour(false);
$('tourPause').onclick=()=>{if($('tourPause').textContent==='重播'){tourPaused=false;$('tourPause').textContent='暂停';showChapter(0);return;}tourPaused=!tourPaused;$('tourPause').textContent=tourPaused?'播放':'暂停';scheduleTour();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDetails();$('settingsPanel').hidden=true;$('settingsToggle').setAttribute('aria-expanded','false');endTour(false);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&document.body.classList.contains('touring')){tourPaused=true;$('tourPause').textContent='播放';clearTimeout(tourTimer)}});
if(reduceMotion){flowing=false;$('flow').checked=false;}

function updateAtmosphere(){
 if(atmosphereTween){const v=atmosphereTween,t=Math.min(1,(performance.now()-v.start)/1100),u=t*t*(3-2*t);v.values.forEach(([obj,key,a,b])=>obj[key]=a+(b-a)*u);v.colors.forEach(([obj,a,b])=>obj.copy(a).lerp(b,u));if(t===1)atmosphereTween=null;}
 if(foliageTween){const v=foliageTween,t=Math.min(1,(performance.now()-v.start)/1000);v.items.forEach(([m,a,b])=>m.color.copy(a).lerp(b,t));if(t===1)foliageTween=null;}
}
try{init()}catch(e){console.error(e);$('fallback').style.display='block';$('startTour').disabled=true}
const instantLighting=lighting;lighting=function(value){if(!ambient || !sun || !fill){instantLighting(value);return;}const props=[[ambient,'intensity'],[sun,'intensity'],[fill,'intensity'],[renderer,'toneMappingExposure'],[M.light,'emissiveIntensity'],[M.glass,'emissiveIntensity'],...lamps.map(l=>[l,'intensity'])];const before=props.map(([o,k])=>o[k]);const colors=[M.glass.color,M.glass.emissive,sun.color],old=colors.map(c=>c.clone());instantLighting(value);if(reduceMotion)return;atmosphereTween={start:performance.now(),values:props.map(([o,k],i)=>{const b=o[k];o[k]=before[i];return[o,k,before[i],b]}),colors:colors.map((c,i)=>{const b=c.clone();c.copy(old[i]);return[c,old[i],b]})};};
const instantSeason=setSeason;setSeason=function(key){const mats=[M.leaf,M.leaf2,M.leaf3],before=mats.map(m=>m.color.clone());instantSeason(key);if(!reduceMotion)foliageTween={start:performance.now(),items:mats.map((m,i)=>{const b=m.color.clone();m.color.copy(before[i]);return[m,before[i],b]})};};
