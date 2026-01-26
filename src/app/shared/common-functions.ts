import { Router } from '@angular/router';

export function navigeteTo(url: string): void {
  const router = new Router();
  router.navigate([url]);
}
