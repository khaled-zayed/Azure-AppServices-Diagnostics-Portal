import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenInvalidComponent } from './tokeninvalid.component';

describe('TokenInvalidComponent', () => {
  let component: TokenInvalidComponent;
  let fixture: ComponentFixture<TokenInvalidComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TokenInvalidComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenInvalidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
