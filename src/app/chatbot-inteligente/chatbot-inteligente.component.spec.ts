import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatbotInteligenteComponent } from './chatbot-inteligente.component';

describe('ChatbotInteligenteComponent', () => {
  let component: ChatbotInteligenteComponent;
  let fixture: ComponentFixture<ChatbotInteligenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatbotInteligenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatbotInteligenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
