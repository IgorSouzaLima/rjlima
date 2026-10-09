import type { Metadata } from 'next';
import HomePage from '../components/home/HomePage';
import { pageMetadata } from '../lib/page-metadata';
import { HOME_TITLE, HOME_DESCRIPTION } from '../lib/seo.mjs';

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{
 const query=(await searchParams)??{};
 const preview=['comparar','visual','design'].some(key=>key in query);
 return pageMetadata(HOME_TITLE,HOME_DESCRIPTION,'/',preview);
}
export default function Home(){return <HomePage/>;}
