import { branding } from '@/lib/branding'

export default function Loading() {
  return <div className="page-loading">{branding.loadingLabel}</div>
}
