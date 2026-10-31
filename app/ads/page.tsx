import { createClient } from '@supabase/supabase-js';

type Product={id:string;name:string;price_krw:number;duration_days:number;placement:string};
const descriptions:Record<string,string>={region_basic:'지역 검색 결과 내 광고 영역 (노출 위치 및 재고 확정 전)',region_premium:'지역 상단 광고 영역 (노출 위치 및 재고 확정 전)',home_special:'홈페이지 특별 광고 영역 (노출 위치 및 재고 확정 전)'};
export const metadata={title:'광고 상품 안내 | 온쉼'};
export default async function Ads(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 let products:Product[]=[];
 let errorMessage='';
 if(url&&key){
   const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data,error}=await sb.from('ad_products').select('id,name,price_krw,duration_days,placement').eq('is_active',true).order('price_krw');
   products=data??[];if(error)errorMessage='광고 상품 정보를 불러오지 못했습니다.';
 }else errorMessage='서비스 설정이 아직 완료되지 않았습니다.';
 return <section className="ads-page"><div className="ads-intro"><span className="eyebrow">ONS WIM · BUSINESS</span><h1>업소 광고 안내</h1><p>지역에서 업소를 찾는 고객에게 더 잘 보일 수 있도록 광고 상품을 준비하고 있습니다.</p><p className="notice">현재 광고 상품은 <strong>출시 전 안내용</strong>입니다. 온라인 결제, 광고 신청 및 자동 노출은 아직 활성화되지 않았습니다.</p></div>{errorMessage&&<p role="status">{errorMessage}</p>}<div className="ad-plans">{products.map(product=><article className="card ad-plan" key={product.id}><p className="eyebrow">{product.duration_days}일 기준 · 예정 상품</p><h2>{product.name}</h2><p className="ad-price">{product.price_krw.toLocaleString('ko-KR')}원 <small>/ {product.duration_days}일</small></p><p className="muted">{descriptions[product.placement]??'광고 위치 협의 예정'}</p><button type="button" className="btn" disabled aria-disabled="true">신청 준비 중</button></article>)}</div><section className="card" style={{marginTop:24}}><h2>광고 운영 원칙</h2><p>광고는 일반 검색 결과와 구분해 ‘광고’로 표시하며, 심사 완료 업소만 광고를 집행할 수 있습니다. 실제 광고 위치, 광고 수량, 세금 포함 여부, 환불 기준과 결제 연동은 정식 출시 전에 확정합니다.</p><a className="btn secondary" href="/owner">업주센터로 이동</a></section></section>;
}
