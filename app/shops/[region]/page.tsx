import Link from 'next/link';
import {regions} from '@/lib/regions';
import {getPublicSupabase} from '@/lib/supabase-public';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Region({params,searchParams}:{params:Promise<{region:string}>;searchParams:Promise<{q?:string}>}){
 const {region}=await params;const {q=''}=await searchParams;const found=regions.find(([slug])=>slug===region);if(!found)notFound();
 const sb=getPublicSupabase();const {data:regionRow}=await sb.from('regions').select('id').eq('slug',region).is('parent_id',null).maybeSingle();
 const keyword=q.trim().slice(0,60);
 let query=sb.from('shops').select('id,name,slug,address,description,phone').eq('region_id',regionRow?.id??-1).eq('status','approved').order('name').limit(100);
 if(keyword)query=query.or(`name.ilike.%${keyword.replace(/[%_,().]/g,'')}%,address.ilike.%${keyword.replace(/[%_,().]/g,'')}%`);
 const {data:shops,error}=await query;
 return <section><p><Link href="/">전체 지역</Link> / {found[1]}</p><h1>{found[1]} 웰니스·스파 업소</h1><p className="muted">승인된 업소만 표시됩니다. 시·군·구 또는 업소명으로 검색하세요.</p><form method="get" className="search-row"><input name="q" defaultValue={keyword} maxLength={60} placeholder="예: 강남구, 청주시, 업소명" aria-label="업소 또는 지역 검색"/><button className="btn" type="submit">검색</button></form>{error&&<p role="alert">업소 목록을 불러오지 못했습니다.</p>}<div className="grid">{shops?.map(shop=><Link href={`/shop/${shop.slug}`} className="card shop-card" key={shop.id}><h2>{shop.name}</h2><p>{shop.address}</p><p className="muted">{shop.description?.slice(0,110)}</p><strong>상세 보기 →</strong></Link>)}</div>{!shops?.length&&!error&&<div className="card">검색 조건에 맞는 승인 업소가 없습니다.</div>}</section>;
}
