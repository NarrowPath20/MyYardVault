export function initVaultScene(api) {
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---------------- THREE.JS VAULT ---------------- */
(function(){
  const canvas=document.getElementById('vault-canvas');
  if(!window.THREE){document.getElementById('heroFallback').style.opacity=1;return;}
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'}); }
  catch(err){ document.getElementById('heroFallback').style.opacity=1; return; }
  renderer.setClearColor(0x000000,0);
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.06;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const maxAniso=renderer.capabilities.getMaxAnisotropy();

  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0x0a070e, 11, 60);
  const camera=new THREE.PerspectiveCamera(40,1,0.1,200);

  function envTex(){
    const c=document.createElement('canvas'); c.width=512; c.height=256; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,256);
    g.addColorStop(0,'#241636'); g.addColorStop(.42,'#0c0913'); g.addColorStop(.5,'#05040a');
    g.addColorStop(.62,'#160d22'); g.addColorStop(1,'#3a2418');
    x.fillStyle=g; x.fillRect(0,0,512,256);
    const rg=x.createRadialGradient(360,70,10,360,70,170); rg.addColorStop(0,'rgba(181,116,236,.9)'); rg.addColorStop(1,'rgba(181,116,236,0)');
    x.fillStyle=rg; x.fillRect(0,0,512,256);
    const rg2=x.createRadialGradient(120,90,8,120,90,120); rg2.addColorStop(0,'rgba(255,235,210,.5)'); rg2.addColorStop(1,'rgba(255,235,210,0)');
    x.fillStyle=rg2; x.fillRect(0,0,512,256);
    const t=new THREE.CanvasTexture(c); t.mapping=THREE.EquirectangularReflectionMapping; t.encoding=THREE.sRGBEncoding;
    return t;
  }
  const ENV=envTex();

  const hemi=new THREE.HemisphereLight(0x6a4a8a,0x140a10,0.55); scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffffff,1.15); key.position.set(-5,8,6); scene.add(key);
  const rim=new THREE.PointLight(0xb574ec,1.5,34); scene.add(rim);
  const fill=new THREE.PointLight(0x9fd0ff,0.5,34); scene.add(fill);
  const warm=new THREE.PointLight(0xc66a3c,0.45,30); scene.add(warm);

  const frameMat=new THREE.MeshStandardMaterial({color:0xd7dde3,metalness:0.92,roughness:0.3,envMap:ENV,envMapIntensity:1.2});
  const floorMat=new THREE.MeshStandardMaterial({color:0x141318,metalness:0.2,roughness:0.85});
  const darkMat =new THREE.MeshStandardMaterial({color:0x0c0c0e,metalness:0.5,roughness:0.5});
  const galvMat =new THREE.MeshStandardMaterial({color:0xc9ced4,metalness:0.95,roughness:0.28,envMap:ENV,envMapIntensity:1.3});

  const L=3.4,W=2.5,H=2.5,T=0.06;
  function ribbed(w,h,mat,doors){
    const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,T),mat));
    const ribW=0.05, ribD=0.05, gap=0.18; const n=Math.floor(w/gap);
    for(let i=0;i<=n;i++){ const xx=-w/2+i*gap; if(xx>w/2-0.02) continue;
      const r=new THREE.Mesh(new THREE.BoxGeometry(ribW,h*0.97,ribD),mat);
      r.position.set(xx,0,T/2+ribD/2-0.005); g.add(r); }
    const railT=new THREE.Mesh(new THREE.BoxGeometry(w+0.04,0.1,T+0.13),frameMat); railT.position.set(0,h/2-0.02,0.02); g.add(railT);
    const railB=new THREE.Mesh(new THREE.BoxGeometry(w+0.04,0.09,T+0.13),frameMat); railB.position.set(0,-h/2+0.02,0.02); g.add(railB);
    if(doors){
      for(const sx of [-1,1]) for(const sy of [-1,1]){
        const hg=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.12,0.04),galvMat);
        hg.position.set(sx*(w*0.30),sy*(h*0.30),T/2+ribD+0.02); g.add(hg); }
      for(const sy of [-1,1]){
        const latch=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.13,0.05),darkMat);
        latch.position.set(0,sy*(h*0.16),T/2+ribD+0.03); g.add(latch); }
      const seam=new THREE.Mesh(new THREE.BoxGeometry(0.03,h*0.9,0.02),darkMat);
      seam.position.set(0,0,T/2+ribD+0.01); g.add(seam);
    }
    return g;
  }
  function shadowTex(){
    const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    const rg=x.createRadialGradient(128,128,10,128,128,128); rg.addColorStop(0,'rgba(0,0,0,.55)'); rg.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=rg; x.fillRect(0,0,256,256); return new THREE.CanvasTexture(c);
  }
  const SHADOW=shadowTex();

  function makeVault(bodyMat){
    const g=new THREE.Group(); const parts=[];
    function addPart(mesh,assembled,exploded,delay){ mesh.userData={assembled:assembled.clone(),exploded:exploded.clone(),delay}; mesh.position.copy(assembled); g.add(mesh); parts.push(mesh); }
    const floorG=new THREE.Group();
    floorG.add(new THREE.Mesh(new THREE.BoxGeometry(L,T,W),floorMat));
    const fr1=new THREE.Mesh(new THREE.BoxGeometry(L+0.05,0.1,0.1),frameMat); fr1.position.z=W/2; floorG.add(fr1);
    const fr2=fr1.clone(); fr2.position.z=-W/2; floorG.add(fr2);
    const fr3=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,W),frameMat); fr3.position.x=L/2; floorG.add(fr3);
    const fr4=fr3.clone(); fr4.position.x=-L/2; floorG.add(fr4);
    addPart(floorG,new THREE.Vector3(0,T/2,0),new THREE.Vector3(0,-2.4,0),0);
    const wallF=ribbed(L,H,bodyMat,true); addPart(wallF,new THREE.Vector3(0,H/2+T,W/2),new THREE.Vector3(0,H/2+T,W/2+3.6),0.55);
    const wallB=ribbed(L,H,bodyMat,false); wallB.rotation.y=Math.PI; addPart(wallB,new THREE.Vector3(0,H/2+T,-W/2),new THREE.Vector3(0,H/2+T,-W/2-3.6),0.5);
    const endR=ribbed(W,H,bodyMat,false); endR.rotation.y=Math.PI/2; addPart(endR,new THREE.Vector3(L/2,H/2+T,0),new THREE.Vector3(L/2+3.2,H/2+T,0),0.3);
    const endL=ribbed(W,H,bodyMat,false); endL.rotation.y=-Math.PI/2; addPart(endL,new THREE.Vector3(-L/2,H/2+T,0),new THREE.Vector3(-L/2-3.2,H/2+T,0),0.3);
    for(const sx of [-1,1]) for(const sz of [-1,1]){
      const p=new THREE.Mesh(new THREE.BoxGeometry(0.1,H,0.1),frameMat);
      addPart(p,new THREE.Vector3(sx*L/2,H/2+T,sz*W/2),new THREE.Vector3(sx*L/2,H/2+T-2.2,sz*W/2),0.15); }
    const roofG=new THREE.Group();
    roofG.add(new THREE.Mesh(new THREE.BoxGeometry(L+0.18,0.1,W+0.18),frameMat));
    const lip=new THREE.Mesh(new THREE.BoxGeometry(L+0.22,0.06,W+0.22),darkMat); lip.position.y=0.06; roofG.add(lip);
    addPart(roofG,new THREE.Vector3(0,H+T+0.05,0),new THREE.Vector3(0,H+T+3,0),0.85);
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(L*2.0,W*2.3), new THREE.MeshBasicMaterial({map:SHADOW,transparent:true,depthWrite:false,opacity:0.9,fog:false}));
    sh.rotation.x=-Math.PI/2; sh.position.y=0.012; g.add(sh);
    return {group:g, parts};
  }

  /* the digital showroom: a row of vaults along the aisle */
  const EXH=[
    {x:0,  c:0xc4cad1, m:0.95, r:0.32, hero:true},
    {x:8,  c:0x6a2b8c, m:0.62, r:0.45},
    {x:16, c:0xa2302a, m:0.64, r:0.44},
    {x:24, c:0x15487c, m:0.64, r:0.44},
    {x:32, c:0x163f33, m:0.60, r:0.46},
    {x:40, c:0x4b4e53, m:0.72, r:0.46}
  ];
  const MOBILE=innerWidth<760;
  const exhibits=MOBILE?EXH.slice(0,4):EXH;
  const TRAVEL=exhibits[exhibits.length-1].x;
  let heroParts=null, heroBodyMat=null, heroGroup=null;
  const showroom=new THREE.Group();
  exhibits.forEach((e,i)=>{
    const bodyMat=new THREE.MeshStandardMaterial({color:e.c,metalness:e.m,roughness:e.r,envMap:ENV,envMapIntensity:1.1});
    const v=makeVault(bodyMat); v.group.position.x=e.x;
    v.group.userData.spin=(0.0011+i*0.00025)*((i%2)?-1:1);
    v.group.userData.phase=i*1.4;
    v.group.userData.spinAngle=0;
    showroom.add(v.group);
    if(e.hero){ heroParts=v.parts; heroBodyMat=bodyMat; heroGroup=v.group; }
  });
  scene.add(showroom);

  /* grid floor down the aisle (fog fades the far end into the void) */
  function gridTex(){
    const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    x.clearRect(0,0,128,128); x.strokeStyle='rgba(168,118,216,0.85)'; x.lineWidth=2;
    x.beginPath(); x.moveTo(0,0); x.lineTo(128,0); x.moveTo(0,0); x.lineTo(0,128); x.stroke();
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=maxAniso; return t;
  }
  const gt=gridTex(); const GW=TRAVEL+96, GD=120;
  gt.repeat.set(GW,GD);
  const grid=new THREE.Mesh(new THREE.PlaneGeometry(GW,GD),
    new THREE.MeshBasicMaterial({map:gt,transparent:true,opacity:0.42,depthWrite:false,fog:true}));
  grid.rotation.x=-Math.PI/2; grid.position.set(TRAVEL/2,0.004,0); scene.add(grid);

  /* particles spanning the aisle */
  const pcount=MOBILE?120:300;
  const pg=new THREE.BufferGeometry(); const pos=new Float32Array(pcount*3);
  for(let i=0;i<pcount;i++){ pos[i*3]=-8+Math.random()*(TRAVEL+16); pos[i*3+1]=Math.random()*7; pos[i*3+2]=(Math.random()-.5)*16; }
  pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const points=new THREE.Points(pg,new THREE.PointsMaterial({color:0xb574ec,size:0.035,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  scene.add(points);

  /* ---- BACKYARD SCENE (golden hour, realistic) : "see it in your yard" ---- */
  let mode='showroom', blend=0, backyardX=0;
  const backyard=new THREE.Group(); backyard.visible=false;

  // ---------- textures (canvas) : real materials, not clay ----------
  function desertTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    x.fillStyle='#b39a74'; x.fillRect(0,0,128,128);
    for(let i=0;i<2800;i++){ const v=150+(Math.random()*70|0); x.fillStyle='rgba('+v+','+((v-24)|0)+','+((v-62)|0)+','+(0.4+Math.random()*0.5)+')'; const sz=1+Math.random()*2.6; x.fillRect(Math.random()*128,Math.random()*128,sz,sz); }
    for(let i=0;i<360;i++){ x.fillStyle='rgba(58,42,24,'+(0.18+Math.random()*0.24)+')'; x.fillRect(Math.random()*128,Math.random()*128,2,2); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
  function turfTex(){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    x.fillStyle='#4b6a38'; x.fillRect(0,0,256,256);
    for(let i=0;i<256;i+=22){ x.fillStyle=((i/22|0)&1)?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.06)'; x.fillRect(0,i,256,22); }
    for(let i=0;i<3600;i++){ const v=48+(Math.random()*56|0); x.fillStyle='rgba('+((v*0.5)|0)+','+v+','+((v*0.38)|0)+','+(0.3+Math.random()*0.4)+')'; x.fillRect(Math.random()*256,Math.random()*256,1.5,1.5); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
  function paverTex(){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    x.fillStyle='#7d6f58'; x.fillRect(0,0,256,256);
    const n=4, gap=7, sz=(256-gap*(n+1))/n;
    for(let r=0;r<n;r++)for(let col=0;col<n;col++){ const px=gap+col*(sz+gap), py=gap+r*(sz+gap);
      const base=186+(((r+col)&1)?-16:10); x.fillStyle='rgb('+base+','+((base-16)|0)+','+((base-44)|0)+')'; x.fillRect(px,py,sz,sz);
      for(let k=0;k<170;k++){ const v=base-22+(Math.random()*44|0); x.fillStyle='rgba('+v+','+((v-16)|0)+','+((v-44)|0)+','+(0.3+Math.random()*0.4)+')'; x.fillRect(px+Math.random()*sz,py+Math.random()*sz,2,2); } }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
  function blockTex(){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    x.fillStyle='#7c7360'; x.fillRect(0,0,256,256);
    const bw=64, bh=32;
    for(let row=0; row*bh<256; row++){ const off=(row&1)?bw/2:0;
      for(let bx=-bw; bx<256+bw; bx+=bw){ const px=bx+off+2, py=row*bh+2, w=bw-4, h=bh-4;
        const base=180+((Math.random()*24-12)|0); x.fillStyle='rgb('+base+','+((base-14)|0)+','+((base-40)|0)+')'; x.fillRect(px,py,w,h);
        for(let k=0;k<90;k++){ const v=base-20+(Math.random()*40|0); x.fillStyle='rgba('+v+','+((v-14)|0)+','+((v-40)|0)+','+(0.35+Math.random()*0.4)+')'; x.fillRect(px+Math.random()*w,py+Math.random()*h,2,2); } }
    }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }

  // ---------- ground plane : desert ----------
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(280,280),new THREE.MeshStandardMaterial({map:(function(){const t=desertTex();t.repeat.set(30,30);return t;})(),roughness:1,metalness:0})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; backyard.add(ground);

  // paver patio (vault sits here)
  const patio=new THREE.Mesh(new THREE.PlaneGeometry(10,8),new THREE.MeshStandardMaterial({map:(function(){const t=paverTex();t.repeat.set(4,3);return t;})(),roughness:0.9,metalness:0})); patio.rotation.x=-Math.PI/2; patio.position.set(0,0.03,-1); patio.receiveShadow=true; backyard.add(patio);
  // artificial turf rectangle in front, bordered by pavers/gravel
  const turf=new THREE.Mesh(new THREE.PlaneGeometry(12,4.6),new THREE.MeshStandardMaterial({map:(function(){const t=turfTex();t.repeat.set(5,2);return t;})(),roughness:1,metalness:0})); turf.rotation.x=-Math.PI/2; turf.position.set(0,0.02,5.4); turf.receiveShadow=true; backyard.add(turf);
  // gravel planting bed along the wall
  const bed=new THREE.Mesh(new THREE.PlaneGeometry(26,1.6),new THREE.MeshStandardMaterial({map:(function(){const t=desertTex();t.repeat.set(20,1.4);return t;})(),roughness:1,metalness:0})); bed.rotation.x=-Math.PI/2; bed.position.set(0,0.025,-4.9); bed.receiveShadow=true; backyard.add(bed);

  // ---------- CMU block privacy walls ----------
  const capMat=new THREE.MeshStandardMaterial({color:0x9a8f78,roughness:1,metalness:0});
  function wall(w,cx,cz,rotY){ const g=new THREE.Group();
    const map=blockTex(); map.repeat.set(Math.max(2,Math.round(w/1.6)),2);
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,2.25,0.3),new THREE.MeshStandardMaterial({map:map,roughness:1,metalness:0}));
    body.position.y=1.125; body.castShadow=true; body.receiveShadow=true; g.add(body);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w+0.12,0.14,0.44),capMat); cap.position.y=2.3; cap.castShadow=true; g.add(cap);
    g.position.set(cx,0,cz); g.rotation.y=rotY; return g; }
  backyard.add(wall(26,0,-5.6,0));            // back wall
  backyard.add(wall(11,-9.3,-0.5,Math.PI/2)); // left return wall

  // ---------- desert plants ----------
  function agave(x,z,sc){ const g=new THREE.Group(); const m=new THREE.MeshStandardMaterial({color:0x6f8f5c,roughness:1});
    const n=11; for(let i=0;i<n;i++){ const bl=new THREE.Mesh(new THREE.ConeGeometry(0.06*sc,0.95*sc,4),m); const a=i/n*Math.PI*2;
      bl.position.set(Math.cos(a)*0.13*sc,0.44*sc,Math.sin(a)*0.13*sc); bl.rotation.z=Math.cos(a)*0.55; bl.rotation.x=Math.sin(a)*0.55; bl.castShadow=true; g.add(bl); }
    g.position.set(x,0,z); return g; }
  function dshrub(x,z,sc){ const g=new THREE.Group(); const m=new THREE.MeshStandardMaterial({color:0x5f7a45,roughness:1});
    for(let i=0;i<4;i++){ const b=new THREE.Mesh(new THREE.SphereGeometry((0.34+Math.random()*0.16)*sc,7,6),m); b.position.set((Math.random()-.5)*0.7*sc,0.3*sc+Math.random()*0.2*sc,(Math.random()-.5)*0.5*sc); b.castShadow=true; g.add(b); }
    g.position.set(x,0,z); return g; }
  backyard.add(agave(-7.5,-4.8,1.1)); backyard.add(dshrub(-5.4,-4.9,1.2)); backyard.add(agave(-3.2,-4.9,0.85));
  backyard.add(dshrub(3.4,-4.9,1.1)); backyard.add(agave(6,-4.8,1.0)); backyard.add(dshrub(8,-4.9,1.2));
  backyard.add(agave(-9.2,1.5,0.9)); backyard.add(dshrub(-9.1,3.4,1.0));

  // desert trees peeking over the wall
  function swTree(x,z,sc){ const g=new THREE.Group();
    const tk=new THREE.Mesh(new THREE.CylinderGeometry(0.1*sc,0.16*sc,1.9*sc,6),new THREE.MeshStandardMaterial({color:0x4a3a28,roughness:1})); tk.position.y=0.95*sc; g.add(tk);
    const greens=[0x5c6e40,0x6f814d,0x4e5f36];
    for(let i=0;i<7;i++){ const b=new THREE.Mesh(new THREE.SphereGeometry((0.72-i*0.03)*sc,8,7),new THREE.MeshStandardMaterial({color:greens[i%3],roughness:1}));
      b.position.set((Math.random()-.5)*1.05*sc,1.85*sc+i*0.3*sc,(Math.random()-.5)*1.05*sc); g.add(b); }
    g.position.set(x,0,z); return g; }
  backyard.add(swTree(-6,-8.5,1.6)); backyard.add(swTree(7.5,-9.5,1.25)); backyard.add(swTree(0.5,-10.5,1.4)); backyard.add(swTree(-12,-9,1.15));

  // ---------- the vault on the patio, wearing the chosen finish ----------
  const yardVault=makeVault(heroBodyMat); yardVault.group.position.y=0.05; backyard.add(yardVault.group);
  yardVault.group.traverse(o=>{ if(o.isMesh){ if(o.material && o.material.map===SHADOW){ o.visible=false; } else { o.castShadow=true; } } });

  // ---------- string lights strung across the patio ----------
  const bulbMat=new THREE.MeshBasicMaterial({color:0xffd28a,fog:false});
  const A=new THREE.Vector3(-9,2.55,-5.2), B=new THREE.Vector3(8.5,2.95,-0.6), sag=1.15, lpts=[], N=24;
  for(let i=0;i<=N;i++){ const t=i/N; const p=new THREE.Vector3().lerpVectors(A,B,t); p.y-=Math.sin(Math.PI*t)*sag; lpts.push(p);
    if(i%2===0){ const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,8),bulbMat); bulb.position.copy(p); backyard.add(bulb); } }
  backyard.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lpts),new THREE.LineBasicMaterial({color:0x1c1a15})));
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,2.95,8),new THREE.MeshStandardMaterial({color:0x2a2622,roughness:1})); post.position.set(8.5,1.47,-0.6); post.castShadow=true; backyard.add(post);

  // ---------- dusk sky + sun glow + clouds ----------
  function skyTex(){ const c=document.createElement('canvas'); c.width=16; c.height=256; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,256);
    g.addColorStop(0,'#243456'); g.addColorStop(0.42,'#475174'); g.addColorStop(0.6,'#8a6f7e'); g.addColorStop(0.76,'#d68a5a'); g.addColorStop(0.9,'#e79a54'); g.addColorStop(1,'#c56a34');
    x.fillStyle=g; x.fillRect(0,0,16,256); return new THREE.CanvasTexture(c); }
  const sky=new THREE.Mesh(new THREE.SphereGeometry(180,28,18),new THREE.MeshBasicMaterial({map:skyTex(),side:THREE.BackSide,fog:false,depthWrite:false})); backyard.add(sky);
  function glowTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,236,204,1)'); g.addColorStop(0.24,'rgba(255,180,110,0.7)'); g.addColorStop(1,'rgba(255,150,90,0)');
    x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
  const sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); sunSprite.scale.set(48,48,1); sunSprite.position.set(15,3.5,-44); backyard.add(sunSprite);
  function cloudTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    for(let i=0;i<20;i++){ const cx=26+Math.random()*76, cy=44+Math.random()*40, r=14+Math.random()*26;
      const g=x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,'rgba(255,224,196,0.9)'); g.addColorStop(1,'rgba(255,224,196,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); }
    return new THREE.CanvasTexture(c); }
  const cloudMat=new THREE.SpriteMaterial({map:cloudTex(),transparent:true,opacity:0.6,depthWrite:false,fog:false});
  [[-44,28,-64,38],[24,32,-66,44],[54,26,-58,32],[-10,35,-72,50]].forEach(p=>{ const cl=new THREE.Sprite(cloudMat.clone()); cl.scale.set(p[3],p[3]*0.5,1); cl.position.set(p[0],p[1],p[2]); backyard.add(cl); });

  scene.add(backyard);

  // ---------- dusk lighting ----------
  const sun=new THREE.DirectionalLight(0xff9a4d,0.0); sun.position.set(-9,3.4,6); sun.castShadow=true;
  sun.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);
  sun.shadow.camera.near=1; sun.shadow.camera.far=72; sun.shadow.camera.left=-20; sun.shadow.camera.right=20; sun.shadow.camera.top=20; sun.shadow.camera.bottom=-20;
  sun.shadow.bias=-0.0006; if(sun.shadow.radius!==undefined) sun.shadow.radius=3;
  scene.add(sun); scene.add(sun.target);
  const skyFill=new THREE.HemisphereLight(0x5a6a95,0x3a2c1c,0.0); scene.add(skyFill);
  const amb=new THREE.AmbientLight(0xffd9b0,0.0); scene.add(amb);
  const bulbA=new THREE.PointLight(0xffca7a,0,16,2); bulbA.position.set(-3,2.4,-2.2); scene.add(bulbA);
  const bulbB=new THREE.PointLight(0xffca7a,0,16,2); bulbB.position.set(4.5,2.6,-1.2); scene.add(bulbB);
  const FOG_DARK=new THREE.Color(0x0a070e), FOG_HAZE=new THREE.Color(0x6a6270);

  api.setScene=function(m){ if(m!=='backyard'&&m!=='showroom') return; if(m===mode) return; if(m==='backyard'){ backyardX=0; backyard.position.x=0; } mode=m; };
  /* storage leads with real photography, not the 3D yard */

  /* color control (hero exhibit) */
  const steelTarget={col:new THREE.Color(0xc4cad1),metal:0.95,rough:0.32};
  api.setVaultColor=function(s){ steelTarget.col.set(s.hex); steelTarget.metal=s.metal; steelTarget.rough=s.rough; };

  const ease=t=>1-Math.pow(1-t,3);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ASM_WIN=0.55, ASM_MAXD=Math.max.apply(null,heroParts.map(p=>p.userData.delay)), ASM_TL=ASM_MAXD+ASM_WIN;
  function applyAssembly(a){ const st=a*ASM_TL; for(const p of heroParts){ const lt=clamp((st-p.userData.delay)/ASM_WIN,0,1); p.position.lerpVectors(p.userData.exploded,p.userData.assembled,ease(lt)); } }

  let loadAnim=true, aStart=performance.now(), aDur=4400, asm=0;
  if(REDUCED){ loadAnim=false; asm=1; applyAssembly(1); }
  document.getElementById('replayBuild').addEventListener('click',(e)=>{ e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); loadAnim=true; aStart=performance.now(); });

  const cV=new THREE.Color(0xb574ec), cW=new THREE.Color(0xc66a3c), rimCol=new THREE.Color(0xb574ec);

  let mx=0,my=0,tmx=0,tmy=0;
  if(!REDUCED && matchMedia('(hover:hover) and (pointer:fine)').matches){
    addEventListener('pointermove',e=>{
      if(e.pointerType !== 'mouse') return;
      tmx=clamp(e.clientX/innerWidth-.5,-.5,.5);
      tmy=clamp(e.clientY/innerHeight-.5,-.5,.5);
    },{passive:true});
    const resetRotation=()=>{tmx=0;tmy=0;};
    document.documentElement.addEventListener('pointerleave',resetRotation);
    addEventListener('blur',resetRotation);
  }

  let paused=false;
  document.addEventListener('visibilitychange',()=>{paused=document.hidden; if(!paused) requestAnimationFrame(loop);});

  function resize(){ renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth<700?1.6:2)); renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize',resize); resize();

  let camX=0, previousFrame=0;
  const _sp=new THREE.Vector3(),_bp=new THREE.Vector3(),_st=new THREE.Vector3(),_bt=new THREE.Vector3(),_camTgt=new THREE.Vector3();
  function loop(now){
    requestAnimationFrame(loop);
    if(paused) return;
    const frameScale=previousFrame ? Math.min((now-previousFrame)/16.667,3) : 1;
    previousFrame=now;
    const vh=innerHeight, docH=document.documentElement.scrollHeight;
    const sp=clamp(scrollY/Math.max(1,docH-vh),0,1);
    // hero exhibit assembles on load
    if(loadAnim){ asm=clamp((now-aStart)/aDur,0,1); if(now-aStart>aDur+250) loadAnim=false; }
    else asm=1;
    applyAssembly(asm);
    heroBodyMat.color.lerp(steelTarget.col,0.08);
    heroBodyMat.metalness+=(steelTarget.metal-heroBodyMat.metalness)*0.08;
    heroBodyMat.roughness+=(steelTarget.rough-heroBodyMat.roughness)*0.08;
    // ---- scene-mode blend (showroom <-> backyard) ----
    const f=camera.aspect<1?1+(1-camera.aspect)*0.85:1;
    blend += (((mode==='backyard')?1:0)-blend)*0.08;
    const inBack=blend>0.5;
    grid.visible=!inBack; points.visible=!inBack; showroom.visible=!inBack; backyard.visible=inBack;
    const sb=1-blend;
    hemi.intensity=0.55*sb; key.intensity=1.15*sb; rim.intensity=1.5*sb; fill.intensity=0.5*sb; warm.intensity=0.45*sb;
    sun.intensity=1.35*blend; skyFill.intensity=0.42*blend; amb.intensity=0.26*blend; sun.castShadow=blend>0.05; bulbA.intensity=0.75*blend; bulbB.intensity=0.65*blend;
    if(scene.fog) scene.fog.color.copy(FOG_DARK).lerp(FOG_HAZE, blend);
    mx+=(tmx-mx)*0.05; my+=(tmy-my)*0.05;
    if(!inBack){
      showroom.children.forEach(g=>{
        if(!REDUCED && !(g===heroGroup && loadAnim)) g.userData.spinAngle+=g.userData.spin*frameScale;
        g.rotation.y=g.userData.spinAngle+(REDUCED?0:mx*0.35);
        g.rotation.x=REDUCED?0:my*0.08;
        g.position.y=REDUCED?0:Math.sin(now*0.0006+g.userData.phase)*0.04;
      });
      const warmW=Math.max(0,1-Math.abs(sp-0.66)/0.16);
      rimCol.copy(cV).lerp(cW,warmW*0.85); rim.color.lerp(rimCol,0.05);
      camX += (sp*TRAVEL - camX)*0.07;
      rim.position.set(camX+6,3,-5); fill.position.set(camX-6,2,5); warm.position.set(camX+3,1,7);
      const arr=points.geometry.attributes.position.array;
      for(let i=0;i<pcount;i++){ arr[i*3+1]+=0.004; if(arr[i*3+1]>7.5) arr[i*3+1]=-0.5; }
      points.geometry.attributes.position.needsUpdate=true;
    } else { warm.position.set(backyardX+3,1.4,6); }
    yardVault.group.rotation.y=REDUCED?0:mx*0.25;
    _sp.set(camX + 4.6*f, 2.7, 5.4*f); _st.set(camX, 1.5, 0);
    _bp.set(backyardX + 6.6*f, 2.0, 7.6*f); _bt.set(backyardX + 0.4, 1.0, 0);
    camera.position.lerpVectors(_sp,_bp,blend); _camTgt.lerpVectors(_st,_bt,blend);
    camera.lookAt(_camTgt);
    renderer.render(scene,camera);
  }
  requestAnimationFrame(loop);
})();


}
