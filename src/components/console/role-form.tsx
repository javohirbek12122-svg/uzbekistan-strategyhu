'use client';

import { useActionState } from 'react';
import { setUserRole } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';

/** Grants a role to a user. Admin grants are still guarded by the DB allow-list. */
export function RoleForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(setUserRole, initialFormState);

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="user_id" value={userId} />
      <select name="role" className="input py-1 text-xs" defaultValue="courier">
        <option value="customer">Xaridor</option>
        <option value="courier">Kuryer</option>
        <option value="manager">Menejer</option>
        <option value="admin">Egasi</option>
      </select>
      <button type="submit" className="btn-secondary py-1 text-xs">
        Rol berish
      </button>
      {state?.ok === false && state.message && <span className="text-xs text-red-600">{state.message}</span>}
    </form>
  );
}
