import { TestBed } from '@angular/core/testing';

import { ChatbotIaService } from './chatbot-ia.service';

describe('ChatbotIaService', () => {
  let service: ChatbotIaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatbotIaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
