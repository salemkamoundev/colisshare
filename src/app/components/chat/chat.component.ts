import { Component, OnInit, OnDestroy, Input, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() conversationId!: string;
  @Input() currentUserId!: string;
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  draft = '';
  sending = false;
  private subscription?: Subscription;
  private shouldScroll = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    if (!this.conversationId || !this.currentUserId) return;

    this.subscription = this.chatService.getMessages(this.conversationId).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.shouldScroll = true;
        // Marquer comme lu
        this.chatService.markAsRead(this.conversationId, this.currentUserId, msgs);
      },
      error: (err) => console.error(err),
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async sendMessage(): Promise<void> {
    const text = this.draft.trim();
    if (!text || this.sending) return;

    this.sending = true;
    try {
      await this.chatService.sendMessage(this.conversationId, this.currentUserId, text);
      this.draft = '';
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      this.sending = false;
    }
  }

  trackByMsgId(index: number, msg: ChatMessage): string {
    return msg.id || `msg-${index}`;
  }
}
