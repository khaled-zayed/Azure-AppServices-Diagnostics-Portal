import { TestBed } from '@angular/core/testing';

import { LinkInterceptorService } from './link-interceptor.service';

describe('LinkInterceptorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LinkInterceptorService = TestBed.get(LinkInterceptorService);
    expect(service).toBeTruthy();
  });
});
