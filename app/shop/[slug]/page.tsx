import ReportShop from '@/app/components/ReportShop';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getPublicSupabase} from '@/lib/supabase-public';
export const dynamic='force-dynamic';
export default async function Shop({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const sb=getPublicSupabase();const {data,error}=await sb.from('shops').select('id,name,address,phone,description,status').eq('slug',slug).eq('status','approved').maybeSingle();if(error||!data)notFound();
 const [services,images]=await Promise.all([sb.from('shop_services').select('id,name,price_krw,duration_minutes').eq('shop_id',data.id).order('price_krw'),sb.from('shop_images').select('id,storage_path').eq('shop_id',data.id).order('sort_order')]);
 const signed=await Promise.all((images.data??[]).slice(0,12).map(async item=>({id:item.id,url:(await sb.storage.from('shop-gallery').createSignedUrl(item.storage_path,600)).data?.signedUrl??null})));
 return <section><p><Link href="/">홈</Link> / 업소 상세</p><article className="card"><h1>{data.name}</h1><p>{data.description||'등록된 소개가 없습니다.'}</p>{signed.some(x=>x.url)&&<div className="photo-grid">{signed.filter(x=>x.url).map(x=><img key={x.id} src={x.url!} alt={`${data.name} 업소 사진`} loading="lazy"/>)}</div>}<h2>서비스 · 가격</h2>{services.data?.length?<div className="price-list">{services.data.map(s=><div key={s.id} className="price-item"><span>{s.name} {s.duration_minutes?`(${s.duration_minutes}분)`:''}</span><strong>{s.price_krw.toLocaleString('ko-KR')}원</strong></div>)}</div>:<p className="muted">등록된 서비스 가격표가 없습니다.</p>}<h2>업소 정보</h2><p><strong>주소</strong> {data.address}</p><p><strong>전화</strong> {data.phone}</p>{data.phone&&<a className="btn" href={`tel:${data.phone.replace(/[^+\d]/g,'')}`}>전화 문의</a>}<p className="muted">업소 정보는 운영자 심사를 거쳐 게시됩니다. 서비스 이용 전 관련 자격·영업 범위를 확인하세요.</p><ReportShop shopId={data.id}/></article></section>;
}
