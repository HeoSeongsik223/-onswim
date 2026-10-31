'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { regions } from '@/lib/regions';
import type { User } from '@supabase/supabase-js';

type Shop = { id:string; name:string; status:string; created_at:string; address:string|null };
type ServiceRow = {id:string;shop_id:string;name:string;price_krw:number;duration_minutes:number|null};
type GalleryRow = {id:string;shop_id:string;storage_path:string};
type DocumentRow = { id:string; shop_id:string; document_type:string; review_status:string; storage_path:string };
const statuses:Record<string,string> = {draft:'작성 중',pending_review:'심사 대기',approved:'승인',rejected:'반려',suspended:'게시 중단'};

export default function Owner() {
  const [user,setUser]=useState<User|null>(null);
  const [loading,setLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [shops,setShops]=useState<Shop[]>([]);
  const [documents,setDocuments]=useState<DocumentRow[]>([]);
  const [services,setServices]=useState<ServiceRow[]>([]);
  const [gallery,setGallery]=useState<GalleryRow[]>([]);
  const [serviceName,setServiceName]=useState<Record<string,string>>({});
  const [servicePrice,setServicePrice]=useState<Record<string,string>>({});
  const [serviceDuration,setServiceDuration]=useState<Record<string,string>>({});
  const [uploading,setUploading]=useState<string|null>(null);
  const [name,setName]=useState('');
  const [region,setRegion]=useState('chungbuk');
  const [address,setAddress]=useState('');
  const [phone,setPhone]=useState('');
  const [description,setDescription]=useState('');
  const [busy,setBusy]=useState(false);

  const loadShops=useCallback(async(userId:string)=>{
    const supabase=getSupabase();
    const {data,error}=await supabase.from('shops').select('id,name,status,created_at,address').eq('owner_id',userId).order('created_at',{ascending:false});
    if(error)setMessage(error.message);
    else setShops(data ?? []);
    const docs=await supabase.from('shop_documents').select('id,shop_id,document_type,review_status,storage_path');
    if(!docs.error)setDocuments(docs.data??[]);
    const srv=await supabase.from('shop_services').select('id,shop_id,name,price_krw,duration_minutes');
    if(!srv.error)setServices(srv.data??[]);
    const imgs=await supabase.from('shop_images').select('id,shop_id,storage_path');
    if(!imgs.error)setGallery(imgs.data??[]);
  },[]);
  useEffect(()=>{
    const supabase=getSupabase();
    supabase.auth.getUser().then(({data})=>{setUser(data.user);setLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(user)void loadShops(user.id);else setShops([]);},[user,loadShops]);

  async function authenticate(mode:'login'|'signup') {
    setBusy(true);setMessage('');
    const supabase=getSupabase();
    const result=mode==='login'
      ?await supabase.auth.signInWithPassword({email,password})
      :await supabase.auth.signUp({email,password});
    setBusy(false);
    if(result.error){setMessage(result.error.message);return;}
    setMessage(mode==='signup'&&!result.data.session?'가입 확인 메일을 발송했습니다. 이메일 인증 후 로그인해 주세요.':'로그인되었습니다.');
  }
  async function createShop(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!user)return;
    setBusy(true);setMessage('');
    const supabase=getSupabase();
    const {data:regionRow,error:regionError}=await supabase.from('regions').select('id').eq('slug',region).is('parent_id',null).single();
    if(regionError||!regionRow){setMessage('지역 정보를 불러오지 못했습니다.');setBusy(false);return;}
    const slug=`shop-${crypto.randomUUID()}`;
    const {error}=await supabase.from('shops').insert({owner_id:user.id,region_id:regionRow.id,name:name.trim(),slug,address:address.trim(),phone:phone.trim(),description:description.trim(),status:'draft'});
    if(error)setMessage(`등록 실패: ${error.message}`);
    else {setMessage('업소 정보가 임시 저장되었습니다. 심사 신청 버튼을 눌러 제출해 주세요.');setName('');setAddress('');setPhone('');setDescription('');await loadShops(user.id);}
    setBusy(false);
  }
  async function submitShop(shop:Shop){
    if(!user)return;
    if(!documents.some(d=>d.shop_id===shop.id)){setMessage('심사 신청 전에 증빙서류를 한 건 이상 등록해 주세요.');return;}
    if(!confirm(`${shop.name} 업소를 심사 신청할까요?`))return;
    setBusy(true);setMessage('');
    const {error}=await getSupabase().from('shops').update({status:'pending_review'}).eq('id',shop.id).eq('status','draft');
    setMessage(error?`신청 실패: ${error.message}`:'심사 신청이 접수되었습니다. 운영자 승인 전에는 공개되지 않습니다.');
    await loadShops(user.id);setBusy(false);
  }
  async function uploadDocument(shop:Shop,file:File|null){
    if(!file||!user)return;
    if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){setMessage('PDF/JPG/PNG/WEBP 형식의 10MB 이하 파일만 업로드할 수 있습니다.');return;}
    setUploading(shop.id);setMessage('');
    const supabase=getSupabase();
    const ext=({ 'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'} as Record<string,string>)[file.type];
    const path=`${shop.id}/${user.id}/${crypto.randomUUID()}.${ext}`;
    const uploaded=await supabase.storage.from('shop-verification').upload(path,file,{contentType:file.type,upsert:false});
    if(uploaded.error){setMessage(`업로드 실패: ${uploaded.error.message}`);setUploading(null);return;}
    const saved=await supabase.from('shop_documents').insert({shop_id:shop.id,document_type:'영업 적법성 증빙',storage_path:path,review_status:'pending'});
    if(saved.error){await supabase.storage.from('shop-verification').remove([path]);setMessage(`서류 등록 실패: ${saved.error.message}`);}
    else {setMessage('서류가 비공개로 제출되었습니다.');await loadShops(user.id);}
    setUploading(null);
  }
  async function addService(shop:Shop){
    if(!user)return;
    const label=(serviceName[shop.id]??'').trim();const price=Number(servicePrice[shop.id]);const duration=Number(serviceDuration[shop.id]);
    if(!label||!Number.isInteger(price)||price<0||!Number.isInteger(duration)||duration<1){setMessage('서비스명, 0원 이상의 가격, 1분 이상의 소요시간을 입력해 주세요.');return;}
    setBusy(true);const {error}=await getSupabase().from('shop_services').insert({shop_id:shop.id,name:label,price_krw:price,duration_minutes:duration});
    setMessage(error?`서비스 등록 실패: ${error.message}`:'서비스가 저장되었습니다.');
    if(!error){setServiceName(v=>({...v,[shop.id]:''}));setServicePrice(v=>({...v,[shop.id]:''}));setServiceDuration(v=>({...v,[shop.id]:''}));await loadShops(user.id);}setBusy(false);
  }
  async function deleteService(id:string){if(!user)return;if(!confirm('이 서비스를 삭제할까요?'))return;const {error}=await getSupabase().from('shop_services').delete().eq('id',id);setMessage(error?error.message:'서비스가 삭제되었습니다.');await loadShops(user.id);}
  async function uploadGallery(shop:Shop,file:File|null){
    if(!file||!user)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setMessage('JPG, PNG, WEBP 이미지 5MB 이하만 등록할 수 있습니다.');return;}
    setUploading(shop.id);setMessage('');const sb=getSupabase();const ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
    const path=`${shop.id}/${user.id}/${crypto.randomUUID()}.${ext}`;
    const uploaded=await sb.storage.from('shop-gallery').upload(path,file,{contentType:file.type,upsert:false});
    if(uploaded.error){setMessage(uploaded.error.message);setUploading(null);return;}
    const saved=await sb.from('shop_images').insert({shop_id:shop.id,storage_path:path});
    if(saved.error){await sb.storage.from('shop-gallery').remove([path]);setMessage(saved.error.message);}else{setMessage('업소 사진을 등록했습니다. 승인 후 상세페이지에 표시됩니다.');await loadShops(user.id);}setUploading(null);
  }
  async function deleteGallery(item:GalleryRow){if(!user)return;if(!confirm('사진을 삭제할까요?'))return;const sb=getSupabase();const removed=await sb.from('shop_images').delete().eq('id',item.id);if(removed.error){setMessage(removed.error.message);return;}await sb.storage.from('shop-gallery').remove([item.storage_path]);setMessage('사진을 삭제했습니다.');await loadShops(user.id);}
  if(loading)return <p>로그인 상태를 확인하고 있습니다...</p>;
  return <section className="owner-section"><h1>온스윔 업주센터</h1><p className="muted">입점 신청 후 법적 자격 및 영업 요건을 확인합니다. 신청만으로 업소가 공개되지는 않습니다.</p>
    {!user?<div className="card"><h2>업주 회원가입 · 로그인</h2><label>이메일<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>비밀번호<input type="password" autoComplete="current-password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required /></label><div className="action-row"><button className="btn" disabled={busy||!email||password.length<6} onClick={()=>void authenticate('login')}>로그인</button><button className="btn secondary" disabled={busy||!email||password.length<6} onClick={()=>void authenticate('signup')}>회원가입</button></div><p className="muted">이메일 인증이 활성화된 경우 확인 메일을 먼저 인증해야 합니다.</p></div>:
    <><div className="card"><div className="action-row"><strong>{user.email}</strong><button className="btn secondary" onClick={()=>void getSupabase().auth.signOut()}>로그아웃</button></div></div>
    <h2>내 업소 신청 현황</h2><div className="grid">{shops.length===0?<div className="card">아직 등록한 업소가 없습니다.</div>:shops.map(shop=><div className="card" key={shop.id}><h3>{shop.name}</h3><p>{shop.address}</p><p><strong>상태: {statuses[shop.status]??shop.status}</strong></p><div className="document-area"><strong>서비스 · 가격표</strong><p className="muted">심사 신청 전 등록해 주세요. 승인 후 변경은 재심사 기능을 추가할 예정입니다.</p>{services.filter(v=>v.shop_id===shop.id).map(v=><div className="doc-row" key={v.id}>{v.name} · {v.price_krw.toLocaleString('ko-KR')}원 {v.duration_minutes?`· ${v.duration_minutes}분`:''} {shop.status==='draft'&&<button type="button" onClick={()=>void deleteService(v.id)}>삭제</button>}</div>)}{shop.status==='draft'&&<div className="form-stack"><input aria-label="서비스명" placeholder="서비스명" maxLength={100} value={serviceName[shop.id]??''} onChange={e=>setServiceName(v=>({...v,[shop.id]:e.target.value}))}/><input aria-label="가격" type="number" min="0" placeholder="가격(원)" value={servicePrice[shop.id]??''} onChange={e=>setServicePrice(v=>({...v,[shop.id]:e.target.value}))}/><input aria-label="소요시간" type="number" min="1" placeholder="소요시간(분)" value={serviceDuration[shop.id]??''} onChange={e=>setServiceDuration(v=>({...v,[shop.id]:e.target.value}))}/><button className="btn secondary" type="button" disabled={busy} onClick={()=>void addService(shop)}>서비스 추가</button></div>}</div><div className="document-area"><strong>업소 사진</strong><p>등록된 사진 {gallery.filter(v=>v.shop_id===shop.id).length}장</p>{gallery.filter(v=>v.shop_id===shop.id).map(v=><div className="doc-row" key={v.id}>사진 {v.id.slice(0,8)} {shop.status==='draft'&&<button type="button" onClick={()=>void deleteGallery(v)}>삭제</button>}</div>)}{shop.status==='draft'&&<input aria-label="업소 사진 업로드" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading===shop.id} onChange={e=>void uploadGallery(shop,e.target.files?.[0]??null)}/>}</div><div className="document-area"><strong>증빙서류</strong><p className="muted">사업자등록증과 업종별 필요한 자격·신고 서류를 제출해 주세요. 서류는 비공개입니다.</p><p>제출 {documents.filter(d=>d.shop_id===shop.id).length}건</p>{shop.status!=='approved'&&shop.status!=='suspended'&&<input aria-label={`${shop.name} 증빙서류 업로드`} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={uploading===shop.id} onChange={e=>void uploadDocument(shop,e.target.files?.[0]??null)}/>}</div>{shop.status==='draft'&&<button className="btn" disabled={busy} onClick={()=>void submitShop(shop)}>심사 신청</button>}</div>)}</div>
    <h2>새 업소 등록</h2><form className="card form-stack" onSubmit={e=>void createShop(e)}><label>업소명<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} /></label><label>시·도<select value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(([slug,label])=><option key={slug} value={slug}>{label}</option>)}</select></label><label>주소<input required maxLength={300} value={address} onChange={e=>setAddress(e.target.value)} /></label><label>연락처<input required maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} /></label><label>업소 소개<textarea maxLength={2000} rows={4} value={description} onChange={e=>setDescription(e.target.value)} /></label><p className="muted">사업자등록증 외에도 실제 영업 형태에 필요한 신고·자격·면허 등은 별도 확인합니다. 업소 등록 후 위의 업소 카드에서 증빙서류를 업로드할 수 있습니다.</p><button className="btn" disabled={busy}>임시 저장</button></form></>}
    {message&&<p role="status" className="notice">{message}</p>}
  </section>;
}
