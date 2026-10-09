import { redirect } from 'next/navigation';
import { VARIANTES } from './variantes';

// /prototipos opens the first variant; the selector bar moves between them.
export default function PrototypesPage() {
  redirect(`/prototipos/${VARIANTES[0].slug}`);
}
