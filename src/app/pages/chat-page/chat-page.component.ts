import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  imports: [CommonModule],
})
export class ChatPageComponent {
  // Quand tu brancheras <app-chat>, tu pourras exposer ici :
  // selectedConversationId = 'demo-conversation';
  // currentUserId = 'demo-user';
}
