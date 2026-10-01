import { ConsoleModulePage } from '@/components/console/module-page';

export const dynamic = 'force-dynamic';

export default async function ConsoleModule() {
  return <ConsoleModulePage module="couriers" />;
}
