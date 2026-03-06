import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

let cachedUserId: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

function extractUserId(principal: any): string | null {
  if (!principal) return null;
  // Prefer explicit userId (production SWA)
  if (principal.userId) return principal.userId;
  // Fallback: derive from claims (SWA CLI with real AAD)
  const claims: { typ: string; val: string }[] = principal.claims || [];
  // Try 'oid' (AAD object ID), then 'sub', then 'name'
  for (const typ of ['http://schemas.microsoft.com/identity/claims/objectidentifier', 'oid', 'sub']) {
    const claim = claims.find(c => c.typ === typ);
    if (claim?.val) return claim.val;
  }
  // Last resort: use name as identifier
  const name = claims.find(c => c.typ === 'name');
  if (name?.val) return name.val;
  return null;
}

function fetchUserId(): Promise<string | null> {
  if (!fetchPromise) {
    fetchPromise = fetch('/.auth/me')
      .then(r => r.json())
      .then(data => {
        const id = extractUserId(data?.clientPrincipal);
        cachedUserId = id;
        return id;
      })
      .catch(() => null);
  }
  return fetchPromise;
}

// Eagerly fetch on module load
fetchUserId();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  if (cachedUserId) {
    return next(req.clone({
      setHeaders: { 'x-app-user-id': cachedUserId }
    }));
  }

  // Wait for the userId fetch to complete before sending the request
  return from(fetchUserId()).pipe(
    switchMap(userId => {
      if (userId) {
        return next(req.clone({
          setHeaders: { 'x-app-user-id': userId }
        }));
      }
      return next(req);
    })
  );
};
