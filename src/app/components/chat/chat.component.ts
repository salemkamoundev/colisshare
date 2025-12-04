import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat.component.html',
  // styleUrls supprimé ✅
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() conversationId!: string;
  @Input() currentUserId!: string;

  messages: ChatMessage[] = [];
  draft = '';
  sending = false;
  private subscription?: Subscription;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    if (!this.conversationId || !this.currentUserId) {
      console.error('❌ conversationId ou currentUserId manquant !');
      return;
    }

    // Écouter les messages en temps réel
    this.subscription = this.chatService
      .getMessages(this.conversationId)
      .subscribe({
        next: (msgs: ChatMessage[]) => {
          this.messages = msgs;
          console.log('💬 Messages reçus:', msgs.length);
        },
        error: (err: any) => {
          console.error('❌ Erreur chat:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async sendMessage(): Promise<void> {
    const text = this.draft.trim();
    if (!text || this.sending) return;

    this.sending = true;
    try {
      await this.chatService.sendMessage(
        this.conversationId,
        this.currentUserId,
        text
      );
      this.draft = '';
      console.log('✅ Message envoyé');
    } catch (error: any) {
      console.error('❌ Erreur envoi:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.sending = false;
    }
  }

  trackByMsgId(index: number, msg: ChatMessage): string {
    return msg.id || `msg-${index}`;
  }
}
